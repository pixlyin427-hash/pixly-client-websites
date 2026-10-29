import { useMemo, useState } from 'react'
import { Link } from '../lib/router'
import { useStore, bundleCheck } from '../lib/store'
import { useStagePage } from '../lib/stagehook'
import { BUNDLES, AUDIO, byId, accessoriesFor } from '../data/catalog'
import { rupees } from '../lib/format'
import { Icon, Swatches, Thumb } from '../components/ui'
import Footer from '../components/Footer'

function BundleCard({ b }) {
  const s = useStore()
  const { parts, delta } = bundleCheck(b)
  return (
    <article className="panel"><div className="pad bundle">
      <div className="bundle-parts" aria-hidden="true">
        {b.items.map((it, i) => (<span key={it.id} style={{ display: 'contents' }}>{i > 0 && <span className="plus">+</span>}<Thumb id={it.id} color={it.color} alt="" /></span>))}
      </div>
      <div style={{ display: 'grid', gap: 10, padding: '4px 0 0 24px', alignContent: 'start' }}>
        <h3 className="t-sec" style={{ fontSize: '1.6rem' }}>{b.name}</h3>
        <p className="muted">{b.blurb}</p>
        <ul className="feat">{b.items.map((it) => <li key={it.id}><Link to={`/p/${it.id}`}>{byId[it.id].name}</Link> <span className="muted">· {rupees(byId[it.id].price)}</span></li>)}</ul>
        <div className="sum-row" style={{ borderTop: '1px solid var(--edge)', paddingTop: 10 }}><span>Bundle price</span><b className="num" style={{ fontSize: '1.4rem' }}>{rupees(b.price)}</b></div>
        <div className="sum-row fine"><span>Items priced separately</span><span className="num">{rupees(parts)}</span></div>
        {delta > 0 && <p className="fine" style={{ color: 'var(--cyan)' }}>Difference vs. separate prices: {rupees(delta)} lower (arithmetic from the demo prices).</p>}
        {delta < 0 && <p className="verify" role="note">Prototype data check: the supplied bundle price is {rupees(-delta)} above the sum of its items. Shown exactly as supplied and not presented as a saving — to be confirmed before any launch.</p>}
        <button type="button" className="btn btn-primary" onClick={() => s.addBundle({ id: b.id, name: b.name, price: b.price, items: b.items })}><Icon n="bag" />Add bundle to bag</button>
      </div>
    </div></article>
  )
}

function Builder() {
  const s = useStore()
  const [base, setBase] = useState('halo-one')
  const [color, setColor] = useState(byId['halo-one'].colors[0].id)
  const [extra, setExtra] = useState([])
  const bp = byId[base]
  const accs = useMemo(() => accessoriesFor(base), [base])
  const chosen = accs.filter((a) => extra.includes(a.id))
  const total = bp.price + chosen.reduce((n, a) => n + a.price, 0)
  const change = (id) => { setBase(id); setColor(byId[id].colors[0].id); setExtra([]) }
  const add = () => {
    s.addProduct(base, color)
    chosen.forEach((a) => s.addProduct(a.id, a.colors[0].id))
  }
  return (
    <div className="panel"><div className="pad builder">
      <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
        <label className="field"><span className="lbl">1 · Choose your main product</span>
          <select className="select" value={base} onChange={(e) => change(e.target.value)}>{AUDIO.map((p) => <option key={p.id} value={p.id}>{p.name} — {rupees(p.price)}</option>)}</select>
        </label>
        <div><span className="lbl label" style={{ display: 'block', marginBottom: 8 }}>Finish</span><Swatches product={bp} value={color} onChange={setColor} /></div>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: 8, padding: 0 }}>2 · Add compatible accessories</legend>
          {accs.length === 0 ? <p className="muted">No compatible accessories are listed for {bp.name}.</p> : accs.map((a) => (
            <label key={a.id} className="check"><input type="checkbox" checked={extra.includes(a.id)} onChange={() => setExtra((x) => (x.includes(a.id) ? x.filter((i) => i !== a.id) : [...x, a.id]))} />{a.name}<small>{rupees(a.price)}</small></label>
          ))}
        </fieldset>
      </div>
      <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
        <div className="bundle-parts" style={{ minHeight: 190 }}><Thumb id={base} color={color} />{chosen.slice(0, 2).map((a) => <Thumb key={a.id} id={a.id} />)}</div>
        <div role="status" aria-live="polite">
          <div className="sum-row"><span>{bp.name}</span><span className="num">{rupees(bp.price)}</span></div>
          {chosen.map((a) => <div key={a.id} className="sum-row"><span>{a.name}</span><span className="num">{rupees(a.price)}</span></div>)}
          <div className="sum-row total"><span>Total</span><span className="num">{rupees(total)}</span></div>
          <p className="fine">Calculated from the displayed demo prices. No discount is applied to custom selections.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={add}><Icon n="bag" />Add {1 + chosen.length} item{chosen.length ? 's' : ''} to bag</button>
      </div>
    </div></div>
  )
}

export default function Bundles() {
  useStagePage({ view: 'dim' }, [])
  return (
    <div className="sheet"><div className="wrap">
      <span className="eyebrow">Bundles</span>
      <h1 className="t-page" style={{ margin: '12px 0' }}>Sets & bundle builder</h1>
      <p className="lead">Three proposed sets from the brief, with prices exactly as supplied — plus a builder that only offers accessories listed as compatible.</p>
      <div className="sec" style={{ display: 'grid', gap: 18, marginTop: 28 }}>{BUNDLES.map((b) => <BundleCard key={b.id} b={b} />)}</div>
      <section className="sec" aria-labelledby="bb"><div className="sec-head"><div><span className="eyebrow">Build your own</span><h2 id="bb" className="t-sec">Bundle builder</h2></div></div><Builder /></section>
      <Footer />
    </div></div>
  )
}
