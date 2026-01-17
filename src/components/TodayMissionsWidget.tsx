import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, Zap } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface TodayMissionsWidgetProps {
  missions: Tables<'missions'>[];
}

// Helper to get a random item from an array
const getRandomItem = <T,>(arr: T[]): T | undefined => {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
};

export function TodayMissionsWidget({ missions }: TodayMissionsWidgetProps) {
  const navigate = useNavigate();
  
  // Select 3 random missions (1 short, 1 medium, 1 long)
  const featuredMissions = useMemo(() => {
    if (!missions || missions.length === 0) return [];

    const shortMissions = missions.filter((m) => m.estimated_minutes < 20);
    const mediumMissions = missions.filter((m) => m.estimated_minutes >= 20 && m.estimated_minutes < 40);
    const longMissions = missions.filter((m) => m.estimated_minutes >= 40);

    const selected: typeof missions = [];

    const short = getRandomItem(shortMissions);
    const medium = getRandomItem(mediumMissions);
    const long = getRandomItem(longMissions);

    if (short) selected.push(short);
    if (medium) selected.push(medium);
    if (long) selected.push(long);

    return selected.sort((a, b) => a.estimated_minutes - b.estimated_minutes);
  }, [missions]);

  if (featuredMissions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="font-display text-sm text-accent tracking-wider">TODAY'S PICKS</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {featuredMissions.map((mission, i) => (
          <motion.button
            key={mission.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/mission/${mission.id}`)}
            className="group bg-gradient-to-br from-card via-card to-accent/5 border border-accent/30 rounded-lg p-3 text-left hover:border-accent hover:box-glow-accent/30 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-display text-sm text-accent truncate group-hover:text-glow-accent transition-all">
                  {mission.code_name}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {mission.estimated_minutes}m
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    {mission.difficulty}/5
                  </span>
                </div>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-display flex-shrink-0 ${
                mission.estimated_minutes < 20
                  ? 'bg-secondary/20 text-secondary'
                  : mission.estimated_minutes < 40
                    ? 'bg-primary/20 text-primary'
                    : 'bg-accent/20 text-accent'
              }`}>
                {mission.estimated_minutes < 20 ? 'QUICK' : mission.estimated_minutes < 40 ? 'STD' : 'LONG'}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
