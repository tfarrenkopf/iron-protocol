import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, Zap, RefreshCw, Dumbbell, Target } from 'lucide-react';
import { MissionWithExercises } from '@/hooks/useMissions';

interface TodayMissionsWidgetProps {
  missions: MissionWithExercises[];
}

// Seeded random for consistent daily selection
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getSeededItem = <T,>(arr: T[], seed: number): T | undefined => {
  if (arr.length === 0) return undefined;
  const index = Math.floor(seededRandom(seed) * arr.length);
  return arr[index];
};

// Format equipment names for display
const formatEquipment = (eq: string): string => {
  return eq.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export function TodayMissionsWidget({ missions }: TodayMissionsWidgetProps) {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Use date + refreshKey as seed for consistent daily picks
  const dailySeed = useMemo(() => {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + refreshKey;
  }, [refreshKey]);
  
  // Select 3 missions (1 short, 1 medium, 1 long) - stable based on daily seed
  const featuredMissions = useMemo(() => {
    if (!missions || missions.length === 0) return [];

    const shortMissions = missions.filter((m) => m.estimated_minutes < 20);
    const mediumMissions = missions.filter((m) => m.estimated_minutes >= 20 && m.estimated_minutes < 40);
    const longMissions = missions.filter((m) => m.estimated_minutes >= 40);

    const selected: typeof missions = [];

    const short = getSeededItem(shortMissions, dailySeed);
    const medium = getSeededItem(mediumMissions, dailySeed + 1);
    const long = getSeededItem(longMissions, dailySeed + 2);

    if (short) selected.push(short);
    if (medium) selected.push(medium);
    if (long) selected.push(long);

    return selected.sort((a, b) => a.estimated_minutes - b.estimated_minutes);
  }, [missions, dailySeed]);

  // Extract unique equipment from a mission's exercises
  const getUniqueEquipment = (mission: MissionWithExercises) => {
    const equipmentSet = new Set<string>();
    mission.mission_exercises?.forEach(me => {
      me.exercises?.equipment?.forEach(eq => equipmentSet.add(eq));
    });
    return Array.from(equipmentSet).slice(0, 3);
  };

  // Extract unique muscle groups from a mission's exercises
  const getUniqueMuscles = (mission: MissionWithExercises) => {
    const muscleSet = new Set<string>();
    mission.mission_exercises?.forEach(me => {
      if (me.exercises?.primary_muscle_group) {
        muscleSet.add(me.exercises.primary_muscle_group);
      }
    });
    return Array.from(muscleSet).slice(0, 2);
  };

  if (featuredMissions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="font-display text-sm text-accent tracking-wider">TODAY'S PICKS</span>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="p-1.5 text-muted-foreground hover:text-accent transition-colors rounded"
          title="Shuffle picks"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {featuredMissions.map((mission, i) => {
          const equipment = getUniqueEquipment(mission);
          const muscles = getUniqueMuscles(mission);
          
          return (
            <motion.button
              key={`${mission.id}-${refreshKey}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/mission/${mission.id}`)}
              className="group bg-gradient-to-br from-card via-card to-accent/5 border border-accent/30 rounded-lg p-3 text-left hover:border-accent hover:box-glow-accent/30 transition-all"
            >
              {/* Header row: name + duration badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-display text-sm text-accent truncate group-hover:text-glow-accent transition-all flex-1">
                  {mission.code_name}
                </h4>
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

              {/* Focus areas */}
              {mission.focus_areas && mission.focus_areas.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="w-3 h-3 text-section-missions flex-shrink-0" />
                  <div className="flex gap-1 flex-wrap">
                    {mission.focus_areas.slice(0, 2).map((area) => (
                      <span 
                        key={area}
                        className="text-[9px] px-1.5 py-0.5 bg-section-missions/15 text-section-missions rounded"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Muscle groups */}
              {muscles.length > 0 && (
                <div className="text-[10px] text-muted-foreground mb-2 truncate">
                  {muscles.join(' • ')}
                </div>
              )}

              {/* Equipment */}
              {equipment.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Dumbbell className="w-3 h-3 text-accent/70 flex-shrink-0" />
                  <div className="flex gap-1 flex-wrap">
                    {equipment.map((eq) => (
                      <span 
                        key={eq}
                        className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
                      >
                        {formatEquipment(eq)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/50 pt-2 mt-auto">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {mission.estimated_minutes}m
                </span>
                <span className="flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />
                  {mission.difficulty}/5
                </span>
                <span>{mission.mission_exercises?.length || 0} exercises</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
