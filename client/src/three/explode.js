/**
 * explode.js
 *
 * Pure math helpers for the robot-head exploded-assembly animation.
 * No Three.js imports here intentionally — keeps it unit-testable and
 * framework-agnostic. Callers pass pre-allocated temp objects.
 *
 * Coordinate system matches the AgentFace scene:
 *   +X = right   +Y = up   +Z = toward camera (front of face)
 */

/** How far one unit of explodeAmount moves in world-space. Art-directible. */
export const EXPLODE_UNIT = 0.72

/**
 * Per-part config.
 * dir          – explosion direction (will be normalised once on first use)
 * dist         – relative distance multiplier (× EXPLODE_UNIT × explodeAmount)
 * rotAxis      – axis for the extra rotation (local, 'x'|'y'|'z')
 * rotAmount    – radians at full explosion (sign = direction)
 * isJaw        – true → apply the two-phase jaw logic
 * jawHinge     – jaw hinge pivot offset from jaw group origin (world-space Y)
 */
export const PARTS = {
  skull: {
    dir:       [0, 1, 0],       // rises slightly upward
    dist:      0.18,
    rotAxis:   null,
    rotAmount: 0,
  },
  facePlate: {
    dir:       [0, 0.15, 1],    // forward + slight up
    dist:      0.9,
    rotAxis:   'x',
    rotAmount: -0.14,            // tilts back ~8°
  },
  visor: {
    dir:       [0, 0, 1],       // straight forward
    dist:      1.3,
    rotAxis:   null,
    rotAmount: 0,
  },
  eyeL: {
    dir:       [-0.25, -0.15, 1],
    dist:      1.6,
    rotAxis:   null,
    rotAmount: 0,
  },
  eyeR: {
    dir:       [0.25, -0.15, 1],
    dist:      1.6,
    rotAxis:   null,
    rotAmount: 0,
  },
  jaw: {
    dir:       [0, -1, 0.6],    // down + slightly forward
    dist:      2.2,
    rotAxis:   'x',
    rotAmount: 0.65,             // hinge opens ~37°
    isJaw:     true,
  },
  antennaTip: {
    dir:       [0, 1, 0],
    dist:      2.4,
    rotAxis:   null,
    rotAmount: 0,
  },
  antennaStalk: {
    dir:       [0, 1, 0.05],    // mostly up, tiny lean
    dist:      1.1,
    rotAxis:   'z',
    rotAmount: 0.10,             // ~6° lean
  },
  sideL: {
    dir:       [-1, 0, 0],
    dist:      1.7,
    rotAxis:   'z',
    rotAmount: 0.35,             // ~20° spin
  },
  sideR: {
    dir:       [1, 0, 0],
    dist:      1.7,
    rotAxis:   'z',
    rotAmount: -0.35,
  },
  neck: {
    dir:       [0, -1, 0],
    dist:      1.0,
    rotAxis:   null,
    rotAmount: 0,
  },
  cranium: {
    dir:       [0, 1, 0.4],     // up + slightly forward
    dist:      0.8,
    rotAxis:   'x',
    rotAmount: -0.14,
  },
  brow: {
    dir:       [0, 1, 0.8],
    dist:      0.7,
    rotAxis:   null,
    rotAmount: 0,
  },
  noseBlock: {
    dir:       [0, -0.5, 1],
    dist:      1.2,
    rotAxis:   null,
    rotAmount: 0,
  },
  cheekL: {
    dir:       [-0.7, -0.5, 0.5],
    dist:      1.5,
    rotAxis:   'z',
    rotAmount: 0.4,
  },
  cheekR: {
    dir:       [0.7, -0.5, 0.5],
    dist:      1.5,
    rotAxis:   'z',
    rotAmount: -0.4,
  },
}

// Normalise all direction vectors once (modifies in place, called at module load)
;(function normaliseAll() {
  for (const key of Object.keys(PARTS)) {
    const p = PARTS[key]
    const [x, y, z] = p.dir
    const len = Math.sqrt(x * x + y * y + z * z)
    if (len > 0) p.dir = [x / len, y / len, z / len]
  }
})()

/**
 * Remap t from [inMin,inMax] to [0,1], clamped.
 */
function remap(t, inMin, inMax) {
  return Math.max(0, Math.min(1, (t - inMin) / (inMax - inMin)))
}

/**
 * Smooth-step (cubic ease-in-out).
 */
function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

/**
 * getPartTransform
 *
 * Given a PARTS key and an explodeAmount [0..1], writes the resulting
 * translation offset and extra rotation into the provided out objects.
 *
 * @param {string}   key          – key into PARTS
 * @param {number}   explodeAmt   – 0 = assembled, 1 = fully exploded
 * @param {object}   outPos       – mutable {x,y,z} — receives delta translation
 * @param {object}   outRot       – mutable {x,y,z} — receives extra rotation
 *
 * For the jaw: translation and rotation are on deliberately offset curves
 * so the hinge reads before the drift.
 */
export function getPartTransform(key, explodeAmt, outPos, outRot) {
  const p = PARTS[key]
  if (!p) { outPos.x = outPos.y = outPos.z = outRot.x = outRot.y = outRot.z = 0; return }

  let transFactor, rotFactor

  if (p.isJaw) {
    // Jaw hinge leads: rotation ramps 0→1 while explodeAmt goes 0→0.55
    // Translation lags: starts at 0.25, full at 1.0
    rotFactor   = smoothstep(remap(explodeAmt, 0,    0.55))
    transFactor = smoothstep(remap(explodeAmt, 0.25, 1.0))
  } else {
    transFactor = smoothstep(explodeAmt)
    rotFactor   = smoothstep(explodeAmt)
  }

  const dist = p.dist * EXPLODE_UNIT
  outPos.x = p.dir[0] * dist * transFactor
  outPos.y = p.dir[1] * dist * transFactor
  outPos.z = p.dir[2] * dist * transFactor

  outRot.x = 0; outRot.y = 0; outRot.z = 0
  if (p.rotAxis && p.rotAmount) {
    outRot[p.rotAxis] = p.rotAmount * rotFactor
  }
}
