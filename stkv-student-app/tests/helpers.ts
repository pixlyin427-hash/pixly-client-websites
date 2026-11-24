import { expect, type Page } from '@playwright/test'

export const ROUTES = [
  '/', '/learn', '/school', '/achievements', '/profile', '/features', '/notifications', '/search',
  '/timetable', '/classroom', '/classroom/sci', '/homework', '/homework/hw-mat', '/homework/focus',
  '/study', '/study/recall', '/study/dictation', '/exams', '/exams/ex-hin', '/exams/quiz', '/progress',
  '/attendance', '/messages', '/messages/notice/nt-ptm', '/messages/chat/ch-desai', '/requests', '/requests/new',
  '/fees', '/wellbeing', '/ride', '/id', '/settings', '/profile/edit',
]

/** Signed-in, onboarded demo state, so tests can open any screen directly. */
export async function signedIn(page: Page, settings: Record<string, unknown> = {}) {
  await page.addInitScript((s) => {
    if (location.protocol === 'about:' || sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    sessionStorage.setItem('stkv-live', '1')
    localStorage.setItem('stkv-demo', JSON.stringify({ version: 1, state: { signedIn: true, onboarded: true, profile: { name: 'Aarav Deshmukh', age: 12, gender: '', cls: '7', div: 'B', avatar: 0 }, ...(Object.keys(s).length ? { settings: { lang: 'en', theme: 'light', text: 'md', motion: 'reduce', notif: { homework: true, exams: true, diary: true, events: true, fees: true, achievements: true }, quiet: true, widgets: ['brief', 'quick', 'tonight', 'exam', 'subjects', 'school', 'badges', 'diary', 'extras'], hidden: [], quick: ['homework', 'attendance', 'exams', 'messages'], hideMarks: false, lock: false, ...s } } : {}) } }))
  }, settings)
}

export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return errors
}

/** Fresh load of a route, so assertions never hit the previous screen while it animates out. */
export async function open(page: Page, route: string) {
  await page.goto('about:blank')
  await page.goto(`/#${route}`)
  await expect(page.locator('h1').first()).toBeVisible()
}
