import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  users: UserTable;
  profiles: ProfileTable;
  categories: CategoryTable;
  products: ProductTable;
  product_variants: ProductVariantTable;
  addresses: AddressTable;
  coupons: CouponTable;
  orders: OrderTable;
  order_items: OrderItemTable;
  wallet: WalletTable;
  wallet_transactions: WalletTransactionTable;
  reward_codes: RewardCodeTable;
  system_settings: SystemSettingTable;
  audit_logs: AuditLogTable;
  donations: DonationTable;
  password_reset_tokens: PasswordResetTokenTable;
  refresh_tokens: RefreshTokenTable;
  otp_codes: OtpCodeTable;
  banners: BannerTable;
  legal_documents: LegalDocumentTable;
  wishlists: WishlistTable;
  notifications: NotificationTable;
  product_categories: ProductCategoriesTable;
  youtube_videos: YoutubeVideoTable;
}

export interface UserTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  role: Generated<string>;
  is_banned: Generated<boolean>;
  totp_secret: string | null;              // Fase 29: secreto Base32 TOTP (admin 2FA)
  totp_enabled: Generated<boolean>;        // Fase 29: si el 2FA está activo
  google_id: string | null;                // Fase 29: "sub" de Google OAuth
  privacy_accepted: Generated<boolean>;    // Fase 33: aceptación del Aviso de Privacidad (REQ-BE-08)
  privacy_accepted_at: Date | null;        // Fase 33: timestamp exacto de la aceptación
  created_at: Generated<Date>;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export interface ProfileTable {
  id: Generated<string>;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  tier_level: Generated<string>;
  experience_points: Generated<number>;
  updated_at: Generated<Date>;
}

export type Profile = Selectable<ProfileTable>;
export type NewProfile = Insertable<ProfileTable>;
export type ProfileUpdate = Updateable<ProfileTable>;

// ==========================================
// Catálogo: Categories
// ==========================================
export interface CategoryTable {
  id: Generated<string>;
  name: string;
  created_at: Generated<Date>;
}

export type Category = Selectable<CategoryTable>;
export type NewCategory = Insertable<CategoryTable>;
export type CategoryUpdate = Updateable<CategoryTable>;

// ==========================================
// Catálogo: Products
// ==========================================
export interface ProductTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  price: string; // NUMERIC viene como string desde PostgreSQL
  status: Generated<string>; // 'ACTIVE' | 'DRAFT'
  has_virtual_reward: Generated<boolean>;
  is_deleted: Generated<boolean>;
  version: Generated<number>;
  image_url: string | null;
  gallery_urls: Generated<string[]>; // Added for secondary gallery
  character: string | null; // Fase 33: Personaje para el filtro del catálogo (REQ-FE-12)
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Product = Selectable<ProductTable>;
export type NewProduct = Insertable<ProductTable>;
export type ProductUpdate = Updateable<ProductTable>;

// ==========================================
// Catálogo: Product Variants
// ==========================================
export interface ProductVariantTable {
  id: Generated<string>;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  created_at: Generated<Date>;
}

export type ProductVariant = Selectable<ProductVariantTable>;
export type NewProductVariant = Insertable<ProductVariantTable>;
export type ProductVariantUpdate = Updateable<ProductVariantTable>;

