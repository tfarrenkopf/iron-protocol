import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Pencil, Trash2, Lock, Globe, Users, Flame, Plus, Trophy, Timer, Rocket, Play, Zap } from 'lucide-react';
import { useCollection, useDeleteCollection, useRemoveMissionFromCollection, useAddMissionToCollection } from '@/hooks/useCollections';
import { useCampaignProgress, useCampaignCompletions, useCampaignLeaderboard } from '@/hooks/useCampaignProgress';
import { useAuth } from '@/hooks/useAuth';
import { useActiveCampaign } from '@/hooks/useActiveCampaign';
import { StartCampaignButton } from '@/components/ActiveCampaignHero';
import { GuestIndicator } from '@/components/AnonymousConversion';
import { CollectionFormDialog } from '@/components/CollectionFormDialog';
import { MissionPickerDialog } from '@/components/MissionPickerDialog';
import { CampaignMissionList } from '@/components/CampaignMissionList';
import { CampaignProgressCard } from '@/components/CampaignProgressCard';
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
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());

  const isOwner = user && collection?.created_by === user.id;
  // Can only edit if owner AND not currently active
  const canEdit = isOwner && !collection?.is_system && !isActiveCampaign;
  const missions = collection?.collection_missions?.map(cm => cm.missions) || [];
  const missionIds = collection?.collection_missions?.map(cm => cm.mission_id) || [];
  
  // Find next uncompleted mission for quick launch
  const nextMission = useMemo(() => {
    return missions.find((m: any) => m && !completedMissionIds.has(m.id));
  }, [missions, completedMissionIds]);

  // Fetch which missions the user has completed
  useEffect(() => {
    if (!user || missions.length === 0) return;
    
    const missionIdList = missions.filter(m => m).map(m => m!.id);
    
    supabase
      .from('workout_sessions')
      .select('mission_id')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED')
      .in('mission_id', missionIdList)
      .then(({ data }) => {
        if (data) {
          setCompletedMissionIds(new Set(data.map(s => s.mission_id)));
        }
      });
  }, [user, missions.length]);

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
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 border border-border rounded hover:border-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                {isActiveCampaign ? (
                  <Rocket className="w-6 h-6 text-accent animate-pulse" />
                ) : (
                  <Flame className="w-6 h-6 text-accent" />
                )}
                <h1 className="font-display text-2xl text-primary">{collection.code_name}</h1>
                {collection.is_system && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-secondary/20 text-secondary rounded">
                    OFFICIAL
                  </span>
                )}
                {isActiveCampaign && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded animate-pulse">
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
        </motion.header>

        {/* LAUNCH CONTROL - Primary action for active campaigns */}
        {isActiveCampaign && user && missions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-5 bg-gradient-to-br from-accent/20 via-accent/10 to-background border-2 border-accent rounded-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-accent" />
              <span className="font-display text-sm text-accent tracking-wider">LAUNCH CONTROL</span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {completedMissionIds.size >= missions.length 
                    ? 'CAMPAIGN COMPLETE • READY FOR VICTORY LAP'
                    : `MISSION ${completedMissionIds.size + 1} OF ${missions.length}`
                  }
                </p>
                <p className="font-display text-xl text-accent">
                  {nextMission ? nextMission.code_name : 'ALL MISSIONS CLEARED'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-display text-accent">{progressPercent}%</div>
                <div className="text-xs text-muted-foreground">PROGRESS</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-accent/20 rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
              />
            </div>

            <button
              onClick={() => {
                if (nextMission) {
                  navigate(`/workout/${nextMission.id}?campaign=${collection.id}`);
                } else if (missions[0]) {
                  navigate(`/workout/${missions[0].id}?campaign=${collection.id}`);
                }
              }}
              className="w-full py-4 bg-accent text-accent-foreground font-display text-xl rounded-lg hover:box-glow-accent transition-all flex items-center justify-center gap-3"
            >
              <Rocket className="w-6 h-6" />
              {completedMissionIds.size >= missions.length ? 'REPLAY FROM START' : 'LAUNCH MISSION'}
            </button>

            {isActiveCampaign && isOwner && !collection.is_system && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                <Lock className="w-3 h-3 inline mr-1" />
                Campaign locked while active. Forfeit to edit.
              </p>
            )}
          </motion.div>
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

        {/* Description */}
        {collection.description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-card border border-border rounded-lg"
          >
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          </motion.div>
        )}

        {/* Progress Section - Only show for logged in users */}
        {user && missions.length > 0 && (
          <CampaignProgressCard
            progress={progress || null}
            completedCount={completedMissionIds.size}
            totalMissions={missions.length}
          />
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <div className="text-2xl font-display text-primary">{missions.length}</div>
            <div className="text-xs text-muted-foreground">MISSIONS</div>
          </div>
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <div className="text-2xl font-display text-secondary">
              {missions.reduce((acc, m) => acc + (m?.estimated_minutes || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground">TOTAL MINS</div>
          </div>
        </motion.div>

        {/* Leaderboard - Show if there are completions */}
        {leaderboard && leaderboard.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h2 className="font-display text-sm text-secondary mb-3 tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4" /> SPEED LEADERBOARD
            </h2>
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {leaderboard.slice(0, 5).map((entry: any, index: number) => (
                <div key={entry.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`font-display text-lg ${
                      index === 0 ? 'text-yellow-400' : 
                      index === 1 ? 'text-gray-300' : 
                      index === 2 ? 'text-amber-600' : 'text-muted-foreground'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="text-sm">
                      {entry.profiles?.display_name || 'Anonymous'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Timer className="w-3 h-3" />
                    {formatTime(entry.completion_time_seconds)}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Missions List */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-secondary tracking-wider">
              {isActiveCampaign ? '🏁 RACE STAGES' : 'MISSIONS IN THIS CAMPAIGN'}
            </h2>
            {canEdit && (
              <button
                onClick={() => setMissionPickerOpen(true)}
                className="flex items-center gap-1 text-xs text-primary hover:text-glow-primary font-display"
              >
                <Plus className="w-3 h-3" /> ADD
              </button>
            )}
          </div>
          
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
        </motion.section>

        {/* Completion History */}
        {completions && completions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h2 className="font-display text-sm text-secondary mb-3 tracking-wider">YOUR COMPLETION HISTORY</h2>
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {completions.slice(0, 5).map((completion) => (
                <div key={completion.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {completion.is_personal_record && (
                      <span className="text-yellow-400 text-xs">⚡ PR</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(completion.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-primary">{formatTime(completion.completion_time_seconds)}</span>
                    <span className="text-muted-foreground">{completion.total_score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

      </div>

      {/* Mission Picker Dialog */}
      <MissionPickerDialog
        open={missionPickerOpen}
        onOpenChange={setMissionPickerOpen}
        onAddMission={handleAddMission}
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
