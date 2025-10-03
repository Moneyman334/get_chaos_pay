import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Gift, CreditCard, Mail } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";

export default function GiftCards() {
  const { toast } = useToast();
  const { account } = useWeb3();
  
  const [purchaseForm, setPurchaseForm] = useState({
    amount: "",
    recipientEmail: "",
    recipientWallet: "",
    message: "",
  });

  const [redeemCode, setRedeemCode] = useState("");

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Please connect your wallet");
      
      const amount = parseFloat(purchaseForm.amount);
      if (isNaN(amount) || amount < 10) {
        throw new Error("Minimum gift card amount is $10");
      }

      return apiRequest('POST', '/api/giftcards', {
        initialValue: amount.toString(),
        currentBalance: amount.toString(),
        currency: "USD",
        purchasedBy: account,
        recipientEmail: purchaseForm.recipientEmail || undefined,
        recipientWallet: purchaseForm.recipientWallet || undefined,
        message: purchaseForm.message || undefined,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Gift Card Created!",
        description: `Gift card code: ${data.code}`,
      });
      setPurchaseForm({
        amount: "",
        recipientEmail: "",
        recipientWallet: "",
        message: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async () => {
      if (!redeemCode.trim()) {
        throw new Error("Please enter a gift card code");
      }

      const response = await fetch(`/api/giftcards/${redeemCode.trim()}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch gift card: ${response.status}`);
      }
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Gift Card Found!",
        description: `Balance: $${data.currentBalance} • Status: ${data.status}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 text-center">
        <Gift className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 className="text-4xl font-bold mb-2">Gift Cards</h1>
        <p className="text-muted-foreground">Give the gift of crypto shopping</p>
      </div>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="redeem">Redeem</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Gift Card</CardTitle>
              <CardDescription>
                Send a blockchain-backed gift card to friends and family
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Gift Card Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="10"
                  placeholder="50.00"
                  value={purchaseForm.amount}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, amount: e.target.value })}
                  data-testid="input-amount"
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum: $10.00</p>
              </div>

              <div>
                <Label htmlFor="recipientEmail">Recipient Email (Optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="friend@example.com"
                    className="pl-10"
                    value={purchaseForm.recipientEmail}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientEmail: e.target.value })}
                    data-testid="input-recipient-email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recipientWallet">Recipient Wallet (Optional)</Label>
                <Input
                  id="recipientWallet"
                  placeholder="0x..."
                  value={purchaseForm.recipientWallet}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, recipientWallet: e.target.value })}
                  data-testid="input-recipient-wallet"
                />
              </div>

              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Happy Birthday! Enjoy shopping..."
                  value={purchaseForm.message}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, message: e.target.value })}
                  rows={3}
                  data-testid="input-message"
                />
              </div>

              {!account ? (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-center">
                  <p>Connect your wallet to purchase a gift card</p>
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => purchaseMutation.mutate()}
                  disabled={!purchaseForm.amount || purchaseMutation.isPending}
                  data-testid="button-purchase"
                >
                  {purchaseMutation.isPending ? "Creating Gift Card..." : `Purchase $${purchaseForm.amount || "0.00"} Gift Card`}
                </Button>
              )}

              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <p className="font-semibold">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Choose your gift card amount</li>
                  <li>Add recipient details (optional)</li>
                  <li>Complete payment with crypto</li>
                  <li>Receive unique gift card code instantly</li>
                  <li>Share the code with your recipient</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeem">
          <Card>
            <CardHeader>
              <CardTitle>Redeem Gift Card</CardTitle>
              <CardDescription>
                Check your gift card balance and redeem it at checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="code">Gift Card Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    placeholder="Enter your gift card code"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="font-mono"
                    data-testid="input-redeem-code"
                  />
                  <Button
                    onClick={() => redeemMutation.mutate()}
                    disabled={!redeemCode.trim() || redeemMutation.isPending}
                    data-testid="button-check-balance"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {redeemMutation.isPending ? "Checking..." : "Check Balance"}
                  </Button>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <p className="font-semibold">To use your gift card:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Check your balance using the form above</li>
                  <li>Add items to your cart and proceed to checkout</li>
                  <li>Enter your gift card code during checkout</li>
                  <li>The balance will be automatically applied</li>
                  <li>Any remaining balance stays on the card</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Benefits of Blockchain Gift Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Never Expires</p>
                      <p className="text-xs text-muted-foreground">No expiration dates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Instant Delivery</p>
                      <p className="text-xs text-muted-foreground">No shipping wait</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Partial Redemption</p>
                      <p className="text-xs text-muted-foreground">Use over time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Blockchain Secured</p>
                      <p className="text-xs text-muted-foreground">Can't be lost</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
