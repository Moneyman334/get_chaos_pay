import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/hooks/use-web3";
import { getTransactionHistory, type ProcessedTransaction, type PaginatedTransactionHistory } from "@/lib/transactionHistory";
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Download, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionHistoryProps {
  address?: string;
  className?: string;
  showHeader?: boolean;
}

interface TransactionFilters {
  search: string;
  status: string;
  type: string;
  network: string;
  dateRange: string;
}

export default function TransactionHistory({ 
  address, 
  className,
  showHeader = true 
}: TransactionHistoryProps) {
  const { chainId, account, network } = useWeb3();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const walletAddress = address || account;
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    status: '',
    type: '',
    network: '',
    dateRange: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState<ProcessedTransaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch transaction history with blockchain integration
  const { data: transactionHistory, isLoading, error, refetch } = useQuery<PaginatedTransactionHistory>({
    queryKey: ['transaction-history', walletAddress, chainId, currentPage, filters],
    queryFn: async () => {
      if (!walletAddress || !chainId) {
        return { transactions: [], hasMore: false, totalCount: 0, page: 1, limit: 25 };
      }
      return getTransactionHistory(walletAddress, chainId, {
        page: currentPage,
        limit: 25,
        includeTokenTransfers: true
      });
    },
    enabled: !!walletAddress && !!chainId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Fetch transaction statistics
  const { data: stats } = useQuery({
    queryKey: ['transaction-stats', walletAddress],
    queryFn: async () => {
      const response = await fetch(`/api/transactions/${walletAddress}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!walletAddress,
  });

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    if (!transactionHistory?.transactions) return [];

    return transactionHistory.transactions.filter(tx => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          tx.hash.toLowerCase().includes(searchTerm) ||
          tx.fromAddress.toLowerCase().includes(searchTerm) ||
          tx.toAddress.toLowerCase().includes(searchTerm) ||
          tx.tokenSymbol?.toLowerCase().includes(searchTerm) ||
          tx.tokenName?.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && tx.status !== filters.status) return false;

      // Type filter
      if (filters.type && tx.type !== filters.type) return false;

      // Network filter
      if (filters.network && tx.network !== filters.network) return false;

      // Date range filter
      if (filters.dateRange) {
        const txDate = new Date(tx.timestamp);
        const now = new Date();
        let startDate = new Date();

        switch (filters.dateRange) {
          case '1d':
            startDate.setDate(now.getDate() - 1);
            break;
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
          default:
            return true;
        }

        if (txDate < startDate) return false;
      }

      return true;
    });
  }, [transactionHistory?.transactions, filters]);

  // Export functionality
  const handleExport = async (format: 'json' | 'csv') => {
    if (!walletAddress) return;

    setIsExporting(true);
    try {
      const response = await fetch(`/api/transactions/${walletAddress}/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${walletAddress}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Transaction history exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "Failed to export transaction history",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Transaction status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'pending':
        return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      default:
        return { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
  };

  // Transaction type icon and label
  const getTypeDisplay = (tx: ProcessedTransaction) => {
    switch (tx.type) {
      case 'sent':
        return { icon: ArrowUpRight, label: 'Sent', color: 'text-red-500' };
      case 'received':
        return { icon: ArrowDownLeft, label: 'Received', color: 'text-green-500' };
      case 'token_transfer':
        return { icon: Activity, label: 'Token Transfer', color: 'text-blue-500' };
      case 'contract_interaction':
        return { icon: FileText, label: 'Contract', color: 'text-purple-500' };
      default:
        return { icon: Activity, label: 'Transaction', color: 'text-gray-500' };
    }
  };

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!walletAddress) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Connect your wallet to view transaction history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transaction History</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  data-testid="refresh-transactions-button"
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
                <Select onValueChange={(value) => handleExport(value as 'json' | 'csv')}>
                  <SelectTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isExporting}
                      data-testid="export-transactions-button"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">Export as JSON</SelectItem>
                    <SelectItem value="csv">Export as CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          
          {/* Statistics */}
          {stats && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.confirmed}</div>
                  <div className="text-sm text-muted-foreground">Confirmed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                    data-testid="search-transactions-input"
                  />
                </div>
                
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger data-testid="filter-status-select">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger data-testid="filter-type-select">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="token_transfer">Token Transfer</SelectItem>
                    <SelectItem value="contract_interaction">Contract</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.network} onValueChange={(value) => setFilters(prev => ({ ...prev, network: value }))}>
                  <SelectTrigger data-testid="filter-network-select">
                    <SelectValue placeholder="All Networks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Networks</SelectItem>
                    {stats.networks?.map((net: string) => (
                      <SelectItem key={net} value={net}>{net}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger data-testid="filter-date-select">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Time</SelectItem>
                    <SelectItem value="1d">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Transaction List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Failed to load transaction history</p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const statusDisplay = getStatusDisplay(tx.status);
                const typeDisplay = getTypeDisplay(tx);
                const StatusIcon = statusDisplay.icon;
                const TypeIcon = typeDisplay.icon;

                return (
                  <Dialog key={tx.hash}>
                    <DialogTrigger asChild>
                      <div
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 cursor-pointer transition-colors"
                        data-testid={`transaction-${tx.hash}`}
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={cn("p-2 rounded-full", statusDisplay.bg)}>
                            <StatusIcon className={cn("h-5 w-5", statusDisplay.color)} />
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <TypeIcon className={cn("h-4 w-4", typeDisplay.color)} />
                              <span className="font-medium">{typeDisplay.label}</span>
                              {tx.tokenSymbol && (
                                <Badge variant="secondary" className="text-xs">
                                  {tx.tokenSymbol}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tx.direction === 'outgoing' ? 'To' : 'From'}: {formatAddress(
                                tx.direction === 'outgoing' ? tx.toAddress : tx.fromAddress
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          <div className={cn("font-mono", 
                            tx.direction === 'outgoing' ? 'text-red-500' : 'text-green-500'
                          )}>
                            {tx.direction === 'outgoing' ? '-' : '+'}{tx.amount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(tx.timestamp)}
                          </div>
                        </div>
                        
                        <ExternalLink 
                          className="h-4 w-4 text-muted-foreground ml-4" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(tx.explorerUrl, '_blank');
                          }}
                        />
                      </div>
                    </DialogTrigger>
                    
                    {/* Transaction Details Modal */}
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                      </DialogHeader>
                      
                      {selectedTransaction && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium">Status</div>
                              <div className="flex items-center space-x-2 mt-1">
                                <StatusIcon className={cn("h-4 w-4", statusDisplay.color)} />
                                <span className="capitalize">{selectedTransaction.status}</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium">Type</div>
                              <div className="flex items-center space-x-2 mt-1">
                                <TypeIcon className={cn("h-4 w-4", typeDisplay.color)} />
                                <span>{typeDisplay.label}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-medium">Transaction Hash</div>
                              <div className="font-mono text-sm break-all">{selectedTransaction.hash}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium">From</div>
                                <div className="font-mono text-sm break-all">{selectedTransaction.fromAddress}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">To</div>
                                <div className="font-mono text-sm break-all">{selectedTransaction.toAddress}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium">Amount</div>
                                <div className="font-mono">{selectedTransaction.amount}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">Fee</div>
                                <div className="font-mono">{selectedTransaction.fee}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium">Network</div>
                                <div>{selectedTransaction.network}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">Block Number</div>
                                <div className="font-mono">{selectedTransaction.blockNumber}</div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium">Timestamp</div>
                              <div>{selectedTransaction.timestamp.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              onClick={() => window.open(selectedTransaction.explorerUrl, '_blank')}
                              data-testid="view-on-explorer-button"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View on Block Explorer
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {transactionHistory && transactionHistory.hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={isLoading}
                data-testid="load-more-transactions-button"
              >
                Load More Transactions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}