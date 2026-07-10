// ==========================================
// Fase 23 — Errores de gestión de media
// ==========================================

/**
 * 415 — Tipo de archivo no permitido.
 * Se lanza cuando el magic number del buffer no corresponde a JPEG, PNG o WEBP,
 * o cuando el archivo es SVG (vector con potencial XSS embebido).
 */
export class UnsupportedMediaTypeError extends Error {
  readonly statusCode = 415;
  constructor(detectedType: string) {
    super(
      `Tipo de archivo '${detectedType}' no permitido. ` +
      'Solo se aceptan imágenes JPEG, PNG o WEBP. ' +
      'SVG está explícitamente prohibido por razones de seguridad.'
    );
    this.name = 'UnsupportedMediaTypeError';
  }
}

/**
 * 413 — El archivo excede el límite de tamaño configurado (8 MB).
 * Se lanza cuando @fastify/multipart trunca el stream por superar el límite.
 */
export class FileTooLargeError extends Error {
  readonly statusCode = 413;
  constructor(limitMb: number) {
    super(`El archivo supera el tamaño máximo permitido de ${limitMb} MB.`);
    this.name = 'FileTooLargeError';
  }
}

/**
 * 422 — El procesamiento de imagen falló.
 * Cubre archivos corruptos, encabezados mal formados (decompression bombs
 * detectadas por sharp con `failOn: 'error'`) y dimensiones excesivas.
 */
export class ImageProcessingError extends Error {
  readonly statusCode = 422;
  constructor(detail: string) {
    super(`Error al procesar la imagen: ${detail}`);
    this.name = 'ImageProcessingError';
  }
}

/**
 * 503 — El servicio de almacenamiento cloud no está disponible.
 * Permite al cliente distinguir un fallo de infraestructura de uno de validación.
 */
export class StorageServiceError extends Error {
  readonly statusCode = 503;
  constructor(detail: string) {
    super(`Error al subir la imagen al almacenamiento: ${detail}`);
    this.name = 'StorageServiceError';
  }
}
