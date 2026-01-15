import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { defaultMissions } from '@/data/missions';

const MissionSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button 
            onClick={() => navigate('/')}
            className="p-2 border border-border rounded hover:border-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-primary">SELECT MISSION</h1>
            <p className="text-xs text-muted-foreground tracking-wider">CHOOSE YOUR BATTLE</p>
          </div>
        </motion.header>

        {/* Mission List */}
        <div className="space-y-4">
          {defaultMissions.map((mission, i) => (
            <motion.button
              key={mission.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/workout/${mission.id}`)}
              className="w-full group bg-card border border-border rounded-lg p-5 text-left hover:border-primary transition-all relative overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-display text-2xl text-primary group-hover:text-glow-primary transition-all">
                      {mission.codeName}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    <Zap className="w-3 h-3 text-accent" />
                    <span className="text-xs font-display text-accent">{mission.difficulty}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {mission.focusAreas.slice(0, 3).map((area) => (
                      <span 
                        key={area}
                        className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {mission.exercises.length} exercises • {mission.estimatedMinutes}min
                  </div>
                </div>

                {/* Difficulty bar */}
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, j) => (
                    <div 
                      key={j}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        j < mission.difficulty 
                          ? 'bg-gradient-to-r from-accent to-primary' 
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MissionSelect;
