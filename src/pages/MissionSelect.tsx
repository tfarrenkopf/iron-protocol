import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Zap, Plus, Filter, X, RefreshCw, AlertCircle, Clock, Pencil, Trash2 } from 'lucide-react';
import { useMissions, useDeleteMission } from '@/hooks/useMissions';
import { useCollections } from '@/hooks/useCollections';
import { useAuth } from '@/hooks/useAuth';
import { PopularityBadge } from '@/components/SocialProof';
import { getPopularityTier } from '@/hooks/useMissionStats';
import { GuestIndicator } from '@/components/AnonymousConversion';
import { FOCUS_AREAS, getMusclesForFocusArea, EQUIPMENT_OPTIONS, formatEquipment } from '@/data/muscleGroups';
import { CollectionFilter } from '@/components/CollectionFilter';
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

const DURATION_FILTERS = [
  { label: 'Quick', value: 'short', max: 20 },
  { label: 'Standard', value: 'medium', min: 20, max: 40 },
  { label: 'Extended', value: 'long', min: 40 },
];

const MissionSelect = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAnonymous } = useAuth();
  
  // Initialize filters from URL params
  const [showFilters, setShowFilters] = useState(false);
  const [focusFilter, setFocusFilter] = useState<string>(searchParams.get('focus') || '');
  const [muscleFilter, setMuscleFilter] = useState<string>(searchParams.get('muscle') || '');
  const [equipmentFilter, setEquipmentFilter] = useState<string>(searchParams.get('equipment') || '');
  const [showOnlyPublic, setShowOnlyPublic] = useState(searchParams.get('public') === 'true');
  const [showOnlyMine, setShowOnlyMine] = useState(searchParams.get('mine') === 'true');
  const [durationFilter, setDurationFilter] = useState<string>(searchParams.get('duration') || '');
  const [collectionFilter, setCollectionFilter] = useState<string>(searchParams.get('collection') || '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Fetch collections for filtering
  const { data: collections } = useCollections();

  // Get available muscles based on selected focus area
  const availableMuscles = getMusclesForFocusArea(focusFilter || null);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (focusFilter) params.set('focus', focusFilter);
    if (muscleFilter) params.set('muscle', muscleFilter);
    if (equipmentFilter) params.set('equipment', equipmentFilter);
    if (showOnlyPublic) params.set('public', 'true');
    if (showOnlyMine) params.set('mine', 'true');
    if (durationFilter) params.set('duration', durationFilter);
    if (collectionFilter) params.set('collection', collectionFilter);
    setSearchParams(params, { replace: true });
  }, [focusFilter, muscleFilter, equipmentFilter, showOnlyPublic, showOnlyMine, durationFilter, collectionFilter]);

  // Clear muscle filter if it's not in the available muscles for the new focus area
  useEffect(() => {
    if (muscleFilter && !availableMuscles.includes(muscleFilter as any)) {
      setMuscleFilter('');
    }
  }, [focusFilter, availableMuscles, muscleFilter]);

  const { data: missions, isLoading, error, refetch, isRefetching } = useMissions({
    focusArea: focusFilter || undefined,
    muscleGroup: muscleFilter || undefined,
    equipment: equipmentFilter || undefined,
    showOnlyPublic: showOnlyPublic || !user,
  });

  const deleteMission = useDeleteMission();

  const handleDeleteClick = (e: React.MouseEvent, mission: { id: string; code_name: string }) => {
    e.stopPropagation();
    setMissionToDelete({ id: mission.id, name: mission.code_name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (missionToDelete) {
      await deleteMission.mutateAsync(missionToDelete.id);
      setDeleteDialogOpen(false);
      setMissionToDelete(null);
    }
  };

  const handleEditClick = (e: React.MouseEvent, missionId: string) => {
    e.stopPropagation();
    // Preserve current filters in the URL when navigating to edit
    const currentParams = new URLSearchParams(searchParams);
    navigate(`/exercises?editMission=${missionId}&returnFilters=${encodeURIComponent(currentParams.toString())}`);
  };

  const clearFilters = () => {
    setFocusFilter('');
    setMuscleFilter('');
    setEquipmentFilter('');
    setShowOnlyPublic(false);
    setShowOnlyMine(false);
    setDurationFilter('');
    setCollectionFilter('');
  };

  const hasFilters = focusFilter || muscleFilter || equipmentFilter || showOnlyPublic || showOnlyMine || durationFilter || collectionFilter;

  // Get mission IDs from selected collection
  const collectionMissionIds = useMemo(() => {
    if (!collectionFilter || !collections) return null;
    const selectedCollection = collections.find(c => c.id === collectionFilter);
    if (!selectedCollection) return null;
    return new Set(selectedCollection.collection_missions?.map(cm => cm.mission_id) || []);
  }, [collectionFilter, collections]);

  // Filter missions for "My Missions", duration, and collection
  let filteredMissions = showOnlyMine && user 
    ? missions?.filter(m => m.created_by === user.id)
    : missions;

  // Apply collection filter
  if (collectionMissionIds && filteredMissions) {
    filteredMissions = filteredMissions.filter(m => collectionMissionIds.has(m.id));
  }

  // Apply duration filter
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

  return (
    <div className="min-h-screen bg-background relative">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 border border-border rounded hover:border-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-3xl text-primary">SELECT MISSION</h1>
              <p className="text-xs text-muted-foreground tracking-wider">
                {isAnonymous ? (
                  <GuestIndicator variant="minimal" />
                ) : (
                  'Missions are structured workouts with exercises, sets, and reps'
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded transition-colors ${
                hasFilters ? 'border-secondary text-secondary' : 'border-border hover:border-primary'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            {user && (
              <button
                onClick={() => navigate('/exercises')}
                className="p-2 border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
                title="Create new mission"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.header>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-lg p-4 mb-6"
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
              {/* Collection Filter */}
              <CollectionFilter 
                selectedCollectionId={collectionFilter}
                onSelect={setCollectionFilter}
              />

              {/* Focus Area */}
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

              {/* Primary Muscle - filtered by focus area */}
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

              {/* Equipment Filter */}
              <div>
                <label className="text-xs text-muted-foreground tracking-wider">EQUIPMENT</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['DUMBBELLS', 'BARBELL', 'BODYWEIGHT', 'CABLE_MACHINE', 'BENCH'].map(equip => (
                    <button
                      key={equip}
                      onClick={() => setEquipmentFilter(equipmentFilter === equip ? '' : equip)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        equipmentFilter === equip
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-background border-border hover:border-accent/50'
                      }`}
                    >
                      {formatEquipment(equip)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Filter */}
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
                      <span className="ml-1 opacity-60">
                        {duration.max && !duration.min && `<${duration.max}m`}
                        {duration.min && !duration.max && `${duration.min}m+`}
                        {duration.min && duration.max && `${duration.min}-${duration.max}m`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Only Public */}
              {user && (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyMine}
                      onChange={(e) => {
                        setShowOnlyMine(e.target.checked);
                        if (e.target.checked) setShowOnlyPublic(false);
                      }}
                      className="w-4 h-4 accent-secondary"
                    />
                    <span className="text-xs text-muted-foreground">My missions only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyPublic}
                      onChange={(e) => {
                        setShowOnlyPublic(e.target.checked);
                        if (e.target.checked) setShowOnlyMine(false);
                      }}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground">Public missions only</span>
                  </label>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Mission List */}
        {isLoading || isRefetching ? (
          <div className="text-center py-12">
            <div className="font-display text-2xl text-primary animate-neon-pulse">
              {isRefetching ? 'REFRESHING...' : 'LOADING...'}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="font-display text-xl text-destructive mb-2">TRANSMISSION FAILED</p>
            <p className="text-muted-foreground mb-6 text-sm">Unable to load missions. Check your connection.</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              RETRY
            </button>
          </div>
        ) : filteredMissions?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No missions found. {hasFilters && 'Try clearing filters.'}</p>
            {showOnlyMine && (
              <button
                onClick={() => navigate('/exercises')}
                className="mt-4 text-sm text-secondary hover:text-glow-secondary font-display"
              >
                + CREATE YOUR FIRST MISSION
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMissions?.map((mission, i) => (
              <motion.button
                key={mission.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/mission/${mission.id}`)}
                className="w-full group bg-card border border-border rounded-lg p-5 text-left hover:border-primary transition-all relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Top-right badges - single row with all elements */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                  {/* Custom mission controls */}
                  {!mission.is_public && user && mission.created_by === user.id && (
                    <>
                      <button
                        onClick={(e) => handleEditClick(e, mission.id)}
                        className="p-1.5 bg-secondary/20 text-secondary rounded hover:bg-secondary/30 transition-colors"
                        title="Edit mission"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, mission)}
                        className="p-1.5 bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
                        title="Delete mission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded whitespace-nowrap">
                        CUSTOM
                      </span>
                    </>
                  )}

                  {/* Custom mission badge (not owner) */}
                  {!mission.is_public && (!user || mission.created_by !== user.id) && (
                    <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded whitespace-nowrap">
                      CUSTOM
                    </span>
                  )}

                  {/* Popularity badge OR "No survivors" encouragement */}
                  {mission.is_public && (
                    <>
                      {(mission.popularity_score || 0) === 0 ? (
                        <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded font-display animate-pulse whitespace-nowrap">
                          NO SURVIVORS
                        </span>
                      ) : getPopularityTier(mission.popularity_score || 0) ? (
                        <PopularityBadge score={mission.popularity_score || 0} />
                      ) : null}
                    </>
                  )}

                  {/* Difficulty badge */}
                  <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    <Zap className="w-3 h-3 text-accent" />
                    <span className="text-xs font-display text-accent">{mission.difficulty}</span>
                  </div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start mb-3">
                    <div className="flex-1 pr-2">
                      <h2 className="font-display text-2xl text-primary group-hover:text-glow-primary transition-all">
                        {mission.code_name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{mission.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {mission.focus_areas?.slice(0, 3).map((area) => (
                        <span 
                          key={area}
                          className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {mission.mission_exercises?.length || 0} exercises • {mission.estimated_minutes}min
                    </div>
                  </div>

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
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-destructive">DELETE MISSION?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete <span className="text-primary font-display">{missionToDelete?.name}</span>. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-display">CANCEL</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground font-display hover:bg-destructive/90"
              >
                DELETE
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default MissionSelect;
