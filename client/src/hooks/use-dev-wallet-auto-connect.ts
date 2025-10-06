import { useEffect, useState } from 'react';
import { useDemoMode } from './use-demo-mode';
import { useWalletNexus } from '@/lib/wallet-nexus';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  const [needsReload, setNeedsReload] = useState(false);

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
        setHasAttemptedConnect(true);
        return;
      }

      // Check if wallet is already connected - avoid reload loop
      if (wallets.size > 0) {
        console.log('✅ DEV MODE: Wallet already connected');
        setHasAttemptedConnect(true);
        return;
      }

      setHasAttemptedConnect(true);

      try {
        // Try to use lastWalletId if available
        let targetWallet = userWallets?.find(w => w.id === preferences?.lastWalletId);
        
        // Fallback to first wallet if lastWalletId not found
        if (!targetWallet) {
          targetWallet = userWallets?.[0];
        }

        if (targetWallet?.address) {
          console.log('🔗 DEV MODE: Auto-connecting with your wallet:', targetWallet.address);
          
          // Create a demo session with the user's REAL address
          const realWalletInfo = {
            id: `metamask_${targetWallet.address}`,
            type: 'metamask' as const,
            name: 'MetaMask (Dev)',
            address: targetWallet.address,
            chainType: 'evm' as const,
            chainId: '0x1',
            balance: targetWallet.balance || '0',
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
          
          // Persist lastWalletId to backend
          try {
            await apiRequest('PATCH', '/api/preferences', {
              lastWalletId: targetWallet.id
            });
            await queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
          } catch (error) {
            console.log('ℹ️ Failed to persist lastWalletId:', error);
          }
          
          // Enable demo mode to use this session
          if (!isDemoMode) {
            enableDemoMode();
            // Skip reload - let the app refresh naturally
            // setNeedsReload(true);
          }
        } else {
          console.log('ℹ️ No user wallet found in database');
        }
      } catch (error) {
        console.log('ℹ️ Dev wallet auto-connect failed:', error);
      }
    };

    autoConnect();
  }, [isDemoMode, enableDemoMode, wallets, hasAttemptedConnect, isInitialized, userWallets, preferences]);

  // Separate effect for reload to avoid dependency loop
  // Disabled to prevent unwanted page reloads
  // useEffect(() => {
  //   if (needsReload && isDemoMode) {
  //     console.log('🔄 Reloading to apply wallet connection...');
  //     window.location.reload();
  //   }
  // }, [needsReload, isDemoMode]);

  return { isDemoMode, isConnected: wallets.size > 0 };
}
