import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { usePageTracking } from "@/hooks/use-analytics";
import { 
  Loader2, ShoppingCart, Wallet, Check, ExternalLink, 
  Zap, Shield, ArrowLeft, Mail, CreditCard, Bitcoin 
} from "lucide-react";

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'metamask' | 'nowpayments'>('metamask');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [currentPayment, setCurrentPayment] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { account, sendTransaction, chainId } = useWeb3();
  usePageTracking('/checkout');

  const { data: cart, isLoading: cartLoading } = useQuery<any>({
    queryKey: ['/api/cart'],
  });

  const { data: paymentStatus } = useQuery<any>({
    queryKey: ['/api/payments', currentPayment?.id, 'status'],
    enabled: !!currentPayment?.id,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (paymentStatus?.status === 'confirmed' && cart && cart.items?.length > 0) {
      apiRequest('DELETE', '/api/cart/clear').then(() => {
        queryClient.setQueryData(['/api/cart'], { items: [], total: 0 });
      });
    }
  }, [paymentStatus?.status, cart, queryClient]);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const cartItems = cart?.items || [];
      if (cartItems.length === 0) throw new Error("Cart is empty");
      
      const totalAmount = cart?.total || 0;

      const res = await apiRequest("POST", "/api/orders/create", {
        customerEmail: customerEmail || undefined,
        customerWallet: account || undefined,
        paymentMethod: selectedPaymentMethod,
        items: cartItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product?.price || '0'
        })),
        totalAmount: totalAmount.toFixed(2),
        currency: 'USD',
        chainId: chainId ? parseInt(chainId, 16) : undefined,
      });
      
      return await res.json();
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
      if (!currentOrder || !account || !chainId) throw new Error("Missing order, wallet, or chain info");
      
      const chainIdNum = parseInt(chainId, 16);
      
      // Use server-calculated expected amount from order (with real-time pricing)
      const expectedAmount = currentOrder.expectedCryptoAmount;
      const currency = currentOrder.currency || 'ETH';
      const MERCHANT_ADDRESS = import.meta.env.VITE_MERCHANT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
      
      if (!expectedAmount) {
        throw new Error("Order missing expected crypto amount. Please create a new order.");
      }
      
      toast({
        title: "Sending Transaction",
        description: `Sending ${expectedAmount} ${currency} to merchant...`,
      });
      
      const txHash = await sendTransaction(MERCHANT_ADDRESS, expectedAmount);
      
      toast({
        title: "Transaction Sent!",
        description: "Verifying on blockchain...",
      });
      
      const res = await apiRequest("POST", "/api/payments/metamask", {
        orderId: currentOrder.id,
        txHash,
        fromAddress: account,
        toAddress: MERCHANT_ADDRESS,
        chainId: chainIdNum,
        amount: expectedAmount,
        amountUSD: currentOrder.totalAmount,
        currency
      });
      
      return await res.json();
    },
    onSuccess: async (payment) => {
      setCurrentPayment(payment);
      
      await apiRequest('DELETE', '/api/cart/clear');
      queryClient.setQueryData(['/api/cart'], { items: [], total: 0 });
      
      toast({
        title: "✅ Payment Verified!",
        description: "Your order has been confirmed on the blockchain",
        duration: 8000,
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
      
      return await res.json();
    },
    onSuccess: async (payment) => {
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

  const handleCheckout = () => {
    const cartItems = cart?.items || [];
    if (cartItems.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Add items to your cart first",
        variant: "destructive",
      });
      navigate('/products');
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

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const total = cart?.total || 0;

  if (cartItems.length === 0 && !currentOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">Add some products to checkout</p>
          <Button onClick={() => navigate('/products')} data-testid="button-browse-products">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  if (currentPayment) {
    const activePayment = paymentStatus || currentPayment;
    
    const getExplorerUrl = () => {
      const chainId = activePayment.providerResponse?.chainId;
      const txHash = activePayment.txHash;
      
      if (!txHash) return null;
      
      const explorers: Record<number, string> = {
        1: 'https://etherscan.io',
        11155111: 'https://sepolia.etherscan.io',
        8453: 'https://basescan.org',
        137: 'https://polygonscan.com'
      };
      
      const baseUrl = explorers[chainId ?? 1] ?? explorers[1];
      return `${baseUrl}/tx/${txHash}`;
    };
    
    const verification = activePayment.providerResponse?.verification;
    const chainName = activePayment.providerResponse?.chainName || 'Ethereum';
    const confirmations = verification?.confirmations || parseInt(activePayment.confirmations || '0');
    const explorerUrl = getExplorerUrl();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activePayment.status === 'confirmed' ? (
                  <Shield className="h-6 w-6 text-green-500" />
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin" />
                )}
                Order Confirmation
              </CardTitle>
              <CardDescription>Order #{currentOrder?.id.slice(0, 8)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                {activePayment.status === 'confirmed' ? (
                  <>
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
                      <Check className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold mb-2" data-testid="text-success-title">Payment Confirmed!</h3>
                    <p className="text-muted-foreground mb-4">Your order has been successfully placed</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full text-sm font-medium">
                      <Zap className="h-4 w-4" />
                      Blockchain Verified • Instant Settlement
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mb-4">
                      <Loader2 className="h-10 w-10 animate-spin text-white" />
                    </div>
                    <h3 className="text-3xl font-bold mb-2">Verifying Payment</h3>
                    <p className="text-muted-foreground mb-4">Confirming transaction on {chainName}...</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium">
                      <Shield className="h-4 w-4" />
                      {confirmations} Confirmations
                    </div>
                  </>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-bold text-lg" data-testid="text-order-total">${currentOrder?.totalAmount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge className={activePayment.status === 'confirmed' ? 'bg-green-500' : ''} data-testid="badge-payment-status">
                    {activePayment.status}
                  </Badge>
                </div>
                
                {explorerUrl && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Transaction:</span>
                    <a 
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-medium"
                      data-testid="link-explorer"
                    >
                      View on Explorer
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
              
              {activePayment.status === 'confirmed' && (
                <div className="space-y-3 pt-4">
                  <Button
                    className="w-full"
                    onClick={() => navigate('/orders')}
                    data-testid="button-view-orders"
                  >
                    View My Orders
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/products')}
                    data-testid="button-continue-shopping"
                  >
                    Continue Shopping
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentOrder && !currentPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
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
                    <span className="font-bold" data-testid="text-order-amount">${currentOrder.totalAmount}</span>
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
                    Click below to send payment via MetaMask
                  </p>
                  <Button
                    className="w-full h-12"
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
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/cart')}
          className="gap-2"
          data-testid="button-back-to-cart"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>We'll send your order confirmation here</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select how you'd like to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all ${
                      selectedPaymentMethod === 'metamask' 
                        ? 'border-primary ring-2 ring-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPaymentMethod('metamask')}
                    data-testid="card-payment-metamask"
                  >
                    <CardContent className="p-6 text-center">
                      <Wallet className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">MetaMask</p>
                      <p className="text-sm text-muted-foreground">Pay with ETH</p>
                    </CardContent>
                  </Card>
                  
                  <Card
                    className={`cursor-pointer transition-all ${
                      selectedPaymentMethod === 'nowpayments' 
                        ? 'border-primary ring-2 ring-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPaymentMethod('nowpayments')}
                    data-testid="card-payment-nowpayments"
                  >
                    <CardContent className="p-6 text-center">
                      <Bitcoin className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">Crypto</p>
                      <p className="text-sm text-muted-foreground">BTC, ETH & more</p>
                    </CardContent>
                  </Card>
                </div>

                {selectedPaymentMethod === 'metamask' && !account && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Please connect your MetaMask wallet to proceed with payment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm" data-testid={`summary-item-${item.id}`}>
                      <span className="text-muted-foreground">
                        {item.product?.name} × {item.quantity}
                      </span>
                      <span>${(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid="text-subtotal">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-sm">FREE</span>
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
                  onClick={handleCheckout}
                  disabled={createOrderMutation.isPending}
                  data-testid="button-place-order"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
