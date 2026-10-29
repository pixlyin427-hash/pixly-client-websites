// Renders product models offscreen (once per product/finish) into images, so cards, bag lines and
// lists get real 3D renders without running several live WebGL canvases.
import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { ProductModel } from './models'
import { byId } from '../data/catalog'

const cache = new Map()
const failed = new Set()
const pending = new Set()
const queue = []
const subs = new Set()
let wake = () => {}
const emit = () => subs.forEach((f) => f())
const keyOf = (id, color) => `${id}:${color}`

export function requestThumb(id, color, low = false) {
  const k = keyOf(id, color)
  if (cache.has(k) || failed.has(k)) return
  if (pending.has(k)) {
    // already queued: promote when a visible component asks for it
    const i = queue.findIndex((j) => j.k === k)
    if (!low && i > 0) queue.unshift(queue.splice(i, 1)[0])
    return
  }
  pending.add(k)
  if (low) queue.push({ id, color, k }); else queue.unshift({ id, color, k })
  wake()
}
export function prefetchThumbs(ids) { ids.forEach((id) => requestThumb(id, byId[id].colors[0].id, true)) }
export function useThumb(id, color) {
  const col = color || byId[id].colors[0].id
  useEffect(() => { requestThumb(id, col) }, [id, col])
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f) },
    () => cache.get(keyOf(id, col)) || null,
  )
}

const SIZE = 512
const fitPad = { headphones: 1.12, earbuds: 1.25, speaker: 1.3, dac: 1.1, pouch: 1.15, cushions: 1.2, cable: 1.15, siliconecase: 1.3, coil: 1.1 }

export function Thumbs() {
  const { gl, scene: main, invalidate } = useThree()
  const [job, setJob] = useState(null)
  const group = useRef()
  const frames = useRef(0)
  const sc = useMemo(() => new THREE.Scene(), [])
  const cam = useMemo(() => new THREE.PerspectiveCamera(28, 1, 0.1, 80), [])
  const rt = useMemo(() => { const t = new THREE.WebGLRenderTarget(SIZE, SIZE, { samples: 4 }); t.texture.colorSpace = THREE.SRGBColorSpace; return t }, [])
  const canvas = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = SIZE; return c }, [])

  useEffect(() => {
    wake = () => { setJob((j) => j || queue.shift() || null); invalidate() }
    wake()
    return () => { wake = () => {} }
  }, [invalidate])
  useEffect(() => { if (!job && queue.length) wake() }, [job])
  useEffect(() => () => rt.dispose(), [rt])

  useFrame(() => {
    if (!job || !group.current || !main.environment) return
    if (++frames.current < 3) { invalidate(); return }
    frames.current = 0
    try {
      sc.environment = main.environment
      const box = new THREE.Box3().setFromObject(group.current)
      const size = box.getSize(new THREE.Vector3())
      const ctr = box.getCenter(new THREE.Vector3())
      const p = byId[job.id]
      const r = Math.max(size.x, size.y * 1.15, size.z * 0.6) * (fitPad[p.model] || 1.2)
      const dist = r / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))
      cam.position.copy(ctr).add(new THREE.Vector3(0.28, 0.16, 1).normalize().multiplyScalar(dist))
      cam.lookAt(ctr)
      const prev = gl.getRenderTarget()
      const prevClear = new THREE.Color(); gl.getClearColor(prevClear)
      const prevAlpha = gl.getClearAlpha()
      gl.setRenderTarget(rt); gl.setClearColor(0x000000, 0); gl.clear()
      gl.render(sc, cam)
      const buf = new Uint8Array(SIZE * SIZE * 4)
      gl.readRenderTargetPixels(rt, 0, 0, SIZE, SIZE, buf)
      gl.setRenderTarget(prev); gl.setClearColor(prevClear, prevAlpha)
      const img = new ImageData(SIZE, SIZE)
      for (let y = 0; y < SIZE; y++) {
        const s = (SIZE - 1 - y) * SIZE * 4, d = y * SIZE * 4
        for (let x = 0; x < SIZE * 4; x += 4) {
          const a = buf[s + x + 3]
          const u = a > 0 && a < 255 ? 255 / a : 1
          img.data[d + x] = Math.min(255, buf[s + x] * u); img.data[d + x + 1] = Math.min(255, buf[s + x + 1] * u)
          img.data[d + x + 2] = Math.min(255, buf[s + x + 2] * u); img.data[d + x + 3] = a
        }
      }
      canvas.getContext('2d').putImageData(img, 0, 0)
      const k = job.k
      canvas.toBlob((b) => { if (b) { cache.set(k, URL.createObjectURL(b)) } else failed.add(k); pending.delete(k); emit() }, 'image/png')
    } catch (e) {
      failed.add(job.k); pending.delete(job.k)
      console.warn('thumbnail failed', job.k, e)
    }
    setJob(null)
  })

  if (!job) return null
  const p = byId[job.id]
  return createPortal(
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#a78bfa" />
      <group key={job.k} ref={group} rotation={[0, -0.5, 0]}>
        <ProductModel product={p} color={job.color} open snap waves={false} />
      </group>
    </>,
    sc,
  )
}
