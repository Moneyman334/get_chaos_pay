import { BaseWalletConnector } from './base';
import { WalletInfo, TransactionRequest, WalletType } from '../types';
import { getNetworkByChainId, WEI_PER_ETH } from '@/lib/web3';

declare global {
  interface Window {
    coinbaseWalletExtension?: any;
  }
}

export class CoinbaseConnector extends BaseWalletConnector {
  type: WalletType = 'coinbase';
  name = 'Coinbase Wallet';
  icon = '🔵';
  description = 'Connect to your Coinbase Wallet';
  isMobileSupported = true;

  private provider: any = null;

  isInstalled(): boolean {
    // Check for Coinbase Wallet extension
    // Modern Coinbase Wallet injects into window.ethereum with isCoinbaseWallet flag
    if (typeof window === 'undefined') return false;
    
    // Check for dedicated Coinbase provider
    if (window.coinbaseWalletExtension) return true;
    
    // Check for Coinbase in window.ethereum
    const ethereum = (window as any).ethereum;
    if (ethereum?.isCoinbaseWallet) return true;
    
    // Check for Coinbase in providers array
    if (ethereum?.providers) {
      return ethereum.providers.some((p: any) => p.isCoinbaseWallet);
    }
    
    return false;
  }

  async checkConnection(): Promise<WalletInfo | null> {
    if (!this.isInstalled()) {
      return null;
    }

    // Get Coinbase provider
    this.provider = this.getCoinbaseProvider();

    const accounts = await this.provider.request({
      method: 'eth_accounts'
    });

    if (!accounts || accounts.length === 0) {
      return null;
    }

    const address = accounts[0];
    const chainId = await this.provider.request({ method: 'eth_chainId' });
    const balance = await this.provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });

    const network = getNetworkByChainId(chainId);

    const walletInfo: WalletInfo = {
      id: this.generateWalletId(address, this.type),
      type: this.type,
      name: 'Coinbase Wallet',
      address,
      chainType: 'evm',
      chainId,
      balance: this.formatBalance(BigInt(balance)),
      nativeSymbol: network?.symbol || 'ETH',
      isConnected: true,
      isPrimary: false,
      lastUsed: Date.now(),
    };

    this.setupEventListeners(walletInfo.id);

    return walletInfo;
  }

  async connect(): Promise<WalletInfo> {
    if (!this.isInstalled()) {
      if (this.isMobile()) {
        window.location.href = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`;
        throw new Error('Redirecting to Coinbase Wallet app...');
      }
      throw new Error('Coinbase Wallet is not installed. Please install Coinbase Wallet extension.');
    }

    // Get Coinbase provider
    this.provider = this.getCoinbaseProvider();

    const accounts = await this.provider.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];
    const chainId = await this.provider.request({ method: 'eth_chainId' });
    const balance = await this.provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });

    const network = getNetworkByChainId(chainId);

    const walletInfo: WalletInfo = {
      id: this.generateWalletId(address, this.type),
      type: this.type,
      name: 'Coinbase Wallet',
      address,
      chainType: 'evm',
      chainId,
      balance: this.formatBalance(BigInt(balance)),
      nativeSymbol: network?.symbol || 'ETH',
      isConnected: true,
      isPrimary: false,
      lastUsed: Date.now(),
    };

    this.setupEventListeners(walletInfo.id);

    return walletInfo;
  }

  private getCoinbaseProvider(): any {
    // Check for dedicated Coinbase provider first
    if (window.coinbaseWalletExtension) {
      return window.coinbaseWalletExtension;
    }
    
    const ethereum = (window as any).ethereum;
    
    // Check if window.ethereum is Coinbase
    if (ethereum?.isCoinbaseWallet) {
      return ethereum;
    }
    
    // Check providers array
    if (ethereum?.providers) {
      const coinbaseProvider = ethereum.providers.find((p: any) => p.isCoinbaseWallet);
      if (coinbaseProvider) return coinbaseProvider;
    }
    
    throw new Error('Coinbase Wallet provider not found');
  }

  async disconnect(walletId: string): Promise<void> {
    this.provider = null;
  }

  async switchChain(walletId: string, chainId: string): Promise<void> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const network = getNetworkByChainId(chainId);
        if (!network) {
          throw new Error('Unsupported network');
        }

        await this.provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId,
            chainName: network.name,
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorerUrl],
            nativeCurrency: {
              name: network.symbol,
              symbol: network.symbol,
              decimals: network.decimals || 18
            }
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  async getBalance(walletId: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    const address = walletId.split('-')[1];
    const balance = await this.provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });

    return this.formatBalance(BigInt(balance));
  }

  async signMessage(walletId: string, message: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    const address = walletId.split('-')[1];
    const signature = await this.provider.request({
      method: 'personal_sign',
      params: [message, address]
    });

    return signature;
  }

  async sendTransaction(walletId: string, tx: TransactionRequest): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    const address = walletId.split('-')[1];
    
    const valueInWei = (() => {
      const [intPart, fracPart = '0'] = tx.value.split('.');
      const paddedFrac = fracPart.padEnd(18, '0').slice(0, 18);
      const weiBigInt = BigInt(intPart) * WEI_PER_ETH + BigInt(paddedFrac);
      return '0x' + weiBigInt.toString(16);
    })();

    const txHash = await this.provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: address,
        to: tx.to,
        value: valueInWei,
        data: tx.data,
        gas: tx.gasLimit,
        gasPrice: tx.gasPrice,
      }]
    });

    return txHash;
  }

  private setupEventListeners(walletId: string): void {
    if (!this.provider) return;

    this.provider.on('accountsChanged', (accounts: string[]) => {
      window.dispatchEvent(new CustomEvent('wallet-accounts-changed', {
        detail: { walletId, accounts }
      }));
    });

    this.provider.on('chainChanged', (chainId: string) => {
      window.dispatchEvent(new CustomEvent('wallet-chain-changed', {
        detail: { walletId, chainId }
      }));
    });

    this.provider.on('disconnect', () => {
      window.dispatchEvent(new CustomEvent('wallet-disconnected', {
        detail: { walletId }
      }));
    });
  }
}
