import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { IMediaStorageService } from '../../../application/interfaces/IMediaStorageService';

/**
 * Adaptador de almacenamiento cloud: AWS S3 (Fase 23).
 *
 * DISEÑO DE FALLO GRACIOSO:
 * El constructor NO lanza si las credenciales están vacías o incompletas.
 * El `S3Client` de AWS SDK v3 es lazy — solo valida credenciales al primer
 * `send()`. Esto permite que el servidor arranque sin claves S3 en desarrollo;
 * el error emerge únicamente cuando se intenta un upload real, con un mensaje
 * de error claro al administrador (HTTP 503 via `StorageServiceError`).
 *
 * SEGURIDAD:
 * - Nunca expone credenciales en logs de error (el AWS SDK las oculta).
 * - Los archivos se guardan bajo el prefijo `products/` para separación lógica.
 * - El `ContentType` siempre es `image/webp` (forzado por el use case).
 *
 * PREREQUISITO BUCKET:
 * El bucket S3 debe tener política de lectura pública o usar CloudFront.
 * La ACL `public-read` requiere que el bucket tenga deshabilitado "Block Public ACLs".
 * Si se usa bucket privado + CloudFront, reemplazar `buildPublicUrl` con la URL de CF.
 */
export class S3MediaStorageService implements IMediaStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(config: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    this.bucket = config.bucket;
    this.region = config.region;

    // El S3Client se construye siempre — AWS SDK v3 no valida credenciales
    // en el constructor. Si las credenciales son strings vacíos, el primer
    // send() fallará con una excepción descriptiva de AWS, que el use case
    // captura y relanza como StorageServiceError (HTTP 503).
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const key = `products/${filename}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Para buckets con ACL habilitado — omitir si se usa bucket policy en su lugar.
        // ACL: 'public-read',
      })
    );

    return this.buildPublicUrl(key);
  }

  /**
   * Construye la URL pública estándar de S3.
   * Si se usa CloudFront, reemplazar este método con la URL de distribución.
   */
  private buildPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
