import { Link } from '../lib/router'
import { useStore } from '../lib/store'

export function QualityToggle() {
  const s = useStore()
  return (
    <div role="group" aria-label="3D stage quality" className="seg">
      {[['full', 'Full 3D'], ['lite', 'Lite 3D'], ['off', '3D off']].map(([k, l]) => (
        <button key={k} type="button" aria-pressed={s.quality === k} onClick={() => s.setQuality(k)}>{l}</button>
      ))}
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="foot">
      <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
        <b className="num" style={{ fontSize: '1.4rem' }}>FEEL MORE. HEAR DIFFERENT.</b>
        <p className="muted" style={{ maxWidth: '40ch' }}>SONIQ is a fictional audio-technology brand created for a website-design prototype. Sound, shaped around you.</p>
        <QualityToggle />
      </div>
      <div><h3>Shop</h3><ul><li><Link to="/shop/headphones">Headphones</Link></li><li><Link to="/shop/earbuds">Earbuds</Link></li><li><Link to="/shop/speakers">Speakers</Link></li><li><Link to="/shop/accessories">Accessories</Link></li><li><Link to="/bundles">Bundles</Link></li></ul></div>
      <div><h3>Explore</h3><ul><li><Link to="/finder">Find your sound</Link></li><li><Link to="/compare">Compare</Link></li><li><Link to="/lab">Sound Lab</Link></li><li><Link to="/story">Our story</Link></li><li><Link to="/studio">Visit the Studio</Link></li></ul></div>
      <div><h3>Help</h3><ul><li><Link to="/support/faq">FAQ</Link></li><li><Link to="/support/compatibility">Compatibility</Link></li><li><Link to="/support/warranty">Warranty (draft)</Link></li><li><Link to="/support/returns">Returns (draft)</Link></li><li><Link to="/support/privacy">Privacy (draft)</Link></li><li><Link to="/support/accessibility">Accessibility</Link></li></ul></div>
      <p className="legal"><span>© 2026 SONIQ — fictional concept. The name has not been cleared for trademark or commercial use.</span><span>Shortcuts: <kbd className="kbd">/</kbd> search · <kbd className="kbd">B</kbd> bag · <kbd className="kbd">C</kbd> compare</span></p>
    </footer>
  )
}
