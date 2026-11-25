import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, Flag, ShieldAlert } from 'lucide-react'
import { item, list, spring } from '@/lib/motion'
import { TODAY, addDays, dayKey, isSchoolDay, nowMinutes, sameDay, HOLIDAYS } from '@/lib/date'
import { useI18n } from '@/i18n'
import { toast, useApp } from '@/store'
import { CHANGE_INFO, SUBJECTS, TOMORROW, periodsFor, type Period } from '@/data/school'
import { EVENTS, EXAMS, HOMEWORK } from '@/data/content'
import { Card, Chip, Header, Tile } from '@/components/core'
import { Tabs } from '@/components/form'
import { Sheet } from '@/components/overlay'
import { EmptyState } from '@/components/data'

const short = (m: number) => `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')}`
const monday = addDays(TODAY, TODAY.getDay() === 0 ? 1 : -((TODAY.getDay() + 6) % 7))
const WEEK = Array.from({ length: 6 }, (_, i) => addDays(monday, i))

type Tab = 'day' | 'week' | 'month' | 'events'

function itemsOn(d: Date) {
  return {
    exams: EXAMS.filter((e) => sameDay(e.date, d)),
    due: HOMEWORK.filter((h) => sameDay(h.due, d) && !h.submitted),
    events: EVENTS.filter((e) => sameDay(e.date, d)),
    holiday: HOLIDAYS.has(dayKey(d)),
  }
}

