import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import {
  BookOpen, CalendarDays, ChevronRight, Clock, FileText, GraduationCap, Library, Megaphone, MessagesSquare, NotebookPen,
  Palette, Paperclip, Plus, Shirt, Sparkles, Target, Timer, Trophy, UserCheck, Users, Utensils, Wallet, type LucideIcon,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { ease, item, list, spring } from '@/lib/motion'
import { TODAY, addDays, dayKey, daysBetween, isSchoolDay, nowMinutes, sameDay } from '@/lib/date'
import { useI18n, type I18n, type Key } from '@/i18n'
import { toast, useApp, type QuickId, type WidgetId } from '@/store'
import { CHANGE_INFO, SUBJECTS, TOMORROW, periodsFor, type Period } from '@/data/school'
import { BADGES, BIRTHDAYS, DIARY, DINNER, EVENTS, EXAMS, HOUSES, NOTICES, attendanceOn } from '@/data/content'
import { LATEST, PREVIOUS, onTimeStreak, seriesOf, thisMonth, useTonight, monthOf } from '@/lib/derived'
import { Button, Card, Pressable, Section, Tile, TopActions } from '@/components/core'
import { CountUp, EmptyState, HexBadge, Ring, Spark } from '@/components/data'
import { Sheet } from '@/components/overlay'
import { Input } from '@/components/form'
import { Crest } from '@/components/brand'
import { CLASS_NAMES, isLittle } from './auth'

const short = (m: number) => `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')}`
const CHANGE_ICON = { moved: Palette, test: FileText, uniform: Shirt, cancelled: Users } as const

function useNow() {
  const [now, setNow] = useState(nowMinutes())
  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 30000)
    return () => clearInterval(id)
  }, [])
  return now
}

