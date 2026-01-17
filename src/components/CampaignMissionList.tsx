import { useState } from 'react';
import { Plus, Crosshair } from 'lucide-react';
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
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-section-missions/10">
              <Crosshair className="w-5 h-5 text-section-missions" />
            </div>
            <div>
              <p className="font-display text-sm text-foreground">NO MISSIONS ASSIGNED</p>
              <p className="text-xs text-muted-foreground">Add missions to build your campaign roster</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <Crosshair className="w-10 h-10 mx-auto mb-3 text-section-missions/30" />
          <p className="text-sm text-muted-foreground mb-4">
            {isOwner ? 'Select missions from the arsenal to add to this campaign.' : 'This campaign has no missions yet.'}
          </p>
          {isOwner && (
            <button
              onClick={onAddMission}
              className="px-4 py-2 bg-section-missions text-white font-display text-sm rounded hover:box-glow-missions transition-all flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" /> ADD MISSIONS
            </button>
          )}
        </div>
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
            // Only allow removal if owner AND not system/active
            onRemove={isOwner && !isSystem ? () => onRemoveMission({ id: mission.id, name: mission.code_name }) : undefined}
          />
        );
      })}
    </div>
  );
}
