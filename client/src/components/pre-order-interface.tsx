import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Package, CreditCard, CheckCircle } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";

interface PreOrder {
  id: string;
  productId: string;
  expectedReleaseDate: string;
  depositPercentage: string;
  totalQuantity: string;
  preorderedQuantity: string;
  status: string;
  productName?: string;
  productPrice?: string;
}

interface PreOrderInterfaceProps {
  preOrder: PreOrder;
  onPreOrderSuccess?: () => void;
}

export function PreOrderInterface({ preOrder, onPreOrderSuccess }: PreOrderInterfaceProps) {
  const { toast } = useToast();
  const { account } = useWeb3();
  const [quantity, setQuantity] = useState(1);

  const productPrice = parseFloat(preOrder.productPrice || "0");
  const depositPercentage = parseFloat(preOrder.depositPercentage);
  const depositAmount = (productPrice * depositPercentage) / 100;
  const remainingAmount = productPrice - depositAmount;
  const totalDeposit = depositAmount * quantity;
  const totalRemaining = remainingAmount * quantity;
  const totalPrice = productPrice * quantity;

  const available = parseInt(preOrder.totalQuantity) - parseInt(preOrder.preorderedQuantity);
  const isAvailable = available > 0 && preOrder.status === "active";

  const preOrderMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Please connect your wallet");
      if (!isAvailable) throw new Error("Pre-order is not available");

      return apiRequest('POST', '/api/pre-orders', {
        preOrderId: preOrder.id,
        customerWallet: account,
        quantity: quantity.toString(),
        depositAmount: totalDeposit.toString(),
        totalAmount: totalPrice.toString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Pre-Order Confirmed!",
        description: `Your pre-order for ${quantity} item(s) has been placed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pre-orders'] });
      onPreOrderSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Pre-Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const releaseDate = new Date(preOrder.expectedReleaseDate);
  const daysUntilRelease = Math.ceil((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="border-purple-500/50" data-testid="pre-order-interface">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pre-Order Available
            </CardTitle>
            <CardDescription className="mt-1">
              Secure your order now with a {depositPercentage}% deposit
            </CardDescription>
          </div>
          <Badge className="bg-purple-600">
            {available} Left
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Release Date */}
        <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
          <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Expected Release</p>
            <p className="text-sm text-muted-foreground">
              {releaseDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {daysUntilRelease > 0 ? `${daysUntilRelease} days from now` : "Release date passed"}
            </p>
          </div>
        </div>

        {/* Quantity Selector */}
        <div>
          <Label className="text-base mb-3 block">
            Quantity: {quantity}
          </Label>
          <Slider
            value={[quantity]}
            onValueChange={(value) => setQuantity(value[0])}
            min={1}
            max={Math.min(available, 10)}
            step={1}
            className="mb-2"
            data-testid="quantity-slider"
          />
          <p className="text-xs text-muted-foreground">
            Maximum {Math.min(available, 10)} per customer
          </p>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Breakdown
          </h3>

          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unit Price</span>
              <span className="font-medium">${productPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium">×{quantity}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  Deposit Now ({depositPercentage}%)
                </span>
                <span className="font-semibold text-purple-600">
                  ${totalDeposit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Pay on Release
                </span>
                <span className="font-medium">
                  ${totalRemaining.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Pre-Order Benefits</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Guaranteed availability on release day</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Pay only {depositPercentage}% upfront</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Lock in current price</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Priority shipping on release</span>
            </div>
          </div>
        </div>

        {/* Pre-Order Button */}
        {!account ? (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-center">
            <p>Connect your wallet to place a pre-order</p>
          </div>
        ) : !isAvailable ? (
          <Badge variant="secondary" className="w-full justify-center py-3">
            Pre-Orders Closed
          </Badge>
        ) : (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
            onClick={() => preOrderMutation.mutate()}
            disabled={preOrderMutation.isPending}
            data-testid="button-preorder"
          >
            {preOrderMutation.isPending
              ? "Processing..."
              : `Pre-Order Now - Pay $${totalDeposit.toFixed(2)}`}
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Your card will be charged the deposit amount now. The remaining balance will be charged when the product ships.
        </p>
      </CardContent>
    </Card>
  );
}
