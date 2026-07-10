/**
 * Puerto (Interfaz) del Servicio de Colas Asíncronas.
 *
 * REGLA DE ORO DE CLEAN ARCHITECTURE:
 * Esta interfaz vive en la capa de Application y define el CONTRATO
 * que la implementación concreta (BullMQ, etc.) debe cumplir.
 * Los Use Cases dependen de esta abstracción — NUNCA importan `bullmq` directamente.
 *
 * USO PRINCIPAL (Q4): Encolar trabajos de reconciliación cuando un paso
 * post-pago falla por una causa de infraestructura (no por una regla de
 * negocio legítima como falta de stock real).
 */
export interface IQueueService {
  /**
   * Encola un trabajo para procesamiento asíncrono.
   *
   * @param jobName - Identificador del tipo de trabajo (ej. 'reconcile-checkout').
   * @param payload - Datos serializables que el worker necesitará para procesar el job.
   */
  enqueue(jobName: string, payload: Record<string, unknown>): Promise<void>;
}
