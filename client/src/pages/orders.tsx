import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "@/hooks/use-web3";
import { Loader2, Package, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Order, Payment } from "@shared/schema";

export default function OrdersPage() {
  const { account } = useWeb3();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: walletOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/wallet', account],
    enabled: !!account,
  });

  const { data: orderPayments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments/order', selectedOrderId],
    enabled: !!selectedOrderId,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
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
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
      case 'awaiting_payment':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

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
        <p className="text-muted-foreground">View and track your order history</p>
      </div>

      {!walletOrders || walletOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-4">No orders found</p>
            <Button onClick={() => window.location.href = '/checkout'}>
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {walletOrders.map(order => (
            <Card key={order.id} data-testid={`order-${order.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.status)} data-testid={`status-${order.id}`}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold" data-testid={`amount-${order.id}`}>
                      ${order.totalAmount} {order.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="text-lg font-medium">{order.paymentMethod}</p>
                  </div>
                </div>

                {order.items && Array.isArray(order.items) && (order.items as any[]).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Items</p>
                    <div className="space-y-2">
                      {(order.items as any[]).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.productId ? `Product: ${item.productId.slice(0, 8)}` : 'Product'}
                            {item.quantity ? ` x${item.quantity}` : ''}
                          </span>
                          {item.price && <span className="font-medium">${item.price}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)}
                    data-testid={`button-view-${order.id}`}
                  >
                    {selectedOrderId === order.id ? 'Hide' : 'View'} Payments
                  </Button>
                </div>

                {selectedOrderId === order.id && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/50">
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
                        <h4 className="font-semibold">Payment Details</h4>
                        {orderPayments.map(payment => (
                          <div
                            key={payment.id}
                            className="p-3 border rounded bg-background"
                            data-testid={`payment-${payment.id}`}
                          >
                            <div className="flex justify-between items-start mb-2">
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
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Amount</p>
                                <p className="font-medium">{payment.amount} {payment.currency}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Method</p>
                                <p className="font-medium">{payment.provider}</p>
                              </div>
                            </div>
                            {payment.txHash && (
                              <div className="mt-2">
                                <a
                                  href={`https://etherscan.io/tx/${payment.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm flex items-center gap-1"
                                >
                                  View Transaction
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                            {payment.confirmedAt && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Confirmed {formatDistanceToNow(new Date(payment.confirmedAt), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
