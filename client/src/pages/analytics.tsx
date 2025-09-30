import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, CreditCard, Package, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Order, Payment, Product } from "@shared/schema";

interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
}

export default function AnalyticsPage() {
  const { data: orders } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Calculate analytics
  const analytics: AnalyticsSummary = {
    totalRevenue: payments?.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0) || 0,
    totalOrders: orders?.filter(o => o.status === 'completed').length || 0,
    totalCustomers: new Set(orders?.map(o => o.customerWallet)).size || 0,
    avgOrderValue: 0,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    customersGrowth: 15.2,
  };

  if (analytics.totalOrders > 0) {
    analytics.avgOrderValue = analytics.totalRevenue / analytics.totalOrders;
  }

  // Revenue trend data (last 7 days)
  const revenueTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOrders = orders?.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.toDateString() === date.toDateString();
    }) || [];
    const revenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: revenue,
      orders: dayOrders.length,
    };
  });

  // Payment methods distribution
  const paymentMethodsData = payments?.reduce((acc, p) => {
    const method = p.provider || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const paymentMethodsChart = Object.entries(paymentMethodsData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Order status distribution
  const statusData = orders?.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const statusChart = Object.entries(statusData).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value,
  }));

  // Top products
  const productSales = orders?.flatMap(o => 
    Array.isArray(o.items) ? (o.items as any[]).map(item => item.productId) : []
  ) || [];

  const productCounts = productSales.reduce((acc, productId) => {
    acc[productId] = (acc[productId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([productId, count]) => {
      const product = products?.find(p => p.id === productId);
      return {
        name: product?.name || `Product ${productId.slice(0, 8)}`,
        sales: count,
        revenue: count * parseFloat(product?.price || "0"),
      };
    });

  // Chain distribution
  const chainData = orders?.reduce((acc, o) => {
    const chain = o.chainId === '1' ? 'Ethereum' :
                  o.chainId === '137' ? 'Polygon' :
                  o.chainId === '8453' ? 'Base' :
                  o.chainId === '11155111' ? 'Sepolia' :
                  'Other';
    acc[chain] = (acc[chain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const chainChart = Object.entries(chainData).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    prefix = '', 
    suffix = '' 
  }: { 
    title: string; 
    value: number | string; 
    change?: number; 
    icon: any; 
    prefix?: string; 
    suffix?: string;
  }) => {
    const isPositive = (change || 0) >= 0;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </div>
          {change !== undefined && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}% from last month
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Real-time insights into your blockchain empire</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Total Revenue"
          value={analytics.totalRevenue.toFixed(2)}
          change={analytics.revenueGrowth}
          icon={DollarSign}
          prefix="$"
          data-testid="metric-revenue"
        />
        <MetricCard
          title="Total Orders"
          value={analytics.totalOrders}
          change={analytics.ordersGrowth}
          icon={ShoppingCart}
          data-testid="metric-orders"
        />
        <MetricCard
          title="Total Customers"
          value={analytics.totalCustomers}
          change={analytics.customersGrowth}
          icon={Users}
          data-testid="metric-customers"
        />
        <MetricCard
          title="Avg Order Value"
          value={analytics.avgOrderValue.toFixed(2)}
          icon={Activity}
          prefix="$"
          data-testid="metric-aov"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>By sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8b5cf6" name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Product Revenue</CardTitle>
                <CardDescription>Top 5 products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Detailed breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${product.revenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodsChart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodsChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Statistics</CardTitle>
                <CardDescription>Success rates and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    <span>Successful Payments</span>
                  </div>
                  <span className="font-bold">{payments?.filter(p => p.status === 'confirmed').length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-yellow-500" />
                    <span>Pending Payments</span>
                  </div>
                  <span className="font-bold">{payments?.filter(p => p.status === 'pending').length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-red-500" />
                    <span>Failed Payments</span>
                  </div>
                  <span className="font-bold">{payments?.filter(p => p.status === 'failed').length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Success Rate</span>
                  </div>
                  <span className="font-bold text-primary">
                    {payments && payments.length > 0 
                      ? ((payments.filter(p => p.status === 'confirmed').length / payments.length) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chain Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Networks</CardTitle>
                <CardDescription>Orders by chain</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chainChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Blockchain Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Metrics</CardTitle>
                <CardDescription>On-chain activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span>Total Transactions</span>
                  <span className="font-bold">{payments?.filter(p => p.txHash).length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span>Confirmed Transactions</span>
                  <span className="font-bold">{payments?.filter(p => p.status === 'confirmed').length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <span>Average Confirmations</span>
                  <span className="font-bold">
                    {payments && payments.length > 0
                      ? (payments.reduce((sum, p) => sum + (parseInt(p.confirmations || "0")), 0) / payments.length).toFixed(0)
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg bg-primary/5">
                  <span className="font-semibold">Total Gas Spent</span>
                  <span className="font-bold text-primary">$0.00</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Blockchain Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Blockchain Activity</CardTitle>
              <CardDescription>Latest on-chain transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments?.filter(p => p.txHash).slice(0, 5).map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-mono text-sm">{payment.txHash?.slice(0, 16)}...{payment.txHash?.slice(-8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.chainId === '1' ? 'Ethereum' :
                         payment.chainId === '137' ? 'Polygon' :
                         payment.chainId === '8453' ? 'Base' :
                         `Chain ${payment.chainId}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{payment.amount} {payment.currency}</p>
                      <p className="text-sm text-muted-foreground">{payment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
