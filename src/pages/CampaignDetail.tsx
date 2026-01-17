import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap, Play, Clock, Pencil, Trash2, Lock, Globe, Users, FolderOpen, Plus, Trophy, Target, CheckCircle2, Timer } from 'lucide-react';
import { useCollection, useDeleteCollection, useRemoveMissionFromCollection } from '@/hooks/useCollections';
import { useCampaignProgress, useCampaignCompletions, useCampaignLeaderboard } from '@/hooks/useCampaignProgress';
import { useAuth } from '@/hooks/useAuth';
import { GuestIndicator } from '@/components/AnonymousConversion';
import { CollectionFormDialog } from '@/components/CollectionFormDialog';
import { Progress } from '@/components/ui/progress';
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
  const deleteCollection = useDeleteCollection();
  const removeMission = useRemoveMissionFromCollection();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [missionToRemove, setMissionToRemove] = useState<{ id: string; name: string } | null>(null);
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());

  const isOwner = user && collection?.created_by === user.id;
  const missions = collection?.collection_missions?.map(cm => cm.missions) || [];

  // Fetch which missions the user has completed
  useMemo(() => {
    if (!user || missions.length === 0) return;
    
    const missionIds = missions.filter(m => m).map(m => m!.id);
    
    supabase
      .from('workout_sessions')
      .select('mission_id')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED')
      .in('mission_id', missionIds)
      .then(({ data }) => {
        if (data) {
          setCompletedMissionIds(new Set(data.map(s => s.mission_id)));
        }
      });
  }, [user, missions]);

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
      navigate('/collections');
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
          onClick={() => navigate('/collections')}
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
              onClick={() => navigate('/collections')}
              className="p-2 border border-border rounded hover:border-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-secondary" />
                <h1 className="font-display text-2xl text-primary">{collection.code_name}</h1>
                {collection.is_system && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-secondary/20 text-secondary rounded">
                    OFFICIAL
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground tracking-wider mt-1">
                {isAnonymous ? (
                  <GuestIndicator variant="minimal" />
                ) : (
                  <span className="flex items-center gap-2">
                    {getVisibilityIcon(collection.visibility)}
                    {getVisibilityLabel(collection.visibility)} Campaign
                  </span>
                )}
              </p>
            </div>
          </div>

          {isOwner && !collection.is_system && (
            <div className="flex items-center gap-2">
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
            </div>
          )}
        </motion.header>

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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 p-4 bg-card border border-border rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-display text-sm text-primary">CAMPAIGN PROGRESS</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {completedMissionIds.size} / {missions.length} missions
              </span>
            </div>
            
            <Progress value={progressPercent} className="h-2 mb-3" />
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-display text-primary">{progressPercent}%</div>
                <div className="text-[10px] text-muted-foreground">COMPLETE</div>
              </div>
              <div>
                <div className="text-lg font-display text-secondary">
                  {progress?.total_completions || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">RUNS</div>
              </div>
              <div>
                <div className="text-lg font-display text-accent">
                  {progress?.best_completion_time_seconds 
                    ? formatTime(progress.best_completion_time_seconds)
                    : '--:--'}
                </div>
                <div className="text-[10px] text-muted-foreground">BEST TIME</div>
              </div>
            </div>

            {progress?.completed_at && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-2 text-xs text-secondary">
                <CheckCircle2 className="w-3 h-3" />
                <span>Campaign Completed!</span>
              </div>
            )}
          </motion.div>
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
          <h2 className="font-display text-sm text-secondary mb-3 tracking-wider">MISSIONS IN THIS CAMPAIGN</h2>
          
          {missions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Zap className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-3">No missions in this campaign yet</p>
              <button
                onClick={() => navigate('/missions')}
                className="text-xs text-primary hover:underline font-display flex items-center gap-1 mx-auto"
              >
                <Plus className="w-3 h-3" /> ADD MISSIONS
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission, index) => {
                if (!mission) return null;
                const difficulty = getDifficultyLabel(mission.difficulty);
                const isCompleted = completedMissionIds.has(mission.id);
                
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`group bg-card border rounded-lg p-4 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden ${
                      isCompleted ? 'border-secondary/50' : 'border-border'
                    }`}
                    onClick={() => navigate(`/mission/${mission.id}`)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Completion indicator */}
                    {isCompleted && (
                      <div className="absolute top-3 left-3 z-20">
                        <CheckCircle2 className="w-4 h-4 text-secondary" />
                      </div>
                    )}
                    
                    <div className={`relative z-10 ${isCompleted ? 'pl-6' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-display text-lg text-primary">{mission.code_name}</h3>
                          {mission.name !== mission.code_name && (
                            <p className="text-xs text-muted-foreground">{mission.name}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-display ${difficulty.color}`}>
                            {difficulty.label}
                          </span>
                          {isOwner && !collection.is_system && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMissionToRemove({ id: mission.id, name: mission.code_name });
                              }}
                              className="p-1 hover:bg-destructive/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove from campaign"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {mission.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{mission.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {mission.estimated_minutes} min
                          </span>
                          {mission.focus_areas && mission.focus_areas.length > 0 && (
                            <span className="text-primary/70">
                              {mission.focus_areas.join(' • ')}
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/workout/${mission.id}`);
                          }}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
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
            </div>
          )}
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

        {/* Add More Missions Button */}
        {missions.length > 0 && isOwner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-6 text-center"
          >
            <button
              onClick={() => navigate('/missions')}
              className="text-xs text-secondary hover:text-glow-secondary font-display flex items-center gap-1 mx-auto"
            >
              <Plus className="w-3 h-3" /> ADD MORE MISSIONS
            </button>
          </motion.div>
        )}
      </div>

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
