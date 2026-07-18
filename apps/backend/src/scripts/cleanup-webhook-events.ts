// apps/backend/src/scripts/cleanup-webhook-events.ts
import { prisma } from '@divye/database';
import { logger } from '../utils/logger';

const RETENTION_DAYS = 90;

async function cleanupOldWebhookEvents(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.webhookEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  logger.info('Webhook event cleanup complete', {
    deletedCount: result.count,
    cutoff: cutoff.toISOString(),
  });
}

cleanupOldWebhookEvents()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    logger.error('Webhook event cleanup failed', { err });
    return prisma.$disconnect().finally(() => process.exit(1));
  });