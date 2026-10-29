import { useRef } from 'react'
import { useRoute } from '../lib/router'
import { useStore, linePrice } from '../lib/store'
import { byId } from '../data/catalog'
import { rupees } from '../lib/format'
import { Icon, Thumb } from './ui'

export function LineView({ l, editable = true, s }) {
  const isB = l.kind === 'bundle'
  const p = isB ? null : byId[l.id]
  const cdef = p && (p.colors.find((c) => c.id === l.color) || p.colors[0])
  return (
    <li className="line">
      {isB ? <span className="thumb" aria-hidden="true" style={{ display: 'grid', placeItems: 'center' }}><Icon n="compare" style={{ width: 30, color: 'var(--lav)' }} /></span> : <Thumb id={l.id} color={l.color} />}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <h4>{isB ? l.name : p.name}</h4>
          <b className="num">{rupees(linePrice(l) * l.qty)}</b>
        </div>
        {isB ? (
          <p className="fine">Bundle: {l.items.map((i) => byId[i.id].name).join(' + ')} · {rupees(l.price)} each</p>
        ) : (
          <p className="fine">{p.tagline} · {rupees(p.price)} each</p>
        )}
        {!isB && editable && p.colors.length > 1 && (
          <label className="field" style={{ marginTop: 8 }}>
            <span className="sr">Finish for {p.name}</span>
            <select className="select sm" value={cdef.id} onChange={(e) => s.recolor(l.key, e.target.value)}>
              {p.colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
        {!isB && !editable && <p className="fine">Finish: {cdef.name}</p>}
        {editable && (
          <div className="meta">
            <div className="qty" role="group" aria-label={`Quantity for ${isB ? l.name : p.name}`}>
              <button type="button" aria-label="Decrease quantity" disabled={l.qty <= 1} onClick={() => s.qty(l.key, -1)}><Icon n="minus" style={{ width: 16 }} /></button>
              <output aria-live="polite">{l.qty}</output>
              <button type="button" aria-label="Increase quantity" disabled={l.qty >= 10} onClick={() => s.qty(l.key, 1)}><Icon n="plus" style={{ width: 16 }} /></button>
            </div>
            <button type="button" className="tlink" onClick={() => s.remove(l.key)} aria-label={`Remove ${isB ? l.name : p.name} from bag`}>Remove</button>
          </div>
        )}
        {!editable && <p className="fine">Qty {l.qty}</p>}
      </div>
    </li>
  )
}

export default function BagDrawer() {
  const s = useStore()
  const { go } = useRoute()
  const ref = useRef()
  const close = () => s.open('bag', false)
  if (!s.ui.bag) return null
  return <Inner s={s} go={go} close={close} dref={ref} />
}
import { useDialog } from './ui'
function Inner({ s, go, close, dref }) {
  useDialog(true, close, dref)
  return (
    <>
      <div className="scrim" onClick={close} />
      <aside className="drawer" ref={dref} role="dialog" aria-modal="true" aria-label="Shopping bag">
        <header>
          <h2 className="t-prod">Your bag <span className="muted" style={{ fontSize: '.8em' }}>({s.count})</span></h2>
          <button type="button" className="iconbtn" aria-label="Close bag" onClick={close} data-autofocus><Icon n="close" /></button>
        </header>
        <div className="body">
          <p className="note">Prototype bag — no real order or payment.</p>
          {s.bag.length === 0 ? (
            <div className="empty">
              <h3 className="t-prod">Your bag is empty</h3>
              <p className="muted">Add a product to see how the demo bag and checkout work.</p>
              <button type="button" className="btn btn-primary" onClick={() => { close(); go('/shop') }}>Shop all audio</button>
            </div>
          ) : (
            <ul style={{ display: 'grid', gap: 12 }} aria-label="Bag items">{s.bag.map((l) => <LineView key={l.key} l={l} s={s} />)}</ul>
          )}
        </div>
        {s.bag.length > 0 && (
          <footer>
            <div className="sum-row"><span>Subtotal</span><b className="num">{rupees(s.subtotal)}</b></div>
            <p className="fine">Shipping is chosen at checkout. Demo prices; taxes are not calculated in this prototype.</p>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => { close(); go('/checkout') }}>Continue to demo checkout <Icon n="arrow" className="arrow" /></button>
            <button type="button" className="btn btn-ghost" onClick={close}>Continue shopping</button>
          </footer>
        )}
      </aside>
    </>
  )
}
