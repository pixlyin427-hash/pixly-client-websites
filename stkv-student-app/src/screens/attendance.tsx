import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { navigate } from '@/lib/router'
import { ease, spring } from '@/lib/motion'
import { TODAY, addDays, dayKey, isSchoolDay, nowMinutes, sameDay, HOLIDAYS } from '@/lib/date'
import { useI18n } from '@/i18n'
import { useApp } from '@/store'
import { periodsFor } from '@/data/school'
import { ABSENT_REASON, ACADEMIC_START, attendanceOn } from '@/data/content'
import { attendanceRange, monthOf, thisMonth, thisYear } from '@/lib/derived'
import { Button, Card, Header } from '@/components/core'
import { Tabs } from '@/components/form'
import { Sheet } from '@/components/overlay'
import { Columns, CountUp } from '@/components/data'

type Tab = 'calendar' | 'report'

function TodayConfirm() {
  const { t, d } = useI18n()
  const attSeen = useApp((s) => s.attSeen)
  const update = useApp((s) => s.update)
  const a = attendanceOn(TODAY)
  const marked = a && a.status !== 'A' && nowMinutes() >= 490
  const first = attSeen !== dayKey(TODAY)
  useEffect(() => {
    if (marked && first) update({ attSeen: dayKey(TODAY) })
  }, [marked, first, update])
  if (!isSchoolDay(TODAY)) return null
  return (
    <Card className="mt-5 flex items-center gap-4 p-4">
      <span className="relative grid size-14 shrink-0 place-items-center">
        {marked && first && <motion.span className="absolute inset-0 rounded-full bg-teal/25" initial={{ scale: 0.8, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 1, delay: 0.6 }} />}
        <svg viewBox="0 0 56 56" className="size-14 -rotate-90" aria-hidden>
          <circle cx="28" cy="28" r="24" fill="none" stroke="var(--muted)" strokeWidth="5" />
          <motion.circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-teal)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: first ? 0 : 1 }} animate={{ pathLength: marked ? 1 : 0.15 }} transition={{ duration: 0.8, ease: ease.enter }} />
        </svg>
        {marked && (
          <svg viewBox="0 0 24 24" className="absolute size-6 text-teal" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <motion.path d="M20 6 9 17l-5-5" initial={{ pathLength: first ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.35 }} />
          </svg>
        )}
      </span>
      <span>
        <b className="block text-[15px] font-semibold">{marked ? t('at.confirmed', { t: d.time(new Date(2000, 0, 1, 0, a!.arrive!)) }) : t('at.notYet')}</b>
        <span className="text-[12.5px] text-ink-3">{d.day(TODAY)}</span>
      </span>
    </Card>
  )
}

export function Attendance() {
  const { t } = useI18n()
  const tab = (useApp((s) => s.tabs.attendance) as Tab) ?? 'calendar'
  const update = useApp((s) => s.update)
  const m = thisMonth(), y = thisYear()
  return (
    <>
      <Header title={t('m.attendance')} />
      <TodayConfirm />
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[[t('at.thisMonth'), m.pct], [t('at.year'), y.pct], [t('h.late'), y.late]].map(([l, v], i) => (
          <Card key={l as string} className="p-3.5">
            <span className="eyebrow block text-ink-3">{l}</span>
            <span className={clsx('mt-1 block text-[26px] leading-8 font-bold tracking-[-0.05em]', i < 2 && 'text-teal-ink')}><CountUp to={v as number} />{i < 2 && <small className="text-sm">%</small>}</span>
          </Card>
        ))}
      </div>
      <div className="mt-5">
        <Tabs label={t('m.attendance')} value={tab} onChange={(v) => update((s) => ({ tabs: { ...s.tabs, attendance: v } }))} options={[{ id: 'calendar', label: t('at.calendar') }, { id: 'report', label: t('at.report') }]} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {tab === 'calendar' ? <AttCalendar /> : <Report />}
        </motion.div>
      </AnimatePresence>
      <Button size="lg" block variant="tonal" icon={CalendarPlus} className="mt-6" onClick={() => { update((s) => ({ tabs: { ...s.tabs, reqType: 'leave' } })); navigate('/requests/new') }}>{t('at.applyLeave')}</Button>
    </>
  )
}

