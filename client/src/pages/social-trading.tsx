import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrendingUp, Users, Copy, Star, DollarSign, Target, Trophy, Zap, Activity } from "lucide-react";

interface Trader {
  id: string;
  address: string;
  username: string;
  avatar?: string;
  totalReturn: string;
  winRate: string;
  totalTrades: number;
  followers: number;
  rating: number;
  verified: boolean;
  bio: string;
  strategies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface CopyPosition {
  id: string;
  follower: string;
  trader: string;
  allocatedAmount: string;
  currentValue: string;
  pnl: string;
  pnlPercent: string;
  tradesCopied: number;
  startDate: string;
  status: 'active' | 'paused' | 'stopped';
}

interface Trade {
  id: string;
  trader: string;
  type: 'buy' | 'sell';
  token: string;
  amount: string;
  price: string;
  timestamp: string;
  pnl?: string;
}

export default function SocialTradingPage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [copyAmount, setCopyAmount] = useState("");
  const [sortBy, setSortBy] = useState("return");

  const { data: topTraders } = useQuery<Trader[]>({
    queryKey: ['/api/social-trading/traders', sortBy],
  });

  const { data: myCopyPositions } = useQuery<CopyPosition[]>({
    queryKey: ['/api/social-trading/positions', account],
    enabled: !!account,
  });

  const { data: recentTrades } = useQuery<Trade[]>({
    queryKey: ['/api/social-trading/trades'],
  });

