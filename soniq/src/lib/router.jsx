import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

const parse = (hash) => {
  const raw = (hash || '').replace(/^#/, '') || '/'
  const [path, qs = ''] = raw.split('?')
  const parts = path.split('/').filter(Boolean)
  return { path: '/' + parts.join('/'), parts, query: Object.fromEntries(new URLSearchParams(qs)) }
}

const Ctx = createContext(null)
export function RouterProvider({ children }) {
  const [loc, setLoc] = useState(() => parse(window.location.hash))
  const [dir, setDir] = useState(0)
  useEffect(() => {
    const on = () => { setLoc(parse(window.location.hash)); setDir((d) => d + 1) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = useCallback((to) => {
    const next = to.startsWith('#') ? to : '#' + to
    if (window.location.hash === next) return
    window.location.hash = next
  }, [])
  const value = useMemo(() => ({ ...loc, go, nav: dir }), [loc, go, dir])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useRoute = () => useContext(Ctx)

export function Link({ to, children, className, onClick, ...rest }) {
  const { path } = useRoute()
  const target = to.split('?')[0]
  const current = path === target || (target !== '/' && path.startsWith(target + '/'))
  return (
    <a href={'#' + to} className={className} aria-current={current ? 'page' : undefined} onClick={onClick} {...rest}>
      {children}
    </a>
  )
}
