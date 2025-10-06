import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AuthResponse {
  authenticated: boolean;
  isOwner: boolean;
}

interface UserPreferences {
  autoLoginEnabled: string;
  autoConnectEnabled: string;
  lastWalletId?: string;
}

export function useDevAutoLogin() {
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
  
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch user preferences if authenticated
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['/api/preferences'],
    enabled: authData?.authenticated === true,
  });

  useEffect(() => {
    const autoLogin = async () => {
      // Skip if already attempted or loading
      if (hasAttemptedLogin || authLoading) {
        return;
      }

      // Skip if already authenticated
      if (authData?.authenticated) {
        return;
      }

      // Only proceed in development mode
      if (!import.meta.env.DEV) {
        return;
      }

      setHasAttemptedLogin(true);
      
      try {
        console.log('🔐 DEV MODE: Attempting auto-login as owner...');
        const response = await apiRequest('POST', '/api/auth/dev-login-owner', {});
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ DEV MODE: Auto-logged in as owner successfully');
          // Invalidate auth cache and refetch
          await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
          await queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
        }
      } catch (error) {
        console.log('ℹ️ Dev auto-login not available or disabled');
      }
    };

    autoLogin();
  }, [authData, authLoading, hasAttemptedLogin]);

  return { 
    isAuthenticated: authData?.authenticated, 
    isOwner: authData?.isOwner,
    autoLoginEnabled: preferences?.autoLoginEnabled === 'true'
  };
}
