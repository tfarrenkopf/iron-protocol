import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Dumbbell, Trash2, AlertCircle, X, Filter } from "lucide-react";
import { useCompletedSessions, useDeleteSession } from "@/hooks/useWorkoutSessions";
import { format } from "date-fns";

type FilterType = 'all' | 'missions' | 'hiit';

export function ProfileHistoryTab() {
  const { data: sessions, isLoading } = useCompletedSessions();
  const deleteSession = useDeleteSession();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredSessions = sessions?.filter(s => {
    if (filter === 'all') return true;
    // Add HIIT filter logic when HIIT sessions are distinguishable
    return true;
  }) || [];

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="font-display text-xl text-primary animate-neon-pulse">LOADING...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(['all', 'missions'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-display rounded transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredSessions.length} records
        </span>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No completed missions yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Complete workouts to build your history
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSessions.map((session) => {
            const missionName =
              session.missions?.name || (session.mission_snapshot as any)?.name || "Unknown Mission";
            const missionCodeName =
              session.missions?.code_name || (session.mission_snapshot as any)?.code_name || "UNKNOWN";

            return (
              <div key={session.id} className="relative">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm text-primary truncate">{missionCodeName}</div>
                      <div className="text-xs text-muted-foreground/80 truncate">{missionName}</div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {session.completed_at
                          ? format(new Date(session.completed_at), "MMM d, yyyy • h:mm a")
                          : "Unknown date"}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                        <span className="text-accent font-display">
                          {session.score_earned.toLocaleString()} pts
                        </span>
                        <span className="text-success font-display">{session.xp_earned} XP</span>
                        <span className="text-secondary">{session.sets_completed} sets</span>
                        <span className="flex items-center gap-1 text-primary">
                          <Dumbbell className="w-3 h-3" />
                          {Number(session.total_weight).toLocaleString()} lbs
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeleteConfirmId(session.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete this mission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                <AnimatePresence>
                  {deleteConfirmId === session.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-card border-2 border-destructive rounded-lg p-4 flex flex-col justify-center z-10"
                    >
                      <div className="text-center">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                        <p className="text-sm font-display text-destructive mb-1">DELETE MISSION?</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          This will remove {session.score_earned.toLocaleString()} pts and{" "}
                          {session.xp_earned} XP. Cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 border border-border rounded text-sm hover:bg-muted transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(session.id)}
                            disabled={deleteSession.isPending}
                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded text-sm font-display hover:bg-destructive/90 transition-colors disabled:opacity-50"
                          >
                            {deleteSession.isPending ? "..." : "DELETE"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
