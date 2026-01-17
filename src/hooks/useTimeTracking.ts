import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useTimeTracking() {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;

    const startSession = async () => {
      startTimeRef.current = Date.now();
      
      const { data, error } = await supabase
        .from('user_time_tracking')
        .insert({
          user_id: user.id,
          session_start: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!error && data) {
        sessionIdRef.current = data.id;
      }
    };

    const updateSession = async () => {
      if (!sessionIdRef.current) return;

      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

      await supabase
        .from('user_time_tracking')
        .update({
          session_end: new Date().toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', sessionIdRef.current);
    };

    startSession();

    // Update every 30 seconds
    const interval = setInterval(updateSession, 30000);

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateSession();
      }
    };

    // Update on beforeunload
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        // Use sendBeacon for reliable delivery on page close
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_time_tracking?id=eq.${sessionIdRef.current}`,
          JSON.stringify({
            session_end: new Date().toISOString(),
            duration_seconds: durationSeconds,
          })
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      updateSession();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);
}