  const startCopyingMutation = useMutation({
    mutationFn: async ({ traderId, amount }: { traderId: string; amount: string }) => {
      if (!account) throw new Error("Connect wallet to copy trader");
      return apiRequest('POST', '/api/social-trading/copy', {
        follower: account,
        trader: traderId,
        allocatedAmount: amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Copy Trading Started!",
        description: "You are now copying this trader's moves",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social-trading/traders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social-trading/positions', account] });
      setSelectedTrader(null);
      setCopyAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Copy Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const stopCopyingMutation = useMutation({
    mutationFn: async (positionId: string) => {
      return apiRequest('POST', '/api/social-trading/stop', {
        positionId,
        follower: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Copy Trading Stopped",
        description: "You have stopped copying this trader",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/social-trading/positions', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Stop Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const totalCopied = myCopyPositions?.reduce((sum, pos) => sum + parseFloat(pos.allocatedAmount), 0) || 0;
  const totalValue = myCopyPositions?.reduce((sum, pos) => sum + parseFloat(pos.currentValue), 0) || 0;
  const totalPnL = myCopyPositions?.reduce((sum, pos) => sum + parseFloat(pos.pnl), 0) || 0;
  const activePositions = myCopyPositions?.filter(p => p.status === 'active').length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Users className="h-10 w-10 text-blue-500" />
          Social Trading
        </h1>
        <p className="text-muted-foreground">Copy the best traders automatically and grow your portfolio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="text-3xl font-bold" data-testid="text-total-copied">
                  ${totalCopied.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-3xl font-bold">
                  ${totalValue.toFixed(2)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Copies</p>
                <p className="text-3xl font-bold">{activePositions}</p>
              </div>
              <Copy className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!account ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Social Trading</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to start copying successful traders
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="traders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="traders">Top Traders</TabsTrigger>
              <TabsTrigger value="positions">My Copies ({myCopyPositions?.length || 0})</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="traders" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Top Performing Traders</h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="return">Best Return</SelectItem>
                    <SelectItem value="winrate">Win Rate</SelectItem>
                    <SelectItem value="followers">Most Followers</SelectItem>
                    <SelectItem value="trades">Most Trades</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {topTraders?.map(trader => {
                  const totalReturn = parseFloat(trader.totalReturn);
                  const winRate = parseFloat(trader.winRate);

                  return (
                    <Card key={trader.id} data-testid={`trader-${trader.id}`} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={trader.avatar} />
                              <AvatarFallback>{trader.username[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{trader.username}</CardTitle>
                                {trader.verified && <Badge variant="secondary" className="text-xs">✓ Verified</Badge>}
                              </div>
                              <CardDescription className="flex items-center gap-2">
                                <span className="flex items-center">
                                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
                                  {trader.rating.toFixed(1)}
                                </span>
                                <span>•</span>
                                <span>{trader.followers} followers</span>
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getRiskBadge(trader.riskLevel)}>
                            {trader.riskLevel} risk
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{trader.bio}</p>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Return</p>
                            <p className={`text-xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Win Rate</p>
                            <p className="text-xl font-bold">{winRate.toFixed(0)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Trades</p>
                            <p className="text-xl font-bold">{trader.totalTrades}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {trader.strategies.map(strategy => (
                            <Badge key={strategy} variant="outline" className="text-xs">
                              {strategy}
                            </Badge>
                          ))}
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full" onClick={() => setSelectedTrader(trader)} data-testid={`button-copy-${trader.id}`}>
                              <Copy className="h-4 w-4 mr-2" />
                              Start Copying
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Copy {trader.username}'s Trades</DialogTitle>
                              <DialogDescription>
                                Allocate funds to automatically copy this trader's moves
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Total Return:</span>
                                  <span className={`font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Win Rate:</span>
                                  <span className="font-semibold">{winRate.toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Risk Level:</span>
                                  <span className={`font-semibold ${getRiskColor(trader.riskLevel)}`}>
                                    {trader.riskLevel.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="copy-amount">Allocation Amount</Label>
                                <Input
                                  id="copy-amount"
                                  type="number"
                                  placeholder="1000"
                                  value={copyAmount}
                                  onChange={(e) => setCopyAmount(e.target.value)}
                                  data-testid="input-copy-amount"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Minimum allocation: $100
                                </p>
                              </div>

                              {copyAmount && parseFloat(copyAmount) >= 100 && (
                                <div className="p-4 bg-muted rounded-lg">
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Your Allocation:</span>
                                      <span className="font-semibold">${copyAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Projected 30d Return:</span>
                                      <span className="font-semibold text-green-600">
                                        ${((parseFloat(copyAmount) * totalReturn) / 100 / 12).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                      <span className="font-semibold">Risk Level:</span>
                                      <span className={`font-bold ${getRiskColor(trader.riskLevel)}`}>
                                        {trader.riskLevel.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <Button
                                className="w-full"
                                onClick={() => startCopyingMutation.mutate({ traderId: trader.id, amount: copyAmount })}
                                disabled={!copyAmount || parseFloat(copyAmount) < 100 || startCopyingMutation.isPending}
                                data-testid="button-confirm-copy"
                              >
                                {startCopyingMutation.isPending ? 'Starting...' : 'Start Copying'}
                              </Button>

                              <p className="text-xs text-center text-muted-foreground">
                                You can stop copying at any time with no penalties
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="positions" className="space-y-4">
              {!myCopyPositions || myCopyPositions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Copy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Active Copies</h3>
                    <p className="text-muted-foreground mb-6">Start copying traders to grow your portfolio</p>
                    <Button onClick={() => (document.querySelector('[value="traders"]') as HTMLElement)?.click()}>
                      Browse Traders
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                myCopyPositions.map(position => {
                  const trader = topTraders?.find(t => t.id === position.trader);
                  const pnl = parseFloat(position.pnl);
                  const pnlPercent = parseFloat(position.pnlPercent);

                  return (
                    <Card key={position.id} data-testid={`position-${position.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={trader?.avatar} />
                              <AvatarFallback>{trader?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{trader?.username}</h3>
                              <p className="text-sm text-muted-foreground">
                                Copying since {new Date(position.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={position.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                            {position.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Allocated</p>
                            <p className="font-semibold">${position.allocatedAmount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Current Value</p>
                            <p className="font-semibold">${position.currentValue}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">P&L</p>
                            <p className={`font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Return</p>
                            <p className={`font-bold ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg mb-4">
                          <span className="text-sm">Trades Copied</span>
                          <span className="font-bold text-lg">{position.tradesCopied}</span>
                        </div>

                        {position.status === 'active' && (
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => stopCopyingMutation.mutate(position.id)}
                            disabled={stopCopyingMutation.isPending}
                            data-testid={`button-stop-${position.id}`}
                          >
                            Stop Copying
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Recent Trades from Top Traders</h3>
              {recentTrades?.map((trade, idx) => {
                const trader = topTraders?.find(t => t.id === trade.trader);
                const pnl = trade.pnl ? parseFloat(trade.pnl) : null;

                return (
                  <Card key={`${trade.id}-${idx}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={trader?.avatar} />
                            <AvatarFallback>{trader?.username?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{trader?.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount} {trade.token}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}>
                            {trade.type.toUpperCase()}
                          </Badge>
                          <p className="text-sm mt-1">${trade.price}</p>
                          {pnl !== null && (
                            <p className={`text-sm font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
