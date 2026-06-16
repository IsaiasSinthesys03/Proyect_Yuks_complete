import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '../../cache/redis-client';

// Worker genérico que escucha la cola principal.
// En fases posteriores, se despachará la lógica según job.name
// (ej. 'reconcile-payment', 'export-report', 'send-email').
const worker = new Worker(
  'animayuks-main-queue',
  async (job: Job) => {
    console.log(`⚙️  Procesando trabajo [${job.name}] id=${job.id}...`);
    console.log('   Datos del job:', JSON.stringify(job.data));

    // Dispatcher: se expandirá con lógica real por tipo de trabajo
    switch (job.name) {
      case 'reconcile-payment':
        console.log('   → Reconciliación de pago pendiente.');
        break;
      case 'export-report':
        console.log('   → Generando reporte asíncrono.');
        break;
      case 'send-notification':
        console.log('   → Enviando notificación.');
        break;
      default:
        console.log(`   → Tipo de trabajo "${job.name}" sin handler específico.`);
    }

    console.log(`✅ Trabajo [${job.name}] procesado exitosamente.`);
  },
  {
    connection: redisConnectionOptions,
    concurrency: 5, // Procesa hasta 5 jobs en paralelo
  }
);

worker.on('failed', (job, err) => {
  console.error(`❌ Trabajo [${job?.name}] id=${job?.id} falló:`, err.message);
});

worker.on('completed', (job) => {
  console.log(`🏁 Trabajo [${job.name}] id=${job.id} completado.`);
});

console.log('🔧 Worker "animayuks-main-queue" escuchando trabajos...');

export { worker };
