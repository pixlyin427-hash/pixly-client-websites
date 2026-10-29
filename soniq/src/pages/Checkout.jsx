import { useRef, useState } from 'react'
import { Link, useRoute } from '../lib/router'
import { useStore } from '../lib/store'
import { useStagePage } from '../lib/stagehook'
import { SHIPPING, byId } from '../data/catalog'
import { rupees } from '../lib/format'
import { Icon } from '../components/ui'
import { LineView } from '../components/BagDrawer'
import Footer from '../components/Footer'

const STEPS = ['Bag', 'Delivery', 'Payment (demo)', 'Review']
const STATES = ['Maharashtra', 'Gujarat', 'Karnataka', 'Delhi', 'Tamil Nadu', 'West Bengal', 'Other']
const blank = { name: '', phone: '', email: '', line1: '', city: '', state: 'Maharashtra', pin: '' }

function validate(v) {
  const e = {}
  if (v.name.trim().length < 2) e.name = 'Enter a name (a fictional one is fine).'
  if (!/^\d{10}$/.test(v.phone.replace(/\s/g, ''))) e.phone = 'Enter a 10-digit phone number.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) e.email = 'Enter a valid email address.'
  if (v.line1.trim().length < 5) e.line1 = 'Enter an address (at least 5 characters).'
  if (v.city.trim().length < 2) e.city = 'Enter a city.'
  if (!/^\d{6}$/.test(v.pin)) e.pin = 'Enter a 6-digit PIN code.'
  return e
}

function Summary({ s, ship }) {
  const total = s.subtotal + (ship ? ship.fee : 0)
  return (
    <aside className="panel" aria-label="Order summary"><div className="pad" style={{ display: 'grid', gap: 10 }}>
      <h2 className="t-prod">Order summary</h2>
      <ul style={{ display: 'grid', gap: 10 }}>{s.bag.map((l) => <LineView key={l.key} l={l} s={s} editable={false} />)}</ul>
      <div className="sum-row"><span>Subtotal</span><span className="num">{rupees(s.subtotal)}</span></div>
      <div className="sum-row"><span>Shipping{ship ? ` — ${ship.name}` : ''}</span><span className="num">{ship ? (ship.fee ? rupees(ship.fee) : 'Free') : 'Chosen next'}</span></div>
      <div className="sum-row total"><span>Total</span><span className="num">{rupees(total)}</span></div>
      <p className="fine">Demo prices. Taxes are not calculated. Simulated checkout — no real payment.</p>
    </div></aside>
  )
}

export default function Checkout({ confirmation }) {
  useStagePage({ view: 'dim' }, [])
  return confirmation ? <Confirmation id={confirmation} /> : <Flow />
}

function Confirmation({ id }) {
  const s = useStore()
  const o = s.orders.find((x) => x.id === id)
  if (!o) return (
    <div className="sheet"><div className="wrap confirm"><h1 className="t-page">We can’t find that demo order</h1><p className="muted">Demo orders are stored only in the browser they were created in.</p><Link to="/shop" className="btn btn-primary">Shop all audio</Link></div></div>
  )
  return (
    <div className="sheet"><div className="wrap">
      <div className="confirm">
        <div className="ring"><Icon n="check" style={{ width: 56, color: 'var(--lav)' }} /></div>
        <span className="eyebrow">Demo order complete</span>
        <h1 className="t-page">Thank you — this was a simulation</h1>
        <p className="conf-no" aria-label={`Fictional confirmation number ${o.id}`}>{o.id}</p>
        <p className="demo-box" style={{ maxWidth: 560 }}><b>No real order was placed.</b> SONIQ is fictional: nothing was charged, packed or shipped, and no one received your details. The confirmation number above is invented for the prototype.</p>
      </div>
      <div className="co-layout" style={{ marginTop: 10 }}>
        <section className="panel"><div className="pad" style={{ display: 'grid', gap: 10 }}>
          <h2 className="t-prod">Items</h2>
          <ul style={{ display: 'grid', gap: 10 }}>{o.lines.map((l) => <LineView key={l.key} l={l} s={s} editable={false} />)}</ul>
          <h2 className="t-prod" style={{ marginTop: 10 }}>Delivery (simulated)</h2>
          <p className="muted">{o.ship.name} · {o.ship.window}</p>
          <p className="muted">{o.address.name}, {o.address.line1}, {o.address.city}, {o.address.state} {o.address.pin}</p>
          <p className="fine">Payment: {o.payment} — demo option only, nothing collected.</p>
        </div></section>
        <div className="panel"><div className="pad" style={{ display: 'grid', gap: 8 }}>
          <div className="sum-row"><span>Subtotal</span><span className="num">{rupees(o.subtotal)}</span></div>
          <div className="sum-row"><span>Shipping</span><span className="num">{o.ship.fee ? rupees(o.ship.fee) : 'Free'}</span></div>
          <div className="sum-row total"><span>Total</span><span className="num">{rupees(o.total)}</span></div>
          <Link className="btn btn-ghost" to="/support/order-status">Check order status (demo)</Link>
          <Link className="btn btn-primary" to="/shop">Keep exploring</Link>
        </div></div>
      </div>
      <Footer />
    </div></div>
  )
}

