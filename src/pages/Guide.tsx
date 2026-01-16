import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <p className="text-xs text-muted-foreground tracking-wider">OPERATIONAL GUIDE</p>
          </div>
        </motion.header>

        {/* Anchor Navigation */}
        <nav className="bg-card border border-border rounded-lg p-4 mb-8 sticky top-4 z-20">
          <div className="flex flex-wrap gap-2">
            {GUIDE_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-display rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all ${section.color}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.title}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* All Sections */}
        <div className="space-y-8">
          {GUIDE_SECTIONS.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <motion.section
                id={section.id}
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.05 }}
                className="bg-card border border-border rounded-lg p-6 scroll-mt-24"
              >
                {/* Section Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-lg bg-background border border-border ${section.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h2 className={`font-display text-2xl md:text-3xl ${section.color}`}>{section.title}</h2>
                </div>

                {/* Content Items */}
                <div className="space-y-4">
                  {section.content.map((item, i) => (
                    <div key={i}>
                      {item.type === 'text' && (
                        <p className="text-base text-muted-foreground leading-relaxed">{item.value}</p>
                      )}
                      {item.type === 'highlight' && (
                        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                          <p className="text-primary font-display text-base">{item.value}</p>
                        </div>
                      )}
                      {item.type === 'step' && (
                        <div className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-display text-lg flex items-center justify-center">
                            {item.label}
                          </span>
                          <p className="text-base text-foreground pt-1">{item.value}</p>
                        </div>
                      )}
                      {item.type === 'stat' && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background rounded-lg border border-border gap-2">
                          <span className="text-sm text-muted-foreground font-display">{item.label}</span>
                          <span className="text-base text-foreground">{item.value}</span>
                        </div>
                      )}
                      {item.type === 'tip' && (
                        <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                          <Scroll className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                          <p className="text-base text-accent">{item.value}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-display text-xl hover:box-glow-primary transition-all"
          >
            BEGIN TRAINING
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Guide;