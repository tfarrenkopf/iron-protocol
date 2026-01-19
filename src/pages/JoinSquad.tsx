import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Check, AlertCircle, X, ChevronRight, UserPlus, Shield, Send, Eye, Crosshair, Skull, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSquadByInviteCode, useJoinSquad, useMySquads } from '@/hooks/useHandlerMode';

const JoinSquad = () => {
  const navigate = useNavigate();
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, isAnonymous, isLoading: authLoading } = useAuth();
  const { data: squad, isLoading, error: fetchError } = useSquadByInviteCode(inviteCode || '');
  const { data: mySquads, isLoading: mySquadsLoading } = useMySquads();
  const joinSquad = useJoinSquad();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already a member of THIS specific squad
  // Only check AFTER mySquads has loaded to prevent false positives
  const isAlreadyMember = !mySquadsLoading && mySquads?.some(m => m.squads?.id === squad?.id);

  const handleJoin = async () => {
    if (!squad) return;
    setError(null);

    try {
      await joinSquad.mutateAsync(squad.id);
      setJoined(true);
      localStorage.setItem('iron-protocol-visited', 'true');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        setError('You are already a member of this squad.');
      } else {
        setError(err.message || 'Failed to join squad');
      }
    }
  };

  const handleCreateAccount = () => {
    localStorage.setItem('iron-protocol-visited', 'true');
    navigate('/auth?mode=signup', { state: { redirect: `/join/${inviteCode}` } });
  };

  const handleSignIn = () => {
    localStorage.setItem('iron-protocol-visited', 'true');
    navigate('/auth?mode=signin', { state: { redirect: `/join/${inviteCode}` } });
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem('iron-protocol-visited', 'true');
    navigate('/command?tab=missions');
  };

  // Loading state
  if (authLoading || isLoading || mySquadsLoading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-warning mx-auto mb-4" />
          <div className="font-display text-2xl text-warning animate-neon-pulse">LOCATING SQUAD...</div>
        </div>
      </div>
    );
  }

  // Anonymous/guest user - show onboarding options
  if (isAnonymous || !user) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card border-2 border-warning rounded-lg p-4 max-w-sm w-full relative"
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
              className="p-3 bg-warning/10 border border-warning/30 rounded-full"
            >
              <Send className="w-8 h-8 text-warning" />
            </motion.div>
          </div>

          {/* Content */}
          <div className="text-center mb-3">
            <h2 className="font-display text-2xl text-warning mb-1">
              {squad ? 'SQUAD INVITE' : 'INVITE NOT FOUND'}
            </h2>
            {squad ? (
              <p className="text-muted-foreground text-sm">
                <span className="text-secondary font-display">{(squad.profiles as any)?.display_name || 'A handler'}</span> wants you to join their squad.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                This invite code may have expired or doesn't exist. But you can still join Iron Protocol!
              </p>
            )}
          </div>

          {/* Squad info if valid */}
          {squad && (
            <div className="bg-background border border-border rounded-lg p-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center border-2 border-warning">
                  <Users className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg text-secondary">
                    {squad.code_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {squad.name}
                  </p>
                </div>
              </div>
              {squad.description && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  {squad.description}
                </p>
              )}
            </div>
          )}

          {/* What Handler Mode is */}
          <div className="bg-background rounded-lg p-3 mb-3 border border-border space-y-2">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded bg-warning/20 mt-0.5">
                <Eye className="w-4 h-4 text-warning" />
              </div>
              <div>
                <span className="text-warning font-display text-sm">WHAT YOUR HANDLER SEES</span>
                <p className="text-muted-foreground text-xs">
                  Only your call sign and missions completed. No personal data, no tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded bg-section-missions/20 mt-0.5">
                <Crosshair className="w-4 h-4 text-section-missions" />
              </div>
              <div>
                <span className="text-section-missions font-display text-sm">RECEIVE ORDERS</span>
                <p className="text-muted-foreground text-xs">
                  Your handler can assign you workouts. Complete them on your own schedule.
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
                  Every workout deals damage to a community boss. Take it down together.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Statement */}
          <div className="flex items-center justify-center gap-2 mb-3 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="text-xs">No tracking. No ads. Your data stays yours.</span>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCreateAccount}
              className="w-full py-3 bg-warning text-warning-foreground font-display rounded flex items-center justify-center gap-2 hover:bg-warning/90 transition-all min-h-[48px]"
            >
              <UserPlus className="w-5 h-5" />
              CREATE ACCOUNT
            </button>
            <button
              onClick={handleSignIn}
              className="w-full py-2.5 text-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-2 border border-border rounded hover:border-warning/50 min-h-[44px]"
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

  // Invalid invite code for logged-in user
  if (!squad || fetchError) {
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
              SQUAD NOT FOUND
            </h2>
            <p className="text-muted-foreground text-sm">
              This invite link is invalid or the squad no longer exists.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-primary text-primary-foreground font-display rounded flex items-center justify-center gap-2 hover:box-glow-primary transition-all min-h-[48px]"
            >
              RETURN TO BASE
            </button>
            <button
              onClick={() => navigate('/command?tab=missions')}
              className="w-full py-2 text-muted-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              Browse Missions
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Already a member of this squad
  if (isAlreadyMember) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-card border-2 border-success rounded-lg p-4 max-w-sm w-full relative"
        >
          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-success/10 border border-success/30 rounded-full">
              <Check className="w-8 h-8 text-success" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-4">
            <h2 className="font-display text-xl text-success mb-1">
              ALREADY ENLISTED
            </h2>
            <p className="text-muted-foreground text-sm">
              You are already a member of <span className="text-secondary font-display">{squad.code_name}</span>.
            </p>
          </div>

          {/* Actions */}
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-primary text-primary-foreground font-display rounded flex items-center justify-center gap-2 hover:box-glow-primary transition-all min-h-[48px]"
          >
            RETURN TO BASE
          </button>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (joined) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border-2 border-success rounded-lg p-4 max-w-sm w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <div className="p-3 bg-success/10 border border-success/30 rounded-full inline-block mb-3">
              <Check className="w-12 h-12 text-success" />
            </div>
          </motion.div>
          <h1 className="font-display text-2xl text-success mb-2">ENLISTED!</h1>
          <p className="text-muted-foreground text-sm mb-2">
            Welcome to <span className="text-secondary font-display">{squad.code_name}</span>.
          </p>
          <p className="text-xs text-muted-foreground animate-pulse">Redirecting...</p>
        </motion.div>
      </div>
    );
  }

  // Main join page - Valid squad, logged in user
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-card border-2 border-warning rounded-lg p-4 max-w-sm w-full relative"
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
            className="p-3 bg-warning/10 border border-warning/30 rounded-full"
          >
            <Send className="w-8 h-8 text-warning" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="text-center mb-3">
          <h2 className="font-display text-2xl text-warning mb-1">
            SQUAD INVITE
          </h2>
          <p className="text-muted-foreground text-sm">
            <span className="text-secondary font-display">{(squad.profiles as any)?.display_name || 'A handler'}</span> wants you to join their squad.
          </p>
        </div>

        {/* Squad info */}
        <div className="bg-background border border-border rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center border-2 border-warning">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg text-secondary">
                {squad.code_name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {squad.name}
              </p>
            </div>
          </div>
          {squad.description && (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
              {squad.description}
            </p>
          )}
        </div>

        {/* What Handler sees */}
        <div className="bg-background rounded-lg p-3 mb-3 border border-border">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded bg-warning/20 mt-0.5">
              <Eye className="w-4 h-4 text-warning" />
            </div>
            <div>
              <span className="text-warning font-display text-sm">WHAT YOUR HANDLER SEES</span>
              <p className="text-muted-foreground text-xs">
                Only your call sign and missions completed. No personal data, no tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Statement */}
        <div className="flex items-center justify-center gap-2 mb-3 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-xs">No tracking. No ads. Your data stays yours.</span>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive text-center">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleJoin}
            disabled={joinSquad.isPending}
            className="w-full py-3 bg-warning text-warning-foreground font-display rounded flex items-center justify-center gap-2 hover:bg-warning/90 transition-all disabled:opacity-50 min-h-[48px]"
          >
            {joinSquad.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Users className="w-5 h-5" />
            )}
            {joinSquad.isPending ? 'ENLISTING...' : 'JOIN SQUAD'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2 text-muted-foreground font-display text-sm hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            Decline & Return
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinSquad;
