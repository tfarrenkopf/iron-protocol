import { motion, AnimatePresence } from 'framer-motion';
import { memo, useEffect, useState } from 'react';

interface Particle {
  id: number;
  angle: number;
  velocity: number;
  size: number;
  color: string;
  delay: number;
}

interface Shard {
  id: number;
  dx: number;
  dy: number;
  rotate: number;
}

interface ExplosionEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

// Keep existing palette (used via inline styles in this effect)
const COLORS = [
  'hsl(343, 100%, 59%)', // primary - hot pink
  'hsl(177, 100%, 50%)', // secondary - cyan
  'hsl(20, 100%, 60%)',  // accent - orange
  'hsl(45, 100%, 55%)',  // warning - yellow
  'hsl(120, 100%, 45%)', // success - green
];

/**
 * Performance notes:
 * - Use transform-based motion (x/y) instead of animating left/top strings (avoids layout thrash).
 * - Precompute random shard directions once per trigger (stable during the animation).
 * - Keep DOM count modest to stay responsive when users spam "Complete set".
 */
export const ExplosionEffect = memo(({ trigger, onComplete }: ExplosionEffectProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shards, setShards] = useState<Shard[]>([]);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    const particleCount = 12;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        angle: (360 / particleCount) * i + Math.random() * 16 - 8,
        velocity: 18 + Math.random() * 28,
        size: 4 + Math.random() * 7,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.08,
      });
    }

    const shardCount = 6;
    const newShards: Shard[] = Array.from({ length: shardCount }, (_, i) => ({
      id: i,
      dx: (Math.random() - 0.5) * 70,
      dy: (Math.random() - 0.5) * 70,
      rotate: Math.random() * 720 - 360,
    }));

    setParticles(newParticles);
    setShards(newShards);
    setShowFlash(true);

    const timer = window.setTimeout(() => {
      setShowFlash(false);
      setParticles([]);
      setShards([]);
      onComplete?.();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {showFlash && (
        <motion.div
          key="explosion"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 pointer-events-none z-50"
        >
          {/* Screen flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.65, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="absolute inset-0 bg-primary"
          />

          {/* Shockwave ring */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 border-primary"
          />

          {/* Particles (transform-based) */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: `${Math.cos((particle.angle * Math.PI) / 180) * particle.velocity}vw`,
                y: `${Math.sin((particle.angle * Math.PI) / 180) * particle.velocity}vh`,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.55, delay: particle.delay, ease: 'easeOut' }}
              className="absolute left-1/2 top-1/2"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
              }}
            />
          ))}

          {/* Pixel shards (stable per trigger) */}
          {shards.map((shard) => (
            <motion.div
              key={`shard-${shard.id}`}
              initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              animate={{
                x: `${shard.dx}vw`,
                y: `${shard.dy}vh`,
                rotate: shard.rotate,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="absolute left-1/2 top-1/2 w-4 h-4 bg-accent"
              style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ExplosionEffect.displayName = 'ExplosionEffect';