/* ---------------- Deck ---------------- */
function Deck() {
  const { t, tx, d } = useI18n()
  const profile = useApp((s) => s.profile)
  const now = useNow()
  const todayP = periodsFor(TODAY)
  const live = todayP.length > 0 && now < todayP[todayP.length - 1].end
  const day = live ? TODAY : TOMORROW
  const periods = live ? todayP : periodsFor(TOMORROW)
  const changes = live ? [] : periods.filter((p) => p.change)
  const current = live ? periods.find((p) => now >= p.start && now < p.end) : undefined
  const [sel, setSel] = useState<number>(current?.n ?? changes[0]?.n ?? 1)
  const selected = periods.find((p) => p.n === sel) ?? periods[0]
  const start = periods[0].start, end = periods[periods.length - 1].end
  const hour = new Date().getHours()
  const first = profile.name.split(' ')[0]
  const isTomorrow = daysBetween(TODAY, day) === 1
  const dayName = isTomorrow ? t('c.tomorrow') : d.wdLong(day)
  const cancelled = changes.find((p) => p.change === 'cancelled')
  return (
    <section className="deck-dots relative -mx-5 overflow-clip rounded-b-[36px] bg-deck px-5 pt-[calc(10px+env(safe-area-inset-top))] pb-[78px] text-[#f4f7fc] md:mx-0 md:mt-6 md:rounded-[36px] md:px-7 dark:shadow-[inset_0_-1px_0_var(--border)]">
      <svg viewBox="0 0 330 330" className="pointer-events-none absolute -top-[120px] -right-[120px] w-[330px] text-sky" aria-hidden>
        <g fill="none" stroke="currentColor"><circle cx="165" cy="165" r="150" strokeOpacity=".22" /><circle cx="165" cy="165" r="122" strokeOpacity=".12" strokeDasharray="1 7" /><circle cx="165" cy="165" r="92" strokeOpacity=".1" /></g>
        <path d="M165 9v12M165 309v12M9 165h12M309 165h12" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.5" />
        <circle cx="59" cy="271" r="4" fill="#62A5F5" />
      </svg>
      <motion.div variants={list} initial="hidden" animate="show" className="relative">
        <motion.div variants={item} className="flex items-center justify-between pt-2">
          <button onClick={() => navigate('/profile')} className="flex min-w-0 items-center gap-2.5 text-left">
            <Crest className="size-10" />
            <span className="min-w-0">
              <span className="block truncate text-[15px] leading-[19px] font-semibold tracking-[-0.015em]">{profile.name}</span>
              <span className="eyebrow text-[#a9b8d3]">{t('pf.class', { c: CLASS_NAMES[profile.cls] ? tx(CLASS_NAMES[profile.cls]) : profile.cls, d: profile.div })}</span>
            </span>
          </button>
          <TopActions deck />
        </motion.div>
        <motion.p variants={item} className="eyebrow mt-7 flex items-center gap-2 text-[#a9b8d3]">
          <span className="size-1.5 rounded-full bg-sky shadow-[0_0_0_3px_rgb(98_165_245/0.22)]" />
          {t(live ? 'h.todayEyebrow' : 'h.briefEyebrow', { d: d.short(TODAY) })}
        </motion.p>
        <motion.h1 variants={item} className="mt-2.5 text-[31px] leading-[1.06] font-bold tracking-[-0.045em] text-balance">
          {live ? (
            <>{t(hour < 12 ? 'h.morning' : 'h.afternoon')}, {first}.</>
          ) : changes.length ? (
            <>{isTomorrow ? t('h.changes') : t('h.dayHas', { d: dayName })}<br /><em className="text-amber not-italic">{t('h.changesN', { n: changes.length })}</em></>
          ) : (
            <>{t('h.evening')}, {first}.<br /><span className="text-[#a9b8d3]">{t('h.noChanges')}</span></>
          )}
        </motion.h1>
        <motion.p variants={item} className="mt-2 text-[14.5px] leading-5 text-[#a9b8d3]">
          {live
            ? current ? t('h.nowIn', { s: `${tx(SUBJECTS[current.subj].name)} · ${t('c.period', { n: current.n })}` }) : t('h.firstAt', { t: short(start) })
            : <>{d.wdLong(day)} · <b className="font-semibold text-[#f4f7fc]">{cancelled ? t('h.endsEarly', { t: short(cancelled.start) }) : t('h.firstAt', { t: short(start) })}</b></>}
        </motion.p>
        <motion.div variants={item} className="mt-5 rounded-[26px] bg-white/7 p-3 pt-3.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.11)]">
          <div className="mb-3 flex items-center justify-between px-0.5 text-[#a9b8d3]">
            <span className="eyebrow">{t('h.timetableOf', { d: dayName })}</span>
            <span className="eyebrow flex items-center gap-1.5"><i className={clsx('size-2 rounded-[2px]', live ? 'bg-sky' : 'bg-amber')} />{t(live ? 'h.now' : 'h.changed')}</span>
          </div>
          <div className="relative">
            <div className="flex h-[62px] gap-[3px]" role="group" aria-label={t('h.timetableOf', { d: dayName })}>
              {periods.map((p, i) => (
                <PeriodBlock key={p.n} p={p} i={i} t={t} tx={tx} on={p.n === selected.n} past={live && p.end <= now} now={current?.n === p.n} onClick={() => setSel(p.n)} recessAfter={p.n === 3 && periods.length > 3} />
              ))}
            </div>
            {live && now > start && now < end && (
              <motion.span layout className="pointer-events-none absolute -top-1.5 -bottom-1.5 w-0.5 rounded-full bg-sky shadow-[0_0_0_3px_rgb(98_165_245/0.25)]" style={{ left: `${((now - start) / (end - start)) * 100}%` }} aria-hidden />
            )}
          </div>
          <div className="relative mt-2 h-3.5 font-mono text-[9.5px] text-[#a9b8d3]" aria-hidden>
            {[start, 570, 690, end].map((m, i) => (
              <span key={m} className="absolute" style={{ left: `${((m - start) / (end - start)) * 100}%`, transform: i === 0 ? 'none' : i === 3 ? 'translateX(-100%)' : 'translateX(-50%)' }}>{short(m)}</span>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.button key={selected.n} onClick={() => navigate('/timetable')} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22, ease: ease.enter }} className="mt-3 flex min-h-[60px] w-full items-center gap-3 rounded-[18px] bg-white/6 p-2.5 text-left">
              <PeriodIcon p={selected} />
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] leading-[19px] font-semibold tracking-[-0.01em]">{tx(SUBJECTS[selected.subj].name)} · {t('c.period', { n: selected.n })}</span>
                <span className="block text-[12.5px] leading-[17px] text-[#a9b8d3]">{selected.change ? tx(CHANGE_INFO[selected.change]) : `${tx(SUBJECTS[selected.subj].teacher)} · ${tx(SUBJECTS[selected.subj].room)} · ${short(selected.start)}–${short(selected.end)}`}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-[#a9b8d3]" />
            </motion.button>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  )
}

function PeriodIcon({ p }: { p: Period }) {
  const Icon: LucideIcon = p.change ? CHANGE_ICON[p.change] : SUBJECTS[p.subj].icon
  return <span className={clsx('grid size-10 shrink-0 place-items-center rounded-[13px]', p.change ? 'bg-amber text-navy' : 'bg-white/8')}><Icon className="size-5" strokeWidth={1.9} /></span>
}

function PeriodBlock({ p, i, t, tx, on, past, now, onClick, recessAfter }: { p: Period; i: number; t: I18n['t']; tx: I18n['tx']; on: boolean; past: boolean; now: boolean; onClick: () => void; recessAfter: boolean }) {
  const cancelled = p.change === 'cancelled'
  return (
    <>
      <motion.button
        onClick={onClick}
        aria-pressed={on}
        aria-label={`${t('c.period', { n: p.n })}: ${tx(SUBJECTS[p.subj].name)}${p.change ? ` · ${t('h.changed')}` : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: past ? 0.45 : 1, y: on ? -4 : 0 }}
        transition={{ ...spring.indicator, delay: 0.25 + i * 0.03 }}
        className={clsx(
          'flex min-w-0 flex-1 flex-col justify-between overflow-hidden rounded-xl py-[7px] pr-0 pl-1.5 text-left whitespace-nowrap',
          cancelled ? 'hatch text-amber shadow-[inset_0_0_0_1px_rgb(240_165_43/0.55)] [--hatch:rgb(240_165_43/0.3)]' : p.change ? 'bg-amber text-navy' : now ? 'bg-royal text-white' : 'bg-white/10 text-[#f4f7fc] hover:bg-white/16',
          on && 'shadow-[0_0_0_2px_var(--deck),0_0_0_4px_var(--color-sky),0_10px_18px_-6px_rgb(0_0_0/0.5)]',
        )}
      >
        <span className="font-mono text-[9.5px] opacity-80">{t('c.periodShort', { n: p.n })}</span>
        <span className="truncate text-[11.5px] font-semibold tracking-[-0.01em]">{cancelled ? short(p.start) : tx(SUBJECTS[p.subj].short)}</span>
      </motion.button>
      {recessAfter && <span className="hatch min-w-0 flex-[0.5] rounded-xl" aria-hidden />}
    </>
  )
}

/* ---------------- Boarding-pass pack list ---------------- */
const PACK: { id: string; icon: LucideIcon; label: Key }[] = [
  { id: 'shirt', icon: Shirt, label: 'h.packShirt' },
  { id: 'hindi', icon: BookOpen, label: 'h.packHindi' },
  { id: 'art', icon: Palette, label: 'h.packArt' },
  { id: 'paper', icon: FileText, label: 'h.packPaper' },
]

function Pass() {
  const { t, d } = useI18n()
  const packed = useApp((s) => s.packed)
  const togglePack = useApp((s) => s.togglePack)
  const keys = PACK.map((p) => `${dayKey(TOMORROW)}:${p.id}`)
  const left = keys.filter((k) => !packed[k]).length
  const ready = left === 0
  const dayName = daysBetween(TODAY, TOMORROW) === 1 ? t('c.tomorrow') : d.wdLong(TOMORROW)
  return (
    <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, ease: ease.enter }} className="relative z-[2] -mt-[52px] grid grid-cols-[1fr_88px] rounded-3xl bg-raised shadow-e3 before:absolute before:-top-2.5 before:right-[88px] before:size-5 before:translate-x-1/2 before:rounded-full before:bg-deck after:absolute after:-bottom-2.5 after:right-[88px] after:size-5 after:translate-x-1/2 after:rounded-full after:bg-bg md:mx-6">
      <div className="min-w-0 p-4 pr-3">
        <div className="flex items-center justify-between text-ink-3">
          <span className="eyebrow">{t('h.pack', { d: dayName })}</span>
          <span className="flex gap-[3px]" aria-hidden>{keys.map((k) => <i key={k} className={clsx('h-1 w-3.5 rounded-[2px] transition-colors duration-300', packed[k] ? 'bg-teal' : 'bg-muted')} />)}</span>
        </div>
        <div className="mt-2.5 grid gap-[5px]">
          {PACK.map((p, i) => {
            const on = !!packed[keys[i]]
            return (
              <motion.button key={p.id} whileTap={{ scale: 0.97 }} transition={spring.tap} aria-pressed={on} onClick={() => { togglePack(keys[i], keys); if (!on && left === 1) toast(t('h.packedToast', { d: dayName })) }} className={clsx('flex min-h-10 items-center gap-2 overflow-hidden rounded-xl px-2 py-1.5 text-left text-[13px] font-semibold whitespace-nowrap transition-colors duration-200', on ? 'bg-teal-soft text-teal-ink' : 'bg-bg text-ink')}>
                <span className={clsx('grid size-6 shrink-0 place-items-center rounded-lg transition-colors duration-200', on ? 'bg-teal text-white' : 'bg-ice text-royal dark:text-sky')}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={String(on)} initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0 }} transition={spring.celebrate}>
                      {on ? <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> : <p.icon className="size-3.5" strokeWidth={2.1} />}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="truncate">{t(p.label)}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
      <motion.div animate={ready ? { rotate: -3.5, x: 3, y: 4 } : { rotate: 0, x: 0, y: 0 }} transition={spring.celebrate} style={{ transformOrigin: '15% 0%' }} className={clsx('flex flex-col items-center justify-center gap-0.5 rounded-r-3xl border-l-2 border-dashed border-line-strong px-1.5 py-3 text-center transition-colors duration-300', ready ? 'bg-teal-soft' : 'bg-amber-soft dark:bg-amber')}>
        <span className={clsx('eyebrow', ready ? 'text-teal-ink' : 'text-amber-ink dark:text-navy')}>{t(ready ? 'h.packed' : 'h.toPack')}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={left} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 14, opacity: 0 }} transition={spring.indicator} className={clsx('text-[36px] leading-[38px] font-bold tracking-[-0.05em] tabular-nums', !ready && 'dark:text-navy')}>{ready ? '✓' : left}</motion.span>
        </AnimatePresence>
        <span className={clsx('text-[11.5px] font-semibold text-ink-2', !ready && 'dark:text-navy')}>{ready ? t('h.bagReady') : t(left === 1 ? 'h.packOne' : 'h.packLeft')}</span>
        <span className={clsx('barcode mt-1.5 h-4 w-[54px] rounded-[2px] opacity-55', ready ? 'text-ink' : 'text-ink dark:text-navy')} aria-hidden />
      </motion.div>
    </motion.section>
  )
}

/* ---------------- Quick actions ---------------- */
export const QUICK: Record<QuickId, { icon: LucideIcon; label: Key; to: string; tone: 'royal' | 'teal' | 'purple' }> = {
  homework: { icon: NotebookPen, label: 'hw.homework', to: '/homework', tone: 'royal' },
  attendance: { icon: UserCheck, label: 'h.attendance', to: '/attendance', tone: 'teal' },
  exams: { icon: GraduationCap, label: 's.exams', to: '/exams', tone: 'royal' },
  messages: { icon: MessagesSquare, label: 'ms.chat', to: '/messages', tone: 'royal' },
  timetable: { icon: CalendarDays, label: 'tt.day', to: '/timetable', tone: 'royal' },
  study: { icon: Target, label: 'st.recall', to: '/study', tone: 'purple' },
  fees: { icon: Wallet, label: 'fe.pay', to: '/fees', tone: 'royal' },
  library: { icon: Library, label: 'cl.library', to: '/classroom', tone: 'royal' },
}

function Quick() {
  const { t } = useI18n()
  const quick = useApp((s) => s.settings.quick)
  return (
    <section className="mt-8 grid grid-cols-4 gap-1" aria-label={t('h.quick')}>
      {quick.map((id) => {
        const q = QUICK[id]
        return (
          <motion.button key={id} whileTap={{ scale: 0.92 }} transition={spring.tap} onClick={() => navigate(q.to)} className="flex min-w-0 flex-col items-center gap-2 py-1">
            <Tile icon={q.icon} tone={q.tone} size={56} />
            <span className="w-full truncate text-center text-xs leading-[15px] font-semibold">{t(q.label)}</span>
          </motion.button>
        )
      })}
    </section>
  )
}

/* ---------------- Tonight planner ---------------- */
export function TonightList({ compact }: { compact?: boolean }) {
  const { t, tx, d, mins } = useI18n()
  const items = useTonight()
  const done = useApp((s) => s.done)
  const toggleDone = useApp((s) => s.toggleDone)
  const [xp, setXp] = useState<string>()
  const [add, setAdd] = useState(false)
  const left = items.filter((i) => !done[i.id])
  const minsLeft = left.reduce((a, i) => a + i.mins, 0)
  const minsDone = items.filter((i) => done[i.id]).reduce((a, i) => a + i.mins, 0)
  const tick = (id: string, title: string) => {
    const on = toggleDone(id)
    if (on) {
      setXp(id)
      setTimeout(() => setXp(undefined), 900)
      toast(t('hw.doneToast', { t: title }), 'ok', () => toggleDone(id))
    }
  }
  return (
    <>
      {!compact && (
        <div className="mb-2 flex justify-between gap-2" aria-hidden>
          <span className="eyebrow text-ink-3">{t('h.doneTime', { t: mins(minsDone) })}</span>
          <span className="eyebrow text-ink-3">{t('h.bedBy')}</span>
        </div>
      )}
      <div className="flex h-3 gap-[3px]" aria-hidden>
        {items.map((i, k) => (
          <motion.i key={i.id} layout initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 + k * 0.06, duration: 0.6, ease: ease.enter }} style={{ flexGrow: i.mins, originX: 0 }} className={clsx('rounded-[4px] transition-colors duration-300', done[i.id] ? 'bg-teal' : 'bg-ice dark:bg-[#25478a]')} />
        ))}
      </div>
      <div role="list" className="relative mt-2 before:absolute before:top-6 before:bottom-6 before:left-[12px] before:w-0.5 before:rounded before:bg-line">
        <AnimatePresence initial={false}>
          {items.map((i) => {
            const on = !!done[i.id]
            const title = tx(i.title)
            const S = i.subj ? SUBJECTS[i.subj] : undefined
            return (
              <motion.div role="listitem" key={i.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative grid grid-cols-[26px_1fr_auto] items-start gap-3.5 py-3">
                <motion.button whileTap={{ scale: 0.86 }} transition={spring.tap} role="checkbox" aria-checked={on} aria-label={title} onClick={() => tick(i.id, title)} className={clsx('relative grid size-[26px] place-items-center rounded-full border-2 shadow-[0_0_0_4px_var(--bg)] transition-colors duration-200', on ? 'border-teal bg-teal' : 'border-line-strong bg-surface')}>
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><motion.path d="M20 6 9 17l-5-5" initial={false} animate={{ pathLength: on ? 1 : 0 }} transition={{ duration: 0.28, ease: ease.enter }} /></svg>
                </motion.button>
                <button onClick={() => i.hw && navigate(`/homework/${i.hw.id}`)} className="min-w-0 text-left" tabIndex={i.hw ? 0 : -1}>
                  <span className={clsx('relative block text-[15px] leading-5 font-semibold tracking-[-0.012em] transition-colors duration-300', on && 'text-ink-3')}>
                    {title}
                    <motion.span className="absolute top-[55%] left-0 h-[1.5px] bg-current" initial={false} animate={{ width: on ? '100%' : '0%' }} transition={{ duration: 0.3, ease: ease.enter }} />
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] leading-[18px] text-ink-3">
                    {S && i.hw ? <><S.icon className="size-3.5" strokeWidth={2.2} /><span className="font-semibold text-ink-2">{tx(S.name)}</span>· {sameDay(i.hw.due, TOMORROW) ? t('hw.dueTomorrow') : t('c.due', { d: d.dm(i.hw.due) })}</> : t('h.own')}
                  </span>
                </button>
                <span className="relative">
                  <span className={clsx('rounded-full px-2 py-[3px] font-mono text-[11.5px] tabular-nums transition-colors duration-300', on ? 'bg-teal-soft text-teal-ink' : 'bg-muted text-ink-2')}>{t('c.minShort', { n: i.mins })}</span>
                  <AnimatePresence>
                    {xp === i.id && (
                      <motion.span initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -26 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.6, ease: ease.enter }} className="absolute right-0 -top-1 rounded-full bg-amber px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-navy">{t('c.xp', { n: 5 })}</motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" icon={Plus} onClick={() => setAdd(true)}>{t('hw.addOwn')}</Button>
      </div>
      <div className="mt-2 flex items-center gap-3 rounded-[22px] bg-surface p-2.5 pl-3.5 shadow-e1">
        <Tile icon={Timer} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold tracking-[-0.01em]">{left.length ? t('h.next', { s: tx(left[0].title) }) : t('h.nothingLeft')}</span>
          <span className="block text-xs text-ink-3">{left.length ? `${t('h.tasksLeft', { n: left.length, t: mins(minsLeft) })}` : t('h.allDone')}</span>
        </span>
        <Button size="sm" onClick={() => navigate('/homework/focus')}>{t('h.start')}</Button>
      </div>
      <AddOwn open={add} onClose={() => setAdd(false)} />
    </>
  )
}
function AddOwn({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const update = useApp((s) => s.update)
  const [title, setTitle] = useState('')
  const [m, setM] = useState(10)
  const [err, setErr] = useState<string>()
  const save = () => {
    if (title.trim().length < 2) return setErr(t('ms.noteErr'))
    update((s) => ({ own: [...s.own, { id: `own-${Date.now()}`, title: title.trim(), mins: m }] }))
    toast(t('hw.ownAdded'))
    setTitle('')
    setErr(undefined)
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title={t('hw.addOwn')}>
      <div className="flex flex-col gap-4">
        <Input label={t('ms.noteText')} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('hw.ownPlaceholder')} error={err} onKeyDown={(e) => e.key === 'Enter' && save()} />
        <div role="radiogroup" aria-label={t('st.minutes')} className="flex gap-2">
          {[5, 10, 15, 30].map((v) => (
            <button key={v} role="radio" aria-checked={m === v} onClick={() => setM(v)} className={clsx('h-11 flex-1 rounded-full text-sm font-semibold transition-colors', m === v ? 'bg-navy text-white dark:bg-royal' : 'bg-muted text-ink-2')}>{t('c.min', { n: v })}</button>
          ))}
        </div>
        <Button size="lg" block onClick={save}>{t('c.save')}</Button>
      </div>
    </Sheet>
  )
}

/* ---------------- Next test ---------------- */
function NextExam() {
  const { t, tx } = useI18n()
  const revised = useApp((s) => s.revised)
  const ex = EXAMS[0]
  const n = ex.portions.filter((_, i) => revised[`${ex.id}:${i}`]).length
  const days = daysBetween(TODAY, ex.date)
  return (
    <Section title={t('h.nextExam')}>
      <Pressable onClick={() => navigate(`/exams/${ex.id}`)} className="flex w-full items-center gap-4 rounded-3xl bg-surface p-4 shadow-e1">
        <Ring value={n / ex.portions.length} size={58} stroke={6} color="var(--color-amber)">
          <span className="text-[13px] font-bold tabular-nums">{n}/{ex.portions.length}</span>
        </Ring>
        <span className="min-w-0 flex-1">
          <span className="eyebrow text-amber-ink">{days <= 1 ? t('h.tomorrowShort') : t('h.inDays', { n: days })} · {t('c.period', { n: 3 })}</span>
          <span className="mt-0.5 block text-[16px] leading-5 font-semibold tracking-[-0.015em]">{tx(ex.title)}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">{tx(ex.portions[0])}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-3" />
      </Pressable>
    </Section>
  )
}

/* ---------------- Subjects ---------------- */
function Subjects() {
  const { t, tx } = useI18n()
  const hide = useApp((s) => s.settings.hideMarks)
  const rows: ('mat' | 'sci' | 'hin')[] = ['mat', 'sci', 'hin']
  return (
    <Section title={t('h.subjects')} action={{ label: t('h.allResults'), to: '/progress' }}>
      <Card className="py-1">
        {rows.map((s, i) => {
          const S = SUBJECTS[s]
          const delta = LATEST.scores[s] - PREVIOUS.scores[s]
          return (
            <Pressable key={s} onClick={() => navigate('/progress')} className={clsx('relative grid w-full grid-cols-[36px_minmax(0,1fr)_56px_44px] items-center gap-3 px-3.5 py-3', i && 'before:absolute before:top-0 before:right-3.5 before:left-[62px] before:h-px before:bg-hair')}>
              <Tile icon={S.icon} />
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] leading-[19px] font-semibold tracking-[-0.01em]">{tx(S.name)}</span>
                <span className="block truncate text-xs leading-4 text-ink-3">{tx(LATEST.title)}</span>
              </span>
              <Spark values={seriesOf(s)} />
              <span className="text-right">
                {hide ? <span className="text-xs text-ink-3">—</span> : <>
                  <span className="block text-[15px] leading-5 font-semibold tracking-[-0.02em] tabular-nums">{LATEST.scores[s]}</span>
                  <span className={clsx('block font-mono text-[10px]', delta >= 0 ? 'text-teal-ink' : 'text-warning-ink')}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}</span>
                </>}
              </span>
            </Pressable>
          )
        })}
      </Card>
      {hide && <p className="mt-2 text-xs text-ink-3">{t('h.marksHidden')}</p>}
    </Section>
  )
}

/* ---------------- Your school (bento) ---------------- */
function MonthHeat() {
  const { d } = useI18n()
  const first = monthOf(TODAY)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: lead + days }, (_, i) => (i < lead ? null : addDays(first, i - lead)))
  return (
    <div className="grid grid-cols-7 gap-1" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className="text-center font-mono text-[8.5px] text-ink-3">{d.wd(addDays(first, i - lead)).slice(0, 1)}</span>)}
      {cells.map((c, i) => {
        if (!c) return <span key={i} />
        const a = attendanceOn(c)
        const today = sameDay(c, TODAY)
        return (
          <motion.i
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...spring.celebrate, delay: 0.3 + i * 0.012 }}
            className={clsx('size-[13px] rounded-[4px]', !a ? 'bg-muted' : a.status === 'A' ? 'shadow-[inset_0_0_0_1.5px_var(--color-error)]' : a.status === 'L' ? 'bg-teal/55' : 'bg-teal', today && 'ring-2 ring-teal ring-offset-2 ring-offset-surface')}
          />
        )
      })}
    </div>
  )
}

export function useLeague() {
  const bonus = useApp((s) => s.housePts)
  const houses = HOUSES.map((h) => ({ ...h, points: h.points + (h.id === 'blue' ? bonus : 0) })).sort((a, b) => b.points - a.points)
  const rank = houses.findIndex((h) => h.id === 'blue') + 1
  return { houses, rank, me: houses[rank - 1] }
}

function SchoolBento() {
  const { t, tx, d, lang } = useI18n()
  const recall = useApp((s) => s.recall)
  const rsvp = useApp((s) => s.rsvp)
  const update = useApp((s) => s.update)
  const m = thisMonth()
  const { houses, rank, me } = useLeague()
  const ev = EVENTS.find((e) => e.kind === 'event' && e.date >= TODAY)!
  const going = !!rsvp[ev.id]
  const lastWeek = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6))
  const studied = (x: Date) => sameDay(x, TODAY) ? recall.last === dayKey(TODAY) : [1, 2, 4, 5, 6].includes(daysBetween(x, TODAY))
  const ord = (n: number) => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th')
  return (
    <Section title={t('h.school')} aside={d.month(TODAY)}>
      <motion.div variants={list} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 gap-3">
        <motion.button variants={item} whileTap={{ scale: 0.98 }} onClick={() => navigate('/attendance')} className="col-span-2 grid grid-cols-[1fr_auto] items-end gap-3.5 rounded-3xl bg-surface p-4 text-left shadow-e1">
          <span className="col-span-2 flex items-center gap-2 text-[13px] font-semibold text-ink-2"><Tile icon={UserCheck} tone="teal" size={28} />{t('h.attendance')}<ChevronRight className="ml-auto size-4 text-ink-3" /></span>
          <span>
            <span className="block text-[34px] leading-9 font-bold tracking-[-0.055em]"><CountUp to={m.pct} /><small className="text-base font-semibold tracking-[-0.02em]">%</small></span>
            <span className="mt-1 block text-[12.5px] leading-[17px] text-ink-3">{t('h.daysPresent', { a: m.present, b: m.total })}<br />{t('h.onTime', { n: onTimeStreak() })}</span>
            <span className="mt-2.5 flex gap-2.5 text-[11px] font-medium text-ink-3"><span className="flex items-center gap-1"><i className="size-2 rounded-[2.5px] bg-teal" />{t('h.present')}</span><span className="flex items-center gap-1"><i className="size-2 rounded-[2.5px] shadow-[inset_0_0_0_1.5px_var(--color-error)]" />{t('h.absent')}</span></span>
          </span>
          <MonthHeat />
        </motion.button>
        <motion.button variants={item} whileTap={{ scale: 0.97 }} onClick={() => navigate('/achievements')} className="flex flex-col gap-2.5 rounded-3xl bg-surface p-3.5 text-left shadow-e1">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-2"><Tile icon={Trophy} tone="amber" size={28} />{t('h.league')}</span>
          <span className="flex items-center gap-2.5">
            <Shield letter="B" mine />
            <span><span className="block text-[28px] leading-[30px] font-bold tracking-[-0.05em]">{rank}<small className="text-sm font-semibold">{lang === 'en' && ord(rank)}</small></span><span className="block text-[11.5px] text-ink-3">{tx(me.name)}</span></span>
          </span>
          <span className="text-[11.5px] leading-[15px] text-ink-3">{rank === 1 ? t('h.leading', { n: me.points - houses[1].points }) : t('h.behind', { n: houses[0].points - me.points, h: tx(houses[0].name) })}</span>
        </motion.button>
        <motion.button variants={item} whileTap={{ scale: 0.97 }} onClick={() => navigate('/study')} className="flex flex-col gap-2.5 rounded-3xl bg-surface p-3.5 text-left shadow-e1">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-2"><Tile icon={Target} tone="purple" size={28} />{t('h.study')}</span>
          <span><span className="block text-[28px] leading-[30px] font-bold tracking-[-0.05em]">{recall.days}</span><span className="block text-[11.5px] text-ink-3">{t('h.streak')}</span></span>
          <span className="mt-auto grid grid-cols-7 gap-1" aria-hidden>
            {lastWeek.map((x) => (
              <span key={dayKey(x)} className="flex flex-col items-center gap-1 font-mono text-[8.5px] text-ink-3">
                <i className={clsx('grid aspect-square w-full place-items-center rounded-full', studied(x) ? 'bg-purple after:size-[5px] after:rounded-full after:bg-white' : sameDay(x, TODAY) ? 'shadow-[inset_0_0_0_1.5px_var(--color-purple)]' : 'bg-muted')} />
                {d.wd(x).slice(0, 1)}
              </span>
            ))}
          </span>
        </motion.button>
        <motion.div variants={item} className="col-span-2 flex items-center gap-3 rounded-3xl bg-surface p-3 shadow-e1">
          <span className="flex h-[66px] w-[58px] shrink-0 flex-col items-center justify-center rounded-[17px] bg-coral-soft">
            <span className="eyebrow text-coral-ink">{d.wd(ev.date)}</span>
            <b className="text-[26px] leading-7 font-bold tracking-[-0.05em]">{ev.date.getDate()}</b>
          </span>
          <button onClick={() => navigate('/timetable')} className="min-w-0 flex-1 text-left">
            <span className="block text-[14.5px] leading-[19px] font-semibold tracking-[-0.01em]">{tx(ev.title)}</span>
            <span className="mt-0.5 block text-xs text-ink-3">{d.time(ev.date)} · {tx(ev.place)} · {t('tt.going', { n: ev.going + (going ? 1 : 0) })}</span>
          </button>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { update((s) => ({ rsvp: { ...s.rsvp, [ev.id]: !going } })); if (!going) toast(t('tt.rsvpToast')) }} aria-pressed={going} className={clsx('h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-200', going ? 'bg-coral text-navy' : 'bg-ice text-link')}>
            {going ? `✓ ${t('tt.rsvpd')}` : t('tt.rsvp')}
          </motion.button>
        </motion.div>
      </motion.div>
    </Section>
  )
}

export function Shield({ letter, mine, size = 38 }: { letter: string; mine?: boolean; size?: number }) {
  return (
    <svg width={size} height={size * 1.16} viewBox="0 0 38 44" className="shrink-0" aria-hidden>
      <path d="M19 1.5 3 7v13c0 11 7 18.2 16 22.5C28 38.2 35 31 35 20V7z" fill="#142B50" stroke={mine ? '#F0A52B' : 'none'} strokeWidth={mine ? 3 : 0} />
      <text x="19" y="27" textAnchor="middle" fontWeight="700" fontSize="14" fill={mine ? '#F0A52B' : '#F4F7FC'} fontFamily="Geist Variable, sans-serif">{letter}</text>
    </svg>
  )
}

/* ---------------- Badges ---------------- */
function Badges() {
  const { t, tx } = useI18n()
  const earned = useApp((s) => s.earned)
  const sorted = [...BADGES].sort((a, b) => Number(!!earned[b.id]) - Number(!!earned[a.id]))
  return (
    <Section title={t('h.badges')} aside={t('h.badgesOf', { a: Object.keys(earned).length, b: BADGES.length })}>
      <div className="no-scrollbar -mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pt-1 pb-1.5 md:mx-0 md:px-0">
        {sorted.map((b) => (
          <Pressable key={b.id} onClick={() => navigate('/achievements')} className="flex w-[104px] shrink-0 snap-start flex-col items-center gap-2 rounded-[22px] bg-surface px-2.5 py-3.5 text-center shadow-e1">
            <HexBadge id={b.id} earned={!!earned[b.id]} size={52} />
            <span className="text-[12.5px] leading-4 font-semibold tracking-[-0.01em]">{tx(b.name)}</span>
            <span className="line-clamp-2 text-[11px] leading-[14px] text-ink-3">{tx(b.how)}</span>
          </Pressable>
        ))}
      </div>
    </Section>
  )
}

/* ---------------- Diary & announcement ---------------- */
function Diary() {
  const { t, tx, d } = useI18n()
  const seen = useApp((s) => s.seen)
  const update = useApp((s) => s.update)
  const notice = NOTICES.find((n) => n.pinned)!
  const pending = DIARY.filter((x) => x.needsSeen && !seen[x.id])
  const note = DIARY.find((x) => x.needsSeen && (!seen[x.id] || Date.now() - seen[x.id] < 60000)) ?? DIARY[0]
  const isSeen = !!seen[note.id] || !note.needsSeen
  return (
    <Section title={t('h.diary')} aside={pending.length ? t('h.needsYou', { n: pending.length }) : t('n.allRead')}>
      <Pressable onClick={() => navigate(`/messages/notice/${notice.id}`)} className="mb-3 flex w-full items-center gap-3 rounded-[22px] bg-ice p-3 pr-3.5">
        <Tile icon={Megaphone} tone="navy" />
        <span className="min-w-0 flex-1">
          <span className="eyebrow text-link">{t('h.announce')}</span>
          <span className="block truncate text-[14.5px] font-semibold tracking-[-0.01em]">{tx(notice.title)}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-link" />
      </Pressable>
      <div className="grid grid-cols-[40px_1fr] items-start gap-3">
        <span className="relative grid size-10 place-items-center rounded-full bg-ice text-[13px] font-bold text-link after:absolute after:-right-px after:-bottom-px after:size-[11px] after:rounded-full after:bg-teal after:ring-2 after:ring-bg">{note.initials}</span>
        <div className="rounded-[6px_24px_24px_24px] bg-surface px-4 py-3.5 shadow-e1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b className="text-[13.5px] font-semibold">{tx(note.who)} · {tx(note.role)}</b>
            <span className="eyebrow text-ink-3">{d.time(note.time)}</span>
          </div>
          <p className="mt-2 mb-3 text-[15px] leading-[22px] tracking-[-0.01em]">{tx(note.text)}</p>
          {note.attach && (
            <div className="mb-3 flex items-center gap-2.5 rounded-[14px] bg-bg px-2.5 py-2">
              <Tile icon={Paperclip} size={28} />
              <span className="min-w-0"><b className="block truncate text-[13px] font-semibold">{note.attach}</b><span className="text-[11.5px] text-ink-3">{t('ms.attachment')} · 84 KB</span></span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <motion.button
              layout
              whileTap={isSeen ? undefined : { scale: 0.96 }}
              disabled={isSeen}
              onClick={() => { update((s) => ({ seen: { ...s.seen, [note.id]: Date.now() } })); toast(t('ms.seenToast', { t: tx(note.who) })) }}
              className={clsx('flex h-10 items-center gap-1.5 rounded-full px-[18px] text-sm font-semibold whitespace-nowrap transition-colors duration-300', isSeen ? 'bg-teal-soft text-teal-ink' : 'bg-royal text-white shadow-[0_6px_14px_-6px_rgb(36_87_197/0.55)]')}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {isSeen ? (
                  <motion.span key="s" className="flex items-center gap-1.5" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.celebrate}>✓ {t('ms.seenAt', { t: d.time(seen[note.id] ?? note.time) })}</motion.span>
                ) : (
                  <motion.span key="g" exit={{ opacity: 0 }}>{t('ms.markSeen')}</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>{t('ms.reply')}</Button>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ---------------- Birthdays, family, little learners ---------------- */
function Extras() {
  const { t, tx, d } = useI18n()
  const wished = useApp((s) => s.wished)
  const dinner = useApp((s) => s.dinner)
  const profile = useApp((s) => s.profile)
  const update = useApp((s) => s.update)
  const [reveal, setReveal] = useState(false)
  const today = dayKey(TODAY)
  const answer = dinner[today]
  return (
    <>
      {isLittle(profile.cls) && (
        <Section title={t('h.little')} aside={d.short(TODAY)}>
          <Card className="grid grid-cols-2 gap-3 p-4">
            {([[Utensils, 'h.littleTiffin', 'teal'], [Sparkles, 'h.littleMood', 'teal'], [Clock, 'h.littleWater', 'warning'], [Palette, 'h.littleActivity', 'coral']] as const).map(([I, k, tone]) => (
              <span key={k} className="flex items-center gap-2.5 text-[13px] leading-[17px] font-medium"><Tile icon={I} tone={tone} size={36} />{t(k)}</span>
            ))}
          </Card>
        </Section>
      )}
      <Section title={t('h.birthdays')}>
        <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0">
          {BIRTHDAYS.map((b) => {
            const isToday = sameDay(b.date, TODAY)
            const k = `${dayKey(b.date)}:${b.initials}`
            return (
              <div key={k} className="flex w-[212px] shrink-0 items-center gap-2.5 rounded-[22px] bg-surface p-2.5 shadow-e1">
                <span className={clsx('grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-bold', isToday ? 'bg-coral text-navy' : 'bg-muted text-ink-2')}>{b.initials}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold">{tx(b.name)}</span>
                  <span className="block text-[11.5px] text-ink-3">{isToday ? t('h.bdayToday') : d.dm(b.date)}</span>
                </span>
                {isToday && (
                  <motion.button whileTap={{ scale: 0.92 }} disabled={!!wished[k]} onClick={() => { update((s) => ({ wished: { ...s.wished, [k]: true } })); toast(t('h.wishToast', { n: tx(b.name) })) }} className={clsx('h-8 shrink-0 rounded-full px-2.5 text-xs font-semibold', wished[k] ? 'bg-teal-soft text-teal-ink' : 'bg-coral-soft text-coral-ink')}>
                    {wished[k] ? '✓' : t('h.wish')}
                  </motion.button>
                )}
              </div>
            )
          })}
        </div>
      </Section>
      <Section title={t('h.dinner')}>
        <Card className="p-4">
          <p className="eyebrow mb-1.5 text-ink-3">{t('h.dinnerSub')}</p>
          <p className="text-[16px] leading-6 font-semibold tracking-[-0.015em]">{tx(DINNER.q)}</p>
          <AnimatePresence initial={false}>
            {reveal || answer ? (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                <p className="mt-2 rounded-2xl bg-bg p-3 text-[14px] text-ink-2">{tx(DINNER.a)}</p>
                <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={t('h.dinner')}>
                  {(['knew', 'help', 'no'] as const).map((k) => (
                    <button key={k} role="radio" aria-checked={answer === k} onClick={() => update((s) => ({ dinner: { ...s.dinner, [today]: k } }))} className={clsx('h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors', answer === k ? 'bg-navy text-white dark:bg-royal' : 'bg-muted text-ink-2')}>
                      {t(k === 'knew' ? 'h.knew' : k === 'help' ? 'h.neededHelp' : 'h.didntKnow')}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <Button variant="tonal" size="sm" className="mt-3" onClick={() => setReveal(true)}>{t('h.reveal')}</Button>
            )}
          </AnimatePresence>
        </Card>
      </Section>
    </>
  )
}

function NoSchoolToday() {
  const { t, d } = useI18n()
  if (isSchoolDay(TODAY)) return null
  return <div className="mt-6"><EmptyState title={t('h.noSchool')} body={t('h.noSchoolSub', { d: d.day(TOMORROW) })} /></div>
}

const WIDGET: Record<WidgetId, () => React.JSX.Element | null> = {
  brief: () => null, quick: Quick, tonight: Tonight, exam: NextExam, subjects: Subjects, school: SchoolBento, badges: Badges, diary: Diary, extras: Extras,
}

function Tonight() {
  const { t } = useI18n()
  const items = useTonight()
  const done = useApp((s) => s.done)
  const { mins } = useI18n()
  const left = items.filter((i) => !done[i.id])
  return (
    <Section title={t('h.tonight')} aside={left.length ? t('h.tasksLeft', { n: left.length, t: mins(left.reduce((a, i) => a + i.mins, 0)) }) : t('h.allDone')}>
      {items.length ? <TonightList /> : <EmptyState title={t('h.caughtUp')} body={t('h.caughtUpSub')} />}
    </Section>
  )
}

export function Home() {
  const { t } = useI18n()
  const { widgets, hidden } = useApp((s) => s.settings)
  const order = useMemo(() => widgets.filter((w) => !hidden.includes(w) && w !== 'brief'), [widgets, hidden])
  const showBrief = !hidden.includes('brief')
  return (
    <>
      {showBrief ? <Deck /> : <div className="pt-[calc(16px+env(safe-area-inset-top))]"><TopActions /></div>}
      {showBrief && <Pass />}
      <NoSchoolToday />
      <div className="lg:columns-2 lg:gap-8 [&>*]:break-inside-avoid">
        {order.map((w) => {
          const W = WIDGET[w]
          return <W key={w} />
        })}
      </div>
      <div className="mt-10 flex justify-center">
        <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>{t('h.customise')}</Button>
      </div>
    </>
  )
}
