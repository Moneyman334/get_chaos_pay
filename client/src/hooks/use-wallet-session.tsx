import { useEffect, useCallback, useRef } from "react";
import { useWeb3 } from "@/hooks/use-web3";
import { useToast } from "@/hooks/use-toast";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // 5 minutes warning

export function useWalletSession() {
  const { isConnected, disconnectWallet } = useWeb3();
  const { toast } = useToast();
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef(false);

  // Update last activity time
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
  }, []);

  // Check for user activity
  useEffect(() => {
    if (!isConnected) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [isConnected, updateActivity]);

  // Session timeout checker
  useEffect(() => {
    if (!isConnected) return;

    const checkSession = () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const timeUntilTimeout = SESSION_TIMEOUT - timeSinceActivity;

      // Show warning 5 minutes before timeout
      if (timeUntilTimeout <= WARNING_BEFORE_TIMEOUT && timeUntilTimeout > 0 && !warningShownRef.current) {
        warningShownRef.current = true;
        toast({
          title: "Session expiring soon",
          description: "Your wallet session will expire due to inactivity. Move your mouse to keep the session active.",
          duration: 10000,
        });
      }

      // Timeout reached
      if (timeSinceActivity >= SESSION_TIMEOUT) {
        toast({
          title: "Session expired",
          description: "Your wallet has been disconnected due to inactivity",
          variant: "destructive",
        });
        disconnectWallet();
      }
    };

    const interval = setInterval(checkSession, ACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isConnected, disconnectWallet, toast]);

  // Save connection history
  useEffect(() => {
    if (isConnected) {
      const history = JSON.parse(localStorage.getItem('wallet_connection_history') || '[]');
      const newEntry = {
        timestamp: Date.now(),
        date: new Date().toISOString(),
        action: 'connected'
      };
      
      history.unshift(newEntry);
      // Keep only last 10 entries
      localStorage.setItem('wallet_connection_history', JSON.stringify(history.slice(0, 10)));
    }
  }, [isConnected]);

  return {
    updateActivity,
    timeoutDuration: SESSION_TIMEOUT,
    getConnectionHistory: () => JSON.parse(localStorage.getItem('wallet_connection_history') || '[]')
  };
}
