import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Target, Dumbbell, Timer, TrendingUp } from 'lucide-react';
import { defaultMissions } from '@/data/missions';

const Dashboard = () => {
  const navigate = useNavigate();

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
        </motion.header>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-10"
        >
          {[
            { label: 'STREAK', value: '7', icon: Zap, color: 'text-accent' },
            { label: 'XP', value: '12,450', icon: TrendingUp, color: 'text-secondary' },
            { label: 'LEVEL', value: '14', icon: Target, color: 'text-primary' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-card border border-border rounded p-4 text-center"
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
          className="grid grid-cols-2 gap-4 mb-10"
        >
          <button 
            onClick={() => navigate('/missions')}
            className="group relative bg-card border-2 border-primary rounded p-6 text-left transition-all hover:box-glow-primary hover:border-primary"
          >
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors rounded" />
            <Dumbbell className="w-8 h-8 text-primary mb-3 relative z-10" />
            <h2 className="font-display text-2xl text-primary relative z-10">MISSIONS</h2>
            <p className="text-xs text-muted-foreground mt-1 relative z-10">Strength Training</p>
          </button>
          
          <button 
            onClick={() => navigate('/hiit')}
            className="group relative bg-card border-2 border-secondary rounded p-6 text-left transition-all hover:box-glow-secondary hover:border-secondary"
          >
            <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors rounded" />
            <Timer className="w-8 h-8 text-secondary mb-3 relative z-10" />
            <h2 className="font-display text-2xl text-secondary relative z-10">HIIT</h2>
            <p className="text-xs text-muted-foreground mt-1 relative z-10">Interval Timer</p>
          </button>
        </motion.div>

        {/* Recent Missions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-display text-xl text-muted-foreground mb-4 tracking-wider">
            // SELECT MISSION
          </h3>
          
          <div className="space-y-3">
            {defaultMissions.slice(0, 3).map((mission, i) => (
              <motion.button
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => navigate(`/workout/${mission.id}`)}
                className="w-full group bg-card border border-border rounded p-4 text-left hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-lg text-primary group-hover:text-glow-primary transition-all">
                      {mission.codeName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {mission.focusAreas.join(' • ')} • {mission.estimatedMinutes}min
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
          className="mt-12 text-center"
        >
          <p className="text-xs text-muted-foreground/50 tracking-widest">
            v1.0 // NO MERCY
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Dashboard;
