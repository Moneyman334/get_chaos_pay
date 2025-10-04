import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageTracking } from "@/hooks/use-analytics";
import { ShoppingCart, ArrowLeft, Package, DollarSign } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  usePageTracking('/product');

  const { data: product, isLoading } = useQuery<any>({
    queryKey: ['/api/products', id],
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/cart/add', {
        productId: id,
        quantity: 1,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Added to Cart",
        description: `${product?.name} has been added to your cart`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to cart",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-xl" />
              <div className="space-y-4">
                <div className="h-10 w-3/4 bg-muted rounded" />
                <div className="h-6 w-1/4 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-6xl mx-auto text-center py-20">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/products')} data-testid="button-back-to-products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="overflow-hidden">
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800'}
              alt={product.name}
              className="w-full aspect-square object-cover"
              data-testid="img-product"
            />
          </Card>

          <div className="space-y-6" data-testid="container-product-detail">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{product.category}</Badge>
                <Badge variant={product.isActive ? "default" : "destructive"}>
                  {product.isActive ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-2" data-testid="text-product-name">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
                <span className="text-muted-foreground">{product.currency}</span>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Details
                </h3>
                <p className="text-muted-foreground" data-testid="text-product-description">
                  {product.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">{product.type}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stock</span>
                  <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                    {product.stock} available
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending || !product.isActive || product.stock === 0}
                className="w-full h-12 text-lg"
                data-testid="button-add-to-cart"
              >
                {addToCartMutation.isPending ? (
                  <>Adding...</>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/cart')}
                className="w-full"
                data-testid="button-view-cart"
              >
                View Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
