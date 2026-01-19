import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Plus, Minus, Zap, X, Timer, Flame } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { defaultHIITConfigs } from '@/data/missions';
import { HIITConfig } from '@/types/game';
import { ExplosionEffect } from '@/components/ExplosionEffect';
import { useHIITSounds } from '@/hooks/useHIITSounds';
import { Progress } from '@/components/ui/progress';
import { GlobalNav } from '@/components/GlobalNav';
import { AppFooter } from '@/components/AppFooter';
import { useAuth } from '@/hooks/useAuth';
import { useWeeklyBoss } from '@/hooks/useWeeklyBoss';
import { MissionCompleteScreen } from '@/components/MissionCompleteScreen';
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

// Custom protocol lore names based on settings
const getCustomProtocolName = (work: number, rest: number, rounds: number): string => {
  const intensity = work / (work + rest);
  const volume = rounds * work;
  
  if (intensity >= 0.7 && rounds >= 10) return 'DEATH MARCH';
  if (intensity >= 0.7) return 'BLOOD PROTOCOL';
  if (volume >= 300) return 'ENDURANCE TRIAL';
  if (work >= 45) return 'SLOW BURN';
  if (rest <= 5) return 'NO MERCY';
  if (rounds >= 12) return 'MARATHON OF PAIN';
  if (work <= 15 && rest <= 10) return 'LIGHTNING STRIKE';
  if (intensity >= 0.5) return 'BALANCED ASSAULT';
  return 'CUSTOM WARFARE';
};

const getCustomProtocolTagline = (name: string): string => {
  const taglines: Record<string, string> = {
    'DEATH MARCH': 'Only the strong survive this gauntlet.',
    'BLOOD PROTOCOL': 'High intensity. No excuses.',
    'ENDURANCE TRIAL': 'A test of will over time.',
    'SLOW BURN': 'Long intervals. Deep suffering.',
    'NO MERCY': 'Minimal rest. Maximum pain.',
    'MARATHON OF PAIN': 'Many rounds. One mission.',
    'LIGHTNING STRIKE': 'Fast and furious. Strike hard.',
    'BALANCED ASSAULT': 'Work hard. Recover smart.',
    'CUSTOM WARFARE': 'Your rules. Your battlefield.',
  };
  return taglines[name] || 'Forge your own path.';
};

// Calculate HIIT session stats
const calculateHIITStats = (config: HIITConfig, completedRounds: number) => {
  const totalWorkTime = config.workDurationSec * completedRounds;
  const intensity = config.workDurationSec / (config.workDurationSec + config.restDurationSec);
  
  // Score: base work time + intensity bonus + round bonus
  const baseScore = totalWorkTime * 10;
  const intensityBonus = Math.floor(baseScore * intensity * 0.5);
  const roundBonus = completedRounds * 50;
  const score = baseScore + intensityBonus + roundBonus;
  
  // XP: simpler calculation based on work time
  const xp = Math.floor(totalWorkTime / 2) + (completedRounds * 5);
  
  // Damage: based on effort (work time × intensity factor)
  const damage = Math.floor(totalWorkTime * (1 + intensity));
  
  // Combo: rounds completed is like combo in HIIT
  const combo = completedRounds;
  
  return {
    score,
    xp,
    damage,
    combo,
    totalWorkTime,
    intensity: Math.round(intensity * 100),
  };
};

