import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateProductUseCase } from '../../../application/use_cases/admin/catalog/CreateProductUseCase';
import { UpdateProductUseCase } from '../../../application/use_cases/admin/catalog/UpdateProductUseCase';
import { SoftDeleteProductUseCase } from '../../../application/use_cases/admin/catalog/SoftDeleteProductUseCase';
import { CreateVariantUseCase } from '../../../application/use_cases/admin/catalog/CreateVariantUseCase';
import { UpdateVariantUseCase } from '../../../application/use_cases/admin/catalog/UpdateVariantUseCase';
import { AdjustVariantStockUseCase } from '../../../application/use_cases/admin/catalog/AdjustVariantStockUseCase';
import {
  OptimisticConcurrencyError,
  DuplicateSkuError,
  InvalidPriceError,
  CategoryNotFoundError,
  ProductNotFoundAdminError,
  VariantNotFoundError,
  InvalidStockDeltaError,
} from '../../../domain/errors/ProductAdminErrors';

/**
 * Controlador HTTP para el CMS de Catálogo (admin).
 *
 * Responsabilidades EXCLUSIVAS de esta clase:
 *   1. Extraer parámetros del request HTTP (body, params).
 *   2. Extraer el `adminContext` del request (preparado por `adminAuditContextMiddleware`).
 *   3. Llamar al use case correspondiente.
 *   4. Traducir el resultado/error a un código HTTP + cuerpo JSON.
 *
 * Sin lógica de negocio aquí.
 */
export class AdminProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly softDeleteProductUseCase: SoftDeleteProductUseCase,
    private readonly createVariantUseCase: CreateVariantUseCase,
    private readonly updateVariantUseCase: UpdateVariantUseCase,
    private readonly adjustVariantStockUseCase: AdjustVariantStockUseCase,
  ) {}

  async createProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const context = request.adminContext!;
      const body = request.body as {
        categoryId: string;
        name: string;
        description?: string | null;
        price: number;
        hasVirtualReward?: boolean;
      };
      const product = await this.createProductUseCase.execute(body, context);
      reply.status(201).send({ success: true, data: product });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async updateProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const context = request.adminContext!;
      const { id } = request.params as { id: string };
      const body = request.body as {
        categoryId?: string;
        name?: string;
        description?: string | null;
        price?: number;
        hasVirtualReward?: boolean;
        version: number;
      };
      const product = await this.updateProductUseCase.execute(id, body, context);
      reply.status(200).send({ success: true, data: product });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async softDeleteProduct(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const context = request.adminContext!;
      const { id } = request.params as { id: string };
      await this.softDeleteProductUseCase.execute(id, context);
      reply.status(204).send();
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async createVariant(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const context = request.adminContext!;
      const { id: productId } = request.params as { id: string };
      const body = request.body as {
        sku: string;
        size?: string | null;
        color?: string | null;
        stock: number;
      };
      const variant = await this.createVariantUseCase.execute(
        { productId, ...body },
        context
      );
      reply.status(201).send({ success: true, data: variant });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async updateVariant(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const context = request.adminContext!;
      const { variantId } = request.params as { id: string; variantId: string };
      const body = request.body as {
        sku?: string;
        size?: string | null;
        color?: string | null;
      };
      const variant = await this.updateVariantUseCase.execute(variantId, body, context);
      reply.status(200).send({ success: true, data: variant });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  async adjustStock(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const context = request.adminContext!;
      const { variantId } = request.params as { id: string; variantId: string };
      const body = request.body as { delta: number };
      const variant = await this.adjustVariantStockUseCase.execute(variantId, body, context);
      reply.status(200).send({ success: true, data: variant });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (
      err instanceof OptimisticConcurrencyError ||
      err instanceof DuplicateSkuError ||
      err instanceof InvalidStockDeltaError
    ) {
      return void reply.status(409).send({ success: false, error: (err as Error).message });
    }
    if (
      err instanceof InvalidPriceError
    ) {
      return void reply.status(400).send({ success: false, error: (err as Error).message });
    }
    if (
      err instanceof CategoryNotFoundError ||
      err instanceof ProductNotFoundAdminError ||
      err instanceof VariantNotFoundError
    ) {
      return void reply.status(404).send({ success: false, error: (err as Error).message });
    }
    console.error('[AdminProductController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
