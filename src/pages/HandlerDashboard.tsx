import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Target, Plus, Copy, Check, Trash2, ChevronRight, Send, Calendar, ChevronDown, ChevronUp, Edit3, X, Save, Dumbbell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsHandler, useSquads, useCreateSquad, useDeleteSquad } from '@/hooks/useHandlerMode';
import { useHandlerAssignments, useDeleteAssignment, useUpdateAssignmentSnapshot } from '@/hooks/useAssignments';
import { format } from 'date-fns';

const HandlerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isHandler, isLoading: handlerLoading } = useIsHandler();
  const { data: squads, isLoading: squadsLoading } = useSquads();
  const { data: assignments, isLoading: assignmentsLoading } = useHandlerAssignments();
  const createSquad = useCreateSquad();
  const deleteSquad = useDeleteSquad();
  const deleteAssignment = useDeleteAssignment();
  const updateSnapshot = useUpdateAssignmentSnapshot();

  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [squadCodeName, setSquadCodeName] = useState('');
  const [squadDescription, setSquadDescription] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [editingExercises, setEditingExercises] = useState<any[]>([]);

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!squadName.trim() || !squadCodeName.trim()) {
      setError('Name and code name are required');
      return;
    }

    try {
      await createSquad.mutateAsync({
        name: squadName.trim(),
        code_name: squadCodeName.trim().toUpperCase(),
        description: squadDescription.trim() || undefined,
      });
      setShowCreateSquad(false);
      setSquadName('');
      setSquadCodeName('');
      setSquadDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create squad');
    }
  };

  const handleCopyInvite = async (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(inviteCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteSquad = async (squadId: string) => {
    if (!confirm('Delete this squad? All members will be removed.')) return;
    try {
      await deleteSquad.mutateAsync(squadId);
    } catch (err) {
      console.error('Failed to delete squad:', err);
    }
  };

  const handleToggleExpand = (assignmentId: string) => {
    setExpandedAssignment(prev => prev === assignmentId ? null : assignmentId);
  };

  const handleStartEdit = (assignment: any) => {
    const snapshot = assignment.mission_snapshot as any;
    setEditingAssignment(assignment.id);
    setEditingExercises(snapshot?.mission_exercises || []);
  };

  const handleCancelEdit = () => {
    setEditingAssignment(null);
    setEditingExercises([]);
  };

  const handleSaveEdit = async (assignment: any) => {
    const snapshot = assignment.mission_snapshot as any;
    const updatedSnapshot = {
      ...snapshot,
      mission_exercises: editingExercises,
    };
    
    try {
      await updateSnapshot.mutateAsync({
        assignmentId: assignment.id,
        missionSnapshot: updatedSnapshot,
      });
      setEditingAssignment(null);
      setEditingExercises([]);
    } catch (err) {
      console.error('Failed to update assignment:', err);
    }
  };

  const handleUpdateExercise = (index: number, field: string, value: number) => {
    setEditingExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveExercise = (index: number) => {
    setEditingExercises(prev => prev.filter((_, i) => i !== index));
  };

  // Redirect if not a handler
  if (!handlerLoading && !isHandler) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-md text-center">
          <h1 className="font-display text-3xl text-destructive mb-4">ACCESS DENIED</h1>
          <p className="text-muted-foreground mb-6">You must enable Handler Mode in your profile first.</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
          >
            GO TO PROFILE
          </button>
        </div>
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
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 border border-border rounded hover:border-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-3xl text-secondary text-glow-secondary">HANDLER OPS</h1>
              <p className="text-xs text-muted-foreground tracking-wider">SQUAD COMMAND CENTER</p>
            </div>
          </div>
        </motion.header>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-secondary" />
            <div className="font-display text-3xl text-secondary">
              {squads?.reduce((acc, s) => acc + (s.squad_members?.length || 0), 0) || 0}
            </div>
            <div className="text-xs text-muted-foreground">TOTAL AGENTS</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-accent" />
            <div className="font-display text-3xl text-accent">
              {assignments?.filter(a => a.status !== 'COMPLETED').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">ACTIVE ORDERS</div>
          </div>
        </motion.div>

        {/* Squads Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-muted-foreground tracking-wider">
              // YOUR SQUADS
            </h2>
            <button
              onClick={() => setShowCreateSquad(true)}
              className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground font-display text-sm rounded hover:box-glow-secondary transition-all"
            >
              <Plus className="w-4 h-4" />
              NEW SQUAD
            </button>
          </div>

          {squadsLoading ? (
            <div className="text-center py-8">
              <div className="font-display text-lg text-primary animate-neon-pulse">LOADING...</div>
            </div>
          ) : !squads || squads.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No squads yet.</p>
              <p className="text-sm text-muted-foreground/60">Create a squad to start assigning missions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {squads.map((squad, i) => (
                <motion.div
                  key={squad.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-display text-lg text-secondary">{squad.code_name}</div>
                      <div className="text-sm text-muted-foreground">{squad.name}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteSquad(squad.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete squad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Invite Link Section */}
                  <div className="bg-muted/50 border border-border rounded-lg p-3 mb-3">
                    <div className="text-xs text-muted-foreground mb-2">INVITE LINK</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-background px-2 py-1.5 rounded border border-border text-primary font-mono overflow-hidden text-ellipsis">
                        {`${window.location.origin}/join/${squad.invite_code}`}
                      </code>
                      <button
                        onClick={() => handleCopyInvite(squad.invite_code)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-display rounded hover:box-glow-primary transition-all"
                      >
                        {copiedCode === squad.invite_code ? (
                          <>
                            <Check className="w-3 h-3" />
                            COPIED!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            COPY
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      Share this link with athletes to join your squad
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{squad.squad_members?.length || 0} members</span>
                    </div>
                    <button
                      onClick={() => navigate(`/handler/assign/${squad.id}`)}
                      className="flex items-center gap-1 text-xs text-accent hover:text-glow-accent font-display"
                    >
                      ASSIGN MISSION
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Member list preview */}
                  {squad.squad_members && squad.squad_members.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-2">SQUAD MEMBERS</div>
                      <div className="flex flex-wrap gap-2">
                        {squad.squad_members.slice(0, 5).map((member: { id: string; profiles?: { display_name?: string } }) => (
                          <span
                            key={member.id}
                            className="text-xs px-2 py-1 bg-secondary/10 border border-secondary/20 rounded text-secondary"
                          >
                            {member.profiles?.display_name || 'Agent'}
                          </span>
                        ))}
                        {squad.squad_members.length > 5 && (
                          <span className="text-xs px-2 py-1 text-muted-foreground">
                            +{squad.squad_members.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Recent Assignments */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display text-lg text-muted-foreground mb-4 tracking-wider">
            // RECENT ORDERS
          </h2>

          {assignmentsLoading ? (
            <div className="text-center py-4">
              <div className="font-display text-sm text-primary animate-neon-pulse">LOADING...</div>
            </div>
          ) : !assignments || assignments.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <Send className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No orders sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 10).map((assignment, i) => {
                const snapshot = assignment.mission_snapshot as any;
                const exercises = snapshot?.mission_exercises || [];
                const isExpanded = expandedAssignment === assignment.id;
                const isEditing = editingAssignment === assignment.id;
                const statusColors = {
                  'NOT_STARTED': 'text-muted-foreground',
                  'IN_PROGRESS': 'text-warning',
                  'COMPLETED': 'text-success',
                };
                
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.03 }}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                  >
                    {/* Header Row */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => handleToggleExpand(assignment.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-display text-sm text-primary truncate">
                            {snapshot?.code_name || 'Unknown Mission'}
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>→ {assignment.assignee_type === 'SQUAD' 
                            ? (assignment.squads as any)?.name 
                            : (assignment.profiles as any)?.display_name || 'Agent'
                          }</span>
                          {assignment.due_at && (
                            <>
                              <Calendar className="w-3 h-3" />
                              <span>{format(new Date(assignment.due_at), 'MMM d')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-display ${statusColors[assignment.status as keyof typeof statusColors]}`}>
                          {assignment.status.replace('_', ' ')}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-border"
                        >
                          <div className="p-3 bg-muted/20">
                            {/* Mission Info */}
                            {snapshot?.name && (
                              <div className="text-xs text-muted-foreground mb-3">
                                {snapshot.name}
                              </div>
                            )}

                            {/* Exercises List */}
                            <div className="space-y-2 mb-3">
                              <div className="text-xs text-muted-foreground font-display tracking-wider">EXERCISES</div>
                              {(isEditing ? editingExercises : exercises).map((ex: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className="bg-background border border-border rounded p-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Dumbbell className="w-3 h-3 text-accent flex-shrink-0" />
                                      <span className="text-sm text-foreground truncate">
                                        {ex.exercises?.name || 'Unknown Exercise'}
                                      </span>
                                    </div>
                                    {isEditing && (
                                      <button
                                        onClick={() => handleRemoveExercise(idx)}
                                        className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  
                                  {isEditing ? (
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                      <label className="flex items-center gap-1">
                                        <span className="text-muted-foreground">Sets:</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="20"
                                          value={ex.target_sets}
                                          onChange={(e) => handleUpdateExercise(idx, 'target_sets', parseInt(e.target.value) || 1)}
                                          className="w-12 bg-muted border border-border rounded px-1 py-0.5 text-center"
                                        />
                                      </label>
                                      <label className="flex items-center gap-1">
                                        <span className="text-muted-foreground">Reps:</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="100"
                                          value={ex.target_reps}
                                          onChange={(e) => handleUpdateExercise(idx, 'target_reps', parseInt(e.target.value) || 1)}
                                          className="w-12 bg-muted border border-border rounded px-1 py-0.5 text-center"
                                        />
                                      </label>
                                      <label className="flex items-center gap-1">
                                        <span className="text-muted-foreground">Rest:</span>
                                        <input
                                          type="number"
                                          min="0"
                                          max="300"
                                          step="5"
                                          value={ex.rest_between_sets_sec}
                                          onChange={(e) => handleUpdateExercise(idx, 'rest_between_sets_sec', parseInt(e.target.value) || 0)}
                                          className="w-14 bg-muted border border-border rounded px-1 py-0.5 text-center"
                                        />
                                        <span className="text-muted-foreground">s</span>
                                      </label>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                      <span>{ex.target_sets} sets</span>
                                      <span>×</span>
                                      <span>{ex.target_reps} reps</span>
                                      <span className="text-muted-foreground/60">({ex.rest_between_sets_sec}s rest)</span>
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-muted-foreground/60 mt-1">
                                    {ex.exercises?.primary_muscle_group}
                                  </div>
                                </div>
                              ))}
                              
                              {exercises.length === 0 && !isEditing && (
                                <div className="text-xs text-muted-foreground italic">No exercises in this assignment</div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleSaveEdit(assignment)}
                                    disabled={updateSnapshot.isPending}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-success text-success-foreground text-xs font-display rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                                  >
                                    <Save className="w-3 h-3" />
                                    {updateSnapshot.isPending ? 'SAVING...' : 'SAVE'}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-display rounded hover:bg-muted/80 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                    CANCEL
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(assignment);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-secondary/20 text-secondary text-xs font-display rounded hover:bg-secondary/30 transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  EDIT
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this assignment?')) {
                                    deleteAssignment.mutateAsync(assignment.id);
                                  }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-destructive text-xs font-display rounded hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                DELETE
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Create Squad Modal */}
        <AnimatePresence>
          {showCreateSquad && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateSquad(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-secondary rounded-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display text-xl text-secondary mb-4">CREATE SQUAD</h3>
                
                <form onSubmit={handleCreateSquad} className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider">CODE NAME</label>
                    <input
                      type="text"
                      value={squadCodeName}
                      onChange={(e) => setSquadCodeName(e.target.value.toUpperCase())}
                      className="w-full bg-background border border-border rounded px-3 py-2 mt-1 font-display focus:border-secondary focus:outline-none"
                      placeholder="ALPHA_SQUAD"
                      maxLength={20}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider">FULL NAME</label>
                    <input
                      type="text"
                      value={squadName}
                      onChange={(e) => setSquadName(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-secondary focus:outline-none"
                      placeholder="Monday Night Warriors"
                      maxLength={50}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider">DESCRIPTION (optional)</label>
                    <textarea
                      value={squadDescription}
                      onChange={(e) => setSquadDescription(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-secondary focus:outline-none resize-none"
                      placeholder="Brief squad description..."
                      rows={2}
                      maxLength={200}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-destructive">{error}</div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateSquad(false)}
                      className="flex-1 py-3 bg-muted text-muted-foreground font-display rounded hover:bg-muted/80 transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={createSquad.isPending}
                      className="flex-1 py-3 bg-secondary text-secondary-foreground font-display rounded hover:box-glow-secondary transition-all disabled:opacity-50"
                    >
                      {createSquad.isPending ? 'CREATING...' : 'CREATE'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HandlerDashboard;
