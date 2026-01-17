import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, Flame, ChevronRight, Zap, Play, Clock, Dumbbell, Eye, Crosshair } from 'lucide-react';
import { useActiveCampaign, useActiveCampaignDetails } from '@/hooks/useActiveCampaign';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { formatEquipment } from '@/data/muscleGroups';

export function FightNowActions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCampaignId } = useActiveCampaign();
  const { campaign, completedMissionIds, isLoading } = useActiveCampaignDetails();

  const isGuest = !user;

  // Find next mission if we have an active campaign
  const missions = campaign?.collection_missions
    ?.sort((a: any, b: any) => a.order_index - b.order_index)
    .map((cm: any) => cm.missions) || [];
  
  const nextMission = missions.find((m: any) => !completedMissionIds.has(m.id));
  const hasActiveCampaign = activeCampaignId && campaign && !isLoading;
  const totalMissions = missions.length;
  const completedCount = completedMissionIds.size;
  const isComplete = completedCount >= totalMissions && totalMissions > 0;

  // Calculate campaign equipment
  const campaignEquipment = useMemo(() => {
    if (!campaign?.collection_missions) return [];
    const equipmentSet = new Set<string>();
    campaign.collection_missions.forEach((cm: any) => {
      cm.missions?.mission_exercises?.forEach((me: any) => {
        me.exercises?.equipment?.forEach((eq: string) => equipmentSet.add(eq));
      });
    });
    return Array.from(equipmentSet).slice(0, 3);
  }, [campaign]);

  // Calculate total time
  const totalTime = useMemo(() => {
    return missions.reduce((sum: number, m: any) => sum + (m?.estimated_minutes || 0), 0);
  }, [missions]);

  const handleContinueCampaign = () => {
    // Navigate to campaign detail page instead of directly to workout
    navigate(`/campaign/${campaign?.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="mb-6 space-y-3"
    >
      {/* Primary Action: Continue Campaign (if active and logged in) */}
      {hasActiveCampaign ? (
        <button
          onClick={handleContinueCampaign}
          className={`w-full group relative border-2 rounded-lg p-5 text-left transition-all ${
            isComplete 
              ? 'bg-gradient-to-r from-secondary/20 via-secondary/10 to-secondary/20 border-secondary hover:box-glow-secondary hover:from-secondary/30 hover:via-secondary/20 hover:to-secondary/30'
              : 'bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 border-accent hover:box-glow-accent hover:from-accent/30 hover:via-accent/20 hover:to-accent/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${isComplete ? 'bg-secondary/20' : 'bg-accent/20'}`}>
                <Zap className={`w-8 h-8 ${isComplete ? 'text-secondary' : 'text-accent'}`} />
              </div>
              <div className="flex-1">
                <div className={`text-xs font-display tracking-wider mb-0.5 ${isComplete ? 'text-secondary/70' : 'text-accent/70'}`}>
                  {isComplete ? '✓ CAMPAIGN COMPLETE' : 'ACTIVE CAMPAIGN'}
                </div>
                <h2 className={`font-display text-xl ${isComplete ? 'text-secondary' : 'text-accent'}`}>{campaign?.code_name}</h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {completedCount}/{totalMissions}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{totalTime}min
                  </span>
                </div>
                {/* Equipment preview */}
                {campaignEquipment.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Dumbbell className={`w-3 h-3 ${isComplete ? 'text-secondary/60' : 'text-accent/60'}`} />
                    <div className="flex gap-1">
                      {campaignEquipment.map(eq => (
                        <span key={eq} className={`text-[9px] px-1.5 py-0.5 rounded ${isComplete ? 'bg-secondary/10 text-secondary/80' : 'bg-accent/10 text-accent/80'}`}>
                          {formatEquipment(eq)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className={`w-6 h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ${isComplete ? 'text-secondary' : 'text-accent'}`} />
          </div>
          {/* Progress bar */}
          <div className={`mt-3 h-1 rounded-full overflow-hidden ${isComplete ? 'bg-secondary/20' : 'bg-accent/20'}`}>
            <div 
              className={`h-full rounded-full transition-all ${isComplete ? 'bg-secondary' : 'bg-accent'}`}
              style={{ width: `${totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0}%` }}
            />
          </div>
        </button>
      ) : (
        /* No active campaign - action buttons instead of empty hero */
        <>
          {/* Primary: Mission for guests, Campaign for logged-in users */}
          {isGuest ? (
            <button
              onClick={() => navigate('/command?tab=missions&source=public')}
              className="w-full group relative bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-2 border-primary rounded-lg p-5 text-left transition-all hover:box-glow-primary hover:from-primary/30 hover:via-primary/20 hover:to-primary/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <Crosshair className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-primary/70 font-display tracking-wider mb-0.5">
                      ONE-TIME STRIKE
                    </div>
                    <h2 className="font-display text-xl text-primary">FLASHPOINT STRIKE</h2>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
                      Drop in, obliterate the target, extract. No respawns, no mercy—just pure, glorious chaos.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </button>
          ) : (
            <button
              onClick={() => navigate('/command?tab=campaigns')}
              className="w-full group relative bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 border-2 border-accent rounded-lg p-5 text-left transition-all hover:box-glow-accent hover:from-accent/30 hover:via-accent/20 hover:to-accent/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/20 rounded-lg">
                    <Flame className="w-8 h-8 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-accent/70 font-display tracking-wider mb-0.5">
                      MULTI-MISSION WAR
                    </div>
                    <h2 className="font-display text-xl text-accent">SELECT CAMPAIGN</h2>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
                      Suit up, agent. A sequence of objectives—raids, extractions, strikes—all back-to-back.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-accent group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
            </button>
          )}
        </>
      )}

      {/* Secondary Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* For guests: View Campaigns as secondary */}
        {isGuest ? (
          <button
            onClick={() => navigate('/command?tab=campaigns')}
            className="group relative bg-card border-2 border-accent/50 rounded-lg p-4 text-left transition-all hover:border-accent hover:box-glow-accent"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                <Eye className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-accent">VIEW OPS</h3>
                <p className="text-[10px] text-muted-foreground">Scout campaigns</p>
              </div>
            </div>
          </button>
        ) : (
          /* For logged-in users: Mission as secondary when campaign is active */
          <button
            onClick={() => navigate('/command?tab=missions&source=public')}
            className="group relative bg-card border-2 border-primary/50 rounded-lg p-4 text-left transition-all hover:border-primary hover:box-glow-primary"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Crosshair className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-primary">FLASHPOINT</h3>
                <p className="text-[10px] text-muted-foreground">One-time strike</p>
              </div>
            </div>
          </button>
        )}

        {/* Secondary action based on state */}
        {isGuest ? (
          /* For guests: Direct mission strike */
          <button
            onClick={() => navigate('/intel')}
            className="group relative bg-card border-2 border-secondary/50 rounded-lg p-4 text-left transition-all hover:border-secondary hover:box-glow-secondary"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-secondary">INTEL</h3>
                <p className="text-[10px] text-muted-foreground">Live combat feed</p>
              </div>
            </div>
          </button>
        ) : hasActiveCampaign ? (
          /* For logged-in with active campaign: Switch campaigns */
          <button
            onClick={() => navigate('/command?tab=campaigns')}
            className="group relative bg-card border-2 border-accent/50 rounded-lg p-4 text-left transition-all hover:border-accent hover:box-glow-accent"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                <Flame className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-accent">SELECT CAMPAIGN</h3>
                <p className="text-[10px] text-muted-foreground">Switch battlefield</p>
              </div>
            </div>
          </button>
        ) : (
          /* For logged-in without campaign: Mission as second option */
          <button
            onClick={() => navigate('/command?tab=missions&source=public')}
            className="group relative bg-card border-2 border-primary/50 rounded-lg p-4 text-left transition-all hover:border-primary hover:box-glow-primary"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Crosshair className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base text-primary">FLASHPOINT</h3>
                <p className="text-[10px] text-muted-foreground">One-time strike</p>
              </div>
            </div>
          </button>
        )}
      </div>
    </motion.div>
  );
}