const HIITTimer = () => {
  const navigate = useNavigate();
  const { user, isAnonymous } = useAuth();
  const { data: activeBoss } = useWeeklyBoss();
  
  const [selectedConfig, setSelectedConfig] = useState<HIITConfig | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [customWork, setCustomWork] = useState(30);
  const [customRest, setCustomRest] = useState(15);
  const [customRounds, setCustomRounds] = useState(8);
  const prevRoundRef = useRef(0);
  const prevPhaseRef = useRef<string>('IDLE');
  const sessionStartRef = useRef<Date | null>(null);

  const { playWorkStart, playRestStart, playComplete, playCountdownTick } = useHIITSounds(soundEnabled);

  const {
    hiitConfig,
    timerPhase,
    currentRound,
    timeRemaining,
    startHIIT,
    setTimerPhase,
    nextRound,
    setTimeRemaining,
    resetHIIT,
  } = useGameStore();

  // Wake Lock API for keeping screen on
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && timerPhase !== 'IDLE' && timerPhase !== 'COMPLETED') {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.log('Wake Lock not supported or failed');
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [timerPhase]);

  // Track round changes for explosion
  useEffect(() => {
    if (currentRound > prevRoundRef.current && currentRound > 1) {
      setShowExplosion(true);
    }
    prevRoundRef.current = currentRound;
  }, [currentRound]);

  // Track phase changes for sounds
  useEffect(() => {
    if (prevPhaseRef.current !== timerPhase) {
      if (timerPhase === 'WORK' && prevPhaseRef.current !== 'IDLE') {
        playWorkStart();
      } else if (timerPhase === 'REST') {
        playRestStart();
      } else if (timerPhase === 'COMPLETED') {
        playComplete();
      }
      prevPhaseRef.current = timerPhase;
    }
  }, [timerPhase, playWorkStart, playRestStart, playComplete]);

  // Countdown tick sound - 5 second countdown
  useEffect(() => {
    if (timerPhase === 'COUNTDOWN' && timeRemaining <= 5 && timeRemaining > 0) {
      playCountdownTick();
    }
  }, [timerPhase, timeRemaining, playCountdownTick]);

  // Timer logic
  useEffect(() => {
    if (timerPhase === 'IDLE' || timerPhase === 'COMPLETED' || isPaused) return;

    const interval = setInterval(() => {
      if (timeRemaining <= 1) {
        if (timerPhase === 'COUNTDOWN') {
          setTimerPhase('WORK');
        } else if (timerPhase === 'WORK') {
          if (currentRound >= (hiitConfig?.rounds || 0)) {
            setTimerPhase('COMPLETED');
          } else {
            setTimerPhase('REST');
          }
        } else if (timerPhase === 'REST') {
          nextRound();
        }
      } else {
        setTimeRemaining(timeRemaining - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerPhase, timeRemaining, isPaused, currentRound, hiitConfig, setTimerPhase, nextRound, setTimeRemaining]);

  const handleStart = useCallback((config: HIITConfig) => {
    setSelectedConfig(config);
    startHIIT(config);
    setIsPaused(false);
    sessionStartRef.current = new Date();
    prevPhaseRef.current = 'IDLE';
    prevRoundRef.current = 0;
  }, [startHIIT]);

  const handleReset = useCallback(() => {
    resetHIIT();
    setSelectedConfig(null);
    setIsPaused(false);
    setShowCustomCreator(false);
    sessionStartRef.current = null;
    prevPhaseRef.current = 'IDLE';
    prevRoundRef.current = 0;
  }, [resetHIIT]);

  const handleStartCustom = useCallback(() => {
    const customConfig: HIITConfig = {
      id: `custom-${Date.now()}`,
      name: getCustomProtocolName(customWork, customRest, customRounds),
      codeName: getCustomProtocolName(customWork, customRest, customRounds),
      workDurationSec: customWork,
      restDurationSec: customRest,
      rounds: customRounds,
      isDefault: false,
    };
    handleStart(customConfig);
    setShowCustomCreator(false);
  }, [customWork, customRest, customRounds, handleStart]);

  const handleBackPress = useCallback(() => {
    if (currentRound >= 1 && timerPhase !== 'IDLE' && timerPhase !== 'COMPLETED') {
      setShowExitDialog(true);
    } else {
      navigate('/');
    }
  }, [currentRound, timerPhase, navigate]);

  const handleConfirmExit = useCallback(() => {
    resetHIIT();
    setShowExitDialog(false);
    navigate('/');
  }, [resetHIIT, navigate]);

  const getPhaseColor = () => {
    switch (timerPhase) {
      case 'WORK': return 'bg-destructive';
      case 'REST': return 'bg-secondary';
      case 'COUNTDOWN': return 'bg-primary';
      case 'COMPLETED': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const getPhaseLabel = () => {
    switch (timerPhase) {
      case 'WORK': return 'FIGHT';
      case 'REST': return 'RECOVER';
      case 'COUNTDOWN': return 'READY';
      case 'COMPLETED': return 'VICTORY';
      default: return 'SELECT';
    }
  };

  const calculateProgress = () => {
    if (!hiitConfig) return 0;
    const totalRounds = hiitConfig.rounds;
    const completedRounds = currentRound - 1;
    
    let currentRoundProgress = 0;
    if (timerPhase === 'WORK') {
      const workTotal = hiitConfig.workDurationSec;
      currentRoundProgress = ((workTotal - timeRemaining) / workTotal) * 0.5;
    } else if (timerPhase === 'REST') {
      const restTotal = hiitConfig.restDurationSec;
      currentRoundProgress = 0.5 + ((restTotal - timeRemaining) / restTotal) * 0.5;
    } else if (timerPhase === 'COUNTDOWN') {
      currentRoundProgress = 0;
    }

    const progress = ((completedRounds + currentRoundProgress) / totalRounds) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // SELECTION SCREEN
  if (timerPhase === 'IDLE') {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        
        <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl">
          <GlobalNav 
            title="COMBAT HIIT"
            subtitle="HIGH INTENSITY INTERVAL WARFARE"
            section="hiit"
          />

          <div className="bg-card/50 border border-section-hiit/30 rounded-lg p-3 mb-6">
            <p className="text-xs text-muted-foreground text-center">
              <span className="text-section-hiit font-display text-sm">HIIT</span> alternates between high-intensity work and rest. 
              Pick a protocol, then perform any exercise during <span className="text-destructive font-display text-sm">FIGHT</span> phases. 
              Rest during <span className="text-primary font-display text-sm">RECOVER</span> phases.
            </p>
          </div>

          {/* Custom Creator */}
          <AnimatePresence mode="wait">
            {showCustomCreator ? (
              <motion.div
                key="creator"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-card border-2 border-section-hiit rounded-lg p-5 space-y-6">
                  <div className="text-center">
                    <h2 className="font-display text-2xl text-section-hiit">
                      {getCustomProtocolName(customWork, customRest, customRounds)}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getCustomProtocolTagline(getCustomProtocolName(customWork, customRest, customRounds))}
                    </p>
                  </div>

                  {/* Work Duration */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-display">FIGHT DURATION</span>
                      <span className="font-display text-xl text-destructive">{customWork}s</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCustomWork(Math.max(5, customWork - 5))}
                        className="p-2 bg-background border border-border rounded-lg hover:border-destructive transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={customWork}
                        onChange={(e) => setCustomWork(Number(e.target.value))}
                        className="flex-1 accent-destructive"
                      />
                      <button
                        onClick={() => setCustomWork(Math.min(120, customWork + 5))}
                        className="p-2 bg-background border border-border rounded-lg hover:border-destructive transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rest Duration */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-display">RECOVER DURATION</span>
                      <span className="font-display text-xl text-primary">{customRest}s</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCustomRest(Math.max(5, customRest - 5))}
                        className="p-2 bg-background border border-border rounded-lg hover:border-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={customRest}
                        onChange={(e) => setCustomRest(Number(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <button
                        onClick={() => setCustomRest(Math.min(120, customRest + 5))}
                        className="p-2 bg-background border border-border rounded-lg hover:border-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rounds */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-display">ROUNDS</span>
                      <span className="font-display text-xl text-section-hiit">{customRounds}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCustomRounds(Math.max(1, customRounds - 1))}
                        className="p-2 bg-background border border-border rounded-lg hover:border-section-hiit transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={customRounds}
                        onChange={(e) => setCustomRounds(Number(e.target.value))}
                        className="flex-1 accent-section-hiit"
                      />
                      <button
                        onClick={() => setCustomRounds(Math.min(30, customRounds + 1))}
                        className="p-2 bg-background border border-border rounded-lg hover:border-section-hiit transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Preview */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-border">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">TOTAL TIME</div>
                      <div className="font-display text-lg text-foreground">
                        {Math.floor((customWork + customRest) * customRounds / 60)}:{String((customWork + customRest) * customRounds % 60).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">WORK TIME</div>
                      <div className="font-display text-lg text-foreground">
                        {Math.floor(customWork * customRounds / 60)}:{String(customWork * customRounds % 60).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">INTENSITY</div>
                      <div className="font-display text-lg text-foreground">
                        {Math.round((customWork / (customWork + customRest)) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCustomCreator(false)}
                      className="flex-1 py-3 bg-muted text-muted-foreground font-display rounded-lg hover:bg-muted/80 transition-colors min-h-[48px]"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleStartCustom}
                      className="flex-1 py-3 bg-section-hiit text-white font-display rounded-lg hover:box-glow-hiit transition-all flex items-center justify-center gap-2 min-h-[48px]"
                    >
                      <Play className="w-5 h-5" />
                      ENGAGE
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="create-btn"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setShowCustomCreator(true)}
                className="w-full mb-6 group bg-section-hiit/10 border-2 border-dashed border-section-hiit/50 rounded-lg p-5 text-center hover:border-section-hiit hover:bg-section-hiit/20 transition-all min-h-[80px]"
              >
                <div className="flex items-center justify-center gap-3">
                  <Zap className="w-6 h-6 text-section-hiit" />
                  <span className="font-display text-xl text-section-hiit">FORGE YOUR OWN PROTOCOL</span>
                  <Zap className="w-6 h-6 text-section-hiit" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Create a custom HIIT session with your own work, rest, and round settings
                </p>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Preset Protocols */}
          {!showCustomCreator && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground font-display tracking-wider mb-2">
                PRESET PROTOCOLS
              </div>
              {defaultHIITConfigs.map((config, i) => (
                <motion.button
                  key={config.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleStart(config)}
                  className="w-full group bg-card border border-section-hiit/30 rounded-lg p-5 text-left hover:border-section-hiit transition-all min-h-[80px]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-display text-2xl text-section-hiit group-hover:text-glow-hiit transition-all">
                        {config.codeName}
                      </h2>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{config.workDurationSec}s work</span>
                        <span>{config.restDurationSec}s rest</span>
                        <span>{config.rounds} rounds</span>
                      </div>
                    </div>
                    <Play className="w-8 h-8 text-section-hiit opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="mt-4 flex gap-1">
                    {[...Array(config.rounds)].map((_, j) => (
                      <div 
                        key={j}
                        className="h-1 flex-1 rounded-full bg-section-hiit/30 max-w-4"
                      />
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          <AppFooter />
        </div>
      </div>
    );
  }

  // COMPLETION SCREEN - Use MissionCompleteScreen for consistent UX
  if (timerPhase === 'COMPLETED' && selectedConfig) {
    const completedRounds = currentRound;
    const sessionStats = calculateHIITStats(selectedConfig, completedRounds);
    
    return (
      <MissionCompleteScreen
        isGuest={isAnonymous}
        mission={{
          id: `hiit-${selectedConfig.id}`,
          name: selectedConfig.name,
          code_name: selectedConfig.codeName,
          outro_lore: `${completedRounds} rounds of ${selectedConfig.workDurationSec}s work / ${selectedConfig.restDurationSec}s rest. Intensity: ${sessionStats.intensity}%.`,
        }}
        stats={{
          score: sessionStats.score,
          xp: sessionStats.xp,
          setsCompleted: completedRounds,
          totalReps: sessionStats.totalWorkTime,
          totalWeight: 0, // HIIT doesn't track weight
          maxCombo: sessionStats.combo,
          damageDealt: sessionStats.damage,
        }}
        boss={activeBoss ? {
          name: activeBoss.name,
          current_hp: activeBoss.current_hp,
          max_hp: activeBoss.max_hp,
          is_defeated: activeBoss.is_defeated,
          weaknesses: activeBoss.weaknesses || [],
        } : null}
        onContinue={handleReset}
      />
    );
  }

  // ACTIVE TIMER SCREEN - Redesigned like WorkoutSession
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />

      {/* Explosion Effect */}
      <ExplosionEffect 
        trigger={showExplosion} 
        onComplete={() => setShowExplosion(false)} 
      />

      {/* Header - Workout-session style */}
      <header className="relative z-10 bg-card/80 backdrop-blur border-b border-border p-4">
        <div className="flex items-center justify-between">
          {/* Left: Exit button */}
          <button 
            onClick={handleBackPress}
            className="p-3 bg-muted/50 rounded-full border border-border hover:border-destructive transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Exit"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Center: Protocol name + round */}
          <div className="text-center flex-1 mx-4">
            <div className="font-display text-sm text-muted-foreground">
              {selectedConfig?.codeName || 'HIIT'}
            </div>
            <div className="font-display text-lg">
              ROUND <span className="text-section-hiit">{currentRound}</span>
              <span className="text-muted-foreground">/{hiitConfig?.rounds}</span>
            </div>
          </div>

          {/* Right: Sound toggle */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 bg-muted/50 rounded-full border border-border hover:border-foreground/50 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>PROGRESS</span>
            <span>{Math.round(calculateProgress())}%</span>
          </div>
          <Progress 
            value={calculateProgress()} 
            className="h-2"
          />
        </div>
      </header>

      {/* Main timer display */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={timerPhase}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center w-full max-w-md"
          >
            {/* Phase indicator pill */}
            <motion.div
              className={`inline-flex items-center gap-2 px-6 py-2 rounded-full mb-6 ${getPhaseColor()}`}
            >
              {timerPhase === 'WORK' && <Flame className="w-5 h-5 text-white" />}
              {timerPhase === 'REST' && <Timer className="w-5 h-5 text-secondary-foreground" />}
              <span className="font-display text-xl text-white drop-shadow-md">
                {getPhaseLabel()}
              </span>
            </motion.div>
            
            {/* Timer */}
            <motion.div 
              key={timeRemaining}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className={`arcade-number text-[25vw] md:text-[180px] leading-none ${
                timeRemaining <= 3 && timerPhase === 'WORK' ? 'text-destructive animate-pulse' : 'text-foreground'
              }`}
            >
              {timeRemaining}
            </motion.div>

            {/* Next up preview */}
            <div className="mt-4 text-sm text-muted-foreground">
              {timerPhase === 'WORK' && currentRound < (hiitConfig?.rounds || 0) && (
                <span>Next: <span className="text-primary font-display">RECOVER</span> ({hiitConfig?.restDurationSec}s)</span>
              )}
              {timerPhase === 'WORK' && currentRound >= (hiitConfig?.rounds || 0) && (
                <span className="text-success font-display">FINAL ROUND</span>
              )}
              {timerPhase === 'REST' && (
                <span>Next: <span className="text-destructive font-display">FIGHT</span> ({hiitConfig?.workDurationSec}s)</span>
              )}
              {timerPhase === 'COUNTDOWN' && (
                <span>First up: <span className="text-destructive font-display">FIGHT</span></span>
              )}
            </div>

            {/* Round indicators */}
            <div className="flex justify-center gap-1.5 mt-6">
              {Array.from({ length: hiitConfig?.rounds || 0 }).map((_, i) => (
                <div 
                  key={i}
                  className={`h-2 w-6 rounded-full transition-all ${
                    i < currentRound - 1 
                      ? 'bg-success' 
                      : i === currentRound - 1 
                        ? getPhaseColor()
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Controls - Workout-session style footer */}
      <footer className="relative z-10 bg-card/80 backdrop-blur border-t border-border p-4 space-y-3">
        {/* Main pause/resume button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`w-full py-5 rounded-lg font-display text-xl flex items-center justify-center gap-3 min-h-[64px] transition-all ${
            isPaused 
              ? 'bg-success text-success-foreground hover:bg-success/90' 
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-7 h-7" /> RESUME
            </>
          ) : (
            <>
              <Pause className="w-7 h-7" /> PAUSE
            </>
          )}
        </button>

        {/* Secondary actions row */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowResetDialog(true)}
            className="flex-1 py-3 bg-card border border-border text-foreground font-display text-sm rounded-lg hover:border-section-hiit/50 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            <RotateCcw className="w-4 h-4" />
            RESET
          </button>
          <button
            onClick={handleBackPress}
            className="flex-1 py-3 bg-card border border-border text-foreground font-display text-sm rounded-lg hover:border-destructive/50 transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            <X className="w-4 h-4" />
            FORFEIT
          </button>
        </div>
      </footer>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">ABORT MISSION?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You have completed {currentRound > 1 ? currentRound - 1 : 0} round{currentRound > 2 ? 's' : ''}. 
              Leaving now will discard your progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">STAY</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmExit}
              className="bg-destructive text-destructive-foreground font-display hover:bg-destructive/90"
            >
              ABORT
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-section-hiit">RESET TIMER?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will restart the current protocol from the beginning. 
              Your progress ({currentRound > 1 ? currentRound - 1 : 0} round{currentRound > 2 ? 's' : ''}) will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">CANCEL</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedConfig) {
                  startHIIT(selectedConfig);
                  setIsPaused(false);
                  prevPhaseRef.current = 'IDLE';
                  prevRoundRef.current = 0;
                }
                setShowResetDialog(false);
              }}
              className="bg-section-hiit text-white font-display hover:bg-section-hiit/90"
            >
              RESET
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HIITTimer;
