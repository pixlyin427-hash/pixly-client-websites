// The persistent SONIQ Soundstage: one WebGL canvas that stays mounted behind every route.
// Routes only change its configuration (product, finish, camera, scene), so navigation reads as
// the camera moving through one space rather than separate pages.
import * as THREE from 'three'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { ProductModel } from './models'
import { Thumbs } from './thumbs'
import { byId, PROFILES, STUDIO } from '../data/catalog'
import { ease } from '../lib/format'

const V3 = THREE.Vector3
const VIOLET = new THREE.Color('#7C3AED')
const FLOOR = -1.3

/* ---------- ring floor ---------- */
const ringVert = `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`
const ringFrag = `
precision highp float;
varying vec2 vP;
uniform float uTime, uSpeed, uSpread, uAmp, uFade, uStatic;
uniform vec3 uC1, uC2;
uniform vec4 uPing;
void main(){
  float d = length(vP);
  float x = d*1.7/uSpread - uTime*0.1*uSpeed*(1.0-uStatic);
  float line = smoothstep(0.05, 0.0, abs(fract(x+0.5)-0.5));
  float pulse = 0.65 + 0.35*sin(d*2.4 - uTime*1.6*uSpeed*(1.0-uStatic));
  float fade = exp(-d*0.33) * smoothstep(0.35, 1.1, d);
  float a = line*pulse*fade*uAmp;
  a += exp(-d*d*0.22)*0.07;
  float pd = length(vP - uPing.xy);
  float age = uTime - uPing.z;
  float rip = (1.0-uStatic) * step(0.0, age) * smoothstep(0.16, 0.0, abs(pd - age*2.6)) * exp(-age*1.1) * step(age, 4.0);
  vec3 col = mix(uC1, uC2, clamp(d/7.0, 0.0, 1.0));
  gl_FragColor = vec4(col, clamp((a + rip*0.9) * uFade, 0.0, 1.0));
}`

function RingFloor({ profile, reduced, onPing, fade }) {
  const mat = useRef()
  const ping = useRef(new THREE.Vector4(0, 0, -100, 0))
  const p = PROFILES[profile] || PROFILES.balanced
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uSpeed: { value: 1 }, uSpread: { value: 1 }, uAmp: { value: 0.9 }, uFade: { value: 1 }, uStatic: { value: 0 },
    uC1: { value: new THREE.Color('#C4B5FD') }, uC2: { value: new THREE.Color('#7C3AED') }, uPing: { value: ping.current },
  }), [])
  const c1 = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }, dt) => {
    const u = mat.current.uniforms
    u.uTime.value = clock.elapsedTime
    u.uStatic.value = reduced ? 1 : 0
    const k = 1 - Math.exp(-dt * 4)
    u.uSpeed.value += (p.speed - u.uSpeed.value) * k
    u.uSpread.value += (p.spread - u.uSpread.value) * k
    u.uFade.value += (fade - u.uFade.value) * k
    c1.set(p.hue); u.uC1.value.lerp(c1, k)
  })
  return (
    <mesh position={[0, FLOOR, 0]} rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => { if (reduced) return; ping.current.set(e.point.x, -e.point.z, mat.current.uniforms.uTime.value, 1); onPing?.() }}>
      <circleGeometry args={[12, 96]} />
      <shaderMaterial ref={mat} vertexShader={ringVert} fragmentShader={ringFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  )
}

