import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

/**
 * 1.2s minimal loader. Shows initials "MS", fades out.
 * Skipped on repeat visits (sessionStorage).
 */
export default function Loader({ onComplete }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out'

  useEffect(() => {
    // Skip on repeat visits
    if (sessionStorage.getItem('portfolio_visited')) {
      onComplete()
      return
    }

    const t1 = setTimeout(() => setPhase('hold'), 400)
    const t2 = setTimeout(() => setPhase('out'), 900)
    const t3 = setTimeout(() => {
      sessionStorage.setItem('portfolio_visited', '1')
      onComplete()
    }, 1200)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <motion.div
      key="loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: '#08080C' }}
    >
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        animate={
          phase === 'out'
            ? { opacity: 0, y: -8 }
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '2rem',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: '#EDEDF2',
        }}
      >
        MS<span style={{ color: '#B8FF3C' }}>.</span>
      </motion.span>
    </motion.div>
  )
}
