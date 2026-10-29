import { useMemo, useState } from 'react'
import { Link } from '../lib/router'
import { useStore } from '../lib/store'
import { useStagePage } from '../lib/stagehook'
import { FAQ, POLICIES, AUDIO, PRODUCTS, byId, COMPAT, compatibleWith, accessoriesFor, STUDIO } from '../data/catalog'
import { rupees } from '../lib/format'
import { Icon } from '../components/ui'
import Footer from '../components/Footer'

const TOPICS = [
  ['', 'Help centre'], ['faq', 'FAQ'], ['compatibility', 'Compatibility'], ['setup', 'Setup guidance'], ['order-status', 'Order status (demo)'], ['contact', 'Contact support'],
  ['shipping', 'Shipping'], ['warranty', 'Warranty'], ['returns', 'Returns'], ['privacy', 'Privacy'], ['accessibility', 'Accessibility'], ['about', 'About SONIQ'],
]
const DRAFT = ['shipping', 'warranty', 'returns', 'privacy']

function Faq({ items = FAQ }) {
  const [open, setOpen] = useState(0)
  return (
    <div>{items.map(([q, a], i) => (
      <div key={q} className="acc">
        <h3><button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} id={`faqb-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>{q}<Icon n="plus" /></button></h3>
        <div className="ans" id={`faq-${i}`} role="region" aria-labelledby={`faqb-${i}`}><div><p>{a}</p></div></div>
      </div>
    ))}</div>
  )
}

function Compat() {
  const [pid, setPid] = useState('halo-one')
  const [aid, setAid] = useState('')
  const accs = accessoriesFor(pid)
  const accList = PRODUCTS.filter((p) => COMPAT[p.id])
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="panel"><div className="pad" style={{ display: 'grid', gap: 12 }}>
        <label className="field"><span className="lbl">I own / I’m buying</span>
          <select className="select" value={pid} onChange={(e) => setPid(e.target.value)}>{AUDIO.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </label>
        <div aria-live="polite">{accs.length ? <ul className="mini-list">{accs.map((a) => <li key={a.id} className="mini" style={{ gridTemplateColumns: '1fr auto' }}><span><Link to={`/p/${a.id}`}><b>{a.name}</b></Link><br /><span className="fine">✓ Listed as compatible with {byId[pid].name} · {rupees(a.price)}</span></span></li>)}</ul> : <p className="muted">No accessories are listed as compatible with {byId[pid].name}.</p>}</div>
      </div></div>
      <div className="panel"><div className="pad" style={{ display: 'grid', gap: 12 }}>
        <label className="field"><span className="lbl">Check an accessory</span>
          <select className="select" value={aid} onChange={(e) => setAid(e.target.value)}><option value="">Choose an accessory…</option>{accList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        </label>
        {aid && <p aria-live="polite">{byId[aid].name} works with: <b>{compatibleWith(aid).map((p) => p.name).join(', ')}</b>.{aid === 'link-dac' ? ' Device (phone / laptop) support varies — to be verified before any launch.' : ''}</p>}
      </div></div>
      <p className="note">Compatibility lists are prototype data resolved from the brief: “compatible headphones” = HALO ONE, HALO AIR and ARC STUDIO; the cable fits USB-C products; the case cover and cushions are listed for ORBIT PRO and HALO ONE only.</p>
    </div>
  )
}

const SETUP = {
  headphones: ['Charge fully with a USB-C cable (HALO ONE, HALO AIR).', 'Wireless: put the headphones in pairing mode and select them on your device (placeholder steps).', 'ARC STUDIO: connect the detachable audio cable to the 3.5 mm port of your source.', 'Adjust headband and earcups for a comfortable fit.'],
  earbuds: ['Charge the case via USB-C.', 'Open the case lid near your device to start pairing (placeholder steps).', 'Choose the ear-tip fit that seals comfortably.', 'ORBIT PRO: choose a listening mode — noise cancellation or transparency.'],
  speakers: ['Charge via USB-C before first use.', 'Power on and pair from your device’s Bluetooth list (placeholder steps).', 'AURA 360: stereo-pairing is a concept feature in this prototype.', 'Place on a stable surface; observe the product’s water-resistance rating (fictional spec).'],
}
function Setup() {
  const [c, setC] = useState('headphones')
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="chips" role="group" aria-label="Product type">{Object.keys(SETUP).map((k) => <button key={k} type="button" className="chip" aria-pressed={c === k} onClick={() => setC(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div>
      <ol className="feat" style={{ counterReset: 's', gap: 12 }}>{SETUP[c].map((t) => <li key={t}>{t}</li>)}</ol>
      <p className="note">Placeholder guidance for a fictional product — real setup steps would come from the finished product’s documentation.</p>
    </div>
  )
}

function OrderStatus() {
  const s = useStore()
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const submit = (e) => { e.preventDefault(); const id = q.trim().toUpperCase(); setRes(id ? s.orders.find((o) => o.id === id) || 'none' : 'empty') }
  return (
    <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
      <p className="muted">Enter the fictional confirmation number from a demo checkout completed in this browser.</p>
      <form onSubmit={submit} className="field" noValidate>
        <label htmlFor="ord" className="lbl">Confirmation number</label>
        <div style={{ display: 'flex', gap: 8 }}><input id="ord" className="input" placeholder="SNQ-DEMO-XXXXXX" value={q} onChange={(e) => setQ(e.target.value)} aria-invalid={res === 'empty'} aria-describedby="ord-res" /><button className="btn btn-primary" type="submit">Check</button></div>
      </form>
      <div id="ord-res" aria-live="polite">
        {res === 'empty' && <p className="field"><span className="err">Enter a confirmation number.</span></p>}
        {res === 'none' && <p className="demo-box">No demo order with that number was found in this browser.</p>}
        {res && typeof res === 'object' && <div className="panel"><div className="pad"><b className="conf-no">{res.id}</b><p className="muted">Status: <b style={{ color: '#fff' }}>Demo order — simulated</b>. Nothing was ordered, paid for or shipped.</p><p className="fine">Created {new Date(res.createdAt).toLocaleString()} · total {rupees(res.total)}</p></div></div>}
      </div>
    </div>
  )
}

function Contact() {
  const [v, setV] = useState({ name: '', email: '', topic: 'Product compatibility', msg: '' })
  const [err, setErr] = useState({})
  const [done, setDone] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    const er = {}
    if (v.name.trim().length < 2) er.name = 'Enter your name.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) er.email = 'Enter a valid email address.'
    if (v.msg.trim().length < 10) er.msg = 'Tell us a little more (at least 10 characters).'
    setErr(er)
    if (Object.keys(er).length) { document.getElementById(`c-${Object.keys(er)[0]}`)?.focus(); return }
    setDone(true)
  }
  if (done) return <div className="confirm"><div className="ring"><Icon n="check" style={{ width: 54, color: 'var(--lav)' }} /></div><h2 className="t-sec">Message recorded (demo)</h2><p className="muted" style={{ maxWidth: '46ch' }}>This is a prototype: your message was not sent anywhere and nobody will reply.</p><button type="button" className="btn btn-ghost" onClick={() => { setDone(false); setV({ name: '', email: '', topic: 'Product compatibility', msg: '' }) }}>Write another</button></div>
  const f = (k, label, type = 'text', props = {}) => (
    <div className="field"><label className="lbl" htmlFor={`c-${k}`}>{label}</label>
      <input id={`c-${k}`} className="input" type={type} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} aria-invalid={!!err[k]} aria-describedby={err[k] ? `c-${k}-e` : undefined} {...props} />
      {err[k] && <span className="err" id={`c-${k}-e`}>{err[k]}</span>}</div>
  )
  return (
    <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 16, maxWidth: 620 }}>
      <p className="demo-box">Demo form — nothing is transmitted. Please don’t enter real personal details.</p>
      <div className="form-grid">{f('name', 'Name', 'text', { autoComplete: 'name' })}{f('email', 'Email', 'email', { autoComplete: 'email' })}</div>
      <div className="field"><label className="lbl" htmlFor="c-topic">Topic</label><select id="c-topic" className="select" value={v.topic} onChange={(e) => setV({ ...v, topic: e.target.value })}>{['Product compatibility', 'Setup guidance', 'Order status', 'Something else'].map((t) => <option key={t}>{t}</option>)}</select></div>
      <div className="field"><label className="lbl" htmlFor="c-msg">Message</label><textarea id="c-msg" className="textarea" value={v.msg} onChange={(e) => setV({ ...v, msg: e.target.value })} aria-invalid={!!err.msg} aria-describedby={err.msg ? 'c-msg-e' : undefined} />{err.msg && <span className="err" id="c-msg-e">{err.msg}</span>}</div>
      <button className="btn btn-primary" type="submit" style={{ justifySelf: 'start' }}>Send (demo)</button>
    </form>
  )
}

export default function Support({ topic }) {
  useStagePage({ view: 'dim' }, [])
  const t = topic || ''
  const label = (TOPICS.find(([k]) => k === t) || TOPICS[0])[1]
  const pol = POLICIES[t]
  return (
    <div className="sheet"><div className="wrap">
      <span className="eyebrow">Support & guidance</span>
      <h1 className="t-page" style={{ margin: '12px 0 28px' }}>{label}{DRAFT.includes(t) ? ' (draft)' : ''}</h1>
      <div className="sup-layout">
        <nav className="sup-nav" aria-label="Support topics">{TOPICS.map(([k, l]) => <Link key={k} to={k ? `/support/${k}` : '/support'} aria-current={t === k ? 'page' : undefined}>{l}</Link>)}</nav>
        <div style={{ minWidth: 0 }}>
          {t === '' && (
            <div style={{ display: 'grid', gap: 26 }}>
              <p className="lead">Direct answers first. Start with a topic, or browse the most common questions.</p>
              <div className="hub" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
                {[['compatibility', 'Compatibility guide', 'Which accessories fit which product.'], ['setup', 'Setup guidance', 'Charge, pair, fit.'], ['order-status', 'Order status', 'Check a demo confirmation number.'], ['contact', 'Contact support', 'A validated demo form.']].map(([k, h, d]) => (
                  <Link key={k} to={`/support/${k}`} className="panel pad opt" style={{ display: 'grid', gap: 6 }}><b className="num" style={{ fontSize: '1.15rem' }}>{h}</b><span className="muted">{d}</span></Link>
                ))}
              </div>
              <Faq items={FAQ.slice(0, 5)} />
            </div>
          )}
          {t === 'faq' && <Faq />}
          {t === 'compatibility' && <Compat />}
          {t === 'setup' && <Setup />}
          {t === 'order-status' && <OrderStatus />}
          {t === 'contact' && <Contact />}
          {t === 'about' && (
            <div style={{ display: 'grid', gap: 16, maxWidth: '68ch' }}>
              <p className="lead">SONIQ is an imagined audio-tech brand that brings together considered product design, immersive listening and approachable technology for everyday music fans, commuters, creators and entertainment lovers.</p>
              <ul className="feat">{['Thoughtful sound and comfort.', 'Distinctive industrial design.', 'Useful technology rather than features for their own sake.', 'Simple, transparent shopping.', 'A welcoming, hands-on listening experience.'].map((v) => <li key={v}>{v}</li>)}</ul>
              <p className="demo-box">Fictional concept for a website-design prototype. Founder: {STUDIO.founder}. Based, fictionally, in Palghar, Maharashtra.</p>
            </div>
          )}
          {pol && (
            <div style={{ display: 'grid', gap: 14, maxWidth: '68ch' }}>
              {DRAFT.includes(t) && <p className="verify" role="note">Draft placeholder — not a final business policy. Requires proper review before any real launch.</p>}
              {pol.body.map((b) => <p key={b} className="lead" style={{ maxWidth: 'none' }}>{b}</p>)}
              {t === 'shipping' && <table className="spec"><tbody>{[['Store pickup (demo)', '₹0'], ['Standard delivery (demo)', '₹99 · placeholder 4–6 working days'], ['Express delivery (demo)', '₹199 · placeholder 1–2 working days']].map(([a, b]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td></tr>)}</tbody></table>}
              {t === 'accessibility' && (
                <>
                  <h2 className="t-prod">Keyboard shortcuts</h2>
                  <table className="spec"><tbody>{[['/', 'Open search'], ['B', 'Open the bag'], ['C', 'Open compare'], ['← →', 'Rotate the product on a product page'], ['+ / −', 'Zoom the product'], ['0', 'Reset the 3D view'], ['Esc', 'Close dialogs']].map(([k, d]) => <tr key={k}><th scope="row"><kbd className="kbd">{k}</kbd></th><td>{d}</td></tr>)}</tbody></table>
                  <p className="muted">Reduced motion: if your system asks for reduced motion, camera moves, ring animation and transitions are minimised. You can also use “Lite 3D” or “3D off” from the footer.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div></div>
  )
}
