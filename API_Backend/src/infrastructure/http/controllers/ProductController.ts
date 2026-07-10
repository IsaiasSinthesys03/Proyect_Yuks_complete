import { FastifyRequest, FastifyReply } from 'fastify';
import IORedis from 'ioredis';
import { GetProductsUseCase } from '../../../application/usecases/GetProductsUseCase';
import { GetProductDetailUseCase } from '../../../application/usecases/GetProductDetailUseCase';
import { GetTopProductsUseCase } from '../../../application/usecases/GetTopProductsUseCase';
import { GetCategoriesUseCase } from '../../../application/usecases/GetCategoriesUseCase';
import { GetProductsQueryDTO } from '../../../domain/types/ProductDTOs';
import { ProductNotFoundError } from '../../../domain/errors/ProductErrors';

const TOP_PRODUCTS_TTL_SECONDS = 3600;

/**
 * Tope de espera para la LECTURA de caché (ms). ioredis encola los comandos
 * cuando la conexión está caída, así que un `await get()` puede colgarse de
 * forma indefinida. Este timeout corto garantiza una degradación elegante:
 * si Redis no responde a tiempo, se ignora la caché y se consulta la BD.
 */
const CACHE_READ_TIMEOUT_MS = 500;

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
    private readonly cacheClient: IORedis,
  ) {}

  /**
   * GET /api/products
   * Listado paginado de productos con búsqueda y filtros.
   */
  async listProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as Record<string, string | undefined>;

      const parseNum = (v: string | undefined): number | undefined => {
        if (v === undefined) return undefined;
        const n = parseFloat(v);
        return Number.isNaN(n) ? undefined : n;
      };

      const dto: GetProductsQueryDTO = {
        search: query.search,
        categoryId: query.categoryId,
        minPrice: parseNum(query.minPrice),
        maxPrice: parseNum(query.maxPrice),
        character: query.character,
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
   *
   * CACHÉ REDIS (REQ-BE-10): TTL de 1 hora. La clave incluye el límite para
   * soportar múltiples variantes cacheadas. El worker de reconciliación
   * invalida todas las claves `cache:top-products:*` cuando se confirma un pago.
   */
  async getTopProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const query = request.query as Record<string, string | undefined>;
      const limit = query.limit ? parseInt(query.limit, 10) : undefined;
      const cacheKey = `cache:top-products:${limit ?? 'default'}`;

      // Lectura de caché a prueba de balas: si Redis está caído/lento, degradamos
      // elegantemente a la BD en lugar de colgar la petición indefinidamente.
      const cached = await this.readCacheResilient(cacheKey);
      if (cached) {
        return reply.status(200).send({
          statusCode: 200,
          message: 'Top ventas obtenido exitosamente.',
          data: JSON.parse(cached),
        });
      }

      const products = await this.getTopProductsUseCase.execute(limit);

      // Cachear en background — un fallo de Redis nunca rompe la respuesta HTTP
      this.cacheClient.setex(cacheKey, TOP_PRODUCTS_TTL_SECONDS, JSON.stringify(products)).catch((err) => {
        console.error('[ProductController] Error al escribir caché de top-products:', err);
      });

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
   * Lee una clave de caché con degradación elegante.
   *
   * ioredis encola los comandos mientras la conexión está caída, por lo que un
   * `get()` normal puede quedarse esperando para siempre. Aquí corremos el `get`
   * contra un timeout corto: si Redis no responde a tiempo o lanza un error,
   * registramos un warning y devolvemos `null` para que el caller consulte la BD.
   *
   * @returns el valor cacheado, o `null` si no hay caché / Redis no está disponible.
   */
  private async readCacheResilient(cacheKey: string): Promise<string | null> {
    // Centinela para distinguir un TIMEOUT (Redis caído/lento) de un miss real
    // (Redis vivo, clave ausente → `null`). Solo el timeout emite un warning.
    const TIMEOUT = Symbol('cache-timeout');
    try {
      const timeout = new Promise<typeof TIMEOUT>((resolve) =>
        setTimeout(() => resolve(TIMEOUT), CACHE_READ_TIMEOUT_MS),
      );
      const value = await Promise.race([this.cacheClient.get(cacheKey), timeout]);
      if (value === TIMEOUT) {
        console.warn(
          `[ProductController] Redis no respondió en ${CACHE_READ_TIMEOUT_MS}ms al leer "${cacheKey}"; degradando a la BD.`,
        );
        return null;
      }
      // `null` aquí = miss real (Redis respondió sin la clave) → se consulta la BD.
      return value;
    } catch (err) {
      console.warn(
        `[ProductController] Redis no disponible al leer "${cacheKey}"; degradando a la BD.`,
        err,
      );
      return null;
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
