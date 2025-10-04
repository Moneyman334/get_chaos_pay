import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useAnalytics, usePageTracking } from "@/hooks/use-analytics";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  LineChart
} from "lucide-react";

const TRADING_PAIRS = [
  { id: 'BTC-USD', name: 'Bitcoin', symbol: 'BTC', quote: 'USD' },
  { id: 'ETH-USD', name: 'Ethereum', symbol: 'ETH', quote: 'USD' },
  { id: 'SOL-USD', name: 'Solana', symbol: 'SOL', quote: 'USD' },
  { id: 'MATIC-USD', name: 'Polygon', symbol: 'MATIC', quote: 'USD' },
  { id: 'LINK-USD', name: 'Chainlink', symbol: 'LINK', quote: 'USD' },
  { id: 'UNI-USD', name: 'Uniswap', symbol: 'UNI', quote: 'USD' },
  { id: 'AAVE-USD', name: 'Aave', symbol: 'AAVE', quote: 'USD' },
  { id: 'ATOM-USD', name: 'Cosmos', symbol: 'ATOM', quote: 'USD' },
];

const ORDER_TYPES = [
  { value: 'market', label: 'Market Order', desc: 'Execute immediately at current price' },
  { value: 'limit', label: 'Limit Order', desc: 'Execute at specific price or better' },
  { value: 'stop_loss', label: 'Stop Loss', desc: 'Sell when price drops to limit losses' },
  { value: 'take_profit', label: 'Take Profit', desc: 'Sell when price reaches target profit' },
];

