import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { RefreshCw } from "lucide-react";

interface SendTransactionProps {
  account?: string;
  balance?: string;
}

export default function SendTransaction({ account, balance }: SendTransactionProps) {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gasEstimate, setGasEstimate] = useState({
    gasLimit: "21,000",
    gasPrice: "25 gwei",
    estimatedFee: "0.000525 ETH"
  });
  
  const { toast } = useToast();
  const { sendTransaction, estimateGas } = useWeb3();

  const refreshGasEstimate = async () => {
    if (!recipientAddress || !sendAmount) return;
    
    try {
      const estimate = await estimateGas(recipientAddress, sendAmount);
      setGasEstimate(estimate);
      toast({
        title: "Gas estimate updated",
        description: "Latest gas prices fetched successfully",
      });
    } catch (error) {
      console.error("Failed to estimate gas:", error);
      toast({
        title: "Failed to estimate gas",
        description: "Please check your transaction details",
        variant: "destructive",
      });
    }
  };

  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientAddress || !sendAmount) {
      toast({
        title: "Missing information",
        description: "Please fill in all transaction details",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(sendAmount) > parseFloat(balance || "0")) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough ETH for this transaction",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const txHash = await sendTransaction(recipientAddress, sendAmount);
      toast({
        title: "Transaction sent",
        description: `Transaction hash: ${txHash}`,
      });
      
      // Reset form
      setRecipientAddress("");
      setSendAmount("");
    } catch (error: any) {
      console.error("Transaction failed:", error);
      toast({
        title: "Transaction failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Send Transaction</h2>
        
        <form onSubmit={handleSendTransaction} className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              type="text"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="font-mono"
              data-testid="recipient-address-input"
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              data-testid="send-amount-input"
            />
          </div>
          
          {/* Gas Estimation */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Gas Estimation</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={refreshGasEstimate}
                className="text-xs text-primary hover:underline p-0 h-auto"
                data-testid="refresh-gas-button"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Gas Limit</div>
                <div className="font-mono" data-testid="gas-limit">
                  {gasEstimate.gasLimit}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Gas Price</div>
                <div className="font-mono" data-testid="gas-price">
                  {gasEstimate.gasPrice}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Est. Fee</div>
                <div className="font-mono" data-testid="estimated-fee">
                  {gasEstimate.estimatedFee}
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !recipientAddress || !sendAmount}
            data-testid="send-transaction-button"
          >
            {isLoading ? "Sending..." : "Send Transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
