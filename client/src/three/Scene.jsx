import { Canvas } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import AgentFace from './AgentFace'
import Lights from './Lights'

/**
 * Scene — persistent full-viewport Canvas, fixed behind page content.
 * Features the AI Robot Head with scroll-driven exploded assembly.
 */
export default function Scene() {
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const isLowPower = typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReduced) return null

  return (
    <div
      className="canvas-layer"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      <Canvas
        dpr={isMobile || isLowPower ? 1 : [1, 1.5]}
        camera={{ position: [0, 0, 4.8], fov: 48 }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Lights />
        <AgentFace mouseRef={mouseRef} />
      </Canvas>
    </div>
  )
}
