import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, Clock, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

interface FlashSale {
  id: string;
  productId: string;
  originalPrice: string;
  salePrice: string;
  startTime: string;
  endTime: string;
  totalQuantity: string;
  soldQuantity: string;
  status: string;
  productName?: string;
}

function useTimeRemaining(endTime: string) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    return Math.max(0, end - now);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, isExpired: timeLeft === 0 };
}

interface FlashSalesBannerProps {
  maxItems?: number;
  compact?: boolean;
}

export function FlashSalesBanner({ maxItems = 3, compact = false }: FlashSalesBannerProps) {
  const { data: flashSales, isLoading } = useQuery<FlashSale[]>({
    queryKey: ['/api/flash-sales/active'],
  });

  if (isLoading || !flashSales || flashSales.length === 0) {
    return null;
  }

  const activeSales = flashSales
    .filter(sale => sale.status === "active")
    .slice(0, maxItems);

  if (activeSales.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 px-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 animate-pulse" />
            <span className="font-bold">Flash Sale Active!</span>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {activeSales.length} {activeSales.length === 1 ? 'Deal' : 'Deals'}
            </Badge>
          </div>
          <Link href="/flash-sales">
            <Button variant="secondary" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8" data-testid="flash-sales-banner">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-red-600 text-white animate-pulse">
          <Zap className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold">Flash Sales</h2>
        <Badge className="bg-red-600">Live Now</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeSales.map((sale) => (
          <FlashSaleCard key={sale.id} sale={sale} />
        ))}
      </div>
    </div>
  );
}

function FlashSaleCard({ sale }: { sale: FlashSale }) {
  const { hours, minutes, seconds, isExpired } = useTimeRemaining(sale.endTime);
  const soldPercentage = (parseInt(sale.soldQuantity) / parseInt(sale.totalQuantity)) * 100;
  const remaining = parseInt(sale.totalQuantity) - parseInt(sale.soldQuantity);
  const discount = ((parseFloat(sale.originalPrice) - parseFloat(sale.salePrice)) / parseFloat(sale.originalPrice)) * 100;

  return (
    <Card className="relative overflow-hidden border-red-500" data-testid={`flash-sale-${sale.id}`}>
      <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 rounded-bl-lg">
        <span className="font-bold text-lg">-{discount.toFixed(0)}%</span>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-lg line-clamp-2 mb-1">
            {sale.productName || `Product ${sale.productId}`}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">
              ${sale.salePrice}
            </span>
            <span className="text-sm line-through text-muted-foreground">
              ${sale.originalPrice}
            </span>
          </div>
        </div>

        {/* Countdown Timer */}
        {!isExpired ? (
          <div className="mb-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span>Ends in</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg p-2 text-center">
                <div className="text-2xl font-bold">{hours.toString().padStart(2, '0')}</div>
                <div className="text-xs text-muted-foreground">Hours</div>
              </div>
              <div className="flex-1 bg-muted rounded-lg p-2 text-center">
                <div className="text-2xl font-bold">{minutes.toString().padStart(2, '0')}</div>
                <div className="text-xs text-muted-foreground">Mins</div>
              </div>
              <div className="flex-1 bg-muted rounded-lg p-2 text-center">
                <div className="text-2xl font-bold">{seconds.toString().padStart(2, '0')}</div>
                <div className="text-xs text-muted-foreground">Secs</div>
              </div>
            </div>
          </div>
        ) : (
          <Badge variant="secondary" className="mb-3">Sale Ended</Badge>
        )}

        {/* Stock Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Sold</span>
            <span className="font-semibold">
              {remaining} / {sale.totalQuantity} left
            </span>
          </div>
          <Progress value={soldPercentage} className="h-2" />
        </div>

        <Button 
          className="w-full bg-red-600 hover:bg-red-700"
          disabled={isExpired || remaining === 0}
          data-testid={`button-buy-${sale.id}`}
        >
          {isExpired ? "Sale Ended" : remaining === 0 ? "Sold Out" : "Buy Now"}
        </Button>
      </div>
    </Card>
  );
}
