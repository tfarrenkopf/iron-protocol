import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  size: number;
  color: string;
  delay: number;
}

interface ExplosionEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

const COLORS = [
  'hsl(343, 100%, 59%)', // primary - hot pink
  'hsl(177, 100%, 50%)', // secondary - cyan
  'hsl(20, 100%, 60%)',  // accent - orange
  'hsl(45, 100%, 55%)',  // warning - yellow
  'hsl(120, 100%, 45%)', // success - green
];

export const ExplosionEffect = ({ trigger, onComplete }: ExplosionEffectProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Create particles
      const newParticles: Particle[] = [];
      const particleCount = 20;

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: 50,
          y: 50,
          angle: (360 / particleCount) * i + Math.random() * 20 - 10,
          velocity: 40 + Math.random() * 60,
          size: 4 + Math.random() * 8,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.1,
        });
      }

      setParticles(newParticles);
      setShowFlash(true);

      // Clear after animation
      const timer = setTimeout(() => {
        setParticles([]);
        setShowFlash(false);
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {showFlash && (
        <>
          {/* Screen flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-primary pointer-events-none z-50"
          />

          {/* Shockwave ring */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 border-primary pointer-events-none z-50"
          />

          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                left: '50%',
                top: '50%',
                scale: 1,
                opacity: 1,
              }}
              animate={{
                left: `calc(50% + ${Math.cos((particle.angle * Math.PI) / 180) * particle.velocity}vw)`,
                top: `calc(50% + ${Math.sin((particle.angle * Math.PI) / 180) * particle.velocity}vh)`,
                scale: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.6,
                delay: particle.delay,
                ease: 'easeOut',
              }}
              className="fixed pointer-events-none z-50"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
            />
          ))}

          {/* Pixel shards */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`shard-${i}`}
              initial={{
                left: '50%',
                top: '50%',
                rotate: 0,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                left: `calc(50% + ${(Math.random() - 0.5) * 80}vw)`,
                top: `calc(50% + ${(Math.random() - 0.5) * 80}vh)`,
                rotate: Math.random() * 720 - 360,
                scale: 0,
                opacity: 0,
              }}
              transition={{
                duration: 0.7,
                ease: 'easeOut',
              }}
              className="fixed w-4 h-4 bg-accent pointer-events-none z-50"
              style={{
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
};
