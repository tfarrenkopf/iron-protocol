import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Flame, Clock, Dumbbell, Target, Zap, Play, Pencil, Trash2, CheckCircle2, Crown, Users, Swords } from 'lucide-react';
import { CollectionWithMissions } from '@/hooks/useCollections';
import { StartCampaignButton } from '@/components/ActiveCampaignHero';
import { useActiveCampaignDetails } from '@/hooks/useActiveCampaign';
import { formatEquipment } from '@/data/muscleGroups';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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
  
  // Fetch FOMO stats - last completion time and total completions
  const { data: fomoStats } = useQuery({
    queryKey: ['campaign-fomo', collection.id],
    queryFn: async () => {
      // Get last completion
      const { data: lastCompletion } = await supabase
        .from('campaign_completions')
        .select('completed_at')
        .eq('campaign_id', collection.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      
      // Get total completions count
      const { count } = await supabase
        .from('campaign_completions')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', collection.id);
      
      return {
        lastCompletedAt: lastCompletion?.completed_at,
        totalCompletions: count || 0
      };
    },
    staleTime: 60000, // Cache for 1 minute
  });
  
  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };
  
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
      equipment: Array.from(equipmentSet),
      focusAreas: Array.from(focusSet).slice(0, 3),
      hasMoreEquipment: equipmentSet.size > 5
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
            <div className={`p-2.5 rounded-lg transition-colors ${
              isActive 
                ? 'bg-accent/20' 
                : isSystem 
                  ? 'bg-secondary/20' 
                  : 'bg-primary/20 group-hover:bg-primary/30'
            }`}>
              {isActive ? (
                <Flame className="w-7 h-7 text-accent animate-pulse" />
              ) : isSystem ? (
                <Crown className="w-7 h-7 text-secondary" />
              ) : (
                <Swords className="w-7 h-7 text-primary" />
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
                {isOwner && !isSystem && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded font-display">
                    YOURS
                  </span>
                )}
              </div>
              {collection.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{collection.description}</p>
              )}
            </div>
          </div>

          {/* Owner Actions - always visible for owners */}
          {isOwner && !isSystem && (
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(collection.id); }}
                className="p-2 bg-secondary/20 text-secondary rounded hover:bg-secondary/30 transition-colors"
                title="Edit campaign"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(collection.id, collection.code_name); }}
                className="p-2 bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
                title="Delete campaign"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
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
            {stats.avgDifficulty}/5
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

        {/* Equipment - expanded view */}
        {stats.equipment.length > 0 && (
          <div className="flex items-start gap-2 mb-3">
            <Dumbbell className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
            <div className="flex gap-1.5 flex-wrap">
              {stats.equipment.slice(0, 5).map(eq => (
                <span key={eq} className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                  {formatEquipment(eq)}
                </span>
              ))}
              {stats.hasMoreEquipment && (
                <span className="text-[10px] text-muted-foreground">+{stats.equipment.length - 5} more</span>
              )}
            </div>
          </div>
        )}

        {/* FOMO Stats */}
        {fomoStats && (fomoStats.totalCompletions > 0 || fomoStats.lastCompletedAt) && (
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground/80 mb-3 py-2 px-3 bg-muted/30 rounded-lg">
            {fomoStats.totalCompletions > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-secondary" />
                <span className="text-secondary">{fomoStats.totalCompletions}</span> completions
              </span>
            )}
            {fomoStats.lastCompletedAt && (
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-accent" />
                Last run <span className="text-accent">{formatTimeAgo(fomoStats.lastCompletedAt)}</span>
              </span>
            )}
          </div>
        )}

        {/* Large Start Button */}
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <StartCampaignButton campaignId={collection.id} size="large" />
        </div>

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
            <div className="h-2 bg-muted rounded-full overflow-hidden">
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