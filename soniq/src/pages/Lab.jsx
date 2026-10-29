import { useStage, useMedia } from '../lib/store'
import { useStagePage } from '../lib/stagehook'
import { PROFILES } from '../data/catalog'
import { Link } from '../lib/router'

export default function Lab() {
  const { cfg, patch } = useStage()
  const mobile = useMedia('(max-width: 820px)')
  const profile = PROFILES[cfg.profile] ? cfg.profile : 'balanced'
  const P = PROFILES[profile]
  useStagePage({ view: 'lab', product: 'halo-one', color: 'void-black', profile, inset: mobile ? { t: 200, b: 190 } : { l: 380, b: 170 } }, [mobile])
  const onKey = (e) => {
    const keys = Object.keys(PROFILES)
    const i = keys.indexOf(profile)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); patch({ profile: keys[(i + 1) % keys.length] }) }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); patch({ profile: keys[(i + keys.length - 1) % keys.length] }) }
  }
  return (
    <div className="stagepage">
      <section className="lab-panel panel" aria-labelledby="lab-h">
        <div className="pad" style={{ display: 'grid', gap: 12 }}>
          <span className="eyebrow">Sound Lab</span>
          <h1 id="lab-h" className="t-page" style={{ fontSize: 'clamp(1.9rem, 3vw, 2.6rem)' }}>See how a profile feels</h1>
          <p className="muted" aria-live="polite"><b style={{ color: '#fff' }}>{P.name}.</b> {P.blurb}</p>
          <p className="pill-note">Illustrative visualiser — it does not analyse or change real audio.</p>
          {!mobile && <p className="fine">Drag to orbit · tap the floor to send a ripple. Choose a profile below.</p>}
        </div>
      </section>
      <div className="lab-bottom">
        <div className="profiles" role="radiogroup" aria-label="Sound profile" onKeyDown={onKey}>
          {Object.entries(PROFILES).map(([k, v]) => (
            <button key={k} type="button" role="radio" aria-checked={profile === k} aria-pressed={profile === k} className="profile" tabIndex={profile === k ? 0 : -1} style={{ '--c': v.hue }} onClick={() => patch({ profile: k })}>
              <span className="eq" aria-hidden="true">{v.bands.map((b, i) => <i key={i} style={{ '--h': b }} />)}</span>
              <b>{v.name}</b>
              <span className="fine">{k === 'balanced' ? 'Even & natural' : k === 'bass' ? 'Low-end weight' : k === 'vocal' ? 'Voices forward' : 'Calm & steady'}</span>
            </button>
          ))}
        </div>
      </div>
      {!mobile && <Link to="/finder" className="btn btn-ghost btn-sm" style={{ position: 'absolute', right: 'var(--gut)', bottom: 20 }}>Find your sound →</Link>}
    </div>
  )
}
