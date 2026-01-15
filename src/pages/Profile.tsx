import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, AlertCircle, Check, Trophy, Zap, Target, Dumbbell, Trash2, Calendar, X, ChevronDown, ChevronUp, Skull, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useCompletedSessions, useDeleteSession } from '@/hooks/useWorkoutSessions';
import { useUserExercises, useDeleteExercise } from '@/hooks/useExercises';
import { useWipeAllData } from '@/hooks/useWipeData';
import { z } from 'zod';
import { format } from 'date-fns';

const displayNameSchema = z.string().min(3, { message: 'Display name must be at least 3 characters' }).max(15, { message: 'Display name must be 15 characters or less' }).regex(/^[a-zA-Z0-9_-]+$/, { message: 'Only letters, numbers, underscores and dashes allowed' });

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: sessions, isLoading: sessionsLoading } = useCompletedSessions();
  const { data: userExercises, isLoading: exercisesLoading } = useUserExercises();
  const updateProfile = useUpdateProfile();
  const deleteSession = useDeleteSession();
  const deleteExercise = useDeleteExercise();
  const wipeAllData = useWipeAllData();
  
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteExerciseId, setDeleteExerciseId] = useState<string | null>(null);
  const [showMissions, setShowMissions] = useState(true);
  const [showExercises, setShowExercises] = useState(true);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  // Redirect anonymous users to auth
  if (isAnonymous) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-3xl text-primary mb-4">ACCESS DENIED</h1>
            <p className="text-muted-foreground mb-6">You must authenticate to view your profile.</p>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
            >
              AUTHENTICATE
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (displayName.trim()) {
      const result = displayNameSchema.safeParse(displayName.trim());
      if (!result.success) {
        setError(result.error.errors[0]?.message || 'Invalid display name');
        return;
      }
    }

    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() || null });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile. Try again.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      await deleteExercise.mutateAsync(exerciseId);
      setDeleteExerciseId(null);
    } catch (err) {
      console.error('Failed to delete exercise:', err);
    }
  };

  const handleWipeAllData = async () => {
    if (wipeConfirmText !== 'SCORCHED EARTH') return;
    try {
      await wipeAllData.mutateAsync();
      setShowWipeConfirm(false);
      setWipeConfirmText('');
    } catch (err) {
      console.error('Failed to wipe data:', err);
    }
  };

  // Calculate level from XP
  const xp = profile?.total_xp || 0;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const xpForNextLevel = (level * level) * 100;
  const xpProgress = ((xp - ((level - 1) * (level - 1) * 100)) / (xpForNextLevel - ((level - 1) * (level - 1) * 100))) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button 
            onClick={() => navigate(-1)}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-primary">AGENT PROFILE</h1>
            <p className="text-xs text-muted-foreground tracking-wider">PERSONNEL FILE</p>
          </div>
        </motion.header>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="font-display text-xl text-primary animate-neon-pulse">LOADING...</div>
          </div>
        ) : (
          <>
            {/* Level Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-lg p-6 mb-6 text-center"
            >
              <div className="font-display text-6xl text-primary text-glow-primary mb-2">{level}</div>
              <div className="text-sm text-muted-foreground mb-4">LEVEL</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, xpProgress)}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <Trophy className="w-5 h-5 mx-auto mb-2 text-accent" />
                <div className="font-display text-2xl text-accent">{(profile?.total_score || 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">TOTAL SCORE</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <Zap className="w-5 h-5 mx-auto mb-2 text-secondary" />
                <div className="font-display text-2xl text-secondary">{profile?.max_combo || 0}x</div>
                <div className="text-xs text-muted-foreground">MAX COMBO</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <Target className="w-5 h-5 mx-auto mb-2 text-primary" />
                <div className="font-display text-2xl text-primary">{profile?.total_sets || 0}</div>
                <div className="text-xs text-muted-foreground">TOTAL SETS</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <Dumbbell className="w-5 h-5 mx-auto mb-2 text-success" />
                <div className="font-display text-2xl text-success">{((profile?.total_weight || 0) / 1000).toFixed(1)}k</div>
                <div className="text-xs text-muted-foreground">LBS LIFTED</div>
              </div>
            </motion.div>

            {/* Edit Display Name */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="bg-card border border-border rounded-lg p-6 mb-6"
            >
              <h2 className="font-display text-lg text-muted-foreground mb-4">CALL SIGN</h2>
              
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setError(null);
                      setSuccess(false);
                    }}
                    className="w-full bg-background border border-border rounded pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors font-display"
                    placeholder="GHOST_REAPER"
                    maxLength={15}
                  />
                </div>
                <p className="text-xs text-muted-foreground">3-15 characters. Letters, numbers, underscores, dashes.</p>
                
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded text-sm text-success">
                    <Check className="w-4 h-4" />
                    <span>Profile updated successfully!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="w-full py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {updateProfile.isPending ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </motion.form>

            {/* Completed Missions */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-lg p-6 mb-6"
            >
              <button 
                onClick={() => setShowMissions(!showMissions)}
                className="w-full flex items-center justify-between font-display text-lg text-muted-foreground mb-4"
              >
                <span>MISSION HISTORY ({sessions?.length || 0})</span>
                {showMissions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              <AnimatePresence>
                {showMissions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {sessionsLoading ? (
                      <div className="text-center py-4">
                        <div className="font-display text-sm text-primary animate-neon-pulse">LOADING...</div>
                      </div>
                    ) : !sessions || sessions.length === 0 ? (
                      <div className="text-center py-4">
                        <Trophy className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">No completed missions yet.</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">Complete workouts to build your history.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sessions.map((session) => {
                          const missionName = session.missions?.name || (session.mission_snapshot as any)?.name || 'Unknown Mission';
                          const missionCodeName = session.missions?.code_name || (session.mission_snapshot as any)?.code_name || 'UNKNOWN';
                          
                          return (
                            <div key={session.id} className="relative">
                              <div className="bg-background border border-border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-display text-sm text-primary truncate">
                                      {missionCodeName}
                                    </div>
                                    <div className="text-xs text-muted-foreground/80 truncate">
                                      {missionName}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      {session.completed_at ? format(new Date(session.completed_at), 'MMM d, yyyy • h:mm a') : 'Unknown date'}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                                      <span className="text-accent font-display">{session.score_earned.toLocaleString()} pts</span>
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

                              {/* Delete Confirmation Modal */}
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
                                        This will remove {session.score_earned.toLocaleString()} pts and {session.xp_earned} XP from your profile. This cannot be undone.
                                      </p>
                                      <div className="flex gap-2 justify-center">
                                        <button
                                          onClick={() => setDeleteConfirmId(null)}
                                          className="px-4 py-2 border border-border rounded text-sm hover:bg-muted transition-colors"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSession(session.id)}
                                          disabled={deleteSession.isPending}
                                          className="px-4 py-2 bg-destructive text-destructive-foreground rounded text-sm font-display hover:bg-destructive/90 transition-colors disabled:opacity-50"
                                        >
                                          {deleteSession.isPending ? 'DELETING...' : 'DELETE'}
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
                )}
              </AnimatePresence>
            </motion.section>

            {/* User Created Exercises */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <button 
                onClick={() => setShowExercises(!showExercises)}
                className="w-full flex items-center justify-between font-display text-lg text-muted-foreground mb-4"
              >
                <span>MY EXERCISES ({userExercises?.length || 0})</span>
                {showExercises ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              <AnimatePresence>
                {showExercises && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {exercisesLoading ? (
                      <div className="text-center py-4">
                        <div className="font-display text-sm text-primary animate-neon-pulse">LOADING...</div>
                      </div>
                    ) : !userExercises || userExercises.length === 0 ? (
                      <div className="text-center py-4">
                        <Dumbbell className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">No custom exercises yet.</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">Create exercises in the Exercise Manager.</p>
                        <button
                          onClick={() => navigate('/exercises')}
                          className="mt-4 px-4 py-2 border border-primary text-primary font-display text-sm rounded hover:bg-primary/10 transition-colors"
                        >
                          CREATE EXERCISE
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userExercises.map((exercise) => (
                          <div key={exercise.id} className="relative">
                            <div className="bg-background border border-border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-display text-sm text-secondary truncate">
                                    {exercise.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <span className="text-primary">{exercise.primary_muscle_group}</span>
                                    {exercise.equipment && exercise.equipment.length > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{exercise.equipment.join(', ')}</span>
                                      </>
                                    )}
                                  </div>
                                  {exercise.description && (
                                    <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">
                                      {exercise.description}
                                    </p>
                                  )}
                                </div>
                                
                                <button
                                  onClick={() => setDeleteExerciseId(exercise.id)}
                                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                  title="Delete this exercise"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Delete Confirmation Modal */}
                            <AnimatePresence>
                              {deleteExerciseId === exercise.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute inset-0 bg-card border-2 border-destructive rounded-lg p-4 flex flex-col justify-center z-10"
                                >
                                  <div className="text-center">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                                    <p className="text-sm font-display text-destructive mb-1">DELETE EXERCISE?</p>
                                    <p className="text-xs text-muted-foreground mb-4">
                                      This will permanently delete "{exercise.name}". This cannot be undone.
                                    </p>
                                    <div className="flex gap-2 justify-center">
                                      <button
                                        onClick={() => setDeleteExerciseId(null)}
                                        className="px-4 py-2 border border-border rounded text-sm hover:bg-muted transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteExercise(exercise.id)}
                                        disabled={deleteExercise.isPending}
                                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded text-sm font-display hover:bg-destructive/90 transition-colors disabled:opacity-50"
                                      >
                                        {deleteExercise.isPending ? 'DELETING...' : 'DELETE'}
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
            {/* Scorched Earth - Wipe All Data */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card border border-destructive/30 rounded-lg p-6 mt-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Skull className="w-6 h-6 text-destructive" />
                <h2 className="font-display text-lg text-destructive">SCORCHED EARTH PROTOCOL</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently erase all mission history, custom exercises, weight records, and reset your stats to zero. 
                Your call sign will be preserved. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowWipeConfirm(true)}
                className="w-full py-3 border-2 border-destructive text-destructive font-display rounded hover:bg-destructive hover:text-destructive-foreground transition-all flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                INITIATE PROTOCOL
              </button>
            </motion.section>
          </>
        )}
      </div>

      {/* Wipe Confirmation Modal */}
      <AnimatePresence>
        {showWipeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border-2 border-destructive rounded-lg p-6 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Skull className="w-10 h-10 text-destructive animate-pulse" />
                </div>
                <h2 className="font-display text-2xl text-destructive mb-2">SCORCHED EARTH</h2>
                <p className="text-muted-foreground text-sm">
                  This will permanently destroy all your progress:
                </p>
              </div>
              
              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-destructive" />
                  <span>{sessions?.length || 0} mission records</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-destructive" />
                  <span>{userExercises?.length || 0} custom exercises</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-destructive" />
                  <span>{(profile?.total_score || 0).toLocaleString()} total score</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-destructive" />
                  <span>{(profile?.total_xp || 0).toLocaleString()} XP (Level {level})</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-destructive" />
                  <span>All weight history records</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="text-xs text-muted-foreground mb-2 block">
                  Type <span className="text-destructive font-display">SCORCHED EARTH</span> to confirm:
                </label>
                <input
                  type="text"
                  value={wipeConfirmText}
                  onChange={(e) => setWipeConfirmText(e.target.value.toUpperCase())}
                  className="w-full bg-background border border-destructive/50 rounded px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none transition-colors font-display text-center tracking-widest"
                  placeholder="SCORCHED EARTH"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWipeConfirm(false);
                    setWipeConfirmText('');
                  }}
                  className="flex-1 py-3 border border-border rounded font-display hover:bg-muted transition-colors"
                >
                  ABORT
                </button>
                <button
                  onClick={handleWipeAllData}
                  disabled={wipeConfirmText !== 'SCORCHED EARTH' || wipeAllData.isPending}
                  className="flex-1 py-3 bg-destructive text-destructive-foreground font-display rounded hover:bg-destructive/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {wipeAllData.isPending ? (
                    <>DESTROYING...</>
                  ) : (
                    <>
                      <Skull className="w-5 h-5" />
                      EXECUTE
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
