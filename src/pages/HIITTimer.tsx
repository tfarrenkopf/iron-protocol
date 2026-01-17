import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Plus, Minus, Zap, ArrowLeft } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { defaultHIITConfigs } from '@/data/missions';
import { HIITConfig } from '@/types/game';
import { ExplosionEffect } from '@/components/ExplosionEffect';
import { KillFeed } from '@/components/KillFeed';
import { useHIITSounds } from '@/hooks/useHIITSounds';
import { Progress } from '@/components/ui/progress';
import { GlobalNav } from '@/components/GlobalNav';
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

interface KillFeedItem {
  id: string;
  message: string;
  type: 'round' | 'phase' | 'bonus';
}

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

const HIITTimer = () => {
  const navigate = useNavigate();
  const [selectedConfig, setSelectedConfig] = useState<HIITConfig | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExplosion, setShowExplosion] = useState(false);
  const [killFeedItems, setKillFeedItems] = useState<KillFeedItem[]>([]);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [customWork, setCustomWork] = useState(30);
  const [customRest, setCustomRest] = useState(15);
  const [customRounds, setCustomRounds] = useState(8);
  const prevRoundRef = useRef(0);
  const prevPhaseRef = useRef<string>('IDLE');

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

  // Add to kill feed helper
  const addKillFeedItem = useCallback((message: string, type: 'round' | 'phase' | 'bonus') => {
    const id = `${Date.now()}-${Math.random()}`;
    setKillFeedItems(prev => [...prev, { id, message, type }]);
  }, []);

  const removeKillFeedItem = useCallback((id: string) => {
    setKillFeedItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Track round changes for kill feed
  useEffect(() => {
    if (currentRound > prevRoundRef.current && currentRound > 1) {
      // Round completed - this is the ONLY notification for round completion
      addKillFeedItem(`ROUND ${currentRound - 1} COMPLETE`, 'round');
      setShowExplosion(true);
    }
    prevRoundRef.current = currentRound;
  }, [currentRound, addKillFeedItem]);

  // Track phase changes for sounds only (removed duplicate kill feed messages)
  useEffect(() => {
    if (prevPhaseRef.current !== timerPhase) {
      if (timerPhase === 'WORK' && prevPhaseRef.current !== 'IDLE') {
        playWorkStart();
        // Removed: addKillFeedItem('FIGHT!', 'phase') - redundant with phase label
      } else if (timerPhase === 'REST') {
        playRestStart();
        // Removed: addKillFeedItem('RECOVER', 'phase') - redundant with phase label
      } else if (timerPhase === 'COMPLETED') {
        playComplete();
        addKillFeedItem('MISSION COMPLETE', 'bonus');
      }
      prevPhaseRef.current = timerPhase;
    }
  }, [timerPhase, playWorkStart, playRestStart, playComplete, addKillFeedItem]);

  // Countdown tick sound
  useEffect(() => {
    if (timerPhase === 'COUNTDOWN' && timeRemaining <= 3 && timeRemaining > 0) {
      playCountdownTick();
    }
  }, [timerPhase, timeRemaining, playCountdownTick]);

  // Timer logic
  useEffect(() => {
    if (timerPhase === 'IDLE' || timerPhase === 'COMPLETED' || isPaused) return;

    const interval = setInterval(() => {
      if (timeRemaining <= 1) {
        // Phase complete
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
    prevPhaseRef.current = 'IDLE';
    prevRoundRef.current = 0;
  }, [startHIIT]);

  const handleReset = useCallback(() => {
    resetHIIT();
    setSelectedConfig(null);
    setIsPaused(false);
    setKillFeedItems([]);
    setShowCustomCreator(false);
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

  // Handle back button with confirmation if progress exists
  const handleBackPress = useCallback(() => {
    // Show confirmation if at least one round has been started
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
      case 'WORK': return 'from-destructive to-accent';
      case 'REST': return 'from-secondary to-primary';
      case 'COUNTDOWN': return 'from-primary to-secondary';
      case 'COMPLETED': return 'from-success to-secondary';
      default: return 'from-muted to-muted';
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

  // Calculate overall progress
  const calculateProgress = () => {
    if (!hiitConfig) return 0;
    const totalRounds = hiitConfig.rounds;
    const completedRounds = currentRound - 1;
    
    // Calculate progress within current round
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

  // Selection screen
  if (timerPhase === 'IDLE') {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        
        <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
          <GlobalNav 
            title="COMBAT HIIT TIMER"
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
                <div className="bg-card border-2 border-accent rounded-lg p-5 space-y-6">
                  <div className="text-center">
                    <h2 className="font-display text-2xl text-accent text-glow-accent">
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
                        className="p-2 bg-background border border-border rounded-lg hover:border-destructive transition-colors"
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
                        className="p-2 bg-background border border-border rounded-lg hover:border-destructive transition-colors"
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
                        className="p-2 bg-background border border-border rounded-lg hover:border-primary transition-colors"
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
                        className="p-2 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rounds */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-display">ROUNDS</span>
                      <span className="font-display text-xl text-secondary">{customRounds}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCustomRounds(Math.max(1, customRounds - 1))}
                        className="p-2 bg-background border border-border rounded-lg hover:border-secondary transition-colors"
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
                        className="flex-1 accent-secondary"
                      />
                      <button
                        onClick={() => setCustomRounds(Math.min(30, customRounds + 1))}
                        className="p-2 bg-background border border-border rounded-lg hover:border-secondary transition-colors"
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
                      <div className="font-display text-lg text-destructive">
                        {Math.floor(customWork * customRounds / 60)}:{String(customWork * customRounds % 60).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">INTENSITY</div>
                      <div className="font-display text-lg text-accent">
                        {Math.round((customWork / (customWork + customRest)) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCustomCreator(false)}
                      className="flex-1 py-3 bg-muted text-muted-foreground font-display rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleStartCustom}
                      className="flex-1 py-3 bg-accent text-accent-foreground font-display rounded-lg hover:box-glow-accent transition-all flex items-center justify-center gap-2"
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
                className="w-full mb-6 group bg-accent/10 border-2 border-dashed border-accent/50 rounded-lg p-5 text-center hover:border-accent hover:bg-accent/20 transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <Zap className="w-6 h-6 text-accent" />
                  <span className="font-display text-xl text-accent">FORGE YOUR OWN PROTOCOL</span>
                  <Zap className="w-6 h-6 text-accent" />
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
                  className="w-full group bg-card border border-border rounded-lg p-5 text-left hover:border-secondary transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-display text-2xl text-secondary group-hover:text-glow-secondary transition-all">
                        {config.codeName}
                      </h2>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{config.workDurationSec}s work</span>
                        <span>{config.restDurationSec}s rest</span>
                        <span>{config.rounds} rounds</span>
                      </div>
                    </div>
                    <Play className="w-8 h-8 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="mt-4 flex gap-1">
                    {[...Array(config.rounds)].map((_, j) => (
                      <div 
                        key={j}
                        className="h-1 flex-1 rounded-full bg-secondary/30 max-w-4"
                      />
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Timer screen
  return (
    <div className={`min-h-screen bg-gradient-to-br ${getPhaseColor()} relative flex flex-col`}>
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />

      {/* Kill Feed - Only shows round completions now */}
      <KillFeed items={killFeedItems} onItemComplete={removeKillFeedItem} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleBackPress}
            className="p-3 bg-background/30 backdrop-blur rounded-full border border-foreground/20"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleReset}
            className="p-3 bg-background/30 backdrop-blur rounded-full border border-foreground/20 flex items-center gap-1"
            aria-label="Return to protocol selection"
            title="Return to protocol selection"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs font-display hidden sm:inline">RESET</span>
          </button>
        </div>

        <div className="font-display text-lg bg-background/30 backdrop-blur px-4 py-2 rounded-full border border-foreground/20">
          <span className="text-foreground/70 text-sm mr-2">ROUND</span>
          <span className="text-xl">{currentRound}</span>
          <span className="text-foreground/50">/{hiitConfig?.rounds}</span>
        </div>

        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 bg-background/30 backdrop-blur rounded-full border border-foreground/20"
          aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </header>

      {/* Progress Bar - High contrast with shadow for visibility on all backgrounds */}
      {timerPhase !== 'COMPLETED' && (
        <div className="relative z-10 px-4">
          <div className="relative">
            <Progress 
              value={calculateProgress()} 
              className="h-3 bg-black/50 border border-white/20 shadow-lg"
            />
            {/* Progress text overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-display text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {Math.round(calculateProgress())}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Explosion Effect */}
      <ExplosionEffect 
        trigger={showExplosion} 
        onComplete={() => setShowExplosion(false)} 
      />

      {/* Main timer display */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={timerPhase}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center"
          >
            {/* Phase label - single clear status indicator */}
            <div className="font-display text-3xl mb-4 tracking-widest drop-shadow-lg">
              {getPhaseLabel()}
            </div>
            
            {/* Timer - high contrast with shadow */}
            <motion.div 
              key={timeRemaining}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`arcade-number text-[20vw] md:text-[200px] leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] ${
                timeRemaining <= 3 && timerPhase === 'WORK' ? 'animate-shake text-glow-primary' : ''
              }`}
            >
              {timeRemaining}
            </motion.div>

            {timerPhase === 'COMPLETED' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 space-y-4"
              >
                <div className="font-display text-3xl text-foreground drop-shadow-lg">
                  {hiitConfig?.rounds} ROUNDS COMPLETE
                </div>
                <button
                  onClick={handleReset}
                  className="mt-6 px-8 py-4 bg-background text-foreground font-display text-xl rounded hover:opacity-90 transition-opacity"
                >
                  CONTINUE
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Controls */}
      {timerPhase !== 'COMPLETED' && (
        <footer className="relative z-10 p-6">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-full py-6 bg-background/30 backdrop-blur rounded-lg font-display text-xl flex items-center justify-center gap-3 border border-foreground/20"
          >
            {isPaused ? (
              <>
                <Play className="w-8 h-8" /> RESUME
              </>
            ) : (
              <>
                <Pause className="w-8 h-8" /> PAUSE
              </>
            )}
          </button>
        </footer>
      )}

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-secondary">ABORT MISSION?</AlertDialogTitle>
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
    </div>
  );
};

export default HIITTimer;
