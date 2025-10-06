import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AuthResponse {
  authenticated: boolean;
  isOwner: boolean;
}

export function useDevAutoLogin() {
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
  
  const { data, isLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const autoLogin = async () => {
      // Only in development, if not authenticated, and haven't tried yet
      if (import.meta.env.DEV && !isLoading && !data?.authenticated && !hasAttemptedLogin) {
        setHasAttemptedLogin(true);
        
        try {
          console.log('🔐 DEV MODE: Attempting auto-login as owner...');
          const response = await apiRequest('POST', '/api/auth/dev-login-owner');
          const data = await response.json();
          
          if (data.success) {
            console.log('✅ DEV MODE: Auto-logged in as owner successfully');
            // Invalidate auth cache and refetch
            await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
          }
        } catch (error) {
          console.log('ℹ️ Dev auto-login not available or disabled');
        }
      }
    };

    autoLogin();
  }, [data, isLoading, hasAttemptedLogin]);

  return { isAuthenticated: data?.authenticated, isOwner: data?.isOwner };
}
