import { useEffect, useState } from 'react';
import { useDemoMode } from './use-demo-mode';
import { useWalletNexus } from '@/lib/wallet-nexus';
import { useQuery } from '@tanstack/react-query';

interface UserWallet {
  id: string;
  address: string;
  balance: string;
  network: string;
}

interface UserPreferences {
  autoLoginEnabled: string;
  autoConnectEnabled: string;
  lastWalletId?: string;
}

export function useDevWalletAutoConnect() {
  const { isDemoMode, enableDemoMode } = useDemoMode();
  const { wallets, isInitialized } = useWalletNexus();
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false);

  // Fetch user's actual wallet from database
  const { data: userWallets } = useQuery<UserWallet[]>({
    queryKey: ['/api/wallets'],
    enabled: import.meta.env.DEV && isInitialized,
  });

  // Fetch user preferences
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['/api/preferences'],
    enabled: import.meta.env.DEV && isInitialized,
  });

  useEffect(() => {
    const autoConnect = async () => {
      // Only in development mode
      if (!import.meta.env.DEV || hasAttemptedConnect || !isInitialized) {
        return;
      }

      // Check if auto-connect is enabled in preferences
      if (preferences && preferences.autoConnectEnabled !== 'true') {
        console.log('ℹ️ Auto-connect disabled in user preferences');
        return;
      }

      setHasAttemptedConnect(true);

      try {
        // Check if wallet is already connected
        if (wallets.size > 0) {
          console.log('✅ DEV MODE: Wallet already connected');
          return;
        }

        // Get user's actual wallet address from database
        const userWallet = userWallets?.[0];
        if (userWallet?.address) {
          console.log('🔗 DEV MODE: Auto-connecting with your wallet:', userWallet.address);
          
          // Create a demo session with the user's REAL address
          const realWalletInfo = {
            id: `metamask_${userWallet.address}`,
            type: 'metamask' as const,
            name: 'MetaMask (Dev)',
            address: userWallet.address,
            chainType: 'evm' as const,
            chainId: '0x1',
            balance: userWallet.balance || '0',
            nativeSymbol: 'ETH',
            isConnected: true,
            isPrimary: true,
            lastUsed: Date.now()
          };

          // Save directly to demo session
          const session = {
            wallets: [realWalletInfo],
            primaryWalletId: realWalletInfo.id,
            totalBalanceUSD: '0'
          };
          
          localStorage.setItem('codex_wallet_nexus_demo_session', JSON.stringify(session));
          
          // Enable demo mode to use this session
          if (!isDemoMode) {
            enableDemoMode();
          }
          
          // Trigger a page reload to pick up the new session
          window.location.reload();
        } else {
          console.log('ℹ️ No user wallet found in database');
        }
      } catch (error) {
        console.log('ℹ️ Dev wallet auto-connect failed:', error);
      }
    };

    autoConnect();
  }, [isDemoMode, enableDemoMode, wallets, hasAttemptedConnect, isInitialized, userWallets, preferences]);

  return { isDemoMode, isConnected: wallets.size > 0 };
}
