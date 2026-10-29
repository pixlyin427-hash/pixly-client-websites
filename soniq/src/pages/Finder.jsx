import { useMemo, useState } from 'react'
import { Link } from '../lib/router'
import { useStore } from '../lib/store'
import { useStagePage } from '../lib/stagehook'
import { AUDIO, MOMENTS, byId } from '../data/catalog'
import { rupees } from '../lib/format'
import { Icon, Price, Thumb } from '../components/ui'
import Footer from '../components/Footer'

const Q = [
  { k: 'use', title: 'What will you mostly use them for?', opts: [['commute', 'Commuting', 'Trains, buses, busy streets'], ['study', 'Studying', 'Long, quiet sessions'], ['work', 'Working', 'Desk, calls, focus'], ['travel', 'Travelling', 'Packs small, lasts long'], ['home', 'Home listening', 'Rooms and desks'], ['entertainment', 'Entertainment', 'Shows, films, music']] },
  { k: 'form', title: 'Which form factor do you prefer?', opts: [['over-ear', 'Over-ear headphones', 'Big comfort, big soundstage'], ['earbuds', 'Earbuds', 'Small and pocketable'], ['speaker', 'A speaker', 'Sound for the room'], ['any', 'No preference', 'Show me everything']] },
  { k: 'anc', title: 'How important is noise cancellation?', opts: [['must', 'Essential', 'Only products with ANC'], ['nice', 'Nice to have', 'Prefer it, not required'], ['no', 'Not needed', 'Don’t filter on it']] },
  { k: 'port', title: 'How portable should it be?', opts: [['pocket', 'Pocket-sized', 'Fits in a pocket'], ['bag', 'Fine in a bag', 'A bit more room is OK'], ['any', 'Doesn’t matter', 'Home use mostly']] },
  { k: 'budget', title: 'What’s your budget?', opts: [[3000, 'Up to ₹3,000', 'Accessible everyday audio'], [5500, 'Up to ₹5,500', 'Mid-range'], [8000, 'Up to ₹8,000', 'Flagship territory'], [99999, 'No limit', 'Show me the best fit']] },
]
const formOf = (p) => (p.cat === 'headphones' ? 'over-ear' : p.cat === 'earbuds' ? 'earbuds' : 'speaker')

function score(p, a) {
  const why = []
  let sc = 0
  if (a.use) { if (p.attrs.uses.includes(a.use)) { sc += 4; why.push(`Suits ${MOMENTS.find((m) => m.id === a.use).label.toLowerCase()} in its catalogue positioning`) } }
  if (a.form && a.form !== 'any' && formOf(p) === a.form) { sc += 3; why.push(`Matches your ${a.form === 'over-ear' ? 'over-ear' : a.form} preference`) }
  if (a.anc === 'must' && p.attrs.anc) { sc += 3; why.push('Has active noise cancellation') }
  if (a.anc === 'nice' && p.attrs.anc) { sc += 2; why.push('Has the noise cancellation you’d like') }
  if (a.port && a.port !== 'any') { if (p.attrs.portable === a.port) { sc += 2; why.push(a.port === 'pocket' ? 'Pocket-sized' : 'Easy to carry in a bag') } else if (a.port === 'bag' && p.attrs.portable === 'pocket') { sc += 2; why.push('Even smaller than a bag-sized product') } }
  if (a.budget) { if (p.price <= a.budget) { sc += 2; why.push(`Within your budget at ${rupees(p.price)}`) } }
  if (p.attrs.battery && p.attrs.battery >= 30) why.push(`Up to ${p.attrs.battery} h playback (prototype claim)`)
  return { p, sc, why }
}