export function Timetable() {
  const { t } = useI18n()
  const tab = (useApp((s) => s.tabs.timetable) as Tab) ?? 'day'
  const update = useApp((s) => s.update)
  const setTab = (v: Tab) => update((s) => ({ tabs: { ...s.tabs, timetable: v } }))
  return (
    <>
      <Header title={t('m.timetable')} />
      <div className="mt-4">
        <Tabs label={t('m.timetable')} value={tab} onChange={setTab} options={[{ id: 'day', label: t('tt.day') }, { id: 'week', label: t('tt.week') }, { id: 'month', label: t('tt.month') }, { id: 'events', label: t('tt.events') }]} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {tab === 'day' && <DayView />}
          {tab === 'week' && <WeekView />}
          {tab === 'month' && <MonthView />}
          {tab === 'events' && <EventsView />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function DayView() {
  const { t, tx, d } = useI18n()
  const live = periodsFor(TODAY).some((p) => nowMinutes() < p.end)
  const [day, setDay] = useState(live || !isSchoolDay(TOMORROW) ? TODAY : TOMORROW)
  const [open, setOpen] = useState<Period>()
  const periods = periodsFor(day)
  const now = nowMinutes()
  const isToday = sameDay(day, TODAY)
  return (
    <>
      <div className="mt-5 grid grid-cols-6 gap-1.5" role="radiogroup" aria-label={t('tt.day')}>
        {WEEK.map((x) => {
          const on = sameDay(x, day)
          const changed = sameDay(x, TOMORROW)
          return (
            <motion.button key={dayKey(x)} role="radio" aria-checked={on} whileTap={{ scale: 0.94 }} onClick={() => setDay(x)} className={clsx('relative flex h-[66px] flex-col items-center justify-center gap-0.5 rounded-[20px] font-mono text-[10px] tracking-[0.06em] uppercase', on ? 'text-[#a9b8d3]' : 'bg-surface text-ink-3 shadow-e1')}>
              {on && <motion.span layoutId="ttday" transition={spring.indicator} className="absolute inset-0 rounded-[20px] bg-navy shadow-[0_10px_20px_-10px_rgb(20_43_80/0.6)] dark:bg-royal" />}
              <span className="relative">{d.wd(x)}</span>
              <b className={clsx('relative font-sans text-[19px] font-bold tracking-[-0.04em] tabular-nums', on ? 'text-white' : 'text-ink')}>{x.getDate()}</b>
              {changed && <span className="absolute bottom-[7px] size-[5px] rounded-full bg-amber" aria-label={t('tt.changed')} />}
            </motion.button>
          )
        })}
      </div>
      <p className="mt-4 mb-2 text-sm font-semibold text-ink-2">{d.day(day)}</p>
      {!periods.length ? (
        <EmptyState title={t('tt.noSchool')} />
      ) : (
        <motion.div key={dayKey(day)} variants={list} initial="hidden" animate="show" className="flex flex-col gap-2">
          {periods.map((p) => {
            const isNow = isToday && now >= p.start && now < p.end
            const past = isToday && now >= p.end
            const S = SUBJECTS[p.subj]
            return (
              <div key={p.n}>
                {p.n === 4 && (
                  <motion.div variants={item} className="mb-2 grid grid-cols-[46px_1fr] gap-3">
                    <span className="pt-2 font-mono text-[11.5px] text-ink-3">9:30</span>
                    <div className="hatch flex h-[30px] items-center rounded-[14px] px-3.5 font-mono text-[10.5px] tracking-[0.08em] text-ink-3 uppercase [--hatch:var(--muted)]">{t('tt.recess')}</div>
                  </motion.div>
                )}
                <motion.div variants={item} className="grid grid-cols-[46px_1fr] gap-3">
                  <span className="pt-3.5 font-mono text-[11.5px] leading-[15px] text-ink-3 tabular-nums">{short(p.start)}<small className="block text-[10px] opacity-75">{short(p.end)}</small></span>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setOpen(p)}
                    className={clsx(
                      'flex min-h-[64px] min-w-0 items-center gap-3 rounded-[20px] px-3.5 py-3 text-left',
                      p.change === 'cancelled' ? 'border-[1.5px] border-dashed border-line-strong' : isNow ? 'bg-royal text-white shadow-[0_14px_28px_-14px_rgb(36_87_197/0.8)]' : 'bg-surface shadow-e1',
                      p.change && p.change !== 'cancelled' && 'shadow-[inset_0_0_0_1.5px_var(--color-amber),var(--e1)]',
                      past && 'opacity-55',
                    )}
                  >
                    {isNow ? <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-white/16"><S.icon className="size-5" strokeWidth={1.9} /></span> : <Tile icon={S.icon} />}
                    <span className="min-w-0 flex-1">
                      {p.change && <span className={clsx('eyebrow block', p.change === 'cancelled' ? 'text-ink-3' : 'text-amber-ink')}>{t(p.change === 'cancelled' ? 'tt.cancelled' : 'tt.changed')}</span>}
                      {isNow && <span className="eyebrow block text-ice">{t('h.now')}</span>}
                      <span className={clsx('block text-[15px] leading-[19px] font-semibold tracking-[-0.015em]', p.change === 'cancelled' && 'text-ink-3 line-through')}>{tx(S.name)}</span>
                      <span className={clsx('block text-[12.5px] leading-[17px]', isNow ? 'text-ice' : 'text-ink-3')}>{tx(S.teacher)} · {tx(S.room)}</span>
                    </span>
                    <ChevronRight className={clsx('size-4 shrink-0', isNow ? 'text-ice' : 'text-ink-3')} />
                  </motion.button>
                </motion.div>
              </div>
            )
          })}
        </motion.div>
      )}
      <Sheet open={!!open} onClose={() => setOpen(undefined)} title={open ? `${tx(SUBJECTS[open.subj].name)} · ${t('c.period', { n: open.n })}` : ''} description={open ? `${short(open.start)}–${short(open.end)}` : undefined}>
        {open && (
          <div className="flex flex-col gap-2.5">
            {open.change && <div className="rounded-2xl bg-amber-soft p-3.5 text-[14px] leading-5 text-ink">{tx(CHANGE_INFO[open.change])}</div>}
            {([['tt.teacher', SUBJECTS[open.subj].teacher], ['tt.room', SUBJECTS[open.subj].room], ['tt.topic', SUBJECTS[open.subj].now]] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 rounded-2xl bg-bg px-3.5 py-3"><span className="text-[13px] text-ink-3">{t(k)}</span><span className="text-right text-[14px] font-semibold">{tx(v)}</span></div>
            ))}
          </div>
        )}
      </Sheet>
    </>
  )
}

function WeekView() {
  const { t, tx, d } = useI18n()
  const load = WEEK.map((x) => { const it = itemsOn(x); return { x, ...it, n: it.exams.length + it.due.length } })
  const heavy = load.reduce((a, b) => (b.n > a.n ? b : a), load[0])
  return (
    <>
      <p className="mt-5 text-sm text-ink-3">{t('tt.weekHint')}</p>
      {heavy.n >= 2 && (
        <div className="mt-3 flex gap-3 rounded-[20px] bg-info-soft p-3.5 text-[13.5px] leading-[19px]">
          <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-info text-white"><ShieldAlert className="size-4" strokeWidth={2.1} /></span>
          <span>{t('tt.clash', { d: d.wdLong(heavy.x), n: heavy.n })}</span>
        </div>
      )}
      <motion.div variants={list} initial="hidden" animate="show" className="mt-4 flex flex-col gap-2">
        {load.map(({ x, exams, due, events, holiday, n }) => (
          <motion.div key={dayKey(x)} variants={item} className={clsx('rounded-[22px] p-3.5', sameDay(x, TODAY) ? 'bg-surface shadow-[inset_0_0_0_1.5px_var(--border-strong),var(--e1)]' : 'bg-surface shadow-e1')}>
            <div className="flex items-center gap-3">
              <span className="w-11 shrink-0 text-center"><span className="eyebrow block text-ink-3">{d.wd(x)}</span><b className="text-[20px] font-bold tracking-[-0.04em]">{x.getDate()}</b></span>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <i key={i} className={clsx('h-1.5 flex-1 rounded-full', i < n ? (n >= 2 ? 'bg-amber' : 'bg-royal') : 'bg-muted')} />)}</span>
                <span className="text-[12.5px] font-semibold text-ink-2">{holiday ? t('tt.holiday') : n >= 2 ? t('tt.heavy') : n ? `${exams.length ? t('tt.tests', { n: exams.length }) : ''}${exams.length && due.length ? ' · ' : ''}${due.length ? t('tt.deadlines', { n: due.length }) : ''}` : t('tt.free')}</span>
              </span>
            </div>
            {(exams.length > 0 || due.length > 0 || events.length > 0) && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 pl-14">
                {exams.map((e) => <Chip key={e.id} tone="amber">{tx(e.title)}</Chip>)}
                {due.map((h) => <Chip key={h.id} tone="royal">{tx(SUBJECTS[h.subj].name)}</Chip>)}
                {events.map((e) => <Chip key={e.id} tone="coral">{tx(e.title)}</Chip>)}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </>
  )
}

function MonthView() {
  const { t, tx, d } = useI18n()
  const [month, setMonth] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
  const [sel, setSel] = useState(TODAY)
  const [dir, setDir] = useState(0)
  const lead = (month.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: lead + days }, (_, i) => (i < lead ? null : addDays(month, i - lead)))
  const shift = (n: number) => { setDir(n); setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)) }
  const it = itemsOn(sel)
  return (
    <>
      <Card className="mt-5 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => shift(-1)} aria-label={t('tt.prevMonth')} className="grid size-10 place-items-center rounded-full bg-muted"><ChevronLeft className="size-5" /></button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.b key={month.getMonth()} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-[15px] font-semibold">{d.month(month)}</motion.b>
          </AnimatePresence>
          <button onClick={() => shift(1)} aria-label={t('tt.nextMonth')} className="grid size-10 place-items-center rounded-full bg-muted"><ChevronRight className="size-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {Array.from({ length: 7 }, (_, i) => <span key={i} className="eyebrow pb-1 text-ink-3">{d.wd(addDays(monday, i)).slice(0, 2)}</span>)}
        </div>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div key={month.getMonth()} custom={dir} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -16 }} transition={{ duration: 0.22 }} className="grid grid-cols-7 gap-y-1 text-center" role="grid">
            {cells.map((c, i) => {
              if (!c) return <span key={i} />
              const x = itemsOn(c)
              const on = sameDay(c, sel)
              const off = !isSchoolDay(c)
              return (
                <button key={i} onClick={() => setSel(c)} aria-pressed={on} aria-label={d.day(c)} className="relative mx-auto flex size-11 flex-col items-center justify-center rounded-full">
                  {on && <motion.span layoutId="calsel" transition={spring.indicator} className="absolute inset-0 rounded-full bg-navy dark:bg-royal" />}
                  <span className={clsx('relative text-[14px] font-semibold tabular-nums', on ? 'text-white' : off ? 'text-ink-3' : sameDay(c, TODAY) ? 'text-link' : 'text-ink')}>{c.getDate()}</span>
                  <span className="relative mt-0.5 flex h-1 gap-0.5">
                    {x.exams.length > 0 && <i className="size-1 rounded-full bg-amber" />}
                    {x.events.length > 0 && <i className="size-1 rounded-full bg-coral" />}
                    {x.due.length > 0 && <i className="size-1 rounded-full bg-sky" />}
                  </span>
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 flex flex-wrap gap-3 border-t border-hair pt-3 text-[11.5px] font-medium text-ink-3">
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-amber" />{t('tt.exam')}</span>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-coral" />{t('tt.event')}</span>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-sky" />{t('tt.homeworkDue')}</span>
        </div>
      </Card>
      <p className="mt-5 mb-2 text-sm font-semibold text-ink-2">{d.day(sel)}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={dayKey(sel)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
          {it.holiday && <Chip tone="muted">{t('tt.holiday')}</Chip>}
          {it.exams.map((e) => <Card key={e.id} className="flex items-center gap-3 p-3"><Tile icon={SUBJECTS[e.subj].icon} tone="amber" /><span className="text-[14.5px] font-semibold">{tx(e.title)}</span></Card>)}
          {it.events.map((e) => <Card key={e.id} className="flex items-center gap-3 p-3"><Tile icon={Flag} tone="coral" /><span className="text-[14.5px] font-semibold">{tx(e.title)} · {d.time(e.date)}</span></Card>)}
          {it.due.map((h) => <Card key={h.id} className="flex items-center gap-3 p-3"><Tile icon={SUBJECTS[h.subj].icon} /><span className="text-[14.5px] font-semibold">{tx(h.title)}</span></Card>)}
          {!it.holiday && !it.exams.length && !it.events.length && !it.due.length && <p className="text-sm text-ink-3">{isSchoolDay(sel) ? t('tt.nothingOn') : t('tt.noSchool')}</p>}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function EventsView() {
  const { t, tx, d } = useI18n()
  const rsvp = useApp((s) => s.rsvp)
  const update = useApp((s) => s.update)
  return (
    <motion.div variants={list} initial="hidden" animate="show" className="mt-5 flex flex-col gap-2.5">
      {EVENTS.map((e) => {
        const going = !!rsvp[e.id]
        return (
          <motion.div key={e.id} variants={item} className="flex items-center gap-3 rounded-3xl bg-surface p-3 shadow-e1">
            <span className={clsx('flex h-[66px] w-[58px] shrink-0 flex-col items-center justify-center rounded-[17px]', e.kind === 'event' ? 'bg-coral-soft' : 'bg-ice')}>
              <span className={clsx('eyebrow', e.kind === 'event' ? 'text-coral-ink' : 'text-link')}>{d.wd(e.date)}</span>
              <b className="text-[26px] leading-7 font-bold tracking-[-0.05em]">{e.date.getDate()}</b>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] leading-[19px] font-semibold tracking-[-0.01em]">{tx(e.title)}</span>
              <span className="mt-0.5 block text-xs text-ink-3">{d.dm(e.date)} · {d.time(e.date)} · {tx(e.place)}</span>
              <span className="mt-0.5 block text-xs font-medium text-ink-2">{t('tt.going', { n: e.going + (going ? 1 : 0) })}</span>
            </span>
            {e.kind === 'event' && (
              <motion.button whileTap={{ scale: 0.94 }} aria-pressed={going} onClick={() => { update((s) => ({ rsvp: { ...s.rsvp, [e.id]: !going } })); if (!going) toast(t('tt.rsvpToast')) }} className={clsx('h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-200', going ? 'bg-coral text-navy' : 'bg-ice text-link')}>
                {going ? `✓ ${t('tt.rsvpd')}` : t('tt.rsvp')}
              </motion.button>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}
