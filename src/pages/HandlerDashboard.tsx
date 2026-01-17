import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Target, Plus, Copy, Check, Trash2, ChevronRight, Send, Calendar, Edit3, X, Save, Percent } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsHandler, useSquads, useCreateSquad, useDeleteSquad, useUpdateSquad } from '@/hooks/useHandlerMode';
import { useHandlerAssignments } from '@/hooks/useAssignments';
import { format } from 'date-fns';
import { GlobalNav } from '@/components/GlobalNav';

const HandlerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isHandler, isLoading: handlerLoading } = useIsHandler();
  const { data: squads, isLoading: squadsLoading } = useSquads();
  const { data: assignments, isLoading: assignmentsLoading } = useHandlerAssignments();
  const createSquad = useCreateSquad();
  const deleteSquad = useDeleteSquad();
  const updateSquad = useUpdateSquad();

  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [squadCodeName, setSquadCodeName] = useState('');
  const [squadDescription, setSquadDescription] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Edit squad state
  const [editingSquad, setEditingSquad] = useState<string | null>(null);
  const [editSquadName, setEditSquadName] = useState('');
  const [editSquadCodeName, setEditSquadCodeName] = useState('');
  const [editSquadDescription, setEditSquadDescription] = useState('');

  // Calculate assignments by squad
  const assignmentsBySquad = useMemo(() => {
    if (!assignments) return {};
    const map: Record<string, { total: number; completed: number; missions: string[] }> = {};
    
    assignments.forEach((a: any) => {
      if (a.assignee_type === 'SQUAD') {
        const squadId = a.assignee_id;
        if (!map[squadId]) {
          map[squadId] = { total: 0, completed: 0, missions: [] };
        }
        map[squadId].total++;
        if (a.status === 'COMPLETED') {
          map[squadId].completed++;
        }
        const codeName = (a.mission_snapshot as any)?.code_name;
        if (codeName && !map[squadId].missions.includes(codeName)) {
          map[squadId].missions.push(codeName);
        }
      }
    });
    return map;
  }, [assignments]);

  // Calculate overall completion rate
  const overallStats = useMemo(() => {
    if (!assignments) return { total: 0, completed: 0, rate: 0 };
    const total = assignments.length;
    const completed = assignments.filter((a: any) => a.status === 'COMPLETED').length;
    return { total, completed, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [assignments]);

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

  const handleStartEditSquad = (squad: any) => {
    setEditingSquad(squad.id);
    setEditSquadName(squad.name);
    setEditSquadCodeName(squad.code_name);
    setEditSquadDescription(squad.description || '');
  };

  const handleCancelEditSquad = () => {
    setEditingSquad(null);
    setEditSquadName('');
    setEditSquadCodeName('');
    setEditSquadDescription('');
  };

  const handleSaveEditSquad = async (squadId: string) => {
    if (!editSquadName.trim() || !editSquadCodeName.trim()) {
      return;
    }
    try {
      await updateSquad.mutateAsync({
        squadId,
        data: {
          name: editSquadName.trim(),
          code_name: editSquadCodeName.trim().toUpperCase(),
          description: editSquadDescription.trim() || undefined,
        },
      });
      handleCancelEditSquad();
    } catch (err) {
      console.error('Failed to update squad:', err);
    }
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
        <GlobalNav 
          title="HANDLER OPS"
          subtitle="SQUAD COMMAND CENTER"
          section="handler"
        />

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
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
              {assignments?.filter((a: any) => a.status !== 'COMPLETED').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">ACTIVE ORDERS</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Percent className="w-6 h-6 mx-auto mb-2 text-success" />
            <div className="font-display text-3xl text-success">
              {overallStats.rate}%
            </div>
            <div className="text-xs text-muted-foreground">COMPLETION</div>
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
              {squads.map((squad, i) => {
                const squadStats = assignmentsBySquad[squad.id] || { total: 0, completed: 0, missions: [] };
                const completionRate = squadStats.total > 0 ? Math.round((squadStats.completed / squadStats.total) * 100) : 0;
                const isEditing = editingSquad === squad.id;

                return (
                  <motion.div
                    key={squad.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground tracking-wider">CODE NAME</label>
                          <input
                            type="text"
                            value={editSquadCodeName}
                            onChange={(e) => setEditSquadCodeName(e.target.value.toUpperCase())}
                            className="w-full bg-background border border-border rounded px-3 py-2 mt-1 font-display focus:border-secondary focus:outline-none"
                            maxLength={20}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground tracking-wider">FULL NAME</label>
                          <input
                            type="text"
                            value={editSquadName}
                            onChange={(e) => setEditSquadName(e.target.value)}
                            className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-secondary focus:outline-none"
                            maxLength={50}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground tracking-wider">DESCRIPTION</label>
                          <textarea
                            value={editSquadDescription}
                            onChange={(e) => setEditSquadDescription(e.target.value)}
                            className="w-full bg-background border border-border rounded px-3 py-2 mt-1 focus:border-secondary focus:outline-none resize-none"
                            rows={2}
                            maxLength={200}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEditSquad(squad.id)}
                            disabled={updateSquad.isPending}
                            className="flex items-center gap-1 px-3 py-2 bg-success text-success-foreground text-xs font-display rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            {updateSquad.isPending ? 'SAVING...' : 'SAVE'}
                          </button>
                          <button
                            onClick={handleCancelEditSquad}
                            className="flex items-center gap-1 px-3 py-2 bg-muted text-muted-foreground text-xs font-display rounded hover:bg-muted/80 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            CANCEL
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-display text-lg text-secondary">{squad.code_name}</div>
                            <div className="text-sm text-muted-foreground">{squad.name}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditSquad(squad)}
                              className="p-2 text-muted-foreground hover:text-secondary transition-colors"
                              title="Edit squad"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSquad(squad.id)}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete squad"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Squad Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                          <div className="bg-muted/30 rounded p-2">
                            <div className="font-display text-lg text-secondary">{squad.squad_members?.length || 0}</div>
                            <div className="text-xs text-muted-foreground">Members</div>
                          </div>
                          <div className="bg-muted/30 rounded p-2">
                            <div className="font-display text-lg text-accent">{squadStats.total}</div>
                            <div className="text-xs text-muted-foreground">Orders</div>
                          </div>
                          <div className="bg-muted/30 rounded p-2">
                            <div className="font-display text-lg text-success">{completionRate}%</div>
                            <div className="text-xs text-muted-foreground">Complete</div>
                          </div>
                        </div>

                        {/* Assigned Missions */}
                        {squadStats.missions.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-muted-foreground mb-1">ASSIGNED MISSIONS</div>
                            <div className="flex flex-wrap gap-1">
                              {squadStats.missions.slice(0, 5).map((mission, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-accent"
                                >
                                  {mission}
                                </span>
                              ))}
                              {squadStats.missions.length > 5 && (
                                <span className="text-xs px-2 py-0.5 text-muted-foreground">
                                  +{squadStats.missions.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

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
                            ASSIGN MISSIONS
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
                      </>
                    )}
                  </motion.div>
                );
              })}
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
              {assignments.slice(0, 10).map((assignment: any, i: number) => {
                const snapshot = assignment.mission_snapshot as any;
                const exercises = snapshot?.mission_exercises || [];
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
                    className="bg-card border border-border rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
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
                      <span className={`text-xs font-display ${statusColors[assignment.status as keyof typeof statusColors]}`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                    </div>
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
