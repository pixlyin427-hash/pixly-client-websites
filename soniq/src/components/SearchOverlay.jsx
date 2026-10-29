import { useMemo, useRef, useState } from 'react'
import { useRoute } from '../lib/router'
import { useStore } from '../lib/store'
import { searchProducts, SUGGESTIONS } from '../lib/search'
import { CAT_LABEL } from '../data/catalog'
import { Icon, Price, Thumb, useDialog } from './ui'

export default function SearchOverlay() {
  const s = useStore()
  if (!s.ui.search) return null
  return <Inner s={s} />
}
function Inner({ s }) {
  const { go } = useRoute()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const ref = useRef()
  const close = () => s.open('search', false)
  useDialog(true, close, ref)
  const results = useMemo(() => searchProducts(q), [q])
  const pick = (p) => { close(); go(`/p/${p.id}`) }
  const onKey = (e) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => (i + 1) % results.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => (i - 1 + results.length) % results.length) }
    if (e.key === 'Enter') { e.preventDefault(); pick(results[sel] || results[0]) }
  }
  return (
    <>
      <div className="scrim" onClick={close} />
      <div className="search" ref={ref} role="dialog" aria-modal="true" aria-label="Search products">
        <div className="panel">
          <div className="search-in">
            <Icon n="search" style={{ width: 22, color: 'var(--lav)' }} />
            <input data-autofocus type="search" role="combobox" aria-expanded={results.length > 0} aria-controls="search-results" aria-activedescendant={results[sel] ? `res-${results[sel].id}` : undefined} aria-label="Search SONIQ products" placeholder="Search products, e.g. “noise cancelling” or “under 3000”" value={q} onChange={(e) => { setQ(e.target.value); setSel(0) }} onKeyDown={onKey} autoComplete="off" />
            <button type="button" className="iconbtn" aria-label="Close search" onClick={close}><Icon n="close" /></button>
          </div>
          <div className="search-res" id="search-results" role="listbox" aria-label="Search results">
            {!q.trim() && (
              <div style={{ padding: 10, display: 'grid', gap: 12 }}>
                <span className="label">Try searching for</span>
                <div className="chips">{SUGGESTIONS.map((t) => <button key={t} type="button" className="chip" onClick={() => setQ(t)}>{t}</button>)}</div>
              </div>
            )}
            {q.trim() && results.length === 0 && (
              <div className="empty" style={{ border: 0 }}>
                <h3 className="t-prod">No products match “{q}”</h3>
                <p className="muted">Try a product name, a category, or a phrase like “wired” or “under 3000”.</p>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQ('')}>Clear search</button>
              </div>
            )}
            {results.map((p, i) => (
              <a key={p.id} id={`res-${p.id}`} role="option" aria-selected={i === sel} className="res" href={`#/p/${p.id}`} onClick={(e) => { e.preventDefault(); pick(p) }} onMouseEnter={() => setSel(i)}>
                <Thumb id={p.id} />
                <span><b className="num" style={{ fontSize: '1.05rem' }}>{p.name}</b><br /><span className="fine">{CAT_LABEL[p.cat]} · {p.tagline}</span></span>
                <Price p={p} />
              </a>
            ))}
            {q.trim() && results.length > 0 && <p className="fine" style={{ padding: '8px 10px' }}>{results.length} result{results.length > 1 ? 's' : ''} · ↑ ↓ to move, Enter to open, Esc to close</p>}
          </div>
        </div>
      </div>
    </>
  )
}
