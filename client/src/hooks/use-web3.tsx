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
  WEI_PER_ETH 
} from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

interface Web3State {
  isConnected: boolean;
  account?: string;
  balance?: string;
  network?: any;
  chainId?: string;
  blockNumber?: string;
  gasPrice?: string;
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
          } catch {
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
        
        // Get additional network info
        await refreshNetworkInfo();
      }
    } catch (error) {
      console.error("Failed to check connection:", error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to connect your wallet",
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
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  }, [checkConnection, toast]);

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
    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkConnection();
        }
      };

      const handleChainChanged = () => {
        checkConnection();
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

  return useMemo(() => ({
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshNetworkInfo,
    estimateGas,
    sendTransaction,
    getAvailableNetworks,
    getCurrentNetworkInfo,
    getTokenExplorerUrl,
    isCurrentNetworkSupported
  }), [
    state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshNetworkInfo,
    estimateGas,
    sendTransaction,
    getAvailableNetworks,
    getCurrentNetworkInfo,
    getTokenExplorerUrl,
    isCurrentNetworkSupported
  ]);
}
