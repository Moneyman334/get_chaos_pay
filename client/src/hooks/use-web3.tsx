import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  createWeb3Provider, 
  networks, 
  getNetworkByChainId,
  formatTokenAmount,
  getBlockExplorerUrl,
  isChainSupported,
  getAllNetworks,
  weiToGwei,
  WEI_PER_ETH,
  transferToken,
  approveToken,
  getTokenAllowance 
} from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { 
  tokenDetectionService, 
  DetectedToken, 
  TokenDetectionOptions 
} from "@/lib/tokenDetection";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Web3State {
  isConnected: boolean;
  account?: string;
  balance?: string;
  network?: any;
  chainId?: string;
  blockNumber?: string;
  gasPrice?: string;
  tokens?: DetectedToken[];
  isLoadingTokens?: boolean;
  tokenError?: string;
}

export function useWeb3() {
  const [state, setState] = useState<Web3State>({
    isConnected: false,
  });
  
  const { toast } = useToast();

  const updateState = (updates: Partial<Web3State>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const checkConnection = useCallback(async () => {
    try {
      if (!window.ethereum) return;
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        const account = accounts[0];
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        });
        
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        });
        
        const network = getNetworkByChainId(chainId) || {
          name: 'Unsupported Network',
          symbol: 'ETH',
          decimals: 18,
          isTestnet: false,
          chainType: 'Unknown',
          icon: '❓',
          color: 'hsl(0, 0%, 50%)'
        };
        
        const balanceInToken = (() => {
          try {
            const balanceBigInt = BigInt(balance);
            const decimals = BigInt(network.decimals || 18);
            const divisor = BigInt(10) ** decimals;
            const intPart = balanceBigInt / divisor;
            const remainder = balanceBigInt % divisor;
            const fractional = remainder.toString().padStart(Number(decimals), '0').slice(0, 4);
            return `${intPart.toString()}.${fractional.replace(/0+$/, '') || '0'}`;
          } catch (error) {
            console.error("Balance conversion error:", error);
            return '0.0000';
          }
        })();
        
        updateState({
          isConnected: true,
          account,
          balance: balanceInToken,
          network,
          chainId
        });
        
        // Save connection preference
        localStorage.setItem('web3_connected', 'true');
        localStorage.setItem('web3_last_account', account);
        
        // Get additional network info
        await refreshNetworkInfo();
      } else {
        // Clear connection if no accounts
        localStorage.removeItem('web3_connected');
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
    }
  }, []);

  const isMobile = useMemo(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const connectWallet = useCallback(async (retryCount = 0) => {
    try {
      if (!window.ethereum) {
        // Mobile device without MetaMask - redirect to MetaMask mobile app
        if (isMobile) {
          const currentUrl = window.location.href;
          const metamaskAppDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
          
          toast({
            title: "Open in MetaMask App",
            description: "Redirecting to MetaMask mobile app...",
          });
          
          // Redirect to MetaMask mobile app
          window.location.href = metamaskAppDeepLink;
          return;
        }
        
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask browser extension or use MetaMask mobile app",
          variant: "destructive",
        });
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        await checkConnection();
        toast({
          title: "Wallet connected",
          description: "Successfully connected to MetaMask",
        });
      }
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      
      // Retry logic only for transient errors (not user rejection)
      if (retryCount < 2 && error.code === -32002) {
        // -32002 means request is already pending, retry makes sense
        toast({
          title: "Retrying connection",
          description: "Please check your wallet for pending requests...",
        });
        setTimeout(() => connectWallet(retryCount + 1), 1000);
        return;
      }
      
      // User rejection (4001) or other errors - show immediately without retry
      toast({
        title: "Connection failed",
        description: error.code === 4001 
          ? "Connection request was rejected" 
          : error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  }, [checkConnection, toast, isMobile]);

  const disconnectWallet = useCallback(() => {
    updateState({
      isConnected: false,
      account: undefined,
      balance: undefined,
      network: undefined,
      chainId: undefined,
      blockNumber: undefined,
      gasPrice: undefined
    });
    
    // Clear connection preference
    localStorage.removeItem('web3_connected');
    localStorage.removeItem('web3_last_account');
    
    toast({
      title: "Wallet disconnected",
      description: "Successfully disconnected from wallet",
    });
  }, [toast]);

  const switchNetwork = useCallback(async (targetChainId: string) => {
    try {
      if (!window.ethereum) return;
      
      const targetNetwork = getNetworkByChainId(targetChainId);
      if (!targetNetwork) {
        toast({
          title: "Unsupported network",
          description: "The selected network is not supported",
          variant: "destructive",
        });
        return;
      }

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
        
        toast({
          title: "Network switched",
          description: `Switched to ${targetNetwork.name}`,
        });
      } catch (switchError: any) {
        // If the network doesn't exist in MetaMask, try to add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainId,
                chainName: targetNetwork.name,
                rpcUrls: [targetNetwork.rpcUrl],
                blockExplorerUrls: [targetNetwork.blockExplorerUrl],
                nativeCurrency: {
                  name: targetNetwork.symbol,
                  symbol: targetNetwork.symbol,
                  decimals: targetNetwork.decimals || 18
                }
              }],
            });
            
            toast({
              title: "Network added and switched",
              description: `Added and switched to ${targetNetwork.name}`,
            });
          } catch (addError: any) {
            console.error("Failed to add network:", addError);
            toast({
              title: "Failed to add network",
              description: addError.message || "Failed to add network to wallet",
              variant: "destructive",
            });
          }
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error("Failed to switch network:", error);
      toast({
        title: "Network switch failed",
        description: error.message || "Failed to switch network",
        variant: "destructive",
      });
    }
  }, [toast]);

  const refreshNetworkInfo = useCallback(async () => {
    try {
      if (!window.ethereum || !state.isConnected) return;

      const blockNumber = await window.ethereum.request({
        method: 'eth_blockNumber'
      });
      
      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });

      const blockNum = parseInt(blockNumber, 16).toLocaleString();
      const gasPriceGwei = (() => {
        try {
          return parseFloat(weiToGwei(gasPrice)).toFixed(1);
        } catch {
          return '0.0';
        }
      })();

      updateState({
        blockNumber: blockNum,
        gasPrice: `${gasPriceGwei} gwei`
      });
    } catch (error) {
      console.error("Failed to refresh network info:", error);
    }
  }, [state.isConnected]);

  const refreshBalance = useCallback(async () => {
    try {
      if (!window.ethereum || !state.account || !state.isConnected) return;

      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [state.account, 'latest']
      });

      const network = state.network || {
        decimals: 18,
        symbol: 'ETH'
      };

      const balanceInToken = (() => {
        try {
          const balanceBigInt = BigInt(balance);
          const decimals = BigInt(network.decimals || 18);
          const divisor = BigInt(10) ** decimals;
          const intPart = balanceBigInt / divisor;
          const remainder = balanceBigInt % divisor;
          const fractional = remainder.toString().padStart(Number(decimals), '0').slice(0, 4);
          return `${intPart.toString()}.${fractional.replace(/0+$/, '') || '0'}`;
        } catch (error) {
          console.error("Balance conversion error:", error);
          return '0.0000';
        }
      })();

      updateState({
        balance: balanceInToken
      });
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  }, [state.account, state.isConnected, state.network]);

  const estimateGas = useCallback(async (to: string, value: string) => {
    try {
      if (!window.ethereum || !state.account) {
        throw new Error("Wallet not connected");
      }

      const valueInWei = (() => {
        try {
          const [intPart, fracPart = '0'] = value.split('.');
          const paddedFrac = fracPart.padEnd(18, '0').slice(0, 18);
          const weiBigInt = BigInt(intPart) * WEI_PER_ETH + BigInt(paddedFrac);
          return '0x' + weiBigInt.toString(16);
        } catch {
          throw new Error('Invalid amount format');
        }
      })();
      
      const gasLimit = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [{
          from: state.account,
          to,
          value: valueInWei
        }]
      });

      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });

      const gasLimitBigInt = BigInt(gasLimit);
      const gasPriceBigInt = BigInt(gasPrice);
      const feeBigInt = gasLimitBigInt * gasPriceBigInt;
      const feeInEth = (() => {
        const ethValue = feeBigInt / WEI_PER_ETH;
        const remainder = feeBigInt % WEI_PER_ETH;
        const fractional = remainder.toString().padStart(18, '0').slice(0, 6);
        return `${ethValue.toString()}.${fractional.replace(/0+$/, '') || '0'}`;
      })();
      
      const currentNetwork = getNetworkByChainId(state.chainId || '0x1');
      const feeSymbol = currentNetwork?.symbol || 'ETH';

      return {
        gasLimit: gasLimitBigInt.toLocaleString(),
        gasPrice: `${parseFloat(weiToGwei(gasPrice)).toFixed(1)} gwei`,
        estimatedFee: formatTokenAmount(feeInEth, feeSymbol)
      };
    } catch (error: any) {
      console.error("Failed to estimate gas:", error);
      throw error;
    }
  }, [state.account]);

  const sendTransaction = useCallback(async (to: string, value: string) => {
    try {
      if (!window.ethereum || !state.account) {
        throw new Error("Wallet not connected");
      }

      const valueInWei = (() => {
        try {
          const [intPart, fracPart = '0'] = value.split('.');
          const paddedFrac = fracPart.padEnd(18, '0').slice(0, 18);
          const weiBigInt = BigInt(intPart) * WEI_PER_ETH + BigInt(paddedFrac);
          return '0x' + weiBigInt.toString(16);
        } catch {
          throw new Error('Invalid amount format');
        }
      })();
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: state.account,
          to,
          value: valueInWei
        }]
      });

      // Refresh balance after transaction
      setTimeout(() => {
        checkConnection();
      }, 2000);

      return txHash;
    } catch (error: any) {
      console.error("Failed to send transaction:", error);
      throw error;
    }
  }, [state.account, checkConnection]);

  // Initialize and setup event listeners
  useEffect(() => {
    // Auto-reconnect if previously connected
    const wasConnected = localStorage.getItem('web3_connected') === 'true';
    
    if (wasConnected && window.ethereum) {
      checkConnection();
    }

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkConnection();
        }
      };

      const handleChainChanged = () => {
        // Reload page on chain change for data consistency
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [checkConnection, disconnectWallet]);

  // New utility functions for multi-chain support
  const getAvailableNetworks = useCallback(() => {
    return getAllNetworks();
  }, []);
  
  const getCurrentNetworkInfo = useCallback(() => {
    if (!state.chainId) return null;
    return getNetworkByChainId(state.chainId);
  }, [state.chainId]);
  
  const getTokenExplorerUrl = useCallback((address?: string, txHash?: string) => {
    if (!state.chainId) return '#';
    return getBlockExplorerUrl(state.chainId, txHash, address);
  }, [state.chainId]);
  
  const isCurrentNetworkSupported = useCallback(() => {
    return state.chainId ? isChainSupported(state.chainId) : false;
  }, [state.chainId]);

  // ========================
  // TOKEN MANAGEMENT
  // ========================

  const queryClient = useQueryClient();

  // Fetch tokens for current wallet and chain
  const {
    data: detectedTokens,
    isLoading: isLoadingTokens,
    error: tokenError,
    refetch: refetchTokens
  } = useQuery({
    queryKey: ['tokens', state.account, state.chainId],
    queryFn: async () => {
      if (!state.account || !state.chainId) return [];
      return tokenDetectionService.detectTokensForWallet(
        state.account,
        state.chainId,
        { includeZeroBalances: true }
      );
    },
    enabled: !!state.account && !!state.chainId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Detect tokens function
  const detectTokens = useCallback(async (options?: TokenDetectionOptions) => {
    if (!state.account || !state.chainId) return [];
    
    updateState({ isLoadingTokens: true, tokenError: undefined });
    
    try {
      const tokens = await tokenDetectionService.detectTokensForWallet(
        state.account,
        state.chainId,
        options
      );
      
      updateState({ tokens, isLoadingTokens: false });
      
      // Sync with backend
      for (const token of tokens) {
        try {
          await apiRequest('POST', '/api/tokens', {
            contractAddress: token.address,
            chainId: token.chainId,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals.toString(),
            logoUrl: token.logoUrl || null,
            isVerified: token.isPopular ? "true" : "false"
          });
        } catch (apiError) {
          // Token might already exist, continue
          console.debug('Token already exists in backend:', apiError);
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Failed to detect tokens:', error);
      updateState({ 
        tokenError: error instanceof Error ? error.message : 'Failed to detect tokens',
        isLoadingTokens: false 
      });
      return [];
    }
  }, [state.account, state.chainId]);

  // Add custom token
  const addCustomToken = useCallback(async (contractAddress: string) => {
    if (!state.account || !state.chainId) {
      throw new Error('Wallet not connected');
    }

    try {
      const customToken = await tokenDetectionService.addCustomToken(
        contractAddress,
        state.account,
        state.chainId
      );

      if (!customToken) {
        throw new Error('Failed to add custom token');
      }

      // Add to backend
      await apiRequest('POST', '/api/tokens', {
        contractAddress: customToken.address,
        chainId: customToken.chainId,
        name: customToken.name,
        symbol: customToken.symbol,
        decimals: customToken.decimals.toString(),
        logoUrl: customToken.logoUrl || null,
        isVerified: "false"
      });

      // Add to user tokens
      await apiRequest('POST', '/api/user-tokens', {
        userId: state.account, // Using account as user ID for now
        walletAddress: state.account,
        tokenId: customToken.address,
        isHidden: "false",
        sortOrder: "0"
      });

      // Refresh tokens
      await refetchTokens();
      
      toast({
        title: "Token added",
        description: `Successfully added ${customToken.symbol} (${customToken.name})`,
      });

      return customToken;
    } catch (error: any) {
      console.error('Failed to add custom token:', error);
      toast({
        title: "Failed to add token",
        description: error.message || "Failed to add custom token",
        variant: "destructive",
      });
      throw error;
    }
  }, [state.account, state.chainId, toast, refetchTokens]);

  // Transfer token
  const transferTokenMutation = useMutation({
    mutationFn: async ({ 
      tokenAddress, 
      toAddress, 
      amount, 
      decimals 
    }: { 
      tokenAddress: string;
      toAddress: string;
      amount: string;
      decimals: number;
    }) => {
      if (!state.account) {
        throw new Error('Wallet not connected');
      }

      return transferToken(tokenAddress, state.account, toAddress, amount, Number(decimals));
    },
    onSuccess: (txHash, variables) => {
      toast({
        title: "Transfer initiated",
        description: `Token transfer transaction submitted: ${txHash.slice(0, 10)}...`,
      });

      // Refresh balances after a delay
      setTimeout(() => {
        refetchTokens();
        checkConnection();
      }, 3000);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (error: any) => {
      console.error('Token transfer failed:', error);
      toast({
        title: "Transfer failed",
        description: error.message || "Failed to transfer token",
        variant: "destructive",
      });
    }
  });

  // Approve token spending
  const approveTokenMutation = useMutation({
    mutationFn: async ({ 
      tokenAddress, 
      spenderAddress, 
      amount, 
      decimals 
    }: { 
      tokenAddress: string;
      spenderAddress: string;
      amount: string;
      decimals: number;
    }) => {
      if (!state.account) {
        throw new Error('Wallet not connected');
      }

      return approveToken(tokenAddress, state.account, spenderAddress, amount, Number(decimals));
    },
    onSuccess: (txHash) => {
      toast({
        title: "Approval successful",
        description: `Token approval transaction submitted: ${txHash.slice(0, 10)}...`,
      });
    },
    onError: (error: any) => {
      console.error('Token approval failed:', error);
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve token",
        variant: "destructive",
      });
    }
  });

  // Get token allowance
  const getTokenAllowanceCallback = useCallback(async (
    tokenAddress: string,
    spenderAddress: string
  ) => {
    if (!state.account) {
      throw new Error('Wallet not connected');
    }

    return getTokenAllowance(tokenAddress, state.account, spenderAddress);
  }, [state.account]);

  // Refresh token balances
  const refreshTokenBalances = useCallback(async () => {
    if (!state.account || !detectedTokens?.length) return;

    try {
      const refreshedTokens = await tokenDetectionService.refreshTokenBalances(
        detectedTokens,
        state.account
      );
      
      updateState({ tokens: refreshedTokens });

      // Update backend balances
      for (const token of refreshedTokens) {
        try {
          await apiRequest('PUT', '/api/tokens/balances', {
            walletAddress: state.account,
            tokenId: token.address,
            balance: token.balanceInWei
          });
        } catch (error) {
          console.debug('Failed to update backend balance:', error);
        }
      }
      
      return refreshedTokens;
    } catch (error) {
      console.error('Failed to refresh token balances:', error);
      return detectedTokens;
    }
  }, [state.account, detectedTokens]);

  // Get token by address
  const getTokenByAddress = useCallback((address: string) => {
    return detectedTokens?.find(token => 
      token.address.toLowerCase() === address.toLowerCase()
    );
  }, [detectedTokens]);

  // Search tokens
  const searchTokens = useCallback((query: string) => {
    if (!detectedTokens) return [];
    return tokenDetectionService.searchTokens(detectedTokens, query);
  }, [detectedTokens]);

  // Update token state when detected tokens change
  useEffect(() => {
    updateState({ 
      tokens: detectedTokens,
      isLoadingTokens,
      tokenError: tokenError?.message 
    });
  }, [detectedTokens, isLoadingTokens, tokenError]);

  return useMemo(() => ({
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshNetworkInfo,
    refreshBalance,
    estimateGas,
    sendTransaction,
    getAvailableNetworks,
    getCurrentNetworkInfo,
    getTokenExplorerUrl,
    isCurrentNetworkSupported,
    // Token functions
    detectTokens,
    addCustomToken,
    transferToken: transferTokenMutation.mutate,
    approveToken: approveTokenMutation.mutate,
    getTokenAllowance: getTokenAllowanceCallback,
    refreshTokenBalances,
    getTokenByAddress,
    searchTokens,
    isTransferring: transferTokenMutation.isPending,
    isApproving: approveTokenMutation.isPending,
    refetchTokens
  }), [
    state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshNetworkInfo,
    refreshBalance,
    estimateGas,
    sendTransaction,
    getAvailableNetworks,
    getCurrentNetworkInfo,
    getTokenExplorerUrl,
    isCurrentNetworkSupported,
    detectTokens,
    addCustomToken,
    transferTokenMutation.mutate,
    transferTokenMutation.isPending,
    approveTokenMutation.mutate,
    approveTokenMutation.isPending,
    getTokenAllowanceCallback,
    refreshTokenBalances,
    getTokenByAddress,
    searchTokens,
    refetchTokens
  ]);
}
