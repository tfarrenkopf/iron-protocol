import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise, Exercise } from '@/hooks/useExercises';

const EQUIPMENT_OPTIONS = [
  'DUMBBELLS', 'BARBELL', 'BENCH', 'CABLE_MACHINE', 'LAT_PULLDOWN',
  'LEG_PRESS', 'LEG_CURL', 'LEG_EXTENSION', 'SMITH_MACHINE', 'PEC_DECK',
  'CHEST_PRESS', 'SHOULDER_PRESS_MACHINE', 'SEATED_ROW', 'PULL_UP_BAR',
  'DIP_STATION', 'PREACHER_BENCH', 'HACK_SQUAT', 'CALF_RAISE', 'AB_MACHINE',
  'BODYWEIGHT', 'KETTLEBELL', 'EZ_BAR'
];

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps',
  'Hamstrings', 'Glutes', 'Calves', 'Core', 'Forearms', 'Traps',
  'Lats', 'Deltoids', 'Obliques'
];

const FOCUS_AREAS = ['PUSH', 'PULL', 'LEGS', 'CORE', 'CARDIO', 'ARMS', 'SHOULDERS', 'CHEST', 'BACK'];

const ExerciseManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: exercises, isLoading } = useExercises();
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    equipment: [] as string[],
    primary_muscle_group: '',
    secondary_muscle_groups: [] as string[],
    focus_areas: [] as string[],
    instructions_setup: '',
    instructions_execution: '',
    instructions_tips: '',
  });
  const [error, setError] = useState<string | null>(null);

  const myExercises = exercises?.filter(e => e.created_by === user?.id) || [];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      equipment: [],
      primary_muscle_group: '',
      secondary_muscle_groups: [],
      focus_areas: [],
      instructions_setup: '',
      instructions_execution: '',
      instructions_tips: '',
    });
    setEditingExercise(null);
    setError(null);
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      equipment: exercise.equipment || [],
      primary_muscle_group: exercise.primary_muscle_group,
      secondary_muscle_groups: exercise.secondary_muscle_groups || [],
      focus_areas: exercise.focus_areas || [],
      instructions_setup: exercise.instructions_setup || '',
      instructions_execution: exercise.instructions_execution || '',
      instructions_tips: exercise.instructions_tips || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Exercise name is required');
      return;
    }
    if (formData.name.length > 50) {
      setError('Exercise name must be 50 characters or less');
      return;
    }
    if (!formData.primary_muscle_group) {
      setError('Primary muscle group is required');
      return;
    }

    try {
      if (editingExercise) {
        await updateExercise.mutateAsync({
          id: editingExercise.id,
          ...formData,
          equipment: formData.equipment as any,
        });
      } else {
        await createExercise.mutateAsync({
          ...formData,
          equipment: formData.equipment as any,
        });
      }
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      if (err.message?.includes('unique')) {
        setError('You already have an exercise with this name');
      } else {
        setError(err.message || 'Failed to save exercise');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exercise? This cannot be undone.')) return;
    try {
      await deleteExercise.mutateAsync(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete exercise');
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
          <header className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/')} className="p-2 border border-border rounded hover:border-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-3xl text-primary">MY EXERCISES</h1>
          </header>
          
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <p className="font-display text-xl text-warning mb-2">AUTHENTICATION REQUIRED</p>
            <p className="text-muted-foreground mb-4">Sign in to create and manage your custom exercises.</p>
            <button onClick={() => navigate('/auth')} className="px-6 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all">
              SIGN IN
            </button>
          </div>
        </div>
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
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 border border-border rounded hover:border-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-3xl text-primary">MY EXERCISES</h1>
              <p className="text-xs text-muted-foreground tracking-wider">PRIVATE ARSENAL</p>
            </div>
          </div>
          
          <button
            onClick={() => { setShowForm(true); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
          >
            <Plus className="w-4 h-4" />
            ADD
          </button>
        </motion.header>

        {/* Exercise List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="font-display text-2xl text-primary animate-neon-pulse">LOADING...</div>
          </div>
        ) : myExercises.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-4">No custom exercises yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myExercises.map((exercise, i) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-primary">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground">{exercise.primary_muscle_group}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {exercise.equipment?.map(eq => (
                        <span key={eq} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(exercise)}
                      className="p-2 text-muted-foreground hover:text-secondary transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exercise.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/90 z-50 overflow-y-auto"
            >
              <div className="container mx-auto px-4 py-6 max-w-2xl">
                <div className="bg-card border border-border rounded-lg">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="font-display text-xl text-primary">
                      {editingExercise ? 'EDIT EXERCISE' : 'NEW EXERCISE'}
                    </h2>
                    <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:text-destructive transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider">NAME (max 50 chars)</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        maxLength={50}
                        className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-primary focus:outline-none"
                        placeholder="e.g., Cable Chest Fly"
                      />
                      <div className="text-xs text-muted-foreground text-right mt-1">{formData.name.length}/50</div>
                    </div>

                    {/* Primary Muscle Group */}
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider">PRIMARY MUSCLE GROUP</label>
                      <select
                        value={formData.primary_muscle_group}
                        onChange={(e) => setFormData({ ...formData, primary_muscle_group: e.target.value })}
                        className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-primary focus:outline-none"
                      >
                        <option value="">Select...</option>
                        {MUSCLE_GROUPS.map(mg => (
                          <option key={mg} value={mg}>{mg}</option>
                        ))}
                      </select>
                    </div>

                    {/* Equipment */}
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider">EQUIPMENT</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {EQUIPMENT_OPTIONS.map(eq => (
                          <button
                            key={eq}
                            type="button"
                            onClick={() => setFormData({ ...formData, equipment: toggleArrayItem(formData.equipment, eq) })}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${
                              formData.equipment.includes(eq)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border hover:border-primary/50'
                            }`}
                          >
                            {eq.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Focus Areas */}
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider">FOCUS AREAS</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {FOCUS_AREAS.map(fa => (
                          <button
                            key={fa}
                            type="button"
                            onClick={() => setFormData({ ...formData, focus_areas: toggleArrayItem(formData.focus_areas, fa) })}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${
                              formData.focus_areas.includes(fa)
                                ? 'bg-secondary text-secondary-foreground border-secondary'
                                : 'bg-background border-border hover:border-secondary/50'
                            }`}
                          >
                            {fa}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs text-muted-foreground tracking-wider">DESCRIPTION (optional)</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-primary focus:outline-none resize-none"
                        placeholder="Brief description..."
                      />
                    </div>

                    {/* Instructions */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground tracking-wider">SETUP (optional)</label>
                        <input
                          type="text"
                          value={formData.instructions_setup}
                          onChange={(e) => setFormData({ ...formData, instructions_setup: e.target.value })}
                          className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-primary focus:outline-none"
                          placeholder="How to set up..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground tracking-wider">EXECUTION (optional)</label>
                        <input
                          type="text"
                          value={formData.instructions_execution}
                          onChange={(e) => setFormData({ ...formData, instructions_execution: e.target.value })}
                          className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-primary focus:outline-none"
                          placeholder="How to perform..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground tracking-wider">TIPS (optional)</label>
                        <input
                          type="text"
                          value={formData.instructions_tips}
                          onChange={(e) => setFormData({ ...formData, instructions_tips: e.target.value })}
                          className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-primary focus:outline-none"
                          placeholder="Pro tips..."
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowForm(false); resetForm(); }}
                        className="flex-1 py-3 bg-muted text-muted-foreground font-display rounded hover:bg-muted/80 transition-colors"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        disabled={createExercise.isPending || updateExercise.isPending}
                        className="flex-1 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {editingExercise ? 'UPDATE' : 'CREATE'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExerciseManager;
