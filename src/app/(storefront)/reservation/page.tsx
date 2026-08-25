"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cart";
import {
  createReservation,
  createLayaway,
  createAppointment,
} from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import {
  Clock,
  Wallet,
  CalendarDays,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type ReservationTab = "hold" | "layaway" | "appointment";

export default function ReservationPage() {
  const { items, getTotal, clearCart } = useCartStore();
  const [activeTab, setActiveTab] = useState<ReservationTab>("hold");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    province: "",
    zipCode: "",
    downPaymentPercent: 20,
    appointmentDate: "",
    appointmentTime: "",
    appointmentNotes: "",
  });

  const subtotal = getTotal();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getGuestInfo = () => ({
    name: form.name,
    email: form.email,
    phone: form.phone,
    address: {
      street: form.street,
      city: form.city,
      province: form.province,
      zipCode: form.zipCode,
    },
  });

  const getCartItems = () =>
    items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      size: item.size,
      color: item.color,
      price: item.price,
      quantity: item.quantity,
    }));

  const handleHoldReservation = async () => {
    setIsProcessing(true);
    try {
      const res = await createReservation(getCartItems(), getGuestInfo(), 24);
      if (res.success) {
        setResult({ type: "hold", ...res });
      }
    } catch {
      alert("Failed to create reservation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLayaway = async () => {
    setIsProcessing(true);
    try {
      const res = await createLayaway(
        getCartItems(),
        getGuestInfo(),
        form.downPaymentPercent
      );
      if (res.success) {
        setResult({ type: "layaway", ...res });
      }
    } catch {
      alert("Failed to create layaway plan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAppointment = async () => {
    setIsProcessing(true);
    try {
      const appointmentDate = new Date(
        `${form.appointmentDate}T${form.appointmentTime}`
      );
      const res = await createAppointment(
        getCartItems(),
        getGuestInfo(),
        appointmentDate,
        form.appointmentNotes
      );
      if (res.success) {
        setResult({ type: "appointment", ...res });
      }
    } catch {
      alert("Failed to book appointment.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (result) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-lg text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-bold">
            {result.type === "hold" && "Reservation Confirmed"}
            {result.type === "layaway" && "Layaway Plan Created"}
            {result.type === "appointment" && "Appointment Booked"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Reservation #: <span className="font-mono">{result.reservationNumber}</span>
          </p>
          {result.type === "hold" && (
            <p className="mt-1 text-sm text-muted-foreground">
              Expires: {new Date(result.expiresAt).toLocaleString()}
            </p>
          )}
          {result.type === "layaway" && (
            <div className="mt-4 space-y-1 text-sm">
              <p>Total: {formatPrice(result.totalAmount)}</p>
              <p>Paid: {formatPrice(result.paidAmount)}</p>
              <p>Remaining: {formatPrice(result.remainingAmount)}</p>
            </div>
          )}
          {result.type === "appointment" && (
            <p className="mt-1 text-sm text-muted-foreground">
              Date: {new Date(result.appointmentDate).toLocaleString()}
            </p>
          )}
          <div className="mt-8 space-y-3">
            <Link href="/">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold">No items to reserve</h1>
          <p className="text-muted-foreground">
            Add items to your cart before making a reservation.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/cart"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="text-3xl font-bold">Reservations</h1>
        <p className="mt-1 text-muted-foreground">
          Hold items, start a layaway plan, or book an in-store visit.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={activeTab === "hold" ? "default" : "outline"}
              onClick={() => setActiveTab("hold")}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Hold (24hrs)
            </Button>
            <Button
              variant={activeTab === "layaway" ? "default" : "outline"}
              onClick={() => setActiveTab("layaway")}
              className="flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              Layaway
            </Button>
            <Button
              variant={activeTab === "appointment" ? "default" : "outline"}
              onClick={() => setActiveTab("appointment")}
              className="flex items-center gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Appointment
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "hold" && "Hold Reservation"}
                {activeTab === "layaway" && "Layaway Plan"}
                {activeTab === "appointment" && "Book Appointment"}
              </CardTitle>
              <CardDescription>
                {activeTab === "hold" &&
                  "Reserve your items for 24 hours. No payment required now."}
                {activeTab === "layaway" &&
                  "Secure items with a partial payment. Pay the rest within 30 days."}
                {activeTab === "appointment" &&
                  "Book an in-store visit to try on items before purchasing."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Contact Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="juan@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone *</label>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="09XX XXX XXXX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Address</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Street Address</label>
                  <Input
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="123 Rizal Avenue"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Manila"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Province</label>
                    <Input
                      name="province"
                      value={form.province}
                      onChange={handleChange}
                      placeholder="Metro Manila"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ZIP Code</label>
                    <Input
                      name="zipCode"
                      value={form.zipCode}
                      onChange={handleChange}
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              {activeTab === "layaway" && (
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-medium">Down Payment</h3>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Down payment percentage
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        name="downPaymentPercent"
                        min="10"
                        max="50"
                        step="5"
                        value={form.downPaymentPercent}
                        onChange={handleChange}
                        className="flex-1 accent-primary"
                      />
                      <span className="w-12 text-center font-semibold">
                        {form.downPaymentPercent}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Down payment:{" "}
                      {formatPrice(
                        subtotal * (form.downPaymentPercent / 100)
                      )}{" "}
                      &middot; Remaining:{" "}
                      {formatPrice(
                        subtotal * (1 - form.downPaymentPercent / 100)
                      )}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "appointment" && (
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-medium">Appointment Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date *</label>
                      <Input
                        name="appointmentDate"
                        type="date"
                        value={form.appointmentDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time *</label>
                      <Input
                        name="appointmentTime"
                        type="time"
                        value={form.appointmentTime}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Notes (optional)
                    </label>
                    <Textarea
                      name="appointmentNotes"
                      value={form.appointmentNotes}
                      onChange={handleChange}
                      placeholder="Any special requests or items you'd like to try..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={isProcessing}
                onClick={
                  activeTab === "hold"
                    ? handleHoldReservation
                    : activeTab === "layaway"
                    ? handleLayaway
                    : handleAppointment
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {activeTab === "hold" && "Reserve Items (24hrs)"}
                    {activeTab === "layaway" && "Create Layaway Plan"}
                    {activeTab === "appointment" && "Book Appointment"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Your Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-[10px]">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.size && `${item.size} / `}
                        {item.color}
                        {` × ${item.quantity}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
