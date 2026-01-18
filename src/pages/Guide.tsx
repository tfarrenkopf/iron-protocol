import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  Timer, 
  Trophy, 
  Zap, 
  Target,
  Flame,
  Users,
  Crosshair,
  Layers,
  Radio
} from 'lucide-react';
import { GlobalNav } from '@/components/GlobalNav';
import { AppFooter } from '@/components/AppFooter';

const GUIDE_SECTIONS = [
  {
    id: 'welcome',
    title: 'WELCOME, AGENT',
    icon: Target,
    color: 'text-primary',
    content: [
      { type: 'text', value: 'Iron Protocol transforms your workouts into tactical missions. Every rep deals damage. Every set earns XP. Rise through the ranks.' },
      { type: 'highlight', value: 'Log sets → Build combos → Earn XP → Climb the leaderboard' },
      { type: 'text', value: 'Guest mode lets you explore, but sign up to save your progress and claim your rank.' },
    ]
  },
  {
    id: 'command',
    title: 'COMMAND CENTER',
    icon: Layers,
    color: 'text-primary',
    content: [
      { type: 'text', value: 'The Command Center is your hub for browsing and creating workout content. It\'s organized into three tabs:' },
      { type: 'highlight', value: 'CAMPAIGNS → MISSIONS → EXERCISES' },
      { type: 'stat', label: 'CAMPAIGNS', value: 'Multi-mission training programs (e.g., Push Pull Legs, Starting Strength)' },
      { type: 'stat', label: 'MISSIONS', value: 'Individual workouts with specific exercises and rep targets' },
      { type: 'stat', label: 'EXERCISES', value: 'The building blocks — individual movements like squats or curls' },
      { type: 'tip', value: 'Use the source toggle (STANDARD / MY OPS / COMMUNITY) to filter between official content and your own creations' },
    ]
  },
  {
    id: 'exercises',
    title: 'EXERCISES',
    icon: Dumbbell,
    color: 'text-section-exercises',
    content: [
      { type: 'text', value: 'Exercises are individual movements that form the foundation of your training.' },
      { type: 'highlight', value: 'Command Center → Exercises tab → + button to create' },
      { type: 'step', label: '1', value: 'Enter the exercise name (e.g., "Incline Dumbbell Press")' },
      { type: 'step', label: '2', value: 'Select the primary muscle group it targets' },
      { type: 'step', label: '3', value: 'Choose the required equipment' },
      { type: 'step', label: '4', value: 'Optionally add focus areas and instructions' },
      { type: 'text', value: 'Your custom exercises are private and can be used in your own missions.' },
      { type: 'tip', value: 'The app remembers your last-used weight for each exercise to speed up logging' },
    ]
  },
  {
    id: 'missions',
    title: 'MISSIONS',
    icon: Crosshair,
    color: 'text-section-missions',
    content: [
      { type: 'text', value: 'Missions are structured workouts that combine multiple exercises with set and rep targets.' },
      { type: 'highlight', value: 'Command Center → Missions tab → + button to create' },
      { type: 'step', label: '1', value: 'Give your mission a name and optional description' },
      { type: 'step', label: '2', value: 'Add exercises from the library' },
      { type: 'step', label: '3', value: 'Set target sets, reps, and rest time for each exercise' },
      { type: 'step', label: '4', value: 'Choose focus areas to categorize your mission' },
      { type: 'text', value: 'During a mission, log each set with your actual weight and reps. Complete all sets to finish.' },
      { type: 'tip', value: 'Quick train lets you log any exercise on-the-fly without selecting a mission first' },
    ]
  },
  {
    id: 'campaigns',
    title: 'CAMPAIGNS',
    icon: Flame,
    color: 'text-section-campaigns',
    content: [
      { type: 'text', value: 'Campaigns are multi-mission training programs that track your long-term progress.' },
      { type: 'highlight', value: 'Command Center → Campaigns tab → + button to create' },
      { type: 'step', label: '1', value: 'Name your campaign (e.g., "Upper/Lower Split")' },
      { type: 'step', label: '2', value: 'Add missions from the picker — these become your rotation' },
      { type: 'step', label: '3', value: 'Set a campaign as your Active Campaign to track progress' },
      { type: 'text', value: 'Campaigns are open-ended — complete missions in any order and as many times as you want.' },
      { type: 'stat', label: 'RUN HISTORY', value: 'Shows every mission completed in your current campaign run' },
      { type: 'stat', label: 'CAMPAIGN CLEARS', value: 'Tracks how many times you\'ve completed all missions in a campaign' },
      { type: 'tip', value: 'Switching campaigns abandons your current run progress — a confirmation will warn you' },
    ]
  },
  {
    id: 'rivals',
    title: 'RIVALS',
    icon: Target,
    color: 'text-section-intel',
    content: [
      { type: 'text', value: 'Challenge friends to head-to-head competition with the Rival system.' },
      { type: 'highlight', value: 'Profile → Share your Rival Code or send your invite link' },
      { type: 'step', label: '1', value: 'Go to your Profile and copy your unique Rival Code' },
      { type: 'step', label: '2', value: 'Share the link with friends — they can sign up directly from it' },
      { type: 'step', label: '3', value: 'Once connected, you\'ll see each other on the Weekly Killboard' },
      { type: 'text', value: 'The Weekly Killboard tracks missions completed, weight lifted, and max combos — resetting every Sunday.' },
      { type: 'stat', label: 'ACCEPT CHALLENGE', value: 'Start the same mission a rival just finished to compete directly' },
      { type: 'tip', value: 'Check the Rival Widget on your dashboard or Intel page to see who\'s ahead' },
    ]
  },
  {
    id: 'squads',
    title: 'SQUADS',
    icon: Users,
    color: 'text-warning',
    content: [
      { type: 'text', value: 'Squads let trainers (Handlers) organize athletes into groups for structured programming.' },
      { type: 'highlight', value: 'Handler Dashboard → Create Squad → Share recruitment link' },
      { type: 'step', label: '1', value: 'Create a Squad with a name and optional description' },
      { type: 'step', label: '2', value: 'Copy the unique recruitment link to share with athletes' },
      { type: 'step', label: '3', value: 'Athletes click the link to join — they can be in multiple squads' },
      { type: 'text', value: 'Squads are the foundation for assigning orders. Athletes in a squad receive the missions and campaigns you assign.' },
      { type: 'tip', value: 'Athletes choose whether to share their detailed stats with you' },
    ]
  },
  {
    id: 'handlers',
    title: 'HANDLER MODE',
    icon: Radio,
    color: 'text-warning',
    content: [
      { type: 'text', value: 'Handler Mode is for personal trainers and coaches who want to program for others.' },
      { type: 'highlight', value: 'Dashboard → HANDLER button (visible if you have the handler role)' },
      { type: 'step', label: '1', value: 'Create one or more Squads for your athletes' },
      { type: 'step', label: '2', value: 'Click ASSIGN ORDER to send missions or campaigns to a squad' },
      { type: 'step', label: '3', value: 'Set optional due dates for accountability' },
      { type: 'step', label: '4', value: 'Track completion from the Recent Orders feed' },
      { type: 'text', value: 'Orders appear in your athletes\' INCOMING ORDERS section on their dashboard.' },
      { type: 'stat', label: 'DELETE', value: 'Remove orders that are no longer relevant' },
      { type: 'stat', label: 'VIEW DETAILS', value: 'See the full mission or campaign you assigned' },
      { type: 'tip', value: 'You can assign entire campaigns — not just individual missions' },
    ]
  },
  {
    id: 'scoring',
    title: 'SCORING & XP',
    icon: Zap,
    color: 'text-accent',
    content: [
      { type: 'text', value: 'Every completed set earns you Score and XP based on your performance.' },
      { type: 'stat', label: 'BASE SCORE', value: 'Reps × Weight = Base points per set' },
      { type: 'stat', label: 'COMBO BONUS', value: 'Chain sets quickly for score multipliers' },
      { type: 'stat', label: 'XP', value: 'Score ÷ 10 = XP earned toward leveling up' },
      { type: 'tip', value: 'Heavier weight and higher reps mean bigger scores — push yourself!' },
    ]
  },
  {
    id: 'combos',
    title: 'COMBO SYSTEM',
    icon: Flame,
    color: 'text-secondary',
    content: [
      { type: 'text', value: 'Combos reward consistent, focused training. Keep moving to build your multiplier.' },
      { type: 'highlight', value: 'Complete sets within 90 seconds to maintain your combo' },
      { type: 'text', value: 'Each consecutive set adds +1 to your combo. Miss the window and it resets to 1x.' },
      { type: 'stat', label: '5x COMBO', value: '50% bonus score' },
      { type: 'stat', label: '10x COMBO', value: '100% bonus score (2x multiplier!)' },
      { type: 'tip', value: 'Your max combo is tracked on your profile — chase the high score!' },
    ]
  },
  {
    id: 'hiit',
    title: 'HIIT TIMER',
    icon: Timer,
    color: 'text-section-hiit',
    content: [
      { type: 'text', value: 'High-Intensity Interval Training with built-in work and rest phases.' },
      { type: 'step', label: '1', value: 'Choose a preset protocol or customize your own timing' },
      { type: 'step', label: '2', value: 'Perform any exercise during FIGHT phases' },
      { type: 'step', label: '3', value: 'Rest during RECOVER phases' },
      { type: 'step', label: '4', value: 'Survive all rounds to complete the session' },
      { type: 'stat', label: 'BLITZ', value: '30s work / 10s rest — fast and intense' },
      { type: 'stat', label: 'STANDARD', value: '40s work / 20s rest — balanced protocol' },
      { type: 'stat', label: 'ENDURANCE', value: '45s work / 15s rest — extended effort' },
      { type: 'tip', value: 'Screen stays awake automatically during HIIT sessions' },
    ]
  },
  {
    id: 'intel',
    title: 'INTEL & STATS',
    icon: Trophy,
    color: 'text-section-intel',
    content: [
      { type: 'text', value: 'Track your progress across multiple dimensions.' },
      { type: 'stat', label: 'WAR ROOM', value: 'Lifetime stats, milestones, achievements, and weight history' },
      { type: 'stat', label: 'INTEL CENTER', value: 'Campaign analytics, leaderboards, and the Front Lines activity feed' },
      { type: 'stat', label: 'WEEKLY DEBRIEF', value: 'Dashboard summary of missions, weight, PRs, and muscle groups trained' },
      { type: 'text', value: 'Personal Records (PRs) are tracked automatically and celebrated when you beat them.' },
      { type: 'tip', value: 'Check the Front Lines for a live feed of all agent activity across the platform' },
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
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <GlobalNav 
          title="FIELD MANUAL"
          subtitle="OPERATIONAL GUIDE"
        />

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
                <div className="space-y-3">
                  {section.content.map((item, i) => (
                    <div key={i} className="text-sm leading-relaxed">
                      {item.type === 'text' && (
                        <p className="text-muted-foreground">{item.value}</p>
                      )}
                      {item.type === 'highlight' && (
                        <p className="text-primary border-l-2 border-primary pl-3 font-medium">{item.value}</p>
                      )}
                      {item.type === 'step' && (
                        <div className="flex gap-3 text-foreground">
                          <span className="text-primary font-bold">{item.label}.</span>
                          <span>{item.value}</span>
                        </div>
                      )}
                      {item.type === 'stat' && (
                        <div className="flex gap-3 text-foreground border-l-2 border-muted pl-3">
                          <span className="text-muted-foreground shrink-0 font-medium">{item.label}:</span>
                          <span>{item.value}</span>
                        </div>
                      )}
                      {item.type === 'tip' && (
                        <p className="text-accent border-l-2 border-accent pl-3 italic">{item.value}</p>
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
          className="mt-12"
        >
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-display text-xl hover:box-glow-primary transition-all"
          >
            BEGIN TRAINING
          </button>
        </motion.div>

        {/* Footer */}
        <AppFooter />
      </div>
    </div>
  );
};

export default Guide;