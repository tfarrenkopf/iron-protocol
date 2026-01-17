import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Flame, Clock, Dumbbell, Target, Zap, Play, Pencil, Trash2, CheckCircle2, Crown } from 'lucide-react';
import { CollectionWithMissions } from '@/hooks/useCollections';
import { StartCampaignButton } from '@/components/ActiveCampaignHero';
import { useActiveCampaignDetails } from '@/hooks/useActiveCampaign';
import { formatEquipment } from '@/data/muscleGroups';

interface CampaignCardProps {
  collection: CollectionWithMissions;
  index?: number;
  isActive?: boolean;
  isSystem?: boolean;
  isOwner?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function CampaignCard({ 
  collection, 
  index = 0, 
  isActive = false,
  isSystem = false, 
  isOwner = false, 
  onEdit, 
  onDelete 
}: CampaignCardProps) {
  const navigate = useNavigate();
  const missionCount = collection.collection_missions?.length || 0;
  
  // Get active campaign progress if this is the active campaign
  const { completedMissionIds, isLoading } = useActiveCampaignDetails();
  const completedCount = isActive ? completedMissionIds.size : 0;
  const isComplete = isActive && completedCount >= missionCount && missionCount > 0;
  
  // Calculate campaign stats
  const stats = useMemo(() => {
    const missions = collection.collection_missions?.map(cm => (cm as any).missions) || [];
    const totalTime = missions.reduce((sum: number, m: any) => sum + (m?.estimated_minutes || 0), 0);
    const avgDifficulty = missions.length > 0 
      ? Math.round(missions.reduce((sum: number, m: any) => sum + (m?.difficulty || 0), 0) / missions.length)
      : 0;
    
    // Get unique equipment
    const equipmentSet = new Set<string>();
    missions.forEach((m: any) => {
      m?.mission_exercises?.forEach((me: any) => {
        me.exercises?.equipment?.forEach((eq: string) => equipmentSet.add(eq));
      });
    });
    
    // Get unique focus areas
    const focusSet = new Set<string>();
    missions.forEach((m: any) => {
      m?.focus_areas?.forEach((f: string) => focusSet.add(f));
    });
    
    return {
      totalTime,
      avgDifficulty,
      equipment: Array.from(equipmentSet).slice(0, 4),
      focusAreas: Array.from(focusSet).slice(0, 3),
      hasMoreEquipment: equipmentSet.size > 4
    };
  }, [collection.collection_missions]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => navigate(`/campaign/${collection.id}`)}
      className={`group bg-card border-2 rounded-lg p-4 cursor-pointer transition-all relative overflow-hidden ${
        isActive 
          ? 'border-accent bg-gradient-to-br from-card via-card to-accent/10 hover:box-glow-accent' 
          : 'border-border hover:border-primary'
      }`}
    >
      {/* Active campaign glow */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 animate-pulse" />
      )}
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Energetic icon */}
            <div className={`p-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-accent/20' 
                : isSystem 
                  ? 'bg-secondary/20' 
                  : 'bg-primary/20 group-hover:bg-primary/30'
            }`}>
              {isActive ? (
                <Flame className="w-6 h-6 text-accent animate-pulse" />
              ) : isSystem ? (
                <Crown className="w-6 h-6 text-secondary" />
              ) : (
                <Target className="w-6 h-6 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-display text-lg ${
                  isActive ? 'text-accent' : 'text-primary'
                }`}>
                  {collection.code_name}
                </h3>
                {isSystem && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-secondary/20 text-secondary rounded font-display">
                    OFFICIAL
                  </span>
                )}
                {isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded font-display animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>
              {collection.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{collection.description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isOwner && !isSystem && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit?.(collection.id); }}
                  className="p-1.5 hover:bg-secondary/20 rounded transition-colors"
                  title="Edit campaign"
                >
                  <Pencil className="w-3.5 h-3.5 text-secondary" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete?.(collection.id, collection.code_name); }}
                  className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
                  title="Delete campaign"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            )}
            <StartCampaignButton campaignId={collection.id} size="small" />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {missionCount} mission{missionCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~{stats.totalTime}min
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Avg {stats.avgDifficulty}/5
          </span>
        </div>

        {/* Focus areas */}
        {stats.focusAreas.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-2">
            {stats.focusAreas.map(area => (
              <span key={area} className="text-[10px] px-2 py-0.5 bg-muted rounded text-muted-foreground">
                {area}
              </span>
            ))}
          </div>
        )}

        {/* Equipment */}
        {stats.equipment.length > 0 && (
          <div className="flex items-center gap-2">
            <Dumbbell className="w-3 h-3 text-accent flex-shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {stats.equipment.map(eq => (
                <span key={eq} className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                  {formatEquipment(eq)}
                </span>
              ))}
              {stats.hasMoreEquipment && (
                <span className="text-[10px] text-muted-foreground">+more</span>
              )}
            </div>
          </div>
        )}

        {/* Progress bar for active campaign */}
        {isActive && !isLoading && (
          <div className="mt-3 pt-3 border-t border-accent/20">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-accent flex items-center gap-1">
                {isComplete ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    CAMPAIGN COMPLETE
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    {completedCount}/{missionCount} COMPLETE
                  </>
                )}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all"
                style={{ width: `${missionCount > 0 ? (completedCount / missionCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
