import { useApp, useUI } from '@/store'
import { ACADEMIC_START, HOMEWORK, LIVE_NOTIF, NOTIFS, OWN_TASK_SEED, REPORTS, attendanceOn, type Homework } from '@/data/content'
import { TOMORROW, type SubjectId, type Txt } from '@/data/school'
import { TODAY, addDays, isSchoolDay } from '@/lib/date'

export function useNotifs() {
  const live = useUI((s) => s.liveNotif)
  return live ? [LIVE_NOTIF, ...NOTIFS] : NOTIFS
}

export function useUnread() {
  const read = useApp((s) => s.read)
  return useNotifs().filter((n) => !read[n.id]).length
}

/* ---------- Attendance ---------- */
export function attendanceRange(from: Date, to: Date) {
  let present = 0, total = 0, late = 0
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const a = attendanceOn(d)
    if (!a) continue
    total++
    if (a.status !== 'A') present++
    if (a.status === 'L') late++
  }
  return { present, total, late, pct: total ? Math.round((present / total) * 100) : 0 }
}
export const monthOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
export const thisMonth = () => attendanceRange(monthOf(TODAY), TODAY)
export const thisYear = () => attendanceRange(ACADEMIC_START, TODAY)
export function onTimeStreak() {
  let n = 0
  for (let d = TODAY; d >= ACADEMIC_START; d = addDays(d, -1)) {
    if (!isSchoolDay(d)) continue
    const a = attendanceOn(d)
    if (!a || a.status !== 'P') break
    n++
  }
  return n
}

/* ---------- Tonight planner ---------- */
export type TonightItem = { id: string; title: Txt | string; mins: number; subj?: SubjectId; hw?: Homework }
export function useTonight(): TonightItem[] {
  const own = useApp((s) => s.own)
  const submitted = useApp((s) => s.submitted)
  const hw = HOMEWORK.filter((h) => !submitted[h.id] && !h.submitted && (h.due <= TOMORROW || h.tonight)).map(
    (h) => ({ id: h.id, title: h.title, mins: h.tonight ?? h.mins, subj: h.subj, hw: h }) as TonightItem,
  )
  return [{ id: OWN_TASK_SEED.id, title: OWN_TASK_SEED.title, mins: OWN_TASK_SEED.mins }, ...hw, ...own]
}

/* ---------- Results ---------- */
export const LATEST = REPORTS[REPORTS.length - 1]
export const PREVIOUS = REPORTS[REPORTS.length - 2]
export const seriesOf = (s: 'eng' | 'hin' | 'mar' | 'mat' | 'sci' | 'sst') => REPORTS.map((r) => r.scores[s])
export const CLASS_RANK = 6
export const CLASS_SIZE = 42
