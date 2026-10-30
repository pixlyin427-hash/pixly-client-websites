// Procedural SONIQ product models — built from primitives, no external 3D assets.
// These are original, simplified concept models (not manufacturer geometry).
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'

const V2 = THREE.Vector2
const V3 = THREE.Vector3

/* ---------- materials ---------- */
// Colour lerps toward the selected finish, so choosing a swatch visibly re-finishes the product.
function Mat({ color, snap, emissive, ei = 0, ...p }) {
  const ref = useRef()
  const init = useRef(color).current
  const target = useMemo(() => new THREE.Color(), [])
  const tEm = useMemo(() => new THREE.Color(), [])
  useFrame((_, dt) => {
    const m = ref.current
    if (!m) return
    target.set(color)
    const k = snap ? 1 : 1 - Math.exp(-dt * 8)
    m.color.lerp(target, k)
    if (emissive) { tEm.set(emissive); m.emissive.lerp(tEm, k) }
  })
  return <meshPhysicalMaterial ref={ref} color={init} emissive={emissive ? init : '#000'} emissiveIntensity={ei} toneMapped={false} {...p} />
}
const Body = (p) => <Mat roughness={0.42} metalness={0.12} clearcoat={0.35} clearcoatRoughness={0.4} {...p} />
const Soft = (p) => <Mat roughness={0.9} metalness={0} sheen={0.35} sheenColor="#7c5bd0" sheenRoughness={0.7} {...p} />
const Metal = (p) => <Mat roughness={0.28} metalness={1} {...p} />
const Glow = ({ color, ei = 2.2, snap }) => <Mat color={color} emissive={color} ei={ei} roughness={0.4} metalness={0} snap={snap} />

function lathe(pts) {
  return new THREE.LatheGeometry(pts.map(([x, y]) => new V2(x, y)), 56)
}
// disc / rounded puck profile (axis = Y). Ordered bottom → top.
function puck(r, h, b, seg = 6) {
  const out = [[0, -h / 2]]
  out.push([r - b, -h / 2])
  for (let i = 1; i <= seg; i++) { const a = (i / seg) * Math.PI / 2; out.push([r - b + Math.sin(a) * b, -h / 2 + b - Math.cos(a) * b]) }
  for (let i = 1; i <= seg; i++) { const a = (i / seg) * Math.PI / 2; out.push([r - b + Math.cos(a) * b, h / 2 - b + Math.sin(a) * b]) }
  out.push([r - b, h / 2], [0, h / 2])
  return out
}

function canvasTex(draw, size = 128, repeat = [1, 1]) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d'), size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(...repeat)
  t.anisotropy = 4
  return t
}
const dotTex = (rep) => canvasTex((g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); g.fillStyle = '#000'; const n = 8; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.beginPath(); g.arc((x + 0.5 + (y % 2) * 0.5) * s / n, (y + 0.5) * s / n, s / n * 0.28, 0, 7); g.fill() } }, 128, rep)
const weaveTex = (rep) => canvasTex((g, s) => { g.fillStyle = '#888'; g.fillRect(0, 0, s, s); g.fillStyle = '#ccc'; for (let i = 0; i < s; i += 8) { g.fillRect(i, 0, 4, s); g.fillRect(0, i, s, 4) } }, 128, rep)

/* ---------- headphones ---------- */
const HP = {
  one: { r: 0.64, h: 0.44, x: 1.04, rise: 0.95, band: 0.078, ring: true },
  air: { r: 0.57, h: 0.34, x: 0.98, rise: 0.88, band: 0.055, ring: false },
  arc: { r: 0.6, h: 0.5, x: 1.02, rise: 0.92, band: 0.07, ring: false },
}