/* ---------- acoustic backdrop (sculptural ribs) ---------- */
function Ribs({ light }) {
  const ref = useRef()
  const n = 64
  useEffect(() => {
    const d = new THREE.Object3D()
    for (let i = 0; i < n; i++) {
      const a = THREE.MathUtils.lerp(-1.25, 1.25, i / (n - 1))
      const h = 4.5 + Math.abs(Math.sin(i * 0.9)) * 3 + Math.cos(i * 0.31) * 1.2
      d.position.set(Math.sin(a) * 11, FLOOR + h / 2, -Math.cos(a) * 11)
      d.rotation.set(0, -a, 0)
      d.scale.set(0.34, h, 0.5)
      d.updateMatrix()
      ref.current.setMatrixAt(i, d.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[null, null, n]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={light ? '#2e2347' : '#120b1d'} roughness={0.5} metalness={0.3} emissive="#7C3AED" emissiveIntensity={0.02} />
    </instancedMesh>
  )
}

/* ---------- spectrum bars (illustrative, not real audio analysis) ---------- */
function bandFor(i, n) { const t = Math.abs(((i / n) * 2 - 1)); return Math.min(5, Math.floor(t * 6)) }
function Spectrum({ profile, reduced, radius = 2.9, n = 72, line = false, length = 9, y = FLOOR, maxH = 1.15 }) {
  const ref = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const hs = useRef(new Float32Array(n))
  const col = useMemo(() => new THREE.Color('#C4B5FD'), [])
  const tgt = useMemo(() => new THREE.Color(), [])
  const p = PROFILES[profile] || PROFILES.balanced
  const geo = useMemo(() => { const g = new THREE.BoxGeometry(line ? 0.1 : 0.075, 1, 0.075); g.translate(0, 0.5, 0); return g }, [line])
  useFrame(({ clock }, dt) => {
    const t = reduced ? 0 : clock.elapsedTime * p.speed
    tgt.set(p.hue).lerp(VIOLET, 0.4); col.lerp(tgt, 1 - Math.exp(-dt * 4))
    ref.current.material.color.copy(col); ref.current.material.emissive.copy(col)
    for (let i = 0; i < n; i++) {
      const b = p.bands[bandFor(i, n)]
      const wob = reduced ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(t * 1.7 + i * 0.63) * Math.cos(t * 0.9 + i * 0.27))
      const target = 0.08 + b * wob * maxH
      hs.current[i] += (target - hs.current[i]) * (1 - Math.exp(-dt * 7))
      if (line) dummy.position.set(THREE.MathUtils.lerp(-length / 2, length / 2, i / (n - 1)), y, 0)
      else { const a = (i / n) * Math.PI * 2; dummy.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius); dummy.rotation.set(0, -a, 0) }
      dummy.scale.set(1, hs.current[i], 1)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, n]} frustumCulled={false}>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial color="#C4B5FD" emissive="#C4B5FD" emissiveIntensity={0.55} roughness={0.5} toneMapped={false} transparent opacity={0.92} />
    </instancedMesh>
  )
}

/* ---------- pedestal floor disc ---------- */
function Plinth({ light, r = 2.35 }) {
  const m = useRef()
  const tgt = useMemo(() => new THREE.Color(), [])
  useFrame((_, dt) => { tgt.set(light ? '#4a3a73' : '#0e0916'); m.current.color.lerp(tgt, 1 - Math.exp(-dt * 5)) })
  return (
    <group position={[0, FLOOR - 0.06, 0]}>
      <mesh><cylinderGeometry args={[r, r + 0.08, 0.12, 96]} /><meshStandardMaterial ref={m} color="#150f21" roughness={0.6} metalness={0.1} /></mesh>
      <mesh position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r - 0.05, r - 0.02, 128]} /><meshBasicMaterial color="#8b5cf6" toneMapped={false} /></mesh>
    </group>
  )
}

