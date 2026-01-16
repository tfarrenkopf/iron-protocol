import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { defaultHIITConfigs } from '@/data/missions';
import { HIITConfig } from '@/types/game';
import { ExplosionEffect } from '@/components/ExplosionEffect';
import { XPPopup } from '@/components/XPPopup';

const HIITTimer = () => {
  const navigate = useNavigate();
  const [selectedConfig, setSelectedConfig] = useState<HIITConfig | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [lastXPGain, setLastXPGain] = useState({ xp: 0, score: 0, combo: 0 });
  const prevRoundRef = useRef(0);

  const {
    hiitConfig,
    timerPhase,
    currentRound,
    timeRemaining,
    stats,
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

  // Track round changes for XP popup
  useEffect(() => {
    if (currentRound > prevRoundRef.current && currentRound > 1) {
      // Round completed - show XP popup
      const xpGain = Math.floor(100 * (1 + stats.combo * 0.1) / 10);
      setLastXPGain({
        xp: xpGain,
        score: Math.floor(100 * (1 + stats.combo * 0.1)),
        combo: stats.combo,
      });
      setShowExplosion(true);
      setTimeout(() => setShowXPPopup(true), 300);
    }
    prevRoundRef.current = currentRound;
  }, [currentRound, stats.combo]);

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
  }, [startHIIT]);

  const handleReset = useCallback(() => {
    resetHIIT();
    setSelectedConfig(null);
    setIsPaused(false);
  }, [resetHIIT]);

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

  // Selection screen
  if (timerPhase === 'IDLE') {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
        
        <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
          <header className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/')}
              className="p-2 border border-border rounded hover:border-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-3xl text-secondary">COMBAT MODE</h1>
              <p className="text-xs text-muted-foreground tracking-wider">SELECT PROTOCOL</p>
            </div>
          </header>

          <div className="bg-card/50 border border-border rounded-lg p-3 mb-6">
            <p className="text-xs text-muted-foreground text-center">
              <span className="text-secondary font-display">HIIT</span> alternates between high-intensity work and rest. 
              Pick a protocol, then perform any exercise during <span className="text-destructive">FIGHT</span> phases. 
              Rest during <span className="text-primary">RECOVER</span> phases.
            </p>
          </div>

          <div className="space-y-4">
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
        </div>
      </div>
    );
  }

  // Timer screen
  return (
    <div className={`min-h-screen bg-gradient-to-br ${getPhaseColor()} relative flex flex-col`}>
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-background/20 backdrop-blur rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleReset}
            className="p-3 bg-background/20 backdrop-blur rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="font-display text-lg">
          ROUND {currentRound}/{hiitConfig?.rounds}
        </div>

        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 bg-background/20 backdrop-blur rounded-full"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </header>

      {/* Explosion Effect */}
      <ExplosionEffect 
        trigger={showExplosion} 
        onComplete={() => setShowExplosion(false)} 
      />
      
      {/* XP Popup */}
      <XPPopup
        show={showXPPopup}
        xp={lastXPGain.xp}
        score={lastXPGain.score}
        combo={lastXPGain.combo}
        onComplete={() => setShowXPPopup(false)}
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
            <div className="font-display text-2xl mb-4 tracking-widest opacity-80">
              {getPhaseLabel()}
            </div>
            
            <motion.div 
              key={timeRemaining}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`arcade-number text-[20vw] md:text-[200px] leading-none ${
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
                <div className="font-display text-4xl">
                  SCORE: {Math.floor(stats.score).toLocaleString()}
                </div>
                <div className="text-xl opacity-80">
                  MAX COMBO: {stats.maxCombo}x
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
            className="w-full py-6 bg-background/20 backdrop-blur rounded-lg font-display text-xl flex items-center justify-center gap-3"
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

      {/* Combo display */}
      {stats.combo > 0 && timerPhase !== 'COMPLETED' && (
        <motion.div
          key={stats.combo}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-1/4 right-8 font-display text-4xl"
        >
          {stats.combo}x
        </motion.div>
      )}
    </div>
  );
};

export default HIITTimer;
