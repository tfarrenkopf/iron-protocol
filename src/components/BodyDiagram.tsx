import { motion } from 'framer-motion';
import { MuscleGroupStat, MUSCLE_BODY_MAP } from '@/hooks/useMuscleGroupStats';

interface BodyDiagramProps {
  muscleStats: MuscleGroupStat[];
}

const BodyDiagram = ({ muscleStats }: BodyDiagramProps) => {
  // Calculate intensity for each body part (0-1 scale)
  const maxSets = Math.max(...muscleStats.map(s => s.total_sets), 1);
  
  const getIntensity = (muscleGroup: string): number => {
    const stat = muscleStats.find(s => s.muscle_group === muscleGroup);
    if (!stat) return 0;
    return stat.total_sets / maxSets;
  };

  const getColor = (intensity: number): string => {
    if (intensity === 0) return 'hsl(var(--muted))';
    if (intensity < 0.3) return 'hsl(var(--secondary) / 0.4)';
    if (intensity < 0.6) return 'hsl(var(--secondary) / 0.7)';
    if (intensity < 0.8) return 'hsl(var(--primary) / 0.8)';
    return 'hsl(var(--primary))';
  };

  const getGlow = (intensity: number): string => {
    if (intensity >= 0.8) return '0 0 15px hsl(var(--primary) / 0.6)';
    if (intensity >= 0.5) return '0 0 10px hsl(var(--secondary) / 0.4)';
    return 'none';
  };

  // Top 3 strongest and gaps
  const sortedStats = [...muscleStats].sort((a, b) => b.total_sets - a.total_sets);
  const strengths = sortedStats.slice(0, 3);
  
  // Find muscle groups that haven't been worked (gaps)
  const allMuscleGroups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core'];
  const workedGroups = new Set(muscleStats.map(s => s.muscle_group));
  const gaps = allMuscleGroups.filter(mg => !workedGroups.has(mg));
  const weakGroups = sortedStats.filter(s => s.total_sets > 0).slice(-3);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-center">
      {/* Body SVG */}
      <div className="relative w-48 h-80 flex-shrink-0">
        <svg viewBox="0 0 100 180" className="w-full h-full">
          {/* Background body outline */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Head */}
          <ellipse cx="50" cy="18" rx="12" ry="14" 
            fill={getColor(0)} 
            stroke="hsl(var(--border))" 
            strokeWidth="0.5"
          />
          
          {/* Neck */}
          <rect x="44" y="30" width="12" height="8" 
            fill={getColor(getIntensity('Traps'))} 
            style={{ filter: getIntensity('Traps') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          
          {/* Traps */}
          <path d="M32 38 L44 38 L44 45 L32 50 Z" 
            fill={getColor(getIntensity('Traps'))} 
            style={{ boxShadow: getGlow(getIntensity('Traps')) }}
          />
          <path d="M68 38 L56 38 L56 45 L68 50 Z" 
            fill={getColor(getIntensity('Traps'))} 
          />
          
          {/* Shoulders */}
          <ellipse cx="28" cy="48" rx="8" ry="6" 
            fill={getColor(getIntensity('Shoulders'))} 
            style={{ filter: getIntensity('Shoulders') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          <ellipse cx="72" cy="48" rx="8" ry="6" 
            fill={getColor(getIntensity('Shoulders'))} 
            style={{ filter: getIntensity('Shoulders') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          
          {/* Chest */}
          <ellipse cx="40" cy="52" rx="10" ry="8" 
            fill={getColor(getIntensity('Chest'))} 
            style={{ filter: getIntensity('Chest') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          <ellipse cx="60" cy="52" rx="10" ry="8" 
            fill={getColor(getIntensity('Chest'))} 
            style={{ filter: getIntensity('Chest') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          
          {/* Biceps */}
          <ellipse cx="22" cy="62" rx="5" ry="10" 
            fill={getColor(getIntensity('Biceps'))} 
            style={{ filter: getIntensity('Biceps') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          <ellipse cx="78" cy="62" rx="5" ry="10" 
            fill={getColor(getIntensity('Biceps'))} 
            style={{ filter: getIntensity('Biceps') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          
          {/* Triceps (slightly behind biceps) */}
          <ellipse cx="24" cy="64" rx="4" ry="8" 
            fill={getColor(getIntensity('Triceps'))} 
            opacity="0.7"
          />
          <ellipse cx="76" cy="64" rx="4" ry="8" 
            fill={getColor(getIntensity('Triceps'))} 
            opacity="0.7"
          />
          
          {/* Forearms */}
          <ellipse cx="18" cy="82" rx="4" ry="10" 
            fill={getColor(getIntensity('Forearms'))} 
          />
          <ellipse cx="82" cy="82" rx="4" ry="10" 
            fill={getColor(getIntensity('Forearms'))} 
          />
          
          {/* Core/Abs */}
          <rect x="38" y="62" width="24" height="20" rx="4" 
            fill={getColor(getIntensity('Core'))} 
            style={{ filter: getIntensity('Core') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          
          {/* Back (shown as slight shadow) */}
          <rect x="40" y="45" width="20" height="35" rx="3" 
            fill={getColor(getIntensity('Back'))} 
            opacity="0.3"
          />
          
          {/* Glutes */}
          <ellipse cx="42" cy="90" rx="8" ry="6" 
            fill={getColor(getIntensity('Glutes'))} 
          />
          <ellipse cx="58" cy="90" rx="8" ry="6" 
            fill={getColor(getIntensity('Glutes'))} 
          />
          
          {/* Quadriceps */}
          <ellipse cx="40" cy="115" rx="8" ry="18" 
            fill={getColor(getIntensity('Quadriceps'))} 
            style={{ filter: getIntensity('Quadriceps') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          <ellipse cx="60" cy="115" rx="8" ry="18" 
            fill={getColor(getIntensity('Quadriceps'))} 
            style={{ filter: getIntensity('Quadriceps') > 0.5 ? 'url(#glow)' : 'none' }}
          />
          
          {/* Hamstrings (slightly behind quads) */}
          <ellipse cx="42" cy="118" rx="6" ry="14" 
            fill={getColor(getIntensity('Hamstrings'))} 
            opacity="0.5"
          />
          <ellipse cx="58" cy="118" rx="6" ry="14" 
            fill={getColor(getIntensity('Hamstrings'))} 
            opacity="0.5"
          />
          
          {/* Calves */}
          <ellipse cx="40" cy="150" rx="5" ry="12" 
            fill={getColor(getIntensity('Calves'))} 
          />
          <ellipse cx="60" cy="150" rx="5" ry="12" 
            fill={getColor(getIntensity('Calves'))} 
          />
          
          {/* Feet */}
          <ellipse cx="38" cy="170" rx="6" ry="4" fill="hsl(var(--muted))" />
          <ellipse cx="62" cy="170" rx="6" ry="4" fill="hsl(var(--muted))" />
          
          {/* Body outline */}
          <path 
            d="M50 4 C62 4 62 28 62 28 L70 38 L80 45 L82 75 L85 95 L16 95 L18 75 L20 45 L30 38 L38 28 C38 28 38 4 50 4"
            fill="none"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="0.5"
          />
        </svg>
        
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20 scanlines" />
      </div>

      {/* Stats callouts */}
      <div className="flex-1 space-y-4">
        {/* Strengths */}
        <div>
          <h4 className="font-display text-xs text-primary tracking-wider mb-2">▸ DOMINANT SECTORS</h4>
          {strengths.length > 0 ? (
            <div className="space-y-1">
              {strengths.map((stat, i) => (
                <motion.div
                  key={stat.muscle_group}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-secondary font-display">{stat.muscle_group.toUpperCase()}</span>
                  <span className="text-muted-foreground">
                    {stat.total_sets} sets • {stat.total_reps} reps
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No data yet. Complete missions to track.</p>
          )}
        </div>

        {/* Gaps / Weaknesses */}
        <div>
          <h4 className="font-display text-xs text-destructive tracking-wider mb-2">▸ VULNERABLE SECTORS</h4>
          {gaps.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {gaps.slice(0, 4).map((gap, i) => (
                <motion.span
                  key={gap}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="text-xs px-2 py-1 bg-destructive/10 border border-destructive/30 rounded text-destructive"
                >
                  {gap.toUpperCase()}
                </motion.span>
              ))}
            </div>
          ) : weakGroups.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {weakGroups.map((stat, i) => (
                <motion.span
                  key={stat.muscle_group}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="text-xs px-2 py-1 bg-warning/10 border border-warning/30 rounded text-warning"
                >
                  {stat.muscle_group.toUpperCase()} ({stat.total_sets})
                </motion.span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">All sectors operational.</p>
          )}
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span>HIGH</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-secondary/70" />
              <span>MED</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <span>LOW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyDiagram;
