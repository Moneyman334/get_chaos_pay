/**
 * Web3 Error Handler
 * Provides user-friendly error messages for common Web3/MetaMask errors
 */

export interface Web3ErrorInfo {
  title: string;
  description: string;
  isUserRejection?: boolean;
  canRetry?: boolean;
}

/**
 * Parse Web3 error and return user-friendly error info
 */
export function parseWeb3Error(error: any): Web3ErrorInfo {
  // Handle user rejection
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return {
      title: "Request Cancelled",
      description: "You cancelled the request in your wallet",
      isUserRejection: true,
      canRetry: true
    };
  }

  // Handle already pending request
  if (error.code === -32002) {
    return {
      title: "Request Already Pending",
      description: "Please check your wallet - there's already a pending request waiting for your approval",
      canRetry: true
    };
  }

  // Handle insufficient funds
  if (
    error.code === -32000 || 
    error.message?.toLowerCase().includes('insufficient funds') ||
    error.message?.toLowerCase().includes('insufficient balance')
  ) {
    return {
      title: "Insufficient Funds",
      description: "You don't have enough balance to complete this transaction, including gas fees",
      canRetry: false
    };
  }

  // Handle network errors
  if (error.code === 4902) {
    return {
      title: "Network Not Found",
      description: "This network hasn't been added to your wallet yet. We'll try to add it for you",
      canRetry: true
    };
  }

  // Handle -32603 errors - check specific subtypes first
  if (error.code === -32603) {
    // Check for chain mismatch
    if (error.message?.toLowerCase().includes('chain')) {
      return {
        title: "Wrong Network",
        description: "Please switch to the correct network in your wallet",
        canRetry: true
      };
    }
    
    // Check for wallet locked
    if (error.message?.toLowerCase().includes('locked')) {
      return {
        title: "Wallet Locked",
        description: "Please unlock your wallet and try again",
        canRetry: true
      };
    }
    
    // Generic RPC error (fallback for -32603)
    return {
      title: "RPC Error",
      description: "Failed to connect to the blockchain network. Please check your connection or try a different RPC",
      canRetry: true
    };
  }

  // Handle gas estimation errors (not -32603)
  if (
    error.message?.toLowerCase().includes('gas') ||
    error.message?.toLowerCase().includes('out of gas')
  ) {
    return {
      title: "Gas Estimation Failed",
      description: "Unable to estimate gas for this transaction. The transaction may fail or the contract may not exist",
      canRetry: true
    };
  }

  // Handle invalid address
  if (error.message?.toLowerCase().includes('invalid address')) {
    return {
      title: "Invalid Address",
      description: "The wallet address you entered is not valid. Please check and try again",
      canRetry: false
    };
  }

  // Handle nonce errors
  if (error.message?.toLowerCase().includes('nonce')) {
    return {
      title: "Transaction Order Issue",
      description: "Transaction nonce is incorrect. Try resetting your wallet account in MetaMask settings",
      canRetry: true
    };
  }

  // Handle transaction timeout
  if (error.message?.toLowerCase().includes('timeout') || error.code === 'TIMEOUT') {
    return {
      title: "Request Timeout",
      description: "The request took too long to complete. Please check your connection and try again",
      canRetry: true
    };
  }

  // Handle rate limiting
  if (error.code === 429 || error.message?.toLowerCase().includes('rate limit')) {
    return {
      title: "Too Many Requests",
      description: "You're making requests too quickly. Please wait a moment and try again",
      canRetry: true
    };
  }

  // Handle contract execution errors
  if (error.message?.toLowerCase().includes('execution reverted')) {
    return {
      title: "Transaction Failed",
      description: "The contract rejected this transaction. This might be due to insufficient allowance or incorrect parameters",
      canRetry: false
    };
  }

  // Handle token approval errors
  if (error.message?.toLowerCase().includes('allowance') || error.message?.toLowerCase().includes('approval')) {
    return {
      title: "Approval Required",
      description: "You need to approve token spending before this transaction can complete",
      canRetry: false
    };
  }

  // Handle wallet not found
  if (error.message?.toLowerCase().includes('no ethereum provider') || error.message?.toLowerCase().includes('wallet not found')) {
    return {
      title: "Wallet Not Found",
      description: "Please install MetaMask or another Web3 wallet to continue",
      canRetry: false
    };
  }

  // Handle unknown method
  if (error.code === -32601) {
    return {
      title: "Method Not Supported",
      description: "Your wallet doesn't support this operation",
      canRetry: false
    };
  }

  // Security/blocked transaction (custom from our validation)
  if (error.blocked) {
    return {
      title: "Transaction Blocked",
      description: error.reason || "This transaction was blocked by our security system",
      canRetry: false
    };
  }

  // User cancelled due to security warnings (custom)
  if (error.cancelled && error.warnings) {
    return {
      title: "Transaction Cancelled",
      description: "You cancelled the transaction due to security warnings",
      isUserRejection: true,
      canRetry: true
    };
  }

  // Generic fallback
  return {
    title: "Transaction Failed",
    description: error.message || "An unknown error occurred. Please try again",
    canRetry: true
  };
}

/**
 * Get action text based on error retry capability
 */
export function getErrorAction(errorInfo: Web3ErrorInfo): string {
  if (errorInfo.isUserRejection) {
    return "Try again when ready";
  }
  if (errorInfo.canRetry) {
    return "Please try again";
  }
  return "Please review and correct the issue";
}
