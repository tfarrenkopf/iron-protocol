import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Zap, Play, Clock, Dumbbell, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Users, Trophy } from 'lucide-react';
import { useMission } from '@/hooks/useMissions';
import { useMissionStats, useMissionLeaderboard, useUserMissionRank } from '@/hooks/useMissionStats';
import { PopularityBadge, WarriorCount, MissionRankBadge, MissionLeaderboardMini, HotMissionGlow } from '@/components/SocialProof';
import { useAuth } from '@/hooks/useAuth';
import { GuestIndicator, ConversionNudge } from '@/components/AnonymousConversion';
import { GlobalNav } from '@/components/GlobalNav';

const MissionDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { missionId } = useParams();
  const { isAnonymous } = useAuth();
  const { data: mission, isLoading, error, refetch } = useMission(missionId);
  const { data: missionStats } = useMissionStats(missionId);
  const { data: leaderboard } = useMissionLeaderboard(missionId, 5);
  const { data: userRank } = useUserMissionRank(missionId);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING INTEL...</div>
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
          className="px-6 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all flex items-center gap-2"
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
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Return to Command
        </button>
      </div>
    );
  }

  const sortedExercises = mission.mission_exercises?.sort((a, b) => a.order_index - b.order_index) || [];
  const totalSets = sortedExercises.reduce((acc, me) => acc + me.target_sets, 0);
  const totalReps = sortedExercises.reduce((acc, me) => acc + (me.target_sets * me.target_reps), 0);

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

        {/* Mission title */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl text-primary">{mission.code_name}</h1>
            <PopularityBadge score={mission.popularity_score || 0} />
          </div>
          <p className="text-xs text-muted-foreground tracking-wider">
            {isAnonymous ? <GuestIndicator variant="minimal" /> : 'MISSION BRIEFING'}
          </p>
        </motion.div>


        {/* Mission Overview Card */}
        <HotMissionGlow score={mission.popularity_score || 0}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-5 mb-6"
        >
          {mission.description && (
            <p className="text-muted-foreground mb-4">{mission.description}</p>
          )}

          {/* Stats row - responsive grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <div className="font-display text-base sm:text-lg text-foreground">{mission.difficulty}</div>
              <div className="text-xs text-muted-foreground">DIFF</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <div className="font-display text-base sm:text-lg text-foreground">{mission.estimated_minutes}</div>
              <div className="text-xs text-muted-foreground">MIN</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <div className="font-display text-base sm:text-lg text-foreground">{totalSets}</div>
              <div className="text-xs text-muted-foreground">SETS</div>
            </div>
            <div className="text-center">
              <div className="font-display text-base sm:text-lg text-foreground">{totalReps}</div>
              <div className="text-xs text-muted-foreground">REPS</div>
            </div>
          </div>

          {/* Focus areas */}
          {mission.focus_areas && mission.focus_areas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mission.focus_areas.map((area) => (
                <span 
                  key={area}
                  className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground"
                >
                  {area}
                </span>
              ))}
            </div>
          )}

          {/* Difficulty bar */}
          <div className="flex gap-1 mt-4">
            {[...Array(5)].map((_, j) => (
              <div 
                key={j}
                className={`h-1 flex-1 rounded-full transition-all ${
                  j < mission.difficulty 
                    ? 'bg-gradient-to-r from-accent to-primary' 
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </motion.div>
        </HotMissionGlow>

        {/* Your Rank + Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-lg p-4 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display text-sm text-muted-foreground">MISSION RANKINGS</h3>
          </div>
          
          {userRank && userRank.userRank && (
            <div className="mb-3">
              <MissionRankBadge 
                rank={userRank.userRank} 
                totalPlayers={userRank.totalPlayers}
                bestScore={userRank.userBestScore}
              />
            </div>
          )}
          
          {leaderboard && leaderboard.length > 0 ? (
            <MissionLeaderboardMini entries={leaderboard} />
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">👑</div>
              <p className="font-display text-sm text-muted-foreground mb-1">UNCHARTED TERRITORY</p>
              <p className="text-xs text-muted-foreground">
                No one has conquered this mission yet.
              </p>
              <p className="text-xs text-section-missions mt-2 font-display">
                Be the first to claim victory!
              </p>
            </div>
          )}
        </motion.div>

        {/* Exercise List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-24"
        >
          <h2 className="font-display text-xl text-muted-foreground mb-4 tracking-wider">EXERCISE ROSTER</h2>
          
          <div className="space-y-3">
            {sortedExercises.map((missionExercise, index) => {
              const exercise = missionExercise.exercises;
              const isExpanded = expandedExercise === missionExercise.id;
              
              if (!exercise) return null;

              return (
                <motion.div
                  key={missionExercise.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedExercise(isExpanded ? null : missionExercise.id)}
                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-display text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-display text-lg text-foreground">{exercise.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {missionExercise.target_sets} sets × {missionExercise.target_reps} reps
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
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
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 border-t border-border"
                    >
                      <div className="pt-4 space-y-3">
                        {/* Equipment */}
                        {exercise.equipment && exercise.equipment.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground tracking-wider">EQUIPMENT</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {exercise.equipment.map((eq) => (
                                <span key={eq} className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                                  {eq.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Secondary muscles */}
                        {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground tracking-wider">SECONDARY MUSCLES</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {exercise.secondary_muscle_groups.map((muscle) => (
                                <span key={muscle} className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                                  {muscle}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rest time */}
                        <div>
                          <span className="text-xs text-muted-foreground tracking-wider">REST BETWEEN SETS</span>
                          <p className="text-sm text-foreground mt-1">{missionExercise.rest_between_sets_sec}s</p>
                        </div>

                        {/* Instructions */}
                        {exercise.instructions_execution && (
                          <div>
                            <span className="text-xs text-muted-foreground tracking-wider">EXECUTION</span>
                            <p className="text-sm text-foreground mt-1">{exercise.instructions_execution}</p>
                          </div>
                        )}

                        {exercise.instructions_tips && (
                          <div>
                            <span className="text-xs text-muted-foreground tracking-wider">TIPS</span>
                            <p className="text-sm text-foreground mt-1">{exercise.instructions_tips}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Start Mission Button - Fixed at bottom */}
        <motion.div
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
              className="w-full py-4 sm:py-5 bg-gradient-to-r from-primary to-accent text-primary-foreground font-display text-lg sm:text-xl rounded-lg hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 sm:gap-3 min-h-[56px]"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              BEGIN MISSION
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MissionDetail;
