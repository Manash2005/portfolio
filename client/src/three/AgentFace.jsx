/**
 * AgentFace.jsx
 *
 * AI Robot Head with scroll-driven exploded-assembly choreography.
 *
 * Architecture:
 *  - Each part of the head is its own named <group ref> so transforms are independent.
 *  - Jaw uses a two-group hinge structure: jawPivotRef rotates around the hinge point,
 *    jawBodyRef is offset inside it so rotation reads as "mouth opening".
 *  - explodeAmount is a smoothed value (damp toward rawExplode) computed once per frame.
 *  - getPartTransform() from explode.js writes delta pos/rot into pooled temp objects
 *    (no allocations per frame).
 *  - Scroll range 0.07→0.32 maps to the explosion beat (Hero → Build transition).
 *  - Parts return to assembled on scrolling back up (same range, reversed).
 *  - prefers-reduced-motion: explodeAmount snaps, no eased travel.
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { EXPLODE_UNIT, getPartTransform } from './explode.js'

// ── Palette ──────────────────────────────────────────────────────────────────
const LIME         = 0xB8FF3C
const DARK_METAL   = 0x2E3042
const DARKER_METAL = 0x1A1A2A
const GUNMETAL     = 0x40445A
const WIRE_GREY    = 0x5A6080

// ── Pooled temp objects (never re-allocated per frame) ────────────────────────
const _pos = { x: 0, y: 0, z: 0 }
const _rot = { x: 0, y: 0, z: 0 }

// ── Hinge geometry constants ──────────────────────────────────────────────────
// The jaw pivot sits at the back-bottom of the skull face
const JAW_HINGE_Y     = -0.68   // Y of the hinge in head-group space
const JAW_HINGE_Z     =  0.10   // Z of the hinge
const JAW_BODY_OFFSET = -0.38   // jaw mesh sits this far below the pivot

// ── prefers-reduced-motion ────────────────────────────────────────────────────
const REDUCED = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Unused import suppressed: EXPLODE_UNIT is exported for external tuning
void EXPLODE_UNIT

export default function AgentFace({ mouseRef, debugExplode }) {
  const groupRef = useRef()

  // ── Part refs ────────────────────────────────────────────────────────────────
  const skullRef      = useRef()   // main skull sphere (stays anchored)
  const craniumRef    = useRef()
  const browRef       = useRef()
  const leftTempRef   = useRef()
  const rightTempRef  = useRef()
  const visorRef      = useRef()
  const noseRef       = useRef()
  const leftCheekRef  = useRef()
  const rightCheekRef = useRef()
  // Jaw: two-group hinge structure
  const jawPivotRef   = useRef()   // pivot group — translation from explode applied here
  const antennaStalkRef = useRef()
  const antennaTipRef = useRef()   // separate from stalk for independent travel
  const neckRef       = useRef()

  // ── Smoothed explode value ────────────────────────────────────────────────────
  const smoothExplode = useRef(0)

  const scrollRef = useScrollProgress()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const p  = scrollRef.current
    const mx = mouseRef?.current?.x ?? 0
    const my = mouseRef?.current?.y ?? 0
    const t  = state.clock.elapsedTime

    // ── Explode amount: maps scroll 0.07→0.32 to 0→1 ─────────────────────────
    // Outside that range it holds at 0 (assembled) or 1 (fully exploded).
    // We plateau at 1 while the Build section is fully in view (0.32→0.48)
    // then reassemble on scrolling back (handled naturally by the same remap).
    let rawExplode
    if (p >= 0.07 && p < 0.32) {
      rawExplode = THREE.MathUtils.smoothstep(p, 0.07, 0.32)
    } else if (p >= 0.32 && p < 0.52) {
      rawExplode = 1
    } else if (p >= 0.52 && p < 0.62) {
      rawExplode = THREE.MathUtils.smoothstep(1 - (p - 0.52) / 0.10, 0, 1)
    } else {
      rawExplode = 0
    }

    // Debug override from prop (dev slider)
    if (typeof debugExplode === 'number') rawExplode = debugExplode

    // Smooth the value (skip smoothing for prefers-reduced-motion)
    if (REDUCED) {
      smoothExplode.current = rawExplode > 0.5 ? 1 : 0
    } else {
      smoothExplode.current = THREE.MathUtils.damp(smoothExplode.current, rawExplode, 6, delta)
    }
    const ea = smoothExplode.current

    // ── Global head position / scale / opacity based on scroll ───────────────
    let targetX, targetY = 0, targetScale, targetOpacity

    if (p < 0.15) {
      targetX       = THREE.MathUtils.lerp(1.5, 1.2, p / 0.15)
      targetScale   = 1.15
      targetOpacity = 0.95
    } else if (p < 0.35) {
      const t2 = (p - 0.15) / 0.20
      targetX       = THREE.MathUtils.lerp(1.2, -1.9, t2)
      targetScale   = THREE.MathUtils.lerp(1.15, 0.5, t2)
      targetOpacity = THREE.MathUtils.lerp(0.95, 0.12, t2)
    } else if (p < 0.55) {
      targetX       = -1.9
      targetScale   = 0.45
      targetOpacity = 0.08
    } else if (p < 0.75) {
      const t2 = (p - 0.55) / 0.20
      targetX       = THREE.MathUtils.lerp(-1.9, 1.5, t2)
      targetScale   = THREE.MathUtils.lerp(0.45, 0.95, t2)
      targetOpacity = THREE.MathUtils.lerp(0.08, 0.85, t2)
    } else if (p < 0.88) {
      const t2 = (p - 0.75) / 0.13
      targetX       = THREE.MathUtils.lerp(1.5, -1.5, t2)
      targetScale   = 0.8
      targetOpacity = 0.75
    } else {
      const t2 = (p - 0.88) / 0.12
      targetX       = THREE.MathUtils.lerp(-1.5, 0, t2)
      targetY       = -0.2
      targetScale   = 0.7
      targetOpacity = 0.85
    }

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05)
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05))

    // Opacity (traverse once)
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material?.transparent) {
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.06)
      }
    })
    // Antenna tip pulse
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.userData.pulse) {
        child.material.opacity = THREE.MathUtils.lerp(
          child.material.opacity,
          (0.5 + 0.5 * Math.sin(t * 3.5)) * targetOpacity,
          0.1
        )
      }
    })

    // ── Idle rotation (slow down while exploded so diagram stays readable) ────
    const idleStrength = 1 - ea * 0.85
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mx * 0.3 * idleStrength + Math.sin(t * 0.5) * 0.04 * idleStrength,
      0.06
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -my * 0.2 * idleStrength + Math.cos(t * 0.7) * 0.02 * idleStrength,
      0.06
    )

    // ── Apply part transforms ─────────────────────────────────────────────────
    // Helper: apply delta to a ref's RESTING position + rot delta
    function applyPart(ref, key, restPos, restRot) {
      if (!ref.current) return
      getPartTransform(key, ea, _pos, _rot)
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, restPos[0] + _pos.x, 0.07)
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, restPos[1] + _pos.y, 0.07)
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, restPos[2] + _pos.z, 0.07)
      if (restRot) {
        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, (restRot[0] || 0) + _rot.x, 0.07)
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, (restRot[1] || 0) + _rot.y, 0.07)
        ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, (restRot[2] || 0) + _rot.z, 0.07)
      }
    }

    applyPart(craniumRef,    'cranium',   [0, 0.82, 0.35], [0, 0, 0])
    applyPart(browRef,       'brow',      [0, 0.36, 0.58], [0, 0, 0])
    applyPart(leftTempRef,   'sideL',     [-0.75, 0.45, -0.1], [0, 0.2, 0.1])
    applyPart(rightTempRef,  'sideR',     [0.75,  0.45, -0.1], [0, -0.2, -0.1])
    applyPart(visorRef,      'visor',     [0, 0.14, 0.58], [0, 0, 0])
    applyPart(noseRef,       'noseBlock', [0, -0.18, 0.58], [0, 0, 0])
    applyPart(leftCheekRef,  'cheekL',    [-0.55, -0.38, 0.4], [0, 0, 0])
    applyPart(rightCheekRef, 'cheekR',    [0.55,  -0.38, 0.4], [0, 0, 0])
    applyPart(neckRef,       'neck',      [0, -1.5, -0.1], [0, 0, 0])

    // Antenna stalk
    applyPart(antennaStalkRef, 'antennaStalk', [0, 1.38, 0], [0, 0, 0])
    // Antenna tip — extra travel from stalk rest pos
    applyPart(antennaTipRef, 'antennaTip', [0, 1.38, 0], [0, 0, 0])

    // ── Jaw pivot: position is driven by JAW translation ─────────────────────
    if (jawPivotRef.current) {
      getPartTransform('jaw', ea, _pos, _rot)
      // Pivot point moves with translation
      jawPivotRef.current.position.x = THREE.MathUtils.lerp(jawPivotRef.current.position.x, JAW_HINGE_Y + _pos.y, 0.07)  // keep X,Z; only Y moves
      // wait — jaw pivot position is [0, JAW_HINGE_Y, JAW_HINGE_Z] + delta
      jawPivotRef.current.position.set(
        THREE.MathUtils.lerp(jawPivotRef.current.position.x, 0 + _pos.x,          0.07),
        THREE.MathUtils.lerp(jawPivotRef.current.position.y, JAW_HINGE_Y + _pos.y, 0.07),
        THREE.MathUtils.lerp(jawPivotRef.current.position.z, JAW_HINGE_Z + _pos.z, 0.07)
      )
      // Hinge rotation (opens mouth)
      jawPivotRef.current.rotation.x = THREE.MathUtils.lerp(
        jawPivotRef.current.rotation.x, _rot.x, 0.07
      )
    }
  })

  // ── Material JSX helpers ─────────────────────────────────────────────────────
  const plateMat = (
    <meshStandardMaterial color={DARK_METAL} roughness={0.22} metalness={0.88} transparent opacity={0.95} />
  )
  const darkPlateMat = (
    <meshStandardMaterial color={DARKER_METAL} roughness={0.18} metalness={0.92} transparent opacity={0.95} />
  )
  const wireMat = (
    <meshBasicMaterial color={WIRE_GREY} wireframe transparent opacity={0.35} />
  )
  const limeMat = (
    <meshBasicMaterial color={LIME} transparent opacity={0.9} />
  )
  const circuitMat = (
    <meshBasicMaterial color={LIME} transparent opacity={0.22} />
  )
  const darkSeamMat = (
    <meshBasicMaterial color={0x0A0A14} transparent opacity={0.95} />
  )

  return (
    <group ref={groupRef} position={[1.5, 0, 0]}>

      {/* ── 1. SKULL CORE — reference point, drifts up slightly ─────────────── */}
      <group ref={skullRef}>
        {/* Skull sphere (procedural stand-in for the main cranium volume) */}
        <mesh>
          <sphereGeometry args={[0.88, 32, 24]} />
          <meshStandardMaterial
            color={DARKER_METAL}
            roughness={0.25}
            metalness={0.85}
            transparent opacity={0.95}
          />
        </mesh>
        {/* Faint wireframe overlay for depth read */}
        <mesh>
          <sphereGeometry args={[0.89, 16, 12]} />
          <meshBasicMaterial color={WIRE_GREY} wireframe transparent opacity={0.12} />
        </mesh>
      </group>

      {/* ── 2. ANTENNA — split into stalk + tip for independent travel ──────── */}
      <group ref={antennaStalkRef} position={[0, 1.38, 0]}>
        {/* Shaft */}
        <mesh>
          <cylinderGeometry args={[0.025, 0.05, 0.55, 8]} />
          <meshStandardMaterial color={GUNMETAL} metalness={0.95} roughness={0.1} transparent opacity={0.95} />
        </mesh>
        {/* Base ring */}
        <mesh position={[0, -0.28, 0]}>
          <torusGeometry args={[0.055, 0.012, 8, 16]} />
          {limeMat}
        </mesh>
      </group>

      {/* Antenna tip — travels farther than stalk (separate ref) */}
      <group ref={antennaTipRef} position={[0, 1.38, 0]}>
        <mesh position={[0, 0.32, 0]} userData={{ pulse: true }}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={LIME} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* ── 3. CRANIUM — upper dome plate ───────────────────────────────────── */}
      <group ref={craniumRef} position={[0, 0.82, 0.35]}>
        <mesh>
          <boxGeometry args={[1.3, 0.58, 0.7]} />
          {plateMat}
        </mesh>
        {/* Top lime seam */}
        <mesh position={[0, 0.29, 0]}>
          <boxGeometry args={[1.32, 0.022, 0.72]} />
          {limeMat}
        </mesh>
        <mesh>
          <boxGeometry args={[1.31, 0.59, 0.71]} />
          {wireMat}
        </mesh>
        {/* Circuit traces */}
        <mesh position={[0, 0.1, 0.36]}>
          <boxGeometry args={[0.75, 0.012, 0.012]} />
          {circuitMat}
        </mesh>
        <mesh position={[-0.28, 0.0, 0.36]}>
          <boxGeometry args={[0.012, 0.35, 0.012]} />
          {circuitMat}
        </mesh>
        <mesh position={[0.28, 0.0, 0.36]}>
          <boxGeometry args={[0.012, 0.35, 0.012]} />
          {circuitMat}
        </mesh>
        <mesh position={[0, 0.05, 0.36]}>
          <boxGeometry args={[0.42, 0.32, 0.01]} />
          {darkSeamMat}
        </mesh>
      </group>

      {/* ── 4. BROW RIDGE ───────────────────────────────────────────────────── */}
      <group ref={browRef} position={[0, 0.36, 0.58]}>
        <mesh position={[-0.32, 0, 0]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.55, 0.11, 0.15]} />
          {darkPlateMat}
        </mesh>
        <mesh position={[0.32, 0, 0]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[0.55, 0.11, 0.15]} />
          {darkPlateMat}
        </mesh>
        <mesh>
          <boxGeometry args={[0.12, 0.14, 0.14]} />
          <meshStandardMaterial color={GUNMETAL} metalness={0.95} roughness={0.1} transparent opacity={0.95} />
        </mesh>
        {/* Brow edge lime seam */}
        <mesh position={[0, -0.055, 0]}>
          <boxGeometry args={[1.3, 0.014, 0.16]} />
          {limeMat}
        </mesh>
      </group>

      {/* ── 5. LEFT TEMPORAL PLATE ──────────────────────────────────────────── */}
      <group ref={leftTempRef} position={[-0.75, 0.45, -0.1]}>
        <mesh rotation={[0, 0.25, 0.1]}>
          <boxGeometry args={[0.36, 1.15, 0.92]} />
          {plateMat}
        </mesh>
        <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.19, 0.19, 0.18, 20]} />
          <meshStandardMaterial color={GUNMETAL} metalness={0.9} roughness={0.15} transparent opacity={0.95} />
        </mesh>
        <mesh position={[-0.22, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.13, 0.014, 8, 20]} />
          {limeMat}
        </mesh>
        <mesh position={[-0.22, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.08, 0.01, 8, 20]} />
          <meshBasicMaterial color={0xFFFFFF} transparent opacity={0.5} />
        </mesh>
        <mesh position={[-0.22, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.03, 12]} />
          {limeMat}
        </mesh>
        <mesh position={[0.05, -0.2, 0.47]}>
          <boxGeometry args={[0.012, 0.5, 0.012]} />
          {circuitMat}
        </mesh>
      </group>

      {/* ── 6. RIGHT TEMPORAL PLATE ─────────────────────────────────────────── */}
      <group ref={rightTempRef} position={[0.75, 0.45, -0.1]}>
        <mesh rotation={[0, -0.25, -0.1]}>
          <boxGeometry args={[0.36, 1.15, 0.92]} />
          {plateMat}
        </mesh>
        <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.19, 0.19, 0.18, 20]} />
          <meshStandardMaterial color={GUNMETAL} metalness={0.9} roughness={0.15} transparent opacity={0.95} />
        </mesh>
        <mesh position={[0.22, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.13, 0.014, 8, 20]} />
          {limeMat}
        </mesh>
        <mesh position={[0.22, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.08, 0.01, 8, 20]} />
          <meshBasicMaterial color={0xFFFFFF} transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.22, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.03, 12]} />
          {limeMat}
        </mesh>
        <mesh position={[-0.05, -0.2, 0.47]}>
          <boxGeometry args={[0.012, 0.5, 0.012]} />
          {circuitMat}
        </mesh>
      </group>

      {/* ── 7. VISOR / OPTIC SCANNER ────────────────────────────────────────── */}
      <group ref={visorRef} position={[0, 0.14, 0.58]}>
        <mesh>
          <boxGeometry args={[1.38, 0.34, 0.2]} />
          <meshStandardMaterial color={0x141420} metalness={0.96} roughness={0.06} transparent opacity={0.95} />
        </mesh>
        {/* Left eye */}
        <mesh position={[-0.36, 0, 0.1]}>
          <boxGeometry args={[0.3, 0.24, 0.04]} />
          {darkSeamMat}
        </mesh>
        <mesh position={[-0.36, 0, 0.12]}>
          <torusGeometry args={[0.09, 0.016, 8, 24]} />
          {limeMat}
        </mesh>
        <mesh position={[-0.36, 0, 0.13]}>
          <torusGeometry args={[0.055, 0.01, 8, 24]} />
          <meshBasicMaterial color={0x88FFCC} transparent opacity={0.7} />
        </mesh>
        <mesh position={[-0.36, 0, 0.14]}>
          <circleGeometry args={[0.028, 12]} />
          <meshBasicMaterial color={0xFFFFFF} transparent opacity={0.95} />
        </mesh>
        {/* Right eye */}
        <mesh position={[0.36, 0, 0.1]}>
          <boxGeometry args={[0.3, 0.24, 0.04]} />
          {darkSeamMat}
        </mesh>
        <mesh position={[0.36, 0, 0.12]}>
          <torusGeometry args={[0.09, 0.016, 8, 24]} />
          {limeMat}
        </mesh>
        <mesh position={[0.36, 0, 0.13]}>
          <torusGeometry args={[0.055, 0.01, 8, 24]} />
          <meshBasicMaterial color={0x88FFCC} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.36, 0, 0.14]}>
          <circleGeometry args={[0.028, 12]} />
          <meshBasicMaterial color={0xFFFFFF} transparent opacity={0.95} />
        </mesh>
        {/* Center bar, blade glow, top accent */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[0.1, 0.24, 0.02]} />
          {darkPlateMat}
        </mesh>
        <mesh position={[0, -0.17, 0.11]}>
          <boxGeometry args={[1.3, 0.018, 0.06]} />
          {limeMat}
        </mesh>
        <mesh position={[0, 0.17, 0.11]}>
          <boxGeometry args={[1.3, 0.01, 0.06]} />
          <meshBasicMaterial color={0x88FFCC} transparent opacity={0.4} />
        </mesh>
      </group>

      {/* ── 8. NOSE SENSOR ──────────────────────────────────────────────────── */}
      <group ref={noseRef} position={[0, -0.18, 0.58]}>
        <mesh>
          <boxGeometry args={[0.18, 0.26, 0.14]} />
          <meshStandardMaterial color={GUNMETAL} metalness={0.92} roughness={0.12} transparent opacity={0.95} />
        </mesh>
        {[-0.045, 0, 0.045].map((xPos, i) => (
          <mesh key={i} position={[xPos, 0, 0.075]}>
            <boxGeometry args={[0.022, 0.16, 0.015]} />
            {darkSeamMat}
          </mesh>
        ))}
        <mesh position={[0, -0.12, 0.075]}>
          <circleGeometry args={[0.018, 8]} />
          {limeMat}
        </mesh>
      </group>

      {/* ── 9. LEFT CHEEK ARMOR ─────────────────────────────────────────────── */}
      <group ref={leftCheekRef} position={[-0.55, -0.38, 0.4]}>
        <mesh rotation={[0.15, 0.25, 0.1]}>
          <boxGeometry args={[0.52, 0.68, 0.36]} />
          {plateMat}
        </mesh>
        <mesh rotation={[0.15, 0.25, 0.1]}>
          <boxGeometry args={[0.53, 0.69, 0.37]} />
          {wireMat}
        </mesh>
        <mesh position={[0.12, 0.1, 0.19]}>
          <boxGeometry args={[0.22, 0.012, 0.012]} />
          {circuitMat}
        </mesh>
        <mesh position={[0.17, 0.1, 0.195]}>
          <circleGeometry args={[0.018, 8]} />
          {limeMat}
        </mesh>
      </group>

      {/* ── 10. RIGHT CHEEK ARMOR ───────────────────────────────────────────── */}
      <group ref={rightCheekRef} position={[0.55, -0.38, 0.4]}>
        <mesh rotation={[0.15, -0.25, -0.1]}>
          <boxGeometry args={[0.52, 0.68, 0.36]} />
          {plateMat}
        </mesh>
        <mesh rotation={[0.15, -0.25, -0.1]}>
          <boxGeometry args={[0.53, 0.69, 0.37]} />
          {wireMat}
        </mesh>
        <mesh position={[-0.12, 0.1, 0.19]}>
          <boxGeometry args={[0.22, 0.012, 0.012]} />
          {circuitMat}
        </mesh>
        <mesh position={[-0.17, 0.1, 0.195]}>
          <circleGeometry args={[0.018, 8]} />
          {limeMat}
        </mesh>
      </group>

      {/* ── 11. JAW — hinge-pivot structure ─────────────────────────────────── */}
      {/*
          Structure:
            jawPivotRef  group  (position = hinge point in head space)
              └─ jaw body mesh  (offset below pivot = JAW_BODY_OFFSET)
              └─ grille bars    (children of jaw body offset)
          Rotating jawPivotRef.rotation.x opens the mouth around the hinge.
          Translating jawPivotRef.position moves the whole jaw+grille together.
      */}
      <group ref={jawPivotRef} position={[0, JAW_HINGE_Y, JAW_HINGE_Z]}>

        {/* Jaw shell — lower-jaw volume (new mesh giving the jaw real mass) */}
        <group position={[0, JAW_BODY_OFFSET, 0.15]}>
          {/* Main jaw box */}
          <mesh>
            <boxGeometry args={[1.0, 0.55, 0.6]} />
            <meshStandardMaterial color={DARK_METAL} roughness={0.22} metalness={0.88} transparent opacity={0.95} />
          </mesh>
          {/* Front face chamfer detail */}
          <mesh position={[0, -0.275, 0.3]}>
            <boxGeometry args={[0.98, 0.02, 0.02]} />
            {limeMat}
          </mesh>
          {/* Inner emissive face (visible when jaw opens — prevents black void) */}
          <mesh position={[0, 0.27, 0]}>
            <boxGeometry args={[0.96, 0.02, 0.58]} />
            <meshBasicMaterial color={0x0A1A0A} transparent opacity={0.95} />
          </mesh>
          {/* Jaw side plates */}
          <mesh position={[-0.52, 0, 0]} rotation={[0, 0.3, 0]}>
            <boxGeometry args={[0.08, 0.52, 0.58]} />
            <meshStandardMaterial color={DARKER_METAL} roughness={0.18} metalness={0.92} transparent opacity={0.95} />
          </mesh>
          <mesh position={[0.52, 0, 0]} rotation={[0, -0.3, 0]}>
            <boxGeometry args={[0.08, 0.52, 0.58]} />
            <meshStandardMaterial color={DARKER_METAL} roughness={0.18} metalness={0.92} transparent opacity={0.95} />
          </mesh>

          {/* ── Mouth grille — 5 horizontal slots ── */}
          <group position={[0, 0.1, 0.32]}>
            {[0, -0.07, -0.14, -0.21, -0.28].map((yOff, i) => (
              <mesh key={i} position={[0, yOff, 0]}>
                <boxGeometry args={[0.72, 0.028, 0.025]} />
                {darkSeamMat}
              </mesh>
            ))}
            {/* Backlit lime glow behind slots */}
            <mesh position={[0, -0.14, -0.015]}>
              <boxGeometry args={[0.74, 0.38, 0.012]} />
              {limeMat}
            </mesh>
            {/* Grille frame */}
            <mesh position={[0, -0.14, 0.012]}>
              <boxGeometry args={[0.76, 0.40, 0.028]} />
              <meshStandardMaterial color={DARKER_METAL} metalness={0.95} roughness={0.08} transparent opacity={0.95} />
            </mesh>
          </group>

          {/* Chin vent */}
          <group position={[0, -0.24, 0.32]}>
            {[-0.1, 0, 0.1].map((xOff, i) => (
              <mesh key={i} position={[xOff, 0, 0]}>
                <boxGeometry args={[0.028, 0.09, 0.018]} />
                {darkSeamMat}
              </mesh>
            ))}
          </group>

          {/* Bottom lip seam glow */}
          <mesh position={[0, 0.09, 0.32]}>
            <boxGeometry args={[0.56, 0.016, 0.055]} />
            {limeMat}
          </mesh>

          {/* Hinge seam groove at jaw top — reads as the jaw boundary */}
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[1.02, 0.018, 0.62]} />
            <meshBasicMaterial color={0x050508} transparent opacity={0.98} />
          </mesh>
        </group>
      </group>

      {/* ── 12. NECK COLLAR ─────────────────────────────────────────────────── */}
      <group ref={neckRef} position={[0, -1.5, -0.1]}>
        <mesh rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.56, 0.42, 20]} />
          <meshStandardMaterial color={0x1E1E2C} metalness={0.9} roughness={0.3} transparent opacity={0.95} />
        </mesh>
        <mesh position={[0, 0.02, 0.38]}>
          <boxGeometry args={[0.14, 0.28, 0.1]} />
          <meshBasicMaterial color={WIRE_GREY} wireframe transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.44, 0.012, 8, 24]} />
          {limeMat}
        </mesh>
        <mesh position={[0, -0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.012, 8, 24]} />
          <meshBasicMaterial color={WIRE_GREY} transparent opacity={0.4} />
        </mesh>
      </group>

    </group>
  )
}
