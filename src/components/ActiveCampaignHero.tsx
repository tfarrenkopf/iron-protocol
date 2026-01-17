import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Pin, ChevronRight, Trophy, RotateCcw, X, CheckCircle2, Circle, Clock, Zap } from 'lucide-react';
import { useActiveCampaign, useActiveCampaignDetails } from '@/hooks/useActiveCampaign';
import { Progress } from '@/components/ui/progress';

export function ActiveCampaignHero() {
  const navigate = useNavigate();
  const { setActiveCampaign, isSettingActive } = useActiveCampaign();
  const { campaign, progress, completedMissionIds, isLoading } = useActiveCampaignDetails();

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

  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCampaign(null);
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="text-xs text-muted-foreground tracking-wider mb-2 flex items-center gap-2">
        <Pin className="w-3 h-3 text-accent" />
        ACTIVE CAMPAIGN
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
            onClick={handleUnpin}
            disabled={isSettingActive}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
            title="Unpin campaign"
          >
            <X className="w-4 h-4" />
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

        {/* Mission checklist (compact) */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {missions.slice(0, 6).map((mission: any, idx: number) => {
            const isCompleted = completedMissionIds.has(mission.id);
            const isNext = mission.id === nextMission?.id;
            return (
              <div
                key={mission.id}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  isCompleted
                    ? 'bg-accent/20 text-accent'
                    : isNext
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted text-muted-foreground'
                }`}
                title={mission.name}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
                <span className="truncate max-w-[60px]">{idx + 1}</span>
              </div>
            );
          })}
          {missions.length > 6 && (
            <span className="text-xs text-muted-foreground px-2 py-1">
              +{missions.length - 6} more
            </span>
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
          >
            <Zap className="w-4 h-4" />
            CONTINUE: {nextMission.code_name || nextMission.name}
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
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Compact pin button for campaign cards/rows
export function PinCampaignButton({ 
  campaignId, 
  size = 'default' 
}: { 
  campaignId: string;
  size?: 'default' | 'small';
}) {
  const { activeCampaignId, setActiveCampaign, isSettingActive } = useActiveCampaign();
  const isPinned = activeCampaignId === campaignId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCampaign(isPinned ? null : campaignId);
  };

  const sizeClasses = size === 'small' 
    ? 'p-1.5 text-xs' 
    : 'p-2';

  return (
    <button
      onClick={handleClick}
      disabled={isSettingActive}
      className={`${sizeClasses} rounded transition-all ${
        isPinned
          ? 'bg-accent/20 text-accent hover:bg-accent/30'
          : 'text-muted-foreground hover:text-accent hover:bg-accent/10'
      }`}
      title={isPinned ? 'Unpin campaign' : 'Set as active campaign'}
    >
      <Pin className={`${size === 'small' ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${isPinned ? 'fill-current' : ''}`} />
    </button>
  );
}
