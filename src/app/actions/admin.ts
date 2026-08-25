"use server";

import { db } from "@/db";
import {
  products,
  productVariants,
  productImages,
  orders,
  orderItems,
  reservations,
  users,
  categories,
  inventoryLogs,
} from "@/db/schema";
import { eq, desc, asc, like, sql, and, count, sum, gte, lte } from "drizzle-orm";
import { slugify } from "@/lib/utils";

// ==================== DASHBOARD STATS ====================
export async function getDashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalSalesResult] = await db
    .select({ total: sum(orders.total) })
    .from(orders)
    .where(eq(orders.status, "delivered"));

  const [totalOrdersResult] = await db
    .select({ count: count() })
    .from(orders);

  const [totalProductsResult] = await db
    .select({ count: count() })
    .from(products);

  const [activeReservationsResult] = await db
    .select({ count: count() })
    .from(reservations)
    .where(eq(reservations.status, "active"));

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
      guestName: orders.guestName,
      userName: users.name,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const salesData = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`.as("date"),
      sales: sum(orders.total),
      count: count(),
    })
    .from(orders)
    .where(gte(orders.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(asc(sql`DATE(${orders.createdAt})`));

  const lowStockProducts = await db
    .select({
      productName: products.name,
      variantId: productVariants.id,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stock,
      sku: productVariants.sku,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(lte(productVariants.stock, 5))
    .orderBy(asc(productVariants.stock))
    .limit(10);

  return {
    totalSales: Number(totalSalesResult?.total) || 0,
    totalOrders: totalOrdersResult?.count || 0,
    totalProducts: totalProductsResult?.count || 0,
    activeReservations: activeReservationsResult?.count || 0,
    recentOrders,
    salesData,
    lowStockProducts,
  };
}

// ==================== PRODUCTS ====================
export async function getProducts({
  page = 1,
  limit = 10,
  search = "",
  categoryId,
}: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
} = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];

  if (search) {
    conditions.push(like(products.name, `%${search}%`));
  }
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: count() })
    .from(products)
    .where(where);

  const productsList = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  const productsWithStock = await Promise.all(
    productsList.map(async (product) => {
      const [stockResult] = await db
        .select({ totalStock: sum(productVariants.stock) })
        .from(productVariants)
        .where(eq(productVariants.productId, product.id));

      const primaryImage = await db
        .select({ url: productImages.url })
        .from(productImages)
        .where(
          and(
            eq(productImages.productId, product.id),
            eq(productImages.isPrimary, true)
          )
        )
        .limit(1);

      return {
        ...product,
        totalStock: Number(stockResult?.totalStock) || 0,
        image: primaryImage[0]?.url || null,
      };
    })
  );

  return {
    products: productsWithStock,
    total: totalResult?.count || 0,
    page,
    limit,
    totalPages: Math.ceil((totalResult?.count || 0) / limit),
  };
}

export async function createProduct(data: {
  name: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  categoryId: number;
  brand?: string;
  isFeatured?: boolean;
  tags?: string[];
  variants: {
    size?: string;
    color?: string;
    colorHex?: string;
    sku: string;
    price: number;
    stock: number;
  }[];
  images?: { url: string; alt?: string; isPrimary?: boolean }[];
}) {
  const slug = slugify(data.name);

  const [product] = await db
    .insert(products)
    .values({
      name: data.name,
      slug,
      description: data.description,
      shortDescription: data.shortDescription,
      basePrice: data.basePrice.toString(),
      categoryId: data.categoryId,
      brand: data.brand,
      isFeatured: data.isFeatured,
      tags: data.tags,
    })
    .returning({ id: products.id });

  if (data.variants?.length) {
    await db.insert(productVariants).values(
      data.variants.map((v) => ({
        productId: product.id,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        sku: v.sku,
        price: v.price.toString(),
        stock: v.stock,
      }))
    );
  }

  if (data.images?.length) {
    await db.insert(productImages).values(
      data.images.map((img, i) => ({
        productId: product.id,
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary ?? i === 0,
        sortOrder: i,
      }))
    );
  }

  return product;
}

export async function updateProduct(
  id: number,
  data: {
    name?: string;
    description?: string;
    shortDescription?: string;
    basePrice?: number;
    categoryId?: number;
    brand?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    tags?: string[];
  }
) {
  const updateData: Record<string, any> = { ...data };
  if (data.basePrice !== undefined) {
    updateData.basePrice = data.basePrice.toString();
  }
  updateData.updatedAt = new Date();

  await db.update(products).set(updateData).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  await db.delete(productImages).where(eq(productImages.productId, id));
  await db.delete(productVariants).where(eq(productVariants.productId, id));
  await db.delete(products).where(eq(products.id, id));
}

// ==================== ORDERS ====================
export async function getOrders({
  page = 1,
  limit = 10,
  status,
  search,
}: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];

  if (status) {
    conditions.push(eq(orders.status, status));
  }
  if (search) {
    conditions.push(
      sql`(${orders.orderNumber} ILIKE ${`%${search}%`} OR ${orders.guestName} ILIKE ${`%${search}%`})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(where);

  const ordersList = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      guestName: orders.guestName,
      guestEmail: orders.guestEmail,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    orders: ordersList.map((o) => ({
      ...o,
      customerName: o.userName || o.guestName || "Guest",
      customerEmail: o.userEmail || o.guestEmail || "",
    })),
    total: totalResult?.count || 0,
    page,
    limit,
    totalPages: Math.ceil((totalResult?.count || 0) / limit),
  };
}

