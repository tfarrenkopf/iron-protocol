import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Pencil, Trash2, Lock, Globe, Users, Flame, Plus, Trophy, Timer, Rocket, Zap, RefreshCw, X, Crosshair, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { GlobalNav } from '@/components/GlobalNav';
import { useCollection, useDeleteCollection, useRemoveMissionFromCollection, useAddMissionToCollection } from '@/hooks/useCollections';
import { useCampaignProgress, useCampaignCompletions, useCampaignLeaderboard, CampaignProgress } from '@/hooks/useCampaignProgress';
import { useAuth } from '@/hooks/useAuth';
import { useActiveCampaign } from '@/hooks/useActiveCampaign';
import { StartCampaignButton } from '@/components/ActiveCampaignHero';
import { GuestIndicator } from '@/components/AnonymousConversion';
import { CollectionFormDialog } from '@/components/CollectionFormDialog';
import { MissionPickerDialog } from '@/components/MissionPickerDialog';
import { CampaignMissionList } from '@/components/CampaignMissionList';
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
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Active Campaign Control Panel
interface ActiveCampaignControlProps {
  collection: any;
  missions: any[];
  completedMissionIds: Set<string>;
  nextMission: any;
  progressPercent: number;
  progress: CampaignProgress | undefined;
  isOwner: boolean;
}

