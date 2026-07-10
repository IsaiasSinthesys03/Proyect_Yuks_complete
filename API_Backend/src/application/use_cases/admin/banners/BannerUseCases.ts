import { IBannerRepository } from '../../../interfaces/IBannerRepository';
import { Banner } from '../../../../domain/entities/Banner';
import { CreateBannerDTO, UpdateBannerDTO } from '../../../../domain/types/BannerDTOs';
import { BannerNotFoundError, InvalidBannerError } from '../../../../domain/errors/BannerErrors';

/**
 * Casos de uso del módulo de Banners (Fase 30).
 *
 * Se agrupan en un archivo por ser CRUD simple y cohesivo; cada clase mantiene
 * su responsabilidad única y depende solo del puerto IBannerRepository.
 */

function validateWindow(startsAt?: string | null, endsAt?: string | null): void {
  if (startsAt && endsAt && new Date(startsAt).getTime() > new Date(endsAt).getTime()) {
    throw new InvalidBannerError('La fecha de inicio no puede ser posterior a la fecha de fin.');
  }
}

export class CreateBannerUseCase {
  constructor(private readonly repo: IBannerRepository) {}

  async execute(dto: CreateBannerDTO): Promise<Banner> {
    if (!dto.title?.trim()) throw new InvalidBannerError('El título del banner es obligatorio.');
    if (!dto.imageUrl?.trim()) throw new InvalidBannerError('La URL de imagen del banner es obligatoria.');
    validateWindow(dto.startsAt, dto.endsAt);
    return this.repo.create(dto);
  }
}

export class UpdateBannerUseCase {
  constructor(private readonly repo: IBannerRepository) {}

  async execute(id: string, dto: UpdateBannerDTO): Promise<Banner> {
    validateWindow(dto.startsAt, dto.endsAt);
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new BannerNotFoundError(id);
    return updated;
  }
}

export class DeleteBannerUseCase {
  constructor(private readonly repo: IBannerRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new BannerNotFoundError(id);
  }
}

export class ListBannersUseCase {
  constructor(private readonly repo: IBannerRepository) {}

  /** Vista admin: todos los banners. */
  execute(): Promise<Banner[]> {
    return this.repo.findAll();
  }
}

export class GetActiveBannersUseCase {
  constructor(private readonly repo: IBannerRepository) {}

  /** Vista pública: solo banners activos y vigentes ahora. */
  execute(): Promise<Banner[]> {
    return this.repo.findActive(new Date());
  }
}
