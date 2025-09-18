import { useWeb3 } from "@/hooks/use-web3";
import TransactionHistory from "@/components/transaction-history";
import { Card, CardContent } from "@/components/ui/card";
import { History, Wallet } from "lucide-react";
import SEO from "@/components/seo";

export default function TransactionsPage() {
  const { isConnected, account } = useWeb3();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO 
          title="Transaction History - Connect Wallet"
          description="Connect your wallet to view your complete transaction history across all supported blockchains"
        />
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Transaction History</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your complete transaction history across all supported blockchains
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title="Transaction History - Blockchain Transaction Explorer"
        description="View your complete transaction history across multiple blockchains. Track all your crypto transactions, transfers, and smart contract interactions."
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-lg">
          <History className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="transactions-title">
            Transaction History
          </h1>
          <p className="text-muted-foreground">
            Complete transaction history for {account?.slice(0, 6)}...{account?.slice(-4)}
          </p>
        </div>
      </div>

      {/* Transaction History Component */}
      <Card>
        <CardContent className="p-6">
          <TransactionHistory 
            address={account}
            className="w-full"
          />
        </CardContent>
      </Card>
    </div>
  );
}