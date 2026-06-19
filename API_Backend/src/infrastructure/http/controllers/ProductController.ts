import { FastifyRequest, FastifyReply } from 'fastify';
import { GetProductsUseCase } from '../../../application/usecases/GetProductsUseCase';
import { GetProductDetailUseCase } from '../../../application/usecases/GetProductDetailUseCase';
import { GetTopProductsUseCase } from '../../../application/usecases/GetTopProductsUseCase';
import { GetCategoriesUseCase } from '../../../application/usecases/GetCategoriesUseCase';
import { GetProductsQueryDTO } from '../../../domain/types/ProductDTOs';
import { ProductNotFoundError } from '../../../domain/errors/ProductErrors';

/**
 * Controlador HTTP del Catálogo de Productos.
 *
 * Responsabilidad única: Traducir peticiones HTTP ↔ Use Cases ↔ Respuestas HTTP.
 * - Extrae query params y route params del request de Fastify.
 * - Invoca el Use Case correspondiente.
 * - Traduce errores de dominio a códigos HTTP apropiados.
 *
 * NO contiene lógica de negocio. Eso vive en los Use Cases.
 */
export class ProductController {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductDetailUseCase: GetProductDetailUseCase,
    private readonly getTopProductsUseCase: GetTopProductsUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
  ) {}

  /**
   * GET /api/products
   * Listado paginado de productos con búsqueda y filtros.
   */
  async listProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as Record<string, string | undefined>;

      const dto: GetProductsQueryDTO = {
        search: query.search,
        categoryId: query.categoryId,
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
        sortBy: query.sortBy as GetProductsQueryDTO['sortBy'],
        sortOrder: query.sortOrder as GetProductsQueryDTO['sortOrder'],
      };

      const result = await this.getProductsUseCase.execute(dto);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Catálogo de productos obtenido exitosamente.',
        data: result,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * GET /api/products/:id
   * Detalle completo de un producto (producto + categoría + variantes).
   */
  async getProductDetail(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { id } = request.params as { id: string };

      const detail = await this.getProductDetailUseCase.execute(id);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Detalle del producto obtenido exitosamente.',
        data: detail,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * GET /api/products/top-sales
   * Top productos más vendidos para el Landing Page.
   */
  async getTopProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as Record<string, string | undefined>;
      const limit = query.limit ? parseInt(query.limit, 10) : undefined;

      const products = await this.getTopProductsUseCase.execute(limit);

      return reply.status(200).send({
        statusCode: 200,
        message: 'Top ventas obtenido exitosamente.',
        data: products,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * GET /api/products/categories
   * Lista todas las categorías del catálogo.
   */
  async listCategories(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const categories = await this.getCategoriesUseCase.execute();

      return reply.status(200).send({
        statusCode: 200,
        message: 'Categorías obtenidas exitosamente.',
        data: categories,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  /**
   * Traductor centralizado: Errores de Dominio → Códigos HTTP.
   *
   * Mapeo:
   * - ProductNotFoundError → 404 Not Found
   * - Error genérico → 500 Internal Server Error
   */
  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof ProductNotFoundError) {
      reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    // Error no controlado → 500
    console.error('❌ Error inesperado en ProductController:', error);
    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ha ocurrido un error interno. Por favor, inténtalo más tarde.',
    });
  }
}
