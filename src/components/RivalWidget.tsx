import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Share2, UserPlus, Trophy, TrendingUp, Trash2, Crown, Loader2 } from 'lucide-react';
import { useRivals, useRivalWeeklyStats, useAddRival, useRemoveRival } from '@/hooks/useRivals';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const addRival = useAddRival();
  const removeRival = useRemoveRival();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [rivalCode, setRivalCode] = useState('');
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [rivalToRemove, setRivalToRemove] = useState<{ id: string; name: string } | null>(null);

  if (!user) return null;

  const hasRivals = rivals && rivals.length > 0;

  const shareRivalLink = async () => {
    if (!profile?.rival_code) return;

    const shareUrl = `${window.location.origin}/rival/${profile.rival_code}`;
    const shareText = `Challenge me in RIVAL MODE on Iron Protocol! ⚔️💪`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Iron Protocol - Rival Mode',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback to SMS link for mobile or clipboard
      const smsBody = encodeURIComponent(`${shareText} ${shareUrl}`);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        window.open(`sms:?body=${smsBody}`, '_blank');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copied!', description: 'Share it with your rival.' });
      }
    }
  };

  const handleAddRival = async () => {
    if (!rivalCode.trim()) return;
    try {
      const rival = await addRival.mutateAsync(rivalCode.trim());
      toast({
        title: 'Rival added! ⚔️',
        description: `${rival.display_name || 'New rival'} has joined the competition!`,
      });
      setRivalCode('');
      setShowAddDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
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
          <div className="flex gap-2">
            <button
              onClick={shareRivalLink}
              className="p-1.5 hover:bg-primary/10 rounded transition-colors"
              title="Share your rival code"
            >
              <Share2 className="w-4 h-4 text-primary" />
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="p-1.5 hover:bg-secondary/10 rounded transition-colors"
              title="Add rival by code"
            >
              <UserPlus className="w-4 h-4 text-secondary" />
            </button>
          </div>
        </div>

        {rivalsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasRivals ? (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <Swords className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-3">No rivals yet</p>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={shareRivalLink}
                className="text-xs"
              >
                <Share2 className="w-3 h-3 mr-1" />
                Invite
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddDialog(true)}
                className="text-xs"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Add Code
              </Button>
            </div>
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

            {/* Your code */}
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1">YOUR RIVAL CODE</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-background px-2 py-1 rounded border border-border text-primary">
                  {profile?.rival_code || '--------'}
                </code>
                <Button size="sm" variant="ghost" onClick={shareRivalLink}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Rival Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              ADD RIVAL
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground tracking-wider">RIVAL CODE</label>
              <Input
                value={rivalCode}
                onChange={(e) => setRivalCode(e.target.value.toLowerCase())}
                placeholder="Enter 8-character code"
                className="bg-background border-border mt-1 font-mono"
                maxLength={8}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRival}
                disabled={rivalCode.length < 8 || addRival.isPending}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {addRival.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Rival'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
