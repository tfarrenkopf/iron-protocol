import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Flame, Clock, Dumbbell, Zap, Play, Pencil, Trash2, CheckCircle2, Crown, Users, Swords, ChevronDown, ChevronUp, AlertTriangle, Crosshair, Skull } from 'lucide-react';
import { CollectionWithMissions } from '@/hooks/useCollections';
import { useActiveCampaign, useActiveCampaignDetails } from '@/hooks/useActiveCampaign';
import { useAuth } from '@/hooks/useAuth';
import { formatEquipment } from '@/data/muscleGroups';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { activeCampaignId, setActiveCampaign, isSettingActive } = useActiveCampaign();
  const missionCount = collection.collection_missions?.length || 0;
  
  // Get active campaign progress if this is the active campaign
  const { completedMissionIds, isLoading } = useActiveCampaignDetails();
  const completedCount = isActive ? completedMissionIds.size : 0;
  const isComplete = isActive && completedCount >= missionCount && missionCount > 0;
  
  const hasOtherActive = activeCampaignId && activeCampaignId !== collection.id;
  
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
  
  // Get missions with their details
  const missions = useMemo(() => {
    return collection.collection_missions
      ?.sort((a, b) => a.order_index - b.order_index)
      .map(cm => (cm as any).missions)
      .filter(Boolean) || [];
  }, [collection.collection_missions]);
  
  // Calculate campaign stats
  const stats = useMemo(() => {
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
  }, [missions]);

  const handleActivateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    if (isActive) {
      // Already active - go to campaign detail page
      navigate(`/campaign/${collection.id}`);
      return;
    }
    
    // Show confirmation dialog
    setShowActivateDialog(true);
  };

  const confirmActivate = () => {
    setActiveCampaign(collection.id);
    setShowActivateDialog(false);
    toast.success('CAMPAIGN ACTIVATED', {
      description: 'Prepare for deployment, soldier.',
    });
    // Navigate to campaign detail page
    navigate(`/campaign/${collection.id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className={`group bg-card border-2 rounded-lg overflow-hidden transition-all relative ${
          isActive 
            ? 'border-accent bg-gradient-to-br from-card via-card to-accent/10 hover:box-glow-accent' 
            : 'border-border hover:border-section-campaigns'
        }`}
      >
        {/* Active campaign glow */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 animate-pulse" />
        )}
        
        {/* Main content area - NOT clickable for navigation, toggle expansion */}
        <div 
          className="relative z-10 p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {/* Energetic icon */}
              <div className={`p-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-accent/20' 
                  : 'bg-section-campaigns/10 group-hover:bg-section-campaigns/20'
              }`}>
                <Flame className={`w-7 h-7 ${isActive ? 'text-accent animate-pulse' : 'text-section-campaigns'}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-display text-lg ${
                    isActive ? 'text-accent' : 'text-section-campaigns'
                  }`}>
                    {collection.code_name}
                  </h3>
                  {isSystem && (
                    <span className="text-xs px-1.5 py-0.5 bg-secondary/20 text-secondary rounded font-display">
                      OFFICIAL
                    </span>
                  )}
                  {isActive && (
                    <span className="text-xs px-1.5 py-0.5 bg-accent/20 text-accent rounded font-display animate-pulse">
                      ACTIVE
                    </span>
                  )}
                  {isOwner && !isSystem && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded font-display">
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
              <Crosshair className="w-3 h-3 text-section-missions" />
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
                <span key={area} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                  {area}
                </span>
              ))}
            </div>
          )}

          {/* Equipment - compact view */}
          {stats.equipment.length > 0 && (
            <div className="flex items-start gap-2 mb-3">
              <Dumbbell className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex gap-1.5 flex-wrap">
                {stats.equipment.slice(0, 5).map(eq => (
                  <span key={eq} className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                    {formatEquipment(eq)}
                  </span>
                ))}
                {stats.hasMoreEquipment && (
                  <span className="text-xs text-muted-foreground">+{stats.equipment.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {/* FOMO Stats */}
          {fomoStats && (fomoStats.totalCompletions > 0 || fomoStats.lastCompletedAt) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground/80 mb-3 py-2 px-3 bg-muted/30 rounded-lg">
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

          {/* Action Button - Simplified: just SELECT CAMPAIGN */}
          <div className="mt-3">
            <button
              onClick={handleActivateClick}
              disabled={isSettingActive}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-display text-sm transition-colors disabled:opacity-50 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isSettingActive ? (
                'LOADING...'
              ) : isActive ? (
                <>
                  <Flame className="w-4 h-4" />
                  VIEW CAMPAIGN
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  SELECT CAMPAIGN
                </>
              )}
            </button>
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
          
          {/* Expand indicator */}
          <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                <span>VIEW MISSIONS</span>
              </>
            )}
          </div>
        </div>
        
        {/* Expandable Mission Details */}
        <AnimatePresence>
          {isExpanded && missions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-2 border-t border-border bg-muted/20 space-y-3">
                {/* Mission List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-display text-muted-foreground">// MISSION ROSTER</h4>
                  {missions.map((mission: any, idx: number) => (
                    <div 
                      key={mission.id}
                      className="flex items-center gap-3 p-2 bg-card/50 rounded-lg cursor-pointer hover:bg-card transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isActive) {
                          navigate(`/workout/${mission.id}?campaign=${collection.id}`);
                        } else {
                          navigate(`/mission/${mission.id}`);
                        }
                      }}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-display">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display text-primary truncate">{mission.code_name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {mission.estimated_minutes}min
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            {mission.difficulty}/5
                          </span>
                          <span>{mission.mission_exercises?.length || 0} exercises</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Full Equipment List */}
                {stats.equipment.length > 0 && (
                  <div>
                    <h4 className="text-xs font-display text-muted-foreground mb-2">// REQUIRED EQUIPMENT</h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {stats.equipment.map(eq => (
                        <span key={eq} className="text-[10px] px-2 py-1 bg-accent/10 text-accent rounded border border-accent/20">
                          {formatEquipment(eq)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Activation Confirmation Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent className="bg-card border-accent/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-accent flex items-center gap-2">
              {hasOtherActive ? (
                <>
                  <Skull className="w-5 h-5 text-destructive" />
                  ABANDON CURRENT OP?
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5" />
                  COMMENCE OPERATION?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {hasOtherActive ? (
                <>
                  <p className="text-destructive font-display text-sm">
                    ⚠️ WARNING: MISSION ABORT DETECTED
                  </p>
                  <p>
                    Switching to <span className="text-accent font-display">{collection.code_name}</span> will 
                    <span className="text-destructive font-display"> FORFEIT</span> your current campaign progress.
                  </p>
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
                    <p className="text-destructive text-sm font-display">CONSEQUENCES:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Current campaign progress resets to 0%</li>
                      <li>All mission checkpoints lost</li>
                      <li>You must restart from the beginning</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    You are about to activate <span className="text-accent font-display">{collection.code_name}</span>.
                  </p>
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 space-y-2">
                    <p className="text-accent text-sm font-display">OPERATION DETAILS:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <Crosshair className="w-3 h-3 text-section-missions" /> {missionCount} missions to complete
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="w-3 h-3" /> ~{stats.totalTime} minutes total
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Difficulty: {stats.avgDifficulty}/5
                      </li>
                    </ul>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Complete all missions to earn campaign completion rewards.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">ABORT</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmActivate}
              disabled={isSettingActive}
              className={hasOtherActive 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-accent text-accent-foreground hover:bg-accent/90"
              }
            >
              {isSettingActive ? 'LOADING...' : hasOtherActive ? 'ABANDON & SWITCH' : 'COMMENCE'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auth Required Dialog */}
      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent className="bg-card border-primary/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              AGENT REGISTRATION REQUIRED
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-primary font-display text-sm">
                ⚠️ UNAUTHORIZED ACCESS DETECTED
              </p>
              <p>
                Campaigns require <span className="text-primary font-display">AGENT CREDENTIALS</span> to track your mission progress.
              </p>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-1">
                <p className="text-primary text-sm font-display">BENEFITS OF REGISTRATION:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Track your campaign progress across missions</li>
                  <li>Save personal records and achievements</li>
                  <li>Compete on global leaderboards</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">STAY ANONYMOUS</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate(`/auth?redirect=/campaign/${collection.id}`)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              REGISTER / LOGIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}