import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  users: UserTable;
  profiles: ProfileTable;
  categories: CategoryTable;
  products: ProductTable;
  product_variants: ProductVariantTable;
}

export interface UserTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  role: Generated<string>;
  is_banned: Generated<boolean>;
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
  category_id: string;
  name: string;
  description: string | null;
  price: string; // NUMERIC viene como string desde PostgreSQL
  has_virtual_reward: Generated<boolean>;
  is_deleted: Generated<boolean>;
  version: Generated<number>;
  image_url: string | null;
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
