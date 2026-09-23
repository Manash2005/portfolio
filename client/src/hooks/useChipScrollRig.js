/**
 * useChipScrollRig
 *
 * Drives the camera + chip object via GSAP ScrollTrigger,
 * synced to the existing Lenis smooth-scroll setup.
 *
 * Returns a ref object that AIChip and the Scene camera read each frame.
 * Values are lerped in useFrame so motion is always smooth.
 */
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ─── Named camera keyframes ──────────────────────────────────────────────── */
// Each shot: [camX, camY, camZ, lookAtX, lookAtY, lookAtZ, chipX, chipY, chipRotY]
const SHOTS = {
  hero:     { cam: [2.2, 0.2, 4.8],  chipPos: [1.4, 0, 0],   chipRotY: 0 },
  build:    { cam: [-1.8, 0.6, 3.8], chipPos: [1.0, 0, 0],   chipRotY: Math.PI * 0.35 },
  projects: { cam: [0, 0.8, 5.5],    chipPos: [2.2, -0.2, 0], chipRotY: Math.PI * 0.15 },
  activity: { cam: [4, 1, 5],        chipPos: [4.0, 0, 0],   chipRotY: Math.PI * 0.5 },
  about:    { cam: [0.5, -0.2, 3.6], chipPos: [1.0, 0, 0],   chipRotY: Math.PI * -0.2 },
  contact:  { cam: [0, 0, 4.2],      chipPos: [0, 0, 0],     chipRotY: 0 },
}


export function useChipScrollRig() {
  // Shared mutable state read by Scene each frame
  const rig = useRef({
    camPos:    [2.2, 0.2, 4.8],
    chipPos:   [1.4, 0, 0],
    chipRotY:  0,
    // Animated values — GSAP writes to these
    _target: { ...SHOTS.hero },
  })

  useEffect(() => {
    const sections = ['hero', 'build', 'projects', 'activity', 'about', 'contact']
    const triggers = []

    sections.forEach((id, i) => {
      const el = document.getElementById(id)
      if (!el) return

      const shot = SHOTS[id]

      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => {
          gsap.to(rig.current._target, {
            camPosX: shot.cam[0],
            camPosY: shot.cam[1],
            camPosZ: shot.cam[2],
            chipPosX: shot.chipPos[0],
            chipPosY: shot.chipPos[1],
            chipRotY: shot.chipRotY,
            duration: 1.6,
            ease: 'power3.inOut',
            overwrite: true,
            onUpdate: () => {
              const t = rig.current._target
              rig.current.camPos = [t.camPosX ?? shot.cam[0], t.camPosY ?? shot.cam[1], t.camPosZ ?? shot.cam[2]]
              rig.current.chipPos = [t.chipPosX ?? shot.chipPos[0], t.chipPosY ?? shot.chipPos[1], 0]
              rig.current.chipRotY = t.chipRotY ?? shot.chipRotY
            },
          })
        },
        onEnterBack: () => {
          const prevShot = SHOTS[sections[i - 1]] || shot
          gsap.to(rig.current._target, {
            camPosX: prevShot.cam[0],
            camPosY: prevShot.cam[1],
            camPosZ: prevShot.cam[2],
            chipPosX: prevShot.chipPos[0],
            chipPosY: prevShot.chipPos[1],
            chipRotY: prevShot.chipRotY,
            duration: 1.4,
            ease: 'power3.inOut',
            overwrite: true,
            onUpdate: () => {
              const t = rig.current._target
              rig.current.camPos = [t.camPosX ?? prevShot.cam[0], t.camPosY ?? prevShot.cam[1], t.camPosZ ?? prevShot.cam[2]]
              rig.current.chipPos = [t.chipPosX ?? prevShot.chipPos[0], t.chipPosY ?? prevShot.chipPos[1], 0]
              rig.current.chipRotY = t.chipRotY ?? prevShot.chipRotY
            },
          })
        },
      })

      triggers.push(st)
    })

    // Set initial _target values
    rig.current._target = {
      camPosX: SHOTS.hero.cam[0],
      camPosY: SHOTS.hero.cam[1],
      camPosZ: SHOTS.hero.cam[2],
      chipPosX: SHOTS.hero.chipPos[0],
      chipPosY: SHOTS.hero.chipPos[1],
      chipRotY: SHOTS.hero.chipRotY,
    }
    rig.current.camPos = [...SHOTS.hero.cam]
    rig.current.chipPos = [...SHOTS.hero.chipPos]
    rig.current.chipRotY = SHOTS.hero.chipRotY

    return () => triggers.forEach((t) => t.kill())
  }, [])

  return rig
}
