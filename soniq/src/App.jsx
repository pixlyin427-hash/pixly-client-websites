import { lazy, Suspense, useEffect } from 'react'
import { RouterProvider, useRoute } from './lib/router'
import { StoreProvider, StageProvider, useStore, useStage, useReducedMotion, useMedia } from './lib/store'
import Stage from './three/Stage'
import Header, { MobileMenu } from './components/Header'
import BagDrawer from './components/BagDrawer'
import SearchOverlay from './components/SearchOverlay'
import Home from './pages/Home'
import { prefetchThumbs } from './three/thumbs'
import { SHELF, ACCESSORY_IDS } from './data/catalog'

const Discover = lazy(() => import('./pages/Discover'))
const Collection = lazy(() => import('./pages/Collection'))
const Product = lazy(() => import('./pages/Product'))
const Lab = lazy(() => import('./pages/Lab'))
const Finder = lazy(() => import('./pages/Finder'))
const Compare = lazy(() => import('./pages/Compare'))
const Bundles = lazy(() => import('./pages/Bundles'))
const Studio = lazy(() => import('./pages/Studio'))
const Story = lazy(() => import('./pages/Story'))
const Support = lazy(() => import('./pages/Support'))
const Checkout = lazy(() => import('./pages/Checkout'))

function Routes() {
  const { parts } = useRoute()
  const [a, b] = parts
  switch (a) {
    case undefined: return <Home />
    case 'discover': return <Discover />
    case 'shop': return <Collection cat={b} />
    case 'saved': return <Collection cat="saved" />
    case 'p': return <Product id={b} />
    case 'lab': return <Lab />
    case 'finder': return <Finder />
    case 'compare': return <Compare />
    case 'bundles': return <Bundles />
    case 'studio': return <Studio />
    case 'story': return <Story />
    case 'support': return <Support topic={b} />
    case 'checkout': return <Checkout />
    case 'confirmation': return <Checkout confirmation={b} />
    default: return <NotFound />
  }
}
function NotFound() {
  const { go } = useRoute()
  const { patch } = useStage()
  useEffect(() => { patch({ view: 'dim' }) }, [patch])
  return (
    <div className="sheet"><div className="wrap" style={{ textAlign: 'center', display: 'grid', gap: 18, justifyItems: 'center', paddingTop: '14vh' }}>
      <span className="eyebrow">Lost signal</span>
      <h1 className="t-page">That page isn’t on the Soundstage</h1>
      <button type="button" className="btn btn-primary" onClick={() => go('/')}>Back to the stage</button>
    </div></div>
  )
}

function Shell() {
  const s = useStore()
  const { cfg } = useStage()
  const { nav, path } = useRoute()
  const reduced = useReducedMotion()
  const mobile = useMedia('(max-width: 820px)')

  useEffect(() => { if (s.quality !== 'off') prefetchThumbs([...SHELF, ...ACCESSORY_IDS]) }, [s.quality])
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduce' : 'full'
  }, [reduced])
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return
      if (e.ctrlKey || e.metaKey || e.altKey) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); s.open('search') } return }
      if (e.key === '/') { e.preventDefault(); s.open('search') }
      else if (e.key.toLowerCase() === 'b') s.open('bag')
      else if (e.key.toLowerCase() === 'c') window.location.hash = '#/compare'
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [s])
  useEffect(() => { document.title = `${path === '/' ? 'SONIQ' : 'SONIQ — ' + path.replace(/^\//, '').replace(/\//g, ' · ')} (Prototype)` }, [path])
  useEffect(() => { document.getElementById('main')?.focus({ preventScroll: true }) }, [nav])

  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
      <Stage cfg={cfg} quality={s.quality} reduced={reduced} mobile={mobile} />
      <div className="hud">
        <Header />
        <main id="main" tabIndex={-1} key={path.split('/').slice(0, 3).join('/')} className="route">
          <Suspense fallback={<div className="sheet" aria-busy="true"><div className="wrap"><p className="muted">Tuning in…</p></div></div>}>
            <Routes />
          </Suspense>
        </main>
      </div>
      {nav > 0 && <div key={nav} className="wipe" aria-hidden="true" />}
      <MobileMenu />
      <BagDrawer />
      <SearchOverlay />
      <div className="toasts" aria-live="polite" role="status">
        {s.toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <StoreProvider>
        <StageProvider>
          <Shell />
        </StageProvider>
      </StoreProvider>
    </RouterProvider>
  )
}
