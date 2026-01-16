import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Plus, Filter, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { useAuth } from '@/hooks/useAuth';

const FOCUS_AREAS = ['PUSH', 'PULL', 'LEGS', 'CORE', 'CARDIO', 'ARMS', 'SHOULDERS', 'CHEST', 'BACK'];
const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Core'];

const MissionSelect = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [focusFilter, setFocusFilter] = useState<string>('');
  const [muscleFilter, setMuscleFilter] = useState<string>('');
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const { data: missions, isLoading, error, refetch, isRefetching } = useMissions({
    focusArea: focusFilter || undefined,
    muscleGroup: muscleFilter || undefined,
    showOnlyPublic: showOnlyPublic || !user,
  });

  const clearFilters = () => {
    setFocusFilter('');
    setMuscleFilter('');
    setShowOnlyPublic(false);
    setShowOnlyMine(false);
  };

  const hasFilters = focusFilter || muscleFilter || showOnlyPublic || showOnlyMine;

  // Filter missions for "My Missions" option
  const filteredMissions = showOnlyMine && user 
    ? missions?.filter(m => m.created_by === user.id)
    : missions;

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
              <p className="text-xs text-muted-foreground tracking-wider">CHOOSE YOUR BATTLE</p>
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
                onClick={() => navigate('/create-mission')}
                className="p-2 border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
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

              {/* Muscle Group */}
              <div>
                <label className="text-xs text-muted-foreground tracking-wider">MUSCLE GROUP</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {MUSCLE_GROUPS.map(muscle => (
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
                onClick={() => navigate('/create-mission')}
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
                
                {/* Custom mission badge */}
                {!mission.is_public && (
                  <div className="absolute top-2 right-2 text-xs px-2 py-0.5 bg-accent/20 text-accent rounded">
                    CUSTOM
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-display text-2xl text-primary group-hover:text-glow-primary transition-all">
                        {mission.code_name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                      <Zap className="w-3 h-3 text-accent" />
                      <span className="text-xs font-display text-accent">{mission.difficulty}</span>
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
      </div>
    </div>
  );
};

export default MissionSelect;
