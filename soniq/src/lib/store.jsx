import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react'
import { byId, BUNDLES, bundleParts } from '../data/catalog'

const KEY = 'soniq:v1'
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
const save = (s) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* storage may be unavailable */ }
}

const initial = () => {
  const s = load()
  return {
    bag: Array.isArray(s.bag) ? s.bag.filter((l) => l && l.key) : [],
    saved: Array.isArray(s.saved) ? s.saved : [],
    compare: Array.isArray(s.compare) ? s.compare.filter((id) => byId[id]) : [],
    recent: Array.isArray(s.recent) ? s.recent.filter((id) => byId[id]) : [],
    orders: Array.isArray(s.orders) ? s.orders : [],
    quality: s.quality || 'full', // full | lite | off
  }
}

const lineKey = (l) => (l.kind === 'bundle' ? `b:${l.id}:${(l.items || []).map((i) => i.id + '.' + i.color).join('+')}` : `p:${l.id}:${l.color}`)

function reducer(s, a) {
  switch (a.type) {
    case 'addProduct': {
      const line = { kind: 'product', id: a.id, color: a.color, qty: 1 }
      line.key = lineKey(line)
      const hit = s.bag.find((l) => l.key === line.key)
      return { ...s, bag: hit ? s.bag.map((l) => (l.key === line.key ? { ...l, qty: Math.min(10, l.qty + 1) } : l)) : [...s.bag, line] }
    }
    case 'addBundle': {
      const line = { kind: 'bundle', id: a.id, name: a.name, price: a.price, items: a.items, qty: 1 }
      line.key = lineKey(line)
      const hit = s.bag.find((l) => l.key === line.key)
      return { ...s, bag: hit ? s.bag.map((l) => (l.key === line.key ? { ...l, qty: Math.min(10, l.qty + 1) } : l)) : [...s.bag, line] }
    }
    case 'qty': return { ...s, bag: s.bag.map((l) => (l.key === a.key ? { ...l, qty: Math.max(1, Math.min(10, l.qty + a.d)) } : l)) }
    case 'remove': return { ...s, bag: s.bag.filter((l) => l.key !== a.key) }
    case 'recolor': {
      const l = s.bag.find((x) => x.key === a.key)
      if (!l || l.kind !== 'product') return s
      const nk = lineKey({ ...l, color: a.color })
      const dup = s.bag.find((x) => x.key === nk && x.key !== a.key)
      const rest = s.bag.filter((x) => x.key !== a.key)
      return { ...s, bag: dup ? rest.map((x) => (x.key === nk ? { ...x, qty: Math.min(10, x.qty + l.qty) } : x)) : s.bag.map((x) => (x.key === a.key ? { ...x, color: a.color, key: nk } : x)) }
    }
    case 'clearBag': return { ...s, bag: [] }
    case 'toggleSaved': return { ...s, saved: s.saved.includes(a.id) ? s.saved.filter((i) => i !== a.id) : [...s.saved, a.id] }
    case 'toggleCompare': return { ...s, compare: s.compare.includes(a.id) ? s.compare.filter((i) => i !== a.id) : [...s.compare.slice(-(a.max - 1)), a.id] }
    case 'setCompare': return { ...s, compare: a.ids }
    case 'viewed': return { ...s, recent: [a.id, ...s.recent.filter((i) => i !== a.id)].slice(0, 6) }
    case 'order': return { ...s, orders: [a.order, ...s.orders].slice(0, 5), bag: [] }
    case 'quality': return { ...s, quality: a.q }
    default: return s
  }
}

export const linePrice = (l) => (l.kind === 'bundle' ? l.price : byId[l.id].price)
export const bagTotals = (bag) => {
  const count = bag.reduce((n, l) => n + l.qty, 0)
  const subtotal = bag.reduce((n, l) => n + linePrice(l) * l.qty, 0)
  return { count, subtotal }
}
// Validation of the supplied bundle prices against their component prices (see QA notes).
export const bundleCheck = (b) => { const parts = bundleParts(b); return { parts, delta: parts - b.price } }
export { BUNDLES }

const Ctx = createContext(null)
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial)
  const [toasts, setToasts] = useState([])
  const [ui, setUi] = useState({ bag: false, search: false, menu: false })
  const tid = useRef(0)
  useEffect(() => { save(state) }, [state])

  const toast = useCallback((msg, tone = 'ok') => {
    const id = ++tid.current
    setToasts((t) => [...t.slice(-2), { id, msg, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  const api = useMemo(() => ({
    ...state,
    ...bagTotals(state.bag),
    toasts, ui,
    open: (k, v = true) => setUi((u) => ({ ...u, [k]: v })),
    addProduct: (id, color) => { dispatch({ type: 'addProduct', id, color }); toast(`${byId[id].name} added to bag`); setUi((u) => ({ ...u, bag: true })) },
    addBundle: (b) => { dispatch({ type: 'addBundle', ...b }); toast(`${b.name} added to bag`); setUi((u) => ({ ...u, bag: true })) },
    qty: (key, d) => dispatch({ type: 'qty', key, d }),
    remove: (key) => { dispatch({ type: 'remove', key }); toast('Removed from bag', 'info') },
    recolor: (key, color) => dispatch({ type: 'recolor', key, color }),
    toggleSaved: (id) => { dispatch({ type: 'toggleSaved', id }); toast(state.saved.includes(id) ? `${byId[id].name} removed from saved` : `${byId[id].name} saved`, 'info') },
    toggleCompare: (id) => {
      const had = state.compare.includes(id)
      const cat = state.compare.length ? byId[state.compare[0]].cat : null
      if (!had && cat && byId[id].cat !== cat) {
        dispatch({ type: 'setCompare', ids: [id] })
        toast(`Comparison restarted — ${byId[id].cat} can't be compared with ${cat}`, 'info')
        return
      }
      dispatch({ type: 'toggleCompare', id, max: 3 })
      toast(had ? `${byId[id].name} removed from compare` : `${byId[id].name} added to compare`, 'info')
    },
    clearCompare: () => dispatch({ type: 'setCompare', ids: [] }),
    setCompare: (ids) => dispatch({ type: 'setCompare', ids }),
    viewed: (id) => dispatch({ type: 'viewed', id }),
    placeOrder: (order) => dispatch({ type: 'order', order }),
    setQuality: (q) => dispatch({ type: 'quality', q }),
    toast,
  }), [state, toasts, ui, toast])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
export const useStore = () => useContext(Ctx)

export function useReducedMotion() {
  const [r, setR] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setR(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return r
}

export function useMedia(q) {
  const [m, setM] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches)
  useEffect(() => {
    const mm = matchMedia(q)
    const on = () => setM(mm.matches)
    on()
    mm.addEventListener('change', on)
    return () => mm.removeEventListener('change', on)
  }, [q])
  return m
}

// Stage state shared between UI pages and the persistent 3D canvas.
const StageCtx = createContext(null)
export function StageProvider({ children }) {
  const [cfg, setCfg] = useState({ product: 'halo-one', color: null, mode: 'hero', detail: null, profile: 'balanced', scene: 'stage', panel: 'none', open: false, resetKey: 0, level: 1 })
  const patch = useCallback((p) => setCfg((c) => ({ ...c, ...p })), [])
  const value = useMemo(() => ({ cfg, patch }), [cfg, patch])
  return <StageCtx.Provider value={value}>{children}</StageCtx.Provider>
}
export const useStage = () => useContext(StageCtx)