// ==========================================
// Perfil: Addresses (REQ-FE-09, REQ-FE-17)
// ==========================================
export interface AddressTable {
  id: Generated<string>;
  user_id: string;
  label: string;
  street: string;
  exterior_number: string;
  interior_number: string | null;
  neighborhood: string;
  postal_code: string;
  municipality: string;  // Valor de Select, no texto libre (REQ-FE-09)
  state: string;          // Valor de Select, no texto libre (REQ-FE-09)
  country: Generated<string>;
  references: string | null;
  is_default: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Address = Selectable<AddressTable>;
export type NewAddress = Insertable<AddressTable>;
export type AddressUpdate = Updateable<AddressTable>;

// ==========================================
// Marketing: Coupons (CMS-FE-15, REQ-FE-21)
// ==========================================
export interface CouponTable {
  id: Generated<string>;
  code: string;
  discount_type: string;     // 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: string;    // NUMERIC viene como string desde PostgreSQL
  max_uses: number;
  current_uses: Generated<number>;
  expires_at: Date;
  is_active: Generated<boolean>;
  min_purchase_amount: string | null;  // NUMERIC → string | null
  created_at: Generated<Date>;
}

export type Coupon = Selectable<CouponTable>;
export type NewCoupon = Insertable<CouponTable>;
export type CouponUpdate = Updateable<CouponTable>;

// ==========================================
// Transacciones: Orders (REQ-BE-01, REQ-FE-23)
// ==========================================
export interface OrderTable {
  id: Generated<string>;
  user_id: string;
  status: Generated<string>;       // PAYMENT_PENDING | PAID | PREPARING | SHIPPED | DELIVERING | DELIVERED | CANCELLED | NEEDS_RECONCILIATION
  subtotal: string;                 // NUMERIC → string
  discount_amount: Generated<string>;
  shipping_cost: Generated<string>;
  wallet_deduction: Generated<string>;
  total_paid: string;               // NUMERIC → string
  delivery_type: string | null;    // 'LOCAL' | 'EXTERNAL_COURIER'
  shipping_address: string;
  postal_code: string;
  municipality: string;
  state: string;
  terms_version: string;           // Compliance Audit Trail (REQ-BE-08)
  client_ip: string;               // Compliance Audit Trail (REQ-BE-08)
  idempotency_key: string;         // UNIQUE — anti doble-cobro (REQ-BE-01)
  coupon_id: string | null;        // FK nullable → coupons
  stripe_payment_intent_id: string | null;
  driver_name: string | null;      // Última Milla (CMS-FE-04)
  driver_vehicle: string | null;
  driver_phone: string | null;
  tracking_company: string | null;  // Paquetería (FedEx/DHL)
  tracking_number: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Order = Selectable<OrderTable>;
export type NewOrder = Insertable<OrderTable>;
export type OrderUpdate = Updateable<OrderTable>;

// ==========================================
// Transacciones: Order Items (REQ-BE-01)
// Snapshots congelados — inmutabilidad de la orden
// ==========================================
export interface OrderItemTable {
  id: Generated<string>;
  order_id: string;
  variant_id: string;
  product_name: string;         // Snapshot congelado del nombre
  variant_sku: string;          // Snapshot congelado del SKU
  unit_price: string;           // Snapshot congelado del precio — NUMERIC → string
  quantity: number;             // CHECK (quantity > 0)
  has_virtual_reward: Generated<boolean>;
  created_at: Generated<Date>;
}

export type OrderItem = Selectable<OrderItemTable>;
export type NewOrderItem = Insertable<OrderItemTable>;
export type OrderItemUpdate = Updateable<OrderItemTable>;

// ==========================================
// Finanzas: Wallet (REQ-FE-20, REQ-BE-01, Q8)
// CHECK (balance >= 0) — Red de seguridad contra saldo negativo
// ==========================================
export interface WalletTable {
  id: Generated<string>;
  user_id: string;              // UNIQUE FK → users
  balance: Generated<string>;   // NUMERIC → string, DEFAULT 0, CHECK >= 0
  expires_at: Date | null;      // Renovación global a 12 meses (Resolución #4)
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Wallet = Selectable<WalletTable>;
export type NewWallet = Insertable<WalletTable>;
export type WalletUpdate = Updateable<WalletTable>;

// ==========================================
// Finanzas: Wallet Transactions — Ledger (REQ-FE-20)
// Resolución #5: original_expires_at para herencia de caducidad anti-fraude
// ==========================================
export interface WalletTransactionTable {
  id: Generated<string>;
  wallet_id: string;
  order_id: string | null;           // FK nullable → orders
  amount: string;                     // NUMERIC → string, CHECK > 0
  type: string;                       // 'DEPOSIT' | 'WITHDRAWAL'
  source: string;                     // 'REFUND' | 'PURCHASE' | 'CANCELLATION'
  description: string | null;
  original_expires_at: Date | null;  // Loophole Anti-fraude (Resolución #5)
  created_at: Generated<Date>;
}

export type WalletTransaction = Selectable<WalletTransactionTable>;
export type NewWalletTransaction = Insertable<WalletTransactionTable>;
export type WalletTransactionUpdate = Updateable<WalletTransactionTable>;

// ==========================================
// Game Bridge: Reward Codes (REQ-BE-05, REQ-FE-22)
// Resolución #6: No caducan. Resolución #7: Generación 1 a 1.
// ==========================================
export interface RewardCodeTable {
  id: Generated<string>;
  order_id: string;
  order_item_id: string;
  code: Generated<string>;       // UUID auto-generado, UNIQUE, no caduca
  status: Generated<string>;     // 'AVAILABLE' | 'CLAIMED' | 'REVOKED'
  claimed_at: Date | null;
  revoked_at: Date | null;
  created_at: Generated<Date>;
}

export type RewardCode = Selectable<RewardCodeTable>;
export type NewRewardCode = Insertable<RewardCodeTable>;
export type RewardCodeUpdate = Updateable<RewardCodeTable>;

// ==========================================
// CMS Admin: System Settings (Fase 21, Q21)
// ==========================================
export interface SystemSettingTable {
  id: Generated<string>;
  key: string;
  value: unknown; // JSONB — escalar o array, según la llave
  updated_at: Generated<Date>;
}

export type SystemSettingRow = Selectable<SystemSettingTable>;
export type NewSystemSettingRow = Insertable<SystemSettingTable>;
export type SystemSettingRowUpdate = Updateable<SystemSettingTable>;

// ==========================================
// CMS Admin: Audit Logs (Fase 21) — Bitácora Inmutable
// Protegida por trigger BEFORE UPDATE/DELETE (ver migración 009).
// ==========================================
export interface AuditLogTable {
  id: Generated<string>;
  admin_id: string | null;
  admin_email: string;
  action: string; // 'CREATE' | 'UPDATE' | 'SOFT_DELETE' | 'REFUND' | 'BAN'
  entity_type: string;
  entity_id: string;
  old_value: unknown | null; // JSONB
  new_value: unknown | null; // JSONB
  ip_address: string;
  created_at: Generated<Date>;
}

export type AuditLogRow = Selectable<AuditLogTable>;
export type NewAuditLogRow = Insertable<AuditLogTable>;

// ==========================================
// Donaciones (REQ-BE-09) — Migración 012
// ==========================================
export interface DonationTable {
  id: Generated<string>;
  user_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  amount: string;             // NUMERIC → string
  donor_email: string;
  status: Generated<string>;  // 'PENDING' | 'COMPLETED' | 'REFUNDED'
  idempotency_key: string;    // UNIQUE
  created_at: Generated<Date>;
}

export type DonationRow = Selectable<DonationTable>;
export type NewDonationRow = Insertable<DonationTable>;
export type DonationRowUpdate = Updateable<DonationTable>;

// ==========================================
// Auth Avanzada (Fase 29) — Migración 013
// ==========================================

/** Tokens de recuperación de contraseña — un solo uso, almacenados como SHA-256. */
export interface PasswordResetTokenTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;        // SHA-256 hex del token crudo
  expires_at: Date;
  used_at: Date | null;      // null = válido; set = ya consumido
  created_at: Generated<Date>;
}

export type PasswordResetTokenRow = Selectable<PasswordResetTokenTable>;
export type NewPasswordResetTokenRow = Insertable<PasswordResetTokenTable>;
export type PasswordResetTokenRowUpdate = Updateable<PasswordResetTokenTable>;

/** Refresh tokens con familia — habilita RTR y detección de reúso. */
export interface RefreshTokenTable {
  id: Generated<string>;
  user_id: string;
  family_id: string;         // Todos los tokens rotados de una sesión comparten familia
  token_hash: string;        // SHA-256 hex del token crudo
  expires_at: Date;
  used_at: Date | null;      // set al rotar; presentarlo de nuevo = reúso → matar familia
  revoked: Generated<boolean>;
  created_at: Generated<Date>;
}

export type RefreshTokenRow = Selectable<RefreshTokenTable>;
export type NewRefreshTokenRow = Insertable<RefreshTokenTable>;
export type RefreshTokenRowUpdate = Updateable<RefreshTokenTable>;

/** Códigos OTP para cambio verificado de email/teléfono (REQ-FE-16). */
export interface OtpCodeTable {
  id: Generated<string>;
  user_id: string;
  code_hash: string;         // Argon2id del código de 6 dígitos
  purpose: string;           // 'email_change' | 'phone_change'
  new_value: string;         // Email o teléfono pendiente
  expires_at: Date;
  consumed_at: Date | null;
  attempts: Generated<number>;
  created_at: Generated<Date>;
}

export type OtpCodeRow = Selectable<OtpCodeTable>;
export type NewOtpCodeRow = Insertable<OtpCodeTable>;
export type OtpCodeRowUpdate = Updateable<OtpCodeTable>;

// ==========================================
// CMS Contenido (Fase 30) — Migración 014
// ==========================================

/** Banners promocionales del Landing, ordenables y con ventana de vigencia. */
export interface BannerTable {
  id: Generated<string>;
  title: string;
  image_url: string;
  link_url: string | null;
  tag: string | null;
  description: string | null;
  video_url: string | null;
  accent_color: string | null;
  button_text: string | null;
  position: Generated<number>;
  is_active: Generated<boolean>;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type BannerRow = Selectable<BannerTable>;
export type NewBannerRow = Insertable<BannerTable>;
export type BannerRowUpdate = Updateable<BannerTable>;

/** Documentos legales versionados (términos, privacidad, envíos, devoluciones). */
export interface LegalDocumentTable {
  id: Generated<string>;
  slug: string;
  title: string;
  content: string;
  version: Generated<string>;
  pdf_url: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type LegalDocumentRow = Selectable<LegalDocumentTable>;
export type NewLegalDocumentRow = Insertable<LegalDocumentTable>;
export type LegalDocumentRowUpdate = Updateable<LegalDocumentTable>;

// ==========================================
// Gamificación / Wishlist (Fase 31) — Migración 015
// ==========================================

/** Lista de deseos por usuario (REQ-FE-19). UNIQUE(user_id, product_id). */
export interface WishlistTable {
  id: Generated<string>;
  user_id: string;
  product_id: string;
  created_at: Generated<Date>;
}

export type WishlistRow = Selectable<WishlistTable>;
export type NewWishlistRow = Insertable<WishlistTable>;
export type WishlistRowUpdate = Updateable<WishlistTable>;

// ==========================================
// Notificaciones (Fase 32) — Migración 016
// ==========================================

/** Bandeja de notificaciones persistidas por usuario (REQ-FE-24). */
export interface NotificationTable {
  id: Generated<string>;
  user_id: string;
  type: string;
  payload: unknown; // JSONB
  is_read: Generated<boolean>;
  created_at: Generated<Date>;
}

export type NotificationRow = Selectable<NotificationTable>;
export type NewNotificationRow = Insertable<NotificationTable>;
export type NotificationRowUpdate = Updateable<NotificationTable>;

// ==========================================
// Product Categories (N:M)
// ==========================================
export interface ProductCategoriesTable {
  product_id: string;
  category_id: string;
}

export type ProductCategoriesRow = Selectable<ProductCategoriesTable>;
export type NewProductCategoriesRow = Insertable<ProductCategoriesTable>;

// ==========================================
// Landing Page YouTube Videos
// ==========================================
export interface YoutubeVideoTable {
  id: Generated<string>;
  title: string;
  youtube_url: string;
  video_id: string;
  position: Generated<number>;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type YoutubeVideoRow = Selectable<YoutubeVideoTable>;
export type NewYoutubeVideoRow = Insertable<YoutubeVideoTable>;
export type YoutubeVideoRowUpdate = Updateable<YoutubeVideoTable>;

