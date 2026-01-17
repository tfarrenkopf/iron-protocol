import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Play, Trash2, GripVertical, CheckCircle2, 
  ChevronUp, ChevronDown, Plus, Zap 
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useReorderMissions } from '@/hooks/useCollections';
import { toast } from '@/hooks/use-toast';

interface Mission extends Tables<'missions'> {}

interface CampaignMissionListProps {
  collectionId: string;
  missions: (Mission | null)[];
  missionIds: string[];
  completedMissionIds: Set<string>;
  isOwner: boolean;
  isSystem: boolean;
  onRemoveMission: (mission: { id: string; name: string }) => void;
  onAddMission: () => void;
}

export function CampaignMissionList({
  collectionId,
  missions,
  missionIds,
  completedMissionIds,
  isOwner,
  isSystem,
  onRemoveMission,
  onAddMission,
}: CampaignMissionListProps) {
  const navigate = useNavigate();
  const reorderMissions = useReorderMissions();
  const [orderedIds, setOrderedIds] = useState(missionIds);
  const [isReordering, setIsReordering] = useState(false);

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return { label: 'EASY', color: 'text-green-400' };
    if (difficulty <= 4) return { label: 'MEDIUM', color: 'text-yellow-400' };
    if (difficulty <= 6) return { label: 'HARD', color: 'text-orange-400' };
    return { label: 'EXTREME', color: 'text-red-400' };
  };

  const missionMap = new Map(missions.filter(m => m).map(m => [m!.id, m!]));

  const handleReorder = async (newOrder: string[]) => {
    setOrderedIds(newOrder);
  };

  const handleReorderEnd = async () => {
    if (JSON.stringify(orderedIds) !== JSON.stringify(missionIds)) {
      try {
        await reorderMissions.mutateAsync({ collectionId, missionIds: orderedIds });
        toast({ title: 'Order updated', description: 'Mission order saved' });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        setOrderedIds(missionIds); // Revert
      }
    }
  };

  const moveMission = async (index: number, direction: 'up' | 'down') => {
    const newOrder = [...orderedIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setOrderedIds(newOrder);
    
    try {
      await reorderMissions.mutateAsync({ collectionId, missionIds: newOrder });
      toast({ title: 'Order updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setOrderedIds(missionIds);
    }
  };

  if (missions.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <Zap className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground mb-3">No missions in this campaign yet</p>
        {isOwner && (
          <button
            onClick={onAddMission}
            className="text-xs text-primary hover:underline font-display flex items-center gap-1 mx-auto"
          >
            <Plus className="w-3 h-3" /> ADD MISSIONS
          </button>
        )}
      </div>
    );
  }

  // Use simple list with arrow controls for better mobile UX
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {orderedIds.map((missionId, index) => {
          const mission = missionMap.get(missionId);
          if (!mission) return null;
          
          const difficulty = getDifficultyLabel(mission.difficulty);
          const isCompleted = completedMissionIds.has(mission.id);
          
          return (
            <motion.div
              key={mission.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: 0.02 * index }}
              className={`group bg-card border rounded-lg p-4 transition-all relative overflow-hidden ${
                isCompleted ? 'border-secondary/50' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-3 relative z-10">
                {/* Reorder Controls */}
                {isOwner && !isSystem && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveMission(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-primary/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-3 h-3 text-primary" />
                    </button>
                    <button
                      onClick={() => moveMission(index, 'down')}
                      disabled={index === orderedIds.length - 1}
                      className="p-1 hover:bg-primary/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-3 h-3 text-primary" />
                    </button>
                  </div>
                )}

                {/* Completion indicator */}
                {isCompleted && (
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                  </div>
                )}
                
                {/* Mission Info */}
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/mission/${mission.id}`)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-display">
                          #{index + 1}
                        </span>
                        <h3 className="font-display text-base text-primary">{mission.code_name}</h3>
                      </div>
                      {mission.name !== mission.code_name && (
                        <p className="text-xs text-muted-foreground">{mission.name}</p>
                      )}
                    </div>
                    
                    <span className={`text-[10px] font-display ${difficulty.color}`}>
                      {difficulty.label}
                    </span>
                  </div>
                  
                  {mission.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{mission.description}</p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {mission.estimated_minutes} min
                    </span>
                    {mission.focus_areas && mission.focus_areas.length > 0 && (
                      <span className="text-primary/70">
                        {mission.focus_areas.slice(0, 2).join(' • ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isOwner && !isSystem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMission({ id: mission.id, name: mission.code_name });
                      }}
                      className="p-2 hover:bg-destructive/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from campaign"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workout/${mission.id}`);
                    }}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-display transition-colors ${
                      isCompleted 
                        ? 'bg-secondary/20 text-secondary hover:bg-secondary/30'
                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    {isCompleted ? 'REPLAY' : 'START'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
