import { useEffect, useState } from 'react';
import { useDemoMode } from './use-demo-mode';
import { useWalletNexus } from '@/lib/wallet-nexus';

export function useDevWalletAutoConnect() {
  const { isDemoMode, enableDemoMode } = useDemoMode();
  const { wallets, connectWallet, isInitialized } = useWalletNexus();
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false);

  useEffect(() => {
    const autoConnect = async () => {
      // Only in development mode
      if (!import.meta.env.DEV || hasAttemptedConnect || !isInitialized) {
        return;
      }

      setHasAttemptedConnect(true);

      try {
        // Enable demo mode if not already enabled
        if (!isDemoMode) {
          console.log('🔧 DEV MODE: Enabling demo mode for auto-connect...');
          enableDemoMode();
        }

        // Wait a bit for demo mode to fully initialize
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if wallet is already connected
        if (wallets.size > 0) {
          console.log('✅ DEV MODE: Wallet already connected');
          return;
        }

        // Auto-connect demo MetaMask wallet
        console.log('🔗 DEV MODE: Auto-connecting demo wallet...');
        await connectWallet('metamask');
        console.log('✅ DEV MODE: Demo wallet auto-connected successfully');
      } catch (error) {
        console.log('ℹ️ Dev wallet auto-connect failed:', error);
      }
    };

    autoConnect();
  }, [isDemoMode, enableDemoMode, wallets, connectWallet, hasAttemptedConnect, isInitialized]);

  return { isDemoMode, isConnected: wallets.size > 0 };
}
