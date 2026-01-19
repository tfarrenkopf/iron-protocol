import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Skull, Clock, Users, Target, Zap, Crown, Medal, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { WeeklyBoss } from '@/hooks/useWeeklyBoss';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_damage: number;
  contribution_count: number;
  weakness_hits_count: number;
  rank: number;
}

interface BossDefeatStats {
  boss_name: string;
  max_hp: number;
  total_damage_dealt: number;
  time_to_defeat_seconds: number;
  unique_contributors: number;
  total_contributions: number;
  total_weakness_hits: number;
  defeated_at: string;
  week_start: string;
}

interface BossVictoryScreenProps {
  boss: WeeklyBoss;
  onClose: () => void;
  userId?: string;
}

export function BossVictoryScreen({ boss, onClose, userId }: BossVictoryScreenProps) {
  const [stats, setStats] = useState<BossDefeatStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch defeat stats
        const { data: statsData } = await supabase
          .rpc('get_boss_defeat_stats', { p_boss_id: boss.id });
        
        if (statsData && statsData.length > 0) {
          setStats(statsData[0] as BossDefeatStats);
        }

        // Fetch leaderboard (top 10)
        const { data: leaderboardData } = await supabase
          .from('weekly_boss_leaderboard')
          .select('*')
          .eq('boss_id', boss.id)
          .order('rank', { ascending: true })
          .limit(10);

        if (leaderboardData) {
          setLeaderboard(leaderboardData as LeaderboardEntry[]);
          
          // Find user's rank if not in top 10
          if (userId) {
            const userEntry = leaderboardData.find(e => e.user_id === userId);
            if (userEntry) {
              setUserRank(userEntry as LeaderboardEntry);
            } else {
              // Fetch user's rank separately
              const { data: userRankData } = await supabase
                .from('weekly_boss_leaderboard')
                .select('*')
                .eq('boss_id', boss.id)
                .eq('user_id', userId)
                .single();
              
              if (userRankData) {
                setUserRank(userRankData as LeaderboardEntry);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching boss defeat data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [boss.id, userId]);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-300" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 text-center text-muted-foreground font-mono">#{rank}</span>;
    }
  };

  const getContributionPercent = (damage: number) => {
    if (!stats || stats.total_damage_dealt === 0) return 0;
    return ((damage / stats.total_damage_dealt) * 100).toFixed(1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-gradient-to-b from-section-raids/20 to-background border-2 border-section-raids rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Victory Header */}
          <div className="relative p-6 text-center border-b border-section-raids/30">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="absolute inset-0 flex items-center justify-center opacity-10"
            >
              <Skull className="w-32 h-32 text-section-raids" />
            </motion.div>
            
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-xs font-bold tracking-widest text-section-raids uppercase">
                  Target Eliminated
                </span>
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
                {boss.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">THREAT NEUTRALIZED</p>
            </motion.div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-3 p-4 border-b border-section-raids/30"
            >
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-section-raids" />
                <div className="text-lg font-bold text-foreground">
                  {formatTime(stats.time_to_defeat_seconds || 0)}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Time to Kill</div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <Users className="w-5 h-5 mx-auto mb-1 text-section-raids" />
                <div className="text-lg font-bold text-foreground">
                  {stats.unique_contributors}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Operatives</div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <Zap className="w-5 h-5 mx-auto mb-1 text-section-raids" />
                <div className="text-lg font-bold text-foreground">
                  {formatNumber(stats.total_damage_dealt)}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Total Damage</div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <Target className="w-5 h-5 mx-auto mb-1 text-section-raids" />
                <div className="text-lg font-bold text-foreground">
                  {stats.total_weakness_hits}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Weakness Hits</div>
              </div>
            </motion.div>
          )}

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4"
          >
            <h3 className="text-xs font-bold tracking-widest text-section-raids uppercase mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Top Damage Dealers
            </h3>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted/20 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = userId && entry.user_id === userId;
                  
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isCurrentUser 
                          ? 'bg-section-raids/20 border border-section-raids/50' 
                          : 'bg-black/20'
                      }`}
                    >
                      <div className="w-8 flex justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-foreground">
                          {entry.display_name || 'Anonymous Operative'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-section-raids">(YOU)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.contribution_count} missions • {entry.weakness_hits_count} weakness hits
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-sm text-foreground">
                          {formatNumber(entry.total_damage)}
                        </div>
                        <div className="text-xs text-section-raids">
                          {getContributionPercent(entry.total_damage)}%
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Show user's rank if not in top 10 */}
                {userRank && userRank.rank > 10 && (
                  <>
                    <div className="text-center text-muted-foreground text-xs py-1">• • •</div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-section-raids/20 border border-section-raids/50"
                    >
                      <div className="w-8 flex justify-center">
                        {getRankIcon(userRank.rank)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-foreground">
                          {userRank.display_name || 'Anonymous Operative'}
                          <span className="ml-2 text-xs text-section-raids">(YOU)</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {userRank.contribution_count} missions • {userRank.weakness_hits_count} weakness hits
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-sm text-foreground">
                          {formatNumber(userRank.total_damage)}
                        </div>
                        <div className="text-xs text-section-raids">
                          {getContributionPercent(userRank.total_damage)}%
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="p-4 border-t border-section-raids/30"
          >
            <p className="text-center text-xs text-muted-foreground mb-3">
              A new threat emerges every Monday at 00:00 UTC
            </p>
            <Button 
              onClick={onClose}
              className="w-full bg-section-raids hover:bg-section-raids/80 text-white font-bold"
            >
              RETURN TO COMMAND
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}