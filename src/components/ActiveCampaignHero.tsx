import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, ChevronRight, Trophy, RotateCcw, AlertTriangle, CheckCircle2, Circle, Clock, Zap, Play } from 'lucide-react';
import { useActiveCampaign, useActiveCampaignDetails } from '@/hooks/useActiveCampaign';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
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

export function ActiveCampaignHero() {
  const navigate = useNavigate();
  const { forfeitCampaign, isForfeiting } = useActiveCampaign();
  const { campaign, progress, completedMissionIds, isLoading } = useActiveCampaignDetails();
  const [showForfeitDialog, setShowForfeitDialog] = useState(false);

  if (isLoading || !campaign) return null;

  const missions = campaign.collection_missions
    ?.sort((a: any, b: any) => a.order_index - b.order_index)
    .map((cm: any) => cm.missions) || [];

  const totalMissions = missions.length;
  const completedCount = completedMissionIds.size;
  const progressPercent = totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0;
  const isComplete = completedCount >= totalMissions && totalMissions > 0;

  // Find next uncompleted mission
  const nextMission = missions.find((m: any) => !completedMissionIds.has(m.id));

  const handleForfeit = () => {
    forfeitCampaign(campaign.id);
    setShowForfeitDialog(false);
  };

  const handleStartNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextMission) {
      navigate(`/workout/${nextMission.id}?campaign=${campaign.id}`);
    }
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Start from first mission
    if (missions[0]) {
      navigate(`/workout/${missions[0].id}?campaign=${campaign.id}`);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="text-xs text-muted-foreground tracking-wider mb-2 flex items-center gap-2">
          <Target className="w-3 h-3 text-accent" />
          ACTIVE DEPLOYMENT
        </div>
        
        <div 
          onClick={() => navigate(`/campaign/${campaign.id}`)}
          className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:border-accent ${
            isComplete ? 'border-accent/50 bg-accent/5' : 'border-border hover:bg-card/80'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-display text-xl text-primary">{campaign.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{campaign.code_name}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowForfeitDialog(true); }}
              disabled={isForfeiting}
              className="text-xs font-display text-destructive/70 hover:text-destructive px-2 py-1 rounded hover:bg-destructive/10 transition-colors"
            >
              FORFEIT
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className={isComplete ? 'text-accent font-display' : 'text-muted-foreground'}>
                {completedCount}/{totalMissions} missions
              </span>
              <span className={isComplete ? 'text-accent' : 'text-muted-foreground'}>
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className={`h-2 ${isComplete ? '[&>div]:bg-accent' : ''}`}
            />
          </div>

          {/* Mission checklist - show next missions more prominently */}
          <div className="space-y-1.5 mb-4">
            {missions.slice(0, 4).map((mission: any, idx: number) => {
              const isCompleted = completedMissionIds.has(mission.id);
              const isNext = mission.id === nextMission?.id;
              return (
                <div
                  key={mission.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                    isCompleted
                      ? 'bg-accent/10 text-accent/70'
                      : isNext
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{mission.code_name || mission.name}</span>
                  <span className="text-[10px] opacity-70">{mission.estimated_minutes}m</span>
                  {isNext && (
                    <span className="text-[10px] font-display text-primary">NEXT</span>
                  )}
                </div>
              );
            })}
            {missions.length > 4 && (
              <div className="text-xs text-muted-foreground text-center py-1">
                +{missions.length - 4} more missions
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isComplete ? (
            <div className="flex gap-2">
              <button
                onClick={handleReplay}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground font-display rounded hover:box-glow-accent transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                RUN AGAIN
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/command?tab=campaigns'); }}
                className="px-4 py-2.5 border border-border text-muted-foreground font-display rounded hover:border-primary hover:text-primary transition-colors"
              >
                NEW CAMPAIGN
              </button>
            </div>
          ) : nextMission ? (
            <button
              onClick={handleStartNext}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
            >
              <Zap className="w-4 h-4" />
              DEPLOY: {nextMission.code_name || nextMission.name}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}

          {/* Stats row */}
          {progress && (progress.total_completions > 0 || progress.best_completion_time_seconds) && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              {progress.total_completions > 0 && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-accent" />
                  <span>{progress.total_completions} runs</span>
                </div>
              )}
              {progress.best_completion_time_seconds && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-secondary" />
                  <span>Best: {formatTime(progress.best_completion_time_seconds)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Forfeit Confirmation Dialog */}
      <AlertDialog open={showForfeitDialog} onOpenChange={setShowForfeitDialog}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              FORFEIT CAMPAIGN
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to abandon <span className="text-primary font-display">{campaign.code_name}</span>?
              </p>
              <p className="text-destructive/80">
                Your campaign progress will be reset to 0/{totalMissions} missions. 
                You'll need to complete all missions again to finish the campaign.
              </p>
              <p className="text-muted-foreground text-xs">
                Note: Your individual workout sessions and stats from completed missions will remain.
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
              {isForfeiting ? 'FORFEITING...' : 'FORFEIT CAMPAIGN'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Start Campaign button for campaign cards/rows (replaces PinCampaignButton)
export function StartCampaignButton({ 
  campaignId, 
  size = 'default' 
}: { 
  campaignId: string;
  size?: 'default' | 'small' | 'large';
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCampaignId, setActiveCampaign, isSettingActive } = useActiveCampaign();
  const isActive = activeCampaignId === campaignId;
  const hasOtherActive = activeCampaignId && activeCampaignId !== campaignId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Sign in to start a campaign');
      navigate('/auth');
      return;
    }
    
    if (!isActive) {
      setActiveCampaign(campaignId);
      toast.success(hasOtherActive ? 'Campaign switched!' : 'Campaign started!');
    }
  };

  const sizeClasses = {
    small: 'text-[10px] px-1.5 py-0.5',
    default: 'text-xs px-2 py-1',
    large: 'text-sm px-4 py-3 w-full'
  };
  
  const iconSizes = {
    small: 'w-2.5 h-2.5',
    default: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  if (isActive) {
    return (
      <span className={`${sizeClasses[size]} bg-accent/20 text-accent rounded font-display flex items-center justify-center gap-2`}>
        <Play className={iconSizes[size]} />
        ACTIVE OP
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isSettingActive}
      className={`${sizeClasses[size]} rounded font-display transition-all flex items-center justify-center gap-2 ${
        size === 'large' 
          ? hasOtherActive
            ? 'border-2 border-primary/50 text-primary hover:bg-primary/10 hover:box-glow-primary'
            : 'bg-primary text-primary-foreground hover:box-glow-primary'
          : hasOtherActive
            ? 'text-muted-foreground hover:text-primary hover:bg-primary/10'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
      }`}
      title={hasOtherActive ? 'Switch to this campaign' : 'Start this campaign'}
    >
      <Play className={iconSizes[size]} />
      {isSettingActive ? 'STARTING...' : hasOtherActive ? 'SWITCH CAMPAIGN' : 'BEGIN CAMPAIGN'}
    </button>
  );
}

// Keep PinCampaignButton as alias for backward compatibility
export const PinCampaignButton = StartCampaignButton;
