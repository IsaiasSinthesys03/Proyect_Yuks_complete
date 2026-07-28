/**
 * Puerto (Interfaz) del servicio de almacenamiento de media.
 *
 * La implementación concreta (`S3MediaStorageService`) vive en infraestructura.
 * Los use cases dependen de este contrato puro — sin imports de AWS SDK.
 */
export interface IMediaStorageService {
  /**
   * Sube un buffer procesado al almacenamiento cloud y retorna la URL pública.
   *
   * @param buffer      - Imagen ya validada y procesada (imagen principal: WEBP 1080x1080 contain).
   * @param filename    - Nombre de archivo generado con `crypto.randomUUID()`.
   *                      El servicio lo coloca bajo el prefijo correspondiente (e.g., `products/`).
   * @param contentType - MIME type real del buffer (`image/webp`, `application/pdf`, etc.).
   * @returns URL pública permanente del recurso subido.
   */
  upload(buffer: Buffer, filename: string, contentType: string): Promise<string>;
}
