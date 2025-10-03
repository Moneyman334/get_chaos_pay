import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWeb3 } from '@/hooks/use-web3';
import { useToast } from '@/hooks/use-toast';
import {
  ContractInfo,
  ContractFunction,
  ContractEvent,
  ContractCallResult,
  EstimateResult,
  WriteResult,
  EventFilter,
  readContract,
  writeContract,
  estimateContractWrite,
  getContractEvents,
  parseContractAbi,
  validateContract,
  ensureCorrectNetwork,
  getExplorerUrl,
  formatFunctionSignature,
} from '@/lib/contracts';
import type { 
  Contract, 
  InsertContract, 
  ContractCall, 
  InsertContractCall,
  ContractEventSub,
  InsertContractEventSub
} from '@shared/schema';
import type { Address, Abi, Hash } from 'viem';

// Hook state interfaces
interface ContractState {
  readFunctions: ContractFunction[];
  writeFunctions: ContractFunction[];
  events: ContractEvent[];
  isLoading: boolean;
  error: string | null;
}

interface CallHistory {
  calls: ContractCall[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

interface EventSubscription {
  id: string;
  subscription: ContractEventSub;
  isActive: boolean;
}

// Main contract hook
export function useContract(contractId?: string) {
  const { account, chainId, isConnected } = useWeb3();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ================================
  // CONTRACT MANAGEMENT
  // ================================

  // Get single contract
  const { 
    data: contract, 
    isLoading: isLoadingContract, 
    error: contractError 
  } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      if (!contractId) return null;
      const response = await fetch(`/api/contracts/${contractId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Failed to fetch contract: ${response.status}`);
      return await response.json() as Contract;
    },
    enabled: !!contractId,
  });

  // Get user's contracts
  const { 
    data: userContracts = [], 
    isLoading: isLoadingContracts 
  } = useQuery({
    queryKey: ['contracts', account],
    queryFn: async () => {
      const response = await fetch(`/api/contracts?userId=${account}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Failed to fetch contracts: ${response.status}`);
      const data = await response.json();
      return data.contracts as Contract[];
    },
    enabled: !!account,
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (contractData: InsertContract) => {
      const response = await apiRequest('POST', '/api/contracts', contractData);
      return await response.json() as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: 'Contract Added',
        description: 'Smart contract has been successfully added to your library.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Add Contract',
        description: error.message || 'Failed to add contract to your library.',
        variant: 'destructive',
      });
    },
  });

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertContract> }) => {
      const response = await apiRequest('PATCH', `/api/contracts/${id}`, updates);
      return await response.json() as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      toast({
        title: 'Contract Updated',
        description: 'Contract information has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update contract.',
        variant: 'destructive',
      });
    },
  });

  // Delete contract mutation
  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: 'Contract Deleted',
        description: 'Contract has been removed from your library.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion Failed',
        description: error.message || 'Failed to delete contract.',
        variant: 'destructive',
      });
    },
  });

  // ================================
  // CONTRACT ANALYSIS
  // ================================

  // Parse contract ABI and extract functions/events
  const [contractState, setContractState] = useState<ContractState>({
    readFunctions: [],
    writeFunctions: [],
    events: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (contract?.abi) {
      setContractState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const { readFunctions, writeFunctions, events } = parseContractAbi(contract.abi as Abi);
        setContractState({
          readFunctions,
          writeFunctions,
          events,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setContractState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to parse contract ABI',
        }));
      }
    } else {
      setContractState({
        readFunctions: [],
        writeFunctions: [],
        events: [],
        isLoading: false,
        error: null,
      });
    }
  }, [contract?.abi]);

  // ================================
  // CONTRACT FUNCTION CALLS
  // ================================

  // Read function state
  const [readResults, setReadResults] = useState<Map<string, ContractCallResult>>(new Map());
  const [isReading, setIsReading] = useState<Set<string>>(new Set());

  // Call read function
  const callReadFunction = useCallback(
    async (functionName: string, args: any[] = []) => {
      if (!contract || !isConnected) {
        toast({
          title: 'Not Connected',
          description: 'Please connect your wallet to interact with contracts.',
          variant: 'destructive',
        });
        return;
      }

      const callKey = `${functionName}-${JSON.stringify(args)}`;
      setIsReading(prev => new Set(prev).add(callKey));

      try {
        const contractInfo: ContractInfo = {
          id: contract.id,
          address: contract.address as Address,
          chainId: contract.chainId,
          name: contract.name,
          abi: contract.abi as Abi,
          tags: contract.tags || [],
          description: contract.description || undefined,
          isVerified: contract.isVerified === 'true',
        };

        const result = await readContract(contractInfo, functionName, args);
        
        setReadResults(prev => new Map(prev).set(callKey, result));

        if (result.success) {
          toast({
            title: 'Function Called',
            description: `Successfully called ${functionName}`,
          });
        } else {
          toast({
            title: 'Call Failed',
            description: result.error || 'Failed to call function',
            variant: 'destructive',
          });
        }

        return result;
      } catch (error: any) {
        const errorResult: ContractCallResult = {
          success: false,
          error: error.message || 'Unexpected error occurred',
        };
        
        setReadResults(prev => new Map(prev).set(callKey, errorResult));
        
        toast({
          title: 'Call Failed',
          description: error.message || 'Failed to call function',
          variant: 'destructive',
        });

        return errorResult;
      } finally {
        setIsReading(prev => {
          const newSet = new Set(prev);
          newSet.delete(callKey);
          return newSet;
        });
      }
    },
    [contract, isConnected, toast]
  );

  // Estimate gas for write function
  const [gasEstimates, setGasEstimates] = useState<Map<string, EstimateResult>>(new Map());
  const [isEstimating, setIsEstimating] = useState<Set<string>>(new Set());

  const estimateGas = useCallback(
    async (functionName: string, args: any[] = [], value: bigint = 0n) => {
      if (!contract || !account || !chainId) {
        return null;
      }

      const estimateKey = `${functionName}-${JSON.stringify(args)}-${value.toString()}`;
      setIsEstimating(prev => new Set(prev).add(estimateKey));

      try {
        // Ensure on correct network
        await ensureCorrectNetwork(contract.chainId);

        const contractInfo: ContractInfo = {
          id: contract.id,
          address: contract.address as Address,
          chainId: contract.chainId,
          name: contract.name,
          abi: contract.abi as Abi,
          tags: contract.tags || [],
          description: contract.description || undefined,
          isVerified: contract.isVerified === 'true',
        };

        const estimate = await estimateContractWrite(
          contractInfo,
          functionName,
          args,
          value,
          account as Address
        );

        setGasEstimates(prev => new Map(prev).set(estimateKey, estimate));
        return estimate;
      } catch (error: any) {
        toast({
          title: 'Estimation Failed',
          description: error.message || 'Failed to estimate gas',
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsEstimating(prev => {
          const newSet = new Set(prev);
          newSet.delete(estimateKey);
          return newSet;
        });
      }
    },
    [contract, account, chainId, toast]
  );

  // Write function mutation
  const writeContractMutation = useMutation({
    mutationFn: async ({
      functionName,
      args = [],
      value = 0n,
      gasLimit,
    }: {
      functionName: string;
      args?: any[];
      value?: bigint;
      gasLimit?: bigint;
    }) => {
      if (!contract || !account) {
        throw new Error('Contract or account not available');
      }

      // Ensure on correct network
      await ensureCorrectNetwork(contract.chainId);

      const contractInfo: ContractInfo = {
        id: contract.id,
        address: contract.address as Address,
        chainId: contract.chainId,
        name: contract.name,
        abi: contract.abi as Abi,
        tags: contract.tags || [],
        description: contract.description || undefined,
        isVerified: contract.isVerified === 'true',
      };

      const result = await writeContract(contractInfo, functionName, args, value, gasLimit);

      // Record call in backend
      if (result.hash && result.hash !== '0x') {
        const callData: InsertContractCall = {
          contractId: contract.id,
          functionName,
          args: args.length > 0 ? args : null,
          fromAddress: account,
          toAddress: contract.address,
          txHash: result.hash,
          status: result.success ? 'confirmed' : 'failed',
          blockNumber: result.receipt?.blockNumber?.toString(),
          gasUsed: result.receipt?.gasUsed?.toString(),
          gasPrice: result.receipt?.effectiveGasPrice?.toString(),
          value: value.toString(),
          error: result.error || null,
          chainId: contract.chainId,
          callType: 'write',
        };

        try {
          await apiRequest('POST', `/api/contracts/${contract.id}/calls`, callData);
        } catch (error) {
          console.error('Failed to record contract call:', error);
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contract-calls', contract?.id] });
      
      if (result.success) {
        toast({
          title: 'Transaction Successful',
          description: `Transaction has been confirmed on the blockchain. Hash: ${result.hash}`,
        });
      } else {
        toast({
          title: 'Transaction Failed',
          description: result.error || 'Transaction was reverted',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Transaction Failed',
        description: error.message || 'Failed to execute transaction',
        variant: 'destructive',
      });
    },
  });

  // ================================
  // CONTRACT CALL HISTORY
  // ================================

  const [callHistory, setCallHistory] = useState<CallHistory>({
    calls: [],
    isLoading: false,
    error: null,
    hasMore: false,
    page: 1,
  });

  // Get contract call history
  const { data: contractCalls } = useQuery({
    queryKey: ['contract-calls', contractId, callHistory.page],
    queryFn: async () => {
      if (!contractId) return { calls: [], pagination: { hasMore: false } };
      const response = await fetch(`/api/contracts/${contractId}/calls?page=${callHistory.page}&limit=25`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error(`Failed to fetch contract calls: ${response.status}`);
      return await response.json();
    },
    enabled: !!contractId,
  });

  useEffect(() => {
    if (contractCalls) {
      setCallHistory(prev => ({
        ...prev,
        calls: prev.page === 1 ? contractCalls.calls : [...prev.calls, ...contractCalls.calls],
        isLoading: false,
        hasMore: contractCalls.pagination.hasMore,
      }));
    }
  }, [contractCalls]);

  // ================================
  // EVENT MONITORING
  // ================================

  const [eventSubscriptions, setEventSubscriptions] = useState<EventSubscription[]>([]);
  const [contractEvents, setContractEvents] = useState<any[]>([]);

  // Get contract events
  const getEvents = useCallback(
    async (filter: EventFilter = {}, limit: number = 100) => {
      if (!contract) return { events: [], hasMore: false };

      try {
        const contractInfo: ContractInfo = {
          id: contract.id,
          address: contract.address as Address,
          chainId: contract.chainId,
          name: contract.name,
          abi: contract.abi as Abi,
          tags: contract.tags || [],
          description: contract.description || undefined,
          isVerified: contract.isVerified === 'true',
        };

        const result = await getContractEvents(contractInfo, filter, limit);
        return result;
      } catch (error: any) {
        toast({
          title: 'Failed to Load Events',
          description: error.message || 'Failed to fetch contract events',
          variant: 'destructive',
        });
        return { events: [], hasMore: false };
      }
    },
    [contract, toast]
  );

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  // Validate contract data
  const validateContractData = useCallback(
    async (address: Address, abi: Abi, chainId: string) => {
      try {
        const result = await validateContract(address, abi, chainId);
        return result;
      } catch (error: any) {
        return {
          isValid: false,
          error: error.message || 'Validation failed',
        };
      }
    },
    []
  );

  // Check if user is on correct network
  const isOnCorrectNetwork = contract?.chainId === chainId;

  // Switch to contract's network
  const switchToContractNetwork = useCallback(async () => {
    if (!contract) return false;
    
    try {
      await ensureCorrectNetwork(contract.chainId);
      return true;
    } catch (error: any) {
      toast({
        title: 'Network Switch Failed',
        description: error.message || 'Failed to switch to required network',
        variant: 'destructive',
      });
      return false;
    }
  }, [contract, toast]);

  // Format function for display
  const formatFunction = useCallback((func: ContractFunction) => {
    return formatFunctionSignature(func);
  }, []);

  // ================================
  // RETURN HOOK INTERFACE
  // ================================

  return {
    // Contract data
    contract,
    userContracts,
    isLoadingContract,
    isLoadingContracts,
    contractError,

    // Contract analysis
    readFunctions: contractState.readFunctions,
    writeFunctions: contractState.writeFunctions,
    contractEvents: contractState.events,
    isLoadingContractState: contractState.isLoading,
    contractStateError: contractState.error,

    // Contract management
    createContract: createContractMutation.mutate,
    updateContract: updateContractMutation.mutate,
    deleteContract: deleteContractMutation.mutate,
    isCreating: createContractMutation.isPending,
    isUpdating: updateContractMutation.isPending,
    isDeleting: deleteContractMutation.isPending,

    // Function calls
    callReadFunction,
    readResults,
    isReading: (functionName: string, args: any[] = []) => {
      const callKey = `${functionName}-${JSON.stringify(args)}`;
      return isReading.has(callKey);
    },

    // Gas estimation
    estimateGas,
    gasEstimates,
    isEstimating: (functionName: string, args: any[] = [], value: bigint = 0n) => {
      const estimateKey = `${functionName}-${JSON.stringify(args)}-${value.toString()}`;
      return isEstimating.has(estimateKey);
    },

    // Write functions
    writeFunction: writeContractMutation.mutate,
    isWriting: writeContractMutation.isPending,

    // Call history
    callHistory: callHistory.calls,
    isLoadingHistory: callHistory.isLoading,
    hasMoreHistory: callHistory.hasMore,
    loadMoreHistory: () => {
      setCallHistory(prev => ({ ...prev, page: prev.page + 1 }));
    },

    // Event monitoring
    getEvents,
    eventHistory: contractEvents,
    eventSubscriptions,

    // Utilities
    validateContractData,
    isOnCorrectNetwork,
    switchToContractNetwork,
    formatFunction,

    // Explorer link
    getExplorerUrl: (txHash: Hash) => 
      contract ? getExplorerUrl(contract.chainId, txHash) : '',
  };
}