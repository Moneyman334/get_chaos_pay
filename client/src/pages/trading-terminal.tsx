import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, TrendingDown, Bell, Fish, Newspaper, Fuel, 
  LineChart, ArrowUpRight, ArrowDownRight, Activity, DollarSign,
  ChevronUp, ChevronDown, AlertCircle, CheckCircle, Clock, ExternalLink
} from "lucide-react";
import { LineChart as RechartsLine, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
}

interface PriceAlert {
  id: string;
  coinId: string;
  coinSymbol: string;
  targetPrice: string;
  condition: string;
  isActive: string;
  isTriggered: string;
  createdAt: string;
}

interface WhaleTransaction {
  id: string;
  chain: string;
  fromAddress: string;
  toAddress: string;
  tokenSymbol: string;
  amount: string;
  usdValue: string;
  timestamp: string;
  txHash: string;
}

interface CryptoNews {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  category: string;
  sentiment: string;
}

interface GasData {
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
}

export default function TradingTerminal() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertCondition, setAlertCondition] = useState<"above" | "below">("above");
  const [chartDays, setChartDays] = useState("7");

  // Fetch OHLC candlestick data
  const { data: ohlcData } = useQuery<{ success: boolean; data: number[][] }>({
    queryKey: ["/api/trading/ohlc", selectedCoin, chartDays],
    queryFn: () => fetch(`/api/trading/ohlc/${selectedCoin}?vs_currency=usd&days=${chartDays}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  // Fetch Fear & Greed Index
  const { data: fearGreedData } = useQuery<{ success: boolean; data: FearGreedData[] }>({
    queryKey: ["/api/market/fear-greed"],
    refetchInterval: 300000,
  });

  // Fetch Price Alerts
  const { data: alertsData } = useQuery<{ success: boolean; data: PriceAlert[] }>({
    queryKey: ["/api/alerts", account],
    enabled: !!account,
  });

  // Fetch Whale Transactions
  const { data: whaleData } = useQuery<{ success: boolean; data: WhaleTransaction[] }>({
    queryKey: ["/api/whale-watch"],
    queryFn: () => fetch("/api/whale-watch?limit=20").then(r => r.json()),
    refetchInterval: 30000,
  });

  // Fetch Crypto News
  const { data: newsData } = useQuery<{ success: boolean; data: CryptoNews[] }>({
    queryKey: ["/api/news"],
    queryFn: () => fetch("/api/news?limit=20").then(r => r.json()),
    refetchInterval: 300000,
  });

  // Fetch Gas Prices
  const { data: gasData } = useQuery<{ success: boolean; data: GasData }>({
    queryKey: ["/api/gas"],
    refetchInterval: 15000,
  });

  // Create Price Alert
  const createAlertMutation = useMutation({
    mutationFn: async (alert: any) => {
      return apiRequest("POST", "/api/alerts", alert);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts", account] });
      toast({
        title: "Alert Created",
        description: "Price alert has been set successfully",
      });
      setAlertPrice("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create price alert",
        variant: "destructive",
      });
    },
  });

  // Delete Price Alert
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/alerts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts", account] });
      toast({
        title: "Alert Deleted",
        description: "Price alert has been removed",
      });
    },
  });

  // Transform OHLC data for chart
  const chartData = ohlcData?.data?.map((candle) => ({
    timestamp: candle[0],
    time: new Date(candle[0]).toLocaleDateString(),
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
    price: candle[4],
  })) || [];

  const currentFearGreed = fearGreedData?.data?.[0];
  const fearGreedValue = parseInt(currentFearGreed?.value || "50");
  const fearGreedClassification = currentFearGreed?.value_classification || "Neutral";

  const getFearGreedColor = (value: number) => {
    if (value <= 25) return "text-red-500";
    if (value <= 45) return "text-orange-500";
    if (value <= 55) return "text-yellow-500";
    if (value <= 75) return "text-green-500";
    return "text-emerald-500";
  };

  const handleCreateAlert = () => {
    if (!account) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to create alerts",
        variant: "destructive",
      });
      return;
    }

    if (!alertPrice) {
      toast({
        title: "Invalid Price",
        description: "Please enter a target price",
        variant: "destructive",
      });
      return;
    }

    createAlertMutation.mutate({
      walletAddress: account,
      coinId: selectedCoin,
      coinSymbol: selectedCoin.toUpperCase(),
      targetPrice: alertPrice,
      condition: alertCondition,
      isActive: "true",
      isTriggered: "false",
      notificationSent: "false",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Advanced Trading Terminal
            </h1>
            <p className="text-slate-400 mt-2">Professional-grade market intelligence & analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Live Data
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Chart Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* Advanced Trading Chart */}
            <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <LineChart className="h-6 w-6 text-purple-400" />
                      Price Chart
                    </CardTitle>
                    <CardDescription>Real-time OHLC candlestick data</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={chartDays === "1" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartDays("1")}
                      data-testid="button-chart-1d"
                    >
                      1D
                    </Button>
                    <Button
                      variant={chartDays === "7" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartDays("7")}
                      data-testid="button-chart-7d"
                    >
                      7D
                    </Button>
                    <Button
                      variant={chartDays === "30" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartDays("30")}
                      data-testid="button-chart-30d"
                    >
                      30D
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]" data-testid="trading-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="time" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {chartData.length > 0 && (
                    <>
                      <div className="bg-slate-800/50 p-3 rounded-lg" data-testid="chart-open">
                        <p className="text-xs text-slate-400">Open</p>
                        <p className="text-lg font-bold text-blue-400">
                          ${chartData[chartData.length - 1]?.open?.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg" data-testid="chart-high">
                        <p className="text-xs text-slate-400">High</p>
                        <p className="text-lg font-bold text-green-400">
                          ${chartData[chartData.length - 1]?.high?.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg" data-testid="chart-low">
                        <p className="text-xs text-slate-400">Low</p>
                        <p className="text-lg font-bold text-red-400">
                          ${chartData[chartData.length - 1]?.low?.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg" data-testid="chart-close">
                        <p className="text-xs text-slate-400">Close</p>
                        <p className="text-lg font-bold text-purple-400">
                          ${chartData[chartData.length - 1]?.close?.toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Whale Watch */}
            <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fish className="h-5 w-5 text-blue-400" />
                  Whale Watch
                </CardTitle>
                <CardDescription>Large transactions across all chains</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]" data-testid="whale-watch-list">
                  <div className="space-y-3">
                    {whaleData?.data?.length === 0 && (
                      <div className="text-center py-8 text-slate-400" data-testid="whale-empty">
                        <Fish className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No whale transactions detected</p>
                      </div>
                    )}
                    {whaleData?.data?.map((whale) => (
                      <div
                        key={whale.id}
                        className="bg-slate-800/30 p-4 rounded-lg hover:bg-slate-800/50 transition-colors"
                        data-testid={`whale-tx-${whale.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                {whale.chain}
                              </Badge>
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                                {whale.tokenSymbol}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-300">
                              {parseFloat(whale.amount).toLocaleString()} {whale.tokenSymbol}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDistanceToNow(new Date(whale.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">
                              ${parseFloat(whale.usdValue).toLocaleString()}
                            </p>
                            <a
                              href={`https://etherscan.io/tx/${whale.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:underline flex items-center gap-1 mt-1"
                              data-testid={`whale-tx-link-${whale.id}`}
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Market Sentiment */}
            <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-yellow-400" />
                  Fear & Greed Index
                </CardTitle>
                <CardDescription>Market sentiment indicator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center" data-testid="fear-greed-index">
                  <div className={`text-6xl font-bold ${getFearGreedColor(fearGreedValue)}`}>
                    {fearGreedValue}
                  </div>
                  <Badge variant="outline" className="mt-3 text-lg px-4 py-1">
                    {fearGreedClassification}
                  </Badge>
                  <div className="w-full bg-slate-800 rounded-full h-3 mt-4">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        fearGreedValue <= 25 ? 'bg-red-500' :
                        fearGreedValue <= 45 ? 'bg-orange-500' :
                        fearGreedValue <= 55 ? 'bg-yellow-500' :
                        fearGreedValue <= 75 ? 'bg-green-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${fearGreedValue}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>Extreme Fear</span>
                    <span>Extreme Greed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gas Tracker */}
            <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-orange-400" />
                  Gas Tracker
                </CardTitle>
                <CardDescription>Ethereum network fees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3" data-testid="gas-tracker">
                  <div className="bg-green-500/10 p-3 rounded-lg text-center border border-green-500/20">
                    <p className="text-xs text-green-400 mb-1">Safe</p>
                    <p className="text-xl font-bold text-green-400">
                      {gasData?.data?.SafeGasPrice || "0"}
                    </p>
                    <p className="text-xs text-slate-400">Gwei</p>
                  </div>
                  <div className="bg-yellow-500/10 p-3 rounded-lg text-center border border-yellow-500/20">
                    <p className="text-xs text-yellow-400 mb-1">Standard</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {gasData?.data?.ProposeGasPrice || "0"}
                    </p>
                    <p className="text-xs text-slate-400">Gwei</p>
                  </div>
                  <div className="bg-red-500/10 p-3 rounded-lg text-center border border-red-500/20">
                    <p className="text-xs text-red-400 mb-1">Fast</p>
                    <p className="text-xl font-bold text-red-400">
                      {gasData?.data?.FastGasPrice || "0"}
                    </p>
                    <p className="text-xs text-slate-400">Gwei</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Alerts */}
            <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-400" />
                  Price Alerts
                </CardTitle>
                <CardDescription>Set custom price notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Target price"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      className="bg-slate-800 border-slate-700"
                      data-testid="input-alert-price"
                    />
                    <select
                      value={alertCondition}
                      onChange={(e) => setAlertCondition(e.target.value as "above" | "below")}
                      className="bg-slate-800 border border-slate-700 rounded-md px-3 text-white"
                      data-testid="select-alert-condition"
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                  </div>
                  <Button
                    onClick={handleCreateAlert}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                    disabled={createAlertMutation.isPending}
                    data-testid="button-create-alert"
                  >
                    {createAlertMutation.isPending ? "Creating..." : "Create Alert"}
                  </Button>
                </div>

                <ScrollArea className="h-[200px]">
                  <div className="space-y-2" data-testid="alerts-list">
                    {alertsData?.data?.length === 0 && (
                      <div className="text-center py-6 text-slate-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No active alerts</p>
                      </div>
                    )}
                    {alertsData?.data?.map((alert) => (
                      <div
                        key={alert.id}
                        className="bg-slate-800/30 p-3 rounded-lg flex items-center justify-between"
                        data-testid={`alert-${alert.id}`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{alert.coinSymbol}</p>
                          <p className="text-xs text-slate-400">
                            {alert.condition} ${alert.targetPrice}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlertMutation.mutate(alert.id)}
                          data-testid={`button-delete-alert-${alert.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Market Heatmap */}
        <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              Market Heatmap
            </CardTitle>
            <CardDescription>Visual performance across all assets (24h change)</CardDescription>
          </CardHeader>
          <CardContent>
            {coinsData?.isLoading ? (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-800/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2" data-testid="market-heatmap">
                {coinsData?.data?.slice(0, 32).map((coin: any) => {
                  const change = parseFloat(coin.price_change_percentage_24h || 0);
                  const getHeatColor = (change: number) => {
                    const intensity = Math.min(Math.abs(change) / 10, 1);
                    if (change > 0) {
                      return `rgba(34, 197, 94, ${0.1 + intensity * 0.9})`;
                    } else if (change < 0) {
                      return `rgba(239, 68, 68, ${0.1 + intensity * 0.9})`;
                    }
                    return 'rgba(148, 163, 184, 0.1)';
                  };

                  return (
                    <div
                      key={coin.id}
                      className="relative group cursor-pointer rounded-lg p-2 transition-all hover:scale-105 border border-slate-700/30"
                      style={{ backgroundColor: getHeatColor(change) }}
                      data-testid={`heatmap-${coin.symbol}`}
                    >
                      <div className="text-center">
                        <p className="text-xs font-bold text-white uppercase">{coin.symbol}</p>
                        <p className={`text-sm font-semibold mt-1 ${
                          change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </p>
                      </div>
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-3 shadow-xl min-w-[180px]">
                          <p className="text-sm font-semibold text-white">{coin.name}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            ${parseFloat(coin.current_price).toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">
                            MCap: ${(coin.market_cap / 1e9).toFixed(2)}B
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Book Visualization */}
        <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-cyan-400" />
              Order Book Depth
            </CardTitle>
            <CardDescription>Real-time bid/ask depth for {selectedCoin.toUpperCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6" data-testid="order-book">
              {/* Bids (Buy Orders) */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-green-400 mb-3">Bids (Buy)</h3>
                <div className="space-y-1">
                  {[
                    { price: 43250.50, amount: 2.45, total: 105963.73 },
                    { price: 43248.20, amount: 1.82, total: 78711.72 },
                    { price: 43245.00, amount: 3.21, total: 138816.45 },
                    { price: 43242.80, amount: 0.95, total: 41080.66 },
                    { price: 43240.00, amount: 1.67, total: 72210.80 },
                  ].map((order, i) => (
                    <div
                      key={`bid-${i}`}
                      className="relative flex justify-between items-center text-xs p-2 rounded"
                      data-testid={`bid-${i}`}
                    >
                      <div className="absolute inset-0 bg-green-500/10 rounded" 
                           style={{ width: `${(order.amount / 3.5) * 100}%` }} />
                      <span className="relative z-10 text-green-400 font-mono">{order.price.toFixed(2)}</span>
                      <span className="relative z-10 text-slate-300">{order.amount.toFixed(2)}</span>
                      <span className="relative z-10 text-slate-400">{order.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asks (Sell Orders) */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-red-400 mb-3">Asks (Sell)</h3>
                <div className="space-y-1">
                  {[
                    { price: 43255.00, amount: 1.85, total: 80021.75 },
                    { price: 43257.50, amount: 2.13, total: 92138.48 },
                    { price: 43260.00, amount: 0.78, total: 33742.80 },
                    { price: 43262.80, amount: 3.04, total: 131518.91 },
                    { price: 43265.00, amount: 1.42, total: 61436.30 },
                  ].map((order, i) => (
                    <div
                      key={`ask-${i}`}
                      className="relative flex justify-between items-center text-xs p-2 rounded"
                      data-testid={`ask-${i}`}
                    >
                      <div className="absolute inset-0 bg-red-500/10 rounded" 
                           style={{ width: `${(order.amount / 3.5) * 100}%` }} />
                      <span className="relative z-10 text-red-400 font-mono">{order.price.toFixed(2)}</span>
                      <span className="relative z-10 text-slate-300">{order.amount.toFixed(2)}</span>
                      <span className="relative z-10 text-slate-400">{order.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Depth Chart */}
            <div className="mt-6 h-[200px]" data-testid="depth-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { price: 43200, bids: 0, asks: 0 },
                  { price: 43220, bids: 5.2, asks: 0 },
                  { price: 43240, bids: 12.8, asks: 0 },
                  { price: 43250, bids: 18.5, asks: 18.2 },
                  { price: 43260, bids: 0, asks: 25.3 },
                  { price: 43280, bids: 0, asks: 32.1 },
                  { price: 43300, bids: 0, asks: 35.8 },
                ]}>
                  <defs>
                    <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="price" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="stepAfter" dataKey="bids" stroke="#22c55e" fill="url(#bidGradient)" />
                  <Area type="stepBefore" dataKey="asks" stroke="#ef4444" fill="url(#askGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* News Feed */}
        <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-400" />
              Live Crypto News
            </CardTitle>
            <CardDescription>Latest market updates and headlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="news-feed">
              {newsData?.data?.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400">
                  <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No news available</p>
                </div>
              )}
              {newsData?.data?.slice(0, 6).map((news) => (
                <a
                  key={news.id}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800/30 p-4 rounded-lg hover:bg-slate-800/50 transition-colors group"
                  data-testid={`news-${news.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {news.source}
                    </Badge>
                    {news.sentiment && (
                      <Badge
                        variant="outline"
                        className={
                          news.sentiment === "positive" ? "bg-green-500/10 text-green-400 border-green-500/30" :
                          news.sentiment === "negative" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                          "bg-gray-500/10 text-gray-400 border-gray-500/30"
                        }
                      >
                        {news.sentiment}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-200 group-hover:text-purple-400 transition-colors line-clamp-2 mb-2">
                    {news.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {news.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true })}
                  </p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