function Cup({ side, v, c, snap }) {
  const s = HP[v]
  const geo = useMemo(() => lathe(puck(s.r, s.h, s.h * 0.34)), [s])
  const R = s.r * 0.74
  const t = s.r * 0.26
  return (
    <group position={[side * s.x, 0, 0]} rotation={[0, 0, -side * Math.PI / 2]}>
      <mesh geometry={geo}><Body color={c.body} snap={snap} /></mesh>
      {/* outer plate */}
      <mesh position={[0, s.h / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[s.r * 0.62, 48]} />
        <Mat color={c.light ? '#d6d0e6' : '#0f0c16'} snap={snap} roughness={0.55} metalness={0.3} />
      </mesh>
      {s.ring && (
        <mesh position={[0, s.h / 2 + 0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[s.r * 0.5, 0.02, 12, 64]} /><Glow color={c.accent} snap={snap} />
        </mesh>
      )}
      <mesh position={[0, s.h / 2 + 0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[s.r * 0.3, 0.008, 8, 48]} /><Metal color={c.metal} snap={snap} />
      </mesh>
      {/* cushion */}
      <mesh position={[0, -s.h / 2 - 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.85]}>
        <torusGeometry args={[R, t, 24, 56]} /><Soft color={c.cushion} snap={snap} />
      </mesh>
      <mesh position={[0, -s.h / 2 - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R, 40]} /><meshStandardMaterial color="#0b0910" roughness={1} />
      </mesh>
    </group>
  )
}

function Headphones({ variant, c, snap }) {
  const s = HP[variant]
  const top = s.r + 0.05
  const band = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 40; i++) { const th = Math.PI - (i / 40) * Math.PI; pts.push(new V3(s.x * Math.cos(th), top + s.rise * Math.sin(th), 0)) }
    return new THREE.CatmullRomCurve3(pts)
  }, [s, top])
  const pad = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 20; i++) { const th = Math.PI * (0.78 - (i / 20) * 0.56); pts.push(new V3(s.x * Math.cos(th) * 0.985, top + s.rise * Math.sin(th) * 0.985 - 0.085, 0)) }
    return new THREE.CatmullRomCurve3(pts)
  }, [s, top])
  const cable = useMemo(() => new THREE.CatmullRomCurve3([new V3(-s.x - 0.02, -0.62, 0.12), new V3(-s.x - 0.25, -1.1, 0.35), new V3(-0.7, -1.6, 0.6), new V3(0.3, -1.75, 0.5)]), [s])
  return (
    <group position={[0, -0.55, 0]}>
      <Cup side={1} v={variant} c={c} snap={snap} />
      <Cup side={-1} v={variant} c={c} snap={snap} />
      <mesh scale={[1, 1, 1.9]}><tubeGeometry args={[band, 80, s.band, 14, false]} /><Body color={c.body} snap={snap} /></mesh>
      <mesh scale={[1, 1, 1.75]}><tubeGeometry args={[pad, 40, s.band * 1.15, 14, false]} /><Soft color={c.cushion} snap={snap} /></mesh>
      {[1, -1].map((side) => (
        <group key={side} position={[side * s.x, 0, 0]}>
          {variant === 'one' && (
            <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[s.r + 0.05, 0.04, 12, 56, Math.PI]} /><Metal color={c.metal} snap={snap} /></mesh>
          )}
          {variant === 'air' && (
            <>
              <mesh position={[0, top - 0.2, 0]}><cylinderGeometry args={[0.032, 0.032, 0.4, 12]} /><Metal color={c.metal} snap={snap} /></mesh>
              <mesh position={[0, top * 0.45, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 0.1, 16]} /><Metal color={c.metal} snap={snap} /></mesh>
            </>
          )}
          {variant === 'arc' && (
            <>
              <mesh position={[0, top - 0.25, 0]}><cylinderGeometry args={[0.045, 0.045, 0.7, 12]} /><Metal color={c.metal} snap={snap} /></mesh>
              {[0.0, 0.14, 0.28].map((o) => (
                <mesh key={o} position={[0, top - 0.5 + o, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.052, 0.008, 8, 20]} /><Metal color={c.metal} snap={snap} /></mesh>
              ))}
              <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, 0.12, 16]} /><Metal color={c.metal} snap={snap} /></mesh>
            </>
          )}
        </group>
      ))}
      {variant === 'arc' && (
        <group>
          <mesh><tubeGeometry args={[cable, 48, 0.028, 8, false]} /><meshStandardMaterial color="#1b1724" roughness={0.7} /></mesh>
          <mesh position={[0.35, -1.75, 0.5]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.4, 14]} /><Metal color={c.metal} snap={snap} /></mesh>
        </group>
      )}
    </group>
  )
}

