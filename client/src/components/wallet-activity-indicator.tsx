import { useEffect, useState } from "react";
import { useWeb3 } from "@/hooks/use-web3";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

export default function WalletActivityIndicator() {
  const { isConnected, isTransferring, isApproving } = useWeb3();
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    setShowActivity(isTransferring || isApproving);
  }, [isTransferring, isApproving]);

  if (!isConnected) return null;

  return (
    <AnimatePresence>
      {showActivity && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-24 right-4 z-50"
          data-testid="wallet-activity-indicator"
        >
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-4 shadow-2xl">
            <Zap className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-ping" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
