"use server";

import { db } from "@/db";
import {
  orders,
  orderItems,
  reservations,
  reservationItems,
} from "@/db/schema";
import { generateOrderNumber } from "@/lib/utils";
import { auth } from "@/auth";

type CartItemInput = {
  productId: number;
  variantId: number;
  name: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
};

type GuestInfo = {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
  };
};

export async function createOrder(
  items: CartItemInput[],
  guestInfo: GuestInfo,
  paymentMethod: string
) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = 99;
  const total = subtotal + shippingFee;
  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId,
      guestEmail: guestInfo.email,
      guestName: guestInfo.name,
      guestPhone: guestInfo.phone,
      status: "pending",
      subtotal: subtotal.toString(),
      shippingFee: shippingFee.toString(),
      discount: "0",
      total: total.toString(),
      paymentMethod,
      paymentStatus: "unpaid",
      shippingAddress: guestInfo.address,
      notes: null,
    })
    .returning();

  const orderItemsData = items.map((item) => ({
    orderId: order.id,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    price: item.price.toString(),
    total: (item.price * item.quantity).toString(),
  }));

  await db.insert(orderItems).values(orderItemsData);

  return { success: true, orderNumber, orderId: order.id };
}

export async function createReservation(
  items: CartItemInput[],
  guestInfo: GuestInfo,
  durationHours: number = 24
) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const reservationNumber = generateOrderNumber();
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  const [reservation] = await db
    .insert(reservations)
    .values({
      reservationNumber,
      userId,
      guestEmail: guestInfo.email,
      guestName: guestInfo.name,
      guestPhone: guestInfo.phone,
      type: "hold",
      status: "active",
      expiresAt,
      totalAmount: totalAmount.toString(),
      paidAmount: "0",
      remainingAmount: totalAmount.toString(),
      notes: null,
    })
    .returning();

  const reservationItemsData = items.map((item) => ({
    reservationId: reservation.id,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    price: item.price.toString(),
  }));

  await db.insert(reservationItems).values(reservationItemsData);

  return {
    success: true,
    reservationNumber,
    reservationId: reservation.id,
    expiresAt,
  };
}

export async function createLayaway(
  items: CartItemInput[],
  guestInfo: GuestInfo,
  downPaymentPercent: number = 20
) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const paidAmount = totalAmount * (downPaymentPercent / 100);
  const remainingAmount = totalAmount - paidAmount;
  const reservationNumber = generateOrderNumber();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [reservation] = await db
    .insert(reservations)
    .values({
      reservationNumber,
      userId,
      guestEmail: guestInfo.email,
      guestName: guestInfo.name,
      guestPhone: guestInfo.phone,
      type: "layaway",
      status: "active",
      expiresAt,
      totalAmount: totalAmount.toString(),
      paidAmount: paidAmount.toString(),
      remainingAmount: remainingAmount.toString(),
      notes: `Layaway plan: ${downPaymentPercent}% down payment`,
    })
    .returning();

  const reservationItemsData = items.map((item) => ({
    reservationId: reservation.id,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    price: item.price.toString(),
  }));

  await db.insert(reservationItems).values(reservationItemsData);

  return {
    success: true,
    reservationNumber,
    reservationId: reservation.id,
    totalAmount,
    paidAmount,
    remainingAmount,
    expiresAt,
  };
}

export async function createAppointment(
  items: CartItemInput[],
  guestInfo: GuestInfo,
  appointmentDate: Date,
  notes: string
) {
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const reservationNumber = generateOrderNumber();

  const [reservation] = await db
    .insert(reservations)
    .values({
      reservationNumber,
      userId,
      guestEmail: guestInfo.email,
      guestName: guestInfo.name,
      guestPhone: guestInfo.phone,
      type: "appointment",
      status: "active",
      totalAmount: totalAmount.toString(),
      paidAmount: "0",
      remainingAmount: totalAmount.toString(),
      appointmentDate,
      appointmentNotes: notes,
      notes: null,
    })
    .returning();

  const reservationItemsData = items.map((item) => ({
    reservationId: reservation.id,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    price: item.price.toString(),
  }));

  await db.insert(reservationItems).values(reservationItemsData);

  return {
    success: true,
    reservationNumber,
    reservationId: reservation.id,
    appointmentDate,
  };
}
