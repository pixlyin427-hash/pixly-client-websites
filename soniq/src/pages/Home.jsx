import { useEffect, useRef, useState } from 'react'
import { Link, useRoute } from '../lib/router'
import { useStore, useStage, useMedia } from '../lib/store'
import { useStagePage } from '../lib/stagehook'
import { byId, SHELF, CAT_LABEL } from '../data/catalog'
import { Icon, Price, Swatches, Thumb } from '../components/ui'

export default function Home() {
  const s = useStore()
  const { go } = useRoute()
  const { cfg, patch } = useStage()
  const mobile = useMedia('(max-width: 820px)')
  const [explore, setExplore] = useState(false)
  const sel = SHELF.includes(cfg.product) ? cfg.product : 'halo-one'
  const p = byId[sel]
  const idx = SHELF.indexOf(sel)
  const color = cfg.color && p.colors.some((c) => c.id === cfg.color) ? cfg.color : p.colors[0].id

  const inset = mobile ? (explore ? { t: 20, b: 330 } : { t: 250, b: 190 }) : explore ? { r: 400, b: 150 } : { l: 560, b: 150 }
  useStagePage({ view: 'hero', product: sel, color, inset, open: p.model === 'earbuds' }, [mobile, explore, sel, color])

  const choose = (id) => { patch({ product: id, color: null, open: byId[id].model === 'earbuds' }); setExplore(true) }
  const step = (d) => choose(SHELF[(idx + d + SHELF.length) % SHELF.length])
  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
  }
  const gap = mobile ? 92 : 132
  const vis = mobile ? 2 : 4

  return (
    <div className="stagepage">
      {!explore ? (
        <div className="hero-copy">
          <span className="eyebrow">SONIQ Soundstage · concept launch 2026</span>
          <h1 className="t-hero"><span>FEEL MORE.</span><span>HEAR DIFFERENT.</span></h1>
          <p className="lead">Meet a new expression of everyday audio. Explore headphones, earbuds, and speakers designed around the way you listen.</p>
          <div className="cta-row">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => choose('halo-one')}>Explore the Soundstage <Icon n="arrow" className="arrow" /></button>
            <Link to="/shop" className="btn btn-ghost btn-lg">Shop all audio</Link>
          </div>
          <p className="scroll-hint"><i aria-hidden="true">↻</i> Drag the product to rotate · tap the floor to send a ripple</p>
        </div>
      ) : (
        <section className="info-card panel" aria-label={`${p.name} summary`} key={p.id}>
          <div className="pad" style={{ animation: 'routein .5s var(--ease) both' }}>
            <span className="eyebrow">{CAT_LABEL[p.cat]}</span>
            <h2>{p.name}</h2>
            <p className="muted">{p.tagline}</p>
            {p.msg && <p className="lead" style={{ marginTop: 10 }}>“{p.msg}”</p>}
            <div className="row"><Price p={p} /></div>
            <div style={{ marginTop: 14 }}><Swatches product={p} value={color} onChange={(c) => patch({ color: c })} /></div>
            <div className="row" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn-primary" onClick={() => s.addProduct(p.id, color)}><Icon n="bag" />Add to bag</button>
              <Link to={`/p/${p.id}`} className="btn btn-ghost">Full details <Icon n="arrow" className="arrow" /></Link>
            </div>
            <button type="button" className="tlink" style={{ marginTop: 16 }} onClick={() => setExplore(false)}>← Back to intro</button>
          </div>
        </section>
      )}

      <div className="shelf" role="group" aria-label="Product explorer — choose a product to put on the stage" onKeyDown={onKey}>
        <button type="button" className="iconbtn shelf-arrow l" aria-label="Previous product" onClick={() => step(-1)}><Icon n="left" /></button>
        <button type="button" className="iconbtn shelf-arrow r" aria-label="Next product" onClick={() => step(1)}><Icon n="right" /></button>
        <div className="shelf-track">
          {SHELF.map((id, i) => {
            const k = i - idx
            const hidden = Math.abs(k) > vis
            const q = byId[id]
            return (
              <button key={id} type="button" className="shelf-item" aria-current={k === 0} aria-label={`${q.name}, ${q.tagline}`}
                tabIndex={hidden ? -1 : 0}
                style={{ transform: `translateX(calc(-50% + ${k * gap}px)) translateY(${-k * k * 5}px) rotate(${k * 3}deg) scale(${k === 0 ? 1.12 : 1 - Math.min(Math.abs(k), 4) * 0.07})`, opacity: hidden ? 0 : k === 0 ? 1 : 0.85 - Math.abs(k) * 0.14, visibility: hidden ? 'hidden' : 'visible', zIndex: 10 - Math.abs(k) }}
                onClick={() => (k === 0 ? setExplore(true) : choose(id))}>
                <Thumb id={id} className="" alt="" />
                <span className="nm">{q.name}</span>
                {!mobile && <span className="tg">{q.tagline}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
