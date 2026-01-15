import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Calendar, Check, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMissions } from '@/hooks/useMissions';
import { useSquads } from '@/hooks/useHandlerMode';
import { useCreateAssignment } from '@/hooks/useAssignments';
import { format, addDays } from 'date-fns';

const AssignMission = () => {
  const navigate = useNavigate();
  const { squadId } = useParams<{ squadId: string }>();
  const { user } = useAuth();
  const { data: missions, isLoading: missionsLoading } = useMissions({});
  const { data: squads } = useSquads();
  const createAssignment = useCreateAssignment();

  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const squad = squads?.find(s => s.id === squadId);
  const mission = missions?.find(m => m.id === selectedMission);

  const handleAssign = async () => {
    if (!selectedMission || !mission || !squadId) return;
    setError(null);

    try {
      await createAssignment.mutateAsync({
        missionSnapshot: {
          id: mission.id,
          name: mission.name,
          code_name: mission.code_name,
          description: mission.description,
          focus_areas: mission.focus_areas,
          estimated_minutes: mission.estimated_minutes,
          difficulty: mission.difficulty,
          mission_exercises: mission.mission_exercises,
        },
        assigneeType: 'SQUAD',
        assigneeId: squadId,
        dueAt: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/handler'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign mission');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Check className="w-16 h-16 mx-auto mb-4 text-success" />
          </motion.div>
          <h1 className="font-display text-2xl text-success mb-2">ORDER DISPATCHED!</h1>
          <p className="text-muted-foreground">
            Mission assigned to {squad?.code_name}. Redirecting...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button 
            onClick={() => navigate('/handler')}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-accent">ASSIGN MISSION</h1>
            <p className="text-xs text-muted-foreground tracking-wider">
              TO: {squad?.code_name || 'SQUAD'}
            </p>
          </div>
        </motion.header>

        {/* Selected Mission Preview */}
        {mission && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border-2 border-accent rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-xl text-accent">{mission.code_name}</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <div 
                    key={j}
                    className={`w-2 h-2 rounded-sm ${j < mission.difficulty ? 'bg-accent' : 'bg-muted'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{mission.description}</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{mission.mission_exercises?.length || 0} exercises</span>
              <span>•</span>
              <span>{mission.estimated_minutes}min</span>
            </div>
          </motion.div>
        )}

        {/* Due Date */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="text-xs text-muted-foreground tracking-wider">DUE DATE (optional)</label>
          <div className="flex gap-2 mt-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="flex-1 bg-background border border-border rounded px-3 py-2 focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => setDueDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
              className="px-3 py-2 bg-muted text-muted-foreground text-xs rounded hover:bg-muted/80"
            >
              TOMORROW
            </button>
            <button
              onClick={() => setDueDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'))}
              className="px-3 py-2 bg-muted text-muted-foreground text-xs rounded hover:bg-muted/80"
            >
              1 WEEK
            </button>
          </div>
        </motion.div>

        {/* Mission Selection */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // SELECT MISSION
          </h2>

          {missionsLoading ? (
            <div className="text-center py-8">
              <div className="font-display text-lg text-primary animate-neon-pulse">LOADING...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {missions?.map((m, i) => (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                  onClick={() => setSelectedMission(m.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedMission === m.id
                      ? 'bg-accent/10 border-accent'
                      : 'bg-card border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-display text-sm text-primary">{m.code_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {m.mission_exercises?.length || 0} ex • {m.estimated_minutes}min
                      </span>
                    </div>
                    {selectedMission === m.id && (
                      <Check className="w-4 h-4 text-accent" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Assign Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={handleAssign}
            disabled={!selectedMission || createAssignment.isPending}
            className="w-full py-4 bg-accent text-accent-foreground font-display text-lg rounded flex items-center justify-center gap-3 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: selectedMission ? '0 0 20px hsl(20 100% 60% / 0.4)' : 'none' }}
          >
            <Send className="w-5 h-5" />
            {createAssignment.isPending ? 'DISPATCHING...' : 'DISPATCH ORDER'}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            {squad?.squad_members?.length || 0} agents will receive this order
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AssignMission;
