import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Zap,
  Pause,
  Play,
  Settings,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function BotDashboard() {
  const [mockUserId] = useState('user_demo');

  const { data: activeStrategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ['/api/bot/active', mockUserId],
  });

  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['/api/bot/trades', mockUserId],
  });

  if (strategiesLoading || tradesLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const totalProfit = trades.reduce((sum: number, trade: any) => {
    return sum + parseFloat(trade.profit || '0');
  }, 0);

  const winningTrades = trades.filter((t: any) => parseFloat(t.profit || '0') > 0).length;
  const winRate = trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <Bot className="h-8 w-8 text-primary" />
                <span>Sentinel Bot Dashboard</span>
              </h1>
              <p className="text-muted-foreground mt-1">Monitor your automated trading performance</p>
            </div>
            <Link href="/auto-trading-bot">
              <Button size="lg" data-testid="button-configure-bot">
                <Settings className="mr-2 h-4 w-4" />
                Configure Bot
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Performance Overview */}
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
                {totalProfit >= 0 ? 'All time gains' : 'All time losses'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-strategies">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center text-xs">
                <Activity className="h-4 w-4 mr-1" />
                Active Strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {activeStrategies.filter((s: any) => s.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Running now
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-trades">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center text-xs">
                <Zap className="h-4 w-4 mr-1" />
                Total Trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{trades.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Executed trades
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {winningTrades} / {trades.length} trades
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Strategies */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" data-testid="tab-active-strategies">
              Active Strategies ({activeStrategies.filter((s: any) => s.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="trades" data-testid="tab-recent-trades">
              Recent Trades ({trades.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Strategies Tab */}
          <TabsContent value="active" className="space-y-4">
            {activeStrategies.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <Bot className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No Active Strategies</h3>
                    <p className="text-muted-foreground">
                      Start a strategy from the Sentinel Bot page to begin automated trading
                    </p>
                  </div>
                  <Link href="/trade">
                    <Button data-testid="button-start-trading">
                      <Play className="mr-2 h-4 w-4" />
                      Start Trading
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              activeStrategies.map((strategy: any) => (
                <Card key={strategy.id} data-testid={`strategy-card-${strategy.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center space-x-2">
                          <span>Strategy #{strategy.id.slice(0, 8)}</span>
                          <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                            {strategy.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Trading: {strategy.tradingPairs.join(', ')}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-pause-${strategy.id}`}
                      >
                        {strategy.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Allocated Capital</p>
                        <p className="text-lg font-semibold">${strategy.allocatedCapital}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Current Profit</p>
                        <p className={`text-lg font-semibold ${parseFloat(strategy.currentProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${strategy.currentProfit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Trades</p>
                        <p className="text-lg font-semibold">{strategy.totalTrades}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className="text-lg font-semibold text-primary">{strategy.winRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Recent Trades Tab */}
          <TabsContent value="trades" className="space-y-4">
            {trades.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <Activity className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No Trades Yet</h3>
                    <p className="text-muted-foreground">
                      Your bot will execute trades automatically once a strategy is active
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Trade History</CardTitle>
                  <CardDescription>Recent automated trades executed by Sentinel Bot</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trades.slice(0, 20).map((trade: any) => (
                      <div 
                        key={trade.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                        data-testid={`trade-row-${trade.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${trade.side === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {trade.side === 'buy' ? (
                              <ArrowUpRight className="h-5 w-5 text-green-500" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{trade.tradingPair}</span>
                              <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                                {trade.side.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{trade.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{trade.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{trade.amount} @ ${trade.price}</p>
                          <p className="text-sm text-muted-foreground">${trade.total}</p>
                          {trade.profit && (
                            <p className={`text-sm font-medium ${parseFloat(trade.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {parseFloat(trade.profit) >= 0 ? '+' : ''}${trade.profit}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
