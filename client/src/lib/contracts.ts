import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  http, 
  parseAbi, 
  parseAbiItem,
  formatUnits,
  parseUnits,
  getContract,
  type PublicClient,
  type WalletClient,
  type Address,
  type Abi,
  type ContractFunctionName,
  type ContractFunctionArgs,
  type AbiFunction,
  type AbiEvent,
  type Log,
  type TransactionReceipt,
  type Hash,
  type GetLogsParameters
} from 'viem';
import { 
  mainnet, 
  polygon, 
  bsc, 
  arbitrum, 
  optimism, 
  goerli, 
  sepolia, 
  polygonMumbai, 
  bscTestnet, 
  arbitrumSepolia, 
  optimismSepolia 
} from 'viem/chains';
import { networks, type NetworkInfo } from '@/lib/web3';

// Chain configuration mapping
const CHAIN_CONFIG = {
  '0x1': mainnet,
  '0x89': polygon,
  '0x38': bsc,
  '0xa4b1': arbitrum,
  '0xa': optimism,
  '0x5': goerli,
  '0xaa36a7': sepolia,
  '0x13881': polygonMumbai,
  '0x61': bscTestnet,
  '0x66eee': arbitrumSepolia,
  '0xaa37dc': optimismSepolia,
} as const;

// Type definitions for contract interactions
export interface ContractInfo {
  id: string;
  address: Address;
  chainId: string;
  name: string;
  abi: Abi;
  tags: string[];
  description?: string;
  isVerified: boolean;
}

export interface ContractFunction extends AbiFunction {
  selector: string;
  isReadOnly: boolean;
  inputs: readonly any[];
  outputs: readonly any[];
}

export interface ContractEvent extends AbiEvent {
  signature: string;
  inputs: readonly any[];
}

export interface ContractCallResult {
  success: boolean;
  data?: any;
  error?: string;
  gasUsed?: bigint;
  txHash?: Hash;
}

export interface EstimateResult {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalCost: bigint;
  totalCostFormatted: string;
}

export interface WriteResult {
  hash: Hash;
  receipt?: TransactionReceipt;
  success: boolean;
  error?: string;
}

export interface EventFilter {
  eventName?: string;
  fromBlock?: bigint | 'latest' | 'earliest';
  toBlock?: bigint | 'latest' | 'earliest';
  indexed?: Record<string, any>;
}

// Client management
const publicClients = new Map<string, PublicClient>();
const walletClients = new Map<string, WalletClient>();

/**
 * Get or create a public client for the specified chain
 */
export function getPublicClient(chainId: string): PublicClient {
  if (publicClients.has(chainId)) {
    return publicClients.get(chainId)!;
  }

  const chain = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(networks[chainId]?.rpcUrl),
  });

  publicClients.set(chainId, client);
  return client;
}

/**
 * Get or create a wallet client for the specified chain
 */
export function getWalletClient(chainId: string): WalletClient {
  if (walletClients.has(chainId)) {
    return walletClients.get(chainId)!;
  }

  if (!window.ethereum) {
    throw new Error('No wallet provider found');
  }

  const chain = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const client = createWalletClient({
    chain,
    transport: custom(window.ethereum),
  });

  walletClients.set(chainId, client);
  return client;
}

/**
 * Parse ABI and categorize functions
 */
export function parseContractAbi(abi: Abi): {
  readFunctions: ContractFunction[];
  writeFunctions: ContractFunction[];
  events: ContractEvent[];
} {
  const readFunctions: ContractFunction[] = [];
  const writeFunctions: ContractFunction[] = [];
  const events: ContractEvent[] = [];

  abi.forEach((item) => {
    if (item.type === 'function') {
      const func = item as AbiFunction;
      const selector = `${func.name}(${func.inputs.map(i => i.type).join(',')})`;
      const isReadOnly = func.stateMutability === 'view' || func.stateMutability === 'pure';
      
      const contractFunc: ContractFunction = {
        ...func,
        selector,
        isReadOnly,
        inputs: func.inputs,
        outputs: func.outputs || [],
      };

      if (isReadOnly) {
        readFunctions.push(contractFunc);
      } else {
        writeFunctions.push(contractFunc);
      }
    } else if (item.type === 'event') {
      const event = item as AbiEvent;
      const signature = `${event.name}(${event.inputs.map(i => i.type).join(',')})`;
      
      events.push({
        ...event,
        signature,
        inputs: event.inputs,
      });
    }
  });

  return { readFunctions, writeFunctions, events };
}

/**
 * Validate and format function arguments
 */
