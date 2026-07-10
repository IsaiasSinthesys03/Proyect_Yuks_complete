import { FastifyRequest, FastifyReply } from 'fastify';
import { GetUserRewardsUseCase } from '../../../application/use_cases/rewards/GetUserRewardsUseCase';
import { ValidateRewardM2MUseCase } from '../../../application/use_cases/game_bridge/ValidateRewardM2MUseCase';
import { ValidateRewardRequestDTO } from '../../../domain/types/RewardDTOs';

/**
 * Controlador HTTP de Recompensas / Game Bridge (REQ-FE-22, REQ-BE-05).
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * NO contiene lógica de negocio.
 *
 * `getUserRewards` está protegido por JWT de usuario.
 * `validateReward` está protegido por `m2mAuthMiddleware` (Q11) — sin JWT de usuario.
 */
export class RewardController {
  constructor(
    private readonly getUserRewardsUseCase: GetUserRewardsUseCase,
    private readonly validateRewardM2MUseCase: ValidateRewardM2MUseCase
  ) {}

  /** GET /api/profile/rewards */
  async getUserRewards(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const rewards = await this.getUserRewardsUseCase.execute(userId);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Recompensas obtenidas exitosamente.',
        data: rewards,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /** POST /api/game/rewards/validate (M2M) */
  async validateReward(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const dto = request.body as ValidateRewardRequestDTO;
      const result = await this.validateRewardM2MUseCase.execute(dto.code);

      return reply.status(200).send(result);
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    console.error('❌ Error inesperado en RewardController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
