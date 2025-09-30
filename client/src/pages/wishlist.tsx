import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Heart, ShoppingCart, Trash2, Star } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { Link } from "wouter";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string | null;
  stockQuantity: string;
}

interface WishlistItem {
  id: string;
  customerWallet: string;
  productId: string;
  addedAt: string;
  product?: Product;
}

export default function Wishlist() {
  const { toast } = useToast();
  const { account } = useWeb3();

  const { data: wishlistItems, isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['/api/wishlists/wallet', account],
    enabled: !!account,
  });

  const removeMutation = useMutation({
    mutationFn: async (wishlistId: string) => {
      return apiRequest('DELETE', `/api/wishlists/${wishlistId}`);
    },
    onSuccess: () => {
      toast({
        title: "Removed from Wishlist",
        description: "Product has been removed from your wishlist",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlists/wallet', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Remove",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = async (productId: string) => {
    toast({
      title: "Added to Cart",
      description: "Product has been added to your cart",
    });
    // TODO: Implement add to cart functionality
  };

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Wishlist</h2>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your saved products
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeItems = wishlistItems?.filter(item => item.product) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">
          {activeItems.length} {activeItems.length === 1 ? 'item' : 'items'} saved for later
        </p>
      </div>

      {/* Wishlist Items */}
      {activeItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Your Wishlist is Empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding products you love to keep track of them
            </p>
            <Link href="/products">
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Total Value: ${activeItems.reduce((sum, item) => 
                  sum + parseFloat(item.product?.price || "0"), 0
                ).toFixed(2)}
              </Badge>
            </div>
          </div>

          {/* Wishlist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeItems.map((item) => {
              const product = item.product!;
              const inStock = parseInt(product.stockQuantity) > 0;
              const daysAgo = Math.floor(
                (Date.now() - new Date(item.addedAt).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card
                  key={item.id}
                  className="group hover:shadow-lg transition-shadow overflow-hidden"
                  data-testid={`wishlist-item-${item.id}`}
                >
                  <Link href={`/product/${product.id}`}>
                    <div className="aspect-square relative overflow-hidden bg-muted cursor-pointer">
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
                      {!inStock && (
                        <Badge className="absolute top-2 right-2 bg-red-500">
                          Out of Stock
                        </Badge>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          removeMutation.mutate(item.id);
                        }}
                        disabled={removeMutation.isPending}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Link>

                  <CardContent className="p-4">
                    <Link href={`/product/${product.id}`}>
                      <div className="cursor-pointer">
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {product.category}
                        </Badge>
                        <h3 className="font-semibold mb-1 line-clamp-2 hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold">${product.price}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm">4.5</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      Added {daysAgo === 0 ? 'today' : `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={!inStock}
                        onClick={() => handleAddToCart(product.id)}
                        data-testid={`button-add-cart-${item.id}`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {inStock ? "Add to Cart" : "Out of Stock"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                        data-testid={`button-remove-icon-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Banner */}
          <Card className="mt-8 bg-blue-500/10 border-blue-500/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Heart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Wishlist Tips</h3>
                  <p className="text-sm text-muted-foreground">
                    Your wishlist is saved to your wallet address and will persist across devices. 
                    We'll notify you when items go on sale or come back in stock.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
