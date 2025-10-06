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
// Calculate 10^18 using multiplication
let weiPerEth = BigInt(1);
for (let i = 0; i < 18; i++) {
  weiPerEth = weiPerEth * BigInt(10);
}
export const WEI_PER_ETH = weiPerEth; // 1 ETH = 10^18 wei

// Calculate 10^9 using multiplication
let weiPerGwei = BigInt(1);
for (let i = 0; i < 9; i++) {
  weiPerGwei = weiPerGwei * BigInt(10);
}
export const WEI_PER_GWEI = weiPerGwei; // 1 gwei = 10^9 wei

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
  if (isNaN(num)) return '0.' + '0'.repeat(decimals);
  
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return decPart ? `${formattedInt}.${decPart}` : formattedInt;
}

export function weiToEth(wei: string): string {
  try {
    const weiBigInt = BigInt(wei);
    const ethValue = weiBigInt / WEI_PER_ETH;
    const remainder = weiBigInt % WEI_PER_ETH;
    const fractional = remainder.toString().padStart(18, '0');
    const trimmed = fractional.replace(/0+$/, '') || '0';
    return remainder === BigInt(0) ? ethValue.toString() : `${ethValue.toString()}.${trimmed}`;
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
    return remainder === BigInt(0) ? gweiValue.toString() : `${gweiValue.toString()}.${trimmed}`;
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
  if (isNaN(num)) return '0.' + '0'.repeat(decimals) + ` ${symbol}`;
  
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = decPart ? `${formattedInt}.${decPart}` : formattedInt;
  
  return `${formatted} ${symbol}`;
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

// ERC-20 ABI for token interactions
export const ERC20_ABI = [
  // Read functions
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  // Write functions
  {
    "constant": false,
    "inputs": [{"name": "to", "type": "address"}, {"name": "value", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "spender", "type": "address"}, {"name": "value", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "from", "type": "address"}, {"name": "to", "type": "address"}, {"name": "value", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  }
];

// Token metadata interface
export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  logoUrl?: string;
}

// ERC-20 Token utility functions
export async function getTokenMetadata(contractAddress: string): Promise<TokenMetadata | null> {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Validate contract address
    if (!contractAddress || !contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid contract address format');
    }

    const provider = window.ethereum;
    
    // Get token name
    const nameResult = await provider.request({
      method: 'eth_call',
      params: [{
        to: contractAddress,
        data: '0x06fdde03' // name() function selector
      }, 'latest']
    });

    // Get token symbol
    const symbolResult = await provider.request({
      method: 'eth_call',
      params: [{
        to: contractAddress,
        data: '0x95d89b41' // symbol() function selector
      }, 'latest']
    });

    // Get token decimals
    const decimalsResult = await provider.request({
      method: 'eth_call',
      params: [{
        to: contractAddress,
        data: '0x313ce567' // decimals() function selector
      }, 'latest']
    });

    // Get total supply
    const totalSupplyResult = await provider.request({
      method: 'eth_call',
      params: [{
        to: contractAddress,
        data: '0x18160ddd' // totalSupply() function selector
      }, 'latest']
    });

    // Parse results
    const name = parseStringFromHex(nameResult);
    const symbol = parseStringFromHex(symbolResult);
    const decimals = parseInt(decimalsResult, 16);
    const totalSupply = BigInt(totalSupplyResult || '0x0').toString();

    if (!name || !symbol) {
      throw new Error('Unable to fetch token metadata');
    }

    return {
      address: contractAddress.toLowerCase(),
      name,
      symbol,
      decimals: isNaN(decimals) ? 18 : decimals,
      totalSupply
    };
  } catch (error) {
    return null;
  }
}

export async function getTokenBalance(contractAddress: string, walletAddress: string): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Validate addresses
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/) || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid address format');
    }

    const provider = window.ethereum;
    
    // Encode balanceOf call
    const paddedAddress = walletAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    const data = '0x70a08231' + paddedAddress; // balanceOf(address) function selector + padded address

    const result = await provider.request({
      method: 'eth_call',
      params: [{
        to: contractAddress,
        data: data
      }, 'latest']
    });

    return BigInt(result || '0x0').toString();
  } catch (error) {
    return '0';
  }
}

export async function transferToken(
  contractAddress: string, 
  toAddress: string, 
  amount: string, 
  decimals: number,
  fromAddress: string
): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Validate addresses
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/) || !toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid address format');
    }

    // Convert amount to wei (token smallest unit)
    const amountInWei = parseTokenAmount(amount, decimals);
    
    // Encode transfer call
    const paddedToAddress = toAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    const paddedAmount = amountInWei.toString(16).padStart(64, '0');
    const data = '0xa9059cbb' + paddedToAddress + paddedAmount; // transfer(address,uint256) function selector

    // Estimate gas first
    const gasEstimate = await window.ethereum.request({
      method: 'eth_estimateGas',
      params: [{
        from: fromAddress,
        to: contractAddress,
        data: data
      }]
    });

    // Send transaction
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: fromAddress,
        to: contractAddress,
        data: data,
        gas: '0x' + (BigInt(gasEstimate) + BigInt(10000)).toString(16) // Add buffer to gas estimate
      }]
    });

    return txHash;
  } catch (error) {
    console.error('Failed to transfer token:', error);
    throw error;
  }
}

