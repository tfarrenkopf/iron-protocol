import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, Clock, Dumbbell, ChevronDown, ChevronUp, RefreshCw, AlertCircle, 
  Trophy, Crown, Zap, Target, Calendar, Flame, Crosshair
} from 'lucide-react';
import { useMission } from '@/hooks/useMissions';
import { useMissionStats, useMissionLeaderboard, useUserMissionRank } from '@/hooks/useMissionStats';
import { PopularityBadge, MissionLeaderboardMini } from '@/components/SocialProof';
import { useAuth } from '@/hooks/useAuth';
import { GuestIndicator, ConversionNudge } from '@/components/AnonymousConversion';
import { GlobalNav } from '@/components/GlobalNav';
import { supabase } from '@/integrations/supabase/client';
import { formatEquipment } from '@/data/muscleGroups';

const MissionDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { missionId } = useParams();
  const { user, isAnonymous } = useAuth();
  const { data: mission, isLoading, error, refetch } = useMission(missionId);
  const { data: missionStats } = useMissionStats(missionId);
  const { data: leaderboard } = useMissionLeaderboard(missionId, 5);
  const { data: userRank } = useUserMissionRank(missionId);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const exerciseRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const bottomBarRef = useRef<HTMLDivElement | null>(null);

  const handleExpandExercise = useCallback((exerciseId: string) => {
    const isCurrentlyExpanded = expandedExercise === exerciseId;
    setExpandedExercise(isCurrentlyExpanded ? null : exerciseId);

    // The CTA bar is fixed to the bottom; ensure expanded content isn't hidden behind it.
    if (!isCurrentlyExpanded) {
      window.setTimeout(() => {
        const element = exerciseRefs.current.get(exerciseId);
        if (!element) return;

        const bottomBarHeight = bottomBarRef.current?.getBoundingClientRect().height ?? 0;
        const safeBottom = Math.min(window.innerHeight * 0.45, bottomBarHeight + 24);
        const viewportBottom = window.innerHeight - safeBottom;

        const rect = element.getBoundingClientRect();
        if (rect.bottom > viewportBottom) {
          const delta = rect.bottom - viewportBottom + 8;
          window.scrollBy({ top: delta, behavior: 'smooth' });
        }
      }, 240);
    }
  }, [expandedExercise]);

  // Fetch user's stats for this mission (completions + forfeits)
  const { data: userMissionStats } = useQuery({
    queryKey: ['user-mission-stats', missionId, user?.id],
    queryFn: async () => {
      if (!user || !missionId) return null;
      
      // Get completion count and last completion
      const { data: completions, error: completionError } = await supabase
        .from('workout_sessions')
        .select('completed_at, score_earned, total_weight, max_combo, damage_dealt')
        .eq('user_id', user.id)
        .eq('mission_id', missionId)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false });
      
      if (completionError) return null;
      
      // Get forfeit count (ABORTED or FAILED)
      const { count: forfeitCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('mission_id', missionId)
        .in('status', ['ABORTED', 'FAILED']);
      
      const lastCompletion = completions?.[0] || null;
      const bestScore = completions?.length 
        ? Math.max(...completions.map(c => c.score_earned))
        : null;
      const totalDamage = completions?.reduce((sum, c) => sum + (c.damage_dealt || 0), 0) || 0;
      
      return {
        lastCompletion,
        completionCount: completions?.length || 0,
        forfeitCount: forfeitCount || 0,
        bestScore,
        totalDamage,
      };
    },
    enabled: !!user && !!missionId,
  });

  const lastCompletion = userMissionStats?.lastCompletion;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-section-missions animate-neon-pulse">LOADING INTEL...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <div className="font-display text-2xl text-destructive">TRANSMISSION FAILED</div>
        <p className="text-muted-foreground text-sm text-center">Unable to load mission intel. Check your connection.</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-3 bg-section-missions text-section-missions-foreground font-display rounded hover:opacity-90 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          RETRY
        </button>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="font-display text-2xl text-destructive">MISSION NOT FOUND</div>
        <button
          onClick={() => navigate('/command')}
          className="text-sm text-muted-foreground hover:text-section-missions"
        >
          Return to Command
        </button>
      </div>
    );
  }

  const sortedExercises = mission.mission_exercises?.sort((a, b) => a.order_index - b.order_index) || [];
  const totalSets = sortedExercises.reduce((acc, me) => acc + me.target_sets, 0);
  const totalReps = sortedExercises.reduce((acc, me) => acc + (me.target_sets * me.target_reps), 0);
  const hasCompletedBefore = !!lastCompletion;
  const totalPlayers = missionStats?.uniquePlayers || userRank?.totalPlayers || 0;

  // Get CTA text based on user state
  const getCtaText = () => {
    if (isAnonymous) return 'DEPLOY (GUEST)';
    if (hasCompletedBefore) return 'DEPLOY AGAIN';
    return 'BEGIN MISSION';
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <GlobalNav 
          backTo={(() => {
            const searchParams = new URLSearchParams(location.search);
            const campaignId = searchParams.get('campaignId');
            return campaignId ? `/campaign/${campaignId}` : '/command?tab=missions';
          })()}
        />

        {/* Compact Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl text-section-missions">{mission.code_name}</h1>
                <PopularityBadge score={mission.popularity_score || 0} />
              </div>
              {/* Description below title */}
              {mission.description && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                  {mission.description}
                </p>
              )}
            </div>
            
            {/* Difficulty indicator - compact */}
            <div className="flex flex-col items-end flex-shrink-0">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <div 
                    key={j}
                    className={`w-2 h-4 rounded-sm transition-all ${
                      j < mission.difficulty 
                        ? 'bg-gradient-to-t from-section-missions to-accent' 
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground mt-1">DIFF {mission.difficulty}/5</span>
            </div>
          </div>
        </motion.div>

        {/* Compact Stats Row - includes focus areas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-3 bg-card border border-border rounded-lg mb-4"
        >
          <div className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-display text-foreground">{mission.estimated_minutes}</span>
              <span className="text-muted-foreground text-xs">min</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
              <span className="font-display text-foreground">{sortedExercises.length}</span>
              <span className="text-muted-foreground text-xs">exercises</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="font-display text-foreground">{totalSets}</span>
              <span className="text-muted-foreground text-xs">sets</span>
            </div>
            {totalPlayers > 0 && (
              <>
                <div className="w-px h-4 bg-border hidden sm:block" />
                <div className="hidden sm:flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-muted-foreground" />
                  <span className="font-display text-foreground">{totalPlayers}</span>
                  <span className="text-muted-foreground text-xs">warriors</span>
                </div>
              </>
            )}
          </div>
          
          {/* Focus Areas - inside the stats box */}
          {mission.focus_areas && mission.focus_areas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border">
              {mission.focus_areas.map((area) => (
                <span 
                  key={area}
                  className="text-xs px-2 py-0.5 bg-section-missions/10 border border-section-missions/30 rounded text-section-missions uppercase"
                >
                  {area}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Combat Record + Leaderboard - Compact 2-column grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          {/* Your Stats */}
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="w-3.5 h-3.5 text-section-missions" />
              <span className="text-xs font-display text-muted-foreground">YOUR STATS</span>
            </div>
            
            {isAnonymous ? (
              // Mock data for guests
              <div className="space-y-1 relative">
                <div className="blur-[2px] opacity-60">
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">2h ago</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Trophy className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">4,250</span>
                    <span className="text-muted-foreground">pts</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Zap className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">3</span>
                    <span className="text-muted-foreground">completions</span>
                  </div>
                </div>
                <p className="text-xs text-section-missions absolute inset-0 flex items-center justify-center">Sign in to track</p>
              </div>
            ) : userMissionStats?.completionCount ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{formatTimeAgo(lastCompletion.completed_at)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Trophy className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{(userMissionStats.bestScore || 0).toLocaleString()}</span>
                  <span className="text-muted-foreground">best</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="w-3 h-3 text-muted-foreground" />
                  <span className="text-foreground">{userMissionStats.completionCount}</span>
                  <span className="text-muted-foreground">completions</span>
                </div>
                {userMissionStats.forfeitCount > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <AlertCircle className="w-3 h-3 text-destructive/70" />
                    <span className="text-destructive/70">{userMissionStats.forfeitCount}</span>
                    <span className="text-muted-foreground">forfeits</span>
                  </div>
                )}
                {userRank?.userRank && (
                  <div className="flex items-center gap-1 text-xs">
                    <Crown className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">#{userRank.userRank}</span>
                    <span className="text-muted-foreground">/ {userRank.totalPlayers}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Not yet attempted</p>
            )}
          </div>

          {/* Leaderboard Preview */}
          <div 
            className={`bg-card border border-border rounded-lg p-3 ${!isAnonymous ? 'cursor-pointer hover:bg-muted/30' : ''} transition-colors`}
            onClick={() => !isAnonymous && setShowLeaderboard(!showLeaderboard)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-section-missions" />
                <span className="text-xs font-display text-muted-foreground">TOP DAMAGE</span>
              </div>
              {!isAnonymous && (showLeaderboard ? (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ))}
            </div>
            
            {isAnonymous ? (
              // Mock leaderboard for guests
              <div className="space-y-1 relative">
                <div className="blur-[2px] opacity-60">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-display text-yellow-500">#1</span>
                    <span className="text-foreground truncate flex-1">GHOST_WOLF</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-display text-muted-foreground">#2</span>
                    <span className="text-foreground truncate flex-1">IRON_VIPER</span>
                  </div>
                </div>
                <p className="text-xs text-section-missions mt-1">Sign in to compete</p>
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-1">
                {leaderboard.slice(0, 2).map((entry, idx) => (
                  <div key={entry.rank} className="flex items-center gap-2 text-xs">
                    <span className={`font-display ${idx === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      #{entry.rank}
                    </span>
                    <span className="text-foreground truncate flex-1">{entry.displayName || 'Anonymous'}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Tap to see more</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">No survivors yet</p>
                <p className="text-xs text-section-missions mt-1">Be first!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Expanded Leaderboard */}
        <AnimatePresence>
          {showLeaderboard && !isAnonymous && leaderboard && leaderboard.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-card border border-section-missions/30 rounded-lg p-4">
                <MissionLeaderboardMini entries={leaderboard} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exercise Roster - Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-24"
        >
          <h2 className="font-display text-sm text-muted-foreground mb-3 tracking-wider flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-section-exercises" />
            EXERCISE ROSTER
          </h2>
          
          <div className="space-y-2">
            {sortedExercises.map((missionExercise, index) => {
              const exercise = missionExercise.exercises;
              const isExpanded = expandedExercise === missionExercise.id;
              
              if (!exercise) return null;

              return (
                <motion.div
                  key={missionExercise.id}
                  ref={(el) => {
                    if (el) exerciseRefs.current.set(missionExercise.id, el);
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => handleExpandExercise(missionExercise.id)}
                    className="w-full p-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-section-exercises/20 flex items-center justify-center font-display text-sm text-section-exercises flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-base text-foreground truncate">{exercise.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {missionExercise.target_sets} sets × {missionExercise.target_reps} reps
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground hidden sm:block">
                          {exercise.primary_muscle_group}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-2 border-t border-border space-y-2.5">
                          {/* Muscle group on mobile */}
                          <div className="sm:hidden">
                            <span className="text-xs text-muted-foreground">PRIMARY: </span>
                            <span className="text-xs text-foreground">{exercise.primary_muscle_group}</span>
                          </div>

                          {/* Equipment */}
                          {exercise.equipment && exercise.equipment.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground tracking-wider">EQUIPMENT</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {exercise.equipment.map((eq) => (
                                  <span key={eq} className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                                    {formatEquipment(eq)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Secondary muscles */}
                          {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground tracking-wider">SECONDARY</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {exercise.secondary_muscle_groups.map((muscle) => (
                                  <span key={muscle} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                                    {muscle}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Rest time */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">REST:</span>
                            <span className="text-xs text-foreground">{missionExercise.rest_between_sets_sec}s between sets</span>
                          </div>

                          {/* Instructions */}
                          {exercise.instructions_execution && (
                            <div>
                              <span className="text-xs text-muted-foreground tracking-wider">EXECUTION</span>
                              <p className="text-xs text-foreground mt-1 leading-relaxed">{exercise.instructions_execution}</p>
                            </div>
                          )}

                          {exercise.instructions_tips && (
                            <div>
                              <span className="text-xs text-muted-foreground tracking-wider">TIPS</span>
                              <p className="text-xs text-foreground mt-1 leading-relaxed">{exercise.instructions_tips}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Start Mission Button - Fixed at bottom */}
        <motion.div
          ref={bottomBarRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent"
        >
          <div className="container mx-auto max-w-3xl space-y-2">
            {isAnonymous && (
              <ConversionNudge 
                message="Progress won't be saved in guest mode" 
              />
            )}
            <button
              onClick={() => {
                const searchParams = new URLSearchParams(location.search);
                const campaignId = searchParams.get('campaignId');
                navigate(`/workout/${missionId}${campaignId ? `?campaignId=${campaignId}` : ''}`);
              }}
              className="w-full py-4 bg-gradient-to-r from-section-missions to-accent text-primary-foreground font-display text-lg rounded-lg hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 min-h-[56px]"
            >
              <Play className="w-5 h-5" />
              {getCtaText()}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MissionDetail;
