import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import AIChip from './AIChip'
import Lights from './Lights'
import { useChipScrollRig } from '../hooks/useChipScrollRig'

/**
 * CameraRig — lives inside the Canvas and moves the camera each frame
 * based on the rig values set by useChipScrollRig.
 */
function CameraRig({ rig }) {
  const { camera } = useThree()
  const smoothCam = useRef([2.2, 0.2, 4.8])

  useFrame(() => {
    const target = rig?.current?.camPos ?? [2.2, 0.2, 4.8]
    smoothCam.current[0] = THREE.MathUtils.lerp(smoothCam.current[0], target[0], 0.025)
    smoothCam.current[1] = THREE.MathUtils.lerp(smoothCam.current[1], target[1], 0.025)
    smoothCam.current[2] = THREE.MathUtils.lerp(smoothCam.current[2], target[2], 0.025)

    camera.position.set(...smoothCam.current)
    camera.lookAt(0, 0, 0)
  })

  return null
}

/**
 * Scene — persistent full-viewport Canvas, fixed behind page content.
 * Features the cinematic AI Processor Chip with scroll-driven camera.
 */
export default function Scene() {
  const mouseRef = useRef({ x: 0, y: 0 })

  // Track mouse in normalized device coordinates (-1..1)
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

  // Accessibility: prefers-reduced-motion fallback
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Scroll rig — drives camera and chip positions
  const rig = useChipScrollRig()

  if (prefersReduced) return null

  return (
    <div
      className="canvas-layer"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      <Canvas
        dpr={isMobile || isLowPower ? 1 : [1, 1.5]}
        camera={{ position: [2.2, 0.2, 4.8], fov: 48 }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        {/* Drives camera each frame from the rig ref */}
        <CameraRig rig={rig} />

        <Lights />
        <AIChip mouseRef={mouseRef} rig={rig} />
      </Canvas>
    </div>
  )
}
