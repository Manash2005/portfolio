import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

// ── Palette ────────────────────────────────────────────────────────────────
const LIME_HEX     = 0xB8FF3C
const DARK_HEX     = 0x1A1A2A
const RING_HEX     = 0x2E3042

// ── Sub-component: single circuit trace line ───────────────────────────────
function Trace({ pos, size }) {
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={LIME_HEX} emissive={LIME_HEX} emissiveIntensity={0.6} />
    </mesh>
  )
}

// ── Sub-component: corner mounting stud ───────────────────────────────────
function Stud({ x, y }) {
  return (
    <mesh position={[x, y, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.07, 0.07, 0.06, 20]} />
      <meshStandardMaterial color={RING_HEX} metalness={0.95} roughness={0.05} />
    </mesh>
  )
}

// ── Main chip component ────────────────────────────────────────────────────
export default function AIChip({ mouseRef, rig }) {
  const groupRef  = useRef()
  const coreRef   = useRef()
  const ringRef   = useRef()

  // Smoothed rig values (avoid jitter from direct assignment)
  const smoothPos  = useRef([1.4, 0, 0])
  const smoothRotY = useRef(0)
  const idleY      = useRef(0)
  const idleRotY   = useRef(0)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // ── Target position from rig ──────────────────────────────────────────
    const targetPos  = rig?.current?.chipPos  ?? [1.4, 0, 0]
    const targetRotY = rig?.current?.chipRotY ?? 0

    // Smooth the rig values so they don't jump
    smoothPos.current[0] = THREE.MathUtils.lerp(smoothPos.current[0], targetPos[0], 0.04)
    smoothPos.current[1] = THREE.MathUtils.lerp(smoothPos.current[1], targetPos[1], 0.04)
    smoothRotY.current   = THREE.MathUtils.lerp(smoothRotY.current, targetRotY, 0.04)

    // ── Idle float ────────────────────────────────────────────────────────
    idleY.current    = Math.sin(t * 0.7) * 0.07
    idleRotY.current = THREE.MathUtils.lerp(idleRotY.current, smoothRotY.current, 0.04)

    groupRef.current.position.x = smoothPos.current[0]
    groupRef.current.position.y = smoothPos.current[1] + idleY.current
    groupRef.current.rotation.y = idleRotY.current + t * 0.06 // very slow idle spin on top of shot rotation

    // ── Mouse parallax (subtle tilt only, not pan) ───────────────────────
    const mx = mouseRef?.current?.x ?? 0
    const my = mouseRef?.current?.y ?? 0
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -my * 0.12, 0.04)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -mx * 0.08, 0.04)

    // ── Core pulse ────────────────────────────────────────────────────────
    if (coreRef.current) {
      coreRef.current.material.emissiveIntensity = 1.0 + Math.sin(t * 1.8) * 0.7
    }

    // ── Outer ring slow counter-rotation ─────────────────────────────────
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.08
    }
  })

  return (
    <group ref={groupRef} position={[1.4, 0, 0]}>

      {/* ── Outer dark-metal body ─────────────────────────────────────── */}
      <RoundedBox args={[2.0, 2.0, 0.28]} radius={0.12} smoothness={6}>
        <meshStandardMaterial color={DARK_HEX} roughness={0.15} metalness={0.85} />
      </RoundedBox>

      {/* ── Inset accent ring (slightly proud of shell) ───────────────── */}
      <group ref={ringRef}>
        <RoundedBox args={[1.62, 1.62, 0.32]} radius={0.09} smoothness={5}>
          <meshStandardMaterial color={RING_HEX} roughness={0.3} metalness={0.7} />
        </RoundedBox>
      </group>

      {/* ── Dark glass die cover ─────────────────────────────────────── */}
      <RoundedBox args={[1.2, 1.2, 0.38]} radius={0.06} smoothness={5} position={[0, 0, 0.06]}>
        <meshStandardMaterial
          color={0x020208}
          metalness={0.95}
          roughness={0.08}
          transparent
          opacity={0.55}
        />
      </RoundedBox>

      {/* ── Glowing core face ────────────────────────────────────────── */}
      <mesh ref={coreRef} position={[0, 0, 0.21]}>
        <planeGeometry args={[0.88, 0.88]} />
        <meshStandardMaterial
          color={0xffffff}
          emissive={LIME_HEX}
          emissiveIntensity={1.0}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* ── Circuit traces ────────────────────────────────────────────── */}
      {/* Horizontal rails */}
      <Trace pos={[0,  0.72, 0.20]} size={[1.56, 0.022, 0.018]} />
      <Trace pos={[0, -0.72, 0.20]} size={[1.56, 0.022, 0.018]} />
      {/* Vertical rails */}
      <Trace pos={[ 0.72, 0, 0.20]} size={[0.022, 1.56, 0.018]} />
      <Trace pos={[-0.72, 0, 0.20]} size={[0.022, 1.56, 0.018]} />
      {/* Inner horizontal details */}
      <Trace pos={[0.3,  0.45, 0.20]} size={[0.3, 0.014, 0.012]} />
      <Trace pos={[-0.3, -0.45, 0.20]} size={[0.3, 0.014, 0.012]} />
      <Trace pos={[0.45, 0.3, 0.20]} size={[0.014, 0.3, 0.012]} />

      {/* ── Corner mounting studs ─────────────────────────────────────── */}
      <Stud x={ 0.72} y={ 0.72} />
      <Stud x={-0.72} y={ 0.72} />
      <Stud x={ 0.72} y={-0.72} />
      <Stud x={-0.72} y={-0.72} />

      {/* ── Lime rim glow from below ──────────────────────────────────── */}
      <pointLight
        position={[0, 0, 0.5]}
        color={LIME_HEX}
        intensity={0.8}
        distance={3}
        decay={2}
      />

    </group>
  )
}