export function validateAndFormatArgs(
  func: ContractFunction, 
  args: any[]
): any[] {
  if (args.length !== func.inputs.length) {
    throw new Error(`Expected ${func.inputs.length} arguments, got ${args.length}`);
  }

  return args.map((arg, index) => {
    const input = func.inputs[index];
    
    // Basic type validation and formatting
    switch (input.type) {
      case 'address':
        if (!/^0x[a-fA-F0-9]{40}$/.test(arg)) {
          throw new Error(`Invalid address format: ${arg}`);
        }
        return arg.toLowerCase() as Address;
      
      case 'uint256':
      case 'uint':
        return parseUnits(arg.toString(), 0);
      
      case 'bool':
        return Boolean(arg);
      
      case 'string':
        return String(arg);
      
      case 'bytes32':
        if (!/^0x[a-fA-F0-9]{64}$/.test(arg)) {
          throw new Error(`Invalid bytes32 format: ${arg}`);
        }
        return arg;
      
      default:
        return arg;
    }
  });
}

/**
 * Read from a contract (view/pure functions)
 */
export async function readContract(
  contract: ContractInfo,
  functionName: string,
  args: any[] = []
): Promise<ContractCallResult> {
  try {
    const { readFunctions } = parseContractAbi(contract.abi);
    const func = readFunctions.find(f => f.name === functionName);
    
    if (!func) {
      throw new Error(`Read function '${functionName}' not found in contract ABI`);
    }

    const validatedArgs = validateAndFormatArgs(func, args);
    const publicClient = getPublicClient(contract.chainId);

    const result = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: functionName as ContractFunctionName<typeof contract.abi>,
      args: validatedArgs as ContractFunctionArgs<typeof contract.abi, typeof functionName>,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Contract read error:', error);
    return {
      success: false,
      error: error.message || 'Failed to read from contract',
    };
  }
}

/**
 * Estimate gas for a contract write operation
 */
export async function estimateContractWrite(
  contract: ContractInfo,
  functionName: string,
  args: any[] = [],
  value: bigint = 0n,
  account?: Address
): Promise<EstimateResult> {
  try {
    const { writeFunctions } = parseContractAbi(contract.abi);
    const func = writeFunctions.find(f => f.name === functionName);
    
    if (!func) {
      throw new Error(`Write function '${functionName}' not found in contract ABI`);
    }

    const validatedArgs = validateAndFormatArgs(func, args);
    const publicClient = getPublicClient(contract.chainId);
    const walletClient = getWalletClient(contract.chainId);

    // Get account if not provided
    const fromAccount = account || (await walletClient.getAddresses())[0];
    if (!fromAccount) {
      throw new Error('No account available for estimation');
    }

    // Estimate gas
    const gasLimit = await publicClient.estimateContractGas({
      address: contract.address,
      abi: contract.abi,
      functionName: functionName as ContractFunctionName<typeof contract.abi>,
      args: validatedArgs as ContractFunctionArgs<typeof contract.abi, typeof functionName>,
      account: fromAccount,
      value,
    });

    // Get gas price information
    const gasPrice = await publicClient.getGasPrice();
    
    // Try to get EIP-1559 fees if supported
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    
    try {
      const feeData = await publicClient.estimateFeesPerGas();
      maxFeePerGas = feeData.maxFeePerGas;
      maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } catch {
      // Fallback to legacy gas pricing
    }

    const effectiveGasPrice = maxFeePerGas || gasPrice;
    const totalCost = gasLimit * effectiveGasPrice + value;
    
    const network = networks[contract.chainId];
    const decimals = parseInt(network?.decimals || '18');
    const totalCostFormatted = formatUnits(totalCost, decimals);

    return {
      gasLimit,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      totalCost,
      totalCostFormatted: `${totalCostFormatted} ${network?.symbol || 'ETH'}`,
    };
  } catch (error: any) {
    console.error('Gas estimation error:', error);
    throw new Error(`Gas estimation failed: ${error.message}`);
  }
}

/**
 * Write to a contract (state-changing functions)
 */
export async function writeContract(
  contract: ContractInfo,
  functionName: string,
  args: any[] = [],
  value: bigint = 0n,
  gasLimit?: bigint
): Promise<WriteResult> {
  try {
    const { writeFunctions } = parseContractAbi(contract.abi);
    const func = writeFunctions.find(f => f.name === functionName);
    
    if (!func) {
      throw new Error(`Write function '${functionName}' not found in contract ABI`);
    }

    const validatedArgs = validateAndFormatArgs(func, args);
    const walletClient = getWalletClient(contract.chainId);
    const publicClient = getPublicClient(contract.chainId);

    // Get account
    const [account] = await walletClient.getAddresses();
    if (!account) {
      throw new Error('No account connected');
    }

    // Estimate gas if not provided
    const estimatedGas = gasLimit || await publicClient.estimateContractGas({
      address: contract.address,
      abi: contract.abi,
      functionName: functionName as ContractFunctionName<typeof contract.abi>,
      args: validatedArgs as ContractFunctionArgs<typeof contract.abi, typeof functionName>,
      account,
      value,
    });

    // Execute transaction
    const hash = await walletClient.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: functionName as ContractFunctionName<typeof contract.abi>,
      args: validatedArgs as ContractFunctionArgs<typeof contract.abi, typeof functionName>,
      account,
      value,
      gas: estimatedGas,
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 60_000, // 60 seconds timeout
    });

    return {
      hash,
      receipt,
      success: receipt.status === 'success',
      error: receipt.status === 'reverted' ? 'Transaction reverted' : undefined,
    };
  } catch (error: any) {
    console.error('Contract write error:', error);
    return {
      hash: '0x' as Hash,
      success: false,
      error: error.message || 'Failed to write to contract',
    };
  }
}

