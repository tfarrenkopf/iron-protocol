import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, AlertCircle, Check, Trophy, Zap, Target, Dumbbell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { z } from 'zod';

const displayNameSchema = z.string().min(3, { message: 'Display name must be at least 3 characters' }).max(15, { message: 'Display name must be 15 characters or less' }).regex(/^[a-zA-Z0-9_-]+$/, { message: 'Only letters, numbers, underscores and dashes allowed' });

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
              className="bg-card border border-border rounded-lg p-6"
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
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
