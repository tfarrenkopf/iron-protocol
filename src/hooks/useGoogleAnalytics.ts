import { useEffect } from 'react';
import { useAuth } from './useAuth';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function useGoogleAnalytics() {
  const { user } = useAuth();

  useEffect(() => {
    if (window.gtag && user?.id) {
      window.gtag('set', { user_id: user.id });
    }
  }, [user?.id]);
}
