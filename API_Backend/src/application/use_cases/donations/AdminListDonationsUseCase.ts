import { IDonationRepository } from '../../interfaces/IDonationRepository';
import { AdminDonationFilterDTO, DonationPaginatedResponseDTO } from '../../../domain/types/DonationDTOs';

/** Use Case: Listar donaciones para el panel CMS (CMS-FE-13) */
export class AdminListDonationsUseCase {
  constructor(private readonly donationRepository: IDonationRepository) {}

  async execute(filter: AdminDonationFilterDTO): Promise<DonationPaginatedResponseDTO> {
    const sanitizedFilter: AdminDonationFilterDTO = {
      ...filter,
      page:  Math.max(1, filter.page  ?? 1),
      limit: Math.min(100, Math.max(1, filter.limit ?? 20)),
    };
    return this.donationRepository.findAll(sanitizedFilter);
  }
}
