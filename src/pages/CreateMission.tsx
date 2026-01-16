import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useExercises } from '@/hooks/useExercises';
import { useCreateMission, useUpdateMission, useMission } from '@/hooks/useMissions';

const FOCUS_AREAS = ['PUSH', 'PULL', 'LEGS', 'CORE', 'CARDIO', 'ARMS', 'SHOULDERS', 'CHEST', 'BACK'];

interface MissionExerciseItem {
  id: string;
  exercise_id: string;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
  rest_between_sets_sec: number;
}

const CreateMission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMissionId = searchParams.get('edit');
  const isEditMode = !!editMissionId;
  
  const { user } = useAuth();
  const { data: exercises, isLoading: loadingExercises } = useExercises();
  const { data: existingMission, isLoading: loadingMission } = useMission(editMissionId || undefined);
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();

  const [name, setName] = useState('');
  const [codeName, setCodeName] = useState('');
  const [description, setDescription] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [missionExercises, setMissionExercises] = useState<MissionExerciseItem[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load existing mission data when editing
  useEffect(() => {
    if (isEditMode && existingMission && !initialized) {
      setName(existingMission.name);
      setCodeName(existingMission.code_name);
      setDescription(existingMission.description || '');
      setFocusAreas(existingMission.focus_areas || []);
      
      // Map existing exercises
      const mappedExercises = existingMission.mission_exercises?.map(me => ({
        id: me.id,
        exercise_id: me.exercise_id,
        exercise_name: me.exercises?.name || 'Unknown',
        target_sets: me.target_sets,
        target_reps: me.target_reps,
        rest_between_sets_sec: me.rest_between_sets_sec,
      })) || [];
      
      setMissionExercises(mappedExercises);
      setInitialized(true);
    }
  }, [isEditMode, existingMission, initialized]);

  const addExercise = () => {
    if (!selectedExerciseId) return;
    const exercise = exercises?.find(e => e.id === selectedExerciseId);
    if (!exercise) return;

    setMissionExercises([
      ...missionExercises,
      {
        id: `temp-${Date.now()}`,
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        target_sets: 3,
        target_reps: 10,
        rest_between_sets_sec: 60,
      }
    ]);
    setSelectedExerciseId('');
  };

  const removeExercise = (id: string) => {
    setMissionExercises(missionExercises.filter(e => e.id !== id));
  };

  const updateExercise = (id: string, field: string, value: number) => {
    setMissionExercises(missionExercises.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const calculateEstimatedMinutes = () => {
    let totalTime = 0;
    missionExercises.forEach(e => {
      // Estimate 30 seconds per set + rest time
      totalTime += e.target_sets * (30 + e.rest_between_sets_sec);
    });
    return Math.ceil(totalTime / 60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Mission name is required');
      return;
    }
    if (!codeName.trim()) {
      setError('Code name is required');
      return;
    }
    if (missionExercises.length === 0) {
      setError('Add at least one exercise');
      return;
    }

    try {
      const missionData = {
        name,
        code_name: codeName.toUpperCase(),
        description,
        focus_areas: focusAreas,
        estimated_minutes: calculateEstimatedMinutes(),
        exercises: missionExercises.map(e => ({
          exercise_id: e.exercise_id,
          target_sets: e.target_sets,
          target_reps: e.target_reps,
          rest_between_sets_sec: e.rest_between_sets_sec,
        })),
      };

      if (isEditMode && editMissionId) {
        await updateMission.mutateAsync({
          id: editMissionId,
          ...missionData,
        });
      } else {
        await createMission.mutateAsync(missionData);
      }
      navigate('/exercises');
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} mission`);
    }
  };

  const handleBack = () => {
    navigate('/exercises');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
          <header className="flex items-center gap-4 mb-8">
            <button onClick={handleBack} className="p-2 border border-border rounded hover:border-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-3xl text-primary">{isEditMode ? 'EDIT' : 'CREATE'} MISSION</h1>
          </header>
          
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <p className="font-display text-xl text-warning mb-2">AUTHENTICATION REQUIRED</p>
            <p className="text-muted-foreground mb-4">Sign in to {isEditMode ? 'edit' : 'create'} custom missions.</p>
            <button onClick={() => navigate('/auth')} className="px-6 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all">
              SIGN IN
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditMode && loadingMission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING MISSION...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button onClick={handleBack} className="p-2 border border-border rounded hover:border-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-primary">{isEditMode ? 'EDIT' : 'CREATE'} MISSION</h1>
            <p className="text-xs text-muted-foreground tracking-wider">
              {isEditMode ? 'MODIFY YOUR ASSAULT' : 'DESIGN YOUR ASSAULT'}
            </p>
          </div>
        </motion.header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-lg text-secondary">MISSION DETAILS</h2>
              <span className="text-xs text-muted-foreground/70 max-w-[180px] text-right">
                Missions are personal workout templates you can run anytime
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground tracking-wider">NAME</label>
                <p className="text-[10px] text-muted-foreground/60 mb-1">Descriptive title for your list</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-primary focus:outline-none"
                  placeholder="e.g., Upper Body Day"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground tracking-wider">CODE NAME</label>
                <p className="text-[10px] text-muted-foreground/60 mb-1">Short tactical callsign shown during workout</p>
                <input
                  type="text"
                  value={codeName}
                  onChange={(e) => setCodeName(e.target.value.toUpperCase())}
                  className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-primary focus:outline-none uppercase"
                  placeholder="e.g., UPPER ASSAULT"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground tracking-wider">DESCRIPTION (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-primary focus:outline-none"
                placeholder="Brief mission briefing..."
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground tracking-wider">FOCUS AREAS</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {FOCUS_AREAS.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleFocusArea(area)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      focusAreas.includes(area)
                        ? 'bg-secondary text-secondary-foreground border-secondary'
                        : 'bg-background border-border hover:border-secondary/50'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-secondary">EXERCISES</h2>
              <span className="text-xs text-muted-foreground">
                Est. {calculateEstimatedMinutes()} min
              </span>
            </div>

            {/* Add Exercise */}
            <div className="flex gap-2">
              <select
                value={selectedExerciseId}
                onChange={(e) => {
                  setSelectedExerciseId(e.target.value);
                }}
                className="flex-1 bg-background border border-border rounded px-3 py-2 focus:border-primary focus:outline-none"
                disabled={loadingExercises}
              >
                <option value="">Select exercise to add...</option>
                {exercises?.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} {!e.is_public && '(Custom)'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  addExercise();
                }}
                disabled={!selectedExerciseId}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:box-glow-primary transition-all disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Exercise List */}
            {missionExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No exercises added yet. Add at least one to {isEditMode ? 'update' : 'create'} a mission.
              </p>
            ) : (
              <div className="space-y-2">
                {missionExercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-background border border-border rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{index + 1}.</span>
                      <span className="flex-1 font-display text-primary">{exercise.exercise_name}</span>
                      <button
                        type="button"
                        onClick={() => removeExercise(exercise.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div>
                        <label className="text-xs text-muted-foreground">SETS</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={exercise.target_sets}
                          onChange={(e) => updateExercise(exercise.id, 'target_sets', parseInt(e.target.value) || 1)}
                          className="w-full bg-card border border-border rounded px-2 py-1 mt-1 text-center focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">REPS</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={exercise.target_reps}
                          onChange={(e) => updateExercise(exercise.id, 'target_reps', parseInt(e.target.value) || 1)}
                          className="w-full bg-card border border-border rounded px-2 py-1 mt-1 text-center focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">REST (s)</label>
                        <input
                          type="number"
                          min={0}
                          max={300}
                          step={15}
                          value={exercise.rest_between_sets_sec}
                          onChange={(e) => updateExercise(exercise.id, 'rest_between_sets_sec', parseInt(e.target.value) || 0)}
                          className="w-full bg-card border border-border rounded px-2 py-1 mt-1 text-center focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createMission.isPending || updateMission.isPending}
            className="w-full py-4 bg-primary text-primary-foreground font-display text-xl rounded hover:box-glow-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            {createMission.isPending || updateMission.isPending 
              ? (isEditMode ? 'UPDATING...' : 'CREATING...') 
              : (isEditMode ? 'UPDATE MISSION' : 'CREATE MISSION')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateMission;
