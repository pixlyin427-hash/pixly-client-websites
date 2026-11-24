import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BADGES, BASE_XP, HOMEWORK, OWN_TASK_SEED, REQ_SEED, type BadgeId, type ReqType } from '@/data/content'
import { TODAY, addDays, dayKey } from '@/lib/date'

export type Lang = 'en' | 'hi' | 'mr'
export type WidgetId = 'brief' | 'quick' | 'tonight' | 'exam' | 'subjects' | 'school' | 'badges' | 'diary' | 'extras'
export const WIDGETS: WidgetId[] = ['brief', 'quick', 'tonight', 'exam', 'subjects', 'school', 'badges', 'diary', 'extras']
export type QuickId = 'homework' | 'attendance' | 'exams' | 'messages' | 'timetable' | 'study' | 'fees' | 'library'
export type Mood = 1 | 2 | 3 | 4 | 5

export type Profile = { name: string; age: number; gender: 'girl' | 'boy' | 'other' | ''; cls: string; div: string; avatar: number }
export type Settings = {
  lang: Lang
  theme: 'light' | 'dark' | 'system'
  text: 'md' | 'lg'
  motion: 'system' | 'reduce' | 'full'
  notif: Record<'homework' | 'exams' | 'diary' | 'events' | 'fees' | 'achievements', boolean>
  quiet: boolean
  widgets: WidgetId[]
  hidden: WidgetId[]
  quick: QuickId[]
  hideMarks: boolean
  lock: boolean
}
type Msg = { me: boolean; text: string; time: number }
export type Request = { id: string; type: ReqType; note: string; from?: string; to?: string; created: number; cancelled?: boolean }

type Data = {
  signedIn: boolean
  onboarded: boolean
  profile: Profile
  settings: Settings
  done: Record<string, number>
  submitted: Record<string, number>
  own: { id: string; title: string; mins: number }[]
  packed: Record<string, true>
  read: Record<string, true>
  seen: Record<string, number>
  replies: Record<string, Msg[]>
  notes: { id: string; type: 'absence' | 'pe' | 'other'; text: string; time: number }[]
  chats: Record<string, Msg[]>
  requests: Request[]
  paid: Record<string, { time: number; receipt: string }>
  rsvp: Record<string, boolean>
  pulse: Record<string, 'got' | 'partly' | 'lost'>
  help: Record<string, true>
  renewed: Record<string, true>
  reserved: Record<string, true>
  recall: { last?: string; days: number; correct: number; total: number }
  dictBest: number
  goals: Record<string, true>
  sessions: { id: string; subj: string; mins: number; day: string }[]
  quiz: { answers: Record<number, number>; started?: number; result?: { score: number; time: number } }
  revised: Record<string, true>
  mood: Record<string, Mood>
  bookings: { slot: number; who: 'counsellor' | 'teacher' }[]
  concerns: { ref: string; time: number; anon: boolean }[]
  earned: Partial<Record<BadgeId, number>>
  xp: number
  housePts: number
  wished: Record<string, true>
  dinner: Record<string, 'knew' | 'help' | 'no'>
  attSeen?: string
  nbFixed: Record<string, true>
  late: Record<string, number>
  tabs: Record<string, string>
  recent: string[]
}

const seed = (): Data => ({
  signedIn: false,
  onboarded: false,
  profile: { name: '', age: 12, gender: '', cls: '7', div: 'B', avatar: 0 },
  settings: {
    lang: 'en', theme: 'system', text: 'md', motion: 'system',
    notif: { homework: true, exams: true, diary: true, events: true, fees: true, achievements: true },
    quiet: true, widgets: WIDGETS, hidden: [], quick: ['homework', 'attendance', 'exams', 'messages'], hideMarks: false, lock: false,
  },
  done: { [OWN_TASK_SEED.id]: Date.now() },
  submitted: Object.fromEntries(HOMEWORK.filter((h) => h.submitted).map((h) => [h.id, h.submitted!.getTime()])),
  own: [],
  packed: {}, read: {}, seen: {}, replies: {}, notes: [], chats: {},
  requests: REQ_SEED.map((r) => ({ id: r.id, type: r.type, note: r.note.en, created: r.created })),
  paid: {}, rsvp: {}, pulse: {}, help: {}, renewed: {}, reserved: {},
  recall: { days: 7, correct: 0, total: 0 },
  dictBest: 0, goals: {}, sessions: [],
  quiz: { answers: {} },
  revised: {},
  mood: { [dayKey(addDays(TODAY, -2))]: 4, [dayKey(addDays(TODAY, -1))]: 3 },
  bookings: [], concerns: [],
  earned: Object.fromEntries(BADGES.filter((b) => b.earned).map((b) => [b.id, b.earned!.getTime()])),
  xp: BASE_XP, housePts: 0,
  wished: {}, dinner: {}, nbFixed: {}, late: {}, tabs: {}, recent: [],
})

