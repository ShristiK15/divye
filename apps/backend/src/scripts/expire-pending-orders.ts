// apps/backend/src/scripts/expire-pending-orders.ts
import { prisma, OrderStatus } from '@divye/database';
import { tryExpireOrder } from '../modules/orders/orders.service';
import { logger } from '../utils/logger';

async function expirePendingOrders(): Promise<void> {
  const candidates = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      expiresAt: { lt: new Date() },
    },
    select: { id: true },
  });

  let expiredCount = 0;
  for (const { id } of candidates) {
    if (await tryExpireOrder(id)) expiredCount++;
  }

  logger.info('Expired pending orders sweep complete', {
    candidates: candidates.length,
    expiredCount,
  });
}

expirePendingOrders()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    logger.error('Expire pending orders sweep failed', { err });
    return prisma.$disconnect().finally(() => process.exit(1));
  });