import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useExercises, useCreateExercise, useUpdateExercise, Exercise } from "@/hooks/useExercises";
import { FOCUS_AREAS, MUSCLE_GROUPS, EQUIPMENT_OPTIONS } from "@/data/muscleGroups";

interface ExerciseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId?: string; // If provided, edit mode
}

export function ExerciseFormDialog({ open, onOpenChange, exerciseId }: ExerciseFormDialogProps) {
  const { data: exercises } = useExercises();
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    equipment: [] as string[],
    primary_muscle_group: "",
    secondary_muscle_groups: [] as string[],
    focus_areas: [] as string[],
    instructions_setup: "",
    instructions_execution: "",
    instructions_tips: "",
  });
  const [error, setError] = useState<string | null>(null);

  const editingExercise = exerciseId ? exercises?.find((e) => e.id === exerciseId) : null;

  // Load exercise data when editing
  useEffect(() => {
    if (editingExercise) {
      setFormData({
        name: editingExercise.name,
        description: editingExercise.description || "",
        equipment: editingExercise.equipment || [],
        primary_muscle_group: editingExercise.primary_muscle_group,
        secondary_muscle_groups: editingExercise.secondary_muscle_groups || [],
        focus_areas: editingExercise.focus_areas || [],
        instructions_setup: editingExercise.instructions_setup || "",
        instructions_execution: editingExercise.instructions_execution || "",
        instructions_tips: editingExercise.instructions_tips || "",
      });
    } else {
      resetForm();
    }
  }, [editingExercise, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      equipment: [],
      primary_muscle_group: "",
      secondary_muscle_groups: [],
      focus_areas: [],
      instructions_setup: "",
      instructions_execution: "",
      instructions_tips: "",
    });
    setError(null);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Exercise name is required");
      return;
    }
    if (formData.name.length > 50) {
      setError("Exercise name must be 50 characters or less");
      return;
    }
    if (!formData.primary_muscle_group) {
      setError("Primary muscle group is required");
      return;
    }

    try {
      if (editingExercise) {
        await updateExercise.mutateAsync({
          id: editingExercise.id,
          ...formData,
          equipment: formData.equipment as any,
        });
        toast.success("WEAPON UPGRADED", {
          description: `${formData.name} modifications applied.`,
        });
      } else {
        await createExercise.mutateAsync({
          ...formData,
          equipment: formData.equipment as any,
        });
        toast.success("WEAPON FORGED", {
          description: `${formData.name} added to your arsenal.`,
        });
      }
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      if (err.message?.includes("unique")) {
        setError("You already have an exercise with this name");
      } else {
        setError(err.message || "Failed to save exercise");
      }
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
            <div className="sticky top-0 z-10 bg-card border-b border-section-command flex items-center justify-between p-4">
              <h2 className="font-display text-xl text-section-command">
                {editingExercise ? "EDIT EXERCISE" : "NEW EXERCISE"}
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

                {/* Name */}
                <div>
                  <label className="text-xs text-muted-foreground tracking-wider">NAME (max 50 chars)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={50}
                    className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-section-command focus:outline-none"
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
                    className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-section-command focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {MUSCLE_GROUPS.map((mg) => (
                      <option key={mg} value={mg}>
                        {mg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Equipment */}
                <div>
                  <label className="text-xs text-muted-foreground tracking-wider">EQUIPMENT</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {EQUIPMENT_OPTIONS.map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => setFormData({ ...formData, equipment: toggleArrayItem(formData.equipment, eq) })}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          formData.equipment.includes(eq)
                            ? "bg-section-command text-background border-section-command"
                            : "bg-background border-border hover:border-section-command/50"
                        }`}
                      >
                        {eq.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Areas */}
                <div>
                  <label className="text-xs text-muted-foreground tracking-wider">FOCUS AREAS</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {FOCUS_AREAS.map((fa) => (
                      <button
                        key={fa}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, focus_areas: toggleArrayItem(formData.focus_areas, fa) })
                        }
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          formData.focus_areas.includes(fa)
                            ? "bg-section-command text-background border-section-command"
                            : "bg-background border-border hover:border-section-command/50"
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
                    className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-section-command focus:outline-none resize-none"
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
                      className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-section-command focus:outline-none"
                      placeholder="How to set up..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider">EXECUTION (optional)</label>
                    <input
                      type="text"
                      value={formData.instructions_execution}
                      onChange={(e) => setFormData({ ...formData, instructions_execution: e.target.value })}
                      className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-section-command focus:outline-none"
                      placeholder="How to perform..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider">TIPS (optional)</label>
                    <input
                      type="text"
                      value={formData.instructions_tips}
                      onChange={(e) => setFormData({ ...formData, instructions_tips: e.target.value })}
                      className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-section-command focus:outline-none"
                      placeholder="Pro tips..."
                    />
                  </div>
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
                    disabled={createExercise.isPending || updateExercise.isPending}
                    className="flex-1 py-3 bg-section-command text-background font-display rounded hover:box-glow-command transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {editingExercise ? "UPDATE" : "CREATE"}
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
