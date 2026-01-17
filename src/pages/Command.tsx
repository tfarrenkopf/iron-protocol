import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Target, Dumbbell, Flame, Filter, X, Clock, Plus, Pencil, Trash2, RefreshCw, AlertCircle, Crown } from 'lucide-react';
import { useMissions, useDeleteMission } from '@/hooks/useMissions';
import { useCollections, useDeleteCollection, CollectionWithMissions } from '@/hooks/useCollections';
import { useExercises, useDeleteExercise } from '@/hooks/useExercises';
import { useAuth } from '@/hooks/useAuth';
import { MissionCard } from '@/components/MissionCard';
import { AddToCollectionButton } from '@/components/AddToCollectionButton';
import { CollectionFormDialog } from '@/components/CollectionFormDialog';
import { FOCUS_AREAS, getMusclesForFocusArea, formatEquipment } from '@/data/muscleGroups';
import { CollectionFilter } from '@/components/CollectionFilter';
import { useActiveCampaign } from '@/hooks/useActiveCampaign';
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

type TabType = 'missions' | 'exercises' | 'campaigns';
type Source = 'public' | 'personal';

const DURATION_FILTERS = [
  { label: 'Quick', value: 'short', max: 20 },
  { label: 'Standard', value: 'medium', min: 20, max: 40 },
  { label: 'Extended', value: 'long', min: 40 },
];

