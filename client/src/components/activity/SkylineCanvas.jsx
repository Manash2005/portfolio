import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { computeQuantiles, parseDateString, getEventColor } from '../../utils/activityStats'
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

/**
 * Calculates responsive stem height and horizontal offset for event callouts.
 * If points are towards the ends (recent/right or old/left), this offsets the label
 * inwards towards the center so callouts are never clipped and remain centered in view.
 */
function getEventLayout(weekIndex, eventIdx) {
  // Center is week 26 (out of 53 weeks, 0..52)
  const diff = weekIndex - 26

  // Stagger height across events so multiple callouts don't overlap vertically
  const stemHeight = 60 + (eventIdx % 3) * 45

  let badgeOffsetX = 0
  if (diff > 4) {
    // Recent events (right side): pull inwards to the left towards center
    const factor = Math.min(1, (diff - 4) / 22)
    const basePull = 80 + factor * 60 // 80px to 140px pull
    const stagger = (eventIdx % 2) * 45 // Stagger horizontal position for events on same/near date
    badgeOffsetX = -Math.round(basePull + stagger)
  } else if (diff < -4) {
    // Older events (left side): pull inwards to the right towards center
    const factor = Math.min(1, (-diff - 4) / 22)
    const basePull = 80 + factor * 60 // 80px to 140px pull
    const stagger = (eventIdx % 2) * 45
    badgeOffsetX = Math.round(basePull + stagger)
  } else {
    // Near center (weeks 22..30): slight stagger if multiple events
    badgeOffsetX = eventIdx > 0 ? ((eventIdx % 2 === 1 ? -1 : 1) * 35) : 0
  }

  return { stemHeight, badgeOffsetX }
}

/**
 * Generates an elbowed connector path with rounded 90-degree corners.
 * Drops vertically from badge, bends horizontally towards the target date column,
 * then bends vertically down to touch the dot on top of the building.
 */
function generateElbowPath(startX, startY, endX, endY) {
  const dx = endX - startX
  const dy = endY - startY

  if (Math.abs(dx) < 6) {
    return `M ${endX} ${startY} L ${endX} ${endY}`
  }

  const dropFirst = 14
  const elbowY = startY + dropFirst
  const radius = Math.min(8, Math.abs(dx) / 2, Math.abs(dy - dropFirst) / 2)
  const dirX = dx > 0 ? 1 : -1

  return [
    `M ${startX} ${startY}`,
    `L ${startX} ${elbowY - radius}`,
    `Q ${startX} ${elbowY} ${startX + dirX * radius} ${elbowY}`,
    `L ${endX - dirX * radius} ${elbowY}`,
    `Q ${endX} ${elbowY} ${endX} ${elbowY + radius}`,
    `L ${endX} ${endY}`,
  ].join(' ')
}

