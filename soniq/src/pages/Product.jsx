import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from '../lib/router'
import { useStore, useStage, useMedia } from '../lib/store'
import { useStagePage } from '../lib/stagehook'
import { byId, accessoriesFor, compatibleWith, CAT_LABEL, COLLECTIONS, AUDIO } from '../data/catalog'
import { Icon, Price, Swatches, Thumb } from '../components/ui'
import Reviews from '../components/Reviews'
import { rupees, pct } from '../lib/format'

const TABS = [['overview', 'Overview'], ['specs', 'Specs'], ['details', 'Details'], ['box', 'Box'], ['reviews', 'Reviews']]
const view = (detail) => window.dispatchEvent(new CustomEvent('soniq:view', { detail }))
const MAX_BATTERY = Math.max(...AUDIO.map((x) => x.attrs.battery || 0))

function Tabs({ value, onChange }) {
  const ref = useRef()
  const onKey = (e) => {
    const i = TABS.findIndex(([k]) => k === value)
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : null
    if (n == null) return
    e.preventDefault()
    const t = TABS[(n + TABS.length) % TABS.length][0]
    onChange(t)
    requestAnimationFrame(() => ref.current?.querySelector(`#tab-${t}`)?.focus())
  }
  return (
    <div className="tabs" role="tablist" aria-label="Product information" ref={ref} onKeyDown={onKey}>
      {TABS.map(([k, l]) => (
        <button key={k} id={`tab-${k}`} type="button" role="tab" className="tab" aria-selected={value === k} aria-controls={`tp-${k}`} tabIndex={value === k ? 0 : -1} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  )
}

export default function Product({ id }) {
  const p = byId[id]
  if (!p) return <Missing />
  return <ProductInner key={id} p={p} />
}
function Missing() {
  useStagePage({ view: 'dim' }, [])
  return (
    <div className="sheet"><div className="wrap" style={{ display: 'grid', gap: 16, justifyItems: 'center', textAlign: 'center', paddingTop: '12vh' }}>
      <h1 className="t-page">We can’t find that product</h1>
      <Link to="/shop" className="btn btn-primary">Shop all audio</Link>
    </div></div>
  )
}

function ProductInner({ p }) {
  const s = useStore()
  const { cfg, patch } = useStage()
  const mobile = useMedia('(max-width: 820px)')
  const [color, setColor] = useState(p.colors[0].id)
  const [tab, setTab] = useState('overview')
  const detail = p.anatomy.find((a) => a.id === cfg.detail) || null
  const cdef = p.colors.find((c) => c.id === color)
  const saved = s.saved.includes(p.id)
  const cmp = s.compare.includes(p.id)
  const accs = useMemo(() => accessoriesFor(p.id).filter((a) => a.id !== p.id), [p])
  const related = useMemo(() => AUDIO.filter((x) => x.cat === p.cat && x.id !== p.id), [p])
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const inset = mobile ? { b: Math.round(vh * 0.52) } : { r: Math.min(460, window.innerWidth * 0.42) + 20, b: 60 }
  const detailKey = cfg.detail && p.anatomy.some((a) => a.id === cfg.detail) ? cfg.detail : null

  useStagePage({ view: 'product', product: p.id, color, inset, detail: null, open: p.model === 'earbuds', resetKey: cfg.resetKey || 0 }, [p.id, mobile])
  useEffect(() => { patch({ color }) }, [color]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { s.viewed(p.id) }, [p.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // keyboard alternatives to dragging
  useEffect(() => {
    const on = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.getAttribute?.('role') === 'tab') return
      if (e.key === 'ArrowLeft') { view({ type: 'rotate', amount: 0.4 }); e.preventDefault() }
      else if (e.key === 'ArrowRight') { view({ type: 'rotate', amount: -0.4 }); e.preventDefault() }
      else if (e.key === '+' || e.key === '=') view({ type: 'zoom', amount: -0.15 })
      else if (e.key === '-') view({ type: 'zoom', amount: 0.15 })
      else if (e.key === '0') reset()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })
  const reset = () => patch({ detail: null, resetKey: (cfg.resetKey || 0) + 1 })
  const pick = (a) => { patch({ detail: cfg.detail === a.id ? null : a.id }); }
  const pickTab = (t) => { setTab(t) }
  const savings = p.ref ? p.ref - p.price : 0
  const compat = p.cat === 'accessories' ? compatibleWith(p.id) : []

  return (
    <div className="stagepage">
      <div className="viewer-hint">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">/</span><Link to={`/shop/${p.cat}`}>{CAT_LABEL[p.cat]}</Link><span aria-hidden="true">/</span><span aria-current="page">{p.name}</span>
        </nav>
      </div>

      <div className="viewer-tools" role="toolbar" aria-label="3D viewer controls">
        <div className="group">
          <button type="button" className="iconbtn" aria-label="Rotate left" onClick={() => view({ type: 'rotate', amount: 0.5 })}><Icon n="left" /></button>
          <button type="button" className="iconbtn" aria-label="Rotate right" onClick={() => view({ type: 'rotate', amount: -0.5 })}><Icon n="right" /></button>
          <button type="button" className="iconbtn" aria-label="Zoom in" onClick={() => view({ type: 'zoom', amount: -0.18 })}><Icon n="plus" /></button>
          <button type="button" className="iconbtn" aria-label="Zoom out" onClick={() => view({ type: 'zoom', amount: 0.18 })}><Icon n="minus" /></button>
          <button type="button" className="iconbtn" aria-label="Reset view" onClick={reset}><Icon n="reset" /></button>
        </div>
        {p.anatomy.length > 0 && !mobile && (
          <div className="chips" role="group" aria-label="Close-up views">
            {p.anatomy.map((a) => <button key={a.id} type="button" className="chip" aria-pressed={cfg.detail === a.id} onClick={() => pick(a)}>{a.label}</button>)}
          </div>
        )}
        {!mobile && <span className="fine" style={{ width: '100%' }}>Drag to orbit · arrow keys rotate · + / − zoom · 0 resets</span>}
      </div>

      <section className="ppanel" aria-label={`${p.name} details`}>
        <div className="panel">
          <div className="ppanel-scroll">
            <header>
              <span className="eyebrow">{CAT_LABEL[p.cat]} · {p.type}</span>
              <h1 className="t-page" style={{ fontSize: 'clamp(1.9rem, 3vw, 2.6rem)', margin: '8px 0 2px' }}>{p.name}</h1>
              <p className="muted">{p.tagline}</p>
            </header>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'grid', gap: 4 }}><Price p={p} />{savings > 0 && <span className="fine">Demo reference price {rupees(p.ref)} · {pct(p.price, p.ref)}% below reference</span>}</div>
              <span className="badge ok">In demo stock</span>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Finish · <span aria-live="polite" style={{ color: '#fff' }}>{cdef.name}</span></div>
              <Swatches product={p} value={color} onChange={setColor} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary" style={{ flex: '1 1 auto' }} onClick={() => s.addProduct(p.id, color)}><Icon n="bag" />Add to bag</button>
              {p.cat !== 'accessories' && <button type="button" className="btn btn-ghost" aria-pressed={cmp} onClick={() => s.toggleCompare(p.id)}><Icon n="compare" />{cmp ? 'In compare' : 'Compare'}</button>}
              <button type="button" className="iconbtn" style={{ width: 48, height: 48, border: '1px solid var(--edge-strong)', flex: 'none' }} aria-pressed={saved} aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`} onClick={() => s.toggleSaved(p.id)}><Icon n="heart" style={saved ? {} : { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 }} /></button>
            </div>

            <Tabs value={tab} onChange={pickTab} />

            <div role="tabpanel" id={`tp-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} style={{ display: 'grid', gap: 16 }}>
              {tab === 'overview' && (
                <>
                  {p.msg && <p className="bigq" style={{ fontSize: '1.5rem' }}>“{p.msg}”</p>}
                  <p className="lead" style={{ maxWidth: 'none' }}>{p.pitch}</p>
                  <ul className="feat">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                  {compat.length > 0 && <div><div className="label" style={{ marginBottom: 8 }}>Compatible with</div><div className="chips">{compat.map((c) => <Link key={c.id} to={`/p/${c.id}`} className="chip">{c.name}</Link>)}</div>{p.id === 'link-dac' && <p className="note" style={{ marginTop: 10 }}>Device support varies. Pairing shown with ARC STUDIO (3.5 mm wired listening).</p>}</div>}
                </>
              )}
              {tab === 'specs' && (
                <>
                  {p.attrs.battery != null && (
                    <div className="bar-meter">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="label">Playback (prototype claim)</span><b className="num">Up to {p.attrs.battery} h</b></div>
                      <div className="track" role="img" aria-label={`${p.attrs.battery} hours of ${MAX_BATTERY} hours maximum in the range`}><div className="fill" style={{ width: `${(p.attrs.battery / MAX_BATTERY) * 100}%` }} /></div>
                      <span className="fine">Relative to the longest playback claim in the SONIQ range ({MAX_BATTERY} h, HALO ONE with ANC off). Fictional specification.</span>
                    </div>
                  )}
                  <table className="spec"><tbody>{p.specs.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}</tbody></table>
                  <p className="note">All specifications are fictional prototype content and have not been tested or certified.</p>
                </>
              )}
              {tab === 'details' && (
                <>
                  <p className="muted">{p.design}</p>
                  {p.anatomy.length > 0 ? (
                    <div className="mini-list">
                      {p.anatomy.map((a) => (
                        <button key={a.id} type="button" className="mini" style={{ gridTemplateColumns: '1fr auto', textAlign: 'left', ...(cfg.detail === a.id ? { borderColor: 'var(--lav)', background: 'rgba(124,58,237,.25)' } : {}) }} aria-pressed={cfg.detail === a.id} onClick={() => pick(a)}>
                          <span><b>{a.label}</b><br /><span className="fine">{a.text}</span></span><span className="tlink" aria-hidden="true">{cfg.detail === a.id ? 'Showing' : 'Close-up'}</span>
                        </button>
                      ))}
                      {detail && <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Back to full view</button>}
                    </div>
                  ) : <p className="muted">Close-up views are provided for the main audio products.</p>}
                  <div>
                    <div className="label" style={{ marginBottom: 10 }}>Finish gallery</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10 }}>
                      {p.colors.map((c) => (
                        <button key={c.id} type="button" className="opt" style={{ padding: 8, justifyItems: 'center', textAlign: 'center' }} aria-pressed={color === c.id} onClick={() => setColor(c.id)}>
                          <span className="pcard" style={{ width: '100%' }}><span className={`pcard-media ${''}`} style={{ borderRadius: 10, display: 'block', background: c.light ? 'radial-gradient(circle at 50% 60%, #f1edfb, #d9d1ee)' : undefined }}><Thumb id={p.id} color={c.id} alt="" /></span></span>
                          <b style={{ fontSize: '.85rem' }}>{c.name}</b>
                        </button>
                      ))}
                    </div>
                    <p className="note" style={{ marginTop: 10 }}>Renders of the concept model in each catalogue finish. Light finishes sit on a light viewing surface so their detail stays visible.</p>
                  </div>
                  <p className="note">The 3D models are simplified concept models, not photographs of real products.</p>
                </>
              )}
              {tab === 'box' && (
                <>
                  <div><div className="label" style={{ marginBottom: 8 }}>What’s in the box (placeholder)</div><ul className="feat"><li>{p.name}</li><li>Documentation — contents to be confirmed</li></ul><p className="note" style={{ marginTop: 8 }}>The brief does not specify box contents; the final list must be confirmed before any real launch.</p></div>
                  <div><div className="label" style={{ marginBottom: 8 }}>Compatibility</div><p className="muted">{p.cat === 'accessories' ? (compat.length ? `Compatible with ${compat.map((c) => c.name).join(', ')}.` : 'Device support varies.') : accs.length ? `Compatible accessories are listed below under “Pairs with”.` : 'No compatible accessories are listed for this product.'} <Link className="tlink" to="/support/compatibility">Compatibility guide</Link></p></div>
                  <div><div className="label" style={{ marginBottom: 8 }}>Delivery & policies (draft placeholders)</div><ul className="feat"><li><Link className="tlink" to="/support/shipping">Shipping information</Link></li><li><Link className="tlink" to="/support/warranty">Warranty — proposed one-year limited warranty</Link></li><li><Link className="tlink" to="/support/returns">Returns & replacements</Link></li></ul></div>
                </>
              )}
              {tab === 'reviews' && <Reviews cat={p.cat} />}
            </div>

            {accs.length > 0 && (
              <section aria-labelledby="pairs">
                <h2 id="pairs" className="t-prod" style={{ marginBottom: 10 }}>Pairs with</h2>
                <ul className="mini-list">
                  {accs.map((a) => (
                    <li key={a.id} className="mini">
                      <Thumb id={a.id} />
                      <span><Link to={`/p/${a.id}`}><b>{a.name}</b></Link><br /><span className="fine">{a.tagline} · {rupees(a.price)}</span><br /><span className="fine" style={{ color: 'var(--cyan)' }}>✓ Compatible with {p.name}</span></span>
                      <button type="button" className="btn btn-ghost btn-sm" aria-label={`Add ${a.name} to bag`} onClick={() => s.addProduct(a.id, a.colors[0].id)}>Add</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {related.length > 0 && (
              <section aria-labelledby="rel">
                <h2 id="rel" className="t-prod" style={{ marginBottom: 10 }}>Also in {CAT_LABEL[p.cat]}</h2>
                <ul className="mini-list">
                  {related.map((a) => (
                    <li key={a.id} className="mini"><Thumb id={a.id} /><span><Link to={`/p/${a.id}`}><b>{a.name}</b></Link><br /><span className="fine">{a.tagline}</span></span><b className="num">{rupees(a.price)}</b></li>
                  ))}
                </ul>
              </section>
            )}
            <p className="fine">Fictional prototype product. {COLLECTIONS[p.cat]?.title ? '' : ''}No real order can be placed.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
