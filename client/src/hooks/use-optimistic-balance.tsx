import { useState, useEffect } from "react";
import { useWeb3 } from "@/hooks/use-web3";

interface PendingTransaction {
  type: 'send' | 'receive';
  amount: string;
  timestamp: number;
  hash?: string;
}

export function useOptimisticBalance() {
  const { balance, account, network } = useWeb3();
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [optimisticBalance, setOptimisticBalance] = useState<string | undefined>(balance);

  // Update optimistic balance when actual balance changes
  useEffect(() => {
    setOptimisticBalance(balance);
    // Clear pending transactions that are now confirmed
    setPendingTransactions(prev => prev.filter(tx => 
      Date.now() - tx.timestamp < 60000 // Keep for 1 minute
    ));
  }, [balance]);

  // Clean up old pending transactions
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingTransactions(prev => prev.filter(tx => 
        Date.now() - tx.timestamp < 60000
      ));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const addPendingTransaction = (type: 'send' | 'receive', amount: string, hash?: string) => {
    const transaction: PendingTransaction = {
      type,
      amount,
      timestamp: Date.now(),
      hash
    };
    
    setPendingTransactions(prev => [...prev, transaction]);

    // Update optimistic balance
    if (balance) {
      const currentBalance = parseFloat(balance);
      const txAmount = parseFloat(amount);
      
      if (!isNaN(currentBalance) && !isNaN(txAmount)) {
        const newBalance = type === 'send' 
          ? currentBalance - txAmount 
          : currentBalance + txAmount;
        
        setOptimisticBalance(Math.max(0, newBalance).toFixed(4));
      }
    }
  };

  const clearPendingTransaction = (hash?: string) => {
    if (hash) {
      setPendingTransactions(prev => prev.filter(tx => tx.hash !== hash));
    } else {
      setPendingTransactions([]);
    }
  };

  const hasPendingTransactions = pendingTransactions.length > 0;

  return {
    optimisticBalance: optimisticBalance || balance,
    actualBalance: balance,
    hasPendingTransactions,
    pendingCount: pendingTransactions.length,
    addPendingTransaction,
    clearPendingTransaction,
    pendingTransactions
  };
}
