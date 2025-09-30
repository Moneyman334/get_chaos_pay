import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingCart } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
}

interface RecentlyViewed {
  id: string;
  productId: string;
  viewedAt: string;
  product?: Product;
}

interface RecentlyViewedProps {
  maxItems?: number;
  onAddToCart?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
}

export function RecentlyViewed({ 
  maxItems = 6, 
  onAddToCart,
  onViewProduct 
}: RecentlyViewedProps) {
  const { account } = useWeb3();

  const { data: recentlyViewed, isLoading } = useQuery<RecentlyViewed[]>({
    queryKey: ['/api/recently-viewed/wallet', account],
    enabled: !!account,
  });

  if (!account || isLoading || !recentlyViewed || recentlyViewed.length === 0) {
    return null;
  }

  const displayedItems = recentlyViewed.slice(0, maxItems);

  return (
    <div className="py-8" data-testid="recently-viewed">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
          <Eye className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold">Recently Viewed</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayedItems.map((item) => {
          const product = item.product;
          if (!product) return null;

          return (
            <Card
              key={item.id}
              className="group hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
              onClick={() => onViewProduct?.(product.id)}
              data-testid={`recently-viewed-${item.id}`}
            >
              <div className="aspect-square relative overflow-hidden bg-muted">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <CardContent className="p-3">
                <h3 className="font-medium text-sm mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <span className="font-bold">${product.price}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart?.(product.id);
                    }}
                    data-testid={`button-add-${product.id}`}
                  >
                    <ShoppingCart className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
