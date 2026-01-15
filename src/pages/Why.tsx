import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles, Swords, Coffee, Zap } from 'lucide-react';

const Why = () => {
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
            <h1 className="font-display text-3xl text-primary">THE IRON CREED</h1>
            <p className="text-xs text-muted-foreground tracking-wider">WHY WE FIGHT</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Main Philosophy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-primary/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Swords className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl text-primary">THE QUEST</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p className="text-lg text-foreground font-display">
                "In the realm of iron, every rep is a battle won."
              </p>
              <p>
                IRON PROTOCOL was forged in the fires of a simple truth: fitness should be 
                <span className="text-secondary"> fun</span>. Not a chore. Not a punishment. 
                A game you actually want to play.
              </p>
              <p>
                We believe that gamification isn't about tricking you into working out—it's 
                about tapping into the same reward systems that make games irresistible. 
                Leveling up. Completing quests. Climbing leaderboards. These are primal 
                motivators that have driven adventurers for generations.
              </p>
            </div>
          </motion.section>

          {/* The Fun Factor */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-secondary/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-secondary" />
              <h2 className="font-display text-xl text-secondary">THE FUN FACTOR</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Most fitness apps feel like spreadsheets wearing gym clothes. Cold. Clinical. 
                Boring. We wanted something different—something that made you feel like a 
                warrior entering the arena, not an accountant filing tax returns.
              </p>
              <p>
                The neon glow. The retro aesthetic. The dramatic lore. It's all intentional. 
                Because when you're having fun, you show up. And when you show up consistently, 
                <span className="text-accent"> that's when the real magic happens</span>.
              </p>
              <p>
                Whether you're a seasoned gym veteran or a newcomer to the iron path, 
                IRON PROTOCOL meets you where you are. Create your own missions. Track your 
                progress. Compete with friends. Or just vibe with the aesthetic while 
                getting stronger.
              </p>
            </div>
          </motion.section>

          {/* Positive Change */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-accent/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-accent" />
              <h2 className="font-display text-xl text-accent">DRIVING CHANGE</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Behind the pixels and the glitch effects, there's a serious mission: 
                <span className="text-foreground"> helping people build sustainable fitness habits</span>.
              </p>
              <p>
                The health benefits of regular strength training are well-documented: 
                increased muscle mass, stronger bones, better mental health, improved 
                metabolic function, and enhanced quality of life. But knowing this 
                isn't enough. You have to actually do the work.
              </p>
              <p>
                That's where the game comes in. By transforming workouts into quests 
                and PRs into boss battles, we're trying to lower the barrier between 
                "I should work out" and "I can't wait to work out."
              </p>
            </div>
          </motion.section>

          {/* Support Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/50 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl text-primary">SUPPORT THE CAUSE</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                IRON PROTOCOL is <span className="text-secondary font-display">FREE</span> and 
                will remain free. No paywalls. No premium tiers. No "unlock this feature 
                for $9.99." The full experience is available to everyone.
              </p>
              <p>
                However, running servers and maintaining the app takes resources. If you've 
                found value in IRON PROTOCOL and want to support its continued development, 
                donations are always appreciated—but never expected or required.
              </p>
              <p className="text-foreground">
                Think of it like tipping your dungeon master after a particularly epic campaign. 
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
                  BUY ME A POTION
                </a>
              </div>
            </div>
          </motion.section>

          {/* Closing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
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

export default Why;
