import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Scroll, Eye, Cookie } from 'lucide-react';

const Legal = () => {
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
            <h1 className="font-display text-3xl text-primary">THE SACRED SCROLLS</h1>
            <p className="text-xs text-muted-foreground tracking-wider">LEGAL COVENANT & PRIVACY DOCTRINE</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Disclaimer */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-destructive/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-destructive" />
              <h2 className="font-display text-xl text-destructive">WAIVER OF LIABILITY</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">HEAR YE, WARRIOR:</strong> By entering the IRON PROTOCOL, 
                you acknowledge that physical training carries inherent risks. Like any dungeon crawl, 
                the path to glory is paved with potential peril.
              </p>
              <p>
                The creators of IRON PROTOCOL are NOT responsible for any injuries, ailments, 
                or mishaps that may occur during your training sessions. You train at your own risk, 
                and you should consult with a qualified health professional before beginning any 
                exercise program—especially if you have pre-existing conditions or haven't rolled 
                a natural 20 on your Constitution save in a while.
              </p>
              <p>
                This application provides workout suggestions only. It is not medical advice. 
                We are not doctors, healers, clerics, or certified personal trainers—we are 
                merely chroniclers of the iron path.
              </p>
              <p className="text-warning font-display">
                ⚔️ TRAIN SMART. TRAIN SAFE. KNOW YOUR LIMITS. ⚔️
              </p>
            </div>
          </motion.section>

          {/* Privacy Policy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-secondary/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-secondary" />
              <h2 className="font-display text-xl text-secondary">PRIVACY DOCTRINE</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">WHAT WE COLLECT:</strong> We gather only what 
                is necessary for your training journey—your email (for authentication), your display 
                name (for the leaderboards), and your workout data (to track your legendary progress).
              </p>
              <p>
                <strong className="text-foreground">HOW WE USE IT:</strong> Your data powers your 
                personal stats, enables competition on the global leaderboard, and appears in the 
                public feed when you complete missions. Your display name and workout achievements 
                are visible to other warriors on the front lines.
              </p>
              <p>
                <strong className="text-foreground">WHAT WE DON'T DO:</strong> We do not sell your 
                data to dragons, dark wizards, or third-party advertisers. Your training secrets 
                remain within these digital walls.
              </p>
              <p>
                <strong className="text-foreground">DATA DELETION:</strong> You may invoke the 
                SCORCHED EARTH PROTOCOL at any time to purge your workout history. Account deletion 
                removes all associated data from our realm.
              </p>
            </div>
          </motion.section>

          {/* Cookies */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-accent/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="w-6 h-6 text-accent" />
              <h2 className="font-display text-xl text-accent">COOKIES & LOCAL STORAGE</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                This application uses essential cookies and local storage to maintain your 
                authentication session and preferences. These are not the chocolate chip variety—
                they are small data scrolls that help the application remember who you are.
              </p>
              <p>
                <strong className="text-foreground">ESSENTIAL COOKIES:</strong> Required for 
                login functionality and session management. Without them, you'd have to re-enter 
                the tavern every time you visit.
              </p>
              <p>
                <strong className="text-foreground">ANALYTICS:</strong> We use Google Analytics to 
                understand how warriors use the battlefield. This helps us improve training programs 
                and identify bugs. We track page views, feature usage, and workout completions - 
                never personal details beyond your anonymous user ID. You can opt-out via browser 
                extensions or by disabling JavaScript.
              </p>
              <p>
                <strong className="text-foreground">NO ADVERTISING COOKIES:</strong> We do not use 
                advertising or remarketing cookies. Your training data is not sold to third parties.
              </p>
            </div>
          </motion.section>

          {/* Terms */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-primary/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Scroll className="w-6 h-6 text-primary" />
              <h2 className="font-display text-xl text-primary">TERMS OF SERVICE</h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                By using IRON PROTOCOL, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Use the application for its intended purpose: getting stronger</li>
                <li>Not abuse the platform or attempt to exploit its systems</li>
                <li>Respect other warriors on the leaderboard</li>
                <li>Accept that the service is provided "as is" with no guarantees</li>
                <li>Understand that we may modify or discontinue the service at any time</li>
              </ul>
              <p className="text-xs text-muted-foreground/70 mt-6">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Legal;
