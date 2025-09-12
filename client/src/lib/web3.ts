// Network configurations
export const networks: Record<string, any> = {
  // Ethereum Networks
  '0x1': {
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://ethereum.publicnode.com',
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
    chainType: 'L1',
    icon: '🔷',
    color: 'hsl(220, 70%, 55%)',
    averageBlockTime: 12
  },
  '0x5': {
    name: 'Goerli Testnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://ethereum-goerli.publicnode.com',
    blockExplorerUrl: 'https://goerli.etherscan.io',
    isTestnet: true,
    chainType: 'L1',
    icon: '🔷',
    color: 'hsl(220, 70%, 55%)',
    averageBlockTime: 15
  },
  '0xaa36a7': {
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    chainType: 'L1',
    icon: '🔷',
    color: 'hsl(220, 70%, 55%)',
    averageBlockTime: 12
  },
  
  // Polygon Networks
  '0x89': {
    name: 'Polygon Mainnet',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    chainType: 'L2',
    icon: '🟣',
    color: 'hsl(272, 70%, 55%)',
    averageBlockTime: 2
  },
  '0x13881': {
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://rpc-mumbai.polygon.technology',
    blockExplorerUrl: 'https://mumbai.polygonscan.com',
    isTestnet: true,
    chainType: 'L2',
    icon: '🟣',
    color: 'hsl(272, 70%, 55%)',
    averageBlockTime: 2
  },
  
  // BSC Networks
  '0x38': {
    name: 'BSC Mainnet',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    blockExplorerUrl: 'https://bscscan.com',
    isTestnet: false,
    chainType: 'L1',
    icon: '🟡',
    color: 'hsl(45, 85%, 55%)',
    averageBlockTime: 3
  },
  '0x61': {
    name: 'BSC Testnet',
    symbol: 'BNB',
    decimals: 18,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    isTestnet: true,
    chainType: 'L1',
    icon: '🟡',
    color: 'hsl(45, 85%, 55%)',
    averageBlockTime: 3
  },
  
  // Arbitrum Networks
  '0xa4b1': {
    name: 'Arbitrum One',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorerUrl: 'https://arbiscan.io',
    isTestnet: false,
    chainType: 'L2',
    icon: '🔵',
    color: 'hsl(207, 90%, 54%)',
    averageBlockTime: 1
  },
  '0x66eee': {
    name: 'Arbitrum Sepolia',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorerUrl: 'https://sepolia.arbiscan.io',
    isTestnet: true,
    chainType: 'L2',
    icon: '🔵',
    color: 'hsl(207, 90%, 54%)',
    averageBlockTime: 1
  },
  
  // Optimism Networks
  '0xa': {
    name: 'Optimism Mainnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
    chainType: 'L2',
    icon: '🔴',
    color: 'hsl(0, 85%, 60%)',
    averageBlockTime: 2
  },
  '0xaa37dc': {
    name: 'Optimism Sepolia',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://sepolia.optimism.io',
    blockExplorerUrl: 'https://sepolia-optimism.etherscan.io',
    isTestnet: true,
    chainType: 'L2',
    icon: '🔴',
    color: 'hsl(0, 85%, 60%)',
    averageBlockTime: 2
  }
};

// Safe BigInt constants to avoid precision loss
export const WEI_PER_ETH = 10n ** 18n; // 1 ETH = 10^18 wei
export const WEI_PER_GWEI = 10n ** 9n; // 1 gwei = 10^9 wei

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
  try {
    const weiBigInt = BigInt(wei);
    const ethValue = weiBigInt / WEI_PER_ETH;
    const remainder = weiBigInt % WEI_PER_ETH;
    const fractional = remainder.toString().padStart(18, '0');
    const trimmed = fractional.replace(/0+$/, '') || '0';
    return remainder === 0n ? ethValue.toString() : `${ethValue.toString()}.${trimmed}`;
  } catch {
    return '0';
  }
}

export function ethToWei(eth: string): string {
  try {
    const [intPart, fracPart = '0'] = eth.split('.');
    const paddedFrac = fracPart.padEnd(18, '0').slice(0, 18);
    const weiBigInt = BigInt(intPart) * WEI_PER_ETH + BigInt(paddedFrac);
    return '0x' + weiBigInt.toString(16);
  } catch {
    return '0x0';
  }
}

export function gweiToWei(gwei: string): string {
  try {
    const [intPart, fracPart = '0'] = gwei.split('.');
    const paddedFrac = fracPart.padEnd(9, '0').slice(0, 9);
    const weiBigInt = BigInt(intPart) * WEI_PER_GWEI + BigInt(paddedFrac);
    return '0x' + weiBigInt.toString(16);
  } catch {
    return '0x0';
  }
}

export function weiToGwei(wei: string): string {
  try {
    const weiBigInt = BigInt(wei);
    const gweiValue = weiBigInt / WEI_PER_GWEI;
    const remainder = weiBigInt % WEI_PER_GWEI;
    const fractional = remainder.toString().padStart(9, '0');
    const trimmed = fractional.replace(/0+$/, '') || '0';
    return remainder === 0n ? gweiValue.toString() : `${gweiValue.toString()}.${trimmed}`;
  } catch {
    return '0';
  }
}

// Multi-chain utility functions
export function getNetworkByChainId(chainId: string) {
  return networks[chainId] || null;
}

export function getAllNetworks() {
  return Object.entries(networks).map(([chainId, network]) => ({
    chainId,
    ...network
  }));
}

export function getMainnets() {
  return getAllNetworks().filter(network => !network.isTestnet);
}

export function getTestnets() {
  return getAllNetworks().filter(network => network.isTestnet);
}

export function getL1Networks() {
  return getAllNetworks().filter(network => network.chainType === 'L1');
}

export function getL2Networks() {
  return getAllNetworks().filter(network => network.chainType === 'L2');
}

export function formatTokenAmount(amount: string, symbol: string, decimals: number = 4): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.0000';
  return `${num.toFixed(decimals)} ${symbol}`;
}

export function getBlockExplorerUrl(chainId: string, txHash?: string, address?: string): string {
  const network = getNetworkByChainId(chainId);
  if (!network?.blockExplorerUrl) return '#';
  
  if (txHash) {
    return `${network.blockExplorerUrl}/tx/${txHash}`;
  }
  
  if (address) {
    return `${network.blockExplorerUrl}/address/${address}`;
  }
  
  return network.blockExplorerUrl;
}

export function isChainSupported(chainId: string): boolean {
  return chainId in networks;
}

export function getNetworkGroup(network: any): string {
  if (network.name.includes('Ethereum')) return 'Ethereum';
  if (network.name.includes('Polygon')) return 'Polygon';
  if (network.name.includes('BSC')) return 'BSC';
  if (network.name.includes('Arbitrum')) return 'Arbitrum';
  if (network.name.includes('Optimism')) return 'Optimism';
  return 'Other';
}
