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
  const [defaultPreference, setDefaultPreference] = useState<boolean | null>(null);
  
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch user preferences if authenticated
  const { data: preferences, isLoading: prefsLoading } = useQuery<UserPreferences>({
    queryKey: ['/api/preferences'],
    enabled: authData?.authenticated === true,
  });

  // Fetch default preference for unauthenticated users
  useEffect(() => {
    const fetchDefault = async () => {
      if (authData?.authenticated || defaultPreference !== null) {
        return;
      }
      
      try {
        const response = await fetch('/api/preferences/default');
        const data = await response.json();
        setDefaultPreference(data.autoLoginEnabled === 'true');
      } catch {
        // Default to true in dev mode if endpoint doesn't exist
        setDefaultPreference(import.meta.env.DEV);
      }
    };
    
    fetchDefault();
  }, [authData, defaultPreference]);

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

      // Wait for default preference to be loaded for unauthenticated users
      if (defaultPreference === null) {
        return;
      }

      // Check preference: if user is authenticated, use stored preference; otherwise use default
      const shouldAutoLogin = authData?.authenticated 
        ? preferences?.autoLoginEnabled === 'true'
        : defaultPreference;

      if (!shouldAutoLogin) {
        console.log('ℹ️ DEV MODE: Auto-login disabled by user preference');
        setHasAttemptedLogin(true);
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
  }, [authData, authLoading, hasAttemptedLogin, preferences, defaultPreference]);

  return { 
    isAuthenticated: authData?.authenticated, 
    isOwner: authData?.isOwner,
    autoLoginEnabled: authData?.authenticated 
      ? preferences?.autoLoginEnabled === 'true'
      : defaultPreference ?? false
  };
}
