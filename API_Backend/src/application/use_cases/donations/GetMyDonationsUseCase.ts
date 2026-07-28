import { IDonationRepository } from '../../interfaces/IDonationRepository';
import { MyDonationsPaginatedResponseDTO } from '../../../domain/types/DonationDTOs';

export class GetMyDonationsUseCase {
  constructor(private readonly donationRepository: IDonationRepository) {}

  execute(userId: string, page = 1, limit = 20): Promise<MyDonationsPaginatedResponseDTO> {
    return this.donationRepository.findByUserId(userId, page, limit);
  }
}
