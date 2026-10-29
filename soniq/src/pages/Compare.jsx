import { useEffect, useMemo } from 'react'
import { Link, useRoute } from '../lib/router'
import { useStore } from '../lib/store'
import { useStagePage } from '../lib/stagehook'
import { AUDIO, byId, CAT_LABEL } from '../data/catalog'
import { rupees } from '../lib/format'
import { Icon, Price, Thumb } from '../components/ui'
import Footer from '../components/Footer'

const spec = (p, k) => (p.specs.find(([l]) => l === k) || [])[1] || '—'
const USE = { commute: 'Commuting', study: 'Studying', work: 'Working', travel: 'Travelling', home: 'Home listening', entertainment: 'Entertainment' }
const ROWS = {
  common: [
    ['Demo price', (p) => rupees(p.price), (p) => p.price, 'min'],
    ['Reference price', (p) => (p.ref ? rupees(p.ref) : '—')],
    ['Form factor', (p) => p.attrs.form],
    ['Connection', (p) => (p.attrs.wireless ? 'Wireless' : 'Wired')],
    ['Noise cancellation', (p) => (p.attrs.anc ? 'Yes' : 'Not listed')],
    ['Playback claim', (p) => (p.attrs.battery ? `Up to ${p.attrs.battery} h${p.cat === 'earbuds' ? ' (with case)' : ''}` : 'Wired — no battery'), (p) => p.attrs.battery || 0, 'max'],
    ['Charging', (p) => spec(p, 'Charging') !== '—' ? spec(p, 'Charging') : spec(p, 'Case charging') !== '—' ? `${spec(p, 'Case charging')} (case)` : '—'],
    ['Water resistance', (p) => (p.attrs.ip ? `${p.attrs.ip} (fictional spec)` : 'Not rated')],
    ['Best for', (p) => p.attrs.uses.map((u) => USE[u]).join(', ')],
    ['Colours', (p) => p.colors.map((c) => c.name).join(', ')],
  ],
  headphones: [['Folding', (p) => spec(p, 'Folding')], ['Multi-device', (p) => (p.id === 'halo-one' ? 'Dual-device connection' : '—')], ['Cable', (p) => (p.id === 'arc-studio' ? 'Detachable, 3.5 mm' : '—')]],
  earbuds: [['Controls', (p) => (p.id === 'orbit-lite' ? 'Touch controls' : 'Multiple listening modes')], ['Calls', (p) => (p.id === 'orbit-lite' ? 'Voice-call microphones' : '—')]],
  speakers: [['Sound', (p) => (p.id === 'aura-360' ? '360-degree sound concept' : 'Compact body, carry loop')], ['Pairing', (p) => (p.id === 'aura-360' ? 'Wireless stereo-pairing concept' : '—')]],
}

export default function Compare() {
  const s = useStore()
  const { query, go } = useRoute()
  useStagePage({ view: 'dim' }, [])
  // seed from ?ids= (same category only), once
  useEffect(() => {
    if (!query.ids) return
    const ids = query.ids.split(',').filter((i) => byId[i] && byId[i].cat !== 'accessories')
    if (!ids.length) return
    const cat = byId[ids[0]].cat
    s.setCompare(ids.filter((i) => byId[i].cat === cat).slice(0, 3))
    go('/compare')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cat = s.compare.length ? byId[s.compare[0]].cat : (['headphones', 'earbuds', 'speakers'].includes(query.cat) ? query.cat : 'headphones')
  const pool = AUDIO.filter((p) => p.cat === cat)
  const picked = s.compare.map((i) => byId[i]).filter(Boolean)
  const rows = useMemo(() => [...ROWS.common, ...ROWS[cat]], [cat])
  const setCat = (c) => s.setCompare(AUDIO.filter((p) => p.cat === c).slice(0, 2).map((p) => p.id))

  return (
    <div className="sheet"><div className="wrap">
      <span className="eyebrow">Product comparison studio</span>
      <h1 className="t-page" style={{ margin: '12px 0' }}>Compare</h1>
      <p className="lead">Choose two or three products from the same category. We don’t compare headphones with speakers as if they shared the same specifications.</p>

      <div className="sec" style={{ marginTop: 28, display: 'grid', gap: 16 }}>
        <div className="chips" role="group" aria-label="Category">
          {['headphones', 'earbuds', 'speakers'].map((c) => <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{CAT_LABEL[c]}</button>)}
        </div>
        <div className="chips" role="group" aria-label={`Choose up to three ${CAT_LABEL[cat].toLowerCase()} to compare`}>
          {pool.map((p) => <button key={p.id} type="button" className="chip" aria-pressed={s.compare.includes(p.id)} onClick={() => s.toggleCompare(p.id)}>{s.compare.includes(p.id) ? '✓ ' : '+ '}{p.name}</button>)}
        </div>
      </div>

      {picked.length < 2 ? (
        <div className="empty" style={{ marginTop: 24 }}>
          <h2 className="t-prod">Pick at least two {CAT_LABEL[cat].toLowerCase()}</h2>
          <p className="muted">Use the chips above, or press the compare icon on any product card.</p>
        </div>
      ) : (
        <div className="panel" style={{ marginTop: 24 }}>
          <div className="cmp-scroll" tabIndex={0} role="region" aria-label="Comparison table, scrolls horizontally on small screens">
            <table className="cmp">
              <caption className="sr">Comparison of {picked.map((p) => p.name).join(', ')}</caption>
              <thead>
                <tr><td />{picked.map((p) => (
                  <th key={p.id} scope="col"><Thumb id={p.id} /><Link to={`/p/${p.id}`} className="num" style={{ fontSize: '1.3rem', display: 'block' }}>{p.name}</Link><span className="fine" style={{ fontWeight: 500 }}>{p.tagline}</span>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => s.addProduct(p.id, p.colors[0].id)}>Add to bag</button>
                      <button type="button" className="btn btn-ghost btn-sm" aria-label={`Remove ${p.name} from comparison`} onClick={() => s.toggleCompare(p.id)}><Icon n="close" style={{ width: 14 }} /></button>
                    </div></th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.map(([label, fn, num, best]) => {
                  const vals = num ? picked.map(num) : null
                  const bestVal = vals ? (best === 'min' ? Math.min(...vals) : Math.max(...vals)) : null
                  const allSame = vals && vals.every((v) => v === vals[0])
                  return (
                    <tr key={label}><th scope="row">{label}</th>{picked.map((p, i) => {
                      const isBest = vals && !allSame && vals[i] === bestVal && (best === 'min' || bestVal > 0)
                      return <td key={p.id} className={isBest ? 'best' : ''}>{fn(p)}{isBest && <span className="sr"> — best in this comparison</span>}{isBest && <span aria-hidden="true"> ★</span>}</td>
                    })}</tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="note" style={{ marginTop: 14 }}>★ marks the lowest price or longest playback within the selection. “Not listed” means the prototype catalogue makes no claim — not that a feature is absent. All specifications are fictional.</p>
      <Footer />
    </div></div>
  )
}
