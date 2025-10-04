import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageTracking } from "@/hooks/use-analytics";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from "lucide-react";

export default function CartPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  usePageTracking('/cart');

  const { data: cart, isLoading } = useQuery<any>({
    queryKey: ['/api/cart'],
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('DELETE', `/api/cart/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await apiRequest('PATCH', `/api/cart/${itemId}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const total = cartItems.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.product?.price || 0) * item.quantity), 0
  );

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">Add some products to get started</p>
          <Button onClick={() => navigate('/products')} data-testid="button-continue-shopping">
            <Package className="h-4 w-4 mr-2" />
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item: any) => (
              <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <img
                      src={item.product?.imageUrl || 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=200'}
                      alt={item.product?.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold text-lg" data-testid={`text-product-name-${item.id}`}>
                          {item.product?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{item.product?.category}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantityMutation.mutate({
                              itemId: item.id,
                              quantity: Math.max(1, item.quantity - 1)
                            })}
                            disabled={item.quantity <= 1}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center" data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantityMutation.mutate({
                              itemId: item.id,
                              quantity: item.quantity + 1
                            })}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-lg" data-testid={`text-item-total-${item.id}`}>
                            ${(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid="text-subtotal">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-sm">Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span data-testid="text-total">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full h-12"
                  onClick={() => navigate('/checkout')}
                  data-testid="button-proceed-checkout"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/products')}
                  data-testid="button-continue-shopping"
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
