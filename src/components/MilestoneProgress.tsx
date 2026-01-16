import { motion } from 'framer-motion';
import { Trophy, Lock, Check } from 'lucide-react';
import { UserMilestone, getMilestoneProgress, getTierColor } from '@/hooks/useMilestones';

interface MilestoneCardProps {
  userMilestone?: UserMilestone;
  milestone: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    targetValue: number;
    icon: string | null;
    tier: number;
  };
  currentValue?: number;
  isLocked?: boolean;
}

export function MilestoneCard({ userMilestone, milestone, currentValue = 0, isLocked = false }: MilestoneCardProps) {
  const value = userMilestone?.currentValue ?? currentValue;
  const isCompleted = userMilestone?.completedAt !== null && userMilestone?.completedAt !== undefined;
  const progress = getMilestoneProgress(value, milestone.targetValue);
  const tierColor = getTierColor(milestone.tier);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-lg border p-4 transition-all ${
        isCompleted 
          ? 'bg-success/10 border-success/50' 
          : isLocked 
            ? 'bg-muted/30 border-border/50 opacity-60' 
            : 'bg-card border-border hover:border-primary/50'
      }`}
    >
      {/* Progress bar background */}
      {!isCompleted && !isLocked && (
        <div 
          className="absolute inset-0 bg-primary/5 transition-all"
          style={{ width: `${progress}%` }}
        />
      )}
      
      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className={`text-2xl ${isCompleted ? '' : 'grayscale opacity-50'}`}>
          {isLocked ? (
            <Lock className="w-6 h-6 text-muted-foreground" />
          ) : isCompleted ? (
            <span>{milestone.icon || '🏆'}</span>
          ) : (
            <span>{milestone.icon || '🎯'}</span>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-display text-sm ${isCompleted ? 'text-success' : tierColor}`}>
              {milestone.name}
            </h3>
            {isCompleted && (
              <Check className="w-4 h-4 text-success" />
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-0.5">
            {milestone.description}
          </p>
          
          {/* Progress */}
          {!isLocked && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className={isCompleted ? 'text-success' : 'text-muted-foreground'}>
                  {value.toLocaleString()} / {milestone.targetValue.toLocaleString()}
                </span>
                <span className={isCompleted ? 'text-success' : 'text-primary'}>
                  {Math.floor(progress)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    isCompleted ? 'bg-success' : 'bg-primary'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface MilestoneListProps {
  userMilestones: UserMilestone[];
  category?: string;
}

export function MilestoneList({ userMilestones, category }: MilestoneListProps) {
  const filtered = category 
    ? userMilestones.filter(um => um.milestone.category === category)
    : userMilestones;
  
  // Sort: incomplete first (by progress), then completed (by date)
  const sorted = [...filtered].sort((a, b) => {
    const aCompleted = a.completedAt !== null;
    const bCompleted = b.completedAt !== null;
    
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    
    if (aCompleted && bCompleted) {
      return new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime();
    }
    
    // Sort by progress percentage
    const aProgress = getMilestoneProgress(a.currentValue, a.milestone.targetValue);
    const bProgress = getMilestoneProgress(b.currentValue, b.milestone.targetValue);
    return bProgress - aProgress;
  });
  
  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No milestones yet. Start a mission to begin!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {sorted.map((um, index) => (
        <motion.div
          key={um.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <MilestoneCard userMilestone={um} milestone={um.milestone} />
        </motion.div>
      ))}
    </div>
  );
}

// Compact milestone summary for dashboard
interface MilestoneSummaryProps {
  userMilestones: UserMilestone[];
}

export function MilestoneSummary({ userMilestones }: MilestoneSummaryProps) {
  const completed = userMilestones.filter(um => um.completedAt !== null);
  const inProgress = userMilestones
    .filter(um => um.completedAt === null)
    .sort((a, b) => {
      const aProgress = getMilestoneProgress(a.currentValue, a.milestone.targetValue);
      const bProgress = getMilestoneProgress(b.currentValue, b.milestone.targetValue);
      return bProgress - aProgress;
    })
    .slice(0, 3);
  
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Milestones Completed</span>
        <span className="font-display text-success">{completed.length} / {userMilestones.length}</span>
      </div>
      
      {/* Next milestones */}
      {inProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs text-muted-foreground uppercase">Next Up</h4>
          {inProgress.map(um => (
            <div key={um.id} className="flex items-center gap-2">
              <span className="text-sm">{um.milestone.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">{um.milestone.name}</div>
                <div className="h-1 bg-muted rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${getMilestoneProgress(um.currentValue, um.milestone.targetValue)}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.floor(getMilestoneProgress(um.currentValue, um.milestone.targetValue))}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
