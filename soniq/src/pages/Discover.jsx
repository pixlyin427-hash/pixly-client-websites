import { Link } from '../lib/router'
import { useStagePage } from '../lib/stagehook'
import { useStore } from '../lib/store'
import { MOMENTS, byId } from '../data/catalog'
import { Icon, Thumb } from '../components/ui'
import Footer from '../components/Footer'
import Reviews from '../components/Reviews'

const Rings = ({ n = 4 }) => (<svg className="glyph" viewBox="0 0 200 200" fill="none" stroke="currentColor" aria-hidden="true">{Array.from({ length: n }).map((_, i) => <circle key={i} cx="100" cy="100" r={18 + i * 22} strokeWidth="1.4" opacity={1 - i * 0.2} />)}</svg>)

export default function Discover() {
  const s = useStore()
  useStagePage({ view: 'dim' }, [])
  const tiles = [
    ['t-a', '/finder', 'Find your sound', 'Five questions. Recommendations from the catalogue, with reasons.', 'Personal Audio Finder'],
    ['t-b', '/lab', 'Sound Lab', 'Step into the visual language of sound — Balanced, Bass, Vocal, Focus.', 'Interactive'],
    ['t-c', '/compare', 'Compare', 'Two or three products, side by side, within the same category.', 'Studio'],
    ['t-d', '/bundles', 'Bundles', 'Proposed sets and a builder with compatibility built in.', 'Sets'],
    ['t-e', '/story', 'Our story', 'The thinking behind SONIQ design — fictional brand storytelling.', 'Chapters'],
    ['t-f', '/studio', 'Visit the Studio', 'A fictional listening room in Palghar. Demo hours and details.', 'Showroom concept'],
    ['t-g', '/support', 'Support & guidance', 'Compatibility, setup, FAQs and draft policies — direct answers first.', 'Help'],
  ]
  return (
    <div className="sheet"><div className="wrap">
      <span className="eyebrow">Discover</span>
      <h1 className="t-page" style={{ margin: '12px 0' }}>Find your next listening ritual</h1>
      <p className="lead">Everything on the Soundstage, one tap away. Prefer the classic route? <Link className="tlink" to="/shop">Shop all audio</Link>.</p>
      <div className="hub" style={{ marginTop: 30 }}>
        {tiles.map(([c, to, t, d, tag]) => (
          <Link key={to} to={to} className={`tile panel ${c}`}><Rings n={c === 't-a' ? 6 : 4} /><span className="eyebrow">{tag}</span><h2>{t}</h2><p className="muted" style={{ maxWidth: '36ch' }}>{d}</p><span className="tlink">Open <Icon n="arrow" style={{ width: 14 }} /></span></Link>
        ))}
      </div>
      <section className="sec" aria-labelledby="mom">
        <div className="sec-head"><div><span className="eyebrow">By listening context</span><h2 id="mom" className="t-sec">Made for the moments between</h2></div></div>
        <div className="moments">{MOMENTS.map((m) => (
          <Link key={m.id} to="/finder" className="opt" style={{ gap: 8 }}><b>{m.label}</b><span>{m.why}</span><span className="fine" style={{ color: 'var(--lav)' }}>{m.ids.slice(0, 2).map((i) => byId[i].name).join(' · ')}</span></Link>
        ))}</div>
      </section>
      {s.recent.length > 0 && (
        <section className="sec" aria-labelledby="rv"><div className="sec-head"><div><span className="eyebrow">Recently viewed</span><h2 id="rv" className="t-sec">Pick up where you left off</h2></div></div>
          <div className="rail">{s.recent.map((id) => <Link key={id} to={`/p/${id}`} className="panel pad" style={{ display: 'grid', gap: 6, textAlign: 'center' }}><Thumb id={id} /><b className="num">{byId[id].name}</b></Link>)}</div>
        </section>
      )}
      <section className="sec" aria-labelledby="rev"><div className="sec-head"><div><span className="eyebrow">Reviews</span><h2 id="rev" className="t-sec">What the prototype reviewers said</h2></div></div><Reviews /></section>
      <Footer />
    </div></div>
  )
}
