import { IUserRepository } from '../../interfaces/IUserRepository';
import { IWalletRepository } from '../../interfaces/IWalletRepository';
import { ISystemSettingsRepository } from '../../interfaces/ISystemSettingsRepository';
import { ProfileResponseDTO } from '../../../domain/types/ProfileDTOs';

/**
 * Caso de Uso: Obtener el Perfil Autenticado (REQ-FE-14, REQ-FE-15).
 *
 * Agrega User + Profile + Wallet en una sola respuesta para el
 * Quick Profile Drawer del frontend.
 *
 * Fase 43: también incluye los umbrales de XP por tier (gamificación,
 * `system_settings`) para que la barra "Pase de Leyenda" sea dinámica.
 */
export class GetProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly systemSettingsRepository: ISystemSettingsRepository
  ) {}

  async execute(userId: string): Promise<ProfileResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`Usuario "${userId}" no encontrado.`);
    }

    const profile = await this.userRepository.findProfileByUserId(userId);
    if (!profile) {
      throw new Error(`Perfil para el usuario "${userId}" no encontrado.`);
    }

    // Lazy initialization: si el usuario nunca tuvo wallet, se crea con balance 0.
    const wallet = await this.walletRepository.getOrCreate(userId);

    const isExpired = wallet.expiresAt !== null && wallet.expiresAt.getTime() < Date.now();

    // Umbrales de tier para la barra de XP del frontend (config editable en CMS).
    const gamification = await this.systemSettingsRepository.getGamificationConfig();

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        tierLevel: profile.tierLevel,
        experiencePoints: profile.experiencePoints,
      },
      wallet: {
        balance: isExpired ? 0 : wallet.balance,
        expiresAt: wallet.expiresAt,
      },
      gamification: {
        silverThreshold: gamification.silverThreshold,
        goldThreshold: gamification.goldThreshold,
        platinumThreshold: gamification.platinumThreshold,
      },
    };
  }
}
