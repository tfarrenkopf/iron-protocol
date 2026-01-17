import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, AlertCircle, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile, useUpdateProfileStats } from '@/hooks/useProfile';
import { useCreateWorkoutSession } from '@/hooks/useWorkoutSessions';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }).max(255),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(72),
});

const displayNameSchema = z.string().min(3, { message: 'Display name must be at least 3 characters' }).max(15, { message: 'Display name must be 15 characters or less' }).regex(/^[a-zA-Z0-9_-]+$/, { message: 'Only letters, numbers, underscores and dashes allowed' });

interface PendingWorkout {
  missionId: string;
  missionSnapshot: { name: string; code_name: string };
  scoreEarned: number;
  xpEarned: number;
  setsCompleted: number;
  totalReps: number;
  totalWeight: number;
  maxCombo: number;
  damageDealt: number;
  createdAt: string;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Support redirectTo from both URL query params and location state
  const searchParams = new URLSearchParams(location.search);
  const queryRedirect = searchParams.get('redirectTo');
  const queryMode = searchParams.get('mode'); // 'signup' or 'signin'
  const stateRedirect = (location.state as { redirect?: string })?.redirect;
  const redirectTo = queryRedirect || stateRedirect || '/';
  const isQuickFlow = !!queryRedirect; // Coming from a share link or deep link
  const { signIn, signUp, user } = useAuth();
  const updateProfile = useUpdateProfile();
  const updateProfileStats = useUpdateProfileStats();
  const createWorkoutSession = useCreateWorkoutSession();
  const [isSignUp, setIsSignUp] = useState(queryMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingWorkoutSaved, setPendingWorkoutSaved] = useState(false);

  // Check for pending workout after auth completes
  useEffect(() => {
    if (user && !pendingWorkoutSaved) {
      const pendingWorkoutStr = localStorage.getItem('pendingWorkout');
      if (pendingWorkoutStr) {
        try {
          const pendingWorkout: PendingWorkout = JSON.parse(pendingWorkoutStr);
          
          // Check if workout was created within last hour (prevent old data)
          const createdAt = new Date(pendingWorkout.createdAt);
          const now = new Date();
          const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 1) {
            // Save the workout session
            createWorkoutSession.mutate({
              missionId: pendingWorkout.missionId,
              missionSnapshot: pendingWorkout.missionSnapshot,
              scoreEarned: pendingWorkout.scoreEarned,
              xpEarned: pendingWorkout.xpEarned,
              setsCompleted: pendingWorkout.setsCompleted,
              totalReps: pendingWorkout.totalReps,
              totalWeight: pendingWorkout.totalWeight,
              maxCombo: pendingWorkout.maxCombo,
              damageDealt: pendingWorkout.damageDealt,
            });
            
            // Update profile stats
            updateProfileStats.mutate({
              score: pendingWorkout.scoreEarned,
              xp: pendingWorkout.xpEarned,
              sets: pendingWorkout.setsCompleted,
              reps: pendingWorkout.totalReps,
              weight: pendingWorkout.totalWeight,
              maxCombo: pendingWorkout.maxCombo,
            });
          }
          
          // Clear pending workout
          localStorage.removeItem('pendingWorkout');
          setPendingWorkoutSaved(true);
        } catch {
          localStorage.removeItem('pendingWorkout');
        }
      }
    }
  }, [user, pendingWorkoutSaved, createWorkoutSession, updateProfileStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate inputs
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Invalid input');
      return;
    }

    // Validate display name for signup
    if (isSignUp && displayName) {
      const nameResult = displayNameSchema.safeParse(displayName);
      if (!nameResult.success) {
        setError(nameResult.error.errors[0]?.message || 'Invalid display name');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Try signing in instead.');
          } else {
            setError(error.message);
          }
        } else {
          // Set display name if provided - wait for profile to be created by trigger
          if (displayName.trim()) {
            // Wait a moment for the database trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 500));
            try {
              await updateProfile.mutateAsync({ display_name: displayName.trim() });
            } catch {
              // Retry once more after a delay
              await new Promise(resolve => setTimeout(resolve, 500));
              try {
                await updateProfile.mutateAsync({ display_name: displayName.trim() });
              } catch {
                // Non-blocking - profile update can happen later on profile page
              }
            }
          }
          navigate(redirectTo);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(error.message);
          }
        } else {
          navigate(redirectTo);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <button 
            onClick={() => navigate('/')}
            className="p-2 border border-border rounded hover:border-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-3xl text-foreground">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h1>
            <span className="text-muted-foreground">
              {isSignUp ? (
                <>Already have an account? <button type="button" onClick={() => { setIsSignUp(false); setError(null); }} className="text-secondary hover:underline">Sign In</button></>
              ) : (
                <>Don't have an account? <button type="button" onClick={() => { setIsSignUp(true); setError(null); }} className="text-secondary hover:underline">Sign Up</button></>
              )}
            </span>
          </div>
        </motion.header>

        {/* Auth Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-11 pr-11 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                placeholder="Enter 6 characters or more"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Display Name (Sign Up Only) */}
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm text-foreground">Call Sign <span className="text-muted-foreground">(Optional)</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                  placeholder="GHOST_REAPER"
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-muted-foreground">3-15 characters. Letters, numbers, underscores, dashes only.</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-primary-foreground font-display text-lg rounded-lg hover:box-glow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'PROCESSING...' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </motion.form>

        {/* Anonymous Warning - hide on quick flow */}
        {!isQuickFlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 bg-card border border-border rounded"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-display text-sm text-warning">GUEST MODE AVAILABLE</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can use IRON PROTOCOL without signing in, but your progress won't be saved. 
                  Like a save file that's been corrupted. Forever.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-3 text-xs text-secondary hover:underline"
                >
                  Continue as Guest →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