export default function TradePage() {
  usePageTracking('/trade');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  const { trackAction, trackEvent } = useAnalytics();
  
  const [selectedPair, setSelectedPair] = useState(preferences.trading.defaultTradingPair);
  const [orderType, setOrderType] = useState(preferences.trading.defaultOrderType);
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');

  // Get real-time price
  const { data: priceData, refetch: refetchPrice } = useQuery<any>({
    queryKey: ['/api/prices/ticker', selectedPair],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Get order book
  const { data: orderBook } = useQuery<any>({
    queryKey: ['/api/trading/orderbook', selectedPair],
    refetchInterval: 3000,
  });

  // Get user's open orders
  const { data: openOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/trading/orders/open'],
    refetchInterval: 5000,
  });

  // Get order history
  const { data: orderHistory = [] } = useQuery<any[]>({
    queryKey: ['/api/trading/orders/history'],
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      trackAction('place_order', 'trading', {
        pair: orderData.pair,
        side: orderData.side,
        type: orderData.type,
        amount: orderData.amount
      });
      const response = await apiRequest('POST', '/api/trading/orders', orderData);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading/orders/open'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trading/orders/history'] });
      trackEvent('order_placed', 'trading', {
        pair: variables.pair,
        side: variables.side,
        type: variables.type
      });
      setAmount('');
      setLimitPrice('');
      setStopPrice('');
      if (preferences.trading.soundEnabled) {
        // Play success sound if enabled
      }
      toast({
        title: "Order Placed",
        description: `${orderSide.toUpperCase()} order for ${selectedPair} submitted successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      trackAction('cancel_order', 'trading', { orderId });
      const response = await fetch(`/api/trading/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to cancel order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading/orders/open'] });
      trackEvent('order_cancelled', 'trading');
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancel Failed",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid limit price",
        variant: "destructive",
      });
      return;
    }

    if (orderType === 'stop_loss' && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      toast({
        title: "Invalid Stop Price",
        description: "Please enter a valid stop price",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      pair: selectedPair,
      side: orderSide,
      type: orderType,
      amount: parseFloat(amount),
      ...(orderType === 'limit' && { limitPrice: parseFloat(limitPrice) }),
      ...(orderType === 'stop_loss' && { stopPrice: parseFloat(stopPrice) }),
      ...(orderType === 'take_profit' && { targetPrice: parseFloat(limitPrice) }),
    };

    placeOrderMutation.mutate(orderData);
  };

  const currentPrice = priceData?.price ? parseFloat(priceData.price) : 0;
  const priceChange24h = priceData?.change24h ? parseFloat(priceData.change24h) : 0;
  const totalValue = amount && currentPrice ? (parseFloat(amount) * currentPrice).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Buy & Trade Crypto
            </h1>
            <p className="text-muted-foreground">Advanced trading platform with real-time execution</p>
          </div>
          <Button 
            onClick={() => refetchPrice()} 
            variant="outline"
            className="gap-2"
            data-testid="button-refresh-price"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Prices
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Price Chart & Order Book */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Ticker */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Select value={selectedPair} onValueChange={setSelectedPair}>
                      <SelectTrigger className="w-[200px]" data-testid="select-trading-pair">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRADING_PAIRS.map(pair => (
                          <SelectItem key={pair.id} value={pair.id}>
                            {pair.name} ({pair.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant={priceChange24h >= 0 ? "default" : "destructive"} className="text-lg px-4 py-2">
                    {priceChange24h >= 0 ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
                    {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" data-testid="text-current-price">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground">24h High</p>
                      <p className="text-lg font-semibold">${priceData?.high24h || '0.00'}</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground">24h Low</p>
                      <p className="text-lg font-semibold">${priceData?.low24h || '0.00'}</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground">24h Volume</p>
                      <p className="text-lg font-semibold">${priceData?.volume24h || '0'}</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs text-muted-foreground">Market Cap</p>
                      <p className="text-lg font-semibold">${priceData?.marketCap || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Book */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Order Book
                </CardTitle>
                <CardDescription>Real-time buy and sell orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Bids */}
                  <div>
                    <h3 className="text-sm font-semibold text-green-500 mb-2 flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" />
                      Bids (Buy)
                    </h3>
                    <div className="space-y-1">
                      {orderBook?.bids?.slice(0, 10).map((bid: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm p-1 hover:bg-green-500/10 rounded">
                          <span className="text-green-500">${bid.price}</span>
                          <span className="text-muted-foreground">{bid.size}</span>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">No bids available</p>}
                    </div>
                  </div>

                  {/* Asks */}
                  <div>
                    <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4" />
                      Asks (Sell)
                    </h3>
                    <div className="space-y-1">
                      {orderBook?.asks?.slice(0, 10).map((ask: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm p-1 hover:bg-red-500/10 rounded">
                          <span className="text-red-500">${ask.price}</span>
                          <span className="text-muted-foreground">{ask.size}</span>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">No asks available</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Forms */}
          <div className="space-y-6">
            {/* Buy/Sell Form */}
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Place Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Side Tabs */}
                <Tabs value={orderSide} onValueChange={(val) => setOrderSide(val as 'buy' | 'sell')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy" className="data-[state=active]:bg-green-500" data-testid="tab-buy">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="data-[state=active]:bg-red-500" data-testid="tab-sell">
                      <ArrowDownRight className="h-4 w-4 mr-2" />
                      Sell
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Order Type */}
                <div className="space-y-2">
                  <Label>Order Type</Label>
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger data-testid="select-order-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <p className="font-medium">{type.label}</p>
                            <p className="text-xs text-muted-foreground">{type.desc}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({selectedPair.split('-')[0]})</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.00000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    data-testid="input-amount"
                  />
                </div>

                {/* Limit Price (for limit orders) */}
                {(orderType === 'limit' || orderType === 'take_profit') && (
                  <div className="space-y-2">
                    <Label htmlFor="limit-price">{orderType === 'take_profit' ? 'Target Price' : 'Limit Price'} (USD)</Label>
                    <Input
                      id="limit-price"
                      type="number"
                      step="0.01"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder={`Current: $${currentPrice}`}
                      data-testid="input-limit-price"
                    />
                  </div>
                )}

                {/* Stop Price (for stop-loss) */}
                {orderType === 'stop_loss' && (
                  <div className="space-y-2">
                    <Label htmlFor="stop-price">Stop Price (USD)</Label>
                    <Input
                      id="stop-price"
                      type="number"
                      step="0.01"
                      value={stopPrice}
                      onChange={(e) => setStopPrice(e.target.value)}
                      placeholder={`Current: $${currentPrice}`}
                      data-testid="input-stop-price"
                    />
                  </div>
                )}

                {/* Order Summary */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-semibold">${totalValue} USD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Fee:</span>
                    <span className="font-semibold">~${(parseFloat(totalValue) * 0.005).toFixed(2)} (0.5%)</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={placeOrderMutation.isPending}
                  className={`w-full h-12 text-lg font-semibold ${
                    orderSide === 'buy' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  data-testid="button-place-order"
                >
                  {placeOrderMutation.isPending ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      {orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedPair.split('-')[0]}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Trading Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Open Orders</span>
                  <Badge variant="outline">{openOrders.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Trades</span>
                  <Badge variant="outline">{orderHistory.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Win Rate</span>
                  <Badge variant="default" className="bg-green-500">
                    {orderHistory.length > 0 
                      ? `${((orderHistory.filter((o: any) => o.profit > 0).length / orderHistory.length) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Open Orders & History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Orders & History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="open">
              <TabsList>
                <TabsTrigger value="open">
                  Open Orders ({openOrders.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  Order History ({orderHistory.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="space-y-4">
                {openOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No open orders</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {openOrders.map((order: any) => (
                      <div 
                        key={order.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-primary/5"
                        data-testid={`card-order-${order.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                            {order.side.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium">{order.pair}</p>
                            <p className="text-sm text-muted-foreground">{order.type} • {order.amount} @ ${order.price}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelOrderMutation.mutate(order.id)}
                          disabled={cancelOrderMutation.isPending}
                          data-testid={`button-cancel-${order.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {orderHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No order history</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderHistory.slice(0, 20).map((order: any) => (
                      <div 
                        key={order.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`card-order-${order.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                            {order.side.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium">{order.pair}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.amount} @ ${order.executedPrice} • {new Date(order.executedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${order.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {order.profit >= 0 ? '+' : ''}${order.profit?.toFixed(2) || '0.00'}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
