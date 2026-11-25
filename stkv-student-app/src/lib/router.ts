import { useSyncExternalStore } from 'react'

export const TABS = ['/', '/learn', '/school', '/achievements', '/profile'] as const

export type Route = { path: string; dir: -1 | 0 | 1; key: number }

const read = () => decodeURI(location.hash.replace(/^#/, '')) || '/'
const listeners = new Set<() => void>()
let stack = [read()]
let route: Route = { path: stack[0], dir: 0, key: 0 }

function emit(path: string, dir: Route['dir']) {
  route = { path, dir, key: route.key + 1 }
  listeners.forEach((l) => l())
}

window.addEventListener('hashchange', () => {
  const path = read()
  if (path === route.path) return
  if (stack.length > 1 && stack[stack.length - 2] === path) {
    stack.pop()
    emit(path, -1)
  } else if ((TABS as readonly string[]).includes(path)) {
    stack = [path]
    emit(path, 0)
  } else {
    stack.push(path)
    emit(path, 1)
  }
})

export function navigate(to: string) {
  if (to === route.path) return
  if ((TABS as readonly string[]).includes(to)) {
    stack = [to]
    history.replaceState(null, '', '#' + to)
    emit(to, 0)
  } else location.hash = to
}

export function back(fallback = '/') {
  if (stack.length > 1) history.back()
  else navigate(fallback)
}

export function useRoute() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => route,
  )
}

export function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/'), b = path.split('/')
  if (a.length !== b.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = b[i]
    else if (a[i] !== b[i]) return null
  }
  return params
}

export const tabOf = (path: string) =>
  TABS.find((t) => t !== '/' && path.startsWith(t)) ??
  (['/timetable', '/classroom', '/library', '/homework', '/study', '/exams', '/progress'].some((p) => path.startsWith(p))
    ? '/learn'
    : ['/attendance', '/messages', '/requests', '/fees', '/wellbeing', '/ride'].some((p) => path.startsWith(p))
      ? '/school'
      : ['/settings', '/id'].some((p) => path.startsWith(p))
        ? '/profile'
        : '/')
