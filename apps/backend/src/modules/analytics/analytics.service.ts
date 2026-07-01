import { OrderStatus, PaymentStatus, prisma, Prisma } from '@divye/database';
import type { AcquisitionQuery, ProductSalesQuery } from './analytics.types';

const revenueFilter: Prisma.OrderWhereInput = {
  OR: [
    { status: OrderStatus.DELIVERED },
    { paymentStatus: PaymentStatus.PAID },
  ],
};

export const analyticsService = {
  async getOverview() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [todayRevenue, monthRevenue, yearRevenue, todayOrders, monthOrders, totalCustomers] =
      await Promise.all([
        prisma.order.aggregate({
          where: { ...revenueFilter, createdAt: { gte: startOfDay } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.order.aggregate({
          where: { ...revenueFilter, createdAt: { gte: startOfMonth } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.order.aggregate({
          where: { ...revenueFilter, createdAt: { gte: startOfYear } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
      ]);

    return {
      revenue: {
        today: todayRevenue._sum.totalAmount?.toString() ?? '0',
        month: monthRevenue._sum.totalAmount?.toString() ?? '0',
        year: yearRevenue._sum.totalAmount?.toString() ?? '0',
      },
      orders: {
        today: todayOrders,
        month: monthOrders,
        paidToday: todayRevenue._count,
        paidMonth: monthRevenue._count,
      },
      customers: { total: totalCustomers },
    };
  },

  async getMonthlyRevenue() {
    const results = await prisma.$queryRaw<
      Array<{ month: string; revenue: string; orders: bigint }>
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        COALESCE(SUM("totalAmount"), 0)::text as revenue,
        COUNT(*)::bigint as orders
      FROM "Order"
      WHERE "status" = 'DELIVERED' OR "paymentStatus" = 'PAID'
      AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;

    return results.map((r) => ({
      month: r.month,
      revenue: r.revenue,
      orders: Number(r.orders),
    }));
  },

  async getCustomerAcquisition(query: AcquisitionQuery) {
    const results =
      query.period === 'day'
        ? await prisma.$queryRaw<Array<{ period: string; count: bigint }>>`
            SELECT
              TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') as period,
              COUNT(*)::bigint as count
            FROM "User"
            WHERE "role" = 'CUSTOMER'
            AND "createdAt" >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('day', "createdAt")
            ORDER BY period ASC
          `
        : query.period === 'week'
          ? await prisma.$queryRaw<Array<{ period: string; count: bigint }>>`
              SELECT
                TO_CHAR(DATE_TRUNC('week', "createdAt"), 'YYYY-MM-DD') as period,
                COUNT(*)::bigint as count
              FROM "User"
              WHERE "role" = 'CUSTOMER'
              AND "createdAt" >= NOW() - INTERVAL '12 months'
              GROUP BY DATE_TRUNC('week', "createdAt")
              ORDER BY period ASC
            `
          : await prisma.$queryRaw<Array<{ period: string; count: bigint }>>`
              SELECT
                TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM-DD') as period,
                COUNT(*)::bigint as count
              FROM "User"
              WHERE "role" = 'CUSTOMER'
              AND "createdAt" >= NOW() - INTERVAL '12 months'
              GROUP BY DATE_TRUNC('month', "createdAt")
              ORDER BY period ASC
            `;

    return results.map((r) => ({ period: r.period, count: Number(r.count) }));
  },

  async getCustomerRetention() {
    const results = await prisma.$queryRaw<
      Array<{ type: string; count: bigint }>
    >`
      SELECT
        CASE WHEN order_count = 1 THEN 'new' ELSE 'returning' END as type,
        COUNT(*)::bigint as count
      FROM (
        SELECT "userId", COUNT(*) as order_count
        FROM "Order"
        WHERE "paymentStatus" = 'PAID' OR "status" = 'DELIVERED'
        GROUP BY "userId"
      ) sub
      GROUP BY type
    `;

    const newCustomers = Number(results.find((r) => r.type === 'new')?.count ?? 0);
    const returning = Number(results.find((r) => r.type === 'returning')?.count ?? 0);
    const total = newCustomers + returning;

    return {
      new: newCustomers,
      returning,
      returningRatio: total > 0 ? returning / total : 0,
    };
  },

  async getTopProducts() {
    const results = await prisma.$queryRaw<
      Array<{ productName: string; sku: string; units: bigint; revenue: string }>
    >`
      SELECT
        oi."productName",
        oi."sku",
        SUM(oi."quantity")::bigint as units,
        SUM(oi."totalPrice")::text as revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o."id"
      WHERE o."status" = 'DELIVERED' OR o."paymentStatus" = 'PAID'
      GROUP BY oi."productName", oi."sku"
      ORDER BY SUM(oi."totalPrice") DESC
      LIMIT 10
    `;

    return results.map((r) => ({
      productName: r.productName,
      sku: r.sku,
      units: Number(r.units),
      revenue: r.revenue,
    }));
  },

  async getProductSales(productId: string, query: ProductSalesQuery) {
    const from = query.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ?? new Date();

    const results = await prisma.$queryRaw<
      Array<{ date: string; units: bigint; revenue: string }>
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('day', o."createdAt"), 'YYYY-MM-DD') as date,
        SUM(oi."quantity")::bigint as units,
        SUM(oi."totalPrice")::text as revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o."id"
      JOIN "ProductVariant" pv ON oi."variantId" = pv."id"
      WHERE pv."productId" = ${productId}
      AND (o."status" = 'DELIVERED' OR o."paymentStatus" = 'PAID')
      AND o."createdAt" >= ${from}
      AND o."createdAt" <= ${to}
      GROUP BY DATE_TRUNC('day', o."createdAt")
      ORDER BY date ASC
    `;

    return results.map((r) => ({
      date: r.date,
      units: Number(r.units),
      revenue: r.revenue,
    }));
  },

  async getRecentOrders() {
    return prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { select: { productName: true, variantName: true, quantity: true, totalPrice: true } },
      },
    });
  },
};
