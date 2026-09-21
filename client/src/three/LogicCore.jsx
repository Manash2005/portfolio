import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollProgress } from '../hooks/useScrollProgress'

const TOOL_NODES = [
  { label: 'guardrail_gate', angle: 0 },
  { label: 'tool_call',       angle: (Math.PI * 2) / 6 },
  { label: 'schema_validate', angle: ((Math.PI * 2) / 6) * 2 },
  { label: 'exec_sandbox',    angle: ((Math.PI * 2) / 6) * 3 },
  { label: 'vector_recall',   angle: ((Math.PI * 2) / 6) * 4 },
  { label: 'eval_loop',       angle: ((Math.PI * 2) / 6) * 5 },
]

export default function LogicCore() {
  const groupRef = useRef()
  const guardrailRef = useRef()
  const kernelRef = useRef()
  const innerSphereRef = useRef()
  const toolGroupRef = useRef()
  const scrollRef = useScrollProgress()

  const nodeRefs = useRef([])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const p = scrollRef.current
    const t = state.clock.elapsedTime

    // Match AgentFace positioning & dimming across sections:
    let targetX
    let targetY = 0
    let targetScale
    let targetOpacity

    if (p < 0.15) {
      targetX = THREE.MathUtils.lerp(1.5, 1.2, p / 0.15)
      targetScale = 1.15
      targetOpacity = 0.85
    } else if (p < 0.35) {
      const tProgress = (p - 0.15) / 0.20
      targetX = THREE.MathUtils.lerp(1.2, -1.9, tProgress)
      targetScale = THREE.MathUtils.lerp(1.15, 0.5, tProgress)
      targetOpacity = THREE.MathUtils.lerp(0.85, 0.12, tProgress)
    } else if (p < 0.55) {
      targetX = -1.9
      targetScale = 0.45
      targetOpacity = 0.08
    } else if (p < 0.75) {
      const tProgress = (p - 0.55) / 0.20
      targetX = THREE.MathUtils.lerp(-1.9, 1.5, tProgress)
      targetScale = THREE.MathUtils.lerp(0.45, 0.95, tProgress)
      targetOpacity = THREE.MathUtils.lerp(0.08, 0.95, tProgress)
    } else if (p < 0.88) {
      const tProgress = (p - 0.75) / 0.13
      targetX = THREE.MathUtils.lerp(1.5, -1.5, tProgress)
      targetScale = 0.8
      targetOpacity = 0.75
    } else {
      const tProgress = (p - 0.88) / 0.12
      targetX = THREE.MathUtils.lerp(-1.5, 0, tProgress)
      targetY = -0.2
      targetScale = 0.7
      targetOpacity = 0.85
    }

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05)
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05)
    )

    // Dismantling / logic reveal factor (0 to 1)
    const reveal = THREE.MathUtils.smoothstep(p, 0.14, 0.65)

    // 1. Guardrail Lattice (Deterministic Safety Barrier):
    if (guardrailRef.current) {
      guardrailRef.current.rotation.y += delta * 0.4
      guardrailRef.current.rotation.x += delta * 0.18
      const guardrailScale = THREE.MathUtils.lerp(0.85, 1.45, reveal)
      guardrailRef.current.scale.setScalar(guardrailScale)
      if (guardrailRef.current.material) {
        guardrailRef.current.material.opacity = THREE.MathUtils.lerp(
          0.3,
          0.9 * targetOpacity,
          reveal
        )
      }
    }

    // 2. Neural Kernel (LLM reasoning center):
    if (kernelRef.current) {
      kernelRef.current.rotation.y -= delta * 0.3
      const pulse = 1 + Math.sin(t * 3.5) * 0.08
      const kernelScale = THREE.MathUtils.lerp(0.6, 0.85, reveal) * pulse
      kernelRef.current.scale.setScalar(kernelScale)
    }

    if (innerSphereRef.current && innerSphereRef.current.material) {
      innerSphereRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
        1.0,
        2.5 + Math.sin(t * 4) * 0.6,
        reveal
      )
    }

    // 3. Tool Calling Matrix:
    if (toolGroupRef.current) {
      toolGroupRef.current.rotation.y = t * 0.22
      const orbitRadius = THREE.MathUtils.lerp(0.7, 1.85, reveal)

      TOOL_NODES.forEach((node, i) => {
        const mesh = nodeRefs.current[i]
        if (!mesh) return
        const angle = node.angle + t * 0.15
        mesh.position.x = Math.cos(angle) * orbitRadius
        mesh.position.z = Math.sin(angle) * orbitRadius
        mesh.position.y = Math.sin(angle * 2 + t) * 0.25
        mesh.rotation.y = -angle
        mesh.scale.setScalar(THREE.MathUtils.lerp(0.01, 1, reveal))
      })
    }
  })

  return (
    <group ref={groupRef} position={[1.5, 0, 0]}>
      {/* 1. Deterministic Guardrails Lattice Cage (Gatekeeper) */}
      <mesh ref={guardrailRef} position={[0, 0.15, 0]}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshBasicMaterial
          color={0xB8FF3C}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Guardrail vertex nodes */}
      <mesh position={[0, 0.15, 0]}>
        <octahedronGeometry args={[1.05, 0]} />
        <meshBasicMaterial
          color={0x7B68EE}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* 2. Neural Kernel (Synthetic Brain) */}
      <group ref={kernelRef} position={[0, 0.15, 0]}>
        {/* Core Glowing Sphere */}
        <mesh ref={innerSphereRef}>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial
            color={0x201838}
            emissive={0x6C5CFF}
            emissiveIntensity={1.8}
            roughness={0.2}
            metalness={0.7}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Neural synapse wireframe shell */}
        <mesh>
          <dodecahedronGeometry args={[0.52, 0]} />
          <meshBasicMaterial
            color={0xB8FF3C}
            wireframe
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>

      {/* 3. Tool Calling Matrix (Floating functional chips) */}
      <group ref={toolGroupRef} position={[0, 0.15, 0]}>
        {TOOL_NODES.map((node, i) => (
          <group
            key={node.label}
            ref={(el) => (nodeRefs.current[i] = el)}
            position={[Math.cos(node.angle) * 0.7, 0, Math.sin(node.angle) * 0.7]}
          >
            {/* Logic Chip Plate */}
            <mesh>
              <boxGeometry args={[0.22, 0.1, 0.04]} />
              <meshStandardMaterial
                color={0x1C1C2C}
                metalness={0.9}
                roughness={0.25}
              />
            </mesh>
            {/* Chip Lime Status LED */}
            <mesh position={[0, 0, 0.025]}>
              <boxGeometry args={[0.16, 0.04, 0.01]} />
              <meshBasicMaterial color={0xB8FF3C} />
            </mesh>
          </group>
        ))}

        {/* Orbital bus track */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.85, 0.008, 6, 64]} />
          <meshBasicMaterial
            color={0xB8FF3C}
            transparent
            opacity={0.3}
          />
        </mesh>
      </group>
    </group>
  )
}
