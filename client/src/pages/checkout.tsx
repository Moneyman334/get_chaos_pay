import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { Loader2, ShoppingCart, CreditCard, Wallet, Bitcoin, Check, X, ExternalLink } from "lucide-react";
import type { Product, Order, Payment } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'metamask' | 'nowpayments' | 'stripe'>('metamask');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  
  const { toast } = useToast();
  const { account, sendTransaction } = useWeb3();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/active'],
  });

  const { data: orderDetails } = useQuery<Order>({
    queryKey: ['/api/orders', currentOrder?.id],
    enabled: !!currentOrder?.id,
    refetchInterval: 5000,
  });

  const { data: paymentStatus } = useQuery<Payment>({
    queryKey: ['/api/payments', currentPayment?.id, 'status'],
    enabled: !!currentPayment?.id,
    refetchInterval: 5000,
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Cart is empty");
      
      const totalAmount = cart.reduce((sum, item) => 
        sum + parseFloat(item.product.price) * item.quantity, 0
      ).toFixed(2);

      const res = await apiRequest("POST", "/api/orders/create", {
        customerEmail: customerEmail || undefined,
        customerWallet: account || undefined,
        paymentMethod: selectedPaymentMethod,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        })),
        totalAmount,
        currency: 'USD'
      });
      
      return await res.json() as Order;
    },
    onSuccess: (order) => {
      setCurrentOrder(order);
      toast({
        title: "Order Created!",
        description: `Order #${order.id.slice(0, 8)} created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Order Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const processMetaMaskPayment = useMutation({
    mutationFn: async () => {
      if (!currentOrder || !account) throw new Error("Missing order or wallet");
      
      // TODO PRODUCTION: Get live ETH/USD rate from API
      const ETH_USD_RATE = 2500; // Placeholder - replace with real-time rate
      const totalEth = (parseFloat(currentOrder.totalAmount) / ETH_USD_RATE).toFixed(6);
      
      // TODO PRODUCTION: Make this configurable via environment variable
      const MERCHANT_ADDRESS = import.meta.env.VITE_MERCHANT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
      
      const txHash = await sendTransaction(MERCHANT_ADDRESS, totalEth);
      
      const res = await apiRequest("POST", "/api/payments/metamask", {
        orderId: currentOrder.id,
        txHash,
        fromAddress: account,
        toAddress: MERCHANT_ADDRESS,
        amount: totalEth,
        amountUSD: currentOrder.totalAmount,
        currency: 'ETH'
      });
      
      return await res.json() as Payment;
    },
    onSuccess: (payment) => {
      setCurrentPayment(payment);
      toast({
        title: "Payment Submitted!",
        description: "Transaction sent to blockchain",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const processNOWPayment = useMutation({
    mutationFn: async (crypto: string) => {
      if (!currentOrder) throw new Error("Missing order");
      
      const res = await apiRequest("POST", "/api/payments/nowpayments", {
        orderId: currentOrder.id,
        crypto,
        amount: currentOrder.totalAmount,
        currency: 'USD'
      });
      
      return await res.json() as Payment;
    },
    onSuccess: (payment) => {
      setCurrentPayment(payment);
      toast({
        title: "Payment Created!",
        description: "Send crypto to complete payment",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    
    toast({
      title: "Added to Cart",
      description: `${product.name} added to your cart`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => 
      sum + parseFloat(item.product.price) * item.quantity, 0
    ).toFixed(2);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Add items to your cart first",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedPaymentMethod === 'metamask' && !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Connect your MetaMask wallet first",
        variant: "destructive",
      });
      return;
    }
    
    createOrderMutation.mutate();
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (currentOrder && !currentPayment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>Order #{currentOrder.id.slice(0, 8)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-bold">${currentOrder.totalAmount} {currentOrder.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <Badge>{currentOrder.paymentMethod}</Badge>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {selectedPaymentMethod === 'metamask' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pay with MetaMask</h3>
                <p className="text-sm text-muted-foreground">
                  Click below to send payment via MetaMask. This will open a MetaMask confirmation window.
                </p>
                <Button
                  className="w-full"
                  onClick={() => processMetaMaskPayment.mutate()}
                  disabled={processMetaMaskPayment.isPending || !account}
                  data-testid="button-pay-metamask"
                >
                  {processMetaMaskPayment.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Pay with MetaMask
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {selectedPaymentMethod === 'nowpayments' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pay with Crypto</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred cryptocurrency
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => processNOWPayment.mutate('btc')}
                    disabled={processNOWPayment.isPending}
                    data-testid="button-pay-btc"
                  >
                    <Bitcoin className="mr-2 h-4 w-4" />
                    Bitcoin
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => processNOWPayment.mutate('eth')}
                    disabled={processNOWPayment.isPending}
                    data-testid="button-pay-eth"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Ethereum
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => processNOWPayment.mutate('sol')}
                    disabled={processNOWPayment.isPending}
                    data-testid="button-pay-sol"
                  >
                    <Bitcoin className="mr-2 h-4 w-4" />
                    Solana
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => processNOWPayment.mutate('usdt')}
                    disabled={processNOWPayment.isPending}
                    data-testid="button-pay-usdt"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    USDT
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentPayment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Order #{currentOrder?.id.slice(0, 8)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              {paymentStatus?.status === 'confirmed' ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Payment Confirmed!</h3>
                  <p className="text-muted-foreground">Your order is complete</p>
                </>
              ) : (
                <>
                  <Loader2 className="mx-auto h-16 w-16 animate-spin mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Processing Payment</h3>
                  <p className="text-muted-foreground">Waiting for blockchain confirmation...</p>
                </>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Payment ID:</span>
                <span className="font-mono text-sm" data-testid="text-payment-id">{currentPayment.id.slice(0, 16)}...</span>
              </div>
              {currentPayment.txHash && (
                <div className="flex justify-between">
                  <span>Transaction:</span>
                  <a 
                    href={`https://etherscan.io/tx/${currentPayment.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge>{paymentStatus?.status || currentPayment.status}</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => {
                setCurrentOrder(null);
                setCurrentPayment(null);
                setCart([]);
              }}
              data-testid="button-new-order"
            >
              New Order
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Products</CardTitle>
              <CardDescription>Select items to add to your cart</CardDescription>
            </CardHeader>
            <CardContent>
              {!products || products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No products available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map(product => (
                    <Card key={product.id} data-testid={`product-${product.id}`}>
                      <CardHeader>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">${product.price}</span>
                          <Button 
                            onClick={() => addToCart(product)}
                            data-testid={`button-add-${product.id}`}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-start gap-4" data-testid={`cart-item-${item.product.id}`}>
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">${item.product.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                            className="w-16"
                            data-testid={`input-quantity-${item.product.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.product.id)}
                            data-testid={`button-remove-${item.product.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span data-testid="text-total">${getTotalAmount()}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Email (Optional)</Label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        data-testid="input-email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Tabs value={selectedPaymentMethod} onValueChange={(value: any) => setSelectedPaymentMethod(value)}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="metamask" data-testid="tab-metamask">
                            <Wallet className="mr-2 h-4 w-4" />
                            MetaMask
                          </TabsTrigger>
                          <TabsTrigger value="nowpayments" data-testid="tab-nowpayments">
                            <Bitcoin className="mr-2 h-4 w-4" />
                            Crypto
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={handleCheckout}
                      disabled={createOrderMutation.isPending || cart.length === 0}
                      data-testid="button-checkout"
                    >
                      {createOrderMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
