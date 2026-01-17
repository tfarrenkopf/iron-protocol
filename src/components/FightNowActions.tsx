import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, Folder, Crosshair, ChevronRight, Zap, Play } from 'lucide-react';
import { useActiveCampaign, useActiveCampaignDetails } from '@/hooks/useActiveCampaign';

export function FightNowActions() {
  const navigate = useNavigate();
  const { activeCampaignId } = useActiveCampaign();
  const { campaign, completedMissionIds, isLoading } = useActiveCampaignDetails();

  // Find next mission if we have an active campaign
  const missions = campaign?.collection_missions
    ?.sort((a: any, b: any) => a.order_index - b.order_index)
    .map((cm: any) => cm.missions) || [];
  
  const nextMission = missions.find((m: any) => !completedMissionIds.has(m.id));
  const hasActiveCampaign = activeCampaignId && campaign && !isLoading;
  const totalMissions = missions.length;
  const completedCount = completedMissionIds.size;
  const isComplete = completedCount >= totalMissions && totalMissions > 0;

  const handleContinueCampaign = () => {
    if (nextMission) {
      navigate(`/workout/${nextMission.id}?campaign=${campaign?.id}`);
    } else if (missions[0]) {
      // Campaign complete, replay from start
      navigate(`/workout/${missions[0].id}?campaign=${campaign?.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="mb-6 space-y-3"
    >
      {/* Primary Action: Continue Campaign (if active) */}
      {hasActiveCampaign && (
        <button
          onClick={handleContinueCampaign}
          className="w-full group relative bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 border-2 border-accent rounded-lg p-5 text-left transition-all hover:box-glow-accent hover:from-accent/30 hover:via-accent/20 hover:to-accent/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <div>
                <div className="text-xs text-accent/70 font-display tracking-wider mb-0.5">
                  {isComplete ? 'REPLAY CAMPAIGN' : 'CONTINUE CAMPAIGN'}
                </div>
                <h2 className="font-display text-xl text-accent">{campaign?.code_name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isComplete 
                    ? `${totalMissions} missions completed • Start new run`
                    : `${completedCount}/${totalMissions} complete • ${nextMission?.code_name || 'Next mission'}`
                  }
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-accent group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}

      {/* Secondary Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Select Campaign */}
        <button
          onClick={() => navigate('/command?tab=campaigns')}
          className="group relative bg-card border-2 border-secondary/50 rounded-lg p-4 text-left transition-all hover:border-secondary hover:box-glow-secondary"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
              <Folder className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base text-secondary">
                {hasActiveCampaign ? 'SWITCH' : 'SELECT'}
              </h3>
              <p className="text-[10px] text-muted-foreground">Campaign</p>
            </div>
          </div>
        </button>

        {/* Select Mission */}
        <button
          onClick={() => navigate('/command?tab=global')}
          className="group relative bg-card border-2 border-primary/50 rounded-lg p-4 text-left transition-all hover:border-primary hover:box-glow-primary"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base text-primary">SELECT</h3>
              <p className="text-[10px] text-muted-foreground">Mission</p>
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
