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
    if (window.gtag) {
      window.gtag('set', { user_id: user?.id ?? null });
    }
  }, [user?.id]);
}
