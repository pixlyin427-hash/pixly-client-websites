import { useEffect, useRef } from 'react'
import { byId } from '../data/catalog'
import { rupees } from '../lib/format'
import { useThumb } from '../three/thumbs'

const P = {
  search: 'M11 4a7 7 0 1 0 4.2 12.6l4.4 4.4 1.4-1.4-4.4-4.4A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  bag: 'M6 7V6a6 6 0 0 1 12 0v1h2l1 14H3L4 7h2Zm2 0h8V6a4 4 0 0 0-8 0v1Zm-2 2H5.9L5.1 19h13.8l-.8-10H18v2h-2V9H8v2H6V9Z',
  heart: 'M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11Z',
  compare: 'M4 6h7v2H4V6Zm9 0h7v2h-7V6ZM4 11h7v2H4v-2Zm9 0h7v2h-7v-2ZM4 16h7v2H4v-2Zm9 0h7v2h-7v-2Z',
  menu: 'M4 7h16v2H4V7Zm0 8h16v2H4v-2Z',
  close: 'm6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z',
  arrow: 'M4 11h12.2l-4.6-4.6L13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2Z',
  plus: 'M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7V4Z',
  minus: 'M4 11h16v2H4v-2Z',
  left: 'M15.4 5 8.4 12l7 7 1.4-1.4L11.2 12l5.6-5.6L15.4 5Z',
  right: 'm8.6 5 7 7-7 7-1.4-1.4 5.6-5.6-5.6-5.6L8.6 5Z',
  reset: 'M12 5a7 7 0 1 1-6.7 9h2.1A5 5 0 1 0 12 7v3L7 6l5-4v3Z',
  check: 'm9.5 16.6-4.1-4.1L4 13.9l5.5 5.5L20 8.9 18.6 7.5 9.5 16.6Z',
  info: 'M11 10h2v7h-2v-7Zm0-3h2v2h-2V7Zm1-5a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z',
  trash: 'M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z',
  star: 'm12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6L12 2Z',
  eye: 'M12 5c5 0 9 4.5 10 7-1 2.5-5 7-10 7S3 14.5 2 12c1-2.5 5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
}
export function Icon({ n, className, ...r }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...r}>
      <path d={P[n]} />
    </svg>
  )
}

export function Logo({ className }) {
  // Wordmark with the O drawn as concentric sound rings.
  return (
    <svg className={className} viewBox="0 0 168 36" role="img" aria-label="SONIQ" fill="none">
      <text x="0" y="28" fontFamily="Space Grotesk Variable, Space Grotesk, sans-serif" fontWeight="700" fontSize="31" letterSpacing="1.5" fill="#F7F5FC">S</text>
      <g transform="translate(38 17)"><circle r="13.5" stroke="#7C3AED" strokeWidth="2.4" /><circle r="8.2" stroke="#C4B5FD" strokeWidth="2" /><circle r="3" fill="#67E8F9" /></g>
      <text x="58" y="28" fontFamily="Space Grotesk Variable, Space Grotesk, sans-serif" fontWeight="700" fontSize="31" letterSpacing="1.5" fill="#F7F5FC">NIQ</text>
    </svg>
  )
}

export function Price({ p, size }) {
  const pr = typeof p === 'string' ? byId[p] : p
  return (
    <span className="price" style={size ? { '--s': size } : null}>
      <b>{rupees(pr.price)}</b>
      {pr.ref ? <s aria-label={`Demo reference price ${rupees(pr.ref)}`}>{rupees(pr.ref)}</s> : null}
    </span>
  )
}

export function Stars({ value }) {
  return (
    <span className="stars" aria-label={`Demo rating ${value.toFixed(1)} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (<Icon key={i} n="star" style={{ opacity: value >= i + 0.75 ? 1 : value >= i + 0.25 ? 0.6 : 0.2 }} />))}
      <span style={{ marginLeft: 6 }}>{value.toFixed(1)}</span>
    </span>
  )
}

const SIL = {
  headphones: 'M5 17v-4a7 7 0 0 1 14 0v4M5 13h3v6H5zM16 13h3v6h-3z',
  earbuds: 'M8 8a3 3 0 1 1 3 3v6a1.5 1.5 0 0 1-3 0V8Zm8 0a3 3 0 1 0-3 3v6a1.5 1.5 0 0 0 3 0V8Z',
  speaker: 'M8 4h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm4 4v.01M12 15a2 2 0 1 0 0 .01',
  dac: 'M3 12h4m3-2h8a2 2 0 0 1 0 4h-8a2 2 0 0 1 0-4Zm-3 2h3',
  other: 'M5 8h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm4 0V6h6v2',
}
export function Silhouette({ product }) {
  const k = { headphones: 'headphones', earbuds: 'earbuds', speaker: 'speaker', dac: 'dac' }[product.model] || 'other'
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SIL[k]} /></svg>
  )
}

// A rendered 3D product image (from the stage's offscreen renderer), with a graceful placeholder.
export function Thumb({ id, color, className = '', alt }) {
  const url = useThumb(id, color)
  const p = byId[id]
  return (
    <span className={`thumb ${className}`}>
      {url ? <img src={url} width="512" height="512" alt={alt ?? `${p.name} in ${(p.colors.find((c) => c.id === color) || p.colors[0]).name}`} decoding="async" /> : (
        <span className="thumb-ph" role="img" aria-label={`${p.name} image loading`}><Silhouette product={p} /></span>
      )}
    </span>
  )
}

export function Swatches({ product, value, onChange, label = 'Finish' }) {
  return (
    <div role="radiogroup" aria-label={label} className="swatches">
      {product.colors.map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={value === c.id} className="swatch" style={{ '--c': c.body }} onClick={() => onChange(c.id)}>
          <i /><span>{c.name}</span>
        </button>
      ))}
    </div>
  )
}

export function DemoNote({ children }) {
  return <p className="note">{children}</p>
}

// Focus trap + Escape handling for dialogs.
export function useDialog(open, onClose, ref) {
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const el = ref.current
    const focusables = () => [...el.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter((n) => n.offsetParent !== null)
    const f = focusables()
    ;(el.querySelector('[data-autofocus]') || f[0])?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'Tab') {
        const list = focusables()
        if (!list.length) return
        const first = list[0], last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function useSheetScrollTop(dep) {
  const ref = useRef()
  useEffect(() => { ref.current?.scrollTo?.({ top: 0 }) }, [dep])
  return ref
}
