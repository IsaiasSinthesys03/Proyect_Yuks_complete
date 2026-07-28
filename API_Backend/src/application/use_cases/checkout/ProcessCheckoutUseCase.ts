import { IOrderRepository } from '../../interfaces/IOrderRepository';
import { IProductRepository } from '../../interfaces/IProductRepository';
import { IWalletRepository } from '../../interfaces/IWalletRepository';
import { ICouponRepository } from '../../interfaces/ICouponRepository';
import { IRewardCodeRepository } from '../../interfaces/IRewardCodeRepository';
import { IAddressRepository } from '../../interfaces/IAddressRepository';
import { IPaymentGateway } from '../../interfaces/IPaymentGateway';
import { ILockService } from '../../interfaces/ILockService';
import { IIdempotencyService } from '../../interfaces/IIdempotencyService';
import { IQueueService } from '../../interfaces/IQueueService';
import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';
import { IUserRepository } from '../../interfaces/IUserRepository';

import { CheckoutRequestDTO, CheckoutResponseDTO } from '../../../domain/types/CheckoutDTOs';
import { SystemSettingsValues } from '../../../domain/types/SystemSettingsDTOs';
import { OrderStatus, DeliveryType } from '../../../domain/entities/Order';
import { OrderItem } from '../../../domain/entities/OrderItem';

import {
  IdempotencyConflictError,
  StockLockFailedError,
  OutOfStockError,
  MinPurchaseNotMetError,
  AddressNotFoundError,
  ShippingDestinationUnavailableError,
} from '../../../domain/errors/CheckoutErrors';
import { evaluateShippingCoverage } from '../../../domain/services/ShippingCoveragePolicy';
import {
  CouponNotFoundError,
  CouponExpiredError,
  CouponExhaustedError,
  CouponInactiveError,
  CouponMinNotMetError,
} from '../../../domain/errors/CouponErrors';
import { InsufficientFundsError, WalletExpiredError } from '../../../domain/errors/WalletErrors';

const STOCK_LOCK_TTL_SECONDS = 600; // 10 minutos (REQ-BE-01)
const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 horas (Q2)

interface ItemSnapshot {
  variantId: string;
  productName: string;
  variantSku: string;
  unitPrice: number;
  quantity: number;
  hasVirtualReward: boolean;
}

/**
 * Caso de Uso: Motor de Checkout (REQ-BE-01).
 *
 * El flujo transaccional más crítico del sistema. Orquesta idempotencia,
 * bloqueo pesimista de stock, validación de cupón/envío/mínimo de compra,
 * deducción de monedero y cobro a la pasarela de pago.
 *
 * LIMITACIÓN ARQUITECTÓNICA CONOCIDA: Los contratos de Fase 13 no exponen
 * un Unit of Work compartido entre repositorios (Order/Product/Wallet/Coupon
 * viven en conexiones de transacción independientes). `IOrderRepository.createOrder`
 * sí es atómico para order+items. Los pasos posteriores al commit (decremento
 * de stock, débito de monedero, incremento de cupón, generación de rewards)
 * se ejecutan secuencialmente; si alguno falla, se aplica una compensación
 * (Saga) marcando el pedido como CANCELLED en vez de un ROLLBACK SQL real.
 */
