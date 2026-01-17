import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Globe, Dumbbell, Target, Folder, Filter, X, Clock, Plus, Pencil, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { useMissions, useDeleteMission } from '@/hooks/useMissions';
import { useCollections, useDeleteCollection, CollectionWithMissions } from '@/hooks/useCollections';
import { useExercises, useDeleteExercise, Exercise } from '@/hooks/useExercises';
import { useAuth } from '@/hooks/useAuth';
import { GuestIndicator } from '@/components/AnonymousConversion';
import { MissionCard } from '@/components/MissionCard';
import { AddToCollectionButton } from '@/components/AddToCollectionButton';
import { CollectionFormDialog } from '@/components/CollectionFormDialog';
import { FOCUS_AREAS, getMusclesForFocusArea, formatEquipment } from '@/data/muscleGroups';
import { CollectionFilter } from '@/components/CollectionFilter';
import { ActiveCampaignHero, StartCampaignButton } from '@/components/ActiveCampaignHero';
import { useActiveCampaign } from '@/hooks/useActiveCampaign';
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

type TabType = 'global' | 'missions' | 'exercises' | 'campaigns';

const DURATION_FILTERS = [
  { label: 'Quick', value: 'short', max: 20 },
  { label: 'Standard', value: 'medium', min: 20, max: 40 },
  { label: 'Extended', value: 'long', min: 40 },
];

