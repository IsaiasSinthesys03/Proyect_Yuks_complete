import { Banner } from '../../domain/entities/Banner';
import { CreateBannerDTO, UpdateBannerDTO } from '../../domain/types/BannerDTOs';

/**
 * Puerto del repositorio de Banners (Fase 30).
 */
export interface IBannerRepository {
  /** Lista TODOS los banners (vista admin), ordenados por posición. */
  findAll(): Promise<Banner[]>;

  /**
   * Lista solo los banners ACTIVOS y vigentes (ventana starts_at/ends_at),
   * ordenados por posición. Vista pública del storefront.
   */
  findActive(now: Date): Promise<Banner[]>;

  findById(id: string): Promise<Banner | null>;

  create(data: CreateBannerDTO): Promise<Banner>;

  /** Actualiza campos parciales. Devuelve null si el id no existe. */
  update(id: string, data: UpdateBannerDTO): Promise<Banner | null>;

  /** Elimina el banner. Devuelve true si existía. */
  delete(id: string): Promise<boolean>;
}
