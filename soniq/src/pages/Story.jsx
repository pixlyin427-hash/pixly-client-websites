import { useEffect } from 'react'
import { Link } from '../lib/router'
import { useStagePage } from '../lib/stagehook'
import { useMedia, useStage } from '../lib/store'
import { Icon } from '../components/ui'

const CH = [
  { k: 'Promise', h: 'Sound, shaped around you.', t: 'Audio products should sound considered, feel comfortable, look beautiful and be easy to understand. SONIQ makes the discovery of sound as engaging as listening to it.', f: 'HALO ONE — flagship over-ear headphones', to: '/p/halo-one' },
  { k: 'Design', h: 'Distinctive industrial design.', t: 'Smooth matte surfaces, refined metal joints and a restrained violet light ring. Beautiful because it’s considered — not because it shouts.', f: 'Facts: HALO ONE has a violet light ring; see its Details tab.', to: '/p/halo-one' },
  { k: 'Comfort', h: 'Thoughtful sound and comfort.', t: 'Plush cushions, fold-flat earcups and a lighter sibling in HALO AIR. Comfort is where a listening ritual begins.', f: 'Facts: HALO ONE has fold-flat earcups; HALO AIR is lightweight and foldable.', to: '/p/halo-air' },
  { k: 'Technology', h: 'Useful technology, simply shown.', t: 'Features for a reason, not for a spec sheet. Transparent shopping, clear compatibility, and a welcoming hands-on listening studio.', f: 'Facts: see the comparison studio for catalogue specifications.', to: '/compare' },
]

export default function Story() {
  const mobile = useMedia('(max-width: 820px)')
  const { cfg, patch } = useStage()
  const i = Math.min(CH.length - 1, cfg.chapter || 0)
  const c = CH[i]
  useStagePage({ view: 'story', product: 'halo-one', color: 'sonic-violet', chapter: 0, inset: mobile ? { t: 40, b: 330 } : { l: 560, b: 40 } }, [mobile])
  const go = (n) => patch({ chapter: Math.max(0, Math.min(CH.length - 1, n)) })
  useEffect(() => {
    const on = (e) => { if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if (e.key === 'ArrowDown' || e.key === 'PageDown') { go(i + 1) } if (e.key === 'ArrowUp' || e.key === 'PageUp') { go(i - 1) } }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })
  return (
    <div className="stagepage">
      <section className="lab-panel panel" style={{ width: mobile ? 'auto' : 'min(500px, 44vw)', top: mobile ? 'auto' : 14, bottom: mobile ? 0 : 'auto', ...(mobile ? { left: 0, right: 0 } : {}) }} aria-labelledby="ch-h" aria-live="polite">
        <div className="pad" style={{ display: 'grid', gap: 14 }} key={i}>
          <span className="eyebrow">Chapter {i + 1} of {CH.length} · {c.k}</span>
          <h1 id="ch-h" className="bigq" style={{ animation: 'routein .5s var(--ease) both' }}>{c.h}</h1>
          <p className="lead" style={{ animation: 'routein .6s var(--ease) both' }}>{c.t}</p>
          <p className="label-box"><strong>Brand story</strong><span>Fictional storytelling. {c.f}</span></p>
          <Link className="tlink" to={c.to}>See the product facts <Icon n="arrow" style={{ width: 14 }} /></Link>
          <div className="chap-nav">
            <button type="button" className="iconbtn" aria-label="Previous chapter" disabled={i === 0} onClick={() => go(i - 1)} style={i === 0 ? { opacity: .35 } : null}><Icon n="left" /></button>
            <div className="chap-dots" role="group" aria-label="Chapters">{CH.map((x, n) => <button key={x.k} type="button" aria-label={`Chapter ${n + 1}: ${x.k}`} aria-current={n === i} onClick={() => go(n)} />)}</div>
            <button type="button" className="iconbtn" aria-label="Next chapter" disabled={i === CH.length - 1} onClick={() => go(i + 1)} style={i === CH.length - 1 ? { opacity: .35 } : null}><Icon n="right" /></button>
          </div>
        </div>
      </section>
    </div>
  )
}
