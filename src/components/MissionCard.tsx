import { ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Play, CheckCircle2, Plus, ChevronUp, ChevronDown, Trash2, Dumbbell, Trophy, Target } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { PopularityBadge } from '@/components/SocialProof';
import { getPopularityTier } from '@/hooks/useMissionStats';
import { formatEquipment } from '@/data/muscleGroups';

interface MissionExercise {
  id: string;
  exercises?: {
    equipment?: string[];
  };
}

interface Mission extends Tables<'missions'> {
  mission_exercises?: MissionExercise[];
}

interface MissionCardProps {
  mission: Mission;
  index?: number;
  variant?: 'default' | 'picker' | 'campaign';
  isCompleted?: boolean;
  isAdded?: boolean;
  showOrder?: boolean;
  orderIndex?: number;
  totalItems?: number;
  /** Custom controls to render in the top-right corner */
  topRightSlot?: ReactNode;
  onAdd?: () => void;
  onRemove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onClick?: () => void;
}

export function MissionCard({
  mission,
  index = 0,
  variant = 'default',
  isCompleted = false,
  isAdded = false,
  showOrder = false,
  orderIndex = 0,
  totalItems = 0,
  topRightSlot,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
  onClick,
}: MissionCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (variant === 'picker') {
      // In picker mode, clicking adds the mission
      if (!isAdded && onAdd) onAdd();
    } else {
      navigate(`/mission/${mission.id}${window.location.pathname.includes('/campaign/') ? `?campaignId=${window.location.pathname.split('/campaign/')[1]}` : ''}`);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-400';
    if (difficulty <= 4) return 'text-yellow-400';
    if (difficulty <= 6) return 'text-orange-400';
    return 'text-red-400';
  };

  // Extract unique equipment from all exercises
  const uniqueEquipment = useMemo(() => {
    const equipmentSet = new Set<string>();
    mission.mission_exercises?.forEach(me => {
      me.exercises?.equipment?.forEach(eq => equipmentSet.add(eq));
    });
    return Array.from(equipmentSet).slice(0, 4); // Limit to 4 for display
  }, [mission.mission_exercises]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={handleClick}
      className={`group w-full bg-card border rounded-lg p-4 text-left transition-all relative overflow-hidden cursor-pointer ${
        isCompleted ? 'border-secondary/50' : 
        isAdded ? 'border-secondary/50 opacity-70' : 
        'border-border hover:border-primary'
      }`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Custom top-right slot for page-specific controls */}
      {topRightSlot && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          {topRightSlot}
        </div>
      )}
      
      <div className="relative z-10 flex gap-3">
        {/* Reorder Controls (for campaign variant) */}
        {showOrder && (
          <div className="flex flex-col justify-center gap-0.5 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              disabled={orderIndex === 0}
              className="p-1 hover:bg-primary/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronUp className="w-4 h-4 text-primary" />
            </button>
            <span className="text-[10px] text-muted-foreground text-center font-display">
              #{orderIndex + 1}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              disabled={orderIndex >= totalItems - 1}
              className="p-1 hover:bg-primary/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronDown className="w-4 h-4 text-primary" />
            </button>
          </div>
        )}

        {/* Mission icon */}
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          isCompleted 
            ? variant === 'campaign' 
              ? 'bg-yellow-400/20' 
              : 'bg-secondary/20'
            : 'bg-primary/10 group-hover:bg-primary/20'
        }`}>
          {isCompleted ? (
            variant === 'campaign' ? (
              <Trophy className="w-5 h-5 text-yellow-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-secondary" />
            )
          ) : (
            <Target className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header row - add padding-right when topRightSlot is present */}
          <div className={`flex items-start justify-between gap-2 mb-2 ${topRightSlot ? 'pr-20' : ''}`}>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg text-primary group-hover:text-glow-primary transition-all">
                {mission.code_name}
              </h3>
              {mission.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{mission.description}</p>
              )}
            </div>
            
            {/* Right side badges - only show when no topRightSlot */}
            {!topRightSlot && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Popularity badge for public missions */}
                {mission.is_public && (mission.popularity_score || 0) > 0 && 
                  getPopularityTier(mission.popularity_score || 0) && (
                  <PopularityBadge score={mission.popularity_score || 0} />
                )}
                
                {/* Difficulty badge */}
                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                  <Zap className={`w-3 h-3 ${getDifficultyColor(mission.difficulty)}`} />
                  <span className={`text-xs font-display ${getDifficultyColor(mission.difficulty)}`}>
                    {mission.difficulty}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Meta row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              {mission.focus_areas?.slice(0, 3).map((area) => (
                <span 
                  key={area}
                  className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground"
                >
                  {area}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Clock className="w-3 h-3" />
              <span>{mission.estimated_minutes}m</span>
              {mission.mission_exercises && (
                <span className="ml-1">• {mission.mission_exercises.length} ex</span>
              )}
            </div>
          </div>

          {/* Equipment row */}
          {uniqueEquipment.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Dumbbell className="w-3 h-3 text-accent flex-shrink-0" />
              <div className="flex gap-1.5 flex-wrap">
                {uniqueEquipment.map((eq) => (
                  <span 
                    key={eq}
                    className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded"
                  >
                    {formatEquipment(eq)}
                  </span>
                ))}
                {(mission.mission_exercises?.length || 0) > 0 && 
                  Array.from(new Set(mission.mission_exercises?.flatMap(me => me.exercises?.equipment || []))).length > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{Array.from(new Set(mission.mission_exercises?.flatMap(me => me.exercises?.equipment || []))).length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Difficulty bar */}
          <div className="flex gap-1 mt-3">
            {[...Array(5)].map((_, j) => (
              <div 
                key={j}
                className={`h-1 flex-1 rounded-full transition-all ${
                  j < mission.difficulty 
                    ? 'bg-gradient-to-r from-accent to-primary' 
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action button */}
        {variant === 'picker' && (
          <div className="flex items-center flex-shrink-0 ml-2">
            {isAdded ? (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/20 text-secondary">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onAdd?.(); }}
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {variant === 'campaign' && (
          <div className="flex flex-col items-center gap-2 flex-shrink-0 ml-2">
            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="p-2 hover:bg-destructive/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/workout/${mission.id}${window.location.pathname.includes('/campaign/') ? `?campaignId=${window.location.pathname.split('/campaign/')[1]}` : ''}`); }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-display transition-colors ${
                isCompleted 
                  ? 'bg-secondary/20 text-secondary hover:bg-secondary/30'
                  : 'bg-accent/20 text-accent hover:bg-accent/30'
              }`}
            >
              <Play className="w-3 h-3" />
              {isCompleted ? 'REPLAY' : 'DEPLOY'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
