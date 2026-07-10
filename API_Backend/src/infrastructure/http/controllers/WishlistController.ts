import { FastifyRequest, FastifyReply } from 'fastify';
import {
  AddToWishlistUseCase,
  RemoveFromWishlistUseCase,
  GetWishlistUseCase,
} from '../../../application/use_cases/wishlist/WishlistUseCases';
import { ProductNotFoundError } from '../../../domain/errors/ProductErrors';

/** Controlador de Wishlist (REQ-FE-19, Fase 31). Requiere usuario autenticado. */
export class WishlistController {
  constructor(
    private readonly addToWishlist: AddToWishlistUseCase,
    private readonly removeFromWishlist: RemoveFromWishlistUseCase,
    private readonly getWishlist: GetWishlistUseCase,
  ) {}

  /** GET /api/profile/wishlist */
  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const products = await this.getWishlist.execute(userId);
      reply.status(200).send({ success: true, data: products });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** POST /api/profile/wishlist  { productId } */
  async add(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const { productId } = request.body as { productId?: string };
      if (!productId) {
        return void reply.status(400).send({ success: false, error: 'productId es obligatorio.' });
      }
      const added = await this.addToWishlist.execute(userId, productId);
      reply.status(added ? 201 : 200).send({
        success: true,
        data: { productId, added },
        message: added ? 'Producto agregado a tu lista de deseos.' : 'El producto ya estaba en tu lista.',
      });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  /** DELETE /api/profile/wishlist/:productId */
  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = request.user!.sub;
      const { productId } = request.params as { productId: string };
      const removed = await this.removeFromWishlist.execute(userId, productId);
      if (!removed) {
        return void reply.status(404).send({ success: false, error: 'El producto no estaba en tu lista.' });
      }
      reply.status(200).send({ success: true, message: 'Producto eliminado de tu lista de deseos.' });
    } catch (err) {
      this.handleError(err, reply);
    }
  }

  private handleError(err: unknown, reply: FastifyReply): void {
    if (err instanceof ProductNotFoundError) {
      return void reply.status(404).send({ success: false, error: err.message });
    }
    console.error('[WishlistController]', err);
    reply.status(500).send({ success: false, error: 'Error interno del servidor.' });
  }
}
