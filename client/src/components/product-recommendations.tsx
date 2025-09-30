import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, TrendingUp } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
  description?: string;
}

interface Recommendation {
  id: string;
  productId: string;
  recommendedProductId: string;
  type: string;
  relevanceScore: string;
  product?: Product;
}

interface ProductRecommendationsProps {
  productId: string;
  type?: "related" | "upsell" | "cross-sell";
  maxItems?: number;
  onAddToCart?: (productId: string) => void;
}

export function ProductRecommendations({
  productId,
  type = "related",
  maxItems = 4,
  onAddToCart,
}: ProductRecommendationsProps) {
  const { data: recommendations, isLoading } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations', productId, type],
  });

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getTitle = () => {
    switch (type) {
      case "upsell":
        return "Premium Upgrades";
      case "cross-sell":
        return "Frequently Bought Together";
      default:
        return "You May Also Like";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "upsell":
        return <TrendingUp className="h-5 w-5" />;
      case "cross-sell":
        return <ShoppingCart className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const displayedRecommendations = recommendations.slice(0, maxItems);

  return (
    <div className="py-8" data-testid={`recommendations-${type}`}>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {getIcon()}
        </div>
        <h2 className="text-2xl font-bold">{getTitle()}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayedRecommendations.map((rec) => {
          const product = rec.product;
          if (!product) return null;

          const relevance = parseFloat(rec.relevanceScore) * 100;

          return (
            <Card
              key={rec.id}
              className="group hover:shadow-lg transition-shadow overflow-hidden"
              data-testid={`recommendation-${rec.id}`}
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
                    <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                {relevance >= 80 && (
                  <Badge className="absolute top-2 right-2 bg-green-500">
                    Top Pick
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-2">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold">${product.price}</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span>{relevance.toFixed(0)}%</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => onAddToCart?.(product.id)}
                  data-testid={`button-add-to-cart-${product.id}`}
                >
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
