import { IWishlistRepository, WishlistItem } from '../../interfaces/IWishlistRepository';
import { IProductRepository } from '../../interfaces/IProductRepository';
import { ProductNotFoundError } from '../../../domain/errors/ProductErrors';

/** Casos de uso de la Wishlist (REQ-FE-19, Fase 31). */

export class AddToWishlistUseCase {
  constructor(
    private readonly wishlistRepository: IWishlistRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  /** @returns true si se agregó ahora; false si ya estaba en la lista. */
  async execute(userId: string, productId: string): Promise<boolean> {
    // Verificar que el producto existe y está activo antes de agregarlo,
    // para devolver un 404 limpio en vez de una violación de FK.
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }
    return this.wishlistRepository.add(userId, productId);
  }
}

export class RemoveFromWishlistUseCase {
  constructor(private readonly wishlistRepository: IWishlistRepository) {}
  execute(userId: string, productId: string): Promise<boolean> {
    return this.wishlistRepository.remove(userId, productId);
  }
}

export class GetWishlistUseCase {
  constructor(private readonly wishlistRepository: IWishlistRepository) {}
  /** Productos con `totalStock` agregado (Fase 44): el front pinta "Agotado" en vivo. */
  execute(userId: string): Promise<WishlistItem[]> {
    return this.wishlistRepository.findByUserId(userId);
  }
}
