import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePageTracking } from "@/hooks/use-analytics";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Bot,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Activity,
  DollarSign,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Crown
} from "lucide-react";

const TRADING_PAIRS = [
  { id: 'BTC-USD', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ETH-USD', name: 'Ethereum', symbol: 'ETH' },
  { id: 'SOL-USD', name: 'Solana', symbol: 'SOL' },
  { id: 'MATIC-USD', name: 'Polygon', symbol: 'MATIC' },
];

const STRATEGIES = [
  { id: 'sma_crossover', name: 'SMA Crossover', description: 'Buy when price crosses above 20-period SMA, sell when below' },
  { id: 'rsi_oversold', name: 'RSI Oversold', description: 'Buy when RSI < 30 (oversold), sell when RSI > 70 (overbought)' },
  { id: 'trend_following', name: 'Trend Following', description: 'Follow the trend with momentum indicators' },
  { id: 'mean_reversion', name: 'Mean Reversion', description: 'Buy dips, sell rallies based on moving averages' },
  { id: 'breakout', name: 'Breakout', description: 'Trade price breakouts above resistance or below support' },
];

export default function AutoTradingBot() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [botConfig, setBotConfig] = useState({
    tradingPair: 'BTC-USD',
    strategy: 'sma_crossover',
    tradeAmount: '100',
    stopLoss: '2',
    takeProfit: '5',
    maxDailyTrades: '10',
    demoMode: true,
    enabled: false,
  });

  const { toast } = useToast();
  usePageTracking('/auto-trading-bot');

  const { data: botStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/bot/status'],
    refetchInterval: 5000,
  });

  const { data: botTrades = [] } = useQuery({
    queryKey: ['/api/bot/trades'],
    refetchInterval: 10000,
  });

  const { data: botStats } = useQuery({
    queryKey: ['/api/bot/stats'],
    refetchInterval: 10000,
  });

  const { data: botActivity = [] } = useQuery({
    queryKey: ['/api/bot/activity'],
    refetchInterval: 2000,
  });

  const startBotMutation = useMutation({
    mutationFn: async () => {
      // Frontend validation
      const errors: string[] = [];
      
      const tradeAmount = Number(botConfig.tradeAmount);
      if (isNaN(tradeAmount) || tradeAmount <= 0) {
        errors.push('Trade amount must be a positive number');
      }
      
      const stopLoss = Number(botConfig.stopLoss);
      if (isNaN(stopLoss) || stopLoss < 0 || stopLoss > 100) {
        errors.push('Stop loss must be between 0 and 100');
      }
      
      const takeProfit = Number(botConfig.takeProfit);
      if (isNaN(takeProfit) || takeProfit < 0 || takeProfit > 1000) {
        errors.push('Take profit must be between 0 and 1000');
      }
      
      const maxDailyTradesNum = Number(botConfig.maxDailyTrades);
      if (isNaN(maxDailyTradesNum) || !Number.isInteger(maxDailyTradesNum) || maxDailyTradesNum < 1 || maxDailyTradesNum > 100) {
        errors.push('Max daily trades must be an integer between 1 and 100');
      }
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
      
      // Convert to proper types before sending
      const validatedConfig = {
        tradingPair: botConfig.tradingPair,
        strategy: botConfig.strategy,
        tradeAmount: tradeAmount.toString(),
        stopLoss: stopLoss.toString(),
        takeProfit: takeProfit.toString(),
        maxDailyTrades: maxDailyTradesNum.toString(),
        demoMode: botConfig.demoMode,
      };
      
      const res = await apiRequest('POST', '/api/bot/start', validatedConfig);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to start bot" }));
        throw new Error(errorData.error || errorData.message || "Failed to connect to trading bot");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] });
      toast({
        title: "Bot Started! 🤖",
        description: `${botConfig.strategy} strategy activated for ${botConfig.tradingPair}`,
      });
      setIsConfiguring(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Bot",
        description: error.message || "Unable to connect to trading bot. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  const stopBotMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/bot/stop', {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to stop bot" }));
        throw new Error(errorData.error || errorData.message || "Failed to stop bot");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/status'] });
      toast({
        title: "Bot Stopped",
        description: "Auto trading has been paused",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Stop Bot",
        description: error.message || "Unable to stop trading bot",
        variant: "destructive",
      });
    },
  });

  const isRunning = botStatus?.status === 'running';
  const totalProfit = botStats?.totalProfit || 0;
  const totalTrades = botStats?.totalTrades || 0;
  const winRate = botStats?.winRate || 0;
  const [showSubscription, setShowSubscription] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Subscription Banner */}
        {showSubscription && (
          <Card className="border-amber-500 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-amber-500/20">
                    <Crown className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg flex items-center gap-2">
                      Upgrade to Premium Bot
                      <Badge variant="outline" className="bg-amber-500/20 text-amber-600 border-amber-500">
                        Special Offer
                      </Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unlock advanced strategies, higher trade limits, and priority execution
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubscription(false)}
                    data-testid="button-dismiss-subscription"
                  >
                    Dismiss
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    onClick={() => window.location.href = '/subscriptions'}
                    data-testid="button-upgrade-bot"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade Now - $49/mo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Bot className="h-10 w-10 text-primary" />
              Auto Trading Bot
            </h1>
            <p className="text-muted-foreground mt-1">
              Automated trading connected to your live trading platform
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsConfiguring(!isConfiguring)}
              data-testid="button-configure"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Configure
            </Button>
            {isRunning ? (
              <Button
                variant="destructive"
                onClick={() => stopBotMutation.mutate()}
                disabled={stopBotMutation.isPending}
                data-testid="button-stop-bot"
              >
                <Pause className="mr-2 h-4 w-4" />
                Stop Bot
              </Button>
            ) : (
              <Button
                onClick={() => startBotMutation.mutate()}
                disabled={startBotMutation.isPending}
                data-testid="button-start-bot"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Bot
              </Button>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <Card className={isRunning ? 'border-green-500 bg-green-500/5' : 'border-muted'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isRunning ? 'bg-green-500/20' : 'bg-muted'}`}>
                  {isRunning ? (
                    <Activity className="h-6 w-6 text-green-500 animate-pulse" />
                  ) : (
                    <Bot className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg flex items-center gap-2">
                    {isRunning ? 'Bot is Running' : 'Bot is Stopped'}
                    {isRunning && botStatus?.config?.demoMode && (
                      <Badge variant="outline" className="text-xs">DEMO MODE</Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isRunning
                      ? `Trading ${botStatus?.config?.tradingPair} with ${botStatus?.config?.strategy} strategy`
                      : 'Configure and start bot to begin automated trading'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {isRunning && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => stopBotMutation.mutate()}
                    disabled={stopBotMutation.isPending}
                    data-testid="button-emergency-stop"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Emergency Stop
                  </Button>
                )}
                <Badge variant={isRunning ? 'default' : 'secondary'} className="text-sm px-4 py-2">
                  {isRunning ? 'ACTIVE' : 'IDLE'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        {isConfiguring && (
          <Card>
            <CardHeader>
              <CardTitle>Bot Configuration</CardTitle>
              <CardDescription>
                Configure your trading bot settings and risk parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tradingPair">Trading Pair</Label>
                  <Select
                    value={botConfig.tradingPair}
                    onValueChange={(value) => setBotConfig({ ...botConfig, tradingPair: value })}
                  >
                    <SelectTrigger id="tradingPair" data-testid="select-trading-pair">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADING_PAIRS.map((pair) => (
                        <SelectItem key={pair.id} value={pair.id}>
                          {pair.name} ({pair.symbol}/USD)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strategy">Trading Strategy</Label>
                  <Select
                    value={botConfig.strategy}
                    onValueChange={(value) => setBotConfig({ ...botConfig, strategy: value })}
                  >
                    <SelectTrigger id="strategy" data-testid="select-strategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGIES.map((strat) => (
                        <SelectItem key={strat.id} value={strat.id}>
                          {strat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {STRATEGIES.find(s => s.id === botConfig.strategy)?.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tradeAmount">Trade Amount (USD)</Label>
                  <Input
                    id="tradeAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={botConfig.tradeAmount}
                    onChange={(e) => setBotConfig({ ...botConfig, tradeAmount: e.target.value })}
                    data-testid="input-trade-amount"
                  />
                  <p className="text-xs text-muted-foreground">Amount per trade (min: $0.01)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTrades">Max Daily Trades</Label>
                  <Input
                    id="maxTrades"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={botConfig.maxDailyTrades}
                    onChange={(e) => setBotConfig({ ...botConfig, maxDailyTrades: e.target.value })}
                    data-testid="input-max-trades"
                  />
                  <p className="text-xs text-muted-foreground">Maximum trades per day</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={botConfig.stopLoss}
                    onChange={(e) => setBotConfig({ ...botConfig, stopLoss: e.target.value })}
                    data-testid="input-stop-loss"
                  />
                  <p className="text-xs text-muted-foreground">Exit if loss exceeds this % (0-100)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="takeProfit">Take Profit (%)</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    value={botConfig.takeProfit}
                    onChange={(e) => setBotConfig({ ...botConfig, takeProfit: e.target.value })}
                    data-testid="input-take-profit"
                  />
                  <p className="text-xs text-muted-foreground">Exit if profit reaches this % (0-1000)</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Demo Mode (Recommended)</p>
                      <p className="text-xs text-muted-foreground">
                        Test strategies without risking real money
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={botConfig.demoMode}
                    onCheckedChange={(checked) => setBotConfig({ ...botConfig, demoMode: checked })}
                    data-testid="switch-demo-mode"
                  />
                </div>

                {!botConfig.demoMode && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-sm text-red-500">⚠️ LIVE TRADING ENABLED</p>
                      <p className="text-xs text-muted-foreground">
                        Bot will execute real trades with real money. Ensure you understand the risks.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-sm">Risk Warning</p>
                    <p className="text-xs text-muted-foreground">
                      Automated trading involves risk. Only use funds you can afford to lose.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card data-testid="card-total-profit">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center text-xs">
                <DollarSign className="h-4 w-4 mr-1" />
                Total Profit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${Math.abs(totalProfit).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalProfit >= 0 ? '+' : '-'} All time
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-trades">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center text-xs">
                <Activity className="h-4 w-4 mr-1" />
                Total Trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalTrades}</div>
              <p className="text-xs text-muted-foreground mt-1">Executed</p>
            </CardContent>
          </Card>

          <Card data-testid="card-win-rate">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center text-xs">
                <BarChart3 className="h-4 w-4 mr-1" />
                Win Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{winRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Success rate</p>
            </CardContent>
          </Card>

          <Card data-testid="card-status">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center text-xs">
                <Shield className="h-4 w-4 mr-1" />
                Status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isRunning ? '✓' : '○'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isRunning ? 'Active' : 'Inactive'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Activity Feed */}
        {isRunning && (
          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary animate-pulse" />
                    Live Bot Activity
                  </CardTitle>
                  <CardDescription>
                    Real-time feed of bot actions and market analysis
                  </CardDescription>
                </div>
                <Badge className="bg-green-500 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {botActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Analyzing markets...</p>
                  </div>
                ) : (
                  botActivity.map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-primary/10 animate-fadeIn"
                      data-testid={`activity-${index}`}
                    >
                      <div className={`p-2 rounded-full ${
                        activity.type === 'trade' ? 'bg-green-500/10' :
                        activity.type === 'analysis' ? 'bg-blue-500/10' :
                        activity.type === 'signal' ? 'bg-yellow-500/10' :
                        'bg-purple-500/10'
                      }`}>
                        {activity.type === 'trade' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : activity.type === 'analysis' ? (
                          <BarChart3 className="h-4 w-4 text-blue-500" />
                        ) : activity.type === 'signal' ? (
                          <Zap className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Bot className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{activity.message}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground">{activity.details}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bot Trades</CardTitle>
            <CardDescription>
              Trades executed automatically by the bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {botTrades.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No trades yet. Start the bot to begin trading.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {botTrades.slice(0, 10).map((trade: any) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                    data-testid={`trade-row-${trade.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          trade.side === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}
                      >
                        {trade.side === 'buy' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{trade.tradingPair}</span>
                          <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                            {trade.side.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{trade.orderType}</Badge>
                          {trade.mode && (
                            <Badge variant="secondary" className="text-xs">
                              {trade.mode}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {trade.strategy} • {new Date(trade.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {trade.amount} @ ${trade.price}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total: ${(parseFloat(trade.amount) * parseFloat(trade.price)).toFixed(2)}
                      </p>
                      {trade.profit && (
                        <p
                          className={`text-sm font-medium ${
                            parseFloat(trade.profit) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {parseFloat(trade.profit) >= 0 ? '+' : ''}${trade.profit}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strategy Info */}
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p>
                <strong>Automated Trading:</strong> Bot monitors markets 24/7 and executes trades based on your selected strategy
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p>
                <strong>Risk Management:</strong> Automatic stop-loss and take-profit protect your capital
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p>
                <strong>Live Trading:</strong> Connected directly to your trading platform for real-time execution
              </p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p>
                <strong>Full Control:</strong> Start, stop, or adjust settings anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
