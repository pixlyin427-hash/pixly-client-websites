import { PRODUCTS, CAT_LABEL } from '../data/catalog'

const USE_LABEL = { commute: 'commuting', study: 'studying', work: 'working', travel: 'travelling', home: 'home listening', entertainment: 'entertainment' }
const text = (p) => [p.name, p.tagline, p.type, CAT_LABEL[p.cat], p.cat, p.pitch, ...p.features, ...p.colors.map((c) => c.name), ...p.attrs.uses.map((u) => USE_LABEL[u]), p.attrs.anc ? 'noise cancelling anc' : '', p.attrs.wireless === false ? 'wired' : p.attrs.wireless ? 'wireless' : '', p.attrs.ip || ''].join(' ').toLowerCase()
const INDEX = PRODUCTS.map((p) => ({ p, t: text(p), n: p.name.toLowerCase() }))

export const SUGGESTIONS = ['noise cancelling', 'wired', 'earbuds', 'speaker', 'under 3000', 'commuting', 'cable', 'lavender']

export function searchProducts(q) {
  const s = q.trim().toLowerCase()
  if (!s) return []
  let max = null
  let rest = s.replace(/(?:under|below|<)\s*₹?\s*(\d[\d,]*)/, (_, n) => { max = parseInt(n.replace(/,/g, ''), 10); return '' }).trim()
  rest = rest.replace(/cancell?ing|cancellation|\banc\b/g, 'noise').replace(/headphone\b/g, 'headphones').replace(/earbud\b/g, 'earbuds')
  const toks = rest.split(/\s+/).filter(Boolean)
  return INDEX.map(({ p, t, n }) => {
    if (max != null && p.price > max) return null
    let score = max != null && !toks.length ? 1 : 0
    for (const k of toks) {
      if (n === k) score += 12
      else if (n.startsWith(k)) score += 8
      else if (n.includes(k)) score += 6
      else if (t.includes(k)) score += 2
      else return null
    }
    return { p, score }
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.p.price - b.p.price).map((r) => r.p)
}
