import { useState, useEffect } from 'react';
import { useWeb3 } from '@/hooks/use-web3';
import { useContract } from '@/hooks/use-contract';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  FileText, 
  Code, 
  Zap, 
  Activity, 
  ExternalLink, 
  Search, 
  Filter,
  Settings,
  Play,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Trash2,
  Edit,
  Network,
  Fuel
} from 'lucide-react';
import { networks } from '@/lib/web3';
import { cn } from '@/lib/utils';
import type { Contract as ContractType } from '@shared/schema';
import type { Address, Abi } from 'viem';

// Contract card component
function ContractCard({ 
  contract, 
  onSelect, 
  onEdit, 
  onDelete 
}: { 
  contract: ContractType;
  onSelect: (contract: ContractType) => void;
  onEdit: (contract: ContractType) => void;
  onDelete: (contract: ContractType) => void;
}) {
  const network = networks[contract.chainId];
  
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
      onClick={() => onSelect(contract)}
      data-testid={`card-contract-${contract.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {contract.name}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {contract.address}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={contract.isVerified === 'true' ? 'default' : 'secondary'}>
              {contract.isVerified === 'true' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Unverified
                </>
              )}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(contract);
                }}
                data-testid={`button-edit-${contract.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(contract);
                }}
                data-testid={`button-delete-${contract.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="flex items-center gap-1">
              <Network className="h-3 w-3" />
              {network?.name || contract.chainId}
            </Badge>
            {contract.description && (
              <p className="text-sm text-muted-foreground truncate max-w-48">
                {contract.description}
              </p>
            )}
          </div>
          
          {contract.tags && contract.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contract.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {contract.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{contract.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Add contract form component
function AddContractForm({ 
  onSuccess, 
  onCancel 
}: { 
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { account } = useWeb3();
  const { createContract, isCreating, validateContractData } = useContract();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    chainId: '0x1',
    abi: '',
    description: '',
    tags: '',
  });
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      setValidationError('Please connect your wallet');
      return;
    }
    
    try {
      setIsValidating(true);
      setValidationError(null);
      
      // Parse and validate ABI
      let parsedAbi: Abi;
      try {
        parsedAbi = JSON.parse(formData.abi);
      } catch {
        throw new Error('Invalid ABI JSON format');
      }
      
      // Validate contract
      const validation = await validateContractData(
        formData.address as Address,
        parsedAbi,
        formData.chainId
      );
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Contract validation failed');
      }
      
      // Create contract
      await createContract({
        name: formData.name,
        address: formData.address,
        chainId: formData.chainId,
        abi: parsedAbi,
        description: formData.description || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        userId: account,
        isVerified: 'true', // Assume verified if validation passes
      });
      
      onSuccess();
    } catch (error: any) {
      setValidationError(error.message || 'Failed to add contract');
    } finally {
      setIsValidating(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contract-name">Contract Name</Label>
          <Input
            id="contract-name"
            placeholder="e.g. USDC Token"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            data-testid="input-contract-name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="chain-select">Network</Label>
          <Select 
            value={formData.chainId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, chainId: value }))}
          >
            <SelectTrigger data-testid="select-chain">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(networks).map(([chainId, network]) => (
                <SelectItem key={chainId} value={chainId}>
                  {network.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contract-address">Contract Address</Label>
        <Input
          id="contract-address"
          placeholder="0x..."
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          required
          data-testid="input-contract-address"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contract-abi">Contract ABI (JSON)</Label>
        <Textarea
          id="contract-abi"
          placeholder="Paste contract ABI JSON here..."
          value={formData.abi}
          onChange={(e) => setFormData(prev => ({ ...prev, abi: e.target.value }))}
          className="min-h-32 font-mono text-sm"
          required
          data-testid="textarea-contract-abi"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contract-description">Description (Optional)</Label>
        <Input
          id="contract-description"
          placeholder="Brief description of the contract"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          data-testid="input-contract-description"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contract-tags">Tags (Optional)</Label>
        <Input
          id="contract-tags"
          placeholder="token, defi, gaming (comma-separated)"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          data-testid="input-contract-tags"
        />
      </div>
      
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          disabled={isCreating || isValidating}
          data-testid="button-add-contract"
        >
          {(isCreating || isValidating) && <Clock className="mr-2 h-4 w-4 animate-spin" />}
          {isValidating ? 'Validating...' : isCreating ? 'Adding...' : 'Add Contract'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Contract interaction interface
function ContractInterface({ contract }: { contract: ContractType }) {
  const {
    readFunctions,
    writeFunctions,
    contractEvents,
    isLoadingContract,
    contractError,
    callReadFunction,
    isReading,
    readResults,
    estimateGas,
    isEstimating,
    gasEstimates,
    writeFunction,
    isWriting,
    callHistory,
    getEvents,
    isOnCorrectNetwork,
    switchToContractNetwork,
    formatFunction,
    getExplorerUrl,
  } = useContract(contract.id);

  const [activeTab, setActiveTab] = useState('read');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  if (isLoadingContract) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (contractError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{typeof contractError === 'string' ? contractError : contractError?.message || 'An error occurred'}</AlertDescription>
      </Alert>
    );
  }

  if (!isOnCorrectNetwork) {
    return (
      <Alert>
        <Network className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>You need to switch to {networks[contract.chainId]?.name} to interact with this contract.</span>
          <Button 
            size="sm" 
            onClick={switchToContractNetwork}
            data-testid="button-switch-network"
          >
            Switch Network
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contract Info Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {contract.name}
          </h2>
          <p className="text-muted-foreground font-mono text-sm">
            {contract.address}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              <Network className="h-3 w-3 mr-1" />
              {networks[contract.chainId]?.name}
            </Badge>
            <Badge variant={contract.isVerified === 'true' ? 'default' : 'secondary'}>
              {contract.isVerified === 'true' ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const explorerUrl = `${networks[contract.chainId]?.blockExplorerUrl}/address/${contract.address}`;
            window.open(explorerUrl, '_blank');
          }}
          data-testid="button-view-explorer"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Explorer
        </Button>
      </div>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="read" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Read ({readFunctions.length})
          </TabsTrigger>
          <TabsTrigger value="write" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Write ({writeFunctions.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Events ({contractEvents.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="read" className="space-y-4">
          <div className="grid gap-4">
            {readFunctions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No read functions found in this contract.
                  </p>
                </CardContent>
              </Card>
            ) : (
              readFunctions.map((func) => (
                <Card key={func.name}>
                  <CardHeader>
                    <CardTitle className="text-lg font-mono">
                      {formatFunction(func)}
                    </CardTitle>
                    <CardDescription>
                      Read-only function • Returns: {func.outputs.map(o => o.type).join(', ') || 'void'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Function inputs */}
                      {func.inputs.length > 0 && (
                        <div className="space-y-2">
                          <Label>Function Arguments</Label>
                          {func.inputs.map((input: any, index: number) => (
                            <div key={index} className="space-y-1">
                              <Label className="text-sm text-muted-foreground">
                                {input.name || `arg${index}`} ({input.type})
                              </Label>
                              <Input 
                                placeholder={`Enter ${input.type}`}
                                data-testid={`input-${func.name}-arg-${index}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Call button and results */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => callReadFunction(func.name, [])}
                          disabled={isReading(func.name, [])}
                          data-testid={`button-call-${func.name}`}
                        >
                          {isReading(func.name, []) && <Clock className="mr-2 h-4 w-4 animate-spin" />}
                          <Play className="mr-2 h-4 w-4" />
                          Call Function
                        </Button>
                      </div>
                      
                      {/* Results display */}
                      {readResults.get(`${func.name}-[]`) && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <Label className="text-sm font-medium">Result:</Label>
                          <pre className="mt-2 text-sm font-mono">
                            {JSON.stringify(readResults.get(`${func.name}-[]`)?.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="write" className="space-y-4">
          <Alert>
            <Fuel className="h-4 w-4" />
            <AlertDescription>
              Write functions modify blockchain state and require gas fees. Always review transaction details before confirming.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            {writeFunctions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No write functions found in this contract.
                  </p>
                </CardContent>
              </Card>
            ) : (
              writeFunctions.map((func) => (
                <Card key={func.name}>
                  <CardHeader>
                    <CardTitle className="text-lg font-mono">
                      {formatFunction(func)}
                    </CardTitle>
                    <CardDescription>
                      State-changing function • Gas required: {func.stateMutability}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Function inputs */}
                      {func.inputs.length > 0 && (
                        <div className="space-y-2">
                          <Label>Function Arguments</Label>
                          {func.inputs.map((input: any, index: number) => (
                            <div key={index} className="space-y-1">
                              <Label className="text-sm text-muted-foreground">
                                {input.name || `arg${index}`} ({input.type})
                              </Label>
                              <Input 
                                placeholder={`Enter ${input.type}`}
                                data-testid={`input-${func.name}-arg-${index}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Value input for payable functions */}
                      {func.stateMutability === 'payable' && (
                        <div className="space-y-2">
                          <Label>ETH Value (optional)</Label>
                          <Input 
                            placeholder="0.0"
                            type="number"
                            step="0.000000000000000001"
                            data-testid={`input-${func.name}-value`}
                          />
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => estimateGas(func.name, [], BigInt(0))}
                          disabled={isEstimating(func.name, [], BigInt(0))}
                          data-testid={`button-estimate-${func.name}`}
                        >
                          {isEstimating(func.name, [], BigInt(0)) && <Clock className="mr-2 h-4 w-4 animate-spin" />}
                          <Fuel className="mr-2 h-4 w-4" />
                          Estimate Gas
                        </Button>
                        
                        <Button
                          onClick={() => writeFunction({ functionName: func.name, args: [] })}
                          disabled={isWriting}
                          data-testid={`button-execute-${func.name}`}
                        >
                          {isWriting && <Clock className="mr-2 h-4 w-4 animate-spin" />}
                          <Zap className="mr-2 h-4 w-4" />
                          Execute Transaction
                        </Button>
                      </div>
                      
                      {/* Gas estimate display */}
                      {gasEstimates.get(`${func.name}-[]-0`) && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <Label className="text-sm font-medium">Gas Estimate:</Label>
                          <div className="mt-2 text-sm space-y-1">
                            <p>Gas Limit: {gasEstimates.get(`${func.name}-[]-0`)?.gasLimit.toString()}</p>
                            <p>Total Cost: {gasEstimates.get(`${func.name}-[]-0`)?.totalCostFormatted}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid gap-4">
            {contractEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No events found in this contract ABI.
                  </p>
                </CardContent>
              </Card>
            ) : (
              contractEvents.map((event) => (
                <Card key={event.name}>
                  <CardHeader>
                    <CardTitle className="text-lg font-mono">
                      {event.name}({event.inputs.map((input: any) => `${input.type} ${input.name}`).join(', ')})
                    </CardTitle>
                    <CardDescription>
                      Contract event • {event.inputs.filter((i: any) => i.indexed).length} indexed parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      onClick={() => getEvents({ eventName: event.name })}
                      data-testid={`button-load-events-${event.name}`}
                    >
                      <Activity className="mr-2 h-4 w-4" />
                      Load Recent Events
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>
                Recent interactions with this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              {callHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No call history found for this contract.
                </p>
              ) : (
                <div className="space-y-4">
                  {callHistory.map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{call.functionName}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.status} • {call.createdAt ? new Date(call.createdAt).toLocaleString() : 'Unknown time'}
                        </p>
                      </div>
                      {call.txHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getExplorerUrl(call.txHash as `0x${string}`), '_blank')}
                          data-testid={`button-view-tx-${call.id}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main contracts page
export default function ContractsPage() {
  const { isConnected, account } = useWeb3();
  const { userContracts, isLoadingContracts, deleteContract } = useContract();
  
  const [selectedContract, setSelectedContract] = useState<ContractType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChain, setFilterChain] = useState<string>('all');

  // Filter contracts based on search and chain
  const filteredContracts = userContracts.filter(contract => {
    const matchesSearch = !searchQuery || 
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesChain = filterChain === 'all' || contract.chainId === filterChain;
    
    return matchesSearch && matchesChain;
  });

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <CardTitle>Smart Contract Interface</CardTitle>
              <CardDescription>
                Connect your wallet to manage and interact with smart contracts
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Please connect your wallet to access the smart contract interface.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Smart Contracts
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and interact with smart contracts across multiple networks
          </p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-contract-trigger">
              <Plus className="mr-2 h-4 w-4" />
              Add Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Contract</DialogTitle>
              <DialogDescription>
                Import a smart contract to interact with its functions and monitor events.
              </DialogDescription>
            </DialogHeader>
            <AddContractForm
              onSuccess={() => setShowAddForm(false)}
              onCancel={() => setShowAddForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {selectedContract ? (
        // Contract interface view
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedContract(null)}
            className="mb-4"
            data-testid="button-back-to-list"
          >
            ← Back to Contract List
          </Button>
          <ContractInterface contract={selectedContract} />
        </div>
      ) : (
        // Contract list view
        <>
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search contracts by name, address, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-contracts"
              />
            </div>
            
            <Select value={filterChain} onValueChange={setFilterChain}>
              <SelectTrigger className="w-48" data-testid="select-filter-chain">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                {Object.entries(networks).map(([chainId, network]) => (
                  <SelectItem key={chainId} value={chainId}>
                    {network.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contract grid */}
          {isLoadingContracts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {userContracts.length === 0 ? 'No contracts yet' : 'No contracts found'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {userContracts.length === 0 
                      ? 'Add your first smart contract to get started'
                      : 'Try adjusting your search or filter settings'
                    }
                  </p>
                  {userContracts.length === 0 && (
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contract
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onSelect={setSelectedContract}
                  onEdit={(contract) => {
                    // TODO: Implement edit functionality
                    console.log('Edit contract:', contract);
                  }}
                  onDelete={(contract) => {
                    if (confirm(`Are you sure you want to delete "${contract.name}"?`)) {
                      deleteContract(contract.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}