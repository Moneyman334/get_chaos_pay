import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ShoppingCart, Trash2, Clock, ArrowRight } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";

interface AbandonedCart {
  id: string;
  customerWallet: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: string;
  }>;
  totalAmount: string;
  currency: string;
  lastUpdated: string;
  expiresAt: string;
  status: string;
  recovered: string;
}

export default function CartRecovery() {
  const { toast } = useToast();
  const { account } = useWeb3();

  const { data: abandonedCarts, isLoading } = useQuery<AbandonedCart[]>({
    queryKey: ['/api/abandoned-carts/wallet', account],
    enabled: !!account,
  });

  const recoverMutation = useMutation({
    mutationFn: async (cartId: string) => {
      return apiRequest('POST', `/api/abandoned-carts/${cartId}/recover`);
    },
    onSuccess: () => {
      toast({
        title: "Cart Restored!",
        description: "Your items have been added back to your cart.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/abandoned-carts/wallet', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Recovery Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cartId: string) => {
      return apiRequest('DELETE', `/api/abandoned-carts/${cartId}`);
    },
    onSuccess: () => {
      toast({
        title: "Cart Deleted",
        description: "Abandoned cart has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/abandoned-carts/wallet', account] });
    },
  });

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const isExpiringSoon = (expiresAt: string) => {
    const daysUntilExpiry = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 1;
  };

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Saved Carts</h2>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your saved shopping carts
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading saved carts...</p>
        </div>
      </div>
    );
  }

  const activeCarts = abandonedCarts?.filter(cart => cart.status === "active") || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Saved Carts</h1>
        <p className="text-muted-foreground">
          Continue where you left off - your carts are saved for 7 days
        </p>
      </div>

      {activeCarts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Saved Carts</h2>
            <p className="text-muted-foreground mb-6">
              Your shopping carts will be automatically saved here
            </p>
            <Button>Start Shopping</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saved Carts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeCarts.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${activeCarts.reduce((sum, cart) => sum + parseFloat(cart.totalAmount), 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {activeCarts.reduce((sum, cart) => sum + cart.items.length, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart List */}
          <div className="space-y-4">
            {activeCarts.map((cart) => {
              const expiringSoon = isExpiringSoon(cart.expiresAt);
              
              return (
                <Card
                  key={cart.id}
                  className={expiringSoon ? "border-yellow-500" : ""}
                  data-testid={`cart-${cart.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5" />
                          Cart from {getDaysAgo(cart.lastUpdated)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          {expiringSoon ? (
                            <span className="text-yellow-600 font-medium">
                              Expires {new Date(cart.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span>
                              Saved until {new Date(cart.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      {expiringSoon && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Cart Items */}
                    <div className="space-y-3 mb-4">
                      {cart.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × ${item.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              ${(item.quantity * parseFloat(item.price)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Total */}
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg mb-4">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-bold">
                        ${cart.totalAmount} {cart.currency}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => recoverMutation.mutate(cart.id)}
                        disabled={recoverMutation.isPending}
                        data-testid={`button-recover-${cart.id}`}
                      >
                        {recoverMutation.isPending ? "Restoring..." : "Continue Shopping"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => deleteMutation.mutate(cart.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${cart.id}`}
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
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Automatic Cart Saving</h3>
                  <p className="text-sm text-muted-foreground">
                    Your shopping carts are automatically saved when you leave the checkout page.
                    They'll be available for 7 days, so you can come back anytime to complete your purchase.
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
