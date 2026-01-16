import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft,
  Dumbbell, 
  Timer, 
  Trophy, 
  Zap, 
  Target,
  Flame,
  Users,
  Plus,
  Scroll
} from 'lucide-react';

const GUIDE_SECTIONS = [
  {
    id: 'welcome',
    title: 'WELCOME, AGENT',
    icon: Target,
    color: 'text-primary',
    content: [
      { type: 'text', value: 'Iron Protocol transforms your workouts into missions. Every rep counts. Every set matters.' },
      { type: 'highlight', value: 'Complete sets → Earn XP → Level up → Dominate the leaderboard' },
      { type: 'text', value: 'This guide will brief you on all combat protocols.' },
    ]
  },
  {
    id: 'missions',
    title: 'MISSIONS',
    icon: Dumbbell,
    color: 'text-primary',
    content: [
      { type: 'text', value: 'Missions are structured workouts with specific exercises, sets, and rep targets.' },
      { type: 'step', label: '1', value: 'Select a mission from the dashboard or mission list' },
      { type: 'step', label: '2', value: 'Review the exercises and start when ready' },
      { type: 'step', label: '3', value: 'Log each set with your actual weight and reps' },
      { type: 'step', label: '4', value: 'Complete all sets to finish the mission' },
      { type: 'tip', value: 'Create your own missions in the Arsenal to match your training style' },
    ]
  },
  {
    id: 'scoring',
    title: 'SCORING & XP',
    icon: Zap,
    color: 'text-accent',
    content: [
      { type: 'text', value: 'Every completed set earns you Score and XP. Your performance determines your gains.' },
      { type: 'stat', label: 'BASE SCORE', value: 'Reps × Weight = Base points per set' },
      { type: 'stat', label: 'COMBO BONUS', value: 'Chain sets without long breaks for multipliers' },
      { type: 'stat', label: 'XP', value: 'Score ÷ 10 = XP earned (levels you up)' },
      { type: 'tip', value: 'Higher combos mean exponentially more points. Stay in the zone!' },
    ]
  },
  {
    id: 'combos',
    title: 'COMBO SYSTEM',
    icon: Flame,
    color: 'text-secondary',
    content: [
      { type: 'text', value: 'Combos reward consistent effort. Keep moving to build your multiplier.' },
      { type: 'highlight', value: 'Complete sets within 90 seconds to maintain combo' },
      { type: 'text', value: 'Each consecutive set adds +1 to your combo. Miss the window and it resets to 1x.' },
      { type: 'stat', label: '5x COMBO', value: '50% bonus score' },
      { type: 'stat', label: '10x COMBO', value: '100% bonus score (2x multiplier!)' },
      { type: 'tip', value: 'Your max combo is tracked on your profile and the leaderboard' },
    ]
  },
  {
    id: 'hiit',
    title: 'HIIT TIMER',
    icon: Timer,
    color: 'text-secondary',
    content: [
      { type: 'text', value: 'High-Intensity Interval Training with built-in work/rest phases.' },
      { type: 'step', label: '1', value: 'Choose a protocol (e.g., BLITZ: 30s work / 10s rest)' },
      { type: 'step', label: '2', value: 'Perform any exercise during FIGHT phases' },
      { type: 'step', label: '3', value: 'Rest during RECOVER phases' },
      { type: 'step', label: '4', value: 'Survive all rounds to complete the session' },
      { type: 'tip', value: 'Screen stays awake automatically during HIIT sessions' },
    ]
  },
  {
    id: 'arsenal',
    title: 'THE ARSENAL',
    icon: Plus,
    color: 'text-primary',
    content: [
      { type: 'text', value: 'Create and manage your custom exercises and missions.' },
      { type: 'highlight', value: 'EDIT ARSENAL on the dashboard → Add exercises → Build missions' },
      { type: 'text', value: 'Custom exercises are private by default. Use them in your personal missions.' },
      { type: 'text', value: 'Missions you create appear in your mission list for quick access.' },
      { type: 'tip', value: 'Include muscle groups and equipment tags for better organization' },
    ]
  },
  {
    id: 'handlers',
    title: 'HANDLER MODE',
    icon: Users,
    color: 'text-warning',
    content: [
      { type: 'text', value: 'Trainers can create Squads and assign missions to athletes.' },
      { type: 'step', label: '1', value: 'Enable Handler Mode in your profile' },
      { type: 'step', label: '2', value: 'Create a Squad and share the invite link' },
      { type: 'step', label: '3', value: 'Assign missions that appear as INCOMING ORDERS' },
      { type: 'step', label: '4', value: 'Track completion through the Handler Dashboard' },
      { type: 'tip', value: 'Athletes choose whether to share their stats with you' },
    ]
  },
  {
    id: 'leaderboard',
    title: 'LEADERBOARD',
    icon: Trophy,
    color: 'text-accent',
    content: [
      { type: 'text', value: 'Compete against all agents on the global rankings.' },
      { type: 'stat', label: 'RANKED BY', value: 'Total Score earned across all sessions' },
      { type: 'text', value: 'Your profile shows lifetime stats: sets, reps, weight lifted, and max combo.' },
      { type: 'highlight', value: 'Guest mode doesn\'t save progress. Sign up to claim your rank!' },
      { type: 'tip', value: 'Check THE FRONT LINES for a live feed of all warrior activity' },
    ]
  },
];

const Guide = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);

  const section = GUIDE_SECTIONS[currentSection];
  const Icon = section.icon;

  const goNext = () => {
    if (currentSection < GUIDE_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const goPrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button 
            onClick={() => navigate('/')}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-primary">FIELD MANUAL</h1>
            <p className="text-xs text-muted-foreground tracking-wider">
              {currentSection + 1} / {GUIDE_SECTIONS.length}
            </p>
          </div>
        </motion.header>

        {/* Section Navigation Pills */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {GUIDE_SECTIONS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentSection(i)}
              className={`flex-shrink-0 px-3 py-1 text-xs font-display rounded transition-all ${
                i === currentSection
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:border-primary/50'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-lg bg-background border border-border ${section.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <h2 className={`font-display text-3xl ${section.color}`}>{section.title}</h2>
            </div>

            {/* Content Items */}
            <div className="space-y-4">
              {section.content.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item.type === 'text' && (
                    <p className="text-muted-foreground">{item.value}</p>
                  )}
                  {item.type === 'highlight' && (
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                      <p className="text-primary font-display text-sm">{item.value}</p>
                    </div>
                  )}
                  {item.type === 'step' && (
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-secondary-foreground font-display text-sm flex items-center justify-center">
                        {item.label}
                      </span>
                      <p className="text-foreground">{item.value}</p>
                    </div>
                  )}
                  {item.type === 'stat' && (
                    <div className="flex items-center justify-between p-2 bg-background rounded border border-border">
                      <span className="text-xs text-muted-foreground font-display">{item.label}</span>
                      <span className="text-sm text-foreground">{item.value}</span>
                    </div>
                  )}
                  {item.type === 'tip' && (
                    <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                      <Scroll className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-accent">{item.value}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={goPrev}
            disabled={currentSection === 0}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded hover:border-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-display text-sm">PREV</span>
          </button>

          {currentSection === GUIDE_SECTIONS.length - 1 ? (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded font-display hover:box-glow-primary transition-all"
            >
              BEGIN TRAINING
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
            >
              <span className="font-display text-sm">NEXT</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Guide;
