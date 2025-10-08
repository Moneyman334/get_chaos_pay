import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle, Shield, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function MarginTradingPage() {
  const { toast } = useToast();
  const [tradingPair, setTradingPair] = useState("ETH/USDT");
  const [side, setSide] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState(10);
  const [collateral, setCollateral] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [entryPrice, setEntryPrice] = useState("");

  // Fetch user positions
  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ['/api/margin/positions'],
  });

  // Fetch leverage settings
  const { data: settings } = useQuery({
    queryKey: ['/api/margin/settings'],
  });

  // Fetch risk metrics
  const { data: riskMetrics } = useQuery({
    queryKey: ['/api/margin/risk-metrics'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch liquidation history
  const { data: liquidationData } = useQuery({
    queryKey: ['/api/margin/liquidations'],
  });

  // Open position mutation
  const openPositionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/margin/positions/open', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Position Opened",
        description: "Your margin position has been successfully opened.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/margin/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/margin/risk-metrics'] });
      setCollateral("");
      setPositionSize("");
      setEntryPrice("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Open Position",
        description: error.message || "An error occurred while opening your position.",
        variant: "destructive",
      });
    },
  });

  // Close position mutation
  const closePositionMutation = useMutation({
    mutationFn: async ({ positionId, closePrice, realizedPnl }: any) => {
      return apiRequest(`/api/margin/positions/${positionId}/close`, 'POST', {
        closePrice,
        realizedPnl,
      });
    },
    onSuccess: () => {
      toast({
        title: "Position Closed",
        description: "Your position has been successfully closed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/margin/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/margin/risk-metrics'] });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/margin/settings', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your leverage settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/margin/settings'] });
    },
  });

  // Calculate liquidation price
  const calculateLiquidationPrice = () => {
    if (!entryPrice || !collateral || !positionSize || !leverage) return 0;
    
    const entry = parseFloat(entryPrice);
    const coll = parseFloat(collateral);
    const size = parseFloat(positionSize);
    const lev = leverage;
    
    if (side === 'long') {
      // Long liquidation: entry - (collateral / position size)
      return entry - (coll / size);
    } else {
      // Short liquidation: entry + (collateral / position size)
      return entry + (coll / size);
    }
  };

  const handleOpenPosition = () => {
    if (!collateral || !positionSize || !entryPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all position details.",
        variant: "destructive",
      });
      return;
    }

    const liquidationPrice = calculateLiquidationPrice();

    openPositionMutation.mutate({
      tradingPair,
      side,
      leverage: String(leverage),
      entryPrice,
      currentPrice: entryPrice,
      positionSize,
      collateral,
      liquidationPrice: String(liquidationPrice),
      unrealizedPnl: "0",
      fees: "0",
      marginType: settings?.marginMode || 'isolated',
    });
  };

  const handleClosePosition = (position: any) => {
    // Use current price as close price (in production, get from price feed)
    const closePrice = position.currentPrice;
    const entryPrice = parseFloat(position.entryPrice);
    const positionSize = parseFloat(position.positionSize);
    
    let realizedPnl;
    if (position.side === 'long') {
      realizedPnl = String((parseFloat(closePrice) - entryPrice) * positionSize);
    } else {
      realizedPnl = String((entryPrice - parseFloat(closePrice)) * positionSize);
    }

    closePositionMutation.mutate({
      positionId: position.id,
      closePrice,
      realizedPnl,
    });
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Critical</Badge>;
      case 'warning':
        return <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-500"><AlertTriangle className="w-3 h-3" /> Warning</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-500"><Shield className="w-3 h-3" /> Safe</Badge>;
    }
  };

  const openPositions = positions.filter((p: any) => p.status === 'open');
  const closedPositions = positions.filter((p: any) => p.status === 'closed' || p.status === 'liquidated');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Margin / Futures Trading
          </h1>
          <p className="text-gray-400">Trade with leverage up to {settings?.maxLeverage || '20'}x</p>
        </div>

        {/* Risk Metrics Overview */}
        {riskMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Total Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{riskMetrics.totalPositions}</p>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Safe Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-400">{riskMetrics.safePositions}</p>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-yellow-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Warning Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-400">{riskMetrics.warningPositions}</p>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-red-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-400">Critical Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-400">{riskMetrics.criticalPositions}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="trade" className="space-y-6">
          <TabsList className="bg-black/60">
            <TabsTrigger value="trade" data-testid="tab-trade">Open Position</TabsTrigger>
            <TabsTrigger value="positions" data-testid="tab-positions">My Positions ({openPositions.length})</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* Open Position Tab */}
          <TabsContent value="trade">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Open Margin Position</CardTitle>
                <CardDescription>Trade with leverage - higher risk, higher reward</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trading Pair Selection */}
                <div className="space-y-2">
                  <Label htmlFor="trading-pair" className="text-white">Trading Pair</Label>
                  <Select value={tradingPair} onValueChange={setTradingPair}>
                    <SelectTrigger data-testid="select-trading-pair">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                      <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                      <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                      <SelectItem value="MATIC/USDT">MATIC/USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Side Selection */}
                <div className="space-y-2">
                  <Label className="text-white">Position Side</Label>
                  <div className="flex gap-4">
                    <Button
                      variant={side === 'long' ? 'default' : 'outline'}
                      onClick={() => setSide('long')}
                      className={side === 'long' ? 'bg-green-600 hover:bg-green-700' : ''}
                      data-testid="button-long"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Long (Buy)
                    </Button>
                    <Button
                      variant={side === 'short' ? 'default' : 'outline'}
                      onClick={() => setSide('short')}
                      className={side === 'short' ? 'bg-red-600 hover:bg-red-700' : ''}
                      data-testid="button-short"
                    >
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Short (Sell)
                    </Button>
                  </div>
                </div>

                {/* Leverage Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-white">Leverage</Label>
                    <span className="text-2xl font-bold text-purple-400">{leverage}x</span>
                  </div>
                  <Slider
                    value={[leverage]}
                    onValueChange={(val) => setLeverage(val[0])}
                    min={1}
                    max={parseInt(settings?.maxLeverage || '20')}
                    step={1}
                    className="w-full"
                    data-testid="slider-leverage"
                  />
                  <p className="text-xs text-gray-400">Max leverage: {settings?.maxLeverage || '20'}x</p>
                </div>

                {/* Position Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry-price" className="text-white">Entry Price (USDT)</Label>
                    <Input
                      id="entry-price"
                      type="number"
                      placeholder="0.00"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      className="bg-black/60 border-purple-500/20"
                      data-testid="input-entry-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collateral" className="text-white">Collateral (USDT)</Label>
                    <Input
                      id="collateral"
                      type="number"
                      placeholder="0.00"
                      value={collateral}
                      onChange={(e) => setCollateral(e.target.value)}
                      className="bg-black/60 border-purple-500/20"
                      data-testid="input-collateral"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position-size" className="text-white">Position Size</Label>
                    <Input
                      id="position-size"
                      type="number"
                      placeholder="0.00"
                      value={positionSize}
                      onChange={(e) => setPositionSize(e.target.value)}
                      className="bg-black/60 border-purple-500/20"
                      data-testid="input-position-size"
                    />
                  </div>
                </div>

                {/* Liquidation Price Display */}
                {entryPrice && collateral && positionSize && (
                  <Alert className="bg-yellow-500/10 border-yellow-500/50">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-200">
                      Liquidation Price: <span className="font-bold">${calculateLiquidationPrice().toFixed(2)}</span>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleOpenPosition}
                  disabled={openPositionMutation.isPending}
                  className={`w-full ${side === 'long' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  data-testid="button-open-position"
                >
                  {openPositionMutation.isPending ? 'Opening...' : `Open ${side === 'long' ? 'Long' : 'Short'} Position`}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Open Positions Tab */}
          <TabsContent value="positions">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Open Positions</CardTitle>
                <CardDescription>Monitor and manage your active margin positions</CardDescription>
              </CardHeader>
              <CardContent>
                {positionsLoading ? (
                  <p className="text-gray-400">Loading positions...</p>
                ) : openPositions.length === 0 ? (
                  <p className="text-gray-400">No open positions</p>
                ) : (
                  <div className="space-y-4">
                    {openPositions.map((position: any) => {
                      const pnl = parseFloat(position.unrealizedPnl || '0');
                      const isProfitable = pnl >= 0;
                      const riskPosition = riskMetrics?.positions?.find((r: any) => r.positionId === position.id);

                      return (
                        <Card key={position.id} className="bg-black/60 border-purple-500/20" data-testid={`position-card-${position.id}`}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-xl font-bold text-white">{position.tradingPair}</h3>
                                  {position.side === 'long' ? (
                                    <Badge className="bg-green-600">Long {position.leverage}x</Badge>
                                  ) : (
                                    <Badge className="bg-red-600">Short {position.leverage}x</Badge>
                                  )}
                                  {riskPosition && getRiskBadge(riskPosition.riskLevel)}
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  <span className="text-gray-400">Entry: ${parseFloat(position.entryPrice).toFixed(2)}</span>
                                  <span className="text-gray-400">Current: ${parseFloat(position.currentPrice).toFixed(2)}</span>
                                  <span className="text-gray-400">Size: {position.positionSize}</span>
                                  <span className="text-gray-400">Collateral: ${position.collateral}</span>
                                  <span className="text-red-400">Liq: ${parseFloat(position.liquidationPrice).toFixed(2)}</span>
                                  {riskPosition && (
                                    <span className="text-gray-400">Distance: {riskPosition.distanceToLiquidation.toFixed(2)}%</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                                  {isProfitable ? '+' : ''}{pnl.toFixed(2)} USDT
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClosePosition(position)}
                                  disabled={closePositionMutation.isPending}
                                  className="mt-2"
                                  data-testid={`button-close-${position.id}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Close
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Position History</CardTitle>
                <CardDescription>View your closed and liquidated positions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {closedPositions.length === 0 ? (
                    <p className="text-gray-400">No closed positions</p>
                  ) : (
                    closedPositions.map((position: any) => {
                      const pnl = parseFloat(position.realizedPnl || '0');
                      const isProfitable = pnl >= 0;

                      return (
                        <Card key={position.id} className="bg-black/60 border-purple-500/20">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-white">{position.tradingPair}</h3>
                                  <Badge variant={position.status === 'liquidated' ? 'destructive' : 'outline'}>
                                    {position.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-400">
                                  {position.side === 'long' ? 'Long' : 'Short'} {position.leverage}x | 
                                  Entry: ${parseFloat(position.entryPrice).toFixed(2)} | 
                                  Close: ${parseFloat(position.currentPrice).toFixed(2)}
                                </p>
                              </div>
                              <p className={`text-xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                                {isProfitable ? '+' : ''}{pnl.toFixed(2)} USDT
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}

                  {liquidationData && liquidationData.total > 0 && (
                    <Alert className="bg-red-500/10 border-red-500/50 mt-4">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-200">
                        Total Liquidations: {liquidationData.total}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Leverage Settings</CardTitle>
                <CardDescription>Configure your margin trading preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Auto Deleverage</Label>
                      <p className="text-sm text-gray-400">Automatically liquidate positions at threshold</p>
                    </div>
                    <Switch
                      checked={settings?.autoDeleverageEnabled === 'true'}
                      onCheckedChange={(checked) => {
                        updateSettingsMutation.mutate({
                          autoDeleverageEnabled: String(checked),
                        });
                      }}
                      data-testid="switch-auto-deleverage"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Liquidation Warnings</Label>
                      <p className="text-sm text-gray-400">Receive alerts when approaching liquidation</p>
                    </div>
                    <Switch
                      checked={settings?.liquidationWarningEnabled === 'true'}
                      onCheckedChange={(checked) => {
                        updateSettingsMutation.mutate({
                          liquidationWarningEnabled: String(checked),
                        });
                      }}
                      data-testid="switch-liquidation-warning"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Margin Mode</Label>
                    <Select
                      value={settings?.marginMode || 'isolated'}
                      onValueChange={(value) => {
                        updateSettingsMutation.mutate({ marginMode: value });
                      }}
                    >
                      <SelectTrigger data-testid="select-margin-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="isolated">Isolated (Each position separate)</SelectItem>
                        <SelectItem value="cross">Cross (Shared collateral)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Risk Level</Label>
                    <Select
                      value={settings?.riskLevel || 'medium'}
                      onValueChange={(value) => {
                        updateSettingsMutation.mutate({ riskLevel: value });
                      }}
                    >
                      <SelectTrigger data-testid="select-risk-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Conservative)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (Aggressive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
