import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { computeQuantiles, parseDateString } from '../../utils/activityStats'
import ActivityTooltip from './ActivityTooltip'

const ACCENT_COLOR = new THREE.Color(0xB8FF3C)
const ZERO_COLOR = new THREE.Color(0x161622)
const LEVEL_COLORS_3D = [
  new THREE.Color(0x161622), // Level 0 (flat tile)
  new THREE.Color(0x3E5E1C), // Level 1
  new THREE.Color(0x68AC25), // Level 2
  new THREE.Color(0x94E030), // Level 3
  new THREE.Color(0xB8FF3C), // Level 4 (electric lime)
]
const DIM_FACTOR = 0.15

// Temporary Three objects to avoid per-frame allocations
const dummyMatrix = new THREE.Matrix4()
const dummyPosition = new THREE.Vector3()
const dummyScale = new THREE.Vector3()
const dummyColor = new THREE.Color()

function SkylineScene({
  days,
  sourceKey,
  focusedMonth,
  isReplaying,
  onDayHover,
  onDoubleReset,
}) {
  const meshRef = useRef()
  const controlsRef = useRef()
  const { invalidate, gl } = useThree()

  const quantiles = useMemo(() => computeQuantiles(days, sourceKey), [days, sourceKey])

  // Track hover index via ref only (avoids React re-renders on every mouse pixel)
  const hoveredIdxRef = useRef(null)

  // Geometry: unit box with bottom pivot
  const boxGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.15, 1, 0.15)
    geo.translate(0, 0.5, 0)
    return geo
  }, [])

  // Instanced arrays for smooth morphing
  const instanceCount = days.length || 371
  const currentHeights = useRef(new Float32Array(instanceCount).fill(0.04))
  const targetHeights = useRef(new Float32Array(instanceCount).fill(0.04))
  const hasAppeared = useRef(false)
  const appearStart = useRef(null)
  const replayStart = useRef(null)

  // Calculate target heights and colors whenever sourceKey or days change
  useEffect(() => {
    if (meshRef.current) {
      if (!meshRef.current.instanceColor) {
        meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(
          new Float32Array(instanceCount * 3).fill(1),
          3
        )
      }
      if (meshRef.current.material) {
        meshRef.current.material.needsUpdate = true
      }
    }

    days.forEach((day, i) => {
      if (day.isFuture) {
        targetHeights.current[i] = 0.01
        return
      }
      const count = day[sourceKey] || 0
      targetHeights.current[i] = count > 0 ? quantiles.getNormalizedHeight(count) * 1.6 : 0.04
    })
    invalidate()
  }, [days, sourceKey, quantiles, instanceCount, invalidate])

  // Trigger replay
  useEffect(() => {
    if (isReplaying) {
      replayStart.current = performance.now()
      currentHeights.current.fill(0.04)
      invalidate()
    }
  }, [isReplaying, invalidate])

  // Initial scroll-in sweep
  useEffect(() => {
    appearStart.current = performance.now()
    invalidate()
  }, [invalidate])

  useFrame(() => {
    if (!meshRef.current) return
    let needsRedraw = false
    const now = performance.now()

    // Replay sweeping logic
    let replayProgress = 1
    if (isReplaying && replayStart.current) {
      const elapsed = (now - replayStart.current) / 3000 // 3 seconds
      replayProgress = Math.min(1, Math.max(0, elapsed))
      needsRedraw = true
    }

    // Scroll-in stagger (1.4s)
    let staggerProgress = 1
    if (appearStart.current && !hasAppeared.current) {
      const elapsed = (now - appearStart.current) / 1400
      staggerProgress = Math.min(1, Math.max(0, elapsed))
      if (staggerProgress >= 1) hasAppeared.current = true
      needsRedraw = true
    }

    const hIdx = hoveredIdxRef.current
    let hWeek = -1, hDay = -1
    if (hIdx !== null && hIdx >= 0 && hIdx < days.length) {
      hWeek = days[hIdx].weekIndex
      hDay = days[hIdx].dayOfWeek
    }

    // Animate and update each instance
    for (let i = 0; i < instanceCount; i++) {
      const day = days[i]
      if (!day) continue

      const week = day.weekIndex
      const dayOfWeek = day.dayOfWeek
      const posX = (week - 26) * 0.20
      const posZ = (dayOfWeek - 3) * 0.20

      // Replay filter: only reveal up to current progress
      const normalizedCol = week / 52
      let targetH = targetHeights.current[i]
      if (isReplaying && normalizedCol > replayProgress) {
        targetH = 0.04
      } else if (!hasAppeared.current && normalizedCol > staggerProgress) {
        targetH = 0.04
      }

      // Ripple calculation on hover
      let rippleLift = 0
      let rippleBoost = 0
      if (hIdx !== null) {
        const dCol = week - hWeek
        const dRow = dayOfWeek - hDay
        const dist = Math.sqrt(dCol * dCol + dRow * dRow)
        if (dist <= 2.2) {
          rippleLift = Math.max(0, (1 - dist / 2.5) * 0.4)
          rippleBoost = Math.max(0, 1 - dist / 2.5)
        }
      }

      // Spring-lerp height
      const desiredH = targetH + rippleLift
      const currentH = currentHeights.current[i]
      const nextH = THREE.MathUtils.lerp(currentH, desiredH, 0.14)
      currentHeights.current[i] = nextH

      if (Math.abs(currentH - desiredH) > 0.002) {
        needsRedraw = true
      }

      // Transform matrix
      dummyPosition.set(posX, 0, posZ)
      dummyScale.set(1, Math.max(0.04, nextH), 1)
      dummyMatrix.makeTranslation(dummyPosition.x, dummyPosition.y, dummyPosition.z)
      dummyMatrix.scale(dummyScale)
      meshRef.current.setMatrixAt(i, dummyMatrix)

      // Color mapping
      const count = day[sourceKey] || 0
      const level = quantiles.getLevel(count)

      if (day.isFuture || count === 0) {
        dummyColor.copy(ZERO_COLOR)
      } else {
        dummyColor.copy(LEVEL_COLORS_3D[level])
        if (rippleBoost > 0) {
          dummyColor.lerp(ACCENT_COLOR, rippleBoost * 0.5)
        }
      }

      // Hover glow: pure white for directly hovered bar
      if (hIdx === i) {
        dummyColor.set(0xFFFFFF)
      }

      // Month focus dimming
      if (focusedMonth !== null && focusedMonth !== undefined) {
        const d = parseDateString(day.date)
        if (d.getMonth() !== focusedMonth) {
          dummyColor.multiplyScalar(DIM_FACTOR)
        }
      }

      meshRef.current.setColorAt(i, dummyColor)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }

    // Slow idle sway when not hovering
    if (hIdx === null && controlsRef.current) {
      controlsRef.current.autoRotate = true
      controlsRef.current.autoRotateSpeed = 0.35
      needsRedraw = true
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false
    }

    if (needsRedraw) {
      invalidate()
    }
  })

  // Raycast hover
  const onPointerMove = useCallback(
    (e) => {
      e.stopPropagation()
      const intersects = e.intersections
      if (intersects && intersects.length > 0) {
        const instanceId = intersects[0].instanceId
        if (instanceId !== undefined && instanceId < days.length) {
          hoveredIdxRef.current = instanceId
          const rect = gl.domElement.getBoundingClientRect()
          onDayHover(days[instanceId], {
            x: rect.left + (e.point.x / 6 + 0.5) * rect.width,
            y: rect.top + (-e.point.y / 4 + 0.4) * rect.height,
          })
          invalidate()
          return
        }
      }
      hoveredIdxRef.current = null
      onDayHover(null)
      invalidate()
    },
    [days, gl, onDayHover, invalidate]
  )

  const onPointerLeave = useCallback(() => {
    hoveredIdxRef.current = null
    onDayHover(null)
    invalidate()
  }, [onDayHover, invalidate])

  // Reset view on double click
  const handleDoubleClick = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
      invalidate()
    }
    if (onDoubleReset) onDoubleReset()
  }

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 10, 7]} intensity={2.6} color="#FFFFFF" />
      <directionalLight position={[-5, 7, -4]} intensity={1.5} color="#A3B8FF" />
      <pointLight position={[0, -1, 5]} intensity={1.2} color="#B8FF3C" />

      {/* Orbit controls with clamped limits and damping */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        minAzimuthAngle={-Math.PI / 2}
        maxAzimuthAngle={Math.PI / 2}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.9}
        dampingFactor={0.06}
      />

      {/* Hairline grid base plane */}
      <gridHelper
        args={[12.5, 53, 0x2A2A38, 0x1A1A26]}
        position={[0, 0, 0]}
      />

      {/* 371 Instanced Mesh Bars */}
      <instancedMesh
        ref={meshRef}
        args={[boxGeo, null, instanceCount]}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onDoubleClick={handleDoubleClick}
      >
        <meshStandardMaterial
          roughness={0.22}
          metalness={0.12}
          emissive="#121C0A"
          transparent
          opacity={0.98}
        />
      </instancedMesh>
    </>
  )
}