/* ---------- earbuds ---------- */
function Bud({ c, snap, stem, lite }) {
  return (
    <group>
      <mesh scale={lite ? [0.2, 0.17, 0.25] : [0.19, 0.19, 0.19]}><sphereGeometry args={[1, 28, 20]} /><Body color={c.body} snap={snap} /></mesh>
      {stem && (
        <mesh position={[0, -0.26, 0.02]} rotation={[0.15, 0, 0]}><capsuleGeometry args={[0.055, 0.36, 6, 14]} /><Body color={c.body} snap={snap} /></mesh>
      )}
      <mesh position={[0, 0.0, lite ? 0.21 : 0.17]} rotation={[0, 0, 0]}><circleGeometry args={[0.05, 20]} /><Metal color={c.metal} snap={snap} /></mesh>
    </group>
  )
}

export function Earbuds({ variant, c, open, snap }) {
  const lid = useRef()
  const lite = variant === 'lite'
  const pro = variant === 'pro'
  const amt = useRef(open ? 1 : 0)
  useFrame((_, dt) => {
    amt.current += ((open ? 1 : 0) - amt.current) * (snap ? 1 : 1 - Math.exp(-dt * 4.5))
    if (lid.current) lid.current.rotation.x = -amt.current * 1.6
  })
  const cut = Math.PI * 0.36
  const cy = Math.cos(cut) * 0.8
  const cr = Math.sin(cut)
  return (
    <group position={[0, -0.25, 0]} scale={lite ? 1.15 : 1.25}>
      {pro ? (
        <group scale={[1.15, 0.8, 0.9]}>
          <mesh><sphereGeometry args={[1, 56, 36, 0, Math.PI * 2, cut, Math.PI - cut]} /><Body color={c.body} snap={snap} side={THREE.DoubleSide} /></mesh>
        </group>
      ) : (
        <RoundedBox args={[1.9, 0.62, 1.2]} radius={0.28} smoothness={5} position={[0, -0.05, 0]}><Body color={c.body} snap={snap} /></RoundedBox>
      )}
      {/* cavity floor */}
      <mesh position={[0, pro ? cy : 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={pro ? [1.15 * cr, 0.9 * cr, 1] : [1, 1, 1]}>
        {pro ? <circleGeometry args={[1, 48]} /> : <planeGeometry args={[1.62, 0.92]} />}
        <meshStandardMaterial color="#0c0912" roughness={0.9} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 0.4, (pro ? cy : 0.26) + 0.1, 0.05]} rotation={[0, 0, -sd * 0.12]}>
          <Bud c={c} snap={snap} stem={pro} lite={lite} />
        </group>
      ))}
      {/* lid */}
      <group ref={lid} position={pro ? [0, cy, -cr * 0.9] : [0, 0.26, -0.55]}>
        {pro ? (
          <group position={[0, -cy, cr * 0.9]} scale={[1.15, 0.8, 0.9]}>
            <mesh><sphereGeometry args={[1, 56, 24, 0, Math.PI * 2, 0, cut]} /><Body color={c.body} snap={snap} side={THREE.DoubleSide} /></mesh>
            <mesh position={[0, 0.98, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.2, 32]} /><Mat color={c.light ? '#cfc8e2' : '#0f0c16'} snap={snap} roughness={0.4} metalness={0.4} /></mesh>
            <mesh position={[0, 0.985, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.14, 0.012, 8, 32]} /><Glow color={c.accent} ei={1.6} snap={snap} /></mesh>
          </group>
        ) : (
          <RoundedBox args={[1.9, 0.4, 1.2]} radius={0.22} smoothness={5} position={[0, 0.2, 0.55]}><Body color={c.body} snap={snap} /></RoundedBox>
        )}
      </group>
    </group>
  )
}

