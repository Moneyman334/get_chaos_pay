import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  WalletNexusState,
  WalletNexusActions,
  WalletType,
  WalletInfo,
  TransactionRequest,
  ChainType,
  WalletSession,
} from './types';
import { getConnector } from './connectors';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'codex_wallet_nexus_session';

type WalletNexusContextType = WalletNexusState & WalletNexusActions;

const WalletNexusContext = createContext<WalletNexusContextType | null>(null);

export function WalletNexusProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const [state, setState] = useState<WalletNexusState>({
    wallets: new Map(),
    primaryWalletId: null,
    isInitialized: false,
    isConnecting: false,
    totalBalanceUSD: '0',
    error: null,
  });

  const updateState = (updates: Partial<WalletNexusState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const loadSession = useCallback(async () => {
    try {
      const storedSession = localStorage.getItem(STORAGE_KEY);
      if (storedSession) {
        const session: WalletSession = JSON.parse(storedSession);
        const walletsMap = new Map<string, WalletInfo>();
        
        session.wallets.forEach(wallet => {
          walletsMap.set(wallet.id, {
            ...wallet,
            isConnected: false,
          });
        });

        updateState({
          wallets: walletsMap,
          primaryWalletId: session.primaryWalletId,
          totalBalanceUSD: session.totalBalanceUSD,
          isInitialized: true,
        });

        for (const wallet of session.wallets) {
          try {
            const connector = getConnector(wallet.type);
            const reconnectedWallet = await connector.checkConnection();
            
            if (reconnectedWallet) {
              walletsMap.set(reconnectedWallet.id, {
                ...reconnectedWallet,
                isPrimary: wallet.isPrimary,
                lastUsed: wallet.lastUsed,
              });
            }
          } catch (error) {
            console.error(`Failed to reconnect ${wallet.type}:`, error);
          }
        }

        updateState({
          wallets: walletsMap,
        });

        return walletsMap;
      }
    } catch (error) {
      console.error('Failed to load wallet session:', error);
    }
    
    updateState({ isInitialized: true });
    return new Map();
  }, []);

  const saveSession = useCallback((wallets: Map<string, WalletInfo>, primaryWalletId: string | null, totalBalanceUSD: string) => {
    try {
      const session: WalletSession = {
        wallets: Array.from(wallets.values()),
        primaryWalletId,
        totalBalanceUSD,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save wallet session:', error);
    }
  }, []);

  const connectWallet = useCallback(async (type: WalletType): Promise<WalletInfo> => {
    updateState({ isConnecting: true, error: null });

    try {
      const connector = getConnector(type);
      const walletInfo = await connector.connect();

      const existingWallet = state.wallets.get(walletInfo.id);
      const isPrimary = state.wallets.size === 0 || existingWallet?.isPrimary;

      const updatedWallet: WalletInfo = {
        ...walletInfo,
        isPrimary,
        lastUsed: Date.now(),
      };

      const newWallets = new Map(state.wallets);
      newWallets.set(walletInfo.id, updatedWallet);

      const newPrimaryId = isPrimary ? walletInfo.id : state.primaryWalletId;

      updateState({
        wallets: newWallets,
        primaryWalletId: newPrimaryId,
        isConnecting: false,
      });

      saveSession(newWallets, newPrimaryId, state.totalBalanceUSD);

      toast({
        title: 'Wallet Connected',
        description: `${walletInfo.name} connected successfully`,
      });

      return updatedWallet;
    } catch (error: any) {
      updateState({
        isConnecting: false,
        error: error.message,
      });

      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });

      throw error;
    }
  }, [state.wallets, state.primaryWalletId, state.totalBalanceUSD, saveSession, toast]);

  const disconnectWallet = useCallback(async (walletId: string): Promise<void> => {
    try {
      const wallet = state.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const connector = getConnector(wallet.type);
      await connector.disconnect(walletId);

      const newWallets = new Map(state.wallets);
      newWallets.delete(walletId);

      let newPrimaryId = state.primaryWalletId;
      if (state.primaryWalletId === walletId) {
        const firstWallet = Array.from(newWallets.values())[0];
        newPrimaryId = firstWallet?.id || null;
        
        if (firstWallet) {
          newWallets.set(firstWallet.id, {
            ...firstWallet,
            isPrimary: true,
          });
        }
      }

      updateState({
        wallets: newWallets,
        primaryWalletId: newPrimaryId,
      });

      saveSession(newWallets, newPrimaryId, state.totalBalanceUSD);

      toast({
        title: 'Wallet Disconnected',
        description: `${wallet.name} disconnected successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Disconnection Failed',
        description: error.message || 'Failed to disconnect wallet',
        variant: 'destructive',
      });
      throw error;
    }
  }, [state.wallets, state.primaryWalletId, state.totalBalanceUSD, saveSession, toast]);

  const disconnectAll = useCallback(async (): Promise<void> => {
    try {
      const disconnectPromises = Array.from(state.wallets.keys()).map(walletId => {
        const wallet = state.wallets.get(walletId);
        if (wallet) {
          const connector = getConnector(wallet.type);
          return connector.disconnect(walletId).catch(err => {
            console.error(`Failed to disconnect ${walletId}:`, err);
          });
        }
        return Promise.resolve();
      });

      await Promise.all(disconnectPromises);

      updateState({
        wallets: new Map(),
        primaryWalletId: null,
        totalBalanceUSD: '0',
      });

      localStorage.removeItem(STORAGE_KEY);

      toast({
        title: 'All Wallets Disconnected',
        description: 'Successfully disconnected all wallets',
      });
    } catch (error: any) {
      toast({
        title: 'Disconnection Failed',
        description: error.message || 'Failed to disconnect all wallets',
        variant: 'destructive',
      });
      throw error;
    }
  }, [state.wallets, toast]);

  const setPrimaryWallet = useCallback((walletId: string): void => {
    const wallet = state.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const newWallets = new Map(state.wallets);
    
    newWallets.forEach((w, id) => {
      newWallets.set(id, {
        ...w,
        isPrimary: id === walletId,
      });
    });

    updateState({
      wallets: newWallets,
      primaryWalletId: walletId,
    });

    saveSession(newWallets, walletId, state.totalBalanceUSD);

    toast({
      title: 'Primary Wallet Updated',
      description: `${wallet.name} is now your primary wallet`,
    });
  }, [state.wallets, state.totalBalanceUSD, saveSession, toast]);

  const switchChain = useCallback(async (walletId: string, chainId: string): Promise<void> => {
    const wallet = state.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    try {
      const connector = getConnector(wallet.type);
      await connector.switchChain(walletId, chainId);

      const newWallets = new Map(state.wallets);
      newWallets.set(walletId, {
        ...wallet,
        chainId,
      });

      updateState({ wallets: newWallets });
      saveSession(newWallets, state.primaryWalletId, state.totalBalanceUSD);

      toast({
        title: 'Chain Switched',
        description: 'Successfully switched chain',
      });
    } catch (error: any) {
      toast({
        title: 'Chain Switch Failed',
        description: error.message || 'Failed to switch chain',
        variant: 'destructive',
      });
      throw error;
    }
  }, [state.wallets, state.primaryWalletId, state.totalBalanceUSD, saveSession, toast]);

  const refreshBalances = useCallback(async (): Promise<void> => {
    try {
      const updatePromises = Array.from(state.wallets.entries()).map(async ([id, wallet]) => {
        try {
          const connector = getConnector(wallet.type);
          const balance = await connector.getBalance(id);
          return { id, balance };
        } catch (error) {
          console.error(`Failed to refresh balance for ${id}:`, error);
          return { id, balance: wallet.balance };
        }
      });

      const results = await Promise.all(updatePromises);

      const newWallets = new Map(state.wallets);
      results.forEach(({ id, balance }) => {
        const wallet = newWallets.get(id);
        if (wallet && balance) {
          newWallets.set(id, {
            ...wallet,
            balance,
          });
        }
      });

      updateState({ wallets: newWallets });
      saveSession(newWallets, state.primaryWalletId, state.totalBalanceUSD);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  }, [state.wallets, state.primaryWalletId, state.totalBalanceUSD, saveSession]);

  const refreshWallet = useCallback(async (walletId: string): Promise<void> => {
    const wallet = state.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    try {
      const connector = getConnector(wallet.type);
      const balance = await connector.getBalance(walletId);

      const newWallets = new Map(state.wallets);
      newWallets.set(walletId, {
        ...wallet,
        balance,
      });

      updateState({ wallets: newWallets });
      saveSession(newWallets, state.primaryWalletId, state.totalBalanceUSD);
    } catch (error) {
      console.error(`Failed to refresh wallet ${walletId}:`, error);
      throw error;
    }
  }, [state.wallets, state.primaryWalletId, state.totalBalanceUSD, saveSession]);

  const getWallet = useCallback((walletId: string): WalletInfo | undefined => {
    return state.wallets.get(walletId);
  }, [state.wallets]);

  const getPrimaryWallet = useCallback((): WalletInfo | undefined => {
    if (!state.primaryWalletId) return undefined;
    return state.wallets.get(state.primaryWalletId);
  }, [state.wallets, state.primaryWalletId]);

  const getAllWallets = useCallback((): WalletInfo[] => {
    return Array.from(state.wallets.values()).sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return (b.lastUsed || 0) - (a.lastUsed || 0);
    });
  }, [state.wallets]);

  const getWalletsByChain = useCallback((chainType: ChainType): WalletInfo[] => {
    return Array.from(state.wallets.values()).filter(w => w.chainType === chainType);
  }, [state.wallets]);

  const signMessage = useCallback(async (walletId: string, message: string): Promise<string> => {
    const wallet = state.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const connector = getConnector(wallet.type);
    return await connector.signMessage(walletId, message);
  }, [state.wallets]);

  const sendTransaction = useCallback(async (walletId: string, tx: TransactionRequest): Promise<string> => {
    const wallet = state.wallets.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const connector = getConnector(wallet.type);
    const txHash = await connector.sendTransaction(walletId, tx);

    setTimeout(() => {
      refreshWallet(walletId);
    }, 3000);

    return txHash;
  }, [state.wallets, refreshWallet]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const handleAccountsChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { walletId } = customEvent.detail;
      refreshWallet(walletId).catch(console.error);
    };

    const handleChainChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { walletId } = customEvent.detail;
      refreshWallet(walletId).catch(console.error);
    };

    const handleDisconnected = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { walletId } = customEvent.detail;
      disconnectWallet(walletId).catch(console.error);
    };

    window.addEventListener('wallet-accounts-changed', handleAccountsChanged);
    window.addEventListener('wallet-chain-changed', handleChainChanged);
    window.addEventListener('wallet-disconnected', handleDisconnected);

    return () => {
      window.removeEventListener('wallet-accounts-changed', handleAccountsChanged);
      window.removeEventListener('wallet-chain-changed', handleChainChanged);
      window.removeEventListener('wallet-disconnected', handleDisconnected);
    };
  }, [refreshWallet, disconnectWallet]);

  const contextValue: WalletNexusContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    disconnectAll,
    setPrimaryWallet,
    switchChain,
    refreshBalances,
    refreshWallet,
    getWallet,
    getPrimaryWallet,
    getAllWallets,
    getWalletsByChain,
    signMessage,
    sendTransaction,
  };

  return (
    <WalletNexusContext.Provider value={contextValue}>
      {children}
    </WalletNexusContext.Provider>
  );
}

export function useWalletNexus(): WalletNexusContextType {
  const context = useContext(WalletNexusContext);
  if (!context) {
    throw new Error('useWalletNexus must be used within WalletNexusProvider');
  }
  return context;
}