export class ProcessCheckoutUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly couponRepository: ICouponRepository,
    private readonly rewardCodeRepository: IRewardCodeRepository,
    private readonly addressRepository: IAddressRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly lockService: ILockService,
    private readonly idempotencyService: IIdempotencyService,
    private readonly queueService: IQueueService,
    private readonly systemSettingsRepository: ISystemSettingsRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async checkShippingCoverage(
    userId: string,
    addressId: string
  ): Promise<{ available: true }> {
    const [systemConfig, address] = await Promise.all([
      this.systemSettingsRepository.getCheckoutConfig(),
      this.addressRepository.findById(addressId, userId),
    ]);
    if (!address) throw new AddressNotFoundError(addressId);
    const coverage = evaluateShippingCoverage(address, systemConfig);
    if (!coverage.available) {
      throw new ShippingDestinationUnavailableError(coverage.message, coverage.reason);
    }
    return { available: true };
  }

  async execute(
    userId: string,
    idempotencyKey: string,
    clientIp: string,
    data: CheckoutRequestDTO
  ): Promise<CheckoutResponseDTO> {
    // BRECHA-16: leer la configuración logística DINÁMICAMENTE (caché Redis con
    // TTL corto). Un cambio de tarifas/umbrales en el CMS aplica sin reiniciar.
    const systemConfig = await this.systemSettingsRepository.getCheckoutConfig();

    // --- Paso 2: Validar dirección ---
    const address = await this.addressRepository.findById(data.addressId, userId);
    if (!address) {
      throw new AddressNotFoundError(data.addressId);
    }
    const coverage = evaluateShippingCoverage(address, systemConfig);
    if (!coverage.available) throw new ShippingDestinationUnavailableError(coverage.message, coverage.reason);

    // --- Paso 1: Idempotencia (Q2) ---
    // Se consulta/reserva solo cuando dirección y cobertura ya son válidas.
    // Así un destino rechazado tampoco depende de Redis y puede corregirse.
    const alreadyReserved = await this.idempotencyService.check(idempotencyKey);
    if (alreadyReserved) {
      const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
      if (existingOrder) {
        return this.toResponseDTO(existingOrder.id, existingOrder.status, existingOrder.totalPaid);
      }
      throw new IdempotencyConflictError(idempotencyKey);
    }
    await this.idempotencyService.set(idempotencyKey, IDEMPOTENCY_TTL_SECONDS);

    // --- Paso 3: Bloqueo pesimista de stock (Redis) ---
    const acquiredLockKeys: string[] = [];

    try {
      for (const item of data.items) {
        const lockKey = `stock-lock:${item.variantId}`;
        const acquired = await this.lockService.acquireLock(lockKey, STOCK_LOCK_TTL_SECONDS);

        if (!acquired) {
          throw new StockLockFailedError(item.variantId);
        }
        acquiredLockKeys.push(lockKey);
      }

      // --- Paso 4: Verificar stock real y calcular subtotal (snapshot congelado) ---
      const itemSnapshots: ItemSnapshot[] = [];
      let subtotal = 0;

      for (const item of data.items) {
        const variantInfo = await this.productRepository.findVariantWithProductById(item.variantId);

        if (!variantInfo) {
          throw new OutOfStockError(item.variantId, item.quantity, 0);
        }
        if (variantInfo.variant.stock < item.quantity) {
          throw new OutOfStockError(variantInfo.variant.sku, item.quantity, variantInfo.variant.stock);
        }

        subtotal += variantInfo.price * item.quantity;

        itemSnapshots.push({
          variantId: item.variantId,
          productName: variantInfo.productName,
          variantSku: variantInfo.variant.sku,
          unitPrice: variantInfo.price,
          quantity: item.quantity,
          hasVirtualReward: variantInfo.hasVirtualReward,
        });
      }

      // --- Paso 5: Aplicar cupón (Resolución #2) ---
      let discountAmount = 0;
      let couponId: string | null = null;

      if (data.couponCode) {
        const coupon = await this.couponRepository.findByCode(data.couponCode);

        if (!coupon) throw new CouponNotFoundError(data.couponCode);
        if (!coupon.isActive) throw new CouponInactiveError(data.couponCode);
        if (coupon.expiresAt.getTime() < Date.now()) throw new CouponExpiredError(data.couponCode);
        if (coupon.currentUses >= coupon.maxUses) throw new CouponExhaustedError(data.couponCode);
        if (coupon.minPurchaseAmount !== null && subtotal < coupon.minPurchaseAmount) {
          throw new CouponMinNotMetError(data.couponCode, subtotal, coupon.minPurchaseAmount);
        }

        discountAmount =
          coupon.discountType === 'PERCENTAGE'
            ? subtotal * (coupon.discountValue / 100)
            : Math.min(coupon.discountValue, subtotal);

        couponId = coupon.id;
      }

      const subtotalAfterDiscount = subtotal - discountAmount;

      // --- Paso 6: Calcular envío (REQ-BE-07 + Pase de Leyenda REQ-FE-14) ---
      // El umbral de envío gratis se REDUCE dinámicamente según el tier de
      // lealtad del usuario: un rango alto (GOLD/PLATINUM) obtiene envío gratis
      // con un subtotal menor. El multiplicador vive en system_settings.
      const deliveryType = this.resolveDeliveryType(address.state, address.municipality, systemConfig);
      const profile = await this.userRepository.findProfileByUserId(userId);
      const tier = profile?.tierLevel ?? 'BRONZE';
      const tierMultiplier = await this.systemSettingsRepository.getTierShippingMultiplier(tier);
      const effectiveFreeShippingThreshold = systemConfig.freeShippingThreshold * tierMultiplier;

      const shippingCost =
        subtotalAfterDiscount >= effectiveFreeShippingThreshold
          ? 0
          : deliveryType === 'LOCAL'
            ? systemConfig.localShippingCost
            : systemConfig.externalShippingCost;

      const totalBeforeWallet = subtotalAfterDiscount + shippingCost;

      // --- Paso 7: Validar mínimo de compra (Resolución #3) ---
      if (totalBeforeWallet < systemConfig.minPurchaseAmount) {
        throw new MinPurchaseNotMetError(totalBeforeWallet, systemConfig.minPurchaseAmount);
      }

      // --- Paso 8: Aplicar monedero ---
      let walletDeduction = 0;
      let walletId: string | null = null;
      const requestedWalletAmount = data.walletAmount ?? 0;

      if (requestedWalletAmount > 0) {
        const wallet = await this.walletRepository.getOrCreate(userId);

        if (wallet.expiresAt !== null && wallet.expiresAt.getTime() < Date.now()) {
          throw new WalletExpiredError(wallet.expiresAt);
        }
        if (requestedWalletAmount > wallet.balance) {
          throw new InsufficientFundsError(requestedWalletAmount, wallet.balance);
        }

        walletId = wallet.id;
        walletDeduction = Math.min(requestedWalletAmount, totalBeforeWallet);
      }

      const totalPaid = totalBeforeWallet - walletDeduction;

      // --- Paso 9: Cobrar pasarela de pago ---
      let stripeClientSecret: string | undefined;
      let stripePaymentIntentId: string | null = null;

      if (totalPaid > 0) {
        const intent = await this.paymentGateway.createPaymentIntent(totalPaid, 'mxn', {
          userId,
          idempotencyKey,
        });
        stripeClientSecret = intent.clientSecret;
        stripePaymentIntentId = intent.paymentIntentId;
      }

      const initialStatus: OrderStatus = totalPaid > 0 ? 'PAYMENT_PENDING' : 'PAID';

      // --- Paso 10: Commit SQL (atómico para order + order_items) ---
      const orderItemsData: Omit<OrderItem, 'id' | 'orderId'>[] = itemSnapshots.map((snapshot) => ({
        variantId: snapshot.variantId,
        productName: snapshot.productName,
        variantSku: snapshot.variantSku,
        unitPrice: snapshot.unitPrice,
        quantity: snapshot.quantity,
        hasVirtualReward: snapshot.hasVirtualReward,
      }));

      const order = await this.orderRepository.createOrder(
        {
          userId,
          status: initialStatus,
          subtotal,
          discountAmount,
          shippingCost,
          walletDeduction,
          totalPaid,
          deliveryType,
          shippingAddress: `${address.street} ${address.exteriorNumber}${address.interiorNumber ? ` Int. ${address.interiorNumber}` : ''}, ${address.neighborhood}`,
          postalCode: address.postalCode,
          municipality: address.municipality,
          state: address.state,
          termsVersion: data.termsVersion,
          clientIp,
          idempotencyKey,
          couponId,
          stripePaymentIntentId,
          driverName: null,
          driverVehicle: null,
          driverPhone: null,
          trackingCompany: null,
          trackingNumber: null,
        },
        orderItemsData
      );

      // --- Pasos posteriores al commit: decremento de stock, débito de monedero,
      //     incremento de cupón y generación de reward codes. ---
      try {
        // VULN-01: consumir el cupón PRIMERO, de forma atómica y condicional.
        // Si otra transacción concurrente lo agotó, `incrementUsage` devuelve
        // false y abortamos ANTES de decrementar stock — así la compensación
        // (cancelar la orden) no deja stock inconsistente.
        if (couponId) {
          const consumed = await this.couponRepository.incrementUsage(couponId);
          if (!consumed) {
            throw new CouponExhaustedError(data.couponCode ?? couponId);
          }
        }

        for (const item of data.items) {
          const decremented = await this.productRepository.decrementStock(item.variantId, item.quantity);
          if (!decremented) {
            throw new OutOfStockError(item.variantId, item.quantity, 0);
          }
        }

        if (walletDeduction > 0 && walletId) {
          await this.walletRepository.debit(walletId, walletDeduction, order.id, 'PURCHASE');
        }

        if (itemSnapshots.some((snapshot) => snapshot.hasVirtualReward)) {
          const detail = await this.orderRepository.findDetailById(order.id, userId);
          if (detail) {
            await this.rewardCodeRepository.createBatch(
              order.id,
              detail.items.map((item) => ({
                orderItemId: item.id,
                hasVirtualReward: item.hasVirtualReward,
                quantity: item.quantity,
              }))
            );
          }
        }
      } catch (postCommitError) {
        if (postCommitError instanceof OutOfStockError || postCommitError instanceof CouponExhaustedError) {
          // Fallo de REGLA DE NEGOCIO legítima (carrera final de stock real
          // agotado o cupón consumido por otra transacción): no tiene sentido
          // reintentar, se cancela definitivamente.
          await this.orderRepository.updateStatus(order.id, 'CANCELLED');
          throw postCommitError;
        }

        // Q4 (DLQ): cualquier OTRO fallo aquí ocurre DESPUÉS de que la orden
        // ya se persistió y (potencialmente) Stripe ya inició el cobro — es
        // un fallo de INFRAESTRUCTURA (timeout de DB, pérdida de conexión a
        // Redis, etc.), no de negocio. Cancelar perdería dinero ya cobrado.
        // Se marca para intervención y se encola para reintento automático.
        await this.orderRepository.updateStatus(order.id, 'NEEDS_RECONCILIATION');
        await this.queueService.enqueue('reconcile-checkout', { orderId: order.id });
        throw postCommitError;
      }

      return this.toResponseDTO(order.id, order.status, order.totalPaid, stripeClientSecret);
    } finally {
      // --- Paso 11: Liberar todos los locks adquiridos ---
      for (const lockKey of acquiredLockKeys) {
        await this.lockService.releaseLock(lockKey);
      }
    }
  }

  /**
   * Motor de Enrutamiento Logístico Automático (REQ-BE-07).
   * Comparación exacta de Strings (los valores provienen de Selects, no texto libre).
   */
  private resolveDeliveryType(
    state: string,
    municipality: string,
    systemConfig: SystemSettingsValues
  ): DeliveryType {
    const isLocal =
      state === systemConfig.baseState &&
      systemConfig.nearbyMunicipalities.includes(municipality);

    return isLocal ? 'LOCAL' : 'EXTERNAL_COURIER';
  }

  private toResponseDTO(
    orderId: string,
    status: OrderStatus,
    totalPaid: number,
    stripeClientSecret?: string
  ): CheckoutResponseDTO {
    return { orderId, status, totalPaid, stripeClientSecret };
  }
}