function SkylineEventCallout({
  event,
  dayIndex,
  days,
  currentHeightsRef,
  focusedMonth,
  eventIdx = 0,
}) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const day = days[dayIndex]

  useFrame(() => {
    if (!groupRef.current) return
    const h = currentHeightsRef.current?.[dayIndex] || 0.04
    groupRef.current.position.y = Math.max(0.04, h)
  })

  if (!day) return null
  const posX = (day.weekIndex - 26) * 0.20
  const posZ = (day.dayOfWeek - 3) * 0.20

  const isDimmed =
    focusedMonth !== null &&
    focusedMonth !== undefined &&
    parseDateString(day.date).getMonth() !== focusedMonth

  const { stemHeight, badgeOffsetX } = getEventLayout(day.weekIndex, eventIdx)
  const eventColor = getEventColor(event)
  const elbowPath = generateElbowPath(badgeOffsetX, -stemHeight, 0, -3)

  return (
    <group ref={groupRef} position={[posX, 0.04, posZ]}>
      <Html
        position={[0, 0, 0]}
        center={false}
        zIndexRange={[100, 0]}
        style={{
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
          opacity: isDimmed ? 0.2 : 1,
        }}
      >
        <div className="relative select-none" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.65))' }}>
          {/* Small title badge positioned at (badgeOffsetX, -stemHeight) */}
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="absolute cursor-pointer pointer-events-auto transition-all duration-200"
            style={{
              left: `${badgeOffsetX}px`,
              top: `${-stemHeight}px`,
              transform: 'translate(-50%, -100%)',
              marginBottom: '-1px',
            }}
          >
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono whitespace-nowrap shadow-xl transition-all duration-200 ${
                hovered ? 'scale-105' : ''
              }`}
              style={{
                backgroundColor: hovered ? '#121218' : 'rgba(14, 14, 20, 0.95)',
                borderColor: hovered ? eventColor : `${eventColor}70`,
                color: hovered ? eventColor : '#FFFFFF',
                boxShadow: hovered ? `0 0 14px ${eventColor}55` : '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: eventColor,
                  boxShadow: `0 0 6px ${eventColor}`,
                }}
              />
              <span className="font-semibold tracking-tight">{event.title}</span>
            </div>

            {/* Hover details popover */}
            {hovered && (event.description || day.date) && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-lg border border-hairline bg-[#0E0E14]/98 backdrop-blur-xl text-left pointer-events-none z-50 shadow-2xl"
                style={{
                  boxShadow: `0 10px 28px rgba(0,0,0,0.85), 0 0 0 1px ${eventColor}40`,
                }}
              >
                <div
                  className="text-[10px] font-mono mb-1 font-semibold flex items-center justify-between"
                  style={{ color: eventColor }}
                >
                  <span>{event.title}</span>
                  <span className="text-muted/80">{day.date}</span>
                </div>
                {event.description && (
                  <p className="text-[11px] font-sans text-muted leading-relaxed">
                    {event.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Elbowed connector SVG with dot at (0, -3) */}
          <svg
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
          >
            {/* The elbowed leader line */}
            <path
              d={elbowPath}
              fill="none"
              stroke={eventColor}
              strokeWidth="1.5"
              strokeOpacity="0.85"
              strokeLinecap="round"
            />

            {/* Single dot at the end touching the building */}
            <circle cx="0" cy="-3" r="3" fill={eventColor} />
            <circle cx="0" cy="-3" r="6" stroke={eventColor} strokeWidth="1" strokeOpacity="0.35" />
          </svg>
        </div>
      </Html>
    </group>
  )
}

function SkylineScene({
  days,
  sourceKey,
  focusedMonth,
  isReplaying,
  onDayHover,
  onDoubleReset,
  events = [],
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

    const maxVal = quantiles.maxVal || 1
    // Strictly linear unit height: count * unitHeight ensures value 6 is exactly 2x value 3 and 6x value 1
    const unitHeight = Math.max(0.06, Math.min(0.2, 1.8 / maxVal))

    days.forEach((day, i) => {
      if (day.isFuture) {
        targetHeights.current[i] = 0.01
        return
      }
      const count = day[sourceKey] || 0
      targetHeights.current[i] = count > 0 ? count * unitHeight : 0.04
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

  // Invalidate canvas whenever events prop updates so badges and lines draw immediately
  useEffect(() => {
    invalidate()
  }, [events, invalidate])

  const eventItems = useMemo(() => {
    if (!events || events.length === 0 || !days || days.length === 0) return []
    return events
      .map((evt, idx) => {
        const rawDate = evt?.date || evt?.start_at || ''
        const dateStr = rawDate.slice(0, 10).trim()
        const dayIdx = days.findIndex((d) => d.date === dateStr)
        if (dayIdx === -1) return null
        return { event: evt, dayIndex: dayIdx, key: `${dateStr}-${idx}`, eventIdx: idx }
      })
      .filter(Boolean)
  }, [events, days])

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

      {/* Important event callouts pointing from buildings */}
      {eventItems.map((item) => (
        <SkylineEventCallout
          key={item.key}
          event={item.event}
          dayIndex={item.dayIndex}
          days={days}
          currentHeightsRef={currentHeights}
          focusedMonth={focusedMonth}
          eventIdx={item.eventIdx}
        />
      ))}
    </>
  )
}

export default function SkylineCanvas({
  days,
  sourceKey = 'all',
  focusedMonth,
  isReplaying,
  onResetMonthFocus,
  events = [],
}) {
  const [hoveredDay, setHoveredDay] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const eventsMap = useMemo(() => {
    const map = {}
    events.forEach((evt) => {
      const rawDate = evt?.date || evt?.start_at || ''
      const dateStr = rawDate.slice(0, 10).trim()
      if (dateStr) {
        map[dateStr] = evt
      }
    })
    return map
  }, [events])

  const handleDayHover = useCallback((day, pos) => {
    if (!day) {
      setHoveredDay(null)
      return
    }
    const dayWithEvent = eventsMap[day.date] ? { ...day, event: eventsMap[day.date] } : day
    setHoveredDay(dayWithEvent)
    if (pos) setTooltipPos(pos)
  }, [eventsMap])

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
        onCreated={({ gl }) => {
          gl.domElement?.addEventListener?.('webglcontextlost', (e) => {
            e.preventDefault()
          }, false)
        }}
        style={{ pointerEvents: 'auto', background: 'transparent' }}
      >
        <SkylineScene
          days={days}
          sourceKey={sourceKey}
          focusedMonth={focusedMonth}
          isReplaying={isReplaying}
          onDayHover={handleDayHover}
          onDoubleReset={onResetMonthFocus}
          events={events}
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
