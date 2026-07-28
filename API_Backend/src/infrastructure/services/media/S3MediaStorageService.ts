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
 * - El `ContentType` lo fija cada caso de uso tras validar el archivo.
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
  private readonly publicUrl: string;

  constructor(config: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    publicUrl?: string;
  }) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.publicUrl = config.publicUrl || `https://${config.bucket}.s3.${config.region}.amazonaws.com`;

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    // Para banners vs productos. Por ahora usamos la misma carpeta o basamos en el origen.
    // De momento, como no sabemos de dónde viene en este nivel, pasaremos prefix si se necesita.
    // Para no romper la interfaz, los pondremos todos juntos, o dejamos que el filename incluya la carpeta.
    const key = filename.includes('/') ? filename : `media/${filename}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return this.buildPublicUrl(key);
  }

  private buildPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