/* ---------- speakers ---------- */
function Waves({ color, base = 1, count = 3 }) {
  const refs = useRef([])
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = ((clock.elapsedTime * 0.35 + i / count) % 1)
      m.scale.setScalar(base * (1 + t * 1.5))
      m.material.opacity = (1 - t) * 0.5
    })
  })
  return (
    <group position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <ringGeometry args={[0.98, 1, 96]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function Speaker({ variant, c, snap, waves }) {
  const aura = variant === 'aura'
  const grille = useMemo(() => dotTex(aura ? [8, 4] : [6, 2]), [aura])
  const weave = useMemo(() => weaveTex([5, 3]), [])
  const body = useMemo(() => (aura ? new THREE.CylinderGeometry(0.72, 0.72, 1.7, 64, 1, true) : lathe([[0, -0.5], [0.52, -0.5], [0.62, -0.4], [0.64, 0.1], [0.58, 0.45], [0.42, 0.66], [0.18, 0.74], [0, 0.75]])), [aura])
  return (
    <group position={[0, aura ? 0.05 : -0.1, 0]} scale={aura ? 1 : 1.55}>
      {aura ? (
        <>
          <mesh geometry={body}><Mat color={c.body} snap={snap} roughness={0.65} metalness={0.3} bumpMap={grille} bumpScale={1.6} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 0.86, 0]}><cylinderGeometry args={[0.745, 0.745, 0.14, 64]} /><Metal color={c.metal} snap={snap} /></mesh>
          <mesh position={[0, 0.934, 0]}><cylinderGeometry args={[0.55, 0.58, 0.03, 48]} /><Mat color={c.light ? '#cfc8e0' : '#0f0c16'} snap={snap} roughness={0.5} metalness={0.2} /></mesh>
          {[-0.28, 0, 0.28].map((x, i) => (
            <mesh key={i} position={[x, 0.96, 0.02]}><cylinderGeometry args={[0.075, 0.075, 0.03, 24]} /><Metal color={c.metal} snap={snap} /></mesh>
          ))}
          <mesh position={[0, 0.945, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.45, 0.014, 8, 64]} /><Glow color={c.accent} snap={snap} /></mesh>
          <mesh position={[0, -0.84, 0]}><cylinderGeometry args={[0.74, 0.76, 0.12, 64]} /><Metal color={c.metal} snap={snap} /></mesh>
          <mesh position={[0, -0.72, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.735, 0.016, 8, 96]} /><Glow color={c.accent} ei={2.4} snap={snap} /></mesh>
        </>
      ) : (
        <>
          <mesh geometry={body}><Mat color={c.body} snap={snap} roughness={0.95} metalness={0} bumpMap={weave} bumpScale={0.9} sheen={1} sheenColor="#ffffff" sheenRoughness={0.7} /></mesh>
          <mesh position={[0, -0.47, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.575, 0.018, 8, 80]} /><Glow color={c.accent} snap={snap} /></mesh>
          <mesh position={[0, 0.78, 0]} rotation={[0.2, 0, 0]}><torusGeometry args={[0.2, 0.038, 14, 40]} /><Mat color={c.accent} snap={snap} roughness={0.6} /></mesh>
          <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.16, 0.18, 0.06, 28]} /><Metal color={c.metal} snap={snap} /></mesh>
        </>
      )}
      {waves && <Waves color={c.accent === '#7C3AED' ? '#a98bff' : c.accent} base={aura ? 1.2 : 0.8} />}
    </group>
  )
}

/* ---------- LINK DAC ---------- */
function Dac({ c, snap }) {
  const cable = useMemo(() => new THREE.CatmullRomCurve3([new V3(-1.55, 0.08, 0), new V3(-1.95, -0.3, 0.3), new V3(-1.3, -0.62, 0.25), new V3(-0.75, -0.12, 0.05), new V3(-0.5, 0, 0)]), [])
  return (
    <group scale={1.15} position={[0.1, 0, 0]}>
      <RoundedBox args={[1.2, 0.3, 0.3]} radius={0.12} smoothness={5} position={[0.1, 0, 0]}><Metal color={c.body} snap={snap} /></RoundedBox>
      <mesh position={[0.1, 0.153, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.7, 0.04]} /><Glow color="#C4B5FD" ei={1.2} snap={snap} /></mesh>
      <mesh><tubeGeometry args={[cable, 48, 0.045, 10, false]} /><meshStandardMaterial color="#2b2638" roughness={0.6} /></mesh>
      <RoundedBox args={[0.42, 0.13, 0.26]} radius={0.05} smoothness={4} position={[-1.7, 0.08, 0]}><Metal color={c.metal} snap={snap} /></RoundedBox>
      <RoundedBox args={[0.2, 0.08, 0.2]} radius={0.03} smoothness={3} position={[-1.95, 0.08, 0]}><meshStandardMaterial color="#0d0a14" roughness={0.8} /></RoundedBox>
      {/* 3.5 mm jack inserted at the output end */}
      <mesh position={[0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, 0.5, 20]} /><Metal color={c.metal} snap={snap} /></mesh>
      <mesh position={[1.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.11, 0.11, 0.3, 20]} /><meshStandardMaterial color="#1a1624" roughness={0.6} /></mesh>
    </group>
  )
}

