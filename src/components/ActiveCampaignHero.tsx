import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Flame, ChevronRight, AlertTriangle, Play, Clock, Dumbbell, Trophy, RefreshCw, Skull } from 'lucide-react';
import { useActiveCampaign, useActiveCampaignDetails } from '@/hooks/useActiveCampaign';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatEquipment } from '@/data/muscleGroups';
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

interface ActiveCampaignHeroProps {
  className?: string;
}

export function ActiveCampaignHero({ className = '' }: ActiveCampaignHeroProps) {
  const navigate = useNavigate();
  const { forfeitCampaign, isForfeiting } = useActiveCampaign();
  const { campaign, progress, completedMissionIds, isLoading } = useActiveCampaignDetails();
  const [showForfeitDialog, setShowForfeitDialog] = useState(false);

  // Calculate equipment from campaign missions
  const equipment = useMemo(() => {
    if (!campaign?.collection_missions) return [];
    const equipmentSet = new Set<string>();
    campaign.collection_missions.forEach((cm: any) => {
      cm.missions?.mission_exercises?.forEach((me: any) => {
        me.exercises?.equipment?.forEach((eq: string) => equipmentSet.add(eq));
      });
    });
    return Array.from(equipmentSet);
  }, [campaign]);

  if (isLoading || !campaign) {
    return null;
  }

  const missions = campaign.collection_missions
    ?.sort((a: any, b: any) => a.order_index - b.order_index)
    .map((cm: any) => cm.missions)
    .filter(Boolean) || [];
  
  const totalMissions = missions.length;

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
    } else if (missions[0]) {
      // Campaign complete, replay from start
      navigate(`/workout/${missions[0].id}?campaign=${campaign.id}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completedCount = completedMissionIds.size;
  const isComplete = completedCount >= totalMissions;

  // Calculate total time for remaining missions
  const remainingTime = useMemo(() => {
    return missions
      .filter((m: any) => !completedMissionIds.has(m.id))
      .reduce((sum: number, m: any) => sum + (m.estimated_minutes || 0), 0);
  }, [missions, completedMissionIds]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-accent/10 border-2 border-accent rounded-lg p-4 cursor-pointer hover:box-glow-accent transition-all ${className}`}
        onClick={() => navigate(`/campaign/${campaign.id}`)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent animate-pulse" />
            <span className="font-display text-xs text-accent tracking-wider">ACTIVE CAMPAIGN</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowForfeitDialog(true); }}
            className="text-xs text-destructive/60 hover:text-destructive font-display transition-colors"
          >
            FORFEIT
          </button>
        </div>

        <h2 className="font-display text-2xl text-accent mb-2">{campaign.code_name}</h2>
        
        {/* Progress */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-accent/70" />
            <span className="text-sm">
              <span className="text-accent font-display">{completedCount}</span>
              <span className="text-muted-foreground">/{totalMissions}</span>
            </span>
          </div>
          {remainingTime > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">~{remainingTime}min left</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-accent/20 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0}%` }}
          />
        </div>

        {/* Equipment */}
        {equipment.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex gap-1 flex-wrap">
              {equipment.slice(0, 4).map(eq => (
                <span key={eq} className="text-[10px] px-1.5 py-0.5 bg-muted/50 text-muted-foreground rounded">
                  {formatEquipment(eq)}
                </span>
              ))}
              {equipment.length > 4 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-muted/50 text-muted-foreground rounded">
                  +{equipment.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleStartNext}
          className="w-full py-3 bg-accent text-accent-foreground font-display rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-lg"
        >
          {isComplete ? (
            <>
              <RefreshCw className="w-5 h-5" />
              REPLAY CAMPAIGN
            </>
          ) : (
            <>
              <ChevronRight className="w-5 h-5" />
              {nextMission ? `NEXT: ${nextMission.code_name}` : 'CONTINUE'}
            </>
          )}
        </button>

        {/* Stats */}
        {progress && (progress.total_completions > 0 || progress.best_completion_time_seconds) && (
          <div className="mt-3 pt-3 border-t border-accent/20 flex items-center gap-4 text-xs text-muted-foreground">
            {progress.total_completions > 0 && (
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-secondary" />
                <span>{progress.total_completions}x cleared</span>
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

// StartCampaignButton - for use on campaign cards when user wants to begin/switch campaigns
interface StartCampaignButtonProps {
  campaignId: string;
  size?: 'small' | 'default' | 'large';
}

export function StartCampaignButton({ campaignId, size = 'default' }: StartCampaignButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCampaignId, setActiveCampaign, isSettingActive } = useActiveCampaign();
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  
  const isActive = activeCampaignId === campaignId;
  const hasOtherActive = activeCampaignId && activeCampaignId !== campaignId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.error('Sign in to start a campaign');
      navigate('/auth');
      return;
    }
    
    if (isActive) return;
    
    // If switching from another campaign, show confirmation
    if (hasOtherActive) {
      setShowSwitchConfirm(true);
    } else {
      // Starting fresh
      setActiveCampaign(campaignId);
      toast.success('CAMPAIGN ACTIVATED', {
        description: 'Prepare for deployment, soldier.',
      });
    }
  };

  const confirmSwitch = () => {
    setActiveCampaign(campaignId);
    setShowSwitchConfirm(false);
    toast.success('CAMPAIGN SWITCHED', {
      description: 'Previous operation abandoned. New mission parameters loaded.',
    });
  };

  const sizeClasses = {
    small: 'text-[10px] px-1.5 py-0.5',
    default: 'text-xs px-3 py-1.5',
    large: 'text-sm px-4 py-2.5',
  };
  
  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-3.5 h-3.5',
    large: 'w-4 h-4',
  };

  if (isActive) {
    return (
      <span className={`flex items-center gap-1 bg-accent/20 text-accent rounded font-display ${sizeClasses[size]}`}>
        <Flame className={iconSizes[size]} />
        ACTIVE
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isSettingActive}
        className={`flex items-center gap-1.5 bg-accent text-accent-foreground rounded font-display hover:bg-accent/90 transition-colors disabled:opacity-50 ${sizeClasses[size]} ${
          size === 'large' ? 'w-full justify-center' : ''
        }`}
        title={hasOtherActive ? 'Switch to this campaign' : 'Start this campaign'}
      >
        <Play className={iconSizes[size]} />
        {isSettingActive ? 'STARTING...' : hasOtherActive ? 'ACTIVATE OP' : 'BEGIN CAMPAIGN'}
      </button>

      {/* Switch Confirmation Dialog */}
      <AlertDialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive flex items-center gap-2">
              <Skull className="w-5 h-5" />
              ABANDON CURRENT OP?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-destructive font-display text-sm">
                ⚠️ WARNING: MISSION ABORT DETECTED
              </p>
              <p>
                Switching campaigns will <span className="text-destructive font-display">FORFEIT</span> your current progress.
              </p>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
                <p className="text-destructive text-sm font-display">CONSEQUENCES:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Campaign progress resets to 0%</li>
                  <li>All mission checkpoints lost</li>
                  <li>You must restart from the beginning</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Your past workout stats and XP remain intact. Only campaign progress is reset.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">RETREAT</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSwitch}
              disabled={isSettingActive}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSettingActive ? 'SWITCHING...' : 'ABANDON & SWITCH'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Keep PinCampaignButton as alias for backward compatibility
export const PinCampaignButton = StartCampaignButton;