export async function approveToken(
  contractAddress: string, 
  spenderAddress: string, 
  amount: string, 
  decimals: number,
  fromAddress: string
): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Validate addresses
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/) || !spenderAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid address format');
    }

    // Convert amount to wei (token smallest unit)
    const amountInWei = parseTokenAmount(amount, decimals);
    
    // Encode approve call
    const paddedSpenderAddress = spenderAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    const paddedAmount = amountInWei.toString(16).padStart(64, '0');
    const data = '0x095ea7b3' + paddedSpenderAddress + paddedAmount; // approve(address,uint256) function selector

    // Estimate gas first
    const gasEstimate = await window.ethereum.request({
      method: 'eth_estimateGas',
      params: [{
        from: fromAddress,
        to: contractAddress,
        data: data
      }]
    });

    // Send transaction
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: fromAddress,
        to: contractAddress,
        data: data,
        gas: '0x' + (BigInt(gasEstimate) + BigInt(10000)).toString(16) // Add buffer to gas estimate
      }]
    });

    return txHash;
  } catch (error) {
    console.error('Failed to approve token:', error);
    throw error;
  }
}

export async function getTokenAllowance(
  contractAddress: string, 
  ownerAddress: string, 
  spenderAddress: string
): Promise<string> {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Validate addresses
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/) || 
        !ownerAddress.match(/^0x[a-fA-F0-9]{40}$/) || 
        !spenderAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid address format');
    }

    const provider = window.ethereum;
    
    // Encode allowance call
    const paddedOwnerAddress = ownerAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    const paddedSpenderAddress = spenderAddress.toLowerCase().replace('0x', '').padStart(64, '0');
    const data = '0xdd62ed3e' + paddedOwnerAddress + paddedSpenderAddress; // allowance(address,address) function selector

    const result = await provider.request({
      method: 'eth_call',
      params: [{
        to: contractAddress,
        data: data
      }, 'latest']
    });

    return BigInt(result || '0x0').toString();
  } catch (error) {
    console.error('Failed to get token allowance:', error);
    return '0';
  }
}

// Utility functions for token operations
export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    const [intPart, fracPart = '0'] = amount.split('.');
    const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
    let divisor = BigInt(1);
    for (let i = 0; i < decimals; i++) {
      divisor = divisor * BigInt(10);
    }
    const integerPart = BigInt(intPart) * divisor;
    const fractionalPart = BigInt(paddedFrac);
    return integerPart + fractionalPart;
  } catch {
    return BigInt(0);
  }
}

export function formatTokenBalance(amount: string, decimals: number, displayDecimals: number = 4): string {
  try {
    const amountBigInt = BigInt(amount);
    let divisor = BigInt(1);
    for (let i = 0; i < decimals; i++) {
      divisor = divisor * BigInt(10);
    }
    const intPart = amountBigInt / divisor;
    const remainder = amountBigInt % divisor;
    
    if (remainder === BigInt(0)) {
      return intPart.toString();
    }
    
    const fractional = remainder.toString().padStart(decimals, '0');
    const trimmed = fractional.slice(0, displayDecimals).replace(/0+$/, '') || '0';
    return `${intPart.toString()}.${trimmed}`;
  } catch {
    return '0';
  }
}

export function parseStringFromHex(hexData: string): string {
  try {
    if (!hexData || hexData === '0x') return '';
    
    // Remove 0x prefix
    const hex = hexData.replace('0x', '');
    
    // For dynamic strings, skip the first 64 characters (offset) and next 64 characters (length)
    // Then convert the actual string data
    if (hex.length > 128) {
      const stringData = hex.slice(128);
      let result = '';
      for (let i = 0; i < stringData.length; i += 2) {
        const byte = parseInt(stringData.substr(i, 2), 16);
        if (byte === 0) break; // Stop at null terminator
        result += String.fromCharCode(byte);
      }
      return result;
    }
    
    // For simple strings, convert directly
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substr(i, 2), 16);
      if (byte === 0) break;
      result += String.fromCharCode(byte);
    }
    return result;
  } catch {
    return '';
  }
}

// Popular token addresses by chain (for quick access)
export const POPULAR_TOKENS: Record<string, Array<{address: string, symbol: string, name: string}>> = {
  '0x1': [ // Ethereum Mainnet
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD' },
    { address: '0xA0b86a33E6441e3B3A0d12A8b98E6f50a7c6C555', symbol: 'USDC', name: 'USD Coin' },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin' },
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether' }
  ],
  '0x89': [ // Polygon Mainnet
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD' },
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin' },
    { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', symbol: 'DAI', name: 'Dai Stablecoin' },
    { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', symbol: 'WETH', name: 'Wrapped Ether' }
  ],
  '0x38': [ // BSC Mainnet
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD' },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin' },
    { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', symbol: 'DAI', name: 'Dai Stablecoin' },
    { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'WETH', name: 'Wrapped Ether' }
  ],
  '0xa4b1': [ // Arbitrum One
    { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD' },
    { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC', name: 'USD Coin' },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin' },
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', name: 'Wrapped Ether' }
  ],
  '0xa': [ // Optimism Mainnet
    { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether USD' },
    { address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC', name: 'USD Coin' },
    { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', symbol: 'DAI', name: 'Dai Stablecoin' },
    { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether' }
  ]
};