function ActiveCampaignControl({ 
  collection, 
  missions, 
  completedMissionIds, 
  nextMission, 
  progressPercent,
  progress,
  isOwner 
}: ActiveCampaignControlProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { forfeitCampaign, isForfeiting } = useActiveCampaign();
  const [showForfeitDialog, setShowForfeitDialog] = useState(false);
  const [isStartingNewRun, setIsStartingNewRun] = useState(false);
  
  const isComplete = completedMissionIds.size >= missions.length && missions.length > 0;
  const totalTime = missions.reduce((acc: number, m: any) => acc + (m?.estimated_minutes || 0), 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleForfeit = () => {
    forfeitCampaign(collection.id);
    setShowForfeitDialog(false);
    navigate('/command?tab=campaigns');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`mb-6 p-5 rounded-xl border-2 ${
          isComplete 
            ? 'bg-gradient-to-br from-secondary/20 via-secondary/10 to-background border-secondary'
            : 'bg-gradient-to-br from-accent/20 via-accent/10 to-background border-accent'
        }`}
      >
        {/* Header with status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <>
                <Trophy className="w-5 h-5 text-secondary" />
                <span className="font-display text-sm text-secondary tracking-wider">CAMPAIGN COMPLETE</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-accent" />
                <span className="font-display text-sm text-accent tracking-wider">LAUNCH CONTROL</span>
              </>
            )}
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-section-missions" />
              {missions.length} missions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-secondary" />
              ~{totalTime} min
            </span>
          </div>
        </div>

        {/* Description - moved here from separate widget */}
        {collection.description && (
          <p className="text-sm text-foreground/80 mb-4">{collection.description}</p>
        )}
        
        {/* Status */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {isComplete 
                ? 'ALL MISSIONS CLEARED • READY FOR NEW RUN'
                : `MISSION ${completedMissionIds.size + 1} OF ${missions.length}`
              }
            </p>
            <p className={`font-display text-xl ${isComplete ? 'text-secondary' : 'text-accent'}`}>
              {isComplete ? 'VICTORY ACHIEVED' : nextMission?.code_name || 'READY'}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-display ${isComplete ? 'text-secondary' : 'text-accent'}`}>
              {progressPercent}%
            </div>
            <div className="text-xs text-muted-foreground">PROGRESS</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`h-3 rounded-full overflow-hidden mb-4 ${isComplete ? 'bg-secondary/20' : 'bg-accent/20'}`}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isComplete 
                ? 'bg-gradient-to-r from-secondary to-primary'
                : 'bg-gradient-to-r from-accent to-primary'
            }`}
          />
        </div>

        {/* Historical stats row */}
        {progress && (progress.total_completions > 0 || progress.best_completion_time_seconds) && (
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground py-2 px-3 bg-muted/30 rounded-lg">
            {progress.total_completions > 0 && (
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-secondary" />
                <span>{progress.total_completions}x cleared</span>
              </div>
            )}
            {progress.best_completion_time_seconds && (
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3 text-secondary" />
                <span>Best: {formatTime(progress.best_completion_time_seconds)}</span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isComplete ? (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!user) return;
                setIsStartingNewRun(true);
                try {
                  // Reset the current_run_started_at to now
                  const nowIso = new Date().toISOString();
                  await supabase
                    .from('user_campaign_progress')
                    .update({
                      missions_completed_count: 0,
                      completed_at: null,
                      current_run_started_at: nowIso,
                      updated_at: nowIso,
                    })
                    .eq('campaign_id', collection.id)
                    .eq('user_id', user.id);

                  // Invalidate queries so UI updates
                  queryClient.invalidateQueries({ queryKey: ['campaign-progress', collection.id] });
                  queryClient.invalidateQueries({ queryKey: ['campaign-completed-missions', collection.id] });
                  queryClient.invalidateQueries({ queryKey: ['active-campaign-progress'] });
                  queryClient.invalidateQueries({ queryKey: ['active-campaign-completed-missions'] });

                  toast({ title: 'New run started', description: 'Progress has been reset. Deploy when ready!' });
                } catch (error) {
                  console.error('Failed to start new run:', error);
                  toast({ title: 'Error', description: 'Failed to start new run', variant: 'destructive' });
                } finally {
                  setIsStartingNewRun(false);
                }
              }}
              disabled={isStartingNewRun}
              className="flex-1 py-4 bg-secondary text-secondary-foreground font-display text-lg rounded-lg hover:box-glow-secondary transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isStartingNewRun ? 'animate-spin' : ''}`} />
              {isStartingNewRun ? 'RESETTING...' : 'START NEW RUN'}
            </button>
            <button
              onClick={() => setShowForfeitDialog(true)}
              className="px-5 py-4 border-2 border-muted-foreground/30 text-muted-foreground font-display rounded-lg hover:border-destructive hover:text-destructive transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              DISCARD
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (nextMission) {
                  navigate(`/workout/${nextMission.id}?campaignId=${collection.id}`);
                } else if (missions[0]) {
                  navigate(`/workout/${missions[0].id}?campaignId=${collection.id}`);
                }
              }}
              className="flex-1 py-4 bg-accent text-accent-foreground font-display text-xl rounded-lg hover:box-glow-accent transition-all flex items-center justify-center gap-3"
            >
              <Rocket className="w-6 h-6" />
              DEPLOY NOW
            </button>
            <button
              onClick={() => setShowForfeitDialog(true)}
              className="px-4 py-4 border-2 border-muted-foreground/30 text-muted-foreground font-display text-sm rounded-lg hover:border-destructive hover:text-destructive transition-colors"
            >
              FORFEIT
            </button>
          </div>
        )}

        {isOwner && !collection.is_system && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            <Lock className="w-3 h-3 inline mr-1" />
            Campaign locked while active. {isComplete ? 'Discard' : 'Forfeit'} to edit.
          </p>
        )}
      </motion.div>

      {/* Forfeit/Discard Confirmation Dialog */}
      <AlertDialog open={showForfeitDialog} onOpenChange={setShowForfeitDialog}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">
              {isComplete ? 'DISCARD CAMPAIGN' : 'FORFEIT CAMPAIGN'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {isComplete 
                  ? `Remove "${collection.code_name}" from your active slot?`
                  : `Abandon "${collection.code_name}"?`
                }
              </p>
              <p className="text-muted-foreground text-xs">
                {isComplete 
                  ? 'Your completion stats will be preserved. You can start this campaign again anytime.'
                  : 'Your campaign progress will be reset. Individual workout stats remain.'
                }
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForfeit}
              disabled={isForfeiting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isForfeiting ? 'PROCESSING...' : isComplete ? 'DISCARD' : 'FORFEIT'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


const CampaignDetail = () => {
  const navigate = useNavigate();
  const { collectionId } = useParams<{ collectionId: string }>();
  const { user, isAnonymous } = useAuth();
  const { data: collection, isLoading } = useCollection(collectionId);
  const { data: progress } = useCampaignProgress(collectionId);
  const { data: completions } = useCampaignCompletions(collectionId);
  const { data: leaderboard } = useCampaignLeaderboard(collectionId);
  const { activeCampaignId } = useActiveCampaign();
  const deleteCollection = useDeleteCollection();
  const removeMission = useRemoveMissionFromCollection();
  const addMission = useAddMissionToCollection();
  
  const isActiveCampaign = activeCampaignId === collectionId;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [missionPickerOpen, setMissionPickerOpen] = useState(false);
  const [missionToRemove, setMissionToRemove] = useState<{ id: string; name: string } | null>(null);

  const isOwner = user && collection?.created_by === user.id;
  // Can only edit if owner AND not currently active
  const canEdit = isOwner && !collection?.is_system && !isActiveCampaign;
  const missions = collection?.collection_missions?.map(cm => cm.missions) || [];
  const missionIds = collection?.collection_missions?.map(cm => cm.mission_id) || [];

  // Fetch completed sessions for this run with full details
  const { data: runSessionsData } = useQuery({
    queryKey: ['campaign-run-sessions', collectionId, user?.id, missions.length, isActiveCampaign, (progress as any)?.current_run_started_at],
    queryFn: async () => {
      if (!user || missions.length === 0) return [];
      if (!isActiveCampaign) return [];

      const runStartedAt = (progress as any)?.current_run_started_at;
      if (!runStartedAt) return [];

      const missionIdList = missions.filter(m => m).map(m => m!.id);

      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          mission_id,
          completed_at,
          score_earned,
          total_weight,
          missions (
            code_name,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED')
        .gte('started_at', runStartedAt)
        .in('mission_id', missionIdList)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && missions.length > 0 && isActiveCampaign,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Derive completed mission IDs from the sessions
  const completedMissionsData = useMemo(() => {
    if (!runSessionsData) return new Set<string>();
    return new Set(runSessionsData.map(s => s.mission_id).filter(Boolean) as string[]);
  }, [runSessionsData]);

  const completedMissionIds = completedMissionsData;
  const runSessions = runSessionsData || [];
  
  // Find next uncompleted mission for quick launch
  const nextMission = useMemo(() => {
    return missions.find((m: any) => m && !completedMissionIds.has(m.id));
  }, [missions, completedMissionIds]);

  const progressPercent = missions.length > 0 
    ? Math.round((completedMissionIds.size / missions.length) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'shared': return <Users className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Public';
      case 'shared': return 'Shared';
      default: return 'Private';
    }
  };

  const handleDeleteCampaign = async () => {
    if (collection) {
      await deleteCollection.mutateAsync(collection.id);
      navigate('/command?tab=campaigns');
    }
  };

  const handleRemoveMission = async () => {
    if (missionToRemove && collectionId) {
      try {
        await removeMission.mutateAsync({ collectionId, missionId: missionToRemove.id });
        toast({ title: 'Mission removed', description: `Removed from campaign` });
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      setMissionToRemove(null);
    }
  };

  const handleAddMission = async (missionId: string) => {
    if (!collectionId) return;
    try {
      await addMission.mutateAsync({ collectionId, missionId });
      toast({ title: 'Mission added', description: 'Mission added to campaign' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return { label: 'EASY', color: 'text-green-400' };
    if (difficulty <= 4) return { label: 'MEDIUM', color: 'text-yellow-400' };
    if (difficulty <= 6) return { label: 'HARD', color: 'text-orange-400' };
    return { label: 'EXTREME', color: 'text-red-400' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="font-display text-2xl text-destructive">CAMPAIGN NOT FOUND</div>
        <button
          onClick={() => navigate('/command?tab=campaigns')}
          className="text-primary hover:underline"
        >
          Return to Campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl">
        <GlobalNav backTo="/command?tab=campaigns" />

        {/* Campaign title section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            {isActiveCampaign ? (
              <Rocket className="w-6 h-6 text-accent animate-pulse" />
            ) : (
              <Flame className="w-6 h-6 text-section-campaigns" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl text-primary">{collection.code_name}</h1>
                {collection.is_system && (
                  <span className="text-xs px-1.5 py-0.5 bg-secondary/20 text-secondary rounded">
                    OFFICIAL
                  </span>
                )}
                {isActiveCampaign && (
                  <span className="text-xs px-1.5 py-0.5 bg-accent/20 text-accent rounded animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground tracking-wider mt-1">
                {isAnonymous ? (
                  <GuestIndicator variant="minimal" />
                ) : isActiveCampaign ? (
                  <span className="text-accent">🚀 ENGINES HOT • READY FOR LAUNCH</span>
                ) : (
                  <span className="flex items-center gap-2">
                    {getVisibilityIcon(collection.visibility)}
                    {getVisibilityLabel(collection.visibility)} Campaign
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit buttons - only show if can edit (not active) */}
            {canEdit && (
              <>
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="p-2 border border-secondary text-secondary rounded hover:bg-secondary/10 transition-colors"
                  title="Edit campaign"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="p-2 border border-destructive text-destructive rounded hover:bg-destructive/10 transition-colors"
                  title="Delete campaign"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* LAUNCH CONTROL - Primary action for active campaigns */}
        {isActiveCampaign && user && missions.length > 0 && (
          <ActiveCampaignControl 
            collection={collection}
            missions={missions}
            completedMissionIds={completedMissionIds}
            nextMission={nextMission}
            progressPercent={progressPercent}
            progress={progress}
            isOwner={!!isOwner}
          />
        )}

        {/* Start Campaign button for non-active */}
        {!isActiveCampaign && user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <StartCampaignButton campaignId={collectionId!} size="large" />
          </motion.div>
        )}

        {/* Core Campaign Info - Only show for non-active campaigns (active has info in control panel) */}
        {!isActiveCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-4 bg-card border border-border rounded-lg"
          >
            {/* Campaign Description */}
            {collection.description && (
              <p className="text-sm text-foreground mb-4">{collection.description}</p>
            )}
            
            {/* Compact inline stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-section-missions" />
                {missions.length} missions
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-secondary" />
                ~{missions.reduce((acc, m) => acc + (m?.estimated_minutes || 0), 0)} min
              </span>
              {progress?.total_completions && progress.total_completions > 0 && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-accent" />
                  {progress.total_completions}x cleared
                </span>
              )}
              {progress?.best_completion_time_seconds && (
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-secondary" />
                  Best: {formatTime(progress.best_completion_time_seconds)}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Missions List */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm text-section-missions tracking-wider flex items-center gap-2">
              <Crosshair className="w-4 h-4" />
              {isActiveCampaign ? 'MISSION QUEUE' : 'MISSIONS'} ({completedMissionIds.size}/{missions.length})
            </h2>
            {canEdit && (
              <button
                onClick={() => setMissionPickerOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-section-missions 
                           border border-section-missions/50 rounded-lg
                           hover:bg-section-missions/10 hover:border-section-missions
                           transition-all font-display"
              >
                <Plus className="w-4 h-4" /> ADD
              </button>
            )}
          </div>
          
          {/* Empty state with consistent styling to mission list */}
          {missions.length === 0 ? (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Header matching mission card style */}
              <div className="p-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-section-campaigns/10">
                    <Flame className="w-5 h-5 text-section-campaigns" />
                  </div>
                  <div>
                    <p className="font-display text-sm text-foreground">NO MISSIONS ASSIGNED</p>
                    <p className="text-xs text-muted-foreground">Add missions to build your campaign roster</p>
                  </div>
                </div>
              </div>
              
              {/* Empty content area */}
              <div className="p-6 text-center">
                <Crosshair className="w-10 h-10 mx-auto mb-3 text-section-missions/30" />
                <p className="text-sm text-muted-foreground mb-4">
                  {canEdit 
                    ? 'Select missions from the arsenal to add to this campaign.'
                    : 'This campaign has no missions yet.'}
                </p>
                {canEdit && (
                  <button
                    onClick={() => setMissionPickerOpen(true)}
                    className="px-4 py-2 bg-section-campaigns text-white font-display text-sm rounded hover:box-glow-campaigns transition-all flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" /> ADD MISSIONS
                  </button>
                )}
              </div>
            </div>
          ) : (
            <CampaignMissionList
              collectionId={collectionId!}
              missions={missions}
              missionIds={missionIds}
              completedMissionIds={completedMissionIds}
              isOwner={!!canEdit}
              isSystem={collection.is_system || isActiveCampaign}
              onRemoveMission={setMissionToRemove}
              onAddMission={() => setMissionPickerOpen(true)}
            />
          )}
        </motion.section>

        {/* Current Run History - Show completed sessions for active campaign */}
        {isActiveCampaign && runSessions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="font-display text-sm text-accent mb-3 tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" /> RUN HISTORY
            </h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
              {runSessions.map((session: any) => {
                const completedDate = new Date(session.completed_at);
                const dayOfWeek = format(completedDate, 'EEE');
                const dateStr = format(completedDate, 'MMM d');
                const missionName = session.missions?.code_name || session.missions?.name || 'Unknown Mission';
                
                return (
                  <div key={session.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <div className="text-[10px] text-muted-foreground uppercase">{dayOfWeek}</div>
                        <div className="text-sm font-display text-primary">{dateStr}</div>
                      </div>
                      <div>
                        <div className="text-sm font-display text-foreground">{missionName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {session.score_earned} pts • {session.total_weight} lbs
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-secondary">✓</div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Consolidated Stats Section - Only show if there's data */}
        {user && (leaderboard?.length > 0 || (completions && completions.length > 0)) && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="font-display text-sm text-section-campaigns mb-3 tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4" /> CAMPAIGN STATS
            </h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Leaderboard section */}
              {leaderboard && leaderboard.length > 0 && (
                <div className="p-3 border-b border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">TOP TIMES</p>
                  <div className="space-y-1">
                    {leaderboard.slice(0, 3).map((entry: any, index: number) => (
                      <div key={entry.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`font-display ${
                            index === 0 ? 'text-yellow-400' : 
                            index === 1 ? 'text-gray-300' : 'text-amber-600'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className="text-muted-foreground">
                            {entry.profiles?.display_name || 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-primary font-display">
                          {formatTime(entry.completion_time_seconds)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Your history section */}
              {completions && completions.length > 0 && (
                <div className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">YOUR RUNS</p>
                  <div className="space-y-1">
                    {completions.slice(0, 3).map((completion) => (
                      <div key={completion.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {completion.is_personal_record && (
                            <span className="text-yellow-400">⚡</span>
                          )}
                          <span className="text-muted-foreground">
                            {new Date(completion.completed_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-primary">{formatTime(completion.completion_time_seconds)}</span>
                          <span className="text-muted-foreground">{completion.total_score} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}

      </div>

      {/* Mission Picker Dialog */}
      <MissionPickerDialog
        open={missionPickerOpen}
        onOpenChange={setMissionPickerOpen}
        onAddMission={handleAddMission}
        onRemoveMission={(missionId) => setMissionToRemove({ id: missionId, name: missions.find(m => m?.id === missionId)?.code_name || 'Mission' })}
        existingMissionIds={missionIds}
      />

      {/* Edit Dialog */}
      {editDialogOpen && (
        <CollectionFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          collectionId={collectionId}
        />
      )}

      {/* Delete Campaign Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">DELETE CAMPAIGN</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{collection.code_name}"? This will not delete the missions inside.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCampaign}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Mission Confirmation */}
      <AlertDialog open={!!missionToRemove} onOpenChange={() => setMissionToRemove(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">REMOVE MISSION</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{missionToRemove?.name}" from this campaign? The mission itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMission}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CampaignDetail;
