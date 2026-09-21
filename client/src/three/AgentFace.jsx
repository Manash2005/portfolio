import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollProgress } from '../hooks/useScrollProgress'

export default function AgentFace({ mouseRef }) {
  const groupRef = useRef()
  const craniumRef = useRef()
  const leftTempRef = useRef()
  const rightTempRef = useRef()
  const visorRef = useRef()
  const leftCheekRef = useRef()
  const rightCheekRef = useRef()
  const jawRef = useRef()
  const neckRef = useRef()

  const scrollRef = useScrollProgress()

  useFrame((state) => {
    if (!groupRef.current) return
    const p = scrollRef.current
    const mx = mouseRef?.current?.x ?? 0
    const my = mouseRef?.current?.y ?? 0

    // Gentle idle sway and mouse parallax
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mx * 0.3 + Math.sin(state.clock.elapsedTime * 0.5) * 0.04,
      0.06
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -my * 0.2 + Math.cos(state.clock.elapsedTime * 0.7) * 0.02,
      0.06
    )

    // Position head across screen as user scrolls:
    // Hero (0 - 0.15): Prominent on right
    // Projects (0.15 - 0.35): Dims and recedes to left
    // Activity (0.35 - 0.55): Dims and recedes deeply behind/left so Skyline is primary
    // Build (0.55 - 0.75): Exploded logic reveal on right
    // About (0.75 - 0.88): Left side
    // Contact (0.88 - 1.0): Center
    let targetX
    let targetY = 0
    let targetScale
    let targetOpacity

    if (p < 0.15) {
      targetX = THREE.MathUtils.lerp(1.5, 1.2, p / 0.15)
      targetScale = 1.15
      targetOpacity = 0.95
    } else if (p < 0.35) {
      const t = (p - 0.15) / 0.20
      targetX = THREE.MathUtils.lerp(1.2, -1.9, t)
      targetScale = THREE.MathUtils.lerp(1.15, 0.5, t)
      targetOpacity = THREE.MathUtils.lerp(0.95, 0.12, t)
    } else if (p < 0.55) {
      targetX = -1.9
      targetScale = 0.45
      targetOpacity = 0.08
    } else if (p < 0.75) {
      const t = (p - 0.55) / 0.20
      targetX = THREE.MathUtils.lerp(-1.9, 1.5, t)
      targetScale = THREE.MathUtils.lerp(0.45, 0.95, t)
      targetOpacity = THREE.MathUtils.lerp(0.08, 0.85, t)
    } else if (p < 0.88) {
      const t = (p - 0.75) / 0.13
      targetX = THREE.MathUtils.lerp(1.5, -1.5, t)
      targetScale = 0.8
      targetOpacity = 0.75
    } else {
      const t = (p - 0.88) / 0.12
      targetX = THREE.MathUtils.lerp(-1.5, 0, t)
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

    // 1. Forehead / Cranium: explodes UP and FORWARD
    if (craniumRef.current) {
      craniumRef.current.position.y = THREE.MathUtils.lerp(0.8, 0.8 + dismantle * 1.5, 0.08)
      craniumRef.current.position.z = THREE.MathUtils.lerp(0.35, 0.35 + dismantle * 0.9, 0.08)
      craniumRef.current.rotation.x = THREE.MathUtils.lerp(0, -dismantle * 0.35, 0.08)
    }

    // 2. Left Temporal plate: slides LEFT and BACK
    if (leftTempRef.current) {
      leftTempRef.current.position.x = THREE.MathUtils.lerp(-0.75, -0.75 - dismantle * 1.6, 0.08)
      leftTempRef.current.position.z = THREE.MathUtils.lerp(-0.1, -0.1 - dismantle * 0.8, 0.08)
      leftTempRef.current.rotation.y = THREE.MathUtils.lerp(0.2, 0.2 - dismantle * 0.45, 0.08)
    }

    // 3. Right Temporal plate: slides RIGHT and BACK
    if (rightTempRef.current) {
      rightTempRef.current.position.x = THREE.MathUtils.lerp(0.75, 0.75 + dismantle * 1.6, 0.08)
      rightTempRef.current.position.z = THREE.MathUtils.lerp(-0.1, -0.1 - dismantle * 0.8, 0.08)
      rightTempRef.current.rotation.y = THREE.MathUtils.lerp(-0.2, -0.2 + dismantle * 0.45, 0.08)
    }

    // 4. Visor optics: pushes FORWARD and EXPANDS
    if (visorRef.current) {
      visorRef.current.position.z = THREE.MathUtils.lerp(0.55, 0.55 + dismantle * 1.1, 0.08)
      visorRef.current.scale.x = THREE.MathUtils.lerp(1, 1 + dismantle * 0.5, 0.08)
    }

    // 5. Left Cheek: slides DOWN, LEFT and OUT
    if (leftCheekRef.current) {
      leftCheekRef.current.position.x = THREE.MathUtils.lerp(-0.55, -0.55 - dismantle * 1.3, 0.08)
      leftCheekRef.current.position.y = THREE.MathUtils.lerp(-0.35, -0.35 - dismantle * 1.1, 0.08)
      leftCheekRef.current.position.z = THREE.MathUtils.lerp(0.4, 0.4 + dismantle * 0.6, 0.08)
      leftCheekRef.current.rotation.z = THREE.MathUtils.lerp(0.1, 0.1 + dismantle * 0.35, 0.08)
    }

    // 6. Right Cheek: slides DOWN, RIGHT and OUT
    if (rightCheekRef.current) {
      rightCheekRef.current.position.x = THREE.MathUtils.lerp(0.55, 0.55 + dismantle * 1.3, 0.08)
      rightCheekRef.current.position.y = THREE.MathUtils.lerp(-0.35, -0.35 - dismantle * 1.1, 0.08)
      rightCheekRef.current.position.z = THREE.MathUtils.lerp(0.4, 0.4 + dismantle * 0.6, 0.08)
      rightCheekRef.current.rotation.z = THREE.MathUtils.lerp(-0.1, -0.1 - dismantle * 0.35, 0.08)
    }

    // 7. Jaw & Chin: slides DOWN and OUT
    if (jawRef.current) {
      jawRef.current.position.y = THREE.MathUtils.lerp(-0.95, -0.95 - dismantle * 1.8, 0.08)
      jawRef.current.position.z = THREE.MathUtils.lerp(0.25, 0.25 + dismantle * 0.7, 0.08)
      jawRef.current.rotation.x = THREE.MathUtils.lerp(0.15, 0.15 + dismantle * 0.3, 0.08)
    }

    // 8. Neck collar: drops DOWN
    if (neckRef.current) {
      neckRef.current.position.y = THREE.MathUtils.lerp(-1.45, -1.45 - dismantle * 1.2, 0.08)
    }

    // Update opacity across all meshes in group
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material && child.material.transparent) {
        child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.06)
      }
    })
  })

  // Plate styling: Brushed Titanium with visible bevel edges and metallic pop
  const plateMat = (
    <meshStandardMaterial
      color={0x2E3042}
      roughness={0.22}
      metalness={0.88}
      transparent
      opacity={0.95}
    />
  )

  const wireMat = (
    <meshBasicMaterial
      color={0x7A829E}
      wireframe
      transparent
      opacity={0.4}
    />
  )

  return (
    <group ref={groupRef} position={[1.5, 0, 0]}>
      {/* 1. Forehead / Cranium Dome */}
      <group ref={craniumRef} position={[0, 0.8, 0.35]}>
        <mesh>
          <boxGeometry args={[1.3, 0.55, 0.7]} />
          {plateMat}
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[1.32, 0.04, 0.72]} />
          <meshBasicMaterial color={0xB8FF3C} transparent opacity={0.65} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.31, 0.56, 0.71]} />
          {wireMat}
        </mesh>
      </group>

      {/* 2. Left Temporal Skull Plate */}
      <group ref={leftTempRef} position={[-0.75, 0.45, -0.1]}>
        <mesh rotation={[0, 0.25, 0.1]}>
          <boxGeometry args={[0.35, 1.1, 0.9]} />
          {plateMat}
        </mesh>
        <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.15, 16]} />
          <meshStandardMaterial color={0x40445A} metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* 3. Right Temporal Skull Plate */}
      <group ref={rightTempRef} position={[0.75, 0.45, -0.1]}>
        <mesh rotation={[0, -0.25, -0.1]}>
          <boxGeometry args={[0.35, 1.1, 0.9]} />
          {plateMat}
        </mesh>
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.15, 16]} />
          <meshStandardMaterial color={0x40445A} metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* 4. Cybernetic Visor / Optic Scanner */}
      <group ref={visorRef} position={[0, 0.22, 0.55]}>
        {/* Outer Visor Frame */}
        <mesh>
          <boxGeometry args={[1.38, 0.3, 0.22]} />
          <meshStandardMaterial color={0x141420} metalness={0.95} roughness={0.08} />
        </mesh>
        {/* Vibrant Glowing Visor Blade */}
        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[1.3, 0.16, 0.05]} />
          <meshBasicMaterial color={0xB8FF3C} />
        </mesh>
        {/* Left & Right High-Intensity Ocular Nodes */}
        <mesh position={[-0.35, 0, 0.14]}>
          <circleGeometry args={[0.07, 16]} />
          <meshBasicMaterial color={0xFFFFFF} />
        </mesh>
        <mesh position={[0.35, 0, 0.14]}>
          <circleGeometry args={[0.07, 16]} />
          <meshBasicMaterial color={0xFFFFFF} />
        </mesh>
      </group>

      {/* 5. Left Zygomatic / Cheek Armor */}
      <group ref={leftCheekRef} position={[-0.55, -0.35, 0.4]}>
        <mesh rotation={[0.15, 0.25, 0.1]}>
          <boxGeometry args={[0.5, 0.65, 0.35]} />
          {plateMat}
        </mesh>
        <mesh rotation={[0.15, 0.25, 0.1]}>
          <boxGeometry args={[0.51, 0.66, 0.36]} />
          {wireMat}
        </mesh>
      </group>

      {/* 6. Right Zygomatic / Cheek Armor */}
      <group ref={rightCheekRef} position={[0.55, -0.35, 0.4]}>
        <mesh rotation={[0.15, -0.25, -0.1]}>
          <boxGeometry args={[0.5, 0.65, 0.35]} />
          {plateMat}
        </mesh>
        <mesh rotation={[0.15, -0.25, -0.1]}>
          <boxGeometry args={[0.51, 0.66, 0.36]} />
          {wireMat}
        </mesh>
      </group>

      {/* 7. Mandible / Jaw & Chin Module */}
      <group ref={jawRef} position={[0, -0.95, 0.25]}>
        <mesh position={[0, -0.15, 0.15]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.65, 0.4, 0.45]} />
          {plateMat}
        </mesh>
        <mesh position={[-0.45, 0.1, 0]} rotation={[0.2, 0.3, -0.3]}>
          <boxGeometry args={[0.3, 0.5, 0.3]} />
          {plateMat}
        </mesh>
        <mesh position={[0.45, 0.1, 0]} rotation={[0.2, -0.3, 0.3]}>
          <boxGeometry args={[0.3, 0.5, 0.3]} />
          {plateMat}
        </mesh>
        <mesh position={[0, -0.3, 0.3]}>
          <boxGeometry args={[0.35, 0.05, 0.06]} />
          <meshBasicMaterial color={0xB8FF3C} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* 8. Cervical Collar / Spine Base */}
      <group ref={neckRef} position={[0, -1.45, -0.1]}>
        <mesh rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.55, 0.4, 16]} />
          <meshStandardMaterial color={0x1E1E2C} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.05, 0.35]}>
          <boxGeometry args={[0.12, 0.3, 0.1]} />
          <meshBasicMaterial color={0x7A829E} wireframe />
        </mesh>
      </group>
    </group>
  )
}
