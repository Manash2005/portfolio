/**
 * useScrollProgress — reads Lenis scroll progress and exposes it
 * via a plain ref (no React state = no re-renders every frame).
 *
 * Usage:
 *   const scrollRef = useScrollProgress()
 *   // inside useFrame: scrollRef.current → 0..1
 */
import { useEffect, useRef } from 'react'

export function useScrollProgress() {
  const progressRef = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      progressRef.current = total > 0 ? window.scrollY / total : 0
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // initial
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return progressRef
}
