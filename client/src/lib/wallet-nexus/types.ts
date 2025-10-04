export type WalletType = 'metamask' | 'coinbase' | 'walletconnect' | 'trust' | 'phantom' | 'ledger' | 'trezor';

export type ChainType = 'evm' | 'solana' | 'bitcoin';

export interface WalletInfo {
  id: string;
  type: WalletType;
  name: string;
  address: string;
  chainType: ChainType;
  chainId?: string;
  balance?: string;
  nativeSymbol?: string;
  isConnected: boolean;
  isPrimary: boolean;
  avatar?: string;
  ens?: string;
  tokens?: TokenBalance[];
  lastUsed?: number;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUSD?: string;
  decimals: number;
  logoUrl?: string;
  chainId: string;
}

export interface WalletSession {
  wallets: WalletInfo[];
  primaryWalletId: string | null;
  totalBalanceUSD: string;
  createdAt: number;
  lastActivity: number;
}

export interface WalletConnector {
  type: WalletType;
  name: string;
  icon: string;
  description: string;
  isInstalled: () => boolean;
  isMobileSupported: boolean;
  checkConnection: () => Promise<WalletInfo | null>;
  connect: () => Promise<WalletInfo>;
  disconnect: (walletId: string) => Promise<void>;
  switchChain: (walletId: string, chainId: string) => Promise<void>;
  getBalance: (walletId: string) => Promise<string>;
  signMessage: (walletId: string, message: string) => Promise<string>;
  sendTransaction: (walletId: string, tx: TransactionRequest) => Promise<string>;
}

export interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  chainId?: string;
}

export interface WalletNexusState {
  wallets: Map<string, WalletInfo>;
  primaryWalletId: string | null;
  isInitialized: boolean;
  isConnecting: boolean;
  totalBalanceUSD: string;
  error: string | null;
}

export interface WalletNexusActions {
  connectWallet: (type: WalletType) => Promise<WalletInfo>;
  disconnectWallet: (walletId: string) => Promise<void>;
  disconnectAll: () => Promise<void>;
  setPrimaryWallet: (walletId: string) => void;
  switchChain: (walletId: string, chainId: string) => Promise<void>;
  refreshBalances: () => Promise<void>;
  refreshWallet: (walletId: string) => Promise<void>;
  getWallet: (walletId: string) => WalletInfo | undefined;
  getPrimaryWallet: () => WalletInfo | undefined;
  getAllWallets: () => WalletInfo[];
  getWalletsByChain: (chainType: ChainType) => WalletInfo[];
  signMessage: (walletId: string, message: string) => Promise<string>;
  sendTransaction: (walletId: string, tx: TransactionRequest) => Promise<string>;
}

export interface QRConnectionData {
  uri: string;
  expiresAt: number;
}
