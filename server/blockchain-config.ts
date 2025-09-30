import { ethers } from "ethers";

export interface BlockchainConfig {
  merchantAddress: string;
  chainId: number;
  chainName: string;
  rpcUrl: string;
  minConfirmations: number;
  valueTolerance: number; // in basis points (100 = 1%)
  explorerUrl: string;
}

const configs: Record<number, BlockchainConfig> = {
  1: {
    merchantAddress: process.env.MERCHANT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    chainId: 1,
    chainName: "Ethereum Mainnet",
    rpcUrl: process.env.ETH_RPC_URL || "https://eth.llamarpc.com",
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || "3"),
    valueTolerance: parseInt(process.env.VALUE_TOLERANCE_BPS || "200"),
    explorerUrl: "https://etherscan.io"
  },
  11155111: {
    merchantAddress: process.env.MERCHANT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    chainId: 11155111,
    chainName: "Sepolia",
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || "2"),
    valueTolerance: parseInt(process.env.VALUE_TOLERANCE_BPS || "200"),
    explorerUrl: "https://sepolia.etherscan.io"
  },
  8453: {
    merchantAddress: process.env.MERCHANT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    chainId: 8453,
    chainName: "Base",
    rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || "3"),
    valueTolerance: parseInt(process.env.VALUE_TOLERANCE_BPS || "200"),
    explorerUrl: "https://basescan.org"
  },
  137: {
    merchantAddress: process.env.MERCHANT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    chainId: 137,
    chainName: "Polygon",
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || "30"),
    valueTolerance: parseInt(process.env.VALUE_TOLERANCE_BPS || "200"),
    explorerUrl: "https://polygonscan.com"
  }
};

export function getChainConfig(chainId: number): BlockchainConfig | null {
  return configs[chainId] || null;
}

export function getAllSupportedChains(): BlockchainConfig[] {
  return Object.values(configs);
}

export interface TransactionVerificationResult {
  valid: boolean;
  txHash: string;
  from: string;
  to: string;
  value: string;
  confirmations: number;
  blockNumber: number | null;
  errors: string[];
}

export async function verifyTransaction(
  txHash: string,
  expectedAmount: string,
  chainId: number
): Promise<TransactionVerificationResult> {
  const config = getChainConfig(chainId);
  
  if (!config) {
    return {
      valid: false,
      txHash,
      from: "",
      to: "",
      value: "0",
      confirmations: 0,
      blockNumber: null,
      errors: [`Unsupported chain ID: ${chainId}`]
    };
  }

  const errors: string[] = [];
  let provider: ethers.JsonRpcProvider;
  
  try {
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
  } catch (error) {
    return {
      valid: false,
      txHash,
      from: "",
      to: "",
      value: "0",
      confirmations: 0,
      blockNumber: null,
      errors: [`Failed to connect to RPC: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }

  try {
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      return {
        valid: false,
        txHash,
        from: "",
        to: "",
        value: "0",
        confirmations: 0,
        blockNumber: null,
        errors: ["Transaction not found on blockchain"]
      };
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    const currentBlock = await provider.getBlockNumber();
    
    const confirmations = receipt && receipt.blockNumber 
      ? currentBlock - receipt.blockNumber + 1 
      : 0;

    const to = tx.to?.toLowerCase() || "";
    const from = tx.from.toLowerCase();
    const value = ethers.formatEther(tx.value);

    if (to !== config.merchantAddress.toLowerCase()) {
      errors.push(`Recipient mismatch: expected ${config.merchantAddress}, got ${to}`);
    }

    if (confirmations < config.minConfirmations) {
      errors.push(`Insufficient confirmations: ${confirmations}/${config.minConfirmations}`);
    }

    if (receipt && receipt.status === 0) {
      errors.push("Transaction failed on blockchain");
    }

    const expectedAmountWei = ethers.parseEther(expectedAmount);
    const actualAmountWei = tx.value;
    const tolerance = (expectedAmountWei * BigInt(config.valueTolerance)) / BigInt(10000);
    const minAcceptable = expectedAmountWei - tolerance;
    const maxAcceptable = expectedAmountWei + tolerance;

    if (actualAmountWei < minAcceptable || actualAmountWei > maxAcceptable) {
      errors.push(
        `Amount mismatch: expected ${expectedAmount} ETH (±${config.valueTolerance/100}%), got ${value} ETH`
      );
    }

    return {
      valid: errors.length === 0,
      txHash,
      from,
      to,
      value,
      confirmations,
      blockNumber: receipt?.blockNumber || null,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      txHash,
      from: "",
      to: "",
      value: "0",
      confirmations: 0,
      blockNumber: null,
      errors: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}