export default function Finder() {
  const s = useStore()
  const [a, setA] = useState({})
  const [step, setStep] = useState(0)
  const [ctx, setCtx] = useState('commute')
  useStagePage({ view: 'dim' }, [])
  const done = step >= Q.length
  const results = useMemo(() => {
    if (!done) return { top: [], relaxed: [] }
    let pool = AUDIO
    const relaxed = []
    const hard = [
      ['form', (p) => a.form === 'any' || formOf(p) === a.form, 'form factor'],
      ['anc', (p) => a.anc !== 'must' || p.attrs.anc, 'noise cancellation'],
      ['budget', (p) => p.price <= a.budget, 'budget'],
    ]
    for (const [k, fn, label] of hard) { const next = pool.filter(fn); if (next.length) pool = next; else relaxed.push(label) }
    const ranked = pool.map((p) => score(p, a)).sort((x, y) => y.sc - x.sc || x.p.price - y.p.price)
    return { top: ranked.slice(0, 3), relaxed, alt: AUDIO.filter((p) => !ranked.slice(0, 3).some((r) => r.p.id === p.id)).slice(0, 3) }
  }, [done, a])
  const m = MOMENTS.find((x) => x.id === ctx)
  const cur = Q[step]

  return (
    <div className="sheet"><div className="wrap">
      <span className="eyebrow">Personal Audio Finder</span>
      <h1 className="t-page" style={{ margin: '12px 0' }}>Find your sound</h1>
      <p className="lead">Five quick questions. Recommendations come from the SONIQ prototype catalogue only — and we’ll tell you why each one fits.</p>
      <div className="quiz" style={{ marginTop: 30 }}>
        <section className="panel" aria-label="Questions"><div className="pad">
          <div className="steps" aria-hidden="true">{Q.map((q, i) => <i key={q.k} className={i <= step ? 'on' : ''} />)}</div>
          {!done ? (
            <>
              <p className="label" aria-live="polite">Question {step + 1} of {Q.length}</p>
              <h2 className="t-sec" style={{ fontSize: '1.7rem', marginTop: 8 }}>{cur.title}</h2>
              <div className="opts" role="group" aria-label={cur.title}>
                {cur.opts.map(([v, l, d]) => <button key={String(v)} type="button" className="opt" aria-pressed={a[cur.k] === v} onClick={() => { setA((x) => ({ ...x, [cur.k]: v })); setStep(step + 1) }}><b>{l}</b><span>{d}</span></button>)}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                {step > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(step - 1)}>← Back</button>}
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              <h2 className="t-sec" style={{ fontSize: '1.6rem' }}>Your answers</h2>
              <ul className="mini-list">
                {Q.map((q, i) => <li key={q.k} className="mini" style={{ gridTemplateColumns: '1fr auto' }}><span><span className="label">{q.title.replace('?', '')}</span><br /><b>{q.opts.find((o) => o[0] === a[q.k])?.[1]}</b></span><button type="button" className="tlink" onClick={() => setStep(i)} aria-label={`Change answer: ${q.title}`}>Change</button></li>)}
              </ul>
              <button type="button" className="btn btn-ghost" onClick={() => { setA({}); setStep(0) }}>Start over</button>
            </div>
          )}
        </div></section>

        <section aria-live="polite" aria-label="Recommendations" style={{ display: 'grid', gap: 14 }}>
          {!done ? (
            <div className="empty"><h2 className="t-prod">Your matches will appear here</h2><p className="muted">Answer the questions on the left. You can change any answer afterwards.</p></div>
          ) : (
            <>
              {results.relaxed.length > 0 && <p className="note">Nothing matched every answer, so we relaxed: {results.relaxed.join(', ')}.</p>}
              {results.top.map((r, i) => (
                <article key={r.p.id} className="panel rec">
                  <Thumb id={r.p.id} />
                  <div>
                    <span className="rank">{i === 0 ? 'BEST MATCH' : `ALTERNATIVE ${i}`}</span>
                    <h3 className="t-prod"><Link to={`/p/${r.p.id}`}>{r.p.name}</Link> <span className="muted" style={{ fontSize: '.8em', fontWeight: 500 }}>· {r.p.tagline}</span></h3>
                    <Price p={r.p} />
                    <ul>{[...new Set(r.why)].slice(0, 4).map((w) => <li key={w}>{w}</li>)}</ul>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <Link className="btn btn-primary btn-sm" to={`/p/${r.p.id}`}>View</Link>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => s.addProduct(r.p.id, r.p.colors[0].id)}>Add to bag</button>
                    </div>
                  </div>
                </article>
              ))}
              {results.top.length > 1 && <Link className="tlink" to={`/compare?ids=${results.top.filter((r) => r.p.cat === results.top[0].p.cat).map((r) => r.p.id).join(',')}`}>Compare these matches →</Link>}
            </>
          )}
        </section>
      </div>

      <section className="sec" aria-labelledby="moments">
        <div className="sec-head"><div><span className="eyebrow">By listening context</span><h2 id="moments" className="t-sec">Browse by moment</h2></div></div>
        <div className="chips" role="group" aria-label="Listening context">{MOMENTS.map((x) => <button key={x.id} type="button" className="chip" aria-pressed={ctx === x.id} onClick={() => setCtx(x.id)}>{x.label}</button>)}</div>
        <p className="lead" style={{ margin: '16px 0' }}>{m.why}</p>
        <div className="grid">
          {m.ids.map((id) => { const p = byId[id]; return (
            <article key={id} className="panel pad" style={{ display: 'grid', gap: 8 }}>
              <Thumb id={id} /><h3 className="t-prod"><Link to={`/p/${id}`}>{p.name}</Link></h3><span className="fine">{p.tagline}</span><Price p={p} />
              <Link className="tlink" to={`/p/${id}`}>View <Icon n="arrow" style={{ width: 14 }} /></Link>
            </article>
          ) })}
        </div>
        <p className="note" style={{ marginTop: 12 }}>Context picks are ordered by fit with each product’s catalogue positioning — not by price.</p>
      </section>
      <Footer />
    </div></div>
  )
}
