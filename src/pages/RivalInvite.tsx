import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, UserPlus, ArrowLeft, Loader2, Check, X, Trophy, Mail, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileByRivalCode, useAddRival } from '@/hooks/useRivals';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }).max(255),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(72),
});

const displayNameSchema = z.string().min(3, { message: 'Display name must be at least 3 characters' }).max(15, { message: 'Display name must be 15 characters or less' }).regex(/^[a-zA-Z0-9_-]+$/, { message: 'Only letters, numbers, underscores and dashes allowed' });

const RivalInvite = () => {
  const { rivalCode } = useParams<{ rivalCode: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();
  const { data: rivalProfile, isLoading: profileLoading } = useProfileByRivalCode(rivalCode);
  const addRival = useAddRival();
  const updateProfile = useUpdateProfile();
  
  const [joined, setJoined] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  
  // Auth form state (only used for non-logged-in users)
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptRival = async () => {
    if (!rivalCode) return;
    
    setIsAccepting(true);
    try {
      await addRival.mutateAsync(rivalCode);
      setJoined(true);
      // Mark as visited to skip first-visit popup on dashboard
      localStorage.setItem('iron-protocol-visited', 'true');
      toast.success('RIVALRY ESTABLISHED! ⚔️', {
        description: `You and ${rivalProfile?.display_name || 'your rival'} are now competing!`,
      });
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      setIsAccepting(false);
      toast.error('Failed to add rival', {
        description: error.message,
      });
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Try signing in instead.');
          } else {
            setError(error.message);
          }
          return;
        }
        
        // Set display name if provided
        if (displayName.trim()) {
          try {
            await updateProfile.mutateAsync({ display_name: displayName.trim() });
          } catch {
            // Non-blocking
          }
        }
        // After signup, accept the rivalry
        await handleAcceptRival();
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(error.message);
          }
          return;
        }
        // After signin, accept the rivalry
        await handleAcceptRival();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-display text-xl text-primary animate-neon-pulse">SCANNING RIVAL CODE...</p>
        </div>
      </div>
    );
  }

  // Invalid code
  if (!rivalProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-destructive/50 rounded-lg p-8 max-w-md w-full text-center"
        >
          <X className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl text-destructive mb-2">INVALID CODE</h1>
          <p className="text-muted-foreground mb-6">
            This rival code doesn't exist or has expired.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Base
          </Button>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (joined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-secondary rounded-lg p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Check className="w-20 h-20 text-secondary mx-auto mb-4" />
          </motion.div>
          <h1 className="font-display text-3xl text-secondary mb-2">RIVALRY ACTIVE!</h1>
          <p className="text-muted-foreground mb-4">
            The competition begins now. Good luck!
          </p>
          <p className="text-xs text-muted-foreground animate-pulse">Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  // Main invite page
  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/50 rounded-lg p-6 max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Swords className="w-12 h-12 text-primary mx-auto mb-3" />
            </motion.div>
            <h1 className="font-display text-2xl text-primary mb-1">RIVAL MODE</h1>
            <p className="text-sm text-muted-foreground">You've been challenged!</p>
          </div>

          {/* Rival Profile */}
          <div className="bg-background border border-border rounded-lg p-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg text-secondary">
                  {rivalProfile.display_name || 'Anonymous Warrior'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Score: {rivalProfile.total_score?.toLocaleString() || 0} • XP: {rivalProfile.total_xp?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground mb-5 space-y-1.5">
            <p>⚔️ Compete head-to-head with weekly rankings</p>
            <p>📊 Track each other's progress in real-time</p>
            <p>🏆 Earn bragging rights and achievements</p>
          </div>

          {/* Logged-in user: Simple accept button */}
          {user ? (
            <div className="space-y-3">
              <Button
                onClick={handleAcceptRival}
                disabled={isAccepting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display"
                size="lg"
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                ACCEPT RIVALRY
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-destructive"
                size="sm"
              >
                <ArrowLeft className="w-3 h-3 mr-2" />
                Decline & Return
              </Button>
            </div>
          ) : (
            /* Non-logged-in user: Auth form */
            <>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-xs text-muted-foreground">
                    {isSignUp ? 'Create an account to accept' : 'Sign in to accept'}
                  </p>
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    placeholder="Email"
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    placeholder="Password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Display Name (Sign Up Only) */}
                {isSignUp && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-background border border-border rounded pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                      placeholder="Call Sign (optional)"
                      maxLength={15}
                    />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 p-2.5 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {isSignUp ? 'CREATE & ACCEPT' : 'SIGN IN & ACCEPT'}
                </Button>

                {/* Toggle */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-secondary transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                  </button>
                </div>
              </form>

              {/* Decline */}
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  onClick={() => navigate('/')}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-destructive"
                  size="sm"
                >
                  <ArrowLeft className="w-3 h-3 mr-2" />
                  Decline & Return
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RivalInvite;
