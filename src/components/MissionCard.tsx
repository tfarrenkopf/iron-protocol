import { ReactNode, useMemo, memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Play, CheckCircle2, Plus, ChevronUp, ChevronDown, Trash2, Dumbbell, Trophy, Crosshair, Target } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { PopularityBadge } from '@/components/SocialProof';
import { getPopularityTier } from '@/hooks/useMissionStats';
import { formatEquipment } from '@/data/muscleGroups';

interface ExerciseInfo {
  id: string;
  name?: string;
  equipment?: string[];
  primary_muscle_group?: string;
}

interface MissionExercise {
  id: string;
  target_sets?: number;
  target_reps?: number;
  exercises?: ExerciseInfo;
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

export const MissionCard = memo(function MissionCard({
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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (variant === 'picker') {
      // In picker mode, clicking adds the mission
      if (!isAdded && onAdd) onAdd();
    } else {
      // Default: navigate to mission details
      navigate(`/mission/${mission.id}${window.location.pathname.includes('/campaign/') ? `?campaignId=${window.location.pathname.split('/campaign/')[1]}` : ''}`);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
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

  // Extract exercise details for expanded view
  const exerciseDetails = useMemo(() => {
    return mission.mission_exercises?.map(me => ({
      name: me.exercises?.name || 'Unknown Exercise',
      sets: me.target_sets || 0,
      reps: me.target_reps || 0,
      muscle: me.exercises?.primary_muscle_group,
    })) || [];
  }, [mission.mission_exercises]);

  // Exercise count with proper pluralization
  const exerciseCount = mission.mission_exercises?.length || 0;
  const exerciseLabel = exerciseCount === 1 ? 'exercise' : 'exercises';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group w-full bg-card border rounded-lg overflow-hidden text-left transition-all relative ${
        isCompleted ? 'border-secondary/50' : 
        isAdded ? 'border-secondary/50 opacity-70' : 
        'border-border hover:border-primary'
      }`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Main clickable area - navigates to details */}
      <div 
        className="relative z-10 p-3 sm:p-4 cursor-pointer active:scale-[0.99] transition-transform"
        onClick={handleCardClick}
      >
        {/* Custom top-right slot for page-specific controls */}
        {topRightSlot && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
            {topRightSlot}
          </div>
        )}
        
        <div className="flex gap-3">
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
              <span className="text-xs text-muted-foreground text-center font-display">
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
              : 'bg-section-missions/10 group-hover:bg-section-missions/20'
          }`}>
            {isCompleted ? (
              variant === 'campaign' ? (
                <Trophy className="w-5 h-5 text-yellow-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-secondary" />
              )
            ) : (
              <Crosshair className="w-5 h-5 text-section-missions" />
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
                    className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground uppercase"
                  >
                    {area}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="w-3 h-3" />
                <span>{mission.estimated_minutes}m</span>
                {exerciseCount > 0 && (
                  <span className="ml-1">• {exerciseCount} {exerciseLabel}</span>
                )}
              </div>
            </div>

            {/* Equipment row */}
            {uniqueEquipment.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Dumbbell className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <div className="flex gap-1.5 flex-wrap">
                  {uniqueEquipment.map((eq) => (
                    <span 
                      key={eq}
                      className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
                    >
                      {formatEquipment(eq)}
                    </span>
                  ))}
                  {(mission.mission_exercises?.length || 0) > 0 && 
                    Array.from(new Set(mission.mission_exercises?.flatMap(me => me.exercises?.equipment || []))).length > 4 && (
                    <span className="text-xs text-muted-foreground">
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

            {/* Expand toggle button - separate from card click */}
            {variant === 'default' && exerciseDetails.length > 0 && (
              <button
                onClick={handleExpandClick}
                className="flex items-center justify-center gap-1 mt-3 py-2 w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>HIDE EXERCISES</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>VIEW EXERCISES</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Action button - larger touch target for mobile */}
          {variant === 'picker' && (
            <div className="flex items-center flex-shrink-0 ml-2">
              {isAdded ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center bg-secondary/20 text-secondary
                             hover:bg-destructive/20 hover:text-destructive active:scale-95 transition-all min-w-[48px] min-h-[48px]"
                  aria-label="Remove mission from campaign"
                >
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onAdd?.(); }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center bg-section-missions text-white 
                             hover:box-glow-missions active:scale-95 transition-all min-w-[48px] min-h-[48px]"
                  aria-label="Add mission to campaign"
                >
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
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
      </div>
      
      {/* Expandable Exercise Details - for default variant */}
      <AnimatePresence>
        {isExpanded && variant === 'default' && exerciseDetails.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20 space-y-3">
              {/* Exercise List */}
              <div className="space-y-2">
                <h4 className="text-xs font-display text-muted-foreground">// EXERCISE ROSTER</h4>
                {exerciseDetails.map((exercise, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-2 bg-card/50 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-section-exercises/20 text-section-exercises text-xs font-display">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display text-section-exercises truncate">{exercise.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {exercise.sets} sets × {exercise.reps} reps
                        </span>
                        {exercise.muscle && (
                          <span className="uppercase">{exercise.muscle}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Deploy Button */}
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  navigate(`/mission/${mission.id}`);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-display text-sm bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all min-h-[48px]"
              >
                <Play className="w-4 h-4" />
                VIEW MISSION DETAILS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