/**
 * Get contract events with filtering
 */
export async function getContractEvents(
  contract: ContractInfo,
  filter: EventFilter = {},
  limit: number = 100
): Promise<{
  events: Array<{
    eventName: string;
    args: Record<string, any>;
    blockNumber: bigint;
    transactionHash: Hash;
    logIndex: number;
  }>;
  hasMore: boolean;
}> {
  try {
    const { events } = parseContractAbi(contract.abi);
    const publicClient = getPublicClient(contract.chainId);

    let eventAbi: AbiEvent[] = [];
    
    if (filter.eventName) {
      const event = events.find(e => e.name === filter.eventName);
      if (!event) {
        throw new Error(`Event '${filter.eventName}' not found in contract ABI`);
      }
      eventAbi = [event];
    } else {
      eventAbi = events;
    }

    const logParams: GetLogsParameters = {
      address: contract.address,
      fromBlock: filter.fromBlock || 'earliest',
      toBlock: filter.toBlock || 'latest',
      // Note: viem handles event filtering differently than ethers
      // We'll get all logs and filter them manually if needed
    };

    const logs = await publicClient.getLogs(logParams);
    
    // Parse and decode logs
    const decodedEvents = logs
      .slice(0, limit)
      .map((log) => {
        // Try to decode with each event in the ABI
        for (const event of eventAbi) {
          try {
            const decoded = publicClient.parseEventLogs({
              abi: [event],
              logs: [log],
            })[0];
            
            if (decoded) {
              return {
                eventName: decoded.eventName,
                args: decoded.args as Record<string, any>,
                blockNumber: log.blockNumber!,
                transactionHash: log.transactionHash!,
                logIndex: log.logIndex!,
              };
            }
          } catch {
            // Continue to next event
          }
        }
        return null;
      })
      .filter(Boolean);

    return {
      events: decodedEvents as any[],
      hasMore: logs.length > limit,
    };
  } catch (error: any) {
    console.error('Error fetching contract events:', error);
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
}

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerUrl(chainId: string, txHash: Hash): string {
  const network = networks[chainId];
  return `${network?.blockExplorerUrl}/tx/${txHash}`;
}

/**
 * Format contract function signature for display
 */
export function formatFunctionSignature(func: ContractFunction): string {
  const inputs = func.inputs.map(input => 
    `${input.type}${input.name ? ` ${input.name}` : ''}`
  ).join(', ');
  
  const outputs = func.outputs.length > 0 
    ? ` returns (${func.outputs.map(output => output.type).join(', ')})`
    : '';
    
  return `${func.name}(${inputs})${outputs}`;
}

/**
 * Validate contract address and ABI
 */
export async function validateContract(
  address: Address, 
  abi: Abi, 
  chainId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const publicClient = getPublicClient(chainId);
    
    // Check if address has code
    const bytecode = await publicClient.getCode({ address });
    if (!bytecode || bytecode === '0x') {
      return { 
        isValid: false, 
        error: 'No contract found at this address' 
      };
    }

    // Try to parse the ABI
    parseContractAbi(abi);

    return { isValid: true };
  } catch (error: any) {
    return { 
      isValid: false, 
      error: error.message || 'Invalid contract or ABI' 
    };
  }
}

/**
 * Check if user is on the correct network
 */
export async function ensureCorrectNetwork(chainId: string): Promise<boolean> {
  if (!window.ethereum) {
    throw new Error('No wallet provider found');
  }

  const currentChainId = await window.ethereum.request({ 
    method: 'eth_chainId' 
  });

  if (currentChainId !== chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to wallet, try to add it
        const network = networks[chainId];
        if (network) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorerUrl],
                nativeCurrency: {
                  name: network.symbol,
                  symbol: network.symbol,
                  decimals: parseInt(network.decimals),
                },
              }],
            });
            return true;
          } catch {
            throw new Error('Failed to add network to wallet');
          }
        }
      }
      throw new Error('Failed to switch to required network');
    }
  }

  return true;
}