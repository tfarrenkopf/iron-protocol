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

  // Calculate equipment from campaign missions - MUST be before any conditional returns
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

  // Get sorted missions - MUST be before any conditional returns
  const missions = useMemo(() => {
    if (!campaign?.collection_missions) return [];
    return campaign.collection_missions
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((cm: any) => cm.missions)
      .filter(Boolean);
  }, [campaign]);
  
  const totalMissions = missions.length;

  // Find next uncompleted mission - MUST be before any conditional returns
  const nextMission = useMemo(() => {
    return missions.find((m: any) => !completedMissionIds.has(m.id));
  }, [missions, completedMissionIds]);

  // Calculate total time for remaining missions - MUST be before any conditional returns
  const remainingTime = useMemo(() => {
    return missions
      .filter((m: any) => !completedMissionIds.has(m.id))
      .reduce((sum: number, m: any) => sum + (m.estimated_minutes || 0), 0);
  }, [missions, completedMissionIds]);

  // Computed values - can be after hooks since they don't use hooks
  const completedCount = completedMissionIds.size;
  const isComplete = completedCount >= totalMissions;

  const handleForfeit = () => {
    forfeitCampaign(campaign?.id || '');
    setShowForfeitDialog(false);
  };

  const handleStartNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextMission) {
      navigate(`/workout/${nextMission.id}?campaign=${campaign?.id}`);
    } else if (missions[0]) {
      // Campaign complete, replay from start
      navigate(`/workout/${missions[0].id}?campaign=${campaign?.id}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Early return AFTER all hooks and computed values
  if (isLoading || !campaign) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          isComplete 
            ? 'bg-secondary/10 border-secondary hover:box-glow-secondary' 
            : 'bg-accent/10 border-accent hover:box-glow-accent'
        } ${className}`}
        onClick={() => navigate(`/campaign/${campaign.id}`)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <>
                <Trophy className="w-5 h-5 text-secondary" />
                <span className="font-display text-xs text-secondary tracking-wider">CAMPAIGN COMPLETE</span>
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 text-accent animate-pulse" />
                <span className="font-display text-xs text-accent tracking-wider">ACTIVE CAMPAIGN</span>
              </>
            )}
          </div>
        </div>

        <h2 className={`font-display text-2xl mb-2 ${isComplete ? 'text-secondary' : 'text-accent'}`}>
          {campaign.code_name}
        </h2>
        
        {/* Progress */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            {isComplete ? (
              <Trophy className="w-3.5 h-3.5 text-secondary/70" />
            ) : (
              <Play className="w-3.5 h-3.5 text-accent/70" />
            )}
            <span className="text-sm">
              <span className={`font-display ${isComplete ? 'text-secondary' : 'text-accent'}`}>{completedCount}</span>
              <span className="text-muted-foreground">/{totalMissions}</span>
            </span>
          </div>
          {!isComplete && remainingTime > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">~{remainingTime}min left</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className={`h-2 rounded-full overflow-hidden mb-3 ${isComplete ? 'bg-secondary/20' : 'bg-accent/20'}`}>
          <div 
            className={`h-full rounded-full transition-all ${isComplete ? 'bg-secondary' : 'bg-accent'}`}
            style={{ width: `${totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0}%` }}
          />
        </div>

        {/* Stats - always visible */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          {progress?.total_completions !== undefined && progress.total_completions > 0 && (
            <div className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-secondary" />
              <span>{progress.total_completions}x cleared</span>
            </div>
          )}
          {progress?.best_completion_time_seconds && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-secondary" />
              <span>Best: {formatTime(progress.best_completion_time_seconds)}</span>
            </div>
          )}
          {equipment.length > 0 && (
            <div className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              <span>{equipment.length} equip</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isComplete ? (
          <div className="flex gap-2">
            <button
              onClick={handleStartNext}
              className="flex-1 py-3 bg-secondary text-secondary-foreground font-display rounded-lg hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              REPLAY
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowForfeitDialog(true); }}
              className="px-4 py-3 border border-muted-foreground/30 text-muted-foreground font-display rounded-lg hover:border-destructive hover:text-destructive transition-colors"
            >
              DISCARD
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleStartNext}
              className="flex-1 py-3 bg-accent text-accent-foreground font-display rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              <ChevronRight className="w-5 h-5" />
              {nextMission ? `NEXT: ${nextMission.code_name}` : 'CONTINUE'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowForfeitDialog(true); }}
              className="px-3 py-3 border border-muted-foreground/30 text-muted-foreground font-display text-xs rounded-lg hover:border-destructive hover:text-destructive transition-colors"
            >
              FORFEIT
            </button>
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
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  const isActive = activeCampaignId === campaignId;
  const hasOtherActive = activeCampaignId && activeCampaignId !== campaignId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      // Show auth prompt for guests
      setShowAuthPrompt(true);
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

      {/* Auth Prompt Dialog for Guests */}
      <AlertDialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
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
                  <li>Create custom missions and campaigns</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground italic">
                You can still run individual missions as a guest. Sign up to unlock the full arsenal.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">STAY ANONYMOUS</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate(`/auth?redirect=/campaign/${campaignId}`)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              REGISTER / LOGIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
