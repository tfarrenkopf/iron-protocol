import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KillFeedItem {
  id: string;
  message: string;
  type: 'round' | 'phase' | 'bonus';
}

interface KillFeedProps {
  items: KillFeedItem[];
  onItemComplete?: (id: string) => void;
}

export const KillFeed = ({ items, onItemComplete }: KillFeedProps) => {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-[200px]">
      <AnimatePresence>
        {items.map((item) => (
          <KillFeedEntry 
            key={item.id} 
            item={item} 
            onComplete={() => onItemComplete?.(item.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const KillFeedEntry = ({ item, onComplete }: { item: KillFeedItem; onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const getColorClass = () => {
    switch (item.type) {
      case 'round': return 'text-secondary border-secondary/50 bg-secondary/10';
      case 'phase': return 'text-primary border-primary/50 bg-primary/10';
      case 'bonus': return 'text-accent border-accent/50 bg-accent/10';
      default: return 'text-foreground border-border bg-card';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className={`px-3 py-2 border rounded-lg backdrop-blur-sm font-display text-sm ${getColorClass()}`}
    >
      {item.message}
    </motion.div>
  );
};