/* ---------- transient UI state (not saved) ---------- */
export type Toast = { id: number; text: string; tone: 'ok' | 'bad' | 'info'; undo?: () => void }
type UI = { toasts: Toast[]; celebrate: BadgeId[]; liveNotif: boolean; bell: number; unlocked: boolean }
const liveSeen = () => {
  try { return sessionStorage.getItem('stkv-live') === '1' } catch { return false }
}
export const useUI = create<UI>(() => ({ toasts: [], celebrate: [], liveNotif: liveSeen(), bell: 0, unlocked: false }))
let tid = 0
export function toast(text: string, tone: Toast['tone'] = 'ok', undo?: () => void) {
  const id = ++tid
  useUI.setState((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone, undo }] }))
  setTimeout(() => useUI.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), undo ? 4000 : 2600)
}

/* ---------- badge rules ---------- */
export const hwDoneCount = (s: Data) => HOMEWORK.filter((h) => s.done[h.id] && !h.submitted).length
export const moodCount = (s: Data) => Object.keys(s.mood).length

function unlocks(s: Data, packedAll = false): Partial<Data> {
  const add: BadgeId[] = []
  if (!s.earned['homework-hero'] && hwDoneCount(s) >= 3) add.push('homework-hero')
  if (!s.earned.packed && packedAll) add.push('packed')
  if (!s.earned['kind-voice'] && moodCount(s) >= 5) add.push('kind-voice')
  if (!s.earned['recall-pro'] && s.recall.days >= 10) add.push('recall-pro')
  if (!add.length) return {}
  useUI.setState((u) => ({ celebrate: [...u.celebrate, ...add] }))
  const now = Date.now()
  return {
    earned: { ...s.earned, ...Object.fromEntries(add.map((b) => [b, now])) },
    xp: s.xp + 50 * add.length,
    housePts: s.housePts + 20 * add.length,
  }
}

type Actions = {
  update: (fn: Partial<Data> | ((s: Data) => Partial<Data>)) => void
  setSettings: (p: Partial<Settings>) => void
  toggleDone: (id: string) => boolean
  togglePack: (key: string, all: string[]) => void
  setMood: (m: Mood) => void
  finishRecall: (correct: number, total: number) => void
  reset: () => void
}

export const useApp = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...seed(),
      update: (fn) => set((s) => (typeof fn === 'function' ? fn(s) : fn)),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      toggleDone: (id) => {
        const s = get()
        const on = !s.done[id]
        const done = { ...s.done }
        if (on) done[id] = Date.now()
        else delete done[id]
        const next = { ...s, done, xp: s.xp + (on ? 5 : -5) }
        set({ done, xp: next.xp, ...unlocks(next) })
        return on
      },
      togglePack: (key, all) => {
        const s = get()
        const packed = { ...s.packed }
        if (packed[key]) delete packed[key]
        else packed[key] = true
        set({ packed, ...unlocks({ ...s, packed }, all.every((k) => packed[k])) })
      },
      setMood: (m) => {
        const s = get()
        const mood = { ...s.mood, [dayKey(TODAY)]: m }
        set({ mood, ...unlocks({ ...s, mood }) })
      },
      finishRecall: (correct, total) => {
        const s = get()
        const today = dayKey(TODAY)
        const first = s.recall.last !== today
        const recall = { last: today, days: s.recall.days + (first ? 1 : 0), correct: s.recall.correct + correct, total: s.recall.total + total }
        const next = { ...s, recall, xp: s.xp + (first ? 10 : 0) }
        set({ recall, xp: next.xp, ...unlocks(next) })
      },
      reset: () => set({ ...seed(), settings: get().settings }),
    }),
    { name: 'stkv-demo', version: 1 },
  ),
)

export const level = (xp: number) => ({ level: Math.floor(xp / 500) + 1, into: xp % 500, need: 500 })
