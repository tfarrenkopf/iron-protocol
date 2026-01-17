import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, UserPlus, ArrowLeft, Loader2, Check, X, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileByRivalCode, useAddRival } from '@/hooks/useRivals';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const RivalInvite = () => {
  const { rivalCode } = useParams<{ rivalCode: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { data: rivalProfile, isLoading: profileLoading } = useProfileByRivalCode(rivalCode);
  const addRival = useAddRival();
  const [joined, setJoined] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirectTo=/rival/${rivalCode}`);
    }
  }, [user, authLoading, rivalCode, navigate]);

  const handleAcceptRival = async () => {
    if (!rivalCode) return;

    try {
      await addRival.mutateAsync(rivalCode);
      setJoined(true);
      toast({
        title: 'RIVALRY ESTABLISHED! ⚔️',
        description: `You and ${rivalProfile?.display_name || 'your rival'} are now competing!`,
      });
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      toast({
        title: 'Failed to add rival',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-primary/50 rounded-lg p-8 max-w-md w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Swords className="w-16 h-16 text-primary mx-auto mb-4" />
            </motion.div>
            <h1 className="font-display text-3xl text-primary mb-2">RIVAL MODE</h1>
            <p className="text-sm text-muted-foreground">You've been challenged!</p>
          </div>

          {/* Rival Profile */}
          <div className="bg-background border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl text-secondary">
                  {rivalProfile.display_name || 'Anonymous Warrior'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Total Score: {rivalProfile.total_score?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total XP: {rivalProfile.total_xp?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-sm text-muted-foreground mb-6 space-y-2">
            <p>⚔️ Compete head-to-head with weekly rankings</p>
            <p>📊 Track each other's progress in real-time</p>
            <p>🏆 Earn bragging rights and achievements</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleAcceptRival}
              disabled={addRival.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display"
              size="lg"
            >
              {addRival.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-5 h-5 mr-2" />
              )}
              ACCEPT RIVALRY
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Decline & Return
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RivalInvite;