function Flow() {
  const s = useStore()
  const { go } = useRoute()
  const [step, setStep] = useState(0)
  const [v, setV] = useState(blank)
  const [err, setErr] = useState({})
  const [shipId, setShipId] = useState('standard')
  const [pay, setPay] = useState('UPI (demo)')
  const [busy, setBusy] = useState(false)
  const top = useRef()
  const ship = SHIPPING.find((x) => x.id === shipId)

  if (s.bag.length === 0 && !busy) return (
    <div className="sheet"><div className="wrap"><div className="empty" style={{ marginTop: 40 }}>
      <h1 className="t-page">Your bag is empty</h1><p className="muted">Add something to the bag to try the simulated checkout.</p>
      <Link to="/shop" className="btn btn-primary">Shop all audio</Link>
    </div></div></div>
  )

  const next = () => {
    if (step === 1) {
      const e = validate(v)
      setErr(e)
      if (Object.keys(e).length) { requestAnimationFrame(() => document.getElementById(`f-${Object.keys(e)[0]}`)?.focus()); return }
    }
    setStep((n) => n + 1); top.current?.scrollIntoView?.({ block: 'start' })
  }
  const place = () => {
    setBusy(true)
    setTimeout(() => {
      const id = 'SNQ-DEMO-' + Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
      s.placeOrder({ id, createdAt: Date.now(), lines: s.bag, subtotal: s.subtotal, ship, total: s.subtotal + ship.fee, address: v, payment: pay })
      go(`/confirmation/${id}`)
    }, 900)
  }
  const field = (k, label, props = {}) => (
    <div className={`field ${props.full ? 'full' : ''}`}>
      <label className="lbl" htmlFor={`f-${k}`}>{label}</label>
      <input id={`f-${k}`} className="input" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} aria-invalid={!!err[k]} aria-describedby={err[k] ? `f-${k}-e` : undefined} {...props.input} />
      {err[k] && <span className="err" id={`f-${k}-e`}>{err[k]}</span>}
    </div>
  )

  return (
    <div className="sheet"><div className="wrap" ref={top}>
      <span className="eyebrow">Simulated checkout</span>
      <h1 className="t-page" style={{ margin: '12px 0 20px' }}>Checkout</h1>
      <p className="demo-box" role="note" style={{ marginBottom: 20 }}><b>Demonstration only.</b> No payment gateway is connected and no real order will be placed. Don’t enter real card numbers or personal details — details you type stay in this browser.</p>
      <ol className="co-steps" aria-label="Checkout progress">{STEPS.map((l, i) => <li key={l} className={`co-step ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`} aria-current={i === step ? 'step' : undefined}><i>{i < step ? '✓' : i + 1}</i>{l}</li>)}</ol>

      <div className="co-layout">
        <section className="panel" aria-live="polite"><div className="pad" style={{ display: 'grid', gap: 18 }}>
          {step === 0 && (
            <>
              <h2 className="t-sec" style={{ fontSize: '1.6rem' }}>Review your bag</h2>
              <ul style={{ display: 'grid', gap: 12 }}>{s.bag.map((l) => <LineView key={l.key} l={l} s={s} />)}</ul>
              <button type="button" className="btn btn-primary btn-lg" onClick={next}>Continue to delivery <Icon n="arrow" className="arrow" /></button>
            </>
          )}
          {step === 1 && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); next() }} style={{ display: 'grid', gap: 18 }}>
              <h2 className="t-sec" style={{ fontSize: '1.6rem' }}>Delivery details (demo)</h2>
              <div className="form-grid">
                {field('name', 'Full name', { input: { autoComplete: 'name' } })}
                {field('phone', 'Phone', { input: { autoComplete: 'tel', inputMode: 'numeric', placeholder: '10 digits' } })}
                {field('email', 'Email', { full: true, input: { type: 'email', autoComplete: 'email' } })}
                {field('line1', 'Address', { full: true, input: { autoComplete: 'address-line1' } })}
                {field('city', 'City', { input: { autoComplete: 'address-level2' } })}
                <div className="field"><label className="lbl" htmlFor="f-state">State</label><select id="f-state" className="select" value={v.state} onChange={(e) => setV({ ...v, state: e.target.value })}>{STATES.map((x) => <option key={x}>{x}</option>)}</select></div>
                {field('pin', 'PIN code', { input: { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' } })}
              </div>
              <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                <legend className="lbl" style={{ marginBottom: 10 }}>Delivery method (demo options)</legend>
                {SHIPPING.map((x) => (
                  <label key={x.id} className="ship"><input type="radio" name="ship" checked={shipId === x.id} onChange={() => setShipId(x.id)} /><span><b>{x.name}</b><br /><span className="fine">{x.window}</span></span><b className="num">{x.fee ? rupees(x.fee) : 'Free'}</b></label>
                ))}
              </fieldset>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button><button type="submit" className="btn btn-primary btn-lg">Continue to payment <Icon n="arrow" className="arrow" /></button></div>
            </form>
          )}
          {step === 2 && (
            <>
              <h2 className="t-sec" style={{ fontSize: '1.6rem' }}>Payment (demo)</h2>
              <p className="demo-box">These are visual demo options only. No card, UPI or banking details are requested, stored or sent.</p>
              <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                <legend className="sr">Demo payment option</legend>
                {['UPI (demo)', 'Card (demo)', 'Cash on delivery (demo)'].map((x) => <label key={x} className="ship" style={{ gridTemplateColumns: 'auto 1fr' }}><input type="radio" name="pay" checked={pay === x} onChange={() => setPay(x)} /><b>{x}</b></label>)}
              </fieldset>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button><button type="button" className="btn btn-primary btn-lg" onClick={next}>Review order <Icon n="arrow" className="arrow" /></button></div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="t-sec" style={{ fontSize: '1.6rem' }}>Review & place demo order</h2>
              <table className="spec"><tbody>
                <tr><th scope="row">Deliver to</th><td>{v.name}<br />{v.line1}, {v.city}, {v.state} {v.pin}<br />{v.phone} · {v.email}</td></tr>
                <tr><th scope="row">Delivery</th><td>{ship.name} — {ship.window}</td></tr>
                <tr><th scope="row">Payment</th><td>{pay} — nothing collected</td></tr>
                <tr><th scope="row">Items</th><td>{s.bag.map((l) => `${l.kind === 'bundle' ? l.name : byId[l.id].name} × ${l.qty}`).join(', ')}</td></tr>
                <tr><th scope="row">Total</th><td><b className="num">{rupees(s.subtotal + ship.fee)}</b></td></tr>
              </tbody></table>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setStep(2)}>← Back</button><button type="button" className={`btn btn-primary btn-lg ${busy ? 'is-loading' : ''}`} disabled={busy} aria-busy={busy} onClick={place}>Place demo order</button></div>
            </>
          )}
        </div></section>
        <Summary s={s} ship={step >= 1 ? ship : null} />
      </div>
      <Footer />
    </div></div>
  )
}
