import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Target, Dumbbell, Timer, TrendingUp, Trophy, User, LogOut, Plus, Swords, ChevronRight, Users } from 'lucide-react';
import { useMissions } from '@/hooks/useMissions';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useIsHandler } from '@/hooks/useHandlerMode';
import { IncomingOrders } from '@/components/IncomingOrders';
import { FirstVisitPopup } from '@/components/FirstVisitPopup';
import { WeeklySummary } from '@/components/WeeklySummary';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAnonymous, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: missions } = useMissions({ showOnlyPublic: true });
  const { data: isHandler } = useIsHandler();
  
  // Calculate level from XP
  const xp = profile?.total_xp || 0;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Guest Mode Banner - Top Position */}
        {isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm text-warning font-display">⚠️ GUEST MODE ACTIVE</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your progress won't be saved. Create an account to track your gains and appear on the leaderboard.
              </p>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="flex-shrink-0 px-4 py-2 bg-primary text-primary-foreground font-display text-sm rounded hover:box-glow-primary transition-all"
            >
              SIGN IN
            </button>
          </motion.div>
        )}

        {/* Auth Status Bar */}
        {!isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded hover:border-primary transition-colors"
              >
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-display text-primary">
                  {profile?.display_name || 'AGENT'}
                </span>
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 border border-border rounded hover:border-destructive hover:text-destructive transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => navigate('/exercises')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              EDIT ARSENAL
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-6xl md:text-8xl text-primary text-glow-primary tracking-wider mb-2">
            IRON PROTOCOL
          </h1>
          <p className="font-body text-muted-foreground text-sm tracking-widest uppercase">
            Clear Levels • Defeat Enemies • Get Stronger
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2 max-w-md mx-auto">
            Choose a mission below to start your workout. Complete sets to earn XP and climb the ranks.
          </p>
        </motion.header>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-10"
        >
          {[
            { label: 'SETS', value: (profile?.total_sets || 0).toString(), icon: Zap, color: 'text-accent' },
            { label: 'XP', value: (profile?.total_xp || 0).toLocaleString(), icon: TrendingUp, color: 'text-secondary' },
            { label: 'LEVEL', value: level.toString(), icon: Target, color: 'text-primary' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-card border border-border rounded p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate('/stats')}
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <div className={`font-display text-3xl ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`grid gap-4 mb-10 ${isHandler ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}
        >
          <button 
            onClick={() => navigate('/missions')}
            className="group relative bg-card border-2 border-primary rounded p-6 text-left transition-all hover:box-glow-primary hover:border-primary"
          >
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors rounded" />
            <Dumbbell className="w-8 h-8 text-primary mb-3 relative z-10" />
            <h2 className="font-display text-lg sm:text-xl text-primary relative z-10">MISSIONS</h2>
            <p className="text-xs text-muted-foreground mt-1 relative z-10">Strength</p>
          </button>
          
          <button 
            onClick={() => navigate('/hiit')}
            className="group relative bg-card border-2 border-secondary rounded p-6 text-left transition-all hover:box-glow-secondary hover:border-secondary"
          >
            <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors rounded" />
            <Timer className="w-8 h-8 text-secondary mb-3 relative z-10" />
            <h2 className="font-display text-lg sm:text-xl text-secondary relative z-10">HIIT</h2>
            <p className="text-xs text-muted-foreground mt-1 relative z-10">Timer</p>
          </button>
          
          <button 
            onClick={() => navigate('/stats')}
            className="group relative bg-card border-2 border-accent rounded p-6 text-left transition-all hover:border-accent"
            style={{ boxShadow: 'none' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 20px hsl(20 100% 60% / 0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors rounded" />
            <Trophy className="w-8 h-8 text-accent mb-3 relative z-10" />
            <h2 className="font-display text-lg sm:text-xl text-accent relative z-10">STATS</h2>
            <p className="text-xs text-muted-foreground mt-1 relative z-10">Rankings</p>
          </button>

          {isHandler && (
            <button 
              onClick={() => navigate('/handler')}
              className="group relative bg-card border-2 border-warning rounded p-6 text-left transition-all hover:border-warning"
              style={{ boxShadow: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 20px hsl(var(--warning) / 0.6)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div className="absolute inset-0 bg-warning/5 group-hover:bg-warning/10 transition-colors rounded" />
              <Users className="w-8 h-8 text-warning mb-3 relative z-10" />
              <h2 className="font-display text-lg sm:text-xl text-warning relative z-10">HANDLER</h2>
              <p className="text-xs text-muted-foreground mt-1 relative z-10">Squads</p>
            </button>
          )}
        </motion.div>

        {/* Weekly Summary - Only show when logged in */}
        {!isAnonymous && <WeeklySummary />}

        {/* Incoming Orders - Only show when logged in */}
        {!isAnonymous && <IncomingOrders />}

        {/* Front Lines CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={() => navigate('/front-lines')}
          className="w-full mb-8 p-4 bg-card border border-secondary/50 rounded flex items-center justify-between hover:border-secondary hover:box-glow-secondary transition-all"
        >
          <div className="flex items-center gap-3">
            <Swords className="w-6 h-6 text-secondary" />
            <div className="text-left">
              <div className="font-display text-lg text-secondary">THE FRONT LINES</div>
              <div className="text-xs text-muted-foreground">Live combat feed from all warriors</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-secondary" />
        </motion.button>

        {/* Recent Missions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl text-muted-foreground tracking-wider">
              // SELECT MISSION
            </h3>
            <button
              onClick={() => navigate('/missions')}
              className="flex items-center gap-1 text-sm font-display text-primary hover:text-glow-primary transition-all"
            >
              FULL ARSENAL
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {missions?.slice(0, 3).map((mission, i) => (
              <motion.button
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => navigate(`/mission/${mission.id}`)}
                className="w-full group bg-card border border-border rounded p-4 text-left hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-lg text-primary group-hover:text-glow-primary transition-all">
                      {mission.code_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {mission.focus_areas?.join(' • ')} • {mission.estimated_minutes}min
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <div 
                        key={j}
                        className={`w-2 h-2 rounded-sm ${j < mission.difficulty ? 'bg-accent' : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>


        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-4 text-xs">
            <button
              onClick={() => navigate('/guide')}
              className="text-muted-foreground hover:text-secondary transition-colors"
            >
              ? Guide
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => navigate('/donate')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              ♥ Support
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={() => navigate('/legal')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Legal
            </button>
          </div>
          <p className="text-xs text-muted-foreground/50 tracking-widest">
            v1.0 // NO MERCY
          </p>
        </motion.footer>

        {/* First Visit Popup */}
        <FirstVisitPopup />
      </div>
    </div>
  );
};

export default Dashboard;