export default function SkylineCanvas({
  days,
  sourceKey = 'all',
  focusedMonth,
  isReplaying,
  onResetMonthFocus,
}) {
  const [hoveredDay, setHoveredDay] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const handleDayHover = useCallback((day, pos) => {
    setHoveredDay(day)
    if (pos) setTooltipPos(pos)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] select-none rounded-2xl border border-hairline overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 100%, rgba(26, 26, 40, 0.4) 0%, rgba(8, 8, 12, 0.85) 80%)',
        touchAction: 'pan-y',
      }}
      aria-hidden="true"
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 4.5, 5.8], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'auto', background: 'transparent' }}
      >
        <SkylineScene
          days={days}
          sourceKey={sourceKey}
          focusedMonth={focusedMonth}
          isReplaying={isReplaying}
          onDayHover={handleDayHover}
          onDoubleReset={onResetMonthFocus}
        />
      </Canvas>

      {/* DOM Tooltip */}
      <ActivityTooltip
        day={hoveredDay}
        position={tooltipPos}
        visible={!!hoveredDay}
      />

      {/* Micro-instructions badge */}
      <div className="absolute bottom-3 left-4 text-[10px] font-mono text-muted/60 pointer-events-none flex items-center gap-3">
        <span>drag to orbit</span>
        <span>·</span>
        <span>hover for breakdown</span>
        <span>·</span>
        <span>double-click to reset</span>
      </div>
    </div>
  )
}