/* ---------- accessories ---------- */
function Pouch({ c, snap }) {
  const weave = useMemo(() => weaveTex([4, 3]), [])
  return (
    <group rotation={[0, 0, 0]} scale={1.15}>
      <RoundedBox args={[2.1, 1.25, 0.62]} radius={0.28} smoothness={6}>
        <Mat color={c.body} snap={snap} roughness={0.95} bumpMap={weave} bumpScale={0.8} sheen={1} sheenColor="#a78bfa" sheenRoughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.47, 0]}><boxGeometry args={[1.5, 0.035, 0.64]} /><Metal color="#8d86a0" snap={snap} /></mesh>
      <mesh position={[0.75, 0.38, 0.32]} rotation={[0, 0, 0.3]}><torusGeometry args={[0.1, 0.025, 10, 28]} /><Glow color={c.accent} ei={1.2} snap={snap} /></mesh>
    </group>
  )
}
function Cushions({ c, snap }) {
  return (
    <group rotation={[0.25, -0.35, 0]}>
      {[-0.8, 0.8].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh scale={[1, 1, 0.9]}><torusGeometry args={[0.62, 0.23, 26, 56]} /><Soft color={c.body} snap={snap} /></mesh>
        </group>
      ))}
    </group>
  )
}
function Cable({ c, snap }) {
  const path = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 60; i++) { const t = i / 60; const a = t * Math.PI * 2.1 - 0.4; pts.push(new V3(-1.7 + t * 3.4, Math.sin(a * 1.6) * 0.5, Math.cos(a * 1.6) * 0.45)) }
    return new THREE.CatmullRomCurve3(pts)
  }, [])
  const a = path.getPoint(0), b = path.getPoint(1)
  return (
    <group scale={1.1}>
      <mesh><tubeGeometry args={[path, 140, 0.06, 10, false]} /><Mat color={c.body} snap={snap} roughness={0.7} /></mesh>
      {[a, b].map((p, i) => (<RoundedBox key={i} args={[0.34, 0.12, 0.22]} radius={0.04} smoothness={3} position={[p.x + (i ? 0.12 : -0.12), p.y, p.z]}><Metal color="#a49db4" snap={snap} /></RoundedBox>))}
    </group>
  )
}
function Coil({ c, snap }) {
  const path = useMemo(() => {
    const pts = [new V3(-1.9, 0, 0), new V3(-1.5, 0, 0)]
    for (let i = 0; i <= 90; i++) { const t = i / 90; const a = t * Math.PI * 2 * 9; pts.push(new V3(-1.3 + t * 2.6, Math.sin(a) * 0.34, Math.cos(a) * 0.34)) }
    pts.push(new V3(1.5, 0, 0), new V3(1.9, 0, 0))
    return new THREE.CatmullRomCurve3(pts)
  }, [])
  return (
    <group>
      <mesh><tubeGeometry args={[path, 420, 0.045, 8, false]} /><Mat color={c.body} snap={snap} roughness={0.55} /></mesh>
      {[-1, 1].map((s) => (<mesh key={s} position={[s * 2.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, 0.34, 16]} /><Metal color="#a49db4" snap={snap} /></mesh>))}
    </group>
  )
}

/* ---------- registry ---------- */
export function ProductModel({ product, color, open = false, snap = false, waves = true }) {
  const c = product.colors.find((x) => x.id === color) || product.colors[0]
  switch (product.model) {
    case 'headphones': return <Headphones variant={product.variant} c={c} snap={snap} />
    case 'earbuds': return <Earbuds variant={product.variant} c={c} open={open} snap={snap} />
    case 'speaker': return <Speaker variant={product.variant} c={c} snap={snap} waves={waves} />
    case 'dac': return <Dac c={c} snap={snap} />
    case 'pouch': return <Pouch c={c} snap={snap} />
    case 'cushions': return <Cushions c={c} snap={snap} />
    case 'cable': return <Cable c={c} snap={snap} />
    case 'siliconecase': return <group scale={0.9}><Earbuds variant="pro" c={{ ...c, accent: '#7C3AED' }} open={false} snap={snap} /></group>
    case 'coil': return <Coil c={c} snap={snap} />
    default: return null
  }
}
