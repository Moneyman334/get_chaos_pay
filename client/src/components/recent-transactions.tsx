import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentTransactionsProps {
  account?: string;
}

interface Transaction {
  id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  fee?: string;
}

export default function RecentTransactions({ account }: RecentTransactionsProps) {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', account],
    enabled: !!account,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-amber-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTransactionType = (tx: Transaction) => {
    if (!account) return 'Unknown';
    return tx.fromAddress.toLowerCase() === account.toLowerCase() ? 'Sent' : 'Received';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-secondary/30 border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent transactions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div 
                key={tx.id}
                className="transaction-card bg-secondary/30 border border-border rounded-lg p-4"
                data-testid={`transaction-${tx.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 ${getStatusColor(tx.status)} rounded-full`} />
                    <span className="text-sm font-medium">
                      {getTransactionType(tx)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(tx.timestamp)}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono">{tx.amount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {getTransactionType(tx) === 'Sent' ? 'To:' : 'From:'}
                    </span>
                    <span className="font-mono text-xs">
                      {formatAddress(
                        getTransactionType(tx) === 'Sent' ? tx.toAddress : tx.fromAddress
                      )}
                    </span>
                  </div>
                  {tx.fee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee:</span>
                      <span className="font-mono text-xs">{tx.fee} ETH</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {transactions.length > 0 && (
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-primary hover:underline"
            data-testid="view-all-transactions-button"
          >
            View All Transactions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