const Command = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAnonymous } = useAuth();
  
  // Tab state - map legacy 'global' to 'missions'
  const urlTab = searchParams.get('tab');
  const initialTab = (urlTab === 'browse' || urlTab === 'global') ? 'missions' : (urlTab as TabType) || 'missions';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  
  // Source toggle state (public vs personal)
  const urlSource = searchParams.get('source');
  const [source, setSource] = useState<Source>((urlSource as Source) || 'public');
  
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
  const myExercises = exercises?.filter(e => e.created_by === user?.id) || [];
  const myCollections = collections?.filter(c => !c.is_system && c.created_by === user?.id) || [];
  const systemCollections = collections?.filter(c => c.is_system) || [];
  const publicCollections = collections?.filter(c => !c.is_system && c.visibility === 'public' && c.created_by !== user?.id) || [];
  
  // Active campaign at top
  const activeCampaign = collections?.find(c => c.id === activeCampaignId);
  
  // Sort campaigns with active first
  const sortedCampaigns = useMemo(() => {
    const all: { collection: CollectionWithMissions; section: 'active' | 'system' | 'mine' | 'community' }[] = [];
    
    if (activeCampaign) {
      all.push({ collection: activeCampaign, section: 'active' });
    }
    
    systemCollections.forEach(c => {
      if (c.id !== activeCampaignId) all.push({ collection: c, section: 'system' });
    });
    
    if (user) {
      myCollections.forEach(c => {
        if (c.id !== activeCampaignId) all.push({ collection: c, section: 'mine' });
      });
    }
    
    publicCollections.forEach(c => {
      if (c.id !== activeCampaignId) all.push({ collection: c, section: 'community' });
    });
    
    return all;
  }, [activeCampaign, systemCollections, myCollections, publicCollections, activeCampaignId, user]);
  
  const availableMuscles = getMusclesForFocusArea(focusFilter || null);
  
  // Sync tab to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', activeTab);
    params.set('source', source);
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
  }, [activeTab, source, focusFilter, muscleFilter, equipmentFilter, durationFilter, collectionFilter]);
  
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
    navigate(`/exercises?editMission=${missionId}`);
  };
  
  const tabs: { id: TabType; label: string; icon: typeof Target }[] = [
    { id: 'missions', label: 'MISSIONS', icon: Target },
    { id: 'campaigns', label: 'CAMPAIGNS', icon: Flame },
    { id: 'exercises', label: 'EXERCISES', icon: Dumbbell },
  ];
  
  const getCreateButtonConfig = () => {
    if (activeTab === 'missions' && source === 'personal') {
      return { label: 'New Mission', onClick: () => navigate('/exercises?newMission=true') };
    }
    if (activeTab === 'campaigns') {
      return { label: 'New Campaign', onClick: () => setCampaignDialogOpen(true) };
    }
    if (activeTab === 'exercises') {
      return { label: 'New Exercise', onClick: () => navigate('/exercises?newExercise=true') };
    }
    return null;
  };
  
  const createConfig = getCreateButtonConfig();

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button 
            onClick={() => navigate('/')}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <h1 className="font-display text-2xl text-primary">COMMAND</h1>
          
          <div className="flex gap-2">
            {activeTab === 'missions' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border rounded transition-colors ${
                  hasFilters ? 'border-secondary text-secondary' : 'border-border hover:border-primary'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            )}
            {user && createConfig && (
              <button
                onClick={createConfig.onClick}
                className="p-2 border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
                title={createConfig.label}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.header>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // Hide exercises tab for guests
            if (tab.id === 'exercises' && !user) return null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-display text-sm whitespace-nowrap transition-all border-2 ${
                  isActive
                    ? tab.id === 'campaigns' 
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Source Toggle (for missions tab) */}
        {activeTab === 'missions' && user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <SourceToggle 
              value={source} 
              onChange={setSource}
              publicLabel="GLOBAL"
              personalLabel="MY MISSIONS"
            />
          </motion.div>
        )}

        {/* Filters (Missions tab only) */}
        {activeTab === 'missions' && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-card border border-border rounded-lg p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-sm text-secondary">FILTERS</span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="space-y-4">
              <CollectionFilter selectedCollectionId={collectionFilter} onSelect={setCollectionFilter} />
              
              <div>
                <label className="text-xs text-muted-foreground tracking-wider">FOCUS AREA</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FOCUS_AREAS.map(area => (
                    <button
                      key={area}
                      onClick={() => setFocusFilter(focusFilter === area ? '' : area)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        focusFilter === area
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground tracking-wider">PRIMARY MUSCLE</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableMuscles.map(muscle => (
                    <button
                      key={muscle}
                      onClick={() => setMuscleFilter(muscleFilter === muscle ? '' : muscle)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        muscleFilter === muscle
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : 'bg-background border-border hover:border-secondary/50'
                      }`}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> DURATION
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DURATION_FILTERS.map(duration => (
                    <button
                      key={duration.value}
                      onClick={() => setDurationFilter(durationFilter === duration.value ? '' : duration.value)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        durationFilter === duration.value
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-background border-border hover:border-accent/50'
                      }`}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Missions Tab */}
          {activeTab === 'missions' && (
            missionsLoading ? (
              <div className="text-center py-12">
                <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING...</div>
              </div>
            ) : missionsError ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <p className="font-display text-xl text-destructive mb-2">TRANSMISSION FAILED</p>
                <button
                  onClick={() => refetchMissions()}
                  className="px-6 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all flex items-center gap-2 mx-auto"
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
                        className="text-sm text-secondary hover:text-glow-secondary font-display"
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
                          source === 'personal' && mission.created_by === user?.id ? (
                            <>
                              <button
                                onClick={(e) => handleEditMission(e, mission.id)}
                                className="p-1.5 bg-secondary/20 text-secondary rounded hover:bg-secondary/30 transition-colors"
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
                          ) : user ? (
                            <AddToCollectionButton missionId={mission.id} />
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
          {activeTab === 'exercises' && user && (
            exercisesLoading ? (
              <div className="text-center py-12">
                <div className="font-display text-lg text-primary animate-neon-pulse">LOADING...</div>
              </div>
            ) : myExercises.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Dumbbell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-3">No custom exercises yet</p>
                <button
                  onClick={() => navigate('/exercises?newExercise=true')}
                  className="text-sm text-primary hover:text-glow-primary font-display"
                >
                  + CREATE YOUR FIRST EXERCISE
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {myExercises.map((exercise, i) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-display text-primary">{exercise.name}</h3>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <p><span className="text-secondary">Equipment:</span> {exercise.equipment?.map(e => formatEquipment(e)).join(', ') || 'None'}</p>
                          <p><span className="text-secondary">Primary:</span> {exercise.primary_muscle_group}</p>
                          {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
                            <p><span className="text-secondary">Secondary:</span> {exercise.secondary_muscle_groups.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/exercises?editExercise=${exercise.id}`)}
                          className="p-1.5 hover:bg-secondary/20 rounded transition-colors"
                          title="Edit exercise"
                        >
                          <Pencil className="w-3.5 h-3.5 text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(exercise.id, exercise.name, 'exercise')}
                          className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
                          title="Delete exercise"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            collectionsLoading ? (
              <div className="text-center py-12">
                <div className="font-display text-lg text-primary animate-neon-pulse">LOADING...</div>
              </div>
            ) : sortedCampaigns.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Flame className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-3">No campaigns available</p>
                {user && (
                  <button
                    onClick={() => setCampaignDialogOpen(true)}
                    className="text-sm text-accent hover:text-glow-accent font-display"
                  >
                    + CREATE YOUR FIRST CAMPAIGN
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Campaign Section */}
                {activeCampaign && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="w-4 h-4 text-accent" />
                      <span className="font-display text-sm text-accent tracking-wider">ACTIVE CAMPAIGN</span>
                    </div>
                    <CampaignCard 
                      collection={activeCampaign} 
                      isActive 
                      isOwner={activeCampaign.created_by === user?.id}
                      isSystem={activeCampaign.is_system}
                      onEdit={setEditCampaignId}
                      onDelete={(id, name) => handleDeleteClick(id, name, 'campaign')}
                    />
                  </div>
                )}

                {/* Official Campaigns */}
                {systemCollections.filter(c => c.id !== activeCampaignId).length > 0 && (
                  <section className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Crown className="w-4 h-4 text-secondary" />
                      <span className="font-display text-sm text-secondary tracking-wider">OFFICIAL</span>
                    </div>
                    <div className="space-y-3">
                      {systemCollections.filter(c => c.id !== activeCampaignId).map((c, i) => (
                        <CampaignCard 
                          key={c.id} 
                          collection={c} 
                          index={i}
                          isSystem 
                          onEdit={setEditCampaignId}
                          onDelete={(id, name) => handleDeleteClick(id, name, 'campaign')}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* My Campaigns */}
                {user && (
                  <section className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="font-display text-sm text-primary tracking-wider">MY CAMPAIGNS</span>
                    </div>
                    {myCollections.filter(c => c.id !== activeCampaignId).length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">No custom campaigns yet</p>
                        <button
                          onClick={() => setCampaignDialogOpen(true)}
                          className="text-xs text-accent hover:text-glow-accent font-display"
                        >
                          + CREATE CAMPAIGN
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myCollections.filter(c => c.id !== activeCampaignId).map((c, i) => (
                          <CampaignCard 
                            key={c.id} 
                            collection={c} 
                            index={i}
                            isOwner 
                            onEdit={setEditCampaignId}
                            onDelete={(id, name) => handleDeleteClick(id, name, 'campaign')}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Community Campaigns */}
                {publicCollections.filter(c => c.id !== activeCampaignId).length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="font-display text-sm text-muted-foreground tracking-wider">COMMUNITY</span>
                    </div>
                    <div className="space-y-3">
                      {publicCollections.filter(c => c.id !== activeCampaignId).map((c, i) => (
                        <CampaignCard 
                          key={c.id} 
                          collection={c} 
                          index={i}
                          onEdit={setEditCampaignId}
                          onDelete={(id, name) => handleDeleteClick(id, name, 'campaign')}
                        />
                      ))}
                    </div>
                  </section>
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
