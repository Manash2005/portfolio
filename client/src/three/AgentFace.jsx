import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollProgress } from '../hooks/useScrollProgress'

// Shared materials (re-used across groups for performance)
const LIME = 0xB8FF3C
const DARK_METAL = 0x2E3042
const DARKER_METAL = 0x1A1A2A
const GUNMETAL = 0x40445A
const WIRE_GREY = 0x5A6080

export default function AgentFace({ mouseRef }) {
  const groupRef = useRef()

  // Plate refs (for explosion)
  const craniumRef = useRef()
  const leftTempRef = useRef()
  const rightTempRef = useRef()
  const visorRef = useRef()
  const leftCheekRef = useRef()
  const rightCheekRef = useRef()
  const jawRef = useRef()
  const neckRef = useRef()
  // New face feature refs
  const browRef = useRef()
  const noseRef = useRef()
  const antennaRef = useRef()

  const scrollRef = useScrollProgress()

  useFrame((state) => {
    if (!groupRef.current) return
    const p = scrollRef.current
    const mx = mouseRef?.current?.x ?? 0
    const my = mouseRef?.current?.y ?? 0
    const t = state.clock.elapsedTime

    // Gentle idle sway + mouse parallax
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mx * 0.3 + Math.sin(t * 0.5) * 0.04,
      0.06
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -my * 0.2 + Math.cos(t * 0.7) * 0.02,
      0.06
    )

    // Scroll-driven position / scale / opacity transitions
    let targetX, targetY = 0, targetScale, targetOpacity

    if (p < 0.15) {
      targetX = THREE.MathUtils.lerp(1.5, 1.2, p / 0.15)
      targetScale = 1.15
      targetOpacity = 0.95
    } else if (p < 0.35) {
      const t2 = (p - 0.15) / 0.20
      targetX = THREE.MathUtils.lerp(1.2, -1.9, t2)
      targetScale = THREE.MathUtils.lerp(1.15, 0.5, t2)
      targetOpacity = THREE.MathUtils.lerp(0.95, 0.12, t2)
    } else if (p < 0.55) {
      targetX = -1.9
      targetScale = 0.45
      targetOpacity = 0.08
    } else if (p < 0.75) {
      const t2 = (p - 0.55) / 0.20
      targetX = THREE.MathUtils.lerp(-1.9, 1.5, t2)
      targetScale = THREE.MathUtils.lerp(0.45, 0.95, t2)
      targetOpacity = THREE.MathUtils.lerp(0.08, 0.85, t2)
    } else if (p < 0.88) {
      const t2 = (p - 0.75) / 0.13
      targetX = THREE.MathUtils.lerp(1.5, -1.5, t2)
      targetScale = 0.8
      targetOpacity = 0.75
    } else {
      const t2 = (p - 0.88) / 0.12
      targetX = THREE.MathUtils.lerp(-1.5, 0, t2)
      targetY = -0.2
      targetScale = 0.7
      targetOpacity = 0.85
    }

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05)
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05)
    )

    // Dismantling factor (0 = assembled, 1 = fully exploded)
    const dismantle = THREE.MathUtils.smoothstep(p, 0.14, 0.65)

    // ── Plate explosions ──────────────────────────────────────────────────

    // 1. Forehead / Cranium: explodes UP and FORWARD
    if (craniumRef.current) {
      craniumRef.current.position.y = THREE.MathUtils.lerp(0.82, 0.82 + dismantle * 1.6, 0.07)
      craniumRef.current.position.z = THREE.MathUtils.lerp(0.35, 0.35 + dismantle * 0.9, 0.07)
      craniumRef.current.rotation.x = THREE.MathUtils.lerp(0, -dismantle * 0.35, 0.07)
    }

    // 2. Brow ridge: lifts UP with cranium, slightly faster
    if (browRef.current) {
      browRef.current.position.y = THREE.MathUtils.lerp(0.36, 0.36 + dismantle * 1.3, 0.07)
      browRef.current.position.z = THREE.MathUtils.lerp(0.58, 0.58 + dismantle * 0.7, 0.07)
    }

    // 3. Left Temporal: slides LEFT and BACK
    if (leftTempRef.current) {
      leftTempRef.current.position.x = THREE.MathUtils.lerp(-0.75, -0.75 - dismantle * 1.8, 0.07)
      leftTempRef.current.position.z = THREE.MathUtils.lerp(-0.1, -0.1 - dismantle * 0.8, 0.07)
      leftTempRef.current.rotation.y = THREE.MathUtils.lerp(0.2, 0.2 - dismantle * 0.5, 0.07)
    }

    // 4. Right Temporal: slides RIGHT and BACK
    if (rightTempRef.current) {
      rightTempRef.current.position.x = THREE.MathUtils.lerp(0.75, 0.75 + dismantle * 1.8, 0.07)
      rightTempRef.current.position.z = THREE.MathUtils.lerp(-0.1, -0.1 - dismantle * 0.8, 0.07)
      rightTempRef.current.rotation.y = THREE.MathUtils.lerp(-0.2, -0.2 + dismantle * 0.5, 0.07)
    }

    // 5. Visor: pushes FORWARD, expands X
    if (visorRef.current) {
      visorRef.current.position.z = THREE.MathUtils.lerp(0.58, 0.58 + dismantle * 1.2, 0.07)
      visorRef.current.position.y = THREE.MathUtils.lerp(0.14, 0.14 - dismantle * 0.3, 0.07)
      visorRef.current.scale.x = THREE.MathUtils.lerp(1, 1 + dismantle * 0.5, 0.07)
    }

    // 6. Nose sensor: drops DOWN and forward
    if (noseRef.current) {
      noseRef.current.position.y = THREE.MathUtils.lerp(-0.18, -0.18 - dismantle * 1.5, 0.07)
      noseRef.current.position.z = THREE.MathUtils.lerp(0.58, 0.58 + dismantle * 0.9, 0.07)
    }

    // 7. Left Cheek: slides DOWN, LEFT and OUT
    if (leftCheekRef.current) {
      leftCheekRef.current.position.x = THREE.MathUtils.lerp(-0.55, -0.55 - dismantle * 1.5, 0.07)
      leftCheekRef.current.position.y = THREE.MathUtils.lerp(-0.38, -0.38 - dismantle * 1.2, 0.07)
      leftCheekRef.current.position.z = THREE.MathUtils.lerp(0.4, 0.4 + dismantle * 0.7, 0.07)
      leftCheekRef.current.rotation.z = THREE.MathUtils.lerp(0.1, 0.1 + dismantle * 0.4, 0.07)
    }

    // 8. Right Cheek: slides DOWN, RIGHT and OUT
    if (rightCheekRef.current) {
      rightCheekRef.current.position.x = THREE.MathUtils.lerp(0.55, 0.55 + dismantle * 1.5, 0.07)
      rightCheekRef.current.position.y = THREE.MathUtils.lerp(-0.38, -0.38 - dismantle * 1.2, 0.07)
      rightCheekRef.current.position.z = THREE.MathUtils.lerp(0.4, 0.4 + dismantle * 0.7, 0.07)
      rightCheekRef.current.rotation.z = THREE.MathUtils.lerp(-0.1, -0.1 - dismantle * 0.4, 0.07)
    }

    // 9. Jaw: slides DOWN and FORWARD
    if (jawRef.current) {
      jawRef.current.position.y = THREE.MathUtils.lerp(-0.98, -0.98 - dismantle * 2.0, 0.07)
      jawRef.current.position.z = THREE.MathUtils.lerp(0.25, 0.25 + dismantle * 0.8, 0.07)
      jawRef.current.rotation.x = THREE.MathUtils.lerp(0.15, 0.15 + dismantle * 0.4, 0.07)
    }

    // 10. Neck collar: drops DOWN
    if (neckRef.current) {
      neckRef.current.position.y = THREE.MathUtils.lerp(-1.5, -1.5 - dismantle * 1.4, 0.07)
    }

    // 11. Antenna: shoots UP and rotates slightly
    if (antennaRef.current) {
      antennaRef.current.position.y = THREE.MathUtils.lerp(1.38, 1.38 + dismantle * 2.2, 0.07)
      antennaRef.current.rotation.z = THREE.MathUtils.lerp(0, dismantle * 0.3, 0.07)
    }

    // Update opacity across all meshes in group
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material && child.material.transparent) {
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.06)
      }
    })

    // Pulse antenna tip and visor glow
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.userData.pulse) {
        const intensity = 0.5 + 0.5 * Math.sin(t * 3.5)
        child.material.opacity = THREE.MathUtils.lerp(
          child.material.opacity,
          intensity * targetOpacity,
          0.1
        )
      }
    })
  })

  // ── Shared material JSX factories ────────────────────────────────────────

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

      {/* ═══════════════════════════════════════════════════════════════
          1. ANTENNA — tapered spike, top center, with blinking lime tip
      ═══════════════════════════════════════════════════════════════ */}
      <group ref={antennaRef} position={[0, 1.38, 0]}>
        {/* Shaft */}
        <mesh>
          <cylinderGeometry args={[0.025, 0.05, 0.55, 8]} />
          <meshStandardMaterial color={GUNMETAL} metalness={0.95} roughness={0.1} transparent opacity={0.95} />
        </mesh>
        {/* Tip — pulsing lime orb */}
        <mesh position={[0, 0.32, 0]} userData={{ pulse: true }}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={LIME} transparent opacity={0.9} />
        </mesh>
        {/* Base ring */}
        <mesh position={[0, -0.28, 0]}>
          <torusGeometry args={[0.055, 0.012, 8, 16]} />
          {limeMat}
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════
          2. CRANIUM — main dome plate, circuit accents on surface
      ═══════════════════════════════════════════════════════════════ */}
      <group ref={craniumRef} position={[0, 0.82, 0.35]}>
        {/* Main dome */}
        <mesh>
          <boxGeometry args={[1.3, 0.58, 0.7]} />
          {plateMat}
        </mesh>
        {/* Top edge lime seam */}
        <mesh position={[0, 0.29, 0]}>
          <boxGeometry args={[1.32, 0.022, 0.72]} />
          {limeMat}
        </mesh>
        {/* Wireframe overlay for depth */}
        <mesh>
          <boxGeometry args={[1.31, 0.59, 0.71]} />
          {wireMat}
        </mesh>
        {/* Circuit trace — horizontal */}
        <mesh position={[0, 0.1, 0.36]}>
          <boxGeometry args={[0.75, 0.012, 0.012]} />
          {circuitMat}
        </mesh>
        {/* Circuit trace — vertical left */}
        <mesh position={[-0.28, 0.0, 0.36]}>
          <boxGeometry args={[0.012, 0.35, 0.012]} />
          {circuitMat}
        </mesh>
        {/* Circuit trace — vertical right */}
        <mesh position={[0.28, 0.0, 0.36]}>
          <boxGeometry args={[0.012, 0.35, 0.012]} />
          {circuitMat}
        </mesh>
        {/* Inset dark panel center */}
        <mesh position={[0, 0.05, 0.36]}>
          <boxGeometry args={[0.42, 0.32, 0.01]} />
          {darkSeamMat}
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════
          3. BROW RIDGE — angular bar above visor, hard robot expression
      ═══════════════════════════════════════════════════════════════ */}
      <group ref={browRef} position={[0, 0.36, 0.58]}>
        {/* Left brow angled plate */}
        <mesh position={[-0.32, 0, 0]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.55, 0.11, 0.15]} />
          {darkPlateMat}
        </mesh>
        {/* Right brow angled plate */}
        <mesh position={[0.32, 0, 0]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[0.55, 0.11, 0.15]} />
          {darkPlateMat}
        </mesh>
        {/* Center nasal bridge bar */}
        <mesh>
          <boxGeometry args={[0.12, 0.14, 0.14]} />
          <meshStandardMaterial color={GUNMETAL} metalness={0.95} roughness={0.1} transparent opacity={0.95} />
        </mesh>
        {/* Brow edge accent seam */}
        <mesh position={[0, -0.055, 0]}>
          <boxGeometry args={[1.3, 0.014, 0.16]} />
          {limeMat}
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════
          4. LEFT TEMPORAL SKULL PLATE with ear port-hole details
      ═══════════════════════════════════════════════════════════════ */}
      <group ref={leftTempRef} position={[-0.75, 0.45, -0.1]}>
        {/* Main plate */}
        <mesh rotation={[0, 0.25, 0.1]}>
          <boxGeometry args={[0.36, 1.15, 0.92]} />
          {plateMat}
        </mesh>
        {/* Ear hub cylinder */}
        <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.19, 0.19, 0.18, 20]} />
          <meshStandardMaterial color={GUNMETAL} metalness={0.9} roughness={0.15} transparent opacity={0.95} />
        </mesh>
        {/* Port-hole ring 1 */}
        <mesh position={[-0.22, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.13, 0.014, 8, 20]} />
          {limeMat}
        </mesh>
        {/* Port-hole ring 2 */}
        <mesh position={[-0.22, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.08, 0.01, 8, 20]} />
          <meshBasicMaterial color={0xFFFFFF} transparent opacity={0.5} />
        </mesh>
        {/* Port-hole center dot */}
        <mesh position={[-0.22, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.03, 12]} />
          {limeMat}
        </mesh>
        {/* Circuit trace on plate face */}
        <mesh position={[0.05, -0.2, 0.47]}>
          <boxGeometry args={[0.012, 0.5, 0.012]} />
          {circuitMat}
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════
          5. RIGHT TEMPORAL SKULL PLATE (mirror of left)
      ═══════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════
          6. VISOR / OPTIC SCANNER — with eye sockets and iris rings
      ═══════════════════════════════════════════════════════════════ */}
      <group ref={visorRef} position={[0, 0.14, 0.58]}>
        {/* Outer visor frame */}
        <mesh>
          <boxGeometry args={[1.38, 0.34, 0.2]} />
          <meshStandardMaterial color={0x141420} metalness={0.96} roughness={0.06} transparent opacity={0.95} />
        </mesh>

        {/* ── Left Eye socket ── */}
        {/* Socket recess (dark) */}
        <mesh position={[-0.36, 0, 0.1]}>
          <boxGeometry args={[0.3, 0.24, 0.04]} />
          {darkSeamMat}
        </mesh>
        {/* Iris ring */}
        <mesh position={[-0.36, 0, 0.12]}>
          <torusGeometry args={[0.09, 0.016, 8, 24]} />
          {limeMat}
        </mesh>
        {/* Inner iris */}
        <mesh position={[-0.36, 0, 0.13]}>
          <torusGeometry args={[0.055, 0.01, 8, 24]} />
          <meshBasicMaterial color={0x88FFCC} transparent opacity={0.7} />
        </mesh>
        {/* Pupil dot */}
        <mesh position={[-0.36, 0, 0.14]}>
          <circleGeometry args={[0.028, 12]} />
          <meshBasicMaterial color={0xFFFFFF} transparent opacity={0.95} />
        </mesh>

        {/* ── Right Eye socket ── */}
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

        {/* Center divider bar between eyes */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[0.1, 0.24, 0.02]} />
          {darkPlateMat}
        </mesh>

        {/* Glowing blade running full width at bottom of visor */}
        <mesh position={[0, -0.17, 0.11]}>
          <boxGeometry args={[1.3, 0.018, 0.06]} />
          {limeMat}
        </mesh>

        {/* Edge top accent */}
        <mesh position={[0, 0.17, 0.11]}>
          <boxGeometry args={[1.3, 0.01, 0.06]} />
          <meshBasicMaterial color={0x88FFCC} transparent opacity={0.4} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════
          7. NOSE SENSOR — small protrusion with 3 vent slots
      ═══════════════════════════════════════════════════════════════ */}
      <group ref={noseRef} position={[0, -0.18, 0.58]}>
        {/* Main nose block */}
        <mesh>
          <boxGeometry args={[0.18, 0.26, 0.14]} />
          <meshStandardMaterial color={GUNMETAL} metalness={0.92} roughness={0.12} transparent opacity={0.95} />
        </mesh>
        {/* 3 vertical vent slots */}
        {[-0.045, 0, 0.045].map((xPos, i) => (
          <mesh key={i} position={[xPos, 0, 0.075]}>
            <boxGeometry args={[0.022, 0.16, 0.015]} />
            {darkSeamMat}
          </mesh>
        ))}
        {/* Tip lime sensor dot */}
        <mesh position={[0, -0.12, 0.075]}>
          <circleGeometry args={[0.018, 8]} />
          {limeMat}
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════
          8. LEFT CHEEK ARMOR with circuit traces
      ═══════════════════════════════════════════════════════════════ */}
      <group ref={leftCheekRef} position={[-0.55, -0.38, 0.4]}>
        <mesh rotation={[0.15, 0.25, 0.1]}>
          <boxGeometry args={[0.52, 0.68, 0.36]} />
          {plateMat}
        </mesh>
        <mesh rotation={[0.15, 0.25, 0.1]}>
          <boxGeometry args={[0.53, 0.69, 0.37]} />
          {wireMat}
        </mesh>
        {/* Circuit trace */}
        <mesh position={[0.12, 0.1, 0.19]}>
          <boxGeometry args={[0.22, 0.012, 0.012]} />
          {circuitMat}
        </mesh>
        {/* Accent dot */}
        <mesh position={[0.17, 0.1, 0.195]}>
          <circleGeometry args={[0.018, 8]} />
          {limeMat}
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════
          9. RIGHT CHEEK ARMOR (mirror of left)
      ═══════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════
          10. MANDIBLE / JAW + MOUTH GRILLE with backlit slots + chin vent
      ═══════════════════════════════════════════════════════════════ */}
      <group ref={jawRef} position={[0, -0.98, 0.25]}>
        {/* Left jaw plate */}
        <mesh position={[-0.45, 0.1, 0]} rotation={[0.2, 0.3, -0.3]}>
          <boxGeometry args={[0.3, 0.52, 0.32]} />
          {plateMat}
        </mesh>
        {/* Right jaw plate */}
        <mesh position={[0.45, 0.1, 0]} rotation={[0.2, -0.3, 0.3]}>
          <boxGeometry args={[0.3, 0.52, 0.32]} />
          {plateMat}
        </mesh>
        {/* Chin block */}
        <mesh position={[0, -0.15, 0.15]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.68, 0.42, 0.46]} />
          {plateMat}
        </mesh>

        {/* ── Mouth grille — 5 horizontal slots ── */}
        <group position={[0, -0.08, 0.38]}>
          {[0, -0.05, -0.1, -0.15, -0.2].map((yOff, i) => (
            <mesh key={i} position={[0, yOff, 0]}>
              <boxGeometry args={[0.44, 0.022, 0.02]} />
              {darkSeamMat}
            </mesh>
          ))}
          {/* Backlit lime glow behind slots */}
          <mesh position={[0, -0.1, -0.012]}>
            <boxGeometry args={[0.46, 0.28, 0.01]} />
            {limeMat}
          </mesh>
          {/* Grille frame */}
          <mesh position={[0, -0.1, 0.01]}>
            <boxGeometry args={[0.48, 0.3, 0.025]} />
            <meshStandardMaterial color={DARKER_METAL} metalness={0.95} roughness={0.08} transparent opacity={0.95} />
          </mesh>
        </group>

        {/* ── Chin vent — 3 vertical slots at very bottom ── */}
        <group position={[0, -0.33, 0.34]}>
          {[-0.08, 0, 0.08].map((xOff, i) => (
            <mesh key={i} position={[xOff, 0, 0]}>
              <boxGeometry args={[0.028, 0.09, 0.018]} />
              {darkSeamMat}
            </mesh>
          ))}
        </group>

        {/* Bottom lip seam glow */}
        <mesh position={[0, -0.03, 0.4]}>
          <boxGeometry args={[0.36, 0.014, 0.05]} />
          {limeMat}
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════════════
          11. CERVICAL COLLAR / SPINE BASE
      ═══════════════════════════════════════════════════════════════ */}
      <group ref={neckRef} position={[0, -1.5, -0.1]}>
        {/* Main collar cylinder */}
        <mesh rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.56, 0.42, 20]} />
          <meshStandardMaterial color={0x1E1E2C} metalness={0.9} roughness={0.3} transparent opacity={0.95} />
        </mesh>
        {/* Front cable bundle */}
        <mesh position={[0, 0.02, 0.38]}>
          <boxGeometry args={[0.14, 0.28, 0.1]} />
          <meshBasicMaterial color={WIRE_GREY} wireframe transparent opacity={0.6} />
        </mesh>
        {/* Collar ring seam */}
        <mesh position={[0, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.44, 0.012, 8, 24]} />
          {limeMat}
        </mesh>
        {/* Bottom ring seam */}
        <mesh position={[0, -0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.012, 8, 24]} />
          <meshBasicMaterial color={WIRE_GREY} transparent opacity={0.4} />
        </mesh>
      </group>

    </group>
  )
}