const Command = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAnonymous } = useAuth();
  
  // Tab state
  const urlTab = searchParams.get('tab');
  const initialTab = (urlTab === 'browse' ? 'global' : urlTab as TabType) || 'global';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
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
  const myMissions = missions?.filter(m => m.created_by === user?.id) || [];
  const myExercises = exercises?.filter(e => e.created_by === user?.id) || [];
  const myCollections = collections?.filter(c => !c.is_system && c.created_by === user?.id) || [];
  const systemCollections = collections?.filter(c => c.is_system) || [];
  const publicCollections = collections?.filter(c => !c.is_system && c.visibility === 'public' && c.created_by !== user?.id) || [];
  
  const availableMuscles = getMusclesForFocusArea(focusFilter || null);
  
  // Sync tab to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', activeTab);
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
  }, [activeTab, focusFilter, muscleFilter, equipmentFilter, durationFilter, collectionFilter]);
  
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
  
  // Apply all filters to missions
  let filteredMissions = missions;
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
  
  const tabs: { id: TabType; label: string; icon: typeof Globe; description?: string }[] = [
    { id: 'global', label: 'GLOBAL MISSIONS', icon: Globe, description: 'Public mission library' },
    { id: 'missions', label: 'MY MISSIONS', icon: Target, description: 'Your custom creations' },
    { id: 'exercises', label: 'MY EXERCISES', icon: Dumbbell, description: 'Custom exercise pool' },
    { id: 'campaigns', label: 'CAMPAIGNS', icon: Folder, description: 'Curated mission sets' },
  ];
  
  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Active Campaign Hero */}
        {user && activeCampaignId && <ActiveCampaignHero />}
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 border border-border rounded hover:border-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-3xl text-primary text-glow-primary">COMMAND</h1>
              <p className="text-xs text-muted-foreground tracking-wider">
                {isAnonymous ? <GuestIndicator variant="minimal" /> : 'Your arsenal awaits, warrior'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {activeTab === 'global' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border rounded transition-colors ${
                  hasFilters ? 'border-secondary text-secondary' : 'border-border hover:border-primary'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            )}
            {user && activeTab !== 'global' && (
              <button
                onClick={() => {
                  if (activeTab === 'campaigns') setCampaignDialogOpen(true);
                  else if (activeTab === 'missions') navigate('/exercises?newMission=true');
                  else if (activeTab === 'exercises') navigate('/exercises?newExercise=true');
                }}
                className="p-2 border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
                title={`Create new ${activeTab === 'campaigns' ? 'campaign' : activeTab === 'exercises' ? 'exercise' : 'mission'}`}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.header>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide border-b border-border pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // Hide "my" tabs for guests
            if ((tab.id === 'missions' || tab.id === 'exercises') && !user) return null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-display text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters (Browse tab only) */}
        {activeTab === 'global' && showFilters && (
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
          {/* Global Missions Tab */}
          {activeTab === 'global' && (
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
            ) : filteredMissions?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No missions found. {hasFilters && 'Try clearing filters.'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMissions?.map((mission, i) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    index={i}
                    topRightSlot={user ? <AddToCollectionButton missionId={mission.id} /> : undefined}
                  />
                ))}
              </div>
            )
          )}

          {/* My Missions Tab */}
          {activeTab === 'missions' && user && (
            myMissions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-3">No custom missions yet</p>
                <button
                  onClick={() => navigate('/exercises?newMission=true')}
                  className="text-sm text-secondary hover:text-glow-secondary font-display"
                >
                  + CREATE YOUR FIRST MISSION
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myMissions.map((mission, i) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    index={i}
                    topRightSlot={
                      <>
                        <button
                          onClick={(e) => handleEditMission(e, mission.id)}
                          className="p-1.5 bg-secondary/20 text-secondary rounded hover:bg-secondary/30 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(mission.id, mission.code_name, 'mission'); }}
                          className="p-1.5 bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            )
          )}

          {/* My Exercises Tab */}
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
                    className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-display text-primary">{exercise.name}</h3>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <p><span className="text-secondary">Equipment:</span> {exercise.equipment?.map(e => formatEquipment(e)).join(', ') || 'None'}</p>
                          <p><span className="text-secondary">Primary:</span> {exercise.primary_muscle_group}</p>
                          {exercise.secondary_muscle_groups?.length > 0 && (
                            <p><span className="text-secondary">Secondary:</span> {exercise.secondary_muscle_groups.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/exercises?editExercise=${exercise.id}`)}
                          className="p-1.5 hover:bg-secondary/20 rounded transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(exercise.id, exercise.name, 'exercise')}
                          className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
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
            ) : (
              <div className="space-y-6">
                {/* Official Campaigns */}
                {systemCollections.length > 0 && (
                  <section>
                    <h3 className="font-display text-sm text-secondary mb-3 tracking-wider">OFFICIAL CAMPAIGNS</h3>
                    <div className="space-y-2">
                      {systemCollections.map((c) => (
                        <CampaignRow key={c.id} collection={c} isSystem onDelete={handleDeleteClick} onEdit={setEditCampaignId} />
                      ))}
                    </div>
                  </section>
                )}

                {/* My Campaigns */}
                {user && (
                  <section>
                    <h3 className="font-display text-sm text-secondary mb-3 tracking-wider">MY CAMPAIGNS</h3>
                    {myCollections.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-border rounded-lg">
                        <Folder className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mb-3">No campaigns yet</p>
                        <button
                          onClick={() => setCampaignDialogOpen(true)}
                          className="text-xs text-secondary hover:text-glow-secondary font-display"
                        >
                          + CREATE YOUR FIRST CAMPAIGN
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {myCollections.map((c) => (
                          <CampaignRow key={c.id} collection={c} isOwner onDelete={handleDeleteClick} onEdit={setEditCampaignId} />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Community Campaigns */}
                {publicCollections.length > 0 && (
                  <section>
                    <h3 className="font-display text-sm text-secondary mb-3 tracking-wider">COMMUNITY CAMPAIGNS</h3>
                    <div className="space-y-2">
                      {publicCollections.map((c) => (
                        <CampaignRow key={c.id} collection={c} onDelete={handleDeleteClick} onEdit={setEditCampaignId} />
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
            <AlertDialogTitle className="font-display text-destructive">DELETE {itemToDelete?.type.toUpperCase()}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
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

// Campaign row component
interface CampaignRowProps {
  collection: CollectionWithMissions;
  isSystem?: boolean;
  isOwner?: boolean;
  onDelete: (id: string, name: string, type: 'campaign') => void;
  onEdit: (id: string) => void;
}

const CampaignRow = ({ collection, isSystem, isOwner, onDelete, onEdit }: CampaignRowProps) => {
  const navigate = useNavigate();
  const missionCount = collection.collection_missions?.length || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => navigate(`/campaign/${collection.id}`)}
      className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Folder className="w-5 h-5 text-secondary" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-primary">{collection.code_name}</span>
              {isSystem && (
                <span className="text-[10px] px-1.5 py-0.5 bg-secondary/20 text-secondary rounded">OFFICIAL</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{missionCount} mission{missionCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Start button - always visible */}
          <StartCampaignButton campaignId={collection.id} size="small" />
          
          {isOwner && !isSystem && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(collection.id); }}
                className="p-1.5 hover:bg-secondary/20 rounded transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-secondary" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(collection.id, collection.code_name, 'campaign'); }}
                className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Command;
