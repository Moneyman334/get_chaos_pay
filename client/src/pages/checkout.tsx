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
import { Loader2, ShoppingCart, CreditCard, Wallet, Bitcoin, Check, X, ExternalLink, Zap, Shield, Globe, TrendingDown, Clock } from "lucide-react";
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
  const { account, sendTransaction, chainId } = useWeb3();

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
        currency: 'USD',
        chainId: chainId ? parseInt(chainId, 16) : undefined
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
      if (!currentOrder || !account || !chainId) throw new Error("Missing order, wallet, or chain info");
      
      // Get chain ID as number
      const chainIdNum = parseInt(chainId, 16);
      
      // TODO PRODUCTION: Get live ETH/USD rate from API
      const ETH_USD_RATE = 2500; // Placeholder - replace with real-time rate
      const totalEth = (parseFloat(currentOrder.totalAmount) / ETH_USD_RATE).toFixed(6);
      
      // TODO PRODUCTION: Make this configurable via environment variable
      const MERCHANT_ADDRESS = import.meta.env.VITE_MERCHANT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
      
      toast({
        title: "Sending Transaction",
        description: `Sending ${totalEth} ETH to merchant...`,
      });
      
      const txHash = await sendTransaction(MERCHANT_ADDRESS, totalEth);
      
      toast({
        title: "Transaction Sent!",
        description: "Verifying on blockchain... This may take a moment.",
      });
      
      const res = await apiRequest("POST", "/api/payments/metamask", {
        orderId: currentOrder.id,
        txHash,
        fromAddress: account,
        toAddress: MERCHANT_ADDRESS,
        chainId: chainIdNum,
        amount: totalEth,
        amountUSD: currentOrder.totalAmount,
        currency: 'ETH'
      });
      
      return await res.json() as Payment;
    },
    onSuccess: (payment) => {
      setCurrentPayment(payment);
      
      const verification = payment.providerResponse?.verification;
      const chainName = payment.providerResponse?.chainName || 'blockchain';
      const confirmations = verification?.confirmations || 0;
      const valueETH = verification?.valueETH || payment.amount || '0';
      
      toast({
        title: "✅ Payment Verified On-Chain!",
        description: verification 
          ? `Blockchain verified ${valueETH} ETH on ${chainName} with ${confirmations} confirmations. Instant settlement, no chargebacks, lower fees than traditional processors.`
          : "Your transaction has been verified on the blockchain.",
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
    // Use paymentStatus for real-time updates, fallback to currentPayment for initial data
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
      
      // Use nullish coalescing for safe fallback
      const baseUrl = explorers[chainId ?? 1] ?? explorers[1];
      return `${baseUrl}/tx/${txHash}`;
    };
    
    const verification = activePayment.providerResponse?.verification;
    const chainName = activePayment.providerResponse?.chainName || 'Ethereum';
    const confirmations = verification?.confirmations || parseInt(activePayment.confirmations || '0');
    const explorerUrl = getExplorerUrl();
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activePayment.status === 'confirmed' ? (
                <Shield className="h-6 w-6 text-green-500" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin" />
              )}
              Blockchain Verification
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
                  <h3 className="text-3xl font-bold mb-2">Payment Verified On-Chain!</h3>
                  <p className="text-muted-foreground mb-4">Blockchain confirmed your payment</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full text-sm font-medium">
                    <Zap className="h-4 w-4" />
                    Instant Settlement • Zero Chargebacks
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-2">Verifying On Blockchain</h3>
                  <p className="text-muted-foreground mb-4">Real-time verification in progress...</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    {confirmations} Confirmations on {chainName}
                  </div>
                </>
              )}
            </div>
            
            {activePayment.status === 'confirmed' && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-500" />
                    Blockchain Advantages Delivered
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Instant Settlement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Zero Chargebacks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Cryptographically Secure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>100% Transparent</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="font-mono text-sm" data-testid="text-payment-id">{activePayment.id.slice(0, 16)}...</span>
              </div>
              
              {verification && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount Verified:</span>
                  <span className="font-semibold">{verification.valueETH} ETH on {chainName}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Confirmations:</span>
                <Badge variant="outline">{confirmations}</Badge>
              </div>
              
              {activePayment.txHash && explorerUrl && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Blockchain Explorer:</span>
                  <a 
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    View Transaction
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={activePayment.status === 'confirmed' ? 'bg-green-500' : ''}>
                  {activePayment.status}
                </Badge>
              </div>
              
              {activePayment.fromAddress && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">From Wallet:</span>
                  <span className="font-mono text-xs">{activePayment.fromAddress.slice(0, 8)}...{activePayment.fromAddress.slice(-6)}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => explorerUrl && window.open(explorerUrl, '_blank', 'noopener,noreferrer')}
              disabled={!explorerUrl}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Blockchain
            </Button>
            <Button 
              className="flex-1" 
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

  const calculateSavings = () => {
    const total = parseFloat(getTotalAmount());
    if (total === 0) return '0.00';
    const stripeFee = total * 0.029 + 0.30;
    return stripeFee.toFixed(2);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Blockchain-Native Checkout</h1>
      
      <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Zap className="h-6 w-6 text-yellow-500" />
            The Future of Payments is Here
          </CardTitle>
          <CardDescription className="text-base">
            Experience blockchain-native payments that outperform traditional processors like Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
              <div className="p-2 rounded-full bg-green-500/20">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Instant Settlement</h3>
                <p className="text-sm text-muted-foreground">
                  Funds available immediately. No 2-7 day holds like Stripe.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Zero Chargebacks</h3>
                <p className="text-sm text-muted-foreground">
                  Immutable blockchain transactions eliminate fraud risk.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
              <div className="p-2 rounded-full bg-purple-500/20">
                <TrendingDown className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Lower Fees</h3>
                <p className="text-sm text-muted-foreground">
                  Save ${calculateSavings()} vs Stripe (2.9% + $0.30 per transaction)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
              <div className="p-2 rounded-full bg-orange-500/20">
                <Globe className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Global Access</h3>
                <p className="text-sm text-muted-foreground">
                  No regional restrictions. Works anywhere in the world.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
              <div className="p-2 rounded-full bg-cyan-500/20">
                <ExternalLink className="h-5 w-5 text-cyan-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">100% Transparent</h3>
                <p className="text-sm text-muted-foreground">
                  Every transaction verifiable on public blockchain.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50">
              <div className="p-2 rounded-full bg-pink-500/20">
                <Zap className="h-5 w-5 text-pink-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Multi-Chain Support</h3>
                <p className="text-sm text-muted-foreground">
                  Ethereum, Base, Polygon, and more. Future-proof.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
