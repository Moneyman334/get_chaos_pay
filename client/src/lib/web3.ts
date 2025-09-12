// Network configurations
export const networks: Record<string, any> = {
  '0x1': {
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.infura.io/v3',
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false
  },
  '0x5': {
    name: 'Goerli Testnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://goerli.infura.io/v3',
    blockExplorerUrl: 'https://goerli.etherscan.io',
    isTestnet: true
  },
  '0xaa36a7': {
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://sepolia.infura.io/v3',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true
  },
  '0x89': {
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false
  }
};

// MetaMask provider interface
interface MetaMaskProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  isMetaMask: boolean;
}

declare global {
  interface Window {
    ethereum?: MetaMaskProvider;
  }
}

export function createWeb3Provider() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  return window.ethereum;
}

export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance: string, decimals: number = 4): string {
  const num = parseFloat(balance);
  return num.toFixed(decimals);
}

export function weiToEth(wei: string): string {
  const ethValue = parseInt(wei, 16) / Math.pow(10, 18);
  return ethValue.toString();
}

export function ethToWei(eth: string): string {
  const weiValue = parseFloat(eth) * Math.pow(10, 18);
  return '0x' + weiValue.toString(16);
}

export function gweiToWei(gwei: string): string {
  const weiValue = parseFloat(gwei) * Math.pow(10, 9);
  return '0x' + weiValue.toString(16);
}

export function weiToGwei(wei: string): string {
  const gweiValue = parseInt(wei, 16) / Math.pow(10, 9);
  return gweiValue.toString();
}
