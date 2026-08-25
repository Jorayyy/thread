"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import {
  getSalesAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
} from "@/app/actions/analytics";

const COLORS = ["#e94560", "#1a1a2e", "#f5f5f5", "#6b7280", "#10b981", "#f59e0b"];

interface SalesData {
  salesOverTime: { date: string; revenue: number; orderCount: number }[];
  totalRevenue: number;
}

interface OrderData {
  ordersByStatus: { status: string; count: number }[];
  averageOrderValue: number;
}

interface ProductData {
  topProducts: { product: string; totalSold: number; revenue: number }[];
  categoryPerformance: {
    category: string;
    revenue: number;
    orderCount: number;
  }[];
}

interface CustomerData {
  newCustomers: { date: string; count: number }[];
  totalCustomers: number;
  repeatRate: number;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTooltipValue = (value: any) => formatPrice(Number(value));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDateLabel = (label: any) => new Date(String(label)).toLocaleDateString();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPieLabel = (props: any) => {
  const status = String(props.status || "");
  const percent = Number(props.percent || 0);
  return `${STATUS_LABELS[status] || status} (${(percent * 100).toFixed(0)}%)`;
};

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sales, setSales] = useState<SalesData | null>(null);
  const [orders, setOrders] = useState<OrderData | null>(null);
  const [products, setProducts] = useState<ProductData | null>(null);
  const [customers, setCustomers] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dateRange =
        startDate && endDate ? { start: startDate, end: endDate } : undefined;

      const [salesData, orderData, productData, customerData] =
        await Promise.all([
          getSalesAnalytics(dateRange),
          getOrderAnalytics(dateRange),
          getProductAnalytics(dateRange),
          getCustomerAnalytics(dateRange),
        ]);

      setSales(salesData as SalesData);
      setOrders(orderData as OrderData);
      setProducts(productData as ProductData);
      setCustomers(customerData as CustomerData);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleFilter = () => {
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Analytics Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Track your store performance and insights
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleFilter} className="bg-accent hover:bg-accent/90">
            Apply Filter
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(sales?.totalRevenue || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(orders?.averageOrderValue || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {customers?.totalCustomers || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Repeat Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {customers?.repeatRate || 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sales?.salesOverTime || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value: string) => {
                        const date = new Date(value);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={formatTooltipValue} labelFormatter={formatDateLabel} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#e94560"
                      strokeWidth={2}
                      dot={{ fill: "#e94560" }}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orders?.ordersByStatus || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderPieLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(orders?.ordersByStatus || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={products?.topProducts || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="product" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#e94560" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={products?.categoryPerformance || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={formatTooltipValue} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#1a1a2e" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customers?.newCustomers || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: string) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={formatDateLabel} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                    name="New Customers"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
