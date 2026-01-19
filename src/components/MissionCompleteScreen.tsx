import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crosshair, Shield, Flame, Skull, Heart, Zap, Target, BarChart3, Timer } from 'lucide-react';
import { GuestIndicator } from './AnonymousConversion';

interface MissionCompleteScreenProps {
  isGuest: boolean;
  isAssignmentMode?: boolean;
  isHIIT?: boolean; // New: indicates this is a HIIT session
  assignment?: {
    handler_name?: string;
  } | null;
  mission: {
    id: string;
    name: string;
    code_name: string;
    outro_lore?: string | null;
  };
  stats: {
    score: number;
    xp: number;
    setsCompleted: number; // For HIIT: rounds completed
    totalReps: number; // For HIIT: total work time in seconds
    totalWeight: number;
    maxCombo: number;
    damageDealt: number;
  };
  boss?: {
    name: string;
    current_hp: number;
    max_hp: number;
    is_defeated: boolean;
    weaknesses: string[];
  } | null;
  campaignId?: string | null;
  onContinue: () => void;
  onSaveProgress?: () => void;
}

export function MissionCompleteScreen({
  isGuest,
  isAssignmentMode = false,
  isHIIT = false,
  assignment,
  mission,
  stats,
  boss,
  campaignId,
  onContinue,
  onSaveProgress,
}: MissionCompleteScreenProps) {
  const navigate = useNavigate();
  
  // Detect HIIT from mission id pattern
  const isHIITSession = isHIIT || mission.id.startsWith('hiit-');
  
  // Calculate damage dealt to boss (approximation based on workout stats)
  const damageDealt = stats.damageDealt || Math.floor(stats.setsCompleted * stats.totalReps + stats.totalWeight / 10);
  
  // Boss health percentage
  const bossHealthPercent = boss ? Math.max(0, (boss.current_hp / boss.max_hp) * 100) : 0;
  const bossHealthAfterDamage = boss ? Math.max(0, ((boss.current_hp - damageDealt) / boss.max_hp) * 100) : 0;
  
  // Dynamic boss messaging based on damage and health
  const getBossMessage = () => {
    if (!boss) return null;
    
    if (boss.is_defeated) {
      return { text: "THE BEAST HAS FALLEN", color: "text-success" };
    }
    
    if (damageDealt > 500) {
      return { text: "DEVASTATING BLOW", color: "text-primary" };
    } else if (damageDealt > 200) {
      return { text: "SOLID HIT", color: "text-secondary" };
    } else {
      return { text: "DAMAGE REGISTERED", color: "text-accent" };
    }
  };
  
  const bossMessage = getBossMessage();
  
  const handleAcceptMission = () => {
    navigate('/command?tab=missions');
  };
  
  const handleViewIntel = () => {
    navigate('/intel');
  };
  
  const handleSaveProgress = () => {
    if (onSaveProgress) {
      onSaveProgress();
    } else {
      // Store pending workout data for after auth
      const pendingWorkout = {
        missionId: mission.id,
        missionSnapshot: { name: mission.name, code_name: mission.code_name },
        scoreEarned: stats.score,
        xpEarned: stats.xp,
        setsCompleted: stats.setsCompleted,
        totalReps: stats.totalReps,
        totalWeight: stats.totalWeight,
        maxCombo: stats.maxCombo,
        damageDealt: stats.damageDealt,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('pendingWorkout', JSON.stringify(pendingWorkout));
      navigate('/auth', { state: { intent: 'save_progress' } });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center p-4"
    >
      {/* Guest indicator */}
      {isGuest && (
        <div className="absolute top-4 left-4">
          <GuestIndicator variant="minimal" />
        </div>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center w-full max-w-md"
      >
        {/* Handler attribution for orders */}
        {isAssignmentMode && assignment && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-section-orders mb-4 font-display"
          >
            ORDERS FROM: {assignment.handler_name || 'YOUR HANDLER'}
          </motion.div>
        )}
        
        {/* Main headline */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <h1 className="font-display text-4xl md:text-6xl text-primary text-glow-primary mb-1">
            {isAssignmentMode ? 'ORDERS EXECUTED' : 'TARGET ELIMINATED'}
          </h1>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-display text-xl text-secondary mb-4"
        >
          {mission.code_name}
        </motion.p>
        
        {/* Outro lore */}
        {mission.outro_lore && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground leading-relaxed mb-4 text-sm"
          >
            {mission.outro_lore}
          </motion.p>
        )}
        
        {/* Boss Raid Section - THE MAIN EVENT */}
        {boss && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border-2 border-destructive/50 rounded-lg p-4 mb-4 relative overflow-hidden"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-destructive/10 to-transparent pointer-events-none" />
            
            {/* Boss name and status */}
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Skull className="w-5 h-5 text-destructive" />
                <span className="font-display text-sm text-destructive tracking-wider">
                  🔥 WEEKLY RAID
                </span>
              </div>
              
              <h3 className="font-display text-lg text-foreground mb-2">
                {boss.name}
              </h3>
              
              {/* Damage dealt callout */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="flex items-center justify-center gap-2 mb-3"
              >
                <Flame className="w-6 h-6 text-primary" />
                <span className="font-display text-3xl text-primary text-glow-primary">
                  {damageDealt.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">DMG</span>
              </motion.div>
              
              {/* Boss message */}
              {bossMessage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className={`font-display text-sm ${bossMessage.color} mb-3`}
                >
                  {bossMessage.text}
                </motion.div>
              )}
              
              {/* Boss HP bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">BOSS HP</span>
                  <span className="text-destructive font-display">
                    {Math.max(0, boss.current_hp - damageDealt).toLocaleString()} / {boss.max_hp.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                  {/* Previous HP */}
                  <motion.div
                    initial={{ width: `${bossHealthPercent}%` }}
                    animate={{ width: `${bossHealthAfterDamage}%` }}
                    transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-destructive"
                  />
                  {/* Damage flash */}
                  <motion.div
                    initial={{ width: `${bossHealthPercent}%`, opacity: 1 }}
                    animate={{ width: `${bossHealthAfterDamage}%`, opacity: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="absolute inset-y-0 left-0 bg-primary"
                  />
                </div>
                
                {/* Weakness hint */}
                {boss.weaknesses.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Target className="w-3 h-3" />
                    <span>Weak to: {boss.weaknesses.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Stats grid - compact */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-4 gap-2 mb-4"
        >
          <div className="bg-card border border-border rounded-lg p-2">
            <div className="font-display text-lg text-accent">{stats.score.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">SCORE</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-2">
            <div className="font-display text-lg text-secondary">{stats.maxCombo}x</div>
            <div className="text-[10px] text-muted-foreground">{isHIITSession ? 'ROUNDS' : 'COMBO'}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-2">
            <div className="font-display text-lg text-primary">{stats.setsCompleted}</div>
            <div className="text-[10px] text-muted-foreground">{isHIITSession ? 'ROUNDS' : 'SETS'}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-2">
            <div className="font-display text-lg text-success">+{stats.xp}</div>
            <div className="text-[10px] text-muted-foreground">XP</div>
          </div>
        </motion.div>
        
        {/* Total Weight/Time highlight */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55 }}
          className={`bg-card border-2 rounded-lg p-3 mb-6 ${isGuest ? 'border-warning/50' : isHIITSession ? 'border-section-hiit' : 'border-accent'}`}
        >
          {isHIITSession ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <Timer className="w-6 h-6 text-section-hiit" />
                <div className="font-display text-3xl text-section-hiit">
                  {Math.floor(stats.totalReps / 60)}:{String(stats.totalReps % 60).padStart(2, '0')}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">TOTAL WORK TIME</div>
            </>
          ) : (
            <>
              <div className="font-display text-3xl text-accent">{stats.totalWeight.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">TOTAL LBS LIFTED</div>
            </>
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          {isGuest ? (
            // Guest CTAs
            <>
              {/* Guest warning */}
              <div className="flex items-center justify-center gap-2 text-warning text-sm mb-2">
                <Shield className="w-4 h-4" />
                <span className="font-display">Progress won't be saved</span>
              </div>
              
              <button
                onClick={handleSaveProgress}
                className="w-full py-4 bg-primary text-primary-foreground font-display text-lg rounded-lg hover:box-glow-primary transition-all flex items-center justify-center gap-2 min-h-[56px] active:scale-[0.98]"
              >
                <Shield className="w-5 h-5" />
                CLAIM YOUR VICTORY
              </button>
              
              <button
                onClick={onContinue}
                className="w-full py-3 bg-card border border-border text-foreground font-display text-sm rounded-lg hover:border-primary/50 transition-colors min-h-[48px] active:scale-[0.98]"
              >
                CONTINUE AS GHOST
              </button>
              
              <p className="text-xs text-muted-foreground">
                No tracking. No ads. Your data stays yours.
              </p>
            </>
          ) : (
            // Logged-in user CTAs
            <>
              <button
                onClick={handleAcceptMission}
                className="w-full py-4 bg-primary text-primary-foreground font-display text-lg rounded-lg hover:box-glow-primary transition-all flex items-center justify-center gap-2 min-h-[56px] active:scale-[0.98]"
              >
                <Crosshair className="w-5 h-5" />
                ACCEPT ANOTHER MISSION
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleViewIntel}
                  className="flex-1 py-3 bg-card border border-border text-foreground font-display text-sm rounded-lg hover:border-section-intel/50 transition-colors flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
                >
                  <BarChart3 className="w-4 h-4 text-section-intel" />
                  VIEW INTEL
                </button>
                
                {campaignId ? (
                  <button
                    onClick={onContinue}
                    className="flex-1 py-3 bg-card border border-border text-foreground font-display text-sm rounded-lg hover:border-section-campaigns/50 transition-colors flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
                  >
                    <Target className="w-4 h-4 text-section-campaigns" />
                    CAMPAIGN
                  </button>
                ) : (
                  <button
                    onClick={onContinue}
                    className="flex-1 py-3 bg-card border border-border text-foreground font-display text-sm rounded-lg hover:border-muted-foreground/50 transition-colors flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
                  >
                    <Heart className="w-4 h-4" />
                    HOME
                  </button>
                )}
              </div>
              
              {/* Weekly Raid call to action */}
              {boss && !boss.is_defeated && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="pt-2 text-center"
                >
                  <p className="text-xs text-muted-foreground">
                    Keep fighting to bring down <span className="text-destructive">{boss.name}</span>
                  </p>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
