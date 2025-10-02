import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Star,
  RefreshCw,
  Activity,
  BarChart3,
  Sparkles
} from "lucide-react";

interface LiveCryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number;
  sparkline_in_7d: {
    price: number[];
  };
  last_updated: string;
}

interface LivePricesResponse {
  success: boolean;
  data: LiveCryptoData[];
  timestamp: string;
  count: number;
}

export default function LiveCrypto() {
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("crypto-favorites");
    return saved ? JSON.parse(saved) : ["bitcoin", "ethereum", "solana"];
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: pricesData, isLoading, refetch } = useQuery<LivePricesResponse>({
    queryKey: ["/api/live-prices"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  useEffect(() => {
    localStorage.setItem("crypto-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const cryptoData = pricesData?.data || [];
  const filteredData = cryptoData.filter(crypto => 
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteData = cryptoData.filter(crypto => favorites.includes(crypto.id));

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const MiniSparkline = ({ data }: { data: number[] }) => {
    if (!data || data.length === 0) return null;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const width = 100;
    const height = 30;
    
    const points = data.map((price, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = range === 0 ? height / 2 : height - ((price - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const isPositive = data[data.length - 1] > data[0];

    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  const PriceChangeIndicator = ({ change }: { change: number }) => {
    if (change === null || change === undefined || isNaN(change)) {
      return (
        <div className="flex items-center space-x-1 text-muted-foreground">
          <span className="text-sm">N/A</span>
        </div>
      );
    }
    
    const isPositive = change > 0;
    return (
      <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span className="font-semibold text-sm">
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
    );
  };

  const CryptoRow = ({ crypto }: { crypto: LiveCryptoData }) => {
    const isFavorite = favorites.includes(crypto.id);
    
    return (
      <div 
        className="group relative p-4 rounded-xl bg-gradient-to-r from-card/50 to-card/30 hover:from-primary/5 hover:to-accent/5 transition-all duration-300 border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        data-testid={`crypto-row-${crypto.id}`}
      >
        <div className="flex items-center justify-between">
          {/* Rank & Favorite */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toggleFavorite(crypto.id)}
                data-testid={`button-favorite-${crypto.id}`}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
              </Button>
              <span className="text-sm text-muted-foreground w-8">#{crypto.market_cap_rank}</span>
            </div>

            {/* Coin Info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <img 
                src={crypto.image} 
                alt={crypto.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-foreground truncate" data-testid={`text-name-${crypto.id}`}>
                    {crypto.name}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {crypto.symbol.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vol: {formatMarketCap(crypto.total_volume)}
                </p>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-right min-w-[120px]">
            <p className="text-lg font-bold" data-testid={`text-price-${crypto.id}`}>
              {formatPrice(crypto.current_price)}
            </p>
            <p className="text-xs text-muted-foreground">
              MCap: {formatMarketCap(crypto.market_cap)}
            </p>
          </div>

          {/* Changes */}
          <div className="flex items-center space-x-4 ml-6">
            <div className="text-right min-w-[80px]">
              <p className="text-xs text-muted-foreground mb-1">1h</p>
              <PriceChangeIndicator change={crypto.price_change_percentage_1h_in_currency} />
            </div>
            <div className="text-right min-w-[80px]">
              <p className="text-xs text-muted-foreground mb-1">24h</p>
              <PriceChangeIndicator change={crypto.price_change_percentage_24h_in_currency} />
            </div>
            <div className="text-right min-w-[80px]">
              <p className="text-xs text-muted-foreground mb-1">7d</p>
              <PriceChangeIndicator change={crypto.price_change_percentage_7d_in_currency} />
            </div>
          </div>

          {/* Sparkline */}
          <div className="ml-6">
            <MiniSparkline data={crypto.sparkline_in_7d?.price || []} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-accent/20 p-8 border border-primary/30">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent mb-2 flex items-center space-x-3">
                  <Activity className="h-10 w-10 text-primary" />
                  <span>Live Crypto Market</span>
                </h1>
                <p className="text-muted-foreground">
                  Real-time cryptocurrency prices • Powered by CoinGecko
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-sm px-3 py-1.5">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span>{autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}</span>
                  </div>
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  data-testid="button-toggle-refresh"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh ? 'Disable' : 'Enable'} Auto
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => refetch()}
                  data-testid="button-refresh"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cryptocurrencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all" data-testid="tab-all">
              <BarChart3 className="h-4 w-4 mr-2" />
              All Markets ({filteredData.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">
              <Star className="h-4 w-4 mr-2" />
              Favorites ({favoriteData.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading live prices...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No cryptocurrencies found</p>
                </CardContent>
              </Card>
            ) : (
              filteredData.map(crypto => (
                <CryptoRow key={crypto.id} crypto={crypto} />
              ))
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-3">
            {favoriteData.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No favorites yet</p>
                  <p className="text-sm text-muted-foreground">
                    Click the star icon on any cryptocurrency to add it to your favorites
                  </p>
                </CardContent>
              </Card>
            ) : (
              favoriteData.map(crypto => (
                <CryptoRow key={crypto.id} crypto={crypto} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Live Stats */}
        {pricesData && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Market Overview</span>
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(pricesData.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Tracked Cryptocurrencies</p>
                  <p className="text-2xl font-bold text-green-500">{pricesData.count}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Gainers (24h)</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {cryptoData.filter(c => c.price_change_percentage_24h_in_currency > 0).length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20">
                  <p className="text-sm text-muted-foreground mb-1">Losers (24h)</p>
                  <p className="text-2xl font-bold text-red-500">
                    {cryptoData.filter(c => c.price_change_percentage_24h_in_currency < 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
