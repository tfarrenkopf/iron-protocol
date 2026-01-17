import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Share2, Trophy, TrendingUp, Trash2, Crown, Loader2 } from 'lucide-react';
import { useRivals, useRivalWeeklyStats, useRemoveRival } from '@/hooks/useRivals';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

export function RivalWidget() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: rivals, isLoading: rivalsLoading } = useRivals();
  const { data: weeklyStats, isLoading: statsLoading } = useRivalWeeklyStats();
  const removeRival = useRemoveRival();
  
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [rivalToRemove, setRivalToRemove] = useState<{ id: string; name: string } | null>(null);

  if (!user) return null;

  const hasRivals = rivals && rivals.length > 0;

  const shareRivalLink = async () => {
    if (!profile?.rival_code) {
      toast({ title: 'Error', description: 'No rival code found. Try refreshing.', variant: 'destructive' });
      return;
    }

    // Use the custom domain URL
    const baseUrl = 'https://iron-protocol.fitness';
    const shareUrl = `${baseUrl}/rival/${profile.rival_code}`;
    const shareText = `⚔️ YOU'VE BEEN MARKED. Accept the challenge or stay weak.`;
    const fullMessage = `${shareText} ${shareUrl}`;

    // Always copy to clipboard first
    try {
      await navigator.clipboard.writeText(fullMessage);
      toast({ 
        title: 'CHALLENGE COPIED ⚔️', 
        description: 'Paste it anywhere to send to your target.' 
      });
    } catch {
      // Fallback: show the link in toast if clipboard fails
      toast({ 
        title: 'Copy this challenge:', 
        description: fullMessage,
        duration: 10000,
      });
    }
  };

  const handleRemoveRival = (rivalId: string, rivalName: string) => {
    setRivalToRemove({ id: rivalId, name: rivalName });
    setRemoveDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!rivalToRemove) return;
    const rivalry = rivals?.find(r => r.rival_id === rivalToRemove.id);
    if (rivalry) {
      await removeRival.mutateAsync(rivalry.id);
      toast({ title: 'Rival removed', description: 'The rivalry has ended.' });
    }
    setRemoveDialogOpen(false);
    setRivalToRemove(null);
  };

  // Get user's rank among rivals
  const userRank = weeklyStats?.findIndex(s => s.user_id === user.id) ?? -1;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg text-primary">RIVAL MODE</h3>
          </div>
          <button
            onClick={shareRivalLink}
            className="p-1.5 hover:bg-primary/10 rounded transition-colors"
            title="Challenge a rival"
          >
            <Share2 className="w-4 h-4 text-primary" />
          </button>
        </div>

        {rivalsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasRivals ? (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <Swords className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-2">No rivals yet</p>
            <p className="text-xs text-muted-foreground/70 mb-4 max-w-xs mx-auto">
              Send a challenge link to compete head-to-head with a friend.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={shareRivalLink}
              className="text-xs"
            >
              <Share2 className="w-3 h-3 mr-1" />
              SEND CHALLENGE
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Weekly Leaderboard */}
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              WEEKLY KILLBOARD
            </div>
            
            {statsLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-muted/20 rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {weeklyStats?.map((stat, index) => {
                  const isCurrentUser = stat.user_id === user.id;
                  const rival = rivals?.find(r => r.rival_id === stat.user_id);
                  
                  return (
                    <motion.div
                      key={stat.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-2 rounded ${
                        isCurrentUser 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-background border border-border'
                      }`}
                    >
                      {/* Rank */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-amber-600/20 text-amber-600' :
                        'bg-muted/20 text-muted-foreground'
                      }`}>
                        {index === 0 ? <Crown className="w-3 h-3" /> : index + 1}
                      </div>
                      
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                          {isCurrentUser ? 'You' : stat.display_name || 'Anonymous'}
                        </p>
                      </div>
                      
                      {/* Score */}
                      <div className="text-right">
                        <p className={`text-sm font-display ${isCurrentUser ? 'text-primary' : 'text-secondary'}`}>
                          {stat.weekly_score.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {stat.weekly_sessions} session{stat.weekly_sessions !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Remove button for rivals */}
                      {!isCurrentUser && rival && (
                        <button
                          onClick={() => handleRemoveRival(stat.user_id, stat.display_name || 'Rival')}
                          className="p-1 hover:bg-destructive/10 rounded transition-colors opacity-50 hover:opacity-100"
                          title="End rivalry"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Share button at bottom */}
            <div className="mt-4 pt-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={shareRivalLink}
                className="w-full text-xs"
              >
                <Share2 className="w-3 h-3 mr-1" />
                CHALLENGE ANOTHER
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Remove Confirmation */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="bg-card border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">END RIVALRY</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end your rivalry with {rivalToRemove?.name}? You can always add them back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              End Rivalry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
