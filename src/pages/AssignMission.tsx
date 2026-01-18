import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Calendar, Check, X, Target, Flame, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { useCollections } from '@/hooks/useCollections';
import { useSquads } from '@/hooks/useHandlerMode';
import { useCreateAssignment } from '@/hooks/useAssignments';
import { format, addDays } from 'date-fns';
import { GlobalNav } from '@/components/GlobalNav';
import { AppFooter } from '@/components/AppFooter';

type OrderType = 'mission' | 'campaign';

const AssignMission = () => {
  const navigate = useNavigate();
  const { squadId } = useParams<{ squadId: string }>();
  const { user } = useAuth();
  const { data: missions, isLoading: missionsLoading } = useMissions({});
  const { data: collections, isLoading: collectionsLoading } = useCollections({ showSystem: true });
  const { data: squads } = useSquads();
  const createAssignment = useCreateAssignment();

  const [orderType, setOrderType] = useState<OrderType>('mission');
  const [selectedMissions, setSelectedMissions] = useState<string[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  const squad = squads?.find(s => s.id === squadId);
  const selectedMissionObjects = missions?.filter(m => selectedMissions.includes(m.id)) || [];
  const selectedCampaignObjects = collections?.filter(c => selectedCampaigns.includes(c.id)) || [];

  // Combine campaigns - show system + public
  const availableCampaigns = useMemo(() => {
    if (!collections) return [];
    return collections.filter(c => c.is_system || c.visibility === 'public' || c.created_by === user?.id);
  }, [collections, user?.id]);

  const handleToggleMission = (missionId: string) => {
    setSelectedMissions(prev => 
      prev.includes(missionId)
        ? prev.filter(id => id !== missionId)
        : [...prev, missionId]
    );
  };

  const handleToggleCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const handleRemoveMission = (missionId: string) => {
    setSelectedMissions(prev => prev.filter(id => id !== missionId));
  };

  const handleRemoveCampaign = (campaignId: string) => {
    setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
  };

  const handleAssign = async () => {
    if (!squadId) return;
    
    const hasMissions = selectedMissions.length > 0;
    const hasCampaigns = selectedCampaigns.length > 0;
    
    if (!hasMissions && !hasCampaigns) return;
    
    setError(null);

    try {
      // Assign selected missions
      for (const missionId of selectedMissions) {
        const mission = missions?.find(m => m.id === missionId);
        if (!mission) continue;

        await createAssignment.mutateAsync({
          missionSnapshot: {
            type: 'mission',
            id: mission.id,
            name: mission.name,
            code_name: mission.code_name,
            description: mission.description,
            focus_areas: mission.focus_areas,
            estimated_minutes: mission.estimated_minutes,
            difficulty: mission.difficulty,
            intro_lore: mission.intro_lore,
            outro_lore: mission.outro_lore,
            mission_exercises: mission.mission_exercises,
          },
          assigneeType: 'SQUAD',
          assigneeId: squadId,
          dueAt: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
      }

      // Assign selected campaigns
      for (const campaignId of selectedCampaigns) {
        const campaign = availableCampaigns.find(c => c.id === campaignId);
        if (!campaign) continue;

        // Get mission IDs for this campaign
        const missionIds = campaign.collection_missions?.map(cm => cm.mission_id) || [];

        await createAssignment.mutateAsync({
          missionSnapshot: {
            type: 'campaign',
            id: campaign.id,
            name: campaign.name,
            code_name: campaign.code_name,
            description: campaign.description,
            mission_count: missionIds.length,
            mission_ids: missionIds,
          },
          assigneeType: 'SQUAD',
          assigneeId: squadId,
          dueAt: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
      }

      setSuccess(true);
      setTimeout(() => navigate('/handler'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign orders');
    }
  };

  const totalOrders = selectedMissions.length + selectedCampaigns.length;

  if (success) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Check className="w-16 h-16 mx-auto mb-4 text-success" />
          </motion.div>
          <h1 className="font-display text-2xl text-success mb-2">
            {totalOrders > 1 ? 'ORDERS DISPATCHED!' : 'ORDER DISPATCHED!'}
          </h1>
          <p className="text-muted-foreground">
            {totalOrders} order{totalOrders !== 1 ? 's' : ''} assigned to {squad?.code_name}. Redirecting...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <GlobalNav 
          title="ASSIGN ORDERS"
          subtitle={`TO: ${squad?.code_name || 'SQUAD'}`}
          section="handler"
        />

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-6"
        >
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Select missions or campaigns to assign as orders. Each squad member will receive these assignments.
            </p>
          </div>
        </motion.div>

        {/* Order Type Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-6"
        >
          <button
            onClick={() => setOrderType('mission')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-display text-sm transition-all ${
              orderType === 'mission'
                ? 'bg-warning text-warning-foreground'
                : 'bg-card border border-border text-muted-foreground hover:border-warning/50'
            }`}
          >
            <Target className="w-4 h-4" />
            MISSIONS
          </button>
          <button
            onClick={() => setOrderType('campaign')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-display text-sm transition-all ${
              orderType === 'campaign'
                ? 'bg-warning text-warning-foreground'
                : 'bg-card border border-border text-muted-foreground hover:border-warning/50'
            }`}
          >
            <Flame className="w-4 h-4" />
            CAMPAIGNS
          </button>
        </motion.div>

        {/* Selected Orders Preview */}
        {(selectedMissionObjects.length > 0 || selectedCampaignObjects.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border-2 border-warning rounded-lg p-4 mb-6"
          >
            <div className="text-xs text-muted-foreground tracking-wider mb-3">
              SELECTED ORDERS ({totalOrders})
            </div>
            <div className="space-y-2">
              {selectedMissionObjects.map((mission) => (
                <div 
                  key={mission.id}
                  className="flex items-center justify-between bg-background border border-border rounded p-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Target className="w-3 h-3 text-section-missions flex-shrink-0" />
                    <span className="font-display text-sm text-warning truncate">{mission.code_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {mission.mission_exercises?.length || 0} ex
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveMission(mission.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedCampaignObjects.map((campaign) => (
                <div 
                  key={campaign.id}
                  className="flex items-center justify-between bg-background border border-border rounded p-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Flame className="w-3 h-3 text-section-campaigns flex-shrink-0" />
                    <span className="font-display text-sm text-warning truncate">{campaign.code_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {campaign.collection_missions?.length || 0} missions
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveCampaign(campaign.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Due Date */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="text-xs text-muted-foreground tracking-wider">DUE DATE (optional, applies to all)</label>
          <div className="flex gap-2 mt-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="flex-1 bg-background border border-border rounded px-3 py-2 focus:border-warning focus:outline-none"
            />
            <button
              onClick={() => setDueDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
              className="px-3 py-2 bg-muted text-muted-foreground text-xs rounded hover:bg-muted/80"
            >
              TOMORROW
            </button>
            <button
              onClick={() => setDueDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'))}
              className="px-3 py-2 bg-muted text-muted-foreground text-xs rounded hover:bg-muted/80"
            >
              1 WEEK
            </button>
          </div>
        </motion.div>

        {/* Mission Selection */}
        {orderType === 'mission' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
              // SELECT MISSIONS
            </h2>

            {missionsLoading ? (
              <div className="text-center py-8">
                <div className="font-display text-lg text-warning animate-neon-pulse">LOADING...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {missions?.map((m, i) => {
                  const isSelected = selectedMissions.includes(m.id);
                  return (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                      onClick={() => handleToggleMission(m.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-warning/10 border-warning'
                          : 'bg-card border-border hover:border-warning/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-section-missions" />
                          <span className="font-display text-sm text-warning">{m.code_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.mission_exercises?.length || 0} ex • {m.estimated_minutes}min
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-warning" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}

        {/* Campaign Selection */}
        {orderType === 'campaign' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
              // SELECT CAMPAIGNS
            </h2>

            {collectionsLoading ? (
              <div className="text-center py-8">
                <div className="font-display text-lg text-warning animate-neon-pulse">LOADING...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableCampaigns.map((c, i) => {
                  const isSelected = selectedCampaigns.includes(c.id);
                  const isExpanded = expandedCampaign === c.id;
                  const missionCount = c.collection_missions?.length || 0;

                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                      className={`rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-warning/10 border-warning'
                          : 'bg-card border-border hover:border-warning/50'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleCampaign(c.id)}
                        className="w-full text-left p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-section-campaigns" />
                            <span className="font-display text-sm text-warning">{c.code_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {missionCount} missions
                            </span>
                            {c.is_system && (
                              <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                SYSTEM
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="w-4 h-4 text-warning" />}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCampaign(isExpanded ? null : c.id);
                              }}
                              className="p-1 text-muted-foreground hover:text-warning"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </button>
                      
                      {isExpanded && c.collection_missions && c.collection_missions.length > 0 && (
                        <div className="px-3 pb-3 pt-0">
                          <div className="border-t border-border pt-2 mt-1">
                            <div className="text-xs text-muted-foreground mb-1">MISSIONS INCLUDED:</div>
                            <div className="flex flex-wrap gap-1">
                              {c.collection_missions.slice(0, 6).map((cm: any) => (
                                <span 
                                  key={cm.id}
                                  className="text-xs px-1.5 py-0.5 bg-section-missions/10 border border-section-missions/20 rounded text-section-missions"
                                >
                                  {cm.missions?.code_name || 'Mission'}
                                </span>
                              ))}
                              {c.collection_missions.length > 6 && (
                                <span className="text-xs text-muted-foreground">
                                  +{c.collection_missions.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Assign Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={handleAssign}
            disabled={totalOrders === 0 || createAssignment.isPending}
            className="w-full py-4 bg-warning text-warning-foreground font-display text-lg rounded flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: totalOrders > 0 ? '0 0 20px hsl(var(--warning) / 0.4)' : 'none' }}
          >
            <Send className="w-5 h-5" />
            {createAssignment.isPending ? 'DISPATCHING...' : `DISPATCH ${totalOrders || 0} ORDER${totalOrders !== 1 ? 'S' : ''}`}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            {squad?.squad_members?.length || 0} agents will receive {totalOrders > 1 ? 'these orders' : 'this order'}
          </p>
        </motion.div>

        <AppFooter />
      </div>
    </div>
  );
};

export default AssignMission;