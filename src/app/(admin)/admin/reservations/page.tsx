"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  getReservations,
  updateReservationStatus,
} from "@/app/actions/admin";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

type Reservation = {
  id: number;
  reservationNumber: string;
  type: string;
  status: string;
  totalAmount: string;
  paidAmount: string | null;
  remainingAmount: string | null;
  expiresAt: Date | null;
  createdAt: Date | null;
  customerName: string;
  customerEmail: string;
};

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "hold", label: "Hold" },
  { value: "layaway", label: "Layaway" },
  { value: "appointment", label: "Appointment" },
];

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const typeColors: Record<string, string> = {
  hold: "bg-blue-100 text-blue-800",
  layaway: "bg-purple-100 text-purple-800",
  appointment: "bg-green-100 text-green-800",
};

const statusColors: Record<string, string> = {
  active: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadReservations();
  }, [page, typeFilter, statusFilter]);

  async function loadReservations() {
    setLoading(true);
    const data = await getReservations({
      page,
      limit: 10,
      type: typeFilter,
      status: statusFilter,
    });
    setReservations(data.reservations);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }

  async function handleStatusUpdate(id: number, newStatus: string) {
    setUpdatingId(id);
    await updateReservationStatus(id, newStatus);
    loadReservations();
    setUpdatingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
        <Button variant="outline" onClick={loadReservations}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {total} Reservation{total !== 1 ? "s" : ""} Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No reservations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Reservation #</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Paid</th>
                    <th className="pb-3 font-medium">Remaining</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b last:border-0">
                      <td className="py-4 font-medium text-sm">
                        {reservation.reservationNumber}
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm font-medium">
                            {reservation.customerName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {reservation.customerEmail}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            typeColors[reservation.type] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {reservation.type}
                        </span>
                      </td>
                      <td className="py-4 text-sm font-medium">
                        {formatPrice(Number(reservation.totalAmount))}
                      </td>
                      <td className="py-4 text-sm text-green-600">
                        {formatPrice(Number(reservation.paidAmount))}
                      </td>
                      <td className="py-4 text-sm text-orange-600">
                        {formatPrice(Number(reservation.remainingAmount))}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            statusColors[reservation.status] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {reservation.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {reservation.createdAt
                          ? formatDate(reservation.createdAt)
                          : "N/A"}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          {reservation.status === "active" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(reservation.id, "completed")
                                }
                                disabled={updatingId === reservation.id}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(reservation.id, "cancelled")
                                }
                                disabled={updatingId === reservation.id}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <select
                            value={reservation.status}
                            onChange={(e) =>
                              handleStatusUpdate(reservation.id, e.target.value)
                            }
                            disabled={updatingId === reservation.id}
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
