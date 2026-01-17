import { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { MissionCard } from '@/components/MissionCard';
import { useReorderMissions } from '@/hooks/useCollections';
import { toast } from '@/hooks/use-toast';

interface Mission extends Tables<'missions'> {
  mission_exercises?: { id: string }[];
}

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
  const reorderMissions = useReorderMissions();
  const [orderedIds, setOrderedIds] = useState(missionIds);

  const missionMap = new Map(missions.filter(m => m).map(m => [m!.id, m!]));

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

  return (
    <div className="space-y-3">
      {orderedIds.map((missionId, index) => {
        const mission = missionMap.get(missionId);
        if (!mission) return null;
        
        return (
          <MissionCard
            key={mission.id}
            mission={mission}
            index={index}
            variant="campaign"
            isCompleted={completedMissionIds.has(mission.id)}
            showOrder={isOwner && !isSystem}
            orderIndex={index}
            totalItems={orderedIds.length}
            onMoveUp={() => moveMission(index, 'up')}
            onMoveDown={() => moveMission(index, 'down')}
            onRemove={() => onRemoveMission({ id: mission.id, name: mission.code_name })}
          />
        );
      })}
    </div>
  );
}