/* ---------- studio scene ---------- */
function StudioScene({ zone, reduced }) {
  const pods = [
    { x: -3.6, id: 'halo-one', z: 0.6, zone: 'bar' }, { x: -1.2, id: 'halo-air', z: 0.2, zone: 'bar' },
    { x: 1.2, id: 'orbit-pro', z: 0.2, zone: 'counter' }, { x: 3.6, id: 'aura-360', z: 0.6, zone: 'counter' },
  ]
  return (
    <group>
      {pods.map((p) => {
        const on = zone === p.zone
        const prod = byId[p.id]
        return (
          <group key={p.id} position={[p.x, 0, p.z]}>
            <mesh position={[0, FLOOR + 0.35, 0]}><cylinderGeometry args={[0.8, 0.9, 0.7, 48]} /><meshStandardMaterial color="#1a1228" roughness={0.3} metalness={0.6} /></mesh>
            <mesh position={[0, FLOOR + 0.71, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.72, 0.78, 64]} /><meshBasicMaterial color={on ? '#C4B5FD' : '#5b3fb0'} toneMapped={false} /></mesh>
            <group position={[0, FLOOR + 0.78 + (prod.cat === 'speakers' ? 0.62 : 0.75), 0]} scale={prod.cat === 'speakers' ? 0.55 : prod.cat === 'earbuds' ? 0.55 : 0.5}><ProductModel product={prod} color={prod.colors[0].id} open={on} waves={false} /></group>
          </group>
        )
      })}
      <Spectrum profile="balanced" reduced={reduced} line length={11} n={56} y={FLOOR} maxH={zone === 'wave' ? 3.4 : 2.2} />
      <group position={[0, 0, -3.2]}><mesh position={[0, FLOOR + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, 0.04]} /><meshBasicMaterial color="#7C3AED" toneMapped={false} /></mesh></group>
    </group>
  )
}

/* ---------- camera rig ---------- */
function Rig({ cam, target, shift, controls, resetKey, reduced, autoRotate, limits }) {
  const { camera, size } = useThree()
  const ctl = useRef()
  const tw = useRef({ t: 1, from: new V3(), fromT: new V3(), to: new V3(), toT: new V3(), dur: 1.15 })
  const off = useRef({ x: 0, y: 0 })
  const pend = useRef({ rot: 0, zoom: 0 })
  useEffect(() => {
    const on = (e) => { const d = e.detail || {}; if (d.type === 'rotate') pend.current.rot += d.amount; if (d.type === 'zoom') pend.current.zoom += d.amount }
    window.addEventListener('soniq:view', on)
    return () => window.removeEventListener('soniq:view', on)
  }, [])
  const key = cam.join() + target.join() + resetKey
  useEffect(() => {
    const t = tw.current
    t.from.copy(camera.position); t.fromT.copy(ctl.current.target)
    t.to.set(...cam); t.toT.set(...target)
    t.t = reduced ? 1 : 0
    if (reduced) { camera.position.copy(t.to); ctl.current.target.copy(t.toT) }
  }, [key, reduced]) // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((_, dt) => {
    const t = tw.current, c = ctl.current
    if (t.t < 1) {
      t.t = Math.min(1, t.t + dt / t.dur)
      const k = ease(t.t)
      camera.position.lerpVectors(t.from, t.to, k)
      camera.position.y += Math.sin(k * Math.PI) * 0.35
      c.target.lerpVectors(t.fromT, t.toT, k)
      c.enabled = false
    } else c.enabled = controls
    if (Math.abs(pend.current.rot) > 0.001 || Math.abs(pend.current.zoom) > 0.001) {
      const kk = reduced ? 1 : 0.2
      const r = pend.current.rot * kk, z = pend.current.zoom * kk
      pend.current.rot -= r; pend.current.zoom -= z
      const o = camera.position.clone().sub(c.target)
      o.applyAxisAngle(new V3(0, 1, 0), r)
      o.multiplyScalar(1 + z)
      camera.position.copy(c.target).add(o)
    }
    const k2 = reduced ? 1 : 1 - Math.exp(-dt * 6)
    off.current.x += (shift.x - off.current.x) * k2
    off.current.y += (shift.y - off.current.y) * k2
    if (Math.abs(off.current.x) + Math.abs(off.current.y) > 0.5) camera.setViewOffset(size.width, size.height, off.current.x, off.current.y, size.width, size.height)
    else camera.clearViewOffset()
    c.update()
  })
  const d = new V3(...cam).distanceTo(new V3(...target))
  return <OrbitControls ref={ctl} makeDefault enablePan={false} enableDamping dampingFactor={0.08} rotateSpeed={0.7}
    minDistance={d * (limits?.min ?? 0.55)} maxDistance={Math.max(d * 1.45, 4)} minPolarAngle={0.35} maxPolarAngle={Math.PI * 0.62}
    autoRotate={autoRotate && !reduced} autoRotateSpeed={0.9} />
}

