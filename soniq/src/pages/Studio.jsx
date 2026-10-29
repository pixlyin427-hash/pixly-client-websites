import { useState } from 'react'
import { Link } from '../lib/router'
import { useStagePage } from '../lib/stagehook'
import { useMedia, useStage } from '../lib/store'
import { STUDIO, byId } from '../data/catalog'

export default function Studio() {
  const mobile = useMedia('(max-width: 820px)')
  const { cfg, patch } = useStage()
  const zone = cfg.zone || 'bar'
  const z = STUDIO.zones.find((x) => x.id === zone)
  useStagePage({ view: 'studio', zone: 'bar', product: 'halo-one', inset: mobile ? { t: 40, b: 360 } : { l: 460, b: 40 } }, [mobile])
  return (
    <div className="stagepage">
      <section className="lab-panel panel" style={{ width: mobile ? 'auto' : 'min(430px, 40vw)', top: 8, bottom: mobile ? 'auto' : 14, ...(mobile ? { top: 'auto', bottom: 0, left: 0, right: 0, maxHeight: '48vh' } : {}) }} aria-labelledby="st-h">
        <div className="pad" style={{ display: 'grid', gap: 12, maxHeight: '100%', overflowY: 'auto' }}>
          <span className="eyebrow">Visit the Studio · fictional</span>
          <h1 id="st-h" className="t-page" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>{STUDIO.name}</h1>
          <p className="muted">Welcome to SONIQ Sound Studio, Palghar — a fictional listening space imagined for people who want technology to feel personal. Explore headphones, earbuds and speakers, compare listening styles, and discover a setup that fits your everyday life.</p>
          <div className="zone-list" role="group" aria-label="Studio zones">
            {STUDIO.zones.map((x) => (
              <button key={x.id} type="button" className="zone" aria-pressed={zone === x.id} onClick={() => patch({ zone: x.id })}><b>{x.name}</b><span>{x.text}</span></button>
            ))}
          </div>
          {z.ids.length > 0 && <p className="fine">On show here: {z.ids.map((i) => <Link key={i} className="tlink" to={`/p/${i}`} style={{ marginRight: 8 }}>{byId[i].name}</Link>)}</p>}
          <table className="spec" aria-label="Demo opening hours"><tbody>{STUDIO.hours.map(([d, h]) => <tr key={d}><th scope="row">{d}</th><td>{h} <span className="badge">Demo hours</span></td></tr>)}</tbody></table>
          <div className="demo-box" role="note">
            <b>Fictional location & contact.</b> {STUDIO.address}. This address is invented, is not a verified shop address, and is deliberately not pinned on a map. Phone {STUDIO.phone} · {STUDIO.email} · {STUDIO.social} are placeholders. Founder: {STUDIO.founder}.
          </div>
          <p className="fine">Store pickup appears in checkout as a prototype option only.</p>
        </div>
      </section>
    </div>
  )
}