export async function updateOrderStatus(id: number, status: string) {
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));
}

// ==================== RESERVATIONS ====================
export async function getReservations({
  page = 1,
  limit = 10,
  type,
  status,
}: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
} = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];

  if (type) {
    conditions.push(eq(reservations.type, type));
  }
  if (status) {
    conditions.push(eq(reservations.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: count() })
    .from(reservations)
    .where(where);

  const reservationsList = await db
    .select({
      id: reservations.id,
      reservationNumber: reservations.reservationNumber,
      type: reservations.type,
      status: reservations.status,
      totalAmount: reservations.totalAmount,
      paidAmount: reservations.paidAmount,
      remainingAmount: reservations.remainingAmount,
      expiresAt: reservations.expiresAt,
      createdAt: reservations.createdAt,
      guestName: reservations.guestName,
      guestEmail: reservations.guestEmail,
      userName: users.name,
      userEmail: users.email,
    })
    .from(reservations)
    .leftJoin(users, eq(reservations.userId, users.id))
    .where(where)
    .orderBy(desc(reservations.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    reservations: reservationsList.map((r) => ({
      ...r,
      customerName: r.userName || r.guestName || "Guest",
      customerEmail: r.userEmail || r.guestEmail || "",
    })),
    total: totalResult?.count || 0,
    page,
    limit,
    totalPages: Math.ceil((totalResult?.count || 0) / limit),
  };
}

export async function updateReservationStatus(id: number, status: string) {
  await db
    .update(reservations)
    .set({ status, updatedAt: new Date() })
    .where(eq(reservations.id, id));
}

// ==================== CUSTOMERS ====================
export async function getCustomers({
  page = 1,
  limit = 10,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) {
  const offset = (page - 1) * limit;
  const conditions = [eq(users.role, "customer")];

  if (search) {
    conditions.push(
      sql`(${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`})`
    );
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ count: count() })
    .from(users)
    .where(where);

  const customersList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const customersWithStats = await Promise.all(
    customersList.map(async (customer) => {
      const [ordersResult] = await db
        .select({ count: count(), total: sum(orders.total) })
        .from(orders)
        .where(eq(orders.userId, customer.id));

      return {
        ...customer,
        ordersCount: ordersResult?.count || 0,
        totalSpent: Number(ordersResult?.total) || 0,
      };
    })
  );

  return {
    customers: customersWithStats,
    total: totalResult?.count || 0,
    page,
    limit,
    totalPages: Math.ceil((totalResult?.count || 0) / limit),
  };
}

// ==================== CATEGORIES ====================
export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}
