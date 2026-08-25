"use server";

import { db } from "@/db";
import { orders, orderItems, products, categories, users } from "@/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";

interface DateRange {
  start: string;
  end: string;
}

export async function getSalesAnalytics(dateRange?: DateRange) {
  const startDate = dateRange?.start
    ? new Date(dateRange.start)
    : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

  const salesOverTime = await db
    .select({
      date: sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`.as("date"),
      revenue: sql`SUM(${orders.total}::numeric)`.as("revenue"),
      orderCount: sql`COUNT(${orders.id})`.as("order_count"),
    })
    .from(orders)
    .where(
      and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))
    )
    .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

  const totalRevenue = await db
    .select({
      total: sql`COALESCE(SUM(${orders.total}::numeric), 0)`.as("total"),
    })
    .from(orders)
    .where(
      and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))
    );

  return {
    salesOverTime: salesOverTime.map((row) => ({
      date: String(row.date),
      revenue: Number(row.revenue),
      orderCount: Number(row.orderCount),
    })),
    totalRevenue: Number(totalRevenue[0]?.total || 0),
  };
}

export async function getOrderAnalytics(dateRange?: DateRange) {
  const startDate = dateRange?.start
    ? new Date(dateRange.start)
    : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

  const ordersByStatus = await db
    .select({
      status: orders.status,
      count: sql`COUNT(${orders.id})`.as("count"),
    })
    .from(orders)
    .where(
      and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))
    )
    .groupBy(orders.status);

  const averageOrderValue = await db
    .select({
      avg: sql`COALESCE(AVG(${orders.total}::numeric), 0)`.as("avg"),
    })
    .from(orders)
    .where(
      and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))
    );

  return {
    ordersByStatus: ordersByStatus.map((row) => ({
      status: row.status,
      count: Number(row.count),
    })),
    averageOrderValue: Number(averageOrderValue[0]?.avg || 0),
  };
}

export async function getProductAnalytics(dateRange?: DateRange) {
  const startDate = dateRange?.start
    ? new Date(dateRange.start)
    : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

  const topProducts = await db
    .select({
      product: products.name,
      totalSold: sql`SUM(${orderItems.quantity})`.as("total_sold"),
      revenue: sql`SUM(${orderItems.total}::numeric)`.as("revenue"),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))
    )
    .groupBy(products.id, products.name)
    .orderBy(desc(sql`SUM(${orderItems.total}::numeric)`))
    .limit(10);

  const categoryPerformance = await db
    .select({
      category: categories.name,
      revenue: sql`SUM(${orderItems.total}::numeric)`.as("revenue"),
      orderCount: sql`COUNT(DISTINCT(${orders.id}))`.as("order_count"),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))
    )
    .groupBy(categories.id, categories.name)
    .orderBy(desc(sql`SUM(${orderItems.total}::numeric)`));

  return {
    topProducts: topProducts.map((row) => ({
      product: row.product,
      totalSold: Number(row.totalSold),
      revenue: Number(row.revenue),
    })),
    categoryPerformance: categoryPerformance.map((row) => ({
      category: row.category,
      revenue: Number(row.revenue),
      orderCount: Number(row.orderCount),
    })),
  };
}

export async function getCustomerAnalytics(dateRange?: DateRange) {
  const startDate = dateRange?.start
    ? new Date(dateRange.start)
    : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

  const newCustomers = await db
    .select({
      date: sql`TO_CHAR(${users.createdAt}, 'YYYY-MM-DD')`.as("date"),
      count: sql`COUNT(${users.id})`.as("count"),
    })
    .from(users)
    .where(
      and(gte(users.createdAt, startDate), lte(users.createdAt, endDate))
    )
    .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM-DD')`);

  const totalCustomers = await db
    .select({
      total: sql`COUNT(${users.id})`.as("total"),
    })
    .from(users)
    .where(lte(users.createdAt, endDate));

  const repeatCustomers = await db
    .select({
      userId: orders.userId,
      orderCount: sql`COUNT(${orders.id})`.as("order_count"),
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        sql`${orders.userId} IS NOT NULL`
      )
    )
    .groupBy(orders.userId)
    .having(sql`COUNT(${orders.id}) > 1`);

  const totalCustomerCount = Number(totalCustomers[0]?.total || 0);
  const repeatRate =
    totalCustomerCount > 0
      ? (repeatCustomers.length / totalCustomerCount) * 100
      : 0;

  return {
    newCustomers: newCustomers.map((row) => ({
      date: String(row.date),
      count: Number(row.count),
    })),
    totalCustomers: Number(totalCustomers[0]?.total || 0),
    repeatRate: Math.round(repeatRate * 100) / 100,
  };
}
