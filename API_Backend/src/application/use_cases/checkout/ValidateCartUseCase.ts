import { IProductRepository } from '../../interfaces/IProductRepository';

export interface ValidateCartItemDTO {
  variantId: string;
  quantity: number;
}

export interface ValidateCartResponseItem {
  variantId: string;
  availableStock: number;
  status: 'ok' | 'out_of_stock' | 'reduced';
}

export class ValidateCartUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(items: ValidateCartItemDTO[]): Promise<ValidateCartResponseItem[]> {
    if (!items || items.length === 0) {
      return [];
    }

    const variantIds = items.map((item) => item.variantId);
    const variants = await this.productRepository.findVariantsByIds(variantIds);

    // Mapear el stock disponible
    const stockMap = new Map<string, number>();
    for (const variant of variants) {
      stockMap.set(variant.id, variant.stock);
    }

    const result: ValidateCartResponseItem[] = items.map((item) => {
      const stock = stockMap.get(item.variantId) ?? 0;
      
      let status: 'ok' | 'out_of_stock' | 'reduced' = 'ok';
      if (stock === 0) {
        status = 'out_of_stock';
      } else if (item.quantity > stock) {
        status = 'reduced';
      }

      return {
        variantId: item.variantId,
        availableStock: stock,
        status,
      };
    });

    return result;
  }
}
