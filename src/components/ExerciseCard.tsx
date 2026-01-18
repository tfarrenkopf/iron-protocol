import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Pencil, Trash2, Dumbbell, Target, Plus, Check, Loader2, X } from 'lucide-react';
import { Exercise } from '@/hooks/useExercises';
import { useMissions, useAddExerciseToMission, useRemoveExerciseFromMission } from '@/hooks/useMissions';
import { useAuth } from '@/hooks/useAuth';
import { formatEquipment } from '@/data/muscleGroups';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Lore phrases for adding exercises
const ADD_LORE_PHRASES = [
  "WEAPON LOADED. MISSION UPGRADED.",
  "NEW TOOL IN THE ARSENAL. ENEMIES BEWARE.",
  "EXERCISE DEPLOYED. TARGET ACQUIRED.",
  "PAYLOAD DELIVERED. MUSCLE INCOMING.",
  "COMBAT PROTOCOL UPDATED.",
  "ASSET INTEGRATED. READY FOR ACTION.",
  "INFILTRATION SUCCESSFUL.",
  "UPGRADE COMPLETE. POWER RISING.",
];

// Lore phrases for removing exercises
const REMOVE_LORE_PHRASES = [
  "WEAPON DISCHARGED. LOADOUT REFINED.",
  "ASSET REMOVED. STRATEGY OPTIMIZED.",
  "EXERCISE PURGED. MISSION STREAMLINED.",
  "COMBAT PROTOCOL ADJUSTED.",
  "PAYLOAD JETTISONED. MOVING LEAN.",
];

interface ExerciseCardProps {
  exercise: Exercise;
  index?: number;
  isOwner?: boolean;
  onEdit?: (exerciseId: string) => void;
  onDelete?: (exerciseId: string, name: string) => void;
}

