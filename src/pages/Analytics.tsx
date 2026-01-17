import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TimeData {
  user_id: string;
  display_name: string | null;
  total_sessions: number;
  total_seconds: number;
  last_seen: string;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<TimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      // Get all time tracking data grouped by user
      const { data: trackingData, error: trackingError } = await supabase
        .from('user_time_tracking')
        .select('user_id, duration_seconds, session_start')
        .order('session_start', { ascending: false });

      if (trackingError) {
        console.error('Error fetching tracking data:', trackingError);
        setLoading(false);
        return;
      }

      // Get profiles for display names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name');

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      // Aggregate by user
      const userMap = new Map<string, TimeData>();
      
      trackingData?.forEach(record => {
        const existing = userMap.get(record.user_id);
        if (existing) {
          existing.total_sessions += 1;
          existing.total_seconds += record.duration_seconds || 0;
          if (record.session_start > existing.last_seen) {
            existing.last_seen = record.session_start;
          }
        } else {
          userMap.set(record.user_id, {
            user_id: record.user_id,
            display_name: profileMap.get(record.user_id) || null,
            total_sessions: 1,
            total_seconds: record.duration_seconds || 0,
            last_seen: record.session_start,
          });
        }
      });

      setData(Array.from(userMap.values()).sort((a, b) => b.total_seconds - a.total_seconds));
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, navigate]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display text-foreground">User Time Analytics</h1>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tracking data yet.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground font-display tracking-wider px-3 py-2">
              <span>USER</span>
              <span>SESSIONS</span>
              <span>TOTAL TIME</span>
              <span>LAST SEEN</span>
            </div>
            {data.map((row) => (
              <div 
                key={row.user_id} 
                className="grid grid-cols-4 gap-4 text-sm text-foreground bg-card border border-border rounded-lg px-3 py-3"
              >
                <span className="truncate">{row.display_name || row.user_id.slice(0, 8)}</span>
                <span>{row.total_sessions}</span>
                <span>{formatDuration(row.total_seconds)}</span>
                <span className="text-muted-foreground text-xs">{formatDate(row.last_seen)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
