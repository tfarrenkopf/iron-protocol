import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles, Shield, Coffee, Users, Zap, Lock, FlaskConical } from 'lucide-react';

const Donate = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-primary">SUPPORT THE PROTOCOL</h1>
            <p className="text-xs text-muted-foreground tracking-wider">FUEL THE MISSION</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Donation Section - TOP */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/50 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl text-primary">BUY ME A POTION</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                IRON PROTOCOL is <span className="text-secondary font-display">FREE TO USE</span> and 
                we intend to keep it that way. No paywalls hiding features. No premium tiers. 
                The full experience is available to everyone.
              </p>
              <p>
                That said, running servers and maintaining the app takes resources. If you've 
                found value in IRON PROTOCOL and want to support its continued development, 
                donations are always appreciated—but never expected.
              </p>
              <p className="text-foreground">
                Think of it like tipping your dungeon master after an epic campaign. 
                Totally optional, but it keeps the torches lit and the dice rolling.
              </p>
              <div className="pt-4">
                <a
                  href="https://ko-fi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display rounded hover:box-glow-primary transition-all"
                >
                  <Coffee className="w-5 h-5" />
                  DONATE ON KO-FI
                </a>
              </div>
            </div>
          </motion.section>

          {/* Early Alpha Banner */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-warning/10 border border-warning/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FlaskConical className="w-6 h-6 text-warning" />
              <h2 className="font-display text-xl text-warning">EARLY ALPHA</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                You're using an <span className="text-warning font-display">EARLY ALPHA</span> build 
                of IRON PROTOCOL. Things may break, features will change, and your feedback 
                is incredibly valuable in shaping what this becomes.
              </p>
              <p>
                We're building in public and iterating fast. If you encounter bugs or have 
                ideas, we want to hear them. You're not just a user—you're a founding member 
                of this community.
              </p>
            </div>
          </motion.section>

          {/* The Mission */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-secondary/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-secondary" />
              <h2 className="font-display text-xl text-secondary">THE MISSION</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p className="text-lg text-foreground font-display">
                "Fast. Social. Not invasive."
              </p>
              <p>
                IRON PROTOCOL was built with a simple philosophy: fitness tracking should be 
                <span className="text-secondary"> quick to use</span>, 
                <span className="text-accent"> fun to share</span>, and 
                <span className="text-primary"> respectful of your privacy</span>.
              </p>
              <p>
                Log your sets in seconds, not minutes. Share your wins with your squad. 
                But we're not here to spam your notifications, mine your data, or turn 
                your workouts into a social media performance.
              </p>
              <p>
                The gamification isn't about tricking you—it's about tapping into the same 
                reward systems that make games irresistible. Leveling up. Completing quests. 
                Climbing leaderboards. <span className="text-foreground">Making the grind feel like play.</span>
              </p>
            </div>
          </motion.section>

          {/* Privacy & Data */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-accent/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-accent" />
              <h2 className="font-display text-xl text-accent">MINIMAL DATA</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                We collect <span className="text-accent font-display">only what's necessary</span> to 
                make the app work. Your workout data, your profile, your progress.
              </p>
              <p>
                No tracking pixels following you around the web. No selling your gym habits 
                to advertisers. No "anonymous" data that isn't really anonymous. 
                Your iron is your business.
              </p>
              <p className="text-foreground">
                You control your visibility. Share your stats with your squad, or keep 
                everything private. The choice is always yours.
              </p>
            </div>
          </motion.section>

          {/* For Everyone */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-primary/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl text-primary">FOR EVERYONE</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                IRON PROTOCOL works for <span className="text-primary font-display">individuals</span> who 
                want a fun way to track their own workouts and level up their fitness journey.
              </p>
              <p>
                It also supports <span className="text-secondary font-display">trainers and coaches</span> who 
                want to create custom workout missions and share them with clients or classes 
                via a simple invite link. No complex setup. No app downloads required. 
                Just create, share, and let your athletes crush it.
              </p>
              <p className="text-foreground">
                Whether you're a solo warrior or leading a squad, the Protocol adapts to you.
              </p>
            </div>
          </motion.section>

          {/* Philosophy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
              <h2 className="font-display text-xl text-foreground">THE FUN FACTOR</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Most fitness apps feel like spreadsheets wearing gym clothes. Cold. Clinical. 
                Boring. We wanted something different—something that made you feel like a 
                warrior entering the arena.
              </p>
              <p>
                The neon glow. The retro aesthetic. The dramatic lore. It's all intentional. 
                Because when you're having fun, you show up. And when you show up consistently, 
                <span className="text-accent"> that's when the real gains happen</span>.
              </p>
            </div>
          </motion.section>

          {/* Closing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-8"
          >
            <p className="font-display text-2xl text-primary text-glow-primary mb-2">
              NOW GO LIFT SOMETHING HEAVY.
            </p>
            <p className="text-xs text-muted-foreground tracking-widest">
              // NO MERCY
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Donate;
