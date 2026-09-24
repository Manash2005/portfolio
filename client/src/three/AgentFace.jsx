/**
 * AgentFace.jsx — AI Robot Head with scroll-driven exploded-assembly.
 *
 * Head shape: defined entirely by box/cylinder plates (no occluding sphere).
 * Jaw: two-group hinge — jawPivotRef rotates around the jaw hinge axis,
 *      jaw body/grille are children offset forward from that pivot.
 * Explode math: delegated to explode.js (no per-frame allocations).
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { getPartTransform } from './explode.js'

// ── Palette ──────────────────────────────────────────────────────────────────
const LIME         = 0xB8FF3C
const DARK_METAL   = 0x2E3042
const DARKER_METAL = 0x1A1A2A
const GUNMETAL     = 0x40445A
const WIRE_GREY    = 0x5A6080
const CYAN_TINT    = 0x88FFCC

// ── Jaw hinge geometry constants ─────────────────────────────────────────────
// Pivot is at the bottom-back of the skull face
const JAW_HINGE_Y     = -0.62   // Y of the pivot in head-group space
const JAW_HINGE_Z     =  0.08   // Z of the pivot (slightly forward of skull centre)
// Jaw body mesh is offset downward from the pivot
const JAW_BODY_Y      = -0.32   // child offset below pivot
const JAW_BODY_Z      =  0.20   // child offset forward from pivot

// ── Pooled temp objects — never reallocated per frame ────────────────────────
const _pos = { x: 0, y: 0, z: 0 }
const _rot = { x: 0, y: 0, z: 0 }

// ── prefers-reduced-motion ────────────────────────────────────────────────────
const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function AgentFace({ mouseRef }) {
  const groupRef = useRef()

  // ── Per-part refs ──────────────────────────────────────────────────────────
  const craniumRef      = useRef()
  const browRef         = useRef()
  const leftTempRef     = useRef()
  const rightTempRef    = useRef()
  const visorRef        = useRef()
  const noseRef         = useRef()
  const leftCheekRef    = useRef()
  const rightCheekRef   = useRef()
  const jawPivotRef     = useRef()   // hinge group — rotation.x opens mouth
  const antennaStalkRef = useRef()
  const antennaTipRef   = useRef()
  const neckRef         = useRef()

  // ── Smoothed explode value ─────────────────────────────────────────────────
  const smoothExplode = useRef(0)
  const scrollRef     = useScrollProgress()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const p  = scrollRef.current
    const mx = mouseRef?.current?.x ?? 0
    const my = mouseRef?.current?.y ?? 0
    const t  = state.clock.elapsedTime

    // ── 1. Explode amount from scroll ─────────────────────────────────────
    // Range  0.07 → 0.32 : explode
    // Range  0.32 → 0.52 : plateau (hold open through Build section)
    // Range  0.52 → 0.62 : reassemble
    // Outside             : 0 (fully assembled)
    let rawExplode
    if (p >= 0.07 && p < 0.32) {
      rawExplode = THREE.MathUtils.smoothstep(p, 0.07, 0.32)
    } else if (p >= 0.32 && p < 0.52) {
      rawExplode = 1
    } else if (p >= 0.52 && p < 0.62) {
      rawExplode = 1 - THREE.MathUtils.smoothstep(p, 0.52, 0.62)
    } else {
      rawExplode = 0
    }

    // Smooth it (skip smoothing for prefers-reduced-motion → snap)
    if (REDUCED) {
      smoothExplode.current = rawExplode > 0.5 ? 1 : 0
    } else {
      smoothExplode.current = THREE.MathUtils.damp(
        smoothExplode.current, rawExplode, 5, delta
      )
    }
    const ea = smoothExplode.current

    // ── 2. Global head position / scale ───────────────────────────────────
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

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x, targetX, 0.05
    )
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y, targetY, 0.05
    )
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05)
    )

    // ── 3. Opacity sweep — single pass, handles pulse in same walk ────────
    // Epsilon dead-zone: skip update when already within 0.004 of target
    // to stop continuous material mutation when scroll is at rest.
    groupRef.current.traverse((child) => {
      if (!child.isMesh || !child.material?.transparent) return
      if (child.userData.pulse) {
        const pulseTarget = (0.5 + 0.5 * Math.sin(t * 3.5)) * targetOpacity
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, pulseTarget, 0.10)
      } else {
        const diff = targetOpacity - child.material.opacity
        if (Math.abs(diff) > 0.004) {
          child.material.opacity += diff * 0.06
        }
      }
    })

    // ── 4. Idle rotation (slows while exploded so diagram stays readable) ─
    const idleStr = 1 - ea * 0.85
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mx * 0.3 * idleStr + Math.sin(t * 0.5) * 0.04 * idleStr,
      0.06
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -my * 0.2 * idleStr + Math.cos(t * 0.7) * 0.02 * idleStr,
      0.06
    )

    // ── 5. Per-part explode transforms ────────────────────────────────────
    // Helper: lerp a part ref toward (restPos + delta) using pooled _pos/_rot
    function applyPart(ref, key, rp, rr) {
      if (!ref?.current) return
      getPartTransform(key, ea, _pos, _rot)
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, rp[0] + _pos.x, 0.07)
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, rp[1] + _pos.y, 0.07)
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, rp[2] + _pos.z, 0.07)
      if (rr) {
        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, (rr[0]||0) + _rot.x, 0.07)
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, (rr[1]||0) + _rot.y, 0.07)
        ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, (rr[2]||0) + _rot.z, 0.07)
      }
    }

    applyPart(craniumRef,      'cranium',      [0, 0.82, 0.35], [0, 0, 0])
    applyPart(browRef,         'brow',         [0, 0.36, 0.58], [0, 0, 0])
    applyPart(leftTempRef,     'sideL',        [-0.75, 0.45, -0.1], [0, 0.25, 0.1])
    applyPart(rightTempRef,    'sideR',        [ 0.75, 0.45, -0.1], [0,-0.25,-0.1])
    applyPart(visorRef,        'visor',        [0, 0.14, 0.58], [0, 0, 0])
    applyPart(noseRef,         'noseBlock',    [0,-0.18, 0.58], [0, 0, 0])
    applyPart(leftCheekRef,    'cheekL',       [-0.55,-0.38, 0.4], [0, 0, 0])
    applyPart(rightCheekRef,   'cheekR',       [ 0.55,-0.38, 0.4], [0, 0, 0])
    applyPart(neckRef,         'neck',         [0,-1.5,-0.1],  [0, 0, 0])
    applyPart(antennaStalkRef, 'antennaStalk', [0, 1.38, 0],   [0, 0, 0])
    applyPart(antennaTipRef,   'antennaTip',   [0, 1.38, 0],   [0, 0, 0])

    // ── Jaw: hinge pivot ──────────────────────────────────────────────────
    // jawPivotRef handles both the hinge rotation AND the translation.
    // _rot.x from getPartTransform('jaw') is the hinge opening angle.
    // _pos is the full translation of the jaw away from its resting point.
    if (jawPivotRef.current) {
      getPartTransform('jaw', ea, _pos, _rot)
      // Translate pivot point
      jawPivotRef.current.position.x = THREE.MathUtils.lerp(
        jawPivotRef.current.position.x, 0 + _pos.x, 0.07
      )
      jawPivotRef.current.position.y = THREE.MathUtils.lerp(
        jawPivotRef.current.position.y, JAW_HINGE_Y + _pos.y, 0.07
      )
      jawPivotRef.current.position.z = THREE.MathUtils.lerp(
        jawPivotRef.current.position.z, JAW_HINGE_Z + _pos.z, 0.07
      )
      // Rotate around hinge (opens mouth downward)
      jawPivotRef.current.rotation.x = THREE.MathUtils.lerp(
        jawPivotRef.current.rotation.x, _rot.x, 0.07
      )
    }
  })

  // ── Material helpers ──────────────────────────────────────────────────────
  const plateMat     = <meshStandardMaterial color={DARK_METAL}   roughness={0.22} metalness={0.88} transparent opacity={0.95} />
  const darkPlateMat = <meshStandardMaterial color={DARKER_METAL} roughness={0.18} metalness={0.92} transparent opacity={0.95} />
  const gunMat       = <meshStandardMaterial color={GUNMETAL}     roughness={0.15} metalness={0.92} transparent opacity={0.95} />
  const wireMat      = <meshBasicMaterial    color={WIRE_GREY}    wireframe transparent opacity={0.30} />
  const limeMat      = <meshBasicMaterial    color={LIME}         transparent opacity={0.9} />
  const circuitMat   = <meshBasicMaterial    color={LIME}         transparent opacity={0.25} />
  const seamMat      = <meshBasicMaterial    color={0x0A0A14}     transparent opacity={0.97} />
  const cyanMat      = <meshBasicMaterial    color={CYAN_TINT}    transparent opacity={0.70} />

  return (
    <group ref={groupRef} position={[1.5, 0, 0]}>

      {/* ══════════════════════════════════════════════════════════════════
          1. ANTENNA  (stalk + tip in separate refs for independent travel)
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={antennaStalkRef} position={[0, 1.38, 0]}>
        {/* Tapered shaft */}
        <mesh>
          <cylinderGeometry args={[0.022, 0.048, 0.58, 8]} />
          {gunMat}
        </mesh>
        {/* Base collar ring */}
        <mesh position={[0, -0.29, 0]}>
          <torusGeometry args={[0.058, 0.013, 8, 16]} />
          {limeMat}
        </mesh>
        {/* Mid collar ring */}
        <mesh position={[0, 0.0, 0]}>
          <torusGeometry args={[0.034, 0.008, 8, 16]} />
          {limeMat}
        </mesh>
      </group>

      {/* Antenna tip — travels farther than the stalk */}
      <group ref={antennaTipRef} position={[0, 1.38, 0]}>
        <mesh position={[0, 0.35, 0]} userData={{ pulse: true }}>
          <sphereGeometry args={[0.048, 14, 14]} />
          <meshBasicMaterial color={LIME} transparent opacity={0.9} />
        </mesh>
        {/* Small halo ring around tip */}
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.072, 0.006, 6, 18]} />
          {limeMat}
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          2. CRANIUM — upper dome plate
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={craniumRef} position={[0, 0.82, 0.35]}>
        {/* Main dome box */}
        <mesh>
          <boxGeometry args={[1.28, 0.56, 0.68]} />
          {plateMat}
        </mesh>
        {/* Wireframe overlay */}
        <mesh>
          <boxGeometry args={[1.30, 0.58, 0.70]} />
          {wireMat}
        </mesh>
        {/* Top lime seam */}
        <mesh position={[0, 0.29, 0]}>
          <boxGeometry args={[1.30, 0.018, 0.70]} />
          {limeMat}
        </mesh>
        {/* Inset dark panel */}
        <mesh position={[0, 0.06, 0.35]}>
          <boxGeometry args={[0.44, 0.28, 0.008]} />
          {seamMat}
        </mesh>
        {/* Circuit traces */}
        <mesh position={[0, 0.10, 0.35]}>
          <boxGeometry args={[0.70, 0.010, 0.010]} />
          {circuitMat}
        </mesh>
        <mesh position={[-0.25, 0.04, 0.35]}>
          <boxGeometry args={[0.010, 0.30, 0.010]} />
          {circuitMat}
        </mesh>
        <mesh position={[0.25, 0.04, 0.35]}>
          <boxGeometry args={[0.010, 0.30, 0.010]} />
          {circuitMat}
        </mesh>
        {/* Horizontal ridge detail */}
        <mesh position={[0, -0.18, 0.35]}>
          <boxGeometry args={[1.00, 0.014, 0.010]} />
          {circuitMat}
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          3. BROW RIDGE — angular plates above visor
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={browRef} position={[0, 0.355, 0.58]}>
        {/* Left brow plate */}
        <mesh position={[-0.33, 0, 0]} rotation={[0, 0, -0.20]}>
          <boxGeometry args={[0.54, 0.12, 0.16]} />
          {darkPlateMat}
        </mesh>
        {/* Right brow plate */}
        <mesh position={[0.33, 0, 0]} rotation={[0, 0, 0.20]}>
          <boxGeometry args={[0.54, 0.12, 0.16]} />
          {darkPlateMat}
        </mesh>
        {/* Nasal bridge centre */}
        <mesh>
          <boxGeometry args={[0.14, 0.15, 0.15]} />
          {gunMat}
        </mesh>
        {/* Brow-bottom lime accent seam */}
        <mesh position={[0, -0.060, 0]}>
          <boxGeometry args={[1.28, 0.012, 0.17]} />
          {limeMat}
        </mesh>
        {/* Inner vent detail on each brow */}
        <mesh position={[-0.33, 0, 0.08]}>
          <boxGeometry args={[0.30, 0.030, 0.008]} />
          {seamMat}
        </mesh>
        <mesh position={[0.33, 0, 0.08]}>
          <boxGeometry args={[0.30, 0.030, 0.008]} />
          {seamMat}
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          4. LEFT TEMPORAL SKULL PLATE
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={leftTempRef} position={[-0.75, 0.45, -0.10]}>
        {/* Main plate */}
        <mesh rotation={[0, 0.25, 0.10]}>
          <boxGeometry args={[0.36, 1.14, 0.90]} />
          {plateMat}
        </mesh>
        {/* Ear hub cylinder */}
        <mesh position={[-0.20, 0.10, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.19, 0.19, 0.18, 22]} />
          {gunMat}
        </mesh>
        {/* Outer ring */}
        <mesh position={[-0.22, 0.10, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.135, 0.014, 8, 22]} />
          {limeMat}
        </mesh>
        {/* Inner iris ring */}
        <mesh position={[-0.22, 0.10, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.082, 0.009, 8, 22]} />
          {cyanMat}
        </mesh>
        {/* Centre dot */}
        <mesh position={[-0.22, 0.10, 0]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.030, 12]} />
          {limeMat}
        </mesh>
        {/* Vertical circuit trace */}
        <mesh position={[0.06, -0.18, 0.46]}>
          <boxGeometry args={[0.010, 0.52, 0.010]} />
          {circuitMat}
        </mesh>
        {/* Horizontal panel accent */}
        <mesh position={[0.06, -0.32, 0.46]}>
          <boxGeometry args={[0.22, 0.010, 0.010]} />
          {circuitMat}
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          5. RIGHT TEMPORAL SKULL PLATE (exact mirror of left)
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={rightTempRef} position={[0.75, 0.45, -0.10]}>
        <mesh rotation={[0, -0.25, -0.10]}>
          <boxGeometry args={[0.36, 1.14, 0.90]} />
          {plateMat}
        </mesh>
        <mesh position={[0.20, 0.10, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.19, 0.19, 0.18, 22]} />
          {gunMat}
        </mesh>
        <mesh position={[0.22, 0.10, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.135, 0.014, 8, 22]} />
          {limeMat}
        </mesh>
        <mesh position={[0.22, 0.10, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.082, 0.009, 8, 22]} />
          {cyanMat}
        </mesh>
        <mesh position={[0.22, 0.10, 0]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.030, 12]} />
          {limeMat}
        </mesh>
        <mesh position={[-0.06, -0.18, 0.46]}>
          <boxGeometry args={[0.010, 0.52, 0.010]} />
          {circuitMat}
        </mesh>
        <mesh position={[-0.06, -0.32, 0.46]}>
          <boxGeometry args={[0.22, 0.010, 0.010]} />
          {circuitMat}
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          6. VISOR / OPTIC SCANNER  — clearly in front of the skull plates
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={visorRef} position={[0, 0.14, 0.60]}>
        {/* Outer visor frame */}
        <mesh>
          <boxGeometry args={[1.36, 0.36, 0.20]} />
          <meshStandardMaterial
            color={0x141422}
            metalness={0.96}
            roughness={0.06}
            transparent opacity={0.97}
          />
        </mesh>

        {/* ── Left Eye ── */}
        {/* Socket recess */}
        <mesh position={[-0.36, 0, 0.105]}>
          <boxGeometry args={[0.30, 0.26, 0.04]} />
          {seamMat}
        </mesh>
        {/* Lime iris ring */}
        <mesh position={[-0.36, 0, 0.125]}>
          <torusGeometry args={[0.092, 0.016, 8, 26]} />
          {limeMat}
        </mesh>
        {/* Cyan inner iris */}
        <mesh position={[-0.36, 0, 0.135]}>
          <torusGeometry args={[0.056, 0.010, 8, 26]} />
          {cyanMat}
        </mesh>
        {/* White pupil */}
        <mesh position={[-0.36, 0, 0.145]}>
          <circleGeometry args={[0.028, 14]} />
          <meshBasicMaterial color={0xFFFFFF} transparent opacity={0.95} />
        </mesh>

        {/* ── Right Eye (exact mirror) ── */}
        <mesh position={[0.36, 0, 0.105]}>
          <boxGeometry args={[0.30, 0.26, 0.04]} />
          {seamMat}
        </mesh>
        <mesh position={[0.36, 0, 0.125]}>
          <torusGeometry args={[0.092, 0.016, 8, 26]} />
          {limeMat}
        </mesh>
        <mesh position={[0.36, 0, 0.135]}>
          <torusGeometry args={[0.056, 0.010, 8, 26]} />
          {cyanMat}
        </mesh>
        <mesh position={[0.36, 0, 0.145]}>
          <circleGeometry args={[0.028, 14]} />
          <meshBasicMaterial color={0xFFFFFF} transparent opacity={0.95} />
        </mesh>

        {/* Centre nose-bridge bar */}
        <mesh position={[0, 0, 0.110]}>
          <boxGeometry args={[0.10, 0.26, 0.020]} />
          {darkPlateMat}
        </mesh>
        {/* Bottom lime blade */}
        <mesh position={[0, -0.180, 0.112]}>
          <boxGeometry args={[1.28, 0.016, 0.060]} />
          {limeMat}
        </mesh>
        {/* Top accent line */}
        <mesh position={[0, 0.176, 0.112]}>
          <boxGeometry args={[1.28, 0.010, 0.050]} />
          {cyanMat}
        </mesh>
        {/* Left/Right visor end caps */}
        <mesh position={[-0.69, 0, 0]}>
          <boxGeometry args={[0.02, 0.36, 0.20]} />
          {limeMat}
        </mesh>
        <mesh position={[0.69, 0, 0]}>
          <boxGeometry args={[0.02, 0.36, 0.20]} />
          {limeMat}
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          7. NOSE SENSOR — vent block between eyes and jaw
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={noseRef} position={[0, -0.18, 0.60]}>
        <mesh>
          <boxGeometry args={[0.18, 0.28, 0.15]} />
          {gunMat}
        </mesh>
        {/* 3 vertical vent slots */}
        {[-0.046, 0, 0.046].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.078]}>
            <boxGeometry args={[0.022, 0.17, 0.014]} />
            {seamMat}
          </mesh>
        ))}
        {/* Sensor tip dot */}
        <mesh position={[0, -0.128, 0.078]}>
          <circleGeometry args={[0.018, 9]} />
          {limeMat}
        </mesh>
        {/* Side accent lines */}
        <mesh position={[-0.090, 0, 0.078]}>
          <boxGeometry args={[0.010, 0.20, 0.010]} />
          {circuitMat}
        </mesh>
        <mesh position={[0.090, 0, 0.078]}>
          <boxGeometry args={[0.010, 0.20, 0.010]} />
          {circuitMat}
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          8. LEFT CHEEK ARMOUR
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={leftCheekRef} position={[-0.55, -0.38, 0.40]}>
        <mesh rotation={[0.15, 0.25, 0.10]}>
          <boxGeometry args={[0.52, 0.68, 0.36]} />
          {plateMat}
        </mesh>
        <mesh rotation={[0.15, 0.25, 0.10]}>
          <boxGeometry args={[0.54, 0.70, 0.38]} />
          {wireMat}
        </mesh>
        {/* Circuit trace */}
        <mesh position={[0.130, 0.10, 0.19]}>
          <boxGeometry args={[0.22, 0.010, 0.010]} />
          {circuitMat}
        </mesh>
        {/* Accent dot */}
        <mesh position={[0.175, 0.10, 0.195]}>
          <circleGeometry args={[0.018, 9]} />
          {limeMat}
        </mesh>
        {/* Vertical accent */}
        <mesh position={[0.130, 0.00, 0.19]}>
          <boxGeometry args={[0.010, 0.28, 0.010]} />
          {circuitMat}
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          9. RIGHT CHEEK ARMOUR (exact mirror)
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={rightCheekRef} position={[0.55, -0.38, 0.40]}>
        <mesh rotation={[0.15, -0.25, -0.10]}>
          <boxGeometry args={[0.52, 0.68, 0.36]} />
          {plateMat}
        </mesh>
        <mesh rotation={[0.15, -0.25, -0.10]}>
          <boxGeometry args={[0.54, 0.70, 0.38]} />
          {wireMat}
        </mesh>
        <mesh position={[-0.130, 0.10, 0.19]}>
          <boxGeometry args={[0.22, 0.010, 0.010]} />
          {circuitMat}
        </mesh>
        <mesh position={[-0.175, 0.10, 0.195]}>
          <circleGeometry args={[0.018, 9]} />
          {limeMat}
        </mesh>
        <mesh position={[-0.130, 0.00, 0.19]}>
          <boxGeometry args={[0.010, 0.28, 0.010]} />
          {circuitMat}
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          10. JAW — hinge-pivot structure
          jawPivotRef  @ hinge point  [0, JAW_HINGE_Y, JAW_HINGE_Z]
            └─ jaw body group offset  [0, JAW_BODY_Y,  JAW_BODY_Z]
               ├─ jaw shell mesh
               ├─ jaw side plates
               ├─ mouth grille bars
               └─ chin vent / lip seam
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={jawPivotRef} position={[0, JAW_HINGE_Y, JAW_HINGE_Z]}>

        {/* Hinge seam groove — visible line showing where jaw separates from skull */}
        <mesh position={[0, 0.012, 0.32]}>
          <boxGeometry args={[1.10, 0.016, 0.58]} />
          <meshBasicMaterial color={0x040408} transparent opacity={0.98} />
        </mesh>

        {/* Jaw body group — offset from pivot so rotation arcs correctly */}
        <group position={[0, JAW_BODY_Y, JAW_BODY_Z]}>

          {/* Main jaw shell */}
          <mesh>
            <boxGeometry args={[1.04, 0.58, 0.62]} />
            {plateMat}
          </mesh>
          {/* Jaw wireframe overlay */}
          <mesh>
            <boxGeometry args={[1.06, 0.60, 0.64]} />
            {wireMat}
          </mesh>

          {/* Left jaw side plate */}
          <mesh position={[-0.54, 0.04, 0.02]} rotation={[0.10, 0.28, -0.12]}>
            <boxGeometry args={[0.10, 0.52, 0.60]} />
            {darkPlateMat}
          </mesh>
          {/* Right jaw side plate */}
          <mesh position={[0.54, 0.04, 0.02]} rotation={[0.10, -0.28, 0.12]}>
            <boxGeometry args={[0.10, 0.52, 0.60]} />
            {darkPlateMat}
          </mesh>

          {/* Inner top face — emissive so it looks intentional when jaw opens */}
          <mesh position={[0, 0.29, 0]}>
            <boxGeometry args={[1.00, 0.016, 0.60]} />
            <meshBasicMaterial color={0x0A1A08} transparent opacity={0.96} />
          </mesh>

          {/* ── Mouth grille — 5 horizontal bars ── */}
          <group position={[0, 0.10, 0.34]}>
            {[0, -0.080, -0.160, -0.240, -0.320].map((yOff, i) => (
              <mesh key={i} position={[0, yOff, 0]}>
                <boxGeometry args={[0.76, 0.026, 0.022]} />
                {seamMat}
              </mesh>
            ))}
            {/* Backlit lime glow behind bars */}
            <mesh position={[0, -0.160, -0.016]}>
              <boxGeometry args={[0.78, 0.42, 0.010]} />
              {limeMat}
            </mesh>
            {/* Grille surround */}
            <mesh position={[0, -0.160, 0.012]}>
              <boxGeometry args={[0.82, 0.46, 0.026]} />
              {darkPlateMat}
            </mesh>
          </group>

          {/* ── Chin vent — 3 vertical slots ── */}
          <group position={[0, -0.260, 0.34]}>
            {[-0.10, 0, 0.10].map((xOff, i) => (
              <mesh key={i} position={[xOff, 0, 0]}>
                <boxGeometry args={[0.028, 0.090, 0.018]} />
                {seamMat}
              </mesh>
            ))}
          </group>

          {/* Bottom lip lime seam */}
          <mesh position={[0, 0.100, 0.345]}>
            <boxGeometry args={[0.60, 0.014, 0.055]} />
            {limeMat}
          </mesh>
          {/* Chin bottom lime seam */}
          <mesh position={[0, -0.290, 0]}>
            <boxGeometry args={[1.04, 0.014, 0.64]} />
            {limeMat}
          </mesh>
        </group>
      </group>

      {/* ══════════════════════════════════════════════════════════════════
          11. NECK COLLAR / SPINE BASE
      ══════════════════════════════════════════════════════════════════ */}
      <group ref={neckRef} position={[0, -1.50, -0.10]}>
        <mesh rotation={[0.10, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.58, 0.44, 22]} />
          <meshStandardMaterial
            color={0x1E1E2C}
            metalness={0.90}
            roughness={0.30}
            transparent opacity={0.95}
          />
        </mesh>
        {/* Front cable bundle */}
        <mesh position={[0, 0.02, 0.38]}>
          <boxGeometry args={[0.14, 0.28, 0.10]} />
          <meshBasicMaterial color={WIRE_GREY} wireframe transparent opacity={0.55} />
        </mesh>
        {/* Top collar ring */}
        <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.44, 0.012, 8, 26]} />
          {limeMat}
        </mesh>
        {/* Bottom collar ring */}
        <mesh position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.54, 0.012, 8, 26]} />
          <meshBasicMaterial color={WIRE_GREY} transparent opacity={0.40} />
        </mesh>
        {/* Left/right side nubs */}
        <mesh position={[-0.44, 0, 0]}>
          <boxGeometry args={[0.10, 0.12, 0.12]} />
          {gunMat}
        </mesh>
        <mesh position={[0.44, 0, 0]}>
          <boxGeometry args={[0.10, 0.12, 0.12]} />
          {gunMat}
        </mesh>
      </group>

    </group>
  )
}