export const ExerciseCard = memo(function ExerciseCard({ 
  exercise, 
  index = 0, 
  isOwner = false,
  onEdit,
  onDelete,
}: ExerciseCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [processingMission, setProcessingMission] = useState<string | null>(null);
  
  // Fetch user's missions for "add to mission" functionality
  const { data: missions } = useMissions({});
  const addExerciseToMission = useAddExerciseToMission();
  const removeExerciseFromMission = useRemoveExerciseFromMission();
  const myMissions = missions?.filter(m => m.created_by === user?.id) || [];

  // Check which missions already have this exercise
  const missionHasExercise = (missionId: string) => {
    const mission = myMissions.find(m => m.id === missionId);
    return mission?.mission_exercises?.some(me => me.exercise_id === exercise.id) || false;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteWarning(true);
  };

  const confirmDelete = () => {
    onDelete?.(exercise.id, exercise.name);
    setShowDeleteWarning(false);
  };

  const handleToggleMission = async (e: React.MouseEvent, mission: { id: string; code_name: string }) => {
    e.stopPropagation();
    
    setProcessingMission(mission.id);
    
    try {
      const hasExercise = missionHasExercise(mission.id);
      
      if (hasExercise) {
        // Remove exercise from mission
        await removeExerciseFromMission.mutateAsync({
          missionId: mission.id,
          exerciseId: exercise.id,
        });
        
        const lorePhrase = REMOVE_LORE_PHRASES[Math.floor(Math.random() * REMOVE_LORE_PHRASES.length)];
        toast.success(lorePhrase, {
          description: `${exercise.name} removed from ${mission.code_name}`,
        });
      } else {
        // Add exercise to mission
        await addExerciseToMission.mutateAsync({
          missionId: mission.id,
          exerciseId: exercise.id,
        });
        
        const lorePhrase = ADD_LORE_PHRASES[Math.floor(Math.random() * ADD_LORE_PHRASES.length)];
        toast.success(lorePhrase, {
          description: `${exercise.name} added to ${mission.code_name}`,
        });
      }
    } catch (error: any) {
      toast.error('DEPLOYMENT FAILED', {
        description: error.message || 'Could not update mission',
      });
    } finally {
      setProcessingMission(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
      >
        {/* Header - always visible */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 p-3 cursor-pointer"
        >
          <div className="p-2 bg-primary/10 rounded-lg">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-primary truncate">{exercise.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{exercise.primary_muscle_group}</span>
              {exercise.equipment && exercise.equipment.length > 0 && (
                <>
                  <span>•</span>
                  <span>{exercise.equipment.slice(0, 2).map(e => formatEquipment(e)).join(', ')}</span>
                  {exercise.equipment.length > 2 && <span className="text-muted-foreground/60">+{exercise.equipment.length - 2}</span>}
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {/* Add to mission button */}
            {user && myMissions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 bg-secondary/20 text-secondary rounded hover:bg-secondary/30 transition-colors"
                    title="Add to mission"
                  >
                    <Target className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-card border-border w-56 max-h-64 overflow-y-auto"
                >
                  <div className="px-2 py-1.5 text-xs text-muted-foreground font-display">MANAGE MISSIONS</div>
                  <DropdownMenuSeparator />
                  {myMissions.map(mission => {
                    const hasExercise = missionHasExercise(mission.id);
                    const isProcessing = processingMission === mission.id;
                    return (
                      <DropdownMenuItem
                        key={mission.id}
                        onClick={(e) => !isProcessing && handleToggleMission(e, mission)}
                        className={`flex items-center gap-2 cursor-pointer ${isProcessing ? 'opacity-50' : ''}`}
                        disabled={isProcessing}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          hasExercise 
                            ? 'bg-secondary border-secondary text-secondary-foreground' 
                            : 'border-border'
                        }`}>
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : hasExercise ? (
                            <Check className="w-3 h-3" />
                          ) : null}
                        </div>
                        <span className="text-sm truncate flex-1">{mission.code_name}</span>
                        {hasExercise && !isProcessing && (
                          <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/command?tab=missions&source=personal&newMission=true')}
                    className="flex items-center gap-2 text-primary cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Create New Mission</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Edit button - only for owner */}
            {isOwner && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(exercise.id); }}
                className="p-2 bg-secondary/20 text-secondary rounded hover:bg-secondary/30 transition-colors"
                title="Edit exercise"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            
            {/* Delete button - only for owner */}
            {isOwner && (
              <button
                onClick={handleDeleteClick}
                className="p-2 bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
                title="Delete exercise"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            {/* Expand/collapse toggle */}
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-3 space-y-3 bg-muted/20">
                {/* Description */}
                {exercise.description && (
                  <div>
                    <span className="text-xs text-muted-foreground font-display">DESCRIPTION</span>
                    <p className="text-sm mt-1">{exercise.description}</p>
                  </div>
                )}

                {/* Equipment */}
                {exercise.equipment && exercise.equipment.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground font-display">EQUIPMENT</span>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {exercise.equipment.map(eq => (
                        <span key={eq} className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                          {formatEquipment(eq)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Muscle groups */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground font-display">PRIMARY</span>
                    <p className="text-sm text-primary mt-0.5">{exercise.primary_muscle_group}</p>
                  </div>
                  {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground font-display">SECONDARY</span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {exercise.secondary_muscle_groups.join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Focus areas */}
                {exercise.focus_areas && exercise.focus_areas.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground font-display">FOCUS AREAS</span>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {exercise.focus_areas.map(area => (
                        <span key={area} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {(exercise.instructions_setup || exercise.instructions_execution || exercise.instructions_tips) && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    {exercise.instructions_setup && (
                      <div>
                        <span className="text-xs text-muted-foreground font-display">SETUP</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{exercise.instructions_setup}</p>
                      </div>
                    )}
                    {exercise.instructions_execution && (
                      <div>
                        <span className="text-xs text-muted-foreground font-display">EXECUTION</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{exercise.instructions_execution}</p>
                      </div>
                    )}
                    {exercise.instructions_tips && (
                      <div>
                        <span className="text-xs text-muted-foreground font-display">TIPS</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{exercise.instructions_tips}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Delete Warning Dialog */}
      <AlertDialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              DELETE EXERCISE
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete <strong className="text-primary">"{exercise.name}"</strong>?</p>
              <p className="text-destructive/80 text-sm">⚠️ This will remove it from ALL missions that use it. This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Exercise
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});