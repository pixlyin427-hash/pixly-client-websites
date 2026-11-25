import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Target, TrendingUp } from 'lucide-react'
import { item, list } from '@/lib/motion'
import { TODAY, addDays, dayKey } from '@/lib/date'
import { useI18n } from '@/i18n'
import { useApp } from '@/store'
import { ACADEMIC, SUBJECTS } from '@/data/school'
import { CLASS_AVG, REPORTS, avg, grade } from '@/data/content'
import { CLASS_RANK, CLASS_SIZE, LATEST, PREVIOUS, seriesOf } from '@/lib/derived'
import { Card, Header, Section } from '@/components/core'
import { Tabs } from '@/components/form'
import { Sheet } from '@/components/overlay'
import { Columns, CountUp, Gauge, LineChart, Ring } from '@/components/data'

type Tab = 'overview' | 'subjects' | 'tests' | 'analytics'
type Acad = (typeof ACADEMIC)[number]

export function Progress() {
  const { t, tx } = useI18n()
  const tab = (useApp((s) => s.tabs.progress) as Tab) ?? 'overview'
  const update = useApp((s) => s.update)
  return (
    <>
      <Header title={t('m.progress')} sub={t('pr.updated', { t: tx(LATEST.title) })} />
      <div className="mt-4">
        <Tabs label={t('m.progress')} value={tab} onChange={(v) => update((s) => ({ tabs: { ...s.tabs, progress: v } }))} options={[{ id: 'overview', label: t('pr.overview') }, { id: 'subjects', label: t('pr.subjects') }, { id: 'tests', label: t('pr.tests') }, { id: 'analytics', label: t('pr.analytics') }]} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {tab === 'overview' && <Overview />}
          {tab === 'subjects' && <Subjects />}
          {tab === 'tests' && <Tests />}
          {tab === 'analytics' && <Analytics />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function Overview() {
  const { t, tx } = useI18n()
  const score = avg(LATEST)
  const change = score - avg(PREVIOUS)
  const classAvg = Math.round(Object.values(CLASS_AVG).reduce((a, b) => a + b, 0) / 6)
  const deltas = ACADEMIC.map((s) => ({ s, d: LATEST.scores[s] - PREVIOUS.scores[s] }))
  const best = deltas.reduce((a, b) => (b.d > a.d ? b : a))
  const weak = deltas.reduce((a, b) => (b.d < a.d ? b : a))
  return (
    <motion.div variants={list} initial="hidden" animate="show">
      <motion.div variants={item}>
        <Card className="mt-5 flex flex-col items-center gap-4 p-5">
          <Gauge value={score / 100}>
            <b className="block text-[30px] leading-[30px] font-bold tracking-[-0.05em]"><CountUp to={score} /><small className="text-[15px]">%</small></b>
            <span className="eyebrow text-ink-3">{t('ex.grade', { g: grade(score) })}</span>
          </Gauge>
          <div className="grid w-full grid-cols-3 gap-2 border-t border-hair pt-3.5 text-center">
            {[[t('pr.rank'), `${CLASS_RANK} / ${CLASS_SIZE}`, ''], [t('pr.change'), `${change >= 0 ? '+' : ''}${change}%`, change >= 0 ? 'text-teal-ink' : 'text-warning-ink'], [t('pr.classAvg'), `${classAvg}%`, '']].map(([l, v, c]) => (
              <span key={l} className="flex flex-col gap-0.5"><b className={`text-[16px] font-bold tracking-[-0.02em] ${c}`}>{v}</b><span className="text-[12px] leading-4 text-ink-3">{l}</span></span>
            ))}
          </div>
        </Card>
      </motion.div>
      <motion.div variants={item} className="mt-3 flex gap-3 rounded-[22px] bg-teal-soft p-3.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-teal text-white"><TrendingUp className="size-4" strokeWidth={2.2} /></span>
        <span><b className="block text-[14.5px] font-semibold">{t('pr.climb', { s: tx(SUBJECTS[best.s].name) })}</b><span className="text-[13px] leading-[18px] text-ink-2">{t('pr.climbSub', { n: best.d })}</span></span>
      </motion.div>
      <motion.div variants={item} className="mt-2.5 flex gap-3 rounded-[22px] bg-purple-soft p-3.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-purple text-white"><Target className="size-4" strokeWidth={2.2} /></span>
        <span><b className="block text-[14.5px] font-semibold">{t('pr.reviseNext', { s: tx(SUBJECTS[weak.s].name) })}</b><span className="text-[13px] leading-[18px] text-ink-2">{t('pr.reviseSub')}</span></span>
      </motion.div>
    </motion.div>
  )
}

function Subjects() {
  const { t, tx, d } = useI18n()
  const [open, setOpen] = useState<Acad>()
  return (
    <>
      <Card className="mt-5 p-4">
        <div className="mb-2 flex justify-between"><span className="eyebrow text-ink-3">{t('pr.termScore')}</span><span className="flex items-center gap-1.5 text-xs text-ink-3"><i className="h-3 w-0.5 rounded bg-ink-3/60" />{t('pr.avgMark')}</span></div>
        {ACADEMIC.map((s, k) => (
          <button key={s} onClick={() => setOpen(s)} className="grid w-full grid-cols-[minmax(72px,auto)_1fr_40px] items-center gap-3 rounded-xl py-2.5 text-left">
            <span className="truncate text-[13.5px] font-semibold">{tx(SUBJECTS[s].name)}</span>
            <span className="relative h-2.5 rounded-full bg-muted">
              <motion.i className="absolute inset-y-0 left-0 rounded-full bg-royal dark:bg-sky" initial={{ width: 0 }} animate={{ width: `${LATEST.scores[s]}%` }} transition={{ delay: 0.15 + k * 0.07, type: 'spring', stiffness: 120, damping: 20 }} />
              <i className="absolute -top-[3px] -bottom-[3px] w-0.5 rounded bg-ink-3/60" style={{ left: `${CLASS_AVG[s]}%` }} />
            </span>
            <span className="text-right font-mono text-[12px] font-semibold">{grade(LATEST.scores[s])}</span>
          </button>
        ))}
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(undefined)} title={open ? tx(SUBJECTS[open].name) : ''} description={open ? `${t('pr.termScore')} ${LATEST.scores[open]}% · ${t('pr.avgMark')} ${CLASS_AVG[open]}%` : undefined}>
        {open && <LineChart label={t('pr.history')} values={seriesOf(open)} labels={REPORTS.map((r) => d.monthShort(r.date))} min={60} max={100} />}
      </Sheet>
    </>
  )
}

function Tests() {
  const { t, tx, d } = useI18n()
  const overall = REPORTS.map(avg)
  return (
    <>
      <Card className="mt-5 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold tracking-[-0.01em]">{t('pr.byTest')}</span>
          <span className="rounded-full bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal-ink">▲ {t('pr.sinceStart', { n: overall[overall.length - 1] - overall[0] })}</span>
        </div>
        <LineChart label={t('pr.byTest')} values={overall} labels={REPORTS.map((r) => d.monthShort(r.date))} min={70} max={95} />
      </Card>
      <Section title={t('pr.history')}>
        <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-2">
          {[...REPORTS].reverse().map((r) => (
            <motion.div key={r.id} variants={item} className="flex items-center justify-between rounded-[20px] bg-surface p-3.5 shadow-e1"><span><b className="block text-[14.5px] font-semibold">{tx(r.title)}</b><span className="text-xs text-ink-3">{d.dmy(r.date)}</span></span><span className="text-[18px] font-bold tabular-nums">{avg(r)}%</span></motion.div>
          ))}
        </motion.div>
      </Section>
    </>
  )
}

function Analytics() {
  const { t, d } = useI18n()
  const sessions = useApp((s) => s.sessions)
  const recall = useApp((s) => s.recall)
  const days = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6))
  const seed = [40, 55, 30, 60, 45, 20, 0]
  const mins = days.map((x, i) => seed[i] + sessions.filter((s) => s.day === dayKey(x) && x <= TODAY).reduce((a, s) => a + s.mins, 0))
  const hwWeeks = [83, 100, 92, 75, 100, 88]
  const acc = recall.total ? recall.correct / recall.total : 0.8
  const onTime = Math.round(hwWeeks.reduce((a, b) => a + b, 0) / hwWeeks.length)
  return (
    <motion.div variants={list} initial="hidden" animate="show">
      <motion.div variants={item} className="mt-5 grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3 p-4"><Ring value={onTime / 100} size={56} color="var(--color-teal)"><span className="text-[13px] font-bold">{onTime}%</span></Ring><span className="text-[13px] leading-[17px] font-semibold">{t('pr.onTime')}</span></Card>
        <Card className="flex items-center gap-3 p-4"><Ring value={acc} size={56} color="var(--color-purple)"><span className="text-[13px] font-bold">{Math.round(acc * 100)}%</span></Ring><span className="text-[13px] leading-[17px] font-semibold">{t('pr.recallAcc')}</span></Card>
      </motion.div>
      <motion.div variants={item}>
        <Card className="mt-3 p-4">
          <span className="text-[15px] font-semibold">{t('pr.studyMins')}</span>
          <div className="mt-3"><Columns label={t('pr.studyMins')} values={mins} labels={days.map((x) => d.wd(x).slice(0, 2))} max={90} target={45} highlight={6} /></div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-2"><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-purple" />{t('pr.studied')}</span><span className="flex items-center gap-1.5"><i className="h-0.5 w-3 bg-sky" />{t('pr.target', { n: 45 })}</span></div>
        </Card>
      </motion.div>
      <motion.div variants={item}>
        <Card className="mt-3 p-4">
          <span className="text-[15px] font-semibold">{t('pr.hwWeeks')}</span>
          <div className="mt-3"><Columns label={t('pr.hwWeeks')} values={hwWeeks} labels={hwWeeks.map((_, i) => String(i + 1))} max={100} color="var(--color-teal)" /></div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