/* Document-style pages dim the stage and render at a low rate (full rate briefly after each change). */
function Ticker({ active, reduced, deps }) {
  const { invalidate } = useThree()
  useEffect(() => {
    if (!active) return
    let fast = true
    invalidate()
    const burst = setTimeout(() => { fast = false }, reduced ? 200 : 1800)
    const t = setInterval(() => invalidate(), 16)
    const slow = setInterval(() => { if (!fast) invalidate() }, 130)
    const stopFast = setInterval(() => { if (!fast) clearInterval(t) }, 100)
    return () => { clearTimeout(burst); clearInterval(t); clearInterval(slow); clearInterval(stopFast) }
  }, [active, reduced, deps, invalidate])
  return null
}

/* ---------- scene composition ---------- */
function Scene({ cfg, reduced, lite }) {
  const { size, invalidate } = useThree()
  const aspect = size.width / size.height
  const prod = byId[cfg.product]
  const colorDef = prod.colors.find((c) => c.id === cfg.color) || prod.colors[0]
  const light = !!colorDef.light && ['product', 'hero'].includes(cfg.view)
  const modelRef = useRef()
  const spin = useRef(0)

  // camera presets per view
  const { cam, target, controls, autoRotate, limits } = useMemo(() => {
    const modelFit = { earbuds: 1.45, speaker: 1.1, siliconecase: 1.45 }[prod.model] || 1
    const fit = (aspect < 1 ? 1 + (1 / aspect - 1) * 0.5 : aspect < 1.4 ? 1.15 : 1) * modelFit
    const scl = (v, t) => { const o = new V3(...v).sub(new V3(...t)).multiplyScalar(fit).add(new V3(...t)); return o.toArray() }
    const A = prod.anatomy.find((a) => a.id === cfg.detail)
    let c = [0, 0.5, 7.8], t = [0, -0.1, 0], ctl = true, auto = false, lim
    if (cfg.view === 'hero') { auto = true }
    if (cfg.view === 'product') {
      if (A) { c = A.cam; t = A.target; lim = { min: 0.6 } } else { auto = false }
    }
    if (cfg.view === 'dim') { c = [0, 0.9, 10.5]; t = [0, 0.1, 0]; ctl = false }
    if (cfg.view === 'lab') { c = [0, 5.2, 9.4]; t = [0, -0.2, 0]; ctl = true }
    if (cfg.view === 'studio') { c = cfg.zone === 'wave' ? [0, 2.2, 9] : cfg.zone === 'wall' ? [3.5, 1.6, 10] : cfg.zone === 'counter' ? [2.4, 2, 9.4] : [-2.4, 2, 9.4]; t = [cfg.zone === 'counter' ? 2.4 : cfg.zone === 'bar' ? -2.4 : 0, -0.4, 0]; ctl = true }
    if (cfg.view === 'story') { const s = [[0, 0.6, 8.6], [3.4, 0.9, 3.8], [-1.2, 0.3, 4.1], [0, 3.4, 6.5]][cfg.chapter || 0]; c = s; t = [[0, 0, 0], [1.1, 0.1, 0], [-0.7, 0, 0], [0, 0, 0]][cfg.chapter || 0] }
    return { cam: scl(c, t), target: t, controls: ctl, autoRotate: auto, limits: lim }
  }, [cfg.view, cfg.detail, cfg.zone, cfg.chapter, cfg.product, aspect, prod])

  // pointer-driven yaw offset while idle gives the product a little life without extra controls
  useFrame(({ pointer }, dt) => {
    if (!modelRef.current) return
    const targetYaw = cfg.view === 'product' || cfg.view === 'hero' ? (A_rot(prod, cfg) + (reduced ? 0 : pointer.x * 0.18)) : 0
    spin.current += (targetYaw - spin.current) * (1 - Math.exp(-dt * 4))
    modelRef.current.rotation.y = spin.current
  })

  const inset = { l: 0, r: 0, t: 0, b: 0, ...(cfg.inset || {}) }
  const shift = { x: (inset.r - inset.l) / 2, y: (inset.b - (inset.t + 84)) / 2 }
  const showProduct = ['hero', 'product', 'dim', 'story', 'lab'].includes(cfg.view)
  const fade = cfg.view === 'dim' ? 0.55 : 1
  const pscale = cfg.view === 'lab' ? 0.62 : 1
  const wide = prod.model === 'dac' ? 0.9 : 1

  return (
    <>
      <fog attach="fog" args={['#100D19', 12, 30]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <pointLight position={[-5, 2, -3]} intensity={60} color="#7C3AED" distance={14} />
      <pointLight position={[5, 1, -3]} intensity={14} color="#a78bfa" distance={10} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 6, 2]} scale={[10, 4, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={3.2} color="#a78bfa" position={[-6, 1, 1]} scale={[1.2, 7, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.2} color="#c4b5fd" position={[6, 1, 2]} scale={[1.2, 7, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={0.5} color="#c4b5fd" position={[0, 2, -6]} scale={3} />
        <Lightformer form="rect" intensity={1.2} position={[0, -1, 5]} scale={[8, 1.4, 1]} />
      </Environment>

      <Rig cam={cam} target={target} shift={shift} controls={controls && !lite} resetKey={cfg.resetKey} reduced={reduced} autoRotate={autoRotate} limits={limits} />
      <Plinth light={light} />
      <RingFloor profile={cfg.profile} reduced={reduced} fade={fade} onPing={invalidate} />
      {!lite && <Ribs light={light} />}
      {cfg.view === 'lab' && <Spectrum profile={cfg.profile} reduced={reduced} n={lite ? 36 : 72} />}
      {cfg.view === 'studio' && <StudioScene zone={cfg.zone} reduced={reduced} />}
      <Suspense fallback={null}>
        {showProduct && (
          <group ref={modelRef} scale={pscale * wide} position={[0, cfg.view === 'lab' ? 0.2 : 0, 0]}>
            <ProductModel product={prod} color={cfg.color} open={cfg.open || !!prod.anatomy.find((a) => a.id === cfg.detail && a.open)} waves={cfg.view !== 'dim'} />
          </group>
        )}
      </Suspense>
    </>
  )
}
const A_rot = (prod, cfg) => (prod.anatomy.find((a) => a.id === cfg.detail)?.rot ?? (cfg.view === 'hero' ? -0.35 : -0.3))

function CssFallback({ reason }) {
  return <div className="stage-fallback" role="img" aria-label="Decorative concentric sound rings">{reason ? <p className="fallback-note">{reason}</p> : null}</div>
}

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}

export default function Stage({ cfg, quality, reduced, mobile }) {
  const [ok, setOk] = useState(() => webglAvailable())
  const lite = quality === 'lite' || mobile
  const dim = cfg.view === 'dim'
  if (quality === 'off' || !ok) return <CssFallback reason={!ok && quality !== 'off' ? '3D is unavailable on this device — showing the lightweight version.' : null} />
  return (
    <div className={`stage ${dim ? 'is-dim' : ''}`} aria-hidden="true">
      <Canvas
        dpr={lite ? [1, 1.25] : [1, 1.75]}
        camera={{ fov: 32, position: [0, 0.5, 7.8], near: 0.1, far: 60 }}
        gl={{ alpha: true, antialias: !lite, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
        flat
        frameloop={dim ? 'demand' : 'always'}
        onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setOk(false) }) }}
      >
        <Scene cfg={cfg} reduced={reduced} lite={lite} />
        <Ticker active={dim} reduced={reduced} deps={cfg.view + (cfg.product || '')} />
        <Thumbs />
      </Canvas>
    </div>
  )
}
