import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useExercises } from "@/hooks/useExercises";
import { useMissions, useCreateMission, useUpdateMission, MissionWithExercises } from "@/hooks/useMissions";
import { FOCUS_AREAS } from "@/data/muscleGroups";

interface MissionExerciseItem {
  id: string;
  exercise_id: string;
  exercise_name: string;
  target_sets: number;
  target_reps: number;
  rest_between_sets_sec: number;
}

interface MissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId?: string; // If provided, edit mode
}

export function MissionFormDialog({ open, onOpenChange, missionId }: MissionFormDialogProps) {
  const { data: exercises } = useExercises();
  const { data: missions } = useMissions({});
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();

  const [formData, setFormData] = useState({
    name: "",
    codeName: "",
    description: "",
    focusAreas: [] as string[],
    exercises: [] as MissionExerciseItem[],
  });
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const editingMission = missionId ? missions?.find((m) => m.id === missionId) : null;

  // Load mission data when editing
  useEffect(() => {
    if (editingMission && open) {
      setFormData({
        name: editingMission.name,
        codeName: editingMission.code_name,
        description: editingMission.description || "",
        focusAreas: editingMission.focus_areas || [],
        exercises:
          editingMission.mission_exercises?.map((me) => ({
            id: me.id,
            exercise_id: me.exercise_id,
            exercise_name: me.exercises?.name || "Unknown",
            target_sets: me.target_sets,
            target_reps: me.target_reps,
            rest_between_sets_sec: me.rest_between_sets_sec,
          })) || [],
      });
    } else if (open && !missionId) {
      resetForm();
    }
  }, [editingMission, open, missionId]);

  const resetForm = () => {
    setFormData({
      name: "",
      codeName: "",
      description: "",
      focusAreas: [],
      exercises: [],
    });
    setSelectedExerciseId("");
    setError(null);
  };

  const calculateEstimatedMinutes = () => {
    let totalTime = 0;
    formData.exercises.forEach((e) => {
      totalTime += e.target_sets * (30 + e.rest_between_sets_sec);
    });
    return Math.ceil(totalTime / 60);
  };

  const toggleFocusArea = (area: string) => {
    setFormData({
      ...formData,
      focusAreas: formData.focusAreas.includes(area)
        ? formData.focusAreas.filter((a) => a !== area)
        : [...formData.focusAreas, area],
    });
  };

  const addExercise = () => {
    if (!selectedExerciseId) return;
    const exercise = exercises?.find((e) => e.id === selectedExerciseId);
    if (!exercise) return;

    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises,
        {
          id: `temp-${Date.now()}`,
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          target_sets: 3,
          target_reps: 10,
          rest_between_sets_sec: 60,
        },
      ],
    });
    setSelectedExerciseId("");
  };

  const removeExercise = (id: string) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((e) => e.id !== id),
    });
  };

  const updateExercise = (id: string, field: string, value: number) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Mission name is required");
      return;
    }
    if (!formData.codeName.trim()) {
      setError("Code name is required");
      return;
    }
    if (formData.exercises.length === 0) {
      setError("Add at least one exercise");
      return;
    }

    const estimatedMinutes = calculateEstimatedMinutes();

    try {
      const missionData = {
        name: formData.name,
        code_name: formData.codeName.toUpperCase(),
        description: formData.description,
        focus_areas: formData.focusAreas,
        estimated_minutes: estimatedMinutes,
        exercises: formData.exercises.map((e) => ({
          exercise_id: e.exercise_id,
          target_sets: e.target_sets,
          target_reps: e.target_reps,
          rest_between_sets_sec: e.rest_between_sets_sec,
        })),
      };

      if (editingMission) {
        await updateMission.mutateAsync({
          id: editingMission.id,
          ...missionData,
        });
        toast.success("MISSION UPDATED", {
          description: `${formData.codeName} parameters modified.`,
        });
      } else {
        await createMission.mutateAsync(missionData);
        toast.success("MISSION DEPLOYED", {
          description: `${formData.codeName} is now operational.`,
        });
      }
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || `Failed to ${editingMission ? "update" : "create"} mission`);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 bg-background z-50 overflow-y-auto"
        >
          <div className="min-h-full pb-safe">
            <div className="sticky top-0 z-10 bg-card border-b border-section-missions flex items-center justify-between p-4">
              <h2 className="font-display text-xl text-section-missions">
                {editingMission ? "EDIT MISSION" : "NEW MISSION"}
              </h2>
              <button onClick={handleClose} className="p-2 hover:text-destructive transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="container mx-auto px-4 py-4 max-w-2xl">
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider">NAME</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-section-missions focus:outline-none"
                      placeholder="e.g., Upper Body Day"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider">CODE NAME</label>
                    <input
                      type="text"
                      value={formData.codeName}
                      onChange={(e) => setFormData({ ...formData, codeName: e.target.value.toUpperCase() })}
                      className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-section-missions focus:outline-none uppercase"
                      placeholder="e.g., UPPER ASSAULT"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground tracking-wider">DESCRIPTION (optional)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-section-missions focus:outline-none"
                    placeholder="Brief mission briefing..."
                  />
                </div>

                {/* Focus Areas */}
                <div>
                  <label className="text-xs text-muted-foreground tracking-wider">FOCUS AREAS</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {FOCUS_AREAS.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleFocusArea(area)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          formData.focusAreas.includes(area)
                            ? "bg-section-missions text-white border-section-missions"
                            : "bg-background border-border hover:border-section-missions/50"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercises */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-muted-foreground tracking-wider">EXERCISES</label>
                    <span className="text-xs text-muted-foreground">Est. {calculateEstimatedMinutes()} min</span>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <select
                      value={selectedExerciseId}
                      onChange={(e) => setSelectedExerciseId(e.target.value)}
                      className="flex-1 bg-background border border-border rounded px-3 py-2 focus:border-section-missions focus:outline-none text-sm"
                    >
                      <option value="">Select exercise to add...</option>
                      {exercises?.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} {!e.is_public && "(Custom)"}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addExercise}
                      disabled={!selectedExerciseId}
                      className="px-4 py-2 bg-section-missions text-white rounded hover:box-glow-missions transition-all disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {formData.exercises.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No exercises added yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {formData.exercises.map((exercise, index) => (
                        <div key={exercise.id} className="bg-background border border-border rounded-lg p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{index + 1}.</span>
                            <span className="flex-1 font-display text-section-missions text-sm">
                              {exercise.exercise_name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExercise(exercise.id)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground">SETS</label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={exercise.target_sets}
                                onChange={(e) =>
                                  updateExercise(exercise.id, "target_sets", parseInt(e.target.value) || 1)
                                }
                                className="w-full bg-card border border-border rounded px-2 py-1 text-center text-sm focus:border-section-missions focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">REPS</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={exercise.target_reps}
                                onChange={(e) =>
                                  updateExercise(exercise.id, "target_reps", parseInt(e.target.value) || 1)
                                }
                                className="w-full bg-card border border-border rounded px-2 py-1 text-center text-sm focus:border-section-missions focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">REST</label>
                              <input
                                type="number"
                                min={0}
                                max={300}
                                step={15}
                                value={exercise.rest_between_sets_sec}
                                onChange={(e) =>
                                  updateExercise(exercise.id, "rest_between_sets_sec", parseInt(e.target.value) || 0)
                                }
                                className="w-full bg-card border border-border rounded px-2 py-1 text-center text-sm focus:border-section-missions focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 bg-muted text-muted-foreground font-display rounded hover:bg-muted/80 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={createMission.isPending || updateMission.isPending}
                    className="flex-1 py-3 bg-section-missions text-white font-display rounded hover:box-glow-missions transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {editingMission ? "UPDATE" : "CREATE"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
