import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Package, Clock, CheckCircle, XCircle, ExternalLink, Truck, Image as ImageIcon, Shield, Gift, DollarSign, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Order, Payment } from "@shared/schema";

interface Product {
  id: string;
  name: string;
  imageUrl: string | null;
  price: string;
}

export default function OrdersPage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: walletOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/wallet', account],
    enabled: !!account,
  });

  const { data: orderPayments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments/order', selectedOrderId],
    enabled: !!selectedOrderId,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const mintNFTReceiptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!account) throw new Error("Connect wallet to mint NFT receipt");
      return apiRequest('POST', '/api/nft-receipts/mint', {
        orderId,
        customerWallet: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "NFT Receipt Minted!",
        description: "Your blockchain receipt has been created and sent to your wallet",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/wallet', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Mint Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestRefundMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      return apiRequest('POST', '/api/refunds/request', {
        orderId,
        customerWallet: account,
        reason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Refund Requested",
        description: "Your refund request has been submitted for review",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/wallet', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Refund Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'processing':
      case 'awaiting_payment':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'shipped':
        return 'bg-blue-500';
      case 'processing':
      case 'awaiting_payment':
        return 'bg-yellow-500';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getOrderProgress = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'shipped':
        return 75;
      case 'processing':
        return 50;
      case 'awaiting_payment':
        return 25;
      default:
        return 0;
    }
  };

  const getProductDetails = (productId: string) => {
    return products?.find(p => p.id === productId);
  };

  const getExplorerUrl = (txHash: string, chainId?: string) => {
    const chain = chainId ? parseInt(chainId) : 1;
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      8453: 'https://basescan.org',
      11155111: 'https://sepolia.etherscan.io',
    };
    return `${explorers[chain] || explorers[1]}/tx/${txHash}`;
  };

  // Calculate stats
  const totalOrders = walletOrders?.length || 0;
  const completedOrders = walletOrders?.filter(o => o.status === 'completed').length || 0;
  const pendingOrders = walletOrders?.filter(o => ['processing', 'awaiting_payment', 'shipped'].includes(o.status)).length || 0;
  const totalSpent = walletOrders?.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0) || 0;

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Connect your wallet to view your orders</CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">
              Please connect your wallet to view order history
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">View and track your blockchain-verified orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold">{totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{completedOrders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{pendingOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      {!walletOrders || walletOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => window.location.href = '/checkout'}>
              Browse Products
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {walletOrders.map(order => {
            const progress = getOrderProgress(order.status);
            const canMintNFT = order.status === 'completed';
            const canRefund = ['completed', 'shipped'].includes(order.status);

            return (
              <Card key={order.id} data-testid={`order-${order.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        {getStatusIcon(order.status)}
                        Order #{order.id.slice(0, 8)}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Placed {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${order.totalAmount}</p>
                      <p className="text-sm text-muted-foreground">{order.currency}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Order Progress</span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Payment</span>
                      <span>Processing</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  {order.items && Array.isArray(order.items) && (order.items as any[]).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {(order.items as any[]).map((item: any, idx: number) => {
                          const product = getProductDetails(item.productId);
                          return (
                            <div key={idx} className="flex gap-4 p-3 rounded-lg border">
                              <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                {product?.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium">{product?.name || `Product ${item.productId.slice(0, 8)}`}</h5>
                                <p className="text-sm text-muted-foreground">Quantity: {item.quantity || 1}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${item.price}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Order Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium capitalize">{order.paymentMethod}</p>
                    </div>
                    {order.customerEmail && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-sm">{order.customerEmail}</p>
                      </div>
                    )}
                    {order.chainId && (
                      <div>
                        <p className="text-sm text-muted-foreground">Network</p>
                        <p className="font-medium">
                          {order.chainId === '1' ? 'Ethereum' :
                           order.chainId === '137' ? 'Polygon' :
                           order.chainId === '8453' ? 'Base' :
                           `Chain ${order.chainId}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                      data-testid={`button-view-${order.id}`}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      {selectedOrderId === order.id ? 'Hide' : 'View'} Details
                    </Button>

                    {canMintNFT && (
                      <Button
                        variant="outline"
                        onClick={() => mintNFTReceiptMutation.mutate(order.id)}
                        disabled={mintNFTReceiptMutation.isPending}
                        data-testid={`button-mint-nft-${order.id}`}
                      >
                        <Gift className="mr-2 h-4 w-4" />
                        {mintNFTReceiptMutation.isPending ? "Minting..." : "Mint NFT Receipt"}
                      </Button>
                    )}

                    {canRefund && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const reason = prompt("Please provide a reason for the refund:");
                          if (reason) {
                            requestRefundMutation.mutate({ orderId: order.id, reason });
                          }
                        }}
                        disabled={requestRefundMutation.isPending}
                        data-testid={`button-refund-${order.id}`}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Request Refund
                      </Button>
                    )}
                  </div>

                  {/* Payment Details */}
                  {selectedOrderId === order.id && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      {paymentsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : !orderPayments || orderPayments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No payment records found
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-500" />
                            Blockchain-Verified Payments
                          </h4>
                          {orderPayments.map(payment => (
                            <Card
                              key={payment.id}
                              data-testid={`payment-${payment.id}`}
                              className="bg-background"
                            >
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <p className="text-sm font-medium">Payment ID</p>
                                    <p className="text-xs font-mono text-muted-foreground">
                                      {payment.id.slice(0, 16)}...
                                    </p>
                                  </div>
                                  <Badge className={getStatusColor(payment.status)}>
                                    {payment.status}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Amount</p>
                                    <p className="font-semibold">{payment.amount} {payment.currency}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Provider</p>
                                    <p className="font-semibold capitalize">{payment.provider}</p>
                                  </div>
                                  {payment.confirmations && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Confirmations</p>
                                      <p className="font-semibold">{payment.confirmations}</p>
                                    </div>
                                  )}
                                  {payment.fromAddress && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">From</p>
                                      <p className="text-xs font-mono">{payment.fromAddress.slice(0, 8)}...{payment.fromAddress.slice(-6)}</p>
                                    </div>
                                  )}
                                </div>

                                {payment.txHash && (
                                  <div>
                                    <a
                                      href={getExplorerUrl(payment.txHash, payment.chainId)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline text-sm flex items-center gap-1"
                                    >
                                      <Shield className="h-4 w-4" />
                                      View on Blockchain Explorer
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                )}

                                {payment.confirmedAt && (
                                  <p className="text-xs text-muted-foreground mt-3">
                                    Confirmed {formatDistanceToNow(new Date(payment.confirmedAt), { addSuffix: true })}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
