"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getOrders, updateOrderStatus } from "@/app/actions/admin";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  total: string;
  paymentStatus: string | null;
  createdAt: Date | null;
  customerName: string;
  customerEmail: string;
};

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentStatusColors: Record<string, string> = {
  unpaid: "bg-gray-100 text-gray-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-orange-100 text-orange-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  async function loadOrders() {
    setLoading(true);
    const data = await getOrders({ page, limit: 10, status: statusFilter, search });
    setOrders(data.orders);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }

  async function handleStatusUpdate(id: number, newStatus: string) {
    setUpdatingId(id);
    await updateOrderStatus(id, newStatus);
    loadOrders();
    setUpdatingId(null);
  }

  function handleSearch() {
    setPage(1);
    loadOrders();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Button variant="outline" onClick={loadOrders}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {total} Order{total !== 1 ? "s" : ""} Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Order #</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Payment</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-4 font-medium text-sm">
                        {order.orderNumber}
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm font-medium">
                            {order.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.customerEmail}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 text-sm font-medium">
                        {formatPrice(Number(order.total))}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            statusColors[order.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            paymentStatusColors[order.paymentStatus || "unpaid"] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.paymentStatus || "unpaid"}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusUpdate(order.id, e.target.value)
                            }
                            disabled={updatingId === order.id}
                            className="text-xs rounded-md border border-input bg-background px-2 py-1"
                          >
                            {statusOptions.slice(1).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
