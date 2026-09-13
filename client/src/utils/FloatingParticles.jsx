/**
 * @deprecated Use NoiseBg instead for performance. 
 * This component renders 30 animated DOM nodes and is expensive.
 * Kept only for backward compatibility with UnderConstruction.jsx.
 */
import { motion } from 'motion/react'
import { useMemo } from 'react'

export default function FloatingParticles() {
  // Memoize positions so they don't re-randomize on every render
  const particles = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 3 + Math.random() * 5,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute h-1.5 w-1.5 rounded-full bg-foreground/30"
          style={{ left: p.left, top: p.top }}
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.6, 0.15] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}