import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { trackPageView, setUserId, setUserProperties } from '@/lib/analytics';

/**
 * Google Analytics integration hook
 * 
 * Handles:
 * 1. User ID tracking for cross-session analysis
 * 2. User properties for segmentation (anonymous vs authenticated)
 * 3. SPA page view tracking on route changes
 * 
 * Must be called within Router context and AuthProvider
 */
export function useGoogleAnalytics() {
  const { user, isAnonymous, isLoading } = useAuth();
  const location = useLocation();
  const previousPath = useRef<string | null>(null);

  // Track user identity and properties
  useEffect(() => {
    if (isLoading) return;

    // Set user ID for cross-session tracking (only for real users)
    if (user && !isAnonymous) {
      setUserId(user.id);
      setUserProperties({
        user_type: 'authenticated',
      });
    } else if (isAnonymous) {
      setUserId(null);
      setUserProperties({
        user_type: 'anonymous',
      });
    } else {
      setUserId(null);
      setUserProperties({
        user_type: 'guest',
      });
    }
  }, [user?.id, isAnonymous, isLoading]);

  // Track SPA page views on route changes
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Skip duplicate tracking (e.g., from React StrictMode double-render)
    if (previousPath.current === currentPath) return;
    
    // Skip initial page load (handled by gtag config in index.html)
    if (previousPath.current !== null) {
      trackPageView(currentPath);
    }
    
    previousPath.current = currentPath;
  }, [location.pathname, location.search]);
}
