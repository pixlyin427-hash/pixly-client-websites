import { useMemo, useState } from 'react'
import { Link, useRoute } from '../lib/router'
import { useStore } from '../lib/store'
import { useStagePage } from '../lib/stagehook'
import { PRODUCTS, COLLECTIONS, CAT_LABEL, byId, COMPAT, AUDIO } from '../data/catalog'
import { rupees } from '../lib/format'
import { Icon, Price, Thumb } from '../components/ui'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

const USES = [['commute', 'Commuting'], ['study', 'Studying'], ['work', 'Working'], ['travel', 'Travelling'], ['home', 'Home listening'], ['entertainment', 'Entertainment']]
const FAMILY = { dark: 'Black & graphite', light: 'White & pale', violet: 'Violet & lavender' }
const familyOf = (c) => (/violet|lavender|lilac|ultra/i.test(c.name) ? 'violet' : c.light ? 'light' : 'dark')
const SORTS = [['featured', 'Featured'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['new', 'Newest']]
const emptyF = () => ({ type: [], max: 8000, wire: 'any', anc: false, port: [], use: [], fam: [], stock: false, owns: '' })

function applyFilters(list, f) {
  return list.filter((p) => {
    if (f.type.length && !f.type.includes(p.cat)) return false
    if (p.price > f.max) return false
    if (f.wire === 'wireless' && p.attrs.wireless !== true) return false
    if (f.wire === 'wired' && p.attrs.wireless !== false) return false
    if (f.anc && !p.attrs.anc) return false
    if (f.port.length && !f.port.includes(p.attrs.portable)) return false
    if (f.use.length && !f.use.some((u) => p.attrs.uses.includes(u))) return false
    if (f.fam.length && !p.colors.some((c) => f.fam.includes(familyOf(c)))) return false
    if (f.owns && !(COMPAT[p.id] || []).includes(f.owns)) return false
    return true
  })
}
const sorter = { featured: () => 0, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price }

function Group({ legend, children }) {
  return <div className="fgroup"><fieldset><legend>{legend}</legend>{children}</fieldset></div>
}
function Check({ label, checked, onChange, type = 'checkbox', name, count }) {
  return <label className="check"><input type={type} name={name} checked={checked} onChange={onChange} />{label}{count != null && <small>{count}</small>}</label>
}

function Hero({ cat, s, go }) {
  if (cat === 'headphones') {
    const p = byId['halo-one']
    return (
      <div className="panel flag"><div className="pad" style={{ display: 'grid', gap: 14 }}>
        <span className="eyebrow">Flagship</span>
        <h2 className="t-page">{p.name}</h2>
        <p className="lead">{p.pitch}</p>
        <Price p={p} />
        <div className="cta-row"><Link className="btn btn-primary" to={`/p/${p.id}`}>Explore HALO ONE <Icon n="arrow" className="arrow" /></Link><button type="button" className="btn btn-ghost" onClick={() => s.addProduct(p.id, p.colors[0].id)}><Icon n="bag" />Add to bag</button></div>
      </div><Thumb id={p.id} color="sonic-violet" /></div>
    )
  }
  if (cat === 'earbuds') {
    const [a, b] = [byId['orbit-pro'], byId['orbit-lite']]
    const side = (p, rows) => (
      <div className="panel" style={{ margin: 0 }}><div className="pad" style={{ display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center' }}>
        <Thumb id={p.id} className="" /><h2 className="t-prod" style={{ fontSize: '1.7rem' }}>{p.name}</h2>
        <Price p={p} /><ul className="feat" style={{ textAlign: 'left' }}>{rows.map((r) => <li key={r}>{r}</li>)}</ul>
        <Link className="btn btn-ghost btn-sm" to={`/p/${p.id}`}>View {p.name}</Link>
      </div></div>
    )
    return (
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="duel">{side(a, ['Active noise cancellation', 'Up to 30 h with the case', 'IPX4 (fictional spec)'])}{side(b, ['Touch controls', 'Up to 24 h with the case', 'Voice-call microphones'])}</div>
        <button type="button" className="btn btn-primary" style={{ justifySelf: 'center' }} onClick={() => { go('/compare?ids=orbit-pro,orbit-lite') }}>Compare ORBIT PRO vs ORBIT LITE <Icon n="arrow" className="arrow" /></button>
      </div>
    )
  }
  if (cat === 'speakers') {
    const [a, b] = [byId['aura-360'], byId['pulse-mini']]
    return (
      <div className="panel"><div className="pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, alignItems: 'end' }}>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'center', textAlign: 'center' }}><Thumb id={a.id} /><b className="num" style={{ fontSize: '1.4rem' }}>{a.name}</b><span className="muted">Room-filling · up to 12 h</span><Link className="tlink" to={`/p/${a.id}`}>View AURA 360</Link></div>
        <div style={{ display: 'grid', gap: 8, justifyItems: 'center', textAlign: 'center' }}><Thumb id={b.id} className="" /><b className="num" style={{ fontSize: '1.4rem' }}>{b.name}</b><span className="muted">Pocket-friendly · up to 8 h</span><Link className="tlink" to={`/p/${b.id}`}>View PULSE MINI</Link></div>
        <p className="note" style={{ gridColumn: '1 / -1' }}>Different jobs, same family: AURA 360 for rooms and small gatherings; PULSE MINI for desks, bedrooms and travel.</p>
      </div></div>
    )
  }
  return null
}

export default function Collection({ cat }) {
  const s = useStore()
  const { go } = useRoute()
  const isSaved = cat === 'saved'
  const known = cat && COLLECTIONS[cat]
  const info = isSaved ? { title: 'Saved items', blurb: 'Products you’ve saved in this browser.' } : known ? COLLECTIONS[cat] : { title: 'All audio', blurb: 'Every SONIQ product, accessory included. Filter, sort, or let the Soundstage guide you.' }
  const [f, setF] = useState(emptyF)
  const [sort, setSort] = useState('featured')
  const [open, setOpen] = useState(false)
  useStagePage({ view: 'dim' }, [cat])

  const base = useMemo(() => (isSaved ? PRODUCTS.filter((p) => s.saved.includes(p.id)) : known ? COLLECTIONS[cat].ids.map((id) => byId[id]) : PRODUCTS), [cat, isSaved, known, s.saved])
  const list = useMemo(() => {
    const r = applyFilters(base, f)
    if (sort === 'new') return [...r].reverse()
    return sort === 'featured' ? r : [...r].sort(sorter[sort])
  }, [base, f, sort])
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const toggle = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((i) => i !== v) : [...x[k], v] }))
  const pills = []
  f.type.forEach((t) => pills.push([CAT_LABEL[t], () => toggle('type', t)]))
  if (f.max < 8000) pills.push([`Up to ${rupees(f.max)}`, () => set('max', 8000)])
  if (f.wire !== 'any') pills.push([f.wire === 'wireless' ? 'Wireless' : 'Wired', () => set('wire', 'any')])
  if (f.anc) pills.push(['Noise cancellation', () => set('anc', false)])
  f.port.forEach((v) => pills.push([v === 'pocket' ? 'Pocket-sized' : 'Carry in a bag', () => toggle('port', v)]))
  f.use.forEach((v) => pills.push([USES.find((u) => u[0] === v)[1], () => toggle('use', v)]))
  f.fam.forEach((v) => pills.push([FAMILY[v], () => toggle('fam', v)]))
  if (f.owns) pills.push([`Fits ${byId[f.owns].name}`, () => set('owns', '')])
  const clear = () => setF(emptyF())
  const showOwns = cat === 'accessories' || !known

  return (
    <div className="sheet">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/shop">Shop</Link>{known && <><span aria-hidden="true">/</span><span aria-current="page">{info.title}</span></>}</nav>
        <div className="shop-top" style={{ marginTop: 14 }}>
          <span className="eyebrow">{isSaved ? 'Saved' : 'Collection'}</span>
          <h1 className="t-page">{info.title}</h1>
          <p className="lead">{info.blurb}</p>
          <div className="chips" role="navigation" aria-label="Collections">
            {[['all', 'All audio', '/shop'], ...Object.entries(COLLECTIONS).map(([k, v]) => [k, v.title, `/shop/${k}`])].map(([k, l, to]) => (
              <Link key={k} to={to} className="chip" aria-pressed={(cat || 'all') === k} aria-current={(cat || 'all') === k ? 'page' : undefined}>{l}</Link>
            ))}
          </div>
        </div>

        {known && ['headphones', 'earbuds', 'speakers'].includes(cat) && <div className="sec" style={{ marginTop: 28 }}><Hero cat={cat} s={s} go={go} /></div>}
        {cat === 'accessories' && (
          <div className="sec" style={{ marginTop: 28 }}>
            <div className="panel"><div className="pad" style={{ display: 'grid', gap: 12 }}>
              <h2 className="t-sec" style={{ fontSize: '1.5rem' }}>Which product do you own?</h2>
              <p className="muted">Pick a product and we’ll show only the accessories listed as compatible with it.</p>
              <label className="field" style={{ maxWidth: 360 }}><span className="lbl">My product</span>
                <select className="select" value={f.owns} onChange={(e) => set('owns', e.target.value)}>
                  <option value="">Show all accessories</option>
                  {AUDIO.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              {f.owns && <p className="fine" aria-live="polite">Showing accessories compatible with {byId[f.owns].name}. Compatibility is listed per accessory; nothing is implied beyond that.</p>}
            </div></div>
          </div>
        )}

        <div className="shop-layout">
          <aside className={`fpanel ${open ? 'open' : ''}`} aria-label="Filters" id="filters">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 className="t-prod">Filters</h2>{open && <button type="button" className="iconbtn" aria-label="Close filters" onClick={() => setOpen(false)}><Icon n="close" /></button>}</div>
            {!known && !isSaved && (
              <Group legend="Product type">{Object.keys(COLLECTIONS).map((t) => <Check key={t} label={CAT_LABEL[t]} checked={f.type.includes(t)} onChange={() => toggle('type', t)} />)}</Group>
            )}
            <Group legend="Max price"><input className="range" type="range" min="500" max="8000" step="100" value={f.max} aria-label="Maximum price" aria-valuetext={`Up to ${rupees(f.max)}`} onChange={(e) => set('max', +e.target.value)} /><span className="num">Up to {f.max >= 8000 ? 'any price' : rupees(f.max)}</span></Group>
            <Group legend="Connection">{[['any', 'Any'], ['wireless', 'Wireless'], ['wired', 'Wired']].map(([k, l]) => <Check key={k} type="radio" name="wire" label={l} checked={f.wire === k} onChange={() => set('wire', k)} />)}</Group>
            <Group legend="Noise cancellation"><Check label="Active noise cancellation" checked={f.anc} onChange={() => set('anc', !f.anc)} /></Group>
            <Group legend="Portability">{[['pocket', 'Pocket-sized'], ['bag', 'Carry in a bag']].map(([k, l]) => <Check key={k} label={l} checked={f.port.includes(k)} onChange={() => toggle('port', k)} />)}</Group>
            <Group legend="Primary use">{USES.map(([k, l]) => <Check key={k} label={l} checked={f.use.includes(k)} onChange={() => toggle('use', k)} />)}</Group>
            <Group legend="Colour">{Object.entries(FAMILY).map(([k, l]) => <Check key={k} label={l} checked={f.fam.includes(k)} onChange={() => toggle('fam', k)} />)}</Group>
            <Group legend="Availability"><Check label="In demo stock" checked={f.stock} onChange={() => set('stock', !f.stock)} count={base.length} /></Group>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clear} disabled={!pills.length}>Clear all filters</button>
            {open && <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>Show {list.length} result{list.length === 1 ? '' : 's'}</button>}
          </aside>

          <div>
            <div className="filters">
              <button type="button" className="btn btn-ghost btn-sm filter-toggle" aria-expanded={open} aria-controls="filters" onClick={() => setOpen(true)}>Filters{pills.length ? ` (${pills.length})` : ''}</button>
              <p aria-live="polite" role="status" style={{ marginRight: 'auto' }}><b className="num">{list.length}</b> <span className="muted">product{list.length === 1 ? '' : 's'}</span></p>
              <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="lbl">Sort</span>
                <select className="select sm" style={{ width: 'auto', minWidth: 170 }} value={sort} onChange={(e) => setSort(e.target.value)}>{SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              </label>
            </div>
            {pills.length > 0 && (
              <div className="active-filters" aria-label="Active filters" style={{ marginBottom: 14 }}>
                {pills.map(([l, rm]) => <span key={l} className="pill-x">{l}<button type="button" aria-label={`Remove filter ${l}`} onClick={rm}><Icon n="close" style={{ width: 12 }} /></button></span>)}
                <button type="button" className="tlink" onClick={clear}>Clear all</button>
              </div>
            )}
            {list.length === 0 ? (
              <div className="empty">
                <h2 className="t-prod">{isSaved && !s.saved.length ? 'Nothing saved yet' : 'No products match those filters'}</h2>
                <p className="muted">{isSaved && !s.saved.length ? 'Tap the heart on any product to save it here.' : 'Try removing a filter or two.'}</p>
                {isSaved && !s.saved.length ? <Link className="btn btn-primary" to="/shop">Browse all audio</Link> : <button type="button" className="btn btn-primary" onClick={clear}>Clear all filters</button>}
              </div>
            ) : (
              <div className="grid">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            )}
            {known && ['headphones', 'earbuds', 'speakers'].includes(cat) && list.length > 1 && (
              <div style={{ marginTop: 24 }}><Link className="btn btn-ghost" to={`/compare?ids=${list.slice(0, 3).map((p) => p.id).join(',')}`}><Icon n="compare" />Compare these {CAT_LABEL[cat].toLowerCase()}</Link></div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  )
}
