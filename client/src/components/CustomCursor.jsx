import { useEffect, useRef } from 'react'

/**
 * CustomCursor — no spring physics, moves 1:1 with the mouse via CSS transforms.
 * Uses refs + direct DOM manipulation instead of React state to avoid re-render
 * lag that makes the cursor feel slow.
 */
export default function CustomCursor() {
  const dotRef = useRef(null)
  const glowRef = useRef(null)
  const isHoveringRef = useRef(false)

  useEffect(() => {
    const dot = dotRef.current
    const glow = glowRef.current
    if (!dot || !glow) return

    const onMove = (e) => {
      const x = e.clientX
      const y = e.clientY
      dot.style.transform = `translate(${x - 8}px, ${y - 8}px) scale(${isHoveringRef.current ? 2 : 1})`
      glow.style.transform = `translate(${x - 64}px, ${y - 64}px) scale(${isHoveringRef.current ? 1.5 : 1})`
    }

    const onOver = (e) => {
      const isLink =
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.closest('button') ||
        e.target.closest('a')
      isHoveringRef.current = !!isLink
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
    }
  }, [])

  return (
    <>
      {/* Small dot — tracks 1:1 with cursor */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-4 h-4 bg-primary/50 rounded-full pointer-events-none z-[9999] mix-blend-screen"
        style={{ willChange: 'transform', transition: 'scale 0.15s ease' }}
      />
      {/* Soft glow blob */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 w-32 h-32 bg-primary/10 rounded-full pointer-events-none z-[9998] blur-xl"
        style={{ willChange: 'transform', transition: 'scale 0.2s ease' }}
      />
    </>
  )
}
