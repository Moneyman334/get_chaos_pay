import { useState, useEffect, useCallback } from "react";
import { createWeb3Provider, networks } from "@/lib/web3";
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
        
        const network = networks[chainId] || {
          name: 'Unknown Network',
          symbol: 'ETH'
        };
        
        const balanceInEth = (
          parseInt(balance, 16) / Math.pow(10, 18)
        ).toFixed(4);
        
        updateState({
          isConnected: true,
          account,
          balance: balanceInEth,
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

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
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
      const gasPriceGwei = (parseInt(gasPrice, 16) / Math.pow(10, 9)).toFixed(1);

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

      const gasLimit = await window.ethereum.request({
        method: 'eth_estimateGas',
        params: [{
          from: state.account,
          to,
          value: '0x' + (parseFloat(value) * Math.pow(10, 18)).toString(16)
        }]
      });

      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice'
      });

      const gasLimitNum = parseInt(gasLimit, 16);
      const gasPriceNum = parseInt(gasPrice, 16);
      const fee = (gasLimitNum * gasPriceNum) / Math.pow(10, 18);

      return {
        gasLimit: gasLimitNum.toLocaleString(),
        gasPrice: `${(gasPriceNum / Math.pow(10, 9)).toFixed(1)} gwei`,
        estimatedFee: `${fee.toFixed(6)} ETH`
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

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: state.account,
          to,
          value: '0x' + (parseFloat(value) * Math.pow(10, 18)).toString(16)
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

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshNetworkInfo,
    estimateGas,
    sendTransaction
  };
}
