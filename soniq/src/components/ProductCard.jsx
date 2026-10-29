import { useRef } from 'react'
import { Link } from '../lib/router'
import { useStore, useReducedMotion } from '../lib/store'
import { CAT_LABEL } from '../data/catalog'
import { Icon, Price, Thumb } from './ui'

function useTilt(disabled) {
  const ref = useRef()
  const on = (e) => {
    if (disabled || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    ref.current.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`
  }
  const off = () => { if (ref.current) ref.current.style.transform = '' }
  return { ref, onPointerMove: on, onPointerLeave: off }
}

export default function ProductCard({ product: p, color, compact }) {
  const s = useStore()
  const reduced = useReducedMotion()
  const tilt = useTilt(reduced)
  const col = color || p.colors[0].id
  const cdef = p.colors.find((c) => c.id === col) || p.colors[0]
  const saved = s.saved.includes(p.id)
  const cmp = s.compare.includes(p.id)
  return (
    <article className={`pcard ${cdef.light ? 'is-light' : ''}`}>
      <div className="pcard-media" {...tilt}>
        <Thumb id={p.id} color={col} />
        <div className="pcard-badges"><span className="badge ok">In demo stock</span></div>
        <div className="pcard-act">
          <button type="button" className="iconbtn" aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${p.name}`} onClick={() => s.toggleSaved(p.id)}><Icon n="heart" style={saved ? { fill: 'currentColor' } : { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 }} /></button>
          {p.cat !== 'accessories' && <button type="button" className="iconbtn" aria-pressed={cmp} aria-label={`${cmp ? 'Remove' : 'Add'} ${p.name} ${cmp ? 'from' : 'to'} compare`} onClick={() => s.toggleCompare(p.id)}><Icon n="compare" /></button>}
        </div>
      </div>
      <div className="pcard-body">
        <span className="label">{CAT_LABEL[p.cat]}</span>
        <h3><Link to={`/p/${p.id}`}>{p.name}</Link></h3>
        {!compact && <p className="fine">{p.tagline}</p>}
        <div className="dots" aria-label={`${p.colors.length} finish${p.colors.length > 1 ? 'es' : ''}: ${p.colors.map((c) => c.name).join(', ')}`}>{p.colors.map((c) => <i key={c.id} className="dot" style={{ '--c': c.body }} />)}</div>
        <div className="pcard-foot">
          <Price p={p} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => s.addProduct(p.id, col)} aria-label={`Add ${p.name} to bag`}><Icon n="bag" />Add</button>
        </div>
      </div>
    </article>
  )
}
