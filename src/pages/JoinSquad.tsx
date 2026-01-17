import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSquadByInviteCode, useJoinSquad, useMySquads } from '@/hooks/useHandlerMode';

const JoinSquad = () => {
  const navigate = useNavigate();
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, isAnonymous } = useAuth();
  const { data: squad, isLoading, error: fetchError } = useSquadByInviteCode(inviteCode || '');
  const { data: mySquads } = useMySquads();
  const joinSquad = useJoinSquad();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already a member of THIS specific squad
  const isAlreadyMember = mySquads?.some(m => m.squads?.id === squad?.id);

  const handleJoin = async () => {
    if (!squad) return;
    setError(null);

    try {
      await joinSquad.mutateAsync(squad.id);
      setJoined(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        setError('You are already a member of this squad.');
      } else {
        setError(err.message || 'Failed to join squad');
      }
    }
  };

  if (isAnonymous) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        <div className="relative z-10 container mx-auto px-4 max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-8"
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-warning" />
            <h1 className="font-display text-2xl text-primary mb-2">AUTHENTICATION REQUIRED</h1>
            <p className="text-muted-foreground mb-6">You must sign in to join a squad.</p>
            <button
              onClick={() => navigate('/auth', { state: { redirect: `/join/${inviteCode}` } })}
              className="w-full py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
            >
              SIGN IN TO JOIN
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        <div className="font-display text-2xl text-primary animate-neon-pulse">LOCATING SQUAD...</div>
      </div>
    );
  }

  if (!squad || fetchError) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        <div className="relative z-10 container mx-auto px-4 max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-destructive rounded-lg p-8"
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h1 className="font-display text-2xl text-destructive mb-2">SQUAD NOT FOUND</h1>
            <p className="text-muted-foreground mb-6">This invite link is invalid or the squad no longer exists.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-muted text-muted-foreground font-display rounded hover:bg-muted/80 transition-colors"
            >
              RETURN TO BASE
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Only show "already enlisted" if trying to join the SAME squad
  if (isAlreadyMember) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        <div className="relative z-10 container mx-auto px-4 max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-success rounded-lg p-8"
          >
            <Check className="w-12 h-12 mx-auto mb-4 text-success" />
            <h1 className="font-display text-2xl text-success mb-2">ALREADY ENLISTED</h1>
            <p className="text-muted-foreground mb-6">You are already a member of {squad.code_name}.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
            >
              RETURN TO BASE
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        <div className="relative z-10 container mx-auto px-4 max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-success rounded-lg p-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Check className="w-16 h-16 mx-auto mb-4 text-success" />
            </motion.div>
            <h1 className="font-display text-2xl text-success mb-2">ENLISTED!</h1>
            <p className="text-muted-foreground">Welcome to {squad.code_name}. Redirecting...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-secondary rounded-lg p-8"
        >
          <div className="text-center mb-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-secondary" />
            <h1 className="font-display text-3xl text-secondary text-glow-secondary mb-2">
              {squad.code_name}
            </h1>
            <p className="text-muted-foreground">{squad.name}</p>
          </div>

          {squad.description && (
            <p className="text-center text-sm text-muted-foreground mb-6 border-t border-b border-border py-4">
              {squad.description}
            </p>
          )}

          <div className="text-center mb-6">
            <div className="text-xs text-muted-foreground tracking-wider mb-1">HANDLER</div>
            <div className="font-display text-primary">
              {(squad.profiles as any)?.display_name || 'Unknown Handler'}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-sm text-destructive text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleJoin}
              disabled={joinSquad.isPending}
              className="w-full py-3 bg-secondary text-secondary-foreground font-display rounded hover:box-glow-secondary transition-all disabled:opacity-50"
            >
              {joinSquad.isPending ? 'ENLISTING...' : 'JOIN SQUAD'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-muted text-muted-foreground font-display rounded hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              CANCEL
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinSquad;