function AttCalendar() {
  const { t, tx, d } = useI18n()
  const [month, setMonth] = useState(monthOf(TODAY))
  const [dir, setDir] = useState(0)
  const [sel, setSel] = useState<Date>()
  const first = monthOf(ACADEMIC_START)
  const lead = (month.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: lead + days }, (_, i) => (i < lead ? null : addDays(month, i - lead)))
  const shift = (n: number) => { setDir(n); setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)) }
  const stats = attendanceRange(month, new Date(month.getFullYear(), month.getMonth() + 1, 0))
  const a = sel ? attendanceOn(sel) : null
  return (
    <Card className="mt-5 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <button disabled={month <= first} onClick={() => shift(-1)} aria-label={t('tt.prevMonth')} className="grid size-10 place-items-center rounded-full bg-muted disabled:opacity-35"><ChevronLeft className="size-5" /></button>
        <span className="text-center"><b className="block text-[15px] font-semibold">{d.month(month)}</b><span className="text-xs text-teal-ink">{stats.total ? `${stats.pct}% · ${t('h.daysPresent', { a: stats.present, b: stats.total })}` : '—'}</span></span>
        <button disabled={month >= monthOf(TODAY)} onClick={() => shift(1)} aria-label={t('tt.nextMonth')} className="grid size-10 place-items-center rounded-full bg-muted disabled:opacity-35"><ChevronRight className="size-5" /></button>
      </div>
      <div className="grid grid-cols-7 text-center">{Array.from({ length: 7 }, (_, i) => <span key={i} className="eyebrow pb-1.5 text-ink-3">{d.wd(addDays(month, i - lead)).slice(0, 2)}</span>)}</div>
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div key={month.getMonth()} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -16 }} transition={{ duration: 0.22 }} className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) => {
            if (!c) return <span key={i} />
            const x = attendanceOn(c)
            const on = sel && sameDay(c, sel)
            return (
              <button key={i} onClick={() => setSel(c)} aria-label={`${d.day(c)}: ${x ? t(x.status === 'A' ? 'h.absent' : x.status === 'L' ? 'h.late' : 'h.present') : HOLIDAYS.has(dayKey(c)) ? t('at.holiday') : c > TODAY ? t('at.future') : t('at.weekend')}`}
                className={clsx('relative grid aspect-square place-items-center rounded-xl text-[13px] font-semibold tabular-nums transition-transform active:scale-90',
                  !x ? (c > TODAY ? 'text-ink-2' : 'bg-muted/60 text-ink-3') : x.status === 'A' ? 'text-error-ink shadow-[inset_0_0_0_1.5px_var(--color-error)]' : x.status === 'L' ? 'bg-teal-soft text-teal-ink' : 'bg-teal-deep text-white',
                  sameDay(c, TODAY) && 'ring-2 ring-navy ring-offset-2 ring-offset-surface dark:ring-sky')}>
                {on && <motion.span layoutId="attsel" transition={spring.indicator} className="absolute -inset-0.5 rounded-[14px] ring-2 ring-royal dark:ring-sky" />}
                {c.getDate()}
              </button>
            )
          })}
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 flex flex-wrap gap-3 border-t border-hair pt-3 text-[11.5px] font-medium text-ink-3">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-teal-deep" />{t('h.present')}</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-teal-soft shadow-[inset_0_0_0_1.5px_var(--color-teal)]" />{t('h.late')}</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] shadow-[inset_0_0_0_1.5px_var(--color-error)]" />{t('h.absent')}</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-muted" />{t('at.holiday')}</span>
      </div>
      <Sheet open={!!sel} onClose={() => setSel(undefined)} title={sel ? d.day(sel) : ''}>
        {sel && (
          <div className="flex flex-col gap-2">
            {[
              [t('at.status'), a ? t(a.status === 'A' ? 'h.absent' : a.status === 'L' ? 'h.late' : 'h.present') : HOLIDAYS.has(dayKey(sel)) ? t('at.holiday') : sel > TODAY ? t('at.future') : t('at.weekend')],
              ...(a && a.arrive ? [[t('at.arrivedLabel'), d.time(new Date(2000, 0, 1, 0, a.arrive))], [t('at.periods'), `${periodsFor(sel).length} / ${periodsFor(sel).length}`]] : []),
              ...(a?.status === 'A' ? [[t('at.absentNote'), tx(ABSENT_REASON)]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 rounded-2xl bg-bg px-3.5 py-3"><span className="text-[13px] text-ink-3">{k}</span><span className="text-right text-[14px] font-semibold">{v}</span></div>
            ))}
          </div>
        )}
      </Sheet>
    </Card>
  )
}

function Report() {
  const { t, d } = useI18n()
  const months: Date[] = []
  for (let m = monthOf(ACADEMIC_START); m <= TODAY; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) months.push(m)
  const rows = months.map((m) => ({ m, ...attendanceRange(m, new Date(m.getFullYear(), m.getMonth() + 1, 0)) }))
  return (
    <>
      <Card className="mt-5 p-4">
        <span className="text-[15px] font-semibold">{t('at.monthly')}</span>
        <div className="mt-3"><Columns label={t('at.monthly')} values={rows.map((r) => r.pct)} labels={rows.map((r) => d.monthShort(r.m))} max={100} color="var(--color-teal)" highlight={rows.length - 1} /></div>
      </Card>
      <Card className="mt-3 overflow-hidden">
        <table className="w-full text-[14px]">
          <thead><tr className="text-left text-xs text-ink-3"><th className="px-4 py-2.5 font-semibold">{t('at.month')}</th><th className="px-4 py-2.5 font-semibold">{t('at.days')}</th><th className="px-4 py-2.5 text-right font-semibold">{t('at.percent')}</th></tr></thead>
          <tbody>
            {[...rows].reverse().map((r) => (
              <tr key={r.m.getMonth()} className="border-t border-hair"><td className="px-4 py-3 font-semibold">{d.month(r.m)}</td><td className="px-4 py-3 tabular-nums">{r.present} / {r.total}</td><td className="px-4 py-3 text-right font-semibold text-teal-ink tabular-nums">{r.pct}%</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
