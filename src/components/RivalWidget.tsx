import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Swords, Share2, Trophy, TrendingUp, Trash2, Crown, Loader2, 
  ChevronDown, ChevronUp, Flame, Dumbbell, Target, Zap, Play,
  AlertTriangle, Skull, Calendar
} from 'lucide-react';
import { useRivals, useRivalWeeklyStats, useRemoveRival, useRivalActivity, RivalWeeklyStats } from '@/hooks/useRivals';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useActiveCampaign } from '@/hooks/useActiveCampaign';
import { Button } from '@/components/ui/button';
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
import { formatDistanceToNow, startOfWeek, endOfWeek, format } from 'date-fns';

interface RivalWidgetProps {
  variant?: 'compact' | 'full';
}

export function RivalWidget({ variant = 'compact' }: RivalWidgetProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: rivals, isLoading: rivalsLoading } = useRivals();
  const { data: weeklyStats, isLoading: statsLoading } = useRivalWeeklyStats();
  const { data: rivalActivity, isLoading: activityLoading } = useRivalActivity();
  const { activeCampaignId, setActiveCampaign, isSettingActive } = useActiveCampaign();
  const removeRival = useRemoveRival();
  
  const [expandedRival, setExpandedRival] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [rivalToRemove, setRivalToRemove] = useState<{ id: string; name: string } | null>(null);
  const [showCampaignWarning, setShowCampaignWarning] = useState(false);
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);

  if (!user) return null;

  const hasRivals = rivals && rivals.length > 0;

  // Calculate week range for display
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 }); // Saturday
  const weekRangeText = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;

  const shareRivalLink = async () => {
    if (!profile?.rival_code) {
      toast({ title: 'Error', description: 'No rival code found. Try refreshing.', variant: 'destructive' });
      return;
    }

    const baseUrl = 'https://iron-protocol.fitness';
    const shareUrl = `${baseUrl}/rival/${profile.rival_code}`;
    const shareText = `⚔️ YOU'VE BEEN MARKED. Accept the challenge or stay weak.`;
    const fullMessage = `${shareText} ${shareUrl}`;

    try {
      await navigator.clipboard.writeText(fullMessage);
      toast({ 
        title: 'CHALLENGE COPIED ⚔️', 
        description: 'Paste it anywhere to send to your target.' 
      });
    } catch {
      toast({ 
        title: 'Copy this challenge:', 
        description: fullMessage,
        duration: 10000,
      });
    }
  };

  const handleRemoveRival = (rivalId: string, rivalName: string) => {
    setRivalToRemove({ id: rivalId, name: rivalName });
    setRemoveDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!rivalToRemove) return;
    const rivalry = rivals?.find(r => r.rival_id === rivalToRemove.id);
    if (rivalry) {
      await removeRival.mutateAsync(rivalry.id);
      toast({ title: 'Rival removed', description: 'The rivalry has ended.' });
    }
    setRemoveDialogOpen(false);
    setRivalToRemove(null);
  };

  const handleJoinMission = (missionId: string) => {
    navigate(`/mission/${missionId}`);
  };

  const handleSelectCampaign = (campaignId: string) => {
    if (activeCampaignId && activeCampaignId !== campaignId) {
      setPendingCampaignId(campaignId);
      setShowCampaignWarning(true);
    } else {
      navigate(`/campaign/${campaignId}`);
    }
  };

  const confirmCampaignSwitch = () => {
    if (pendingCampaignId) {
      setActiveCampaign(pendingCampaignId);
      setShowCampaignWarning(false);
      navigate(`/campaign/${pendingCampaignId}`);
    }
  };

  // Get user's rank among rivals
  const userRank = weeklyStats?.findIndex(s => s.user_id === user.id) ?? -1;
  const userStats = weeklyStats?.find(s => s.user_id === user.id);

  const formatRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-3 h-3" />;
    return <span>{index + 1}</span>;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-yellow-500/20 text-yellow-500';
    if (index === 1) return 'bg-gray-400/20 text-gray-400';
    if (index === 2) return 'bg-amber-600/20 text-amber-600';
    return 'bg-muted/20 text-muted-foreground';
  };

  const renderExpandedStats = (stat: RivalWeeklyStats) => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 pt-2 border-t border-border/50"
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="font-display text-sm text-foreground">{stat.weekly_weight.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground uppercase">LBS</div>
        </div>
        <div>
          <div className="font-display text-sm text-foreground">{stat.weekly_sets}</div>
          <div className="text-[10px] text-muted-foreground uppercase">SETS</div>
        </div>
        <div>
          <div className="font-display text-sm text-foreground">{stat.weekly_max_combo}x</div>
          <div className="text-[10px] text-muted-foreground uppercase">MAX COMBO</div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-section-rivals/50 rounded-lg p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-section-rivals" />
            <h3 className="font-display text-lg text-section-rivals">RIVAL MODE</h3>
          </div>
          <button
            onClick={shareRivalLink}
            className="p-1.5 hover:bg-section-rivals/10 rounded transition-colors"
            title="Challenge a rival"
          >
            <Share2 className="w-4 h-4 text-section-rivals" />
          </button>
        </div>

        {rivalsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasRivals ? (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <Swords className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-2">No rivals yet</p>
            <p className="text-xs text-muted-foreground/70 mb-4 max-w-xs mx-auto">
              Send a challenge link to compete head-to-head with a friend.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={shareRivalLink}
              className="text-xs"
            >
              <Share2 className="w-3 h-3 mr-1" />
              SEND CHALLENGE
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Weekly Leaderboard */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>WEEKLY LEADERBOARD</span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{weekRangeText}</span>
                </div>
              </div>
              
              <p className="text-[10px] text-muted-foreground/70 mb-2">
                Resets every Sunday. Compete for missions completed this week.
              </p>
              
              {statsLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-muted/20 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {weeklyStats?.map((stat, index) => {
                    const isCurrentUser = stat.user_id === user.id;
                    const rival = rivals?.find(r => r.rival_id === stat.user_id);
                    const isExpanded = expandedRival === stat.user_id;
                    
                    return (
                      <motion.div
                        key={stat.user_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          isCurrentUser 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'bg-background border border-border hover:border-primary/30'
                        }`}
                        onClick={() => setExpandedRival(isExpanded ? null : stat.user_id)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Rank */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankColor(index)}`}>
                            {getRankIcon(index)}
                          </div>
                          
                          {/* Name & expand indicator */}
                          <div className="flex-1 min-w-0 flex items-center gap-1">
                            <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                              {isCurrentUser ? 'You' : stat.display_name || 'Anonymous'}
                            </p>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Missions this week - primary stat */}
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-display ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                              {stat.weekly_sessions}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              MISSIONS
                            </p>
                          </div>

                          {/* Remove button for rivals */}
                          {!isCurrentUser && rival && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveRival(stat.user_id, stat.display_name || 'Rival');
                              }}
                              className="p-1 hover:bg-destructive/10 rounded transition-colors opacity-50 hover:opacity-100"
                              title="End rivalry"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          )}
                        </div>

                        {/* Expanded stats */}
                        <AnimatePresence>
                          {isExpanded && renderExpandedStats(stat)}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity Feed - Full variant only */}
            {variant === 'full' && (
              <div>
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>RIVAL ACTIVITY FEED</span>
                </div>
                
                {activityLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-muted/20 rounded" />
                    ))}
                  </div>
                ) : rivalActivity && rivalActivity.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {rivalActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 bg-background border border-section-rivals/30 rounded-lg hover:border-section-rivals/60 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-display text-sm text-section-rivals">{activity.display_name}</span>
                            <span className="text-xs text-muted-foreground ml-1">completed</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{formatRelativeTime(activity.completed_at)}</span>
                        </div>
                        
                        <div className="font-display text-section-missions mb-2">
                          {activity.mission_snapshot?.code_name || 'CLASSIFIED MISSION'}
                        </div>
                        
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {activity.score_earned.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" />
                            {activity.total_weight.toLocaleString()} lbs
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {activity.max_combo}x
                          </span>
                        </div>

                        {/* Action button - Join Mission */}
                        {activity.mission_id && (
                          <button
                            onClick={() => handleJoinMission(activity.mission_id!)}
                            className="w-full py-2.5 border-2 border-section-missions rounded text-xs font-display text-section-missions hover:bg-section-missions/10 transition-colors flex items-center justify-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            ACCEPT CHALLENGE
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg">
                    <Flame className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-1">No recent rival activity</p>
                    <p className="text-xs text-muted-foreground/70">
                      Your rivals haven't completed any missions in the last 7 days.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Compact Activity Feed - show only 2 items with prominent CTA */}
            {variant === 'compact' && rivalActivity && rivalActivity.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  <span>RECENT ACTIVITY</span>
                </div>
                
                <div className="space-y-2">
                  {rivalActivity.slice(0, 2).map((activity) => (
                    <div
                      key={activity.id}
                      className="p-3 bg-background border border-section-rivals/30 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-section-rivals font-display">{activity.display_name}</span>
                          <span className="text-[10px] text-muted-foreground"> completed </span>
                          <span className="text-xs text-section-missions font-display">
                            {activity.mission_snapshot?.code_name || 'MISSION'}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatRelativeTime(activity.completed_at)}
                        </span>
                      </div>
                      
                      {/* Stats row */}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {activity.score_earned.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          {activity.total_weight.toLocaleString()} lbs
                        </span>
                      </div>
                      
                      {/* Prominent CTA */}
                      {activity.mission_id && (
                        <button
                          onClick={() => handleJoinMission(activity.mission_id!)}
                          className="w-full py-2 border-2 border-section-missions rounded text-xs font-display text-section-missions hover:bg-section-missions/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-3 h-3" />
                          ACCEPT CHALLENGE
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share button at bottom */}
            <div className="pt-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={shareRivalLink}
                className="w-full text-xs"
              >
                <Share2 className="w-3 h-3 mr-1" />
                CHALLENGE ANOTHER
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Remove Confirmation */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">END RIVALRY</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end your rivalry with {rivalToRemove?.name}? You can always add them back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              End Rivalry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Campaign Switch Warning */}
      <AlertDialog open={showCampaignWarning} onOpenChange={setShowCampaignWarning}>
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
              onClick={confirmCampaignSwitch}
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
