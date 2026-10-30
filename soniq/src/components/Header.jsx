import { useRef } from 'react'
import { Link, useRoute } from '../lib/router'
import { useStore } from '../lib/store'
import { Icon, Logo, useDialog } from './ui'

export const NAV = [
  ['Discover', '/discover'], ['Headphones', '/shop/headphones'], ['Earbuds', '/shop/earbuds'], ['Speakers', '/shop/speakers'], ['Sound Lab', '/lab'], ['Visit the Studio', '/studio'],
]

export function MobileMenu() {
  const s = useStore()
  const ref = useRef()
  const close = () => s.open('menu', false)
  useDialog(s.ui.menu, close, ref)
  if (!s.ui.menu) return null
  return (
    <div className="mobmenu" ref={ref} role="dialog" aria-modal="true" aria-label="Main menu">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="brand" onClick={close}><Logo /></Link>
        <button type="button" className="iconbtn" aria-label="Close menu" onClick={close} data-autofocus><Icon n="close" /></button>
      </div>
      <nav aria-label="Main">
        {[...NAV, ['Find your sound', '/finder'], ['Compare', '/compare'], ['Bundles', '/bundles'], ['Support', '/support']].map(([l, to]) => (
          <Link key={to} to={to} onClick={close}>{l}<Icon n="arrow" style={{ width: 22, height: 22, color: 'var(--lav)' }} /></Link>
        ))}
      </nav>
    </div>
  )
}

export default function Header() {
  const s = useStore()
  const { path } = useRoute()
  return (
    <header className="top">
      <div className="demo-strip" role="note"><span className="long">Fictional brand prototype · demo content · no real orders, payments or locations</span><span className="short">Fictional prototype · no real orders or payments</span></div>
      <div className="bar">
        <Link to="/" className="brand" aria-label="SONIQ home"><Logo /></Link>
        <nav className="nav" aria-label="Main">
          {NAV.map(([l, to]) => <Link key={to} to={to}>{l}</Link>)}
        </nav>
        <div className="tools">
          <button type="button" className="iconbtn" aria-label="Search products (press /)" onClick={() => s.open('search')}><Icon n="search" /></button>
          <Link to="/compare" className="iconbtn hide-s" aria-label={`Compare, ${s.compare.length} selected`}><Icon n="compare" />{s.compare.length > 0 && <span className="count" aria-hidden="true">{s.compare.length}</span>}</Link>
          <Link to="/saved" className="iconbtn hide-s" aria-label={`Saved items, ${s.saved.length}`}><Icon n="heart" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 }} />{s.saved.length > 0 && <span className="count" aria-hidden="true">{s.saved.length}</span>}</Link>
          <button type="button" className="iconbtn" aria-label={`Shopping bag, ${s.count} item${s.count === 1 ? '' : 's'}`} onClick={() => s.open('bag')}><Icon n="bag" />{s.count > 0 && <span className="count" aria-hidden="true">{s.count}</span>}</button>
          <button type="button" className="iconbtn menu-btn" aria-label="Open menu" aria-expanded={s.ui.menu} onClick={() => s.open('menu')}><Icon n="menu" /></button>
        </div>
      </div>
      <span className="sr" aria-live="polite">{path}</span>
    </header>
  )
}
