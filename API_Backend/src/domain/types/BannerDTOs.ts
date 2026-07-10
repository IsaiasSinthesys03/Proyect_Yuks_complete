/**
 * DTOs del módulo de Banners (Fase 30).
 */

export interface CreateBannerDTO {
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  position?: number;
  isActive?: boolean;
  startsAt?: string | null; // ISO date
  endsAt?: string | null;   // ISO date
}

export interface UpdateBannerDTO {
  title?: string;
  imageUrl?: string;
  linkUrl?: string | null;
  position?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}
