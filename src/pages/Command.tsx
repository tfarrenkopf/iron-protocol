import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Target, Dumbbell, Flame, Filter, X, Clock, Plus, Pencil, Trash2, RefreshCw, AlertCircle, Crown } from 'lucide-react';
import { GlobalNav } from '@/components/GlobalNav';
import { useMissions, useDeleteMission } from '@/hooks/useMissions';
import { useCollections, useDeleteCollection, CollectionWithMissions } from '@/hooks/useCollections';
import { useExercises, useDeleteExercise } from '@/hooks/useExercises';
import { useAuth } from '@/hooks/useAuth';
import { MissionCard } from '@/components/MissionCard';
import { AddToCollectionButton } from '@/components/AddToCollectionButton';
import { CollectionFormDialog } from '@/components/CollectionFormDialog';
import { ExerciseCard } from '@/components/ExerciseCard';
import { FOCUS_AREAS, getMusclesForFocusArea, formatEquipment, EQUIPMENT_OPTIONS } from '@/data/muscleGroups';
import { CollectionFilter } from '@/components/CollectionFilter';
import { useActiveCampaign } from '@/hooks/useActiveCampaign';
import { ActiveCampaignHero } from '@/components/ActiveCampaignHero';
import { TodayMissionsWidget } from '@/components/TodayMissionsWidget';
import { CampaignCard } from '@/components/CampaignCard';
import { SourceToggle } from '@/components/SourceToggle';
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

type TabType = 'campaigns' | 'missions' | 'exercises';
type Source = 'public' | 'personal';
type CampaignSource = 'standard' | 'personal' | 'community';

const DURATION_FILTERS = [
  { label: 'Quick', value: 'short', max: 20 },
  { label: 'Standard', value: 'medium', min: 20, max: 40 },
  { label: 'Extended', value: 'long', min: 40 },
];

