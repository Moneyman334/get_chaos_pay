import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart as PieChartIcon, RefreshCw, ExternalLink } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  value: number;
  change24h: number;
  address: string;
}

interface ChainAsset {
  chain: string;
  chainId: number;
  totalValue: number;
  tokens: TokenBalance[];
}

export default function PortfolioPage() {
  const { account, chainId } = useWeb3();

  // Mock portfolio data - in production, this would fetch from multiple chains
  const portfolioData: ChainAsset[] = [
    {
      chain: "Ethereum",
      chainId: 1,
      totalValue: 12450.50,
      tokens: [
        { symbol: "ETH", name: "Ethereum", balance: "5.234", value: 10500.00, change24h: 3.2, address: "native" },
        { symbol: "USDC", name: "USD Coin", balance: "1200.00", value: 1200.00, change24h: 0.01, address: "0xa0b86991..." },
        { symbol: "DAI", name: "Dai Stablecoin", balance: "750.50", value: 750.50, change24h: -0.02, address: "0x6b175474..." },
      ]
    },
    {
      chain: "Polygon",
      chainId: 137,
      totalValue: 3250.75,
      tokens: [
        { symbol: "MATIC", name: "Polygon", balance: "2500.00", value: 2000.00, change24h: 5.8, address: "native" },
        { symbol: "USDT", name: "Tether USD", balance: "1250.75", value: 1250.75, change24h: 0.00, address: "0xc2132d05..." },
      ]
    },
    {
      chain: "Base",
      chainId: 8453,
      totalValue: 1875.25,
      tokens: [
        { symbol: "ETH", name: "Ethereum", balance: "0.89", value: 1785.00, change24h: 3.2, address: "native" },
        { symbol: "USDC", name: "USD Coin", balance: "90.25", value: 90.25, change24h: 0.01, address: "0x833589fcd..." },
      ]
    },
  ];

  const totalPortfolioValue = portfolioData.reduce((sum, chain) => sum + chain.totalValue, 0);
  const totalChange24h = 4.5; // Mock data

  // Portfolio allocation by chain
  const chainAllocation = portfolioData.map(chain => ({
    name: chain.chain,
    value: chain.totalValue,
    percentage: ((chain.totalValue / totalPortfolioValue) * 100).toFixed(1),
  }));

  // Portfolio allocation by token type
  const allTokens = portfolioData.flatMap(chain => chain.tokens);
  const tokenAllocation = allTokens.reduce((acc, token) => {
    const existing = acc.find(t => t.name === token.symbol);
    if (existing) {
      existing.value += token.value;
    } else {
      acc.push({ name: token.symbol, value: token.value });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Portfolio performance (mock data for last 7 days)
  const performanceData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: totalPortfolioValue * (1 - (Math.random() * 0.1 - 0.05)),
    };
  });

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Portfolio Tracker</CardTitle>
            <CardDescription>Connect your wallet to view your multi-chain portfolio</CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              Please connect your wallet to track your assets
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Portfolio Tracker</h1>
        <p className="text-muted-foreground">Track your multi-chain crypto assets in one place</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Total Portfolio Value</CardDescription>
                <CardTitle className="text-4xl">${totalPortfolioValue.toLocaleString()}</CardTitle>
              </div>
              <Button variant="outline" size="sm" data-testid="button-refresh">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {totalChange24h >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-lg font-semibold ${totalChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalChange24h >= 0 ? '+' : ''}{totalChange24h.toFixed(2)}%
              </span>
              <span className="text-muted-foreground">24h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-mono text-sm">{account?.slice(0, 6)}...{account?.slice(-4)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Network</p>
              <Badge variant="outline">
                {chainId === '1' ? 'Ethereum' :
                 chainId === '137' ? 'Polygon' :
                 chainId === '8453' ? 'Base' :
                 `Chain ${chainId}`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chain Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Chain Distribution
                </CardTitle>
                <CardDescription>Assets by blockchain</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chainAllocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chainAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Token Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Token Distribution
                </CardTitle>
                <CardDescription>Assets by token</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tokenAllocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} $${value.toFixed(0)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tokenAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Chain Breakdown */}
          <div className="grid gap-4">
            {chainAllocation.map((chain, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="font-semibold">{chain.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${chain.value.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{chain.percentage}%</p>
                    </div>
                  </div>
                  <Progress value={parseFloat(chain.percentage)} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          {portfolioData.map((chainData, chainIdx) => (
            <Card key={chainIdx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{chainData.chain}</CardTitle>
                    <CardDescription>Total: ${chainData.totalValue.toLocaleString()}</CardDescription>
                  </div>
                  <Badge variant="outline">{chainData.tokens.length} tokens</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chainData.tokens.map((token, tokenIdx) => (
                    <div 
                      key={tokenIdx} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`token-${token.symbol}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                          {token.symbol.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-semibold">{token.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {token.balance} {token.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${token.value.toLocaleString()}</p>
                        <div className="flex items-center gap-1 justify-end">
                          {token.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className={`text-sm ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Portfolio Value"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <p className="text-2xl font-bold text-green-500">+${(totalPortfolioValue * 0.045).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">+4.5%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">7d Change</p>
                  <p className="text-2xl font-bold text-green-500">+${(totalPortfolioValue * 0.12).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">+12.0%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">All Time High</p>
                  <p className="text-2xl font-bold">${(totalPortfolioValue * 1.35).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">-25.9% from ATH</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
