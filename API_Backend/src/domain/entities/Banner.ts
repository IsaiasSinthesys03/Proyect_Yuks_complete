/**
 * Entidad de Dominio: Banner
 *
 * Banner promocional del Landing Page, gestionable desde el CMS (Fase 30).
 * `position` define el orden de aparición; `isActive` junto con la ventana
 * `startsAt`/`endsAt` determinan si el storefront lo muestra.
 */
export interface Banner {
  readonly id: string;
  readonly title: string;
  readonly imageUrl: string;
  readonly linkUrl: string | null;
  readonly tag: string | null;
  readonly description: string | null;
  readonly videoUrl: string | null;
  readonly accentColor: string | null;
  readonly buttonText: string | null;
  readonly position: number;
  readonly isActive: boolean;
  readonly startsAt: Date | null;
  readonly endsAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