const Command = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAnonymous } = useAuth();
  
  // Tab state - default to campaigns
  const urlTab = searchParams.get('tab');
  const initialTab = (urlTab === 'browse' || urlTab === 'global') ? 'missions' : (urlTab as TabType) || 'campaigns';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  
  // Source toggle state (public vs personal for missions)
  const urlSource = searchParams.get('source');
  const [source, setSource] = useState<Source>((urlSource as Source) || 'public');
  
  // Campaign source toggle (standard, personal, community)
  const urlCampaignSource = searchParams.get('campaignSource');
  const [campaignSource, setCampaignSource] = useState<CampaignSource>((urlCampaignSource as CampaignSource) || 'standard');
  
  const { activeCampaignId } = useActiveCampaign();
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [focusFilter, setFocusFilter] = useState<string>(searchParams.get('focus') || '');
  const [muscleFilter, setMuscleFilter] = useState<string>(searchParams.get('muscle') || '');
  const [equipmentFilter, setEquipmentFilter] = useState<string>(searchParams.get('equipment') || '');
  const [durationFilter, setDurationFilter] = useState<string>(searchParams.get('duration') || '');
  const [collectionFilter, setCollectionFilter] = useState<string>(searchParams.get('collection') || '');
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'mission' | 'exercise' | 'campaign' } | null>(null);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null);
  
  // Data hooks
  const { data: missions, isLoading: missionsLoading, error: missionsError, refetch: refetchMissions } = useMissions({
    focusArea: focusFilter || undefined,
    muscleGroup: muscleFilter || undefined,
    equipment: equipmentFilter || undefined,
    showOnlyPublic: !user,
  });
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const { data: exercises, isLoading: exercisesLoading } = useExercises();
  
  const deleteMission = useDeleteMission();
  const deleteCollection = useDeleteCollection();
  const deleteExercise = useDeleteExercise();
  
  // Filtered data
  const publicMissions = missions?.filter(m => m.is_public) || [];
  const myMissions = missions?.filter(m => m.created_by === user?.id) || [];
  const publicExercises = exercises?.filter(e => e.is_public) || [];
  const myExercises = exercises?.filter(e => e.created_by === user?.id) || [];
  const myCollections = collections?.filter(c => !c.is_system && c.created_by === user?.id) || [];
  const systemCollections = collections?.filter(c => c.is_system) || [];
  const publicCollections = collections?.filter(c => !c.is_system && c.visibility === 'public' && c.created_by !== user?.id) || [];
  
  // Display exercises based on source and filters
  const displayExercises = useMemo(() => {
    let exerciseList = source === 'public' ? publicExercises : myExercises;
    
    // Apply equipment filter
    if (equipmentFilter) {
      exerciseList = exerciseList.filter(e => e.equipment?.includes(equipmentFilter as any));
    }
    
    // Apply muscle filter
    if (muscleFilter) {
      exerciseList = exerciseList.filter(e => e.primary_muscle_group === muscleFilter);
    }
    
    // Apply focus filter
    if (focusFilter) {
      exerciseList = exerciseList.filter(e => e.focus_areas?.includes(focusFilter));
    }
    
    return exerciseList;
  }, [source, publicExercises, myExercises, equipmentFilter, muscleFilter, focusFilter]);
  
  // Active campaign at top
  const activeCampaign = collections?.find(c => c.id === activeCampaignId);
  
  // Filter campaigns by source and apply duration/focus filters
  const filteredCampaigns = useMemo(() => {
    let campaigns: CollectionWithMissions[] = [];
    
    if (campaignSource === 'standard') {
      campaigns = systemCollections;
    } else if (campaignSource === 'personal') {
      campaigns = myCollections;
    } else if (campaignSource === 'community') {
      campaigns = publicCollections;
    }
    
    // Apply duration filter to campaigns
    if (durationFilter) {
      const durationConfig = DURATION_FILTERS.find(d => d.value === durationFilter);
      if (durationConfig) {
        campaigns = campaigns.filter(c => {
          const totalTime = c.collection_missions?.reduce((sum, cm) => {
            const mission = (cm as any).missions;
            return sum + (mission?.estimated_minutes || 0);
          }, 0) || 0;
          
          if (durationConfig.max && !durationConfig.min) return totalTime < durationConfig.max;
          if (durationConfig.min && !durationConfig.max) return totalTime >= durationConfig.min;
          if (durationConfig.min && durationConfig.max) return totalTime >= durationConfig.min && totalTime < durationConfig.max;
          return true;
        });
      }
    }
    
    // Apply focus area filter
    if (focusFilter) {
      campaigns = campaigns.filter(c => {
        const focusAreas = new Set<string>();
        c.collection_missions?.forEach(cm => {
          const mission = (cm as any).missions;
          mission?.focus_areas?.forEach((f: string) => focusAreas.add(f));
        });
        return focusAreas.has(focusFilter);
      });
    }
    
    // Always put active campaign at top if it's in current view
    if (activeCampaign && campaigns.find(c => c.id === activeCampaignId)) {
      campaigns = [activeCampaign, ...campaigns.filter(c => c.id !== activeCampaignId)];
    }
    
    return campaigns;
  }, [campaignSource, systemCollections, myCollections, publicCollections, activeCampaign, activeCampaignId, durationFilter, focusFilter]);
  
  const availableMuscles = getMusclesForFocusArea(focusFilter || null);
  
  // Sync tab to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', activeTab);
    params.set('source', source);
    params.set('campaignSource', campaignSource);
    if (focusFilter) params.set('focus', focusFilter);
    else params.delete('focus');
    if (muscleFilter) params.set('muscle', muscleFilter);
    else params.delete('muscle');
    if (equipmentFilter) params.set('equipment', equipmentFilter);
    else params.delete('equipment');
    if (durationFilter) params.set('duration', durationFilter);
    else params.delete('duration');
    if (collectionFilter) params.set('collection', collectionFilter);
    else params.delete('collection');
    setSearchParams(params, { replace: true });
  }, [activeTab, source, campaignSource, focusFilter, muscleFilter, equipmentFilter, durationFilter, collectionFilter]);
  
  // Clear muscle filter if not available
  useEffect(() => {
    if (muscleFilter && !availableMuscles.includes(muscleFilter as any)) {
      setMuscleFilter('');
    }
  }, [focusFilter, availableMuscles, muscleFilter]);
  
  // Get mission IDs from selected collection
  const collectionMissionIds = useMemo(() => {
    if (!collectionFilter || !collections) return null;
    const selectedCollection = collections.find(c => c.id === collectionFilter);
    if (!selectedCollection) return null;
    return new Set(selectedCollection.collection_missions?.map(cm => cm.mission_id) || []);
  }, [collectionFilter, collections]);
  
  // Get displayed missions based on source
  const displayMissions = source === 'public' ? publicMissions : myMissions;
  
  // Apply all filters to missions
  let filteredMissions = displayMissions;
  if (collectionMissionIds && filteredMissions) {
    filteredMissions = filteredMissions.filter(m => collectionMissionIds.has(m.id));
  }
  if (durationFilter && filteredMissions) {
    const durationConfig = DURATION_FILTERS.find(d => d.value === durationFilter);
    if (durationConfig) {
      filteredMissions = filteredMissions.filter(m => {
        const mins = m.estimated_minutes;
        if (durationConfig.max && !durationConfig.min) return mins < durationConfig.max;
        if (durationConfig.min && !durationConfig.max) return mins >= durationConfig.min;
        if (durationConfig.min && durationConfig.max) return mins >= durationConfig.min && mins < durationConfig.max;
        return true;
      });
    }
  }
  // Apply equipment filter to missions (check if any exercise in mission uses the equipment)
  if (equipmentFilter && filteredMissions) {
    filteredMissions = filteredMissions.filter(m => {
      const missionEquipment = m.mission_exercises?.flatMap(me => me.exercises?.equipment || []) || [];
      return missionEquipment.includes(equipmentFilter as any);
    });
  }
  
  const hasFilters = focusFilter || muscleFilter || equipmentFilter || durationFilter || collectionFilter;
  
  const clearFilters = () => {
    setFocusFilter('');
    setMuscleFilter('');
    setEquipmentFilter('');
    setDurationFilter('');
    setCollectionFilter('');
  };
  
  const handleDeleteClick = (id: string, name: string, type: 'mission' | 'exercise' | 'campaign') => {
    setItemToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'mission') {
        await deleteMission.mutateAsync(itemToDelete.id);
      } else if (itemToDelete.type === 'exercise') {
        await deleteExercise.mutateAsync(itemToDelete.id);
      } else if (itemToDelete.type === 'campaign') {
        await deleteCollection.mutateAsync(itemToDelete.id);
      }
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  const handleEditMission = (e: React.MouseEvent, missionId: string) => {
    e.stopPropagation();
    navigate(`/exercises?editMission=${missionId}&returnTo=command`);
  };
  
  const handleEditExercise = (exerciseId: string) => {
    navigate(`/exercises?editExercise=${exerciseId}&returnTo=command`);
  };
  
  const tabs: { id: TabType; label: string; icon: typeof Target }[] = [
    { id: 'campaigns', label: 'CAMPAIGNS', icon: Flame },
    { id: 'missions', label: 'MISSIONS', icon: Target },
    { id: 'exercises', label: 'EXERCISES', icon: Dumbbell },
  ];
  
  // Create button config - always available based on active tab (for logged in users)
  const getCreateButtonConfig = () => {
    if (activeTab === 'missions') {
      return { label: 'New Mission', onClick: () => navigate('/exercises?newMission=true&returnTo=command') };
    }
    if (activeTab === 'campaigns') {
      return { label: 'New Campaign', onClick: () => setCampaignDialogOpen(true) };
    }
    if (activeTab === 'exercises') {
      return { label: 'New Exercise', onClick: () => navigate('/exercises?newExercise=true&returnTo=command') };
    }
    return null;
  };
  
  const createConfig = getCreateButtonConfig();

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <GlobalNav 
          title="COMMAND"
          subtitle="MISSION CONTROL & ARSENAL"
          showBack={true}
          section="command"
        />

        {/* Tab Navigation with Filter & Create Actions */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              // Hide exercises tab for guests
              if (tab.id === 'exercises' && !user) return null;
              
              // Section-specific colors for each tab
              const tabColors = {
                campaigns: { active: 'bg-section-campaigns text-white border-section-campaigns', inactive: 'hover:border-section-campaigns/50' },
                missions: { active: 'bg-section-missions text-white border-section-missions', inactive: 'hover:border-section-missions/50' },
                exercises: { active: 'bg-section-command text-white border-section-command', inactive: 'hover:border-section-command/50' },
              };
              const colors = tabColors[tab.id];
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-display text-sm whitespace-nowrap transition-all border-2 ${
                    isActive
                      ? colors.active
                      : `border-border text-muted-foreground hover:text-foreground ${colors.inactive}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          {/* Action Buttons - aligned right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition-colors ${
                hasFilters 
                  ? activeTab === 'campaigns' 
                    ? 'border-section-campaigns text-section-campaigns bg-section-campaigns/10'
                    : activeTab === 'missions'
                    ? 'border-section-missions text-section-missions bg-section-missions/10'
                    : 'border-section-command text-section-command bg-section-command/10'
                  : activeTab === 'campaigns'
                  ? 'border-border text-muted-foreground hover:border-section-campaigns hover:text-section-campaigns'
                  : activeTab === 'missions'
                  ? 'border-border text-muted-foreground hover:border-section-missions hover:text-section-missions'
                  : 'border-border text-muted-foreground hover:border-section-command hover:text-section-command'
              }`}
              aria-label="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            {/* Create button - always visible for logged in users */}
            {user && createConfig && (
              <button
                onClick={createConfig.onClick}
                className={`p-2 border rounded-lg transition-colors ${
                  activeTab === 'campaigns'
                    ? 'border-section-campaigns text-section-campaigns hover:bg-section-campaigns/10'
                    : activeTab === 'missions'
                    ? 'border-section-missions text-section-missions hover:bg-section-missions/10'
                    : 'border-section-command text-section-command hover:bg-section-command/10'
                }`}
                title={createConfig.label}
                aria-label={createConfig.label}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Source Toggle (for missions tab) */}
        {activeTab === 'missions' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            {/* Mission instruction */}
            <div className="mb-3 p-3 bg-section-missions/5 border border-section-missions/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <span className="text-section-missions font-display">MISSIONS</span> are single combat ops. Pick one. Execute. Get stronger.
              </p>
            </div>
            {user && (
              <SourceToggle 
                value={source} 
                onChange={setSource}
                publicLabel="GLOBAL"
                personalLabel="MY MISSIONS"
                section="missions"
              />
            )}
          </motion.div>
        )}

        {/* Campaign Source Toggle */}
        {activeTab === 'campaigns' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            {/* Campaign instruction */}
            <div className="mb-3 p-3 bg-section-campaigns/5 border border-section-campaigns/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <span className="text-section-campaigns font-display">CAMPAIGNS</span> are multi-mission operations. Commit to one. Complete all missions. Earn glory.
              </p>
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setCampaignSource('standard')}
                className={`flex-1 py-2.5 font-display text-xs transition-colors ${
                  campaignSource === 'standard' 
                    ? 'bg-section-campaigns text-white' 
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                STANDARD
              </button>
              {user && (
                <button
                  onClick={() => setCampaignSource('personal')}
                  className={`flex-1 py-2.5 font-display text-xs transition-colors border-x border-border ${
                    campaignSource === 'personal' 
                      ? 'bg-section-campaigns text-white' 
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  MY OPS
                </button>
              )}
              <button
                onClick={() => setCampaignSource('community')}
                className={`flex-1 py-2.5 font-display text-xs transition-colors ${
                  campaignSource === 'community' 
                    ? 'bg-section-campaigns text-white' 
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                COMMUNITY
              </button>
            </div>
          </motion.div>
        )}

        {/* Filter Sheet (Mobile-friendly) */}
        {showFilters && (activeTab === 'missions' || activeTab === 'campaigns' || activeTab === 'exercises') && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setShowFilters(false)}
            />
            
            {/* Filter Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className={`fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col ${
                activeTab === 'campaigns' ? 'border-section-campaigns' : activeTab === 'missions' ? 'border-section-missions' : 'border-section-command'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Filter className={`w-4 h-4 ${activeTab === 'campaigns' ? 'text-section-campaigns' : activeTab === 'missions' ? 'text-section-missions' : 'text-section-command'}`} />
                  <span className={`font-display text-lg ${activeTab === 'campaigns' ? 'text-section-campaigns' : activeTab === 'missions' ? 'text-section-missions' : 'text-section-command'}`}>
                    {activeTab === 'campaigns' ? 'CAMPAIGN FILTERS' : activeTab === 'exercises' ? 'EXERCISE FILTERS' : 'MISSION FILTERS'}
                  </span>
                  {hasFilters && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'campaigns' ? 'bg-section-campaigns/20 text-section-campaigns' : activeTab === 'missions' ? 'bg-section-missions/20 text-section-missions' : 'bg-section-command/20 text-section-command'}`}>
                      {[focusFilter, muscleFilter, equipmentFilter, durationFilter, collectionFilter].filter(Boolean).length} active
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* CAMPAIGNS: Duration, Focus Area */}
                {activeTab === 'campaigns' && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider font-display flex items-center gap-1">
                        <Clock className="w-3 h-3" /> DURATION
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DURATION_FILTERS.map(duration => (
                          <button
                            key={duration.value}
                            onClick={() => setDurationFilter(durationFilter === duration.value ? '' : duration.value)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              durationFilter === duration.value
                                ? 'bg-section-campaigns text-white border-section-campaigns'
                                : 'bg-background border-border hover:border-section-campaigns/50'
                            }`}
                          >
                            {duration.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider font-display">FOCUS AREA</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {FOCUS_AREAS.map(area => (
                          <button
                            key={area}
                            onClick={() => setFocusFilter(focusFilter === area ? '' : area)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              focusFilter === area
                                ? 'bg-section-campaigns text-white border-section-campaigns'
                                : 'bg-background border-border hover:border-section-campaigns/50'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {/* MISSIONS: Duration, Equipment, Focus Area, Collection, Muscle */}
                {activeTab === 'missions' && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider font-display flex items-center gap-1">
                        <Clock className="w-3 h-3" /> DURATION
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DURATION_FILTERS.map(duration => (
                          <button
                            key={duration.value}
                            onClick={() => setDurationFilter(durationFilter === duration.value ? '' : duration.value)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              durationFilter === duration.value
                                ? 'bg-section-missions text-white border-section-missions'
                                : 'bg-background border-border hover:border-section-missions/50'
                            }`}
                          >
                            {duration.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider font-display">EQUIPMENT</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {EQUIPMENT_OPTIONS.map(equip => (
                          <button
                            key={equip}
                            onClick={() => setEquipmentFilter(equipmentFilter === equip ? '' : equip)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              equipmentFilter === equip
                                ? 'bg-section-missions text-white border-section-missions'
                                : 'bg-background border-border hover:border-section-missions/50'
                            }`}
                          >
                            {formatEquipment(equip)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider font-display">FOCUS AREA</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {FOCUS_AREAS.map(area => (
                          <button
                            key={area}
                            onClick={() => setFocusFilter(focusFilter === area ? '' : area)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              focusFilter === area
                                ? 'bg-section-missions text-white border-section-missions'
                                : 'bg-background border-border hover:border-section-missions/50'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <CollectionFilter selectedCollectionId={collectionFilter} onSelect={setCollectionFilter} />

                    {availableMuscles.length > 0 && (
                      <div>
                        <label className="text-xs text-muted-foreground tracking-wider font-display">PRIMARY MUSCLE</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {availableMuscles.map(muscle => (
                            <button
                              key={muscle}
                              onClick={() => setMuscleFilter(muscleFilter === muscle ? '' : muscle)}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                muscleFilter === muscle
                                  ? 'bg-section-missions text-white border-section-missions'
                                  : 'bg-background border-border hover:border-section-missions/50'
                              }`}
                            >
                              {muscle}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* EXERCISES: Equipment, Primary Muscle, Focus Area */}
                {activeTab === 'exercises' && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider font-display">EQUIPMENT</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {EQUIPMENT_OPTIONS.map(equip => (
                          <button
                            key={equip}
                            onClick={() => setEquipmentFilter(equipmentFilter === equip ? '' : equip)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              equipmentFilter === equip
                                ? 'bg-section-command text-background border-section-command'
                                : 'bg-background border-border hover:border-section-command/50'
                            }`}
                          >
                            {formatEquipment(equip)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {availableMuscles.length > 0 && (
                      <div>
                        <label className="text-xs text-muted-foreground tracking-wider font-display">PRIMARY MUSCLE</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {availableMuscles.map(muscle => (
                            <button
                              key={muscle}
                              onClick={() => setMuscleFilter(muscleFilter === muscle ? '' : muscle)}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                muscleFilter === muscle
                                  ? 'bg-section-command text-background border-section-command'
                                  : 'bg-background border-border hover:border-section-command/50'
                              }`}
                            >
                              {muscle}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider font-display">FOCUS AREA</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {FOCUS_AREAS.map(area => (
                          <button
                            key={area}
                            onClick={() => setFocusFilter(focusFilter === area ? '' : area)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              focusFilter === area
                                ? 'bg-section-command text-background border-section-command'
                                : 'bg-background border-border hover:border-section-command/50'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 border-t border-border bg-card flex gap-3">
                {hasFilters && (
                  <button 
                    onClick={clearFilters}
                    className="flex-1 py-3 px-4 border border-destructive/50 text-destructive rounded-lg font-display text-sm hover:bg-destructive/10 transition-colors"
                  >
                    CLEAR ALL
                  </button>
                )}
                <button 
                  onClick={() => setShowFilters(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-display text-sm transition-all ${
                    activeTab === 'campaigns' ? 'bg-section-campaigns text-white hover:box-glow-campaigns' : activeTab === 'missions' ? 'bg-section-missions text-white hover:box-glow-missions' : 'bg-section-command text-background hover:box-glow-command'
                  }`}
                >
                  APPLY FILTERS
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* Active Campaign Widget - Only show on campaigns tab */}
        {activeTab === 'campaigns' && activeCampaignId && user && (
          <div className="mb-6">
            <ActiveCampaignHero />
          </div>
        )}

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Missions Tab */}
          {activeTab === 'missions' && (
            missionsLoading ? (
              <div className="text-center py-12">
                <div className="font-display text-2xl text-section-missions animate-neon-pulse">LOADING...</div>
              </div>
            ) : missionsError ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <p className="font-display text-xl text-destructive mb-2">TRANSMISSION FAILED</p>
                <button
                  onClick={() => refetchMissions()}
                  className="px-6 py-3 bg-section-missions text-white font-display rounded hover:box-glow-missions transition-all flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> RETRY
                </button>
              </div>
            ) : (
              <>
                {/* Today's Picks (public source only) */}
                {source === 'public' && <TodayMissionsWidget missions={publicMissions} />}
                
                {/* Mission list */}
                {filteredMissions?.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-3">
                      {source === 'personal' 
                        ? 'No custom missions yet' 
                        : hasFilters 
                          ? 'No missions found. Try clearing filters.' 
                          : 'No missions available'
                      }
                    </p>
                    {source === 'personal' && user && (
                      <button
                        onClick={() => navigate('/exercises?newMission=true')}
                        className="text-sm text-section-missions hover:text-glow-missions font-display"
                      >
                        + CREATE YOUR FIRST MISSION
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMissions?.map((mission, i) => (
                      <MissionCard
                        key={mission.id}
                        mission={mission}
                        index={i}
                        topRightSlot={
                          user ? (
                            <>
                              {/* Add to Campaign - always show for logged-in users */}
                              <AddToCollectionButton missionId={mission.id} />
                              
                              {/* Edit & Delete - only for owner's missions */}
                              {source === 'personal' && mission.created_by === user?.id && (
                                <>
                                  <button
                                    onClick={(e) => handleEditMission(e, mission.id)}
                                    className="p-1.5 bg-section-missions/20 text-section-missions rounded hover:bg-section-missions/30 transition-colors"
                                    title="Edit mission"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(mission.id, mission.code_name, 'mission'); }}
                                    className="p-1.5 bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
                                    title="Delete mission"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )
          )}

          {/* Exercises Tab */}
          {activeTab === 'exercises' && (
            exercisesLoading ? (
              <div className="text-center py-12">
                <div className="font-display text-lg text-section-command animate-neon-pulse">LOADING...</div>
              </div>
            ) : (
              <>
                {/* Exercise instruction */}
                <div className="mb-4 p-3 bg-section-command/5 border border-section-command/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-section-command font-display">EXERCISES</span> are your building blocks. Browse global or create custom moves for your missions.
                  </p>
                </div>
                
                {/* Source Toggle for exercises */}
                {user && (
                  <div className="mb-4">
                    <SourceToggle 
                      value={source} 
                      onChange={setSource}
                      publicLabel="GLOBAL"
                      personalLabel="MY EXERCISES"
                      section="exercises"
                    />
                  </div>
                )}
                
                {displayExercises.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <Dumbbell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-3">
                      {source === 'personal' ? 'No custom exercises yet' : 'No public exercises available'}
                    </p>
                    {source === 'personal' && user && (
                      <button
                        onClick={() => navigate('/exercises?newExercise=true')}
                        className="text-sm text-section-command hover:text-glow-command font-display"
                      >
                        + CREATE YOUR FIRST EXERCISE
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayExercises.map((exercise, i) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        index={i}
                        isOwner={exercise.created_by === user?.id}
                        onEdit={handleEditExercise}
                        onDelete={(id, name) => handleDeleteClick(id, name, 'exercise')}
                      />
                    ))}
                  </div>
                )}
              </>
            )
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            collectionsLoading ? (
              <div className="text-center py-12">
                <div className="font-display text-lg text-section-campaigns animate-neon-pulse">LOADING...</div>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Flame className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-3">
                  {campaignSource === 'personal' 
                    ? 'No custom campaigns yet' 
                    : campaignSource === 'community'
                      ? 'No community campaigns available'
                      : 'No standard campaigns available'
                  }
                </p>
                {campaignSource === 'personal' && user && (
                  <button
                    onClick={() => setCampaignDialogOpen(true)}
                    className="text-sm text-section-campaigns hover:text-glow-campaigns font-display"
                  >
                    + CREATE YOUR FIRST CAMPAIGN
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Campaign at top if in current view */}
                {activeCampaign && filteredCampaigns.find(c => c.id === activeCampaignId) && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-section-campaigns animate-pulse" />
                      <span className="font-display text-xs text-section-campaigns tracking-wider">YOUR ACTIVE OP</span>
                    </div>
                  </div>
                )}
                
                {/* Campaign list */}
                {filteredCampaigns.map((c, i) => (
                  <CampaignCard 
                    key={c.id} 
                    collection={c} 
                    index={i}
                    isActive={c.id === activeCampaignId}
                    isOwner={c.created_by === user?.id}
                    isSystem={c.is_system}
                    onEdit={setEditCampaignId}
                    onDelete={(id, name) => handleDeleteClick(id, name, 'campaign')}
                  />
                ))}
                
                {/* Create button for personal tab */}
                {campaignSource === 'personal' && user && filteredCampaigns.length > 0 && (
                  <button
                    onClick={() => setCampaignDialogOpen(true)}
                    className="w-full py-4 border-2 border-dashed border-section-campaigns/30 rounded-lg text-section-campaigns/60 hover:border-section-campaigns hover:text-section-campaigns transition-colors font-display text-sm"
                  >
                    + CREATE NEW CAMPAIGN
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              DELETE {itemToDelete?.type.toUpperCase()}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete <strong>"{itemToDelete?.name}"</strong>?</p>
              <p className="text-destructive/80 text-sm">⚠️ This action cannot be undone. All associated data will be permanently removed.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Campaign Form Dialog */}
      {(campaignDialogOpen || editCampaignId) && (
        <CollectionFormDialog
          open={campaignDialogOpen || !!editCampaignId}
          onOpenChange={(open) => {
            if (!open) {
              setCampaignDialogOpen(false);
              setEditCampaignId(null);
            }
          }}
          collectionId={editCampaignId || undefined}
        />
      )}
    </div>
  );
};

export default Command;
