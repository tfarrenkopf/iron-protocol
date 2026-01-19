import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, UserPlus, Loader2, Check, X, Trophy, Mail, Lock, Eye, EyeOff, User, AlertCircle, Shield, ChevronRight, Skull, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileByRivalCode, useAddRival } from '@/hooks/useRivals';
import { useUpdateProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';
import { displayNameSchema, validateDisplayName } from '@/lib/displayNameValidation';
import { trackSignUp, trackLogin, trackRivalAdded } from '@/lib/analytics';

const authSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }).max(255),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(72),
});

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
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (value.trim()) {
      const validation = validateDisplayName(value);
      setDisplayNameError(validation.isValid ? null : validation.error || null);
    } else {
      setDisplayNameError(null);
    }
  };

  const handleAcceptRival = async () => {
    if (!rivalCode) return;
    
    setIsAccepting(true);
    try {
      await addRival.mutateAsync(rivalCode);
      trackRivalAdded();
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
        
        // Track successful signup
        trackSignUp('email');
        
        // Set display name if provided - wait for profile to be created by trigger
        if (displayName.trim()) {
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            await updateProfile.mutateAsync({ display_name: displayName.trim() });
          } catch {
            // Retry once more after a delay
            await new Promise(resolve => setTimeout(resolve, 500));
            try {
              await updateProfile.mutateAsync({ display_name: displayName.trim() });
            } catch {
              // Non-blocking
            }
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
        // Track successful login
        trackLogin('email');
        // After signin, accept the rivalry
        await handleAcceptRival();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = () => {
    localStorage.setItem('iron-protocol-visited', 'true');
    navigate('/auth?mode=signup');
  };

  const handleSignIn = () => {
    localStorage.setItem('iron-protocol-visited', 'true');
    navigate('/auth?mode=signin');
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem('iron-protocol-visited', 'true');
    navigate('/command?tab=missions');
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

  // Invalid code - but still offer onboarding options
  if (!rivalProfile) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card border-2 border-border rounded-lg p-4 max-w-sm w-full relative"
        >
          {/* Close button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-full">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-4">
            <h2 className="font-display text-xl text-destructive mb-1">
              INVITE NOT FOUND
            </h2>
            <p className="text-muted-foreground text-sm">
              This rival code may have expired or doesn't exist. But you can still join Iron Protocol!
            </p>
          </div>

          {/* What is Rival Mode */}
          <div className="bg-background rounded-lg p-3 mb-4 border border-border space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded bg-section-intel/20 mt-0.5">
                <Swords className="w-4 h-4 text-section-intel" />
              </div>
              <div>
                <span className="text-section-intel font-display text-sm">RIVAL MODE</span>
                <p className="text-muted-foreground text-xs">
                  Challenge friends to a weekly competition. Compare missions completed, weight lifted, and damage dealt.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded bg-destructive/20 mt-0.5">
                <Skull className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <span className="text-destructive font-display text-sm">WEEKLY RAID</span>
                <p className="text-muted-foreground text-xs">
                  Every workout deals damage to a community boss. Take it down together before the week ends.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Statement */}
          <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="text-xs">No tracking. No ads. Your data stays yours.</span>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCreateAccount}
              className="w-full py-3 bg-primary text-primary-foreground font-display rounded flex items-center justify-center gap-2 hover:box-glow-primary transition-all min-h-[48px]"
            >
              <UserPlus className="w-5 h-5" />
              CREATE ACCOUNT
            </button>
            <button
              onClick={handleSignIn}
              className="w-full py-2.5 text-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-2 border border-border rounded hover:border-primary/50 min-h-[44px]"
            >
              SIGN IN
            </button>
            <button
              onClick={handleContinueAsGuest}
              className="w-full py-2 text-muted-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              Continue as Guest
            </button>
          </div>
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

  // Main invite page - Valid rival code
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-card border-2 border-section-intel rounded-lg p-4 max-w-sm w-full relative"
      >
        {/* Close button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-3">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 10 }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
            className="p-3 bg-section-intel/10 border border-section-intel/30 rounded-full"
          >
            <Swords className="w-8 h-8 text-section-intel" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="text-center mb-3">
          <h2 className="font-display text-2xl text-section-intel mb-1">
            YOU'VE BEEN CHALLENGED
          </h2>
          <p className="text-muted-foreground text-sm">
            <span className="text-secondary font-display">{rivalProfile.display_name || 'A warrior'}</span> wants to compete with you!
          </p>
        </div>

        {/* Challenger Profile */}
        <div className="bg-background border border-border rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-section-intel/20 flex items-center justify-center border-2 border-section-intel">
              <Trophy className="w-6 h-6 text-section-intel" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg text-secondary">
                {rivalProfile.display_name || 'Anonymous Warrior'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Score: {rivalProfile.total_score?.toLocaleString() || 0} • XP: {rivalProfile.total_xp?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        {/* What is Rival Mode */}
        <div className="bg-background rounded-lg p-3 mb-3 border border-border space-y-2">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-section-intel/20 mt-0.5">
              <Target className="w-4 h-4 text-section-intel" />
            </div>
            <div>
              <span className="text-section-intel font-display text-sm">WEEKLY LEADERBOARD</span>
              <p className="text-muted-foreground text-xs">
                Compete head-to-head. Track missions, weight lifted, and damage dealt. Resets every Monday.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-destructive/20 mt-0.5">
              <Skull className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <span className="text-destructive font-display text-sm">WEEKLY RAID</span>
              <p className="text-muted-foreground text-xs">
                Every workout deals damage to a shared boss. Work together to take it down.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Statement */}
        <div className="flex items-center justify-center gap-2 mb-3 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-xs">No tracking. No ads. Your data stays yours.</span>
        </div>

        {/* Logged-in user: Simple accept button */}
        {user ? (
          <div className="space-y-2">
            <Button
              onClick={handleAcceptRival}
              disabled={isAccepting}
              className="w-full bg-section-intel text-white hover:bg-section-intel/90 font-display min-h-[48px]"
              size="lg"
            >
              {isAccepting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Swords className="w-4 h-4 mr-2" />
              )}
              ACCEPT CHALLENGE
            </Button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2 text-muted-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              Decline & Return
            </button>
          </div>
        ) : (
          /* Non-logged-in user: Auth form */
          <>
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="font-display text-base text-foreground">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isSignUp ? (
                    <>Have an account? <button type="button" onClick={() => { setIsSignUp(false); setError(null); }} className="text-secondary hover:underline">Sign In</button></>
                  ) : (
                    <>New here? <button type="button" onClick={() => { setIsSignUp(true); setError(null); }} className="text-secondary hover:underline">Sign Up</button></>
                  )}
                </span>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-sm text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    placeholder="6+ characters"
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
              </div>

              {/* Display Name (Sign Up Only) */}
              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-sm text-foreground">Call Sign <span className="text-muted-foreground text-xs">(Optional)</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => handleDisplayNameChange(e.target.value)}
                      className={`w-full bg-background border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                        displayNameError ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
                      }`}
                      placeholder="GHOST_REAPER"
                      maxLength={25}
                    />
                  </div>
                  {displayNameError && (
                    <p className="text-xs text-destructive">{displayNameError}</p>
                  )}
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
                className="w-full bg-section-intel text-white hover:bg-section-intel/90 font-display min-h-[48px]"
                size="lg"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Swords className="w-4 h-4 mr-2" />
                )}
                {isSignUp ? 'CREATE & ACCEPT' : 'SIGN IN & ACCEPT'}
              </Button>
            </form>

            {/* Continue as guest */}
            <div className="mt-3 pt-3 border-t border-border">
              <button
                onClick={handleContinueAsGuest}
                className="w-full py-2 text-muted-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                Continue as Guest
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RivalInvite;
