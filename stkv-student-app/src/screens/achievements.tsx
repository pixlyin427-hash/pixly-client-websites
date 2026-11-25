import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import clsx from 'clsx'
import { Award, Medal, ScrollText, Sparkles } from 'lucide-react'
import { item, list, spring, ease } from '@/lib/motion'
import { useI18n, type Key } from '@/i18n'
import { level, useApp, hwDoneCount, moodCount } from '@/store'
import { BADGES, LEAGUE_FEED, PASSPORT, HOUSES, type BadgeId } from '@/data/content'
import { LATEST, onTimeStreak } from '@/lib/derived'
import { Chip, Header, Tile } from '@/components/core'
import { Chips, Tabs } from '@/components/form'
import { Sheet } from '@/components/overlay'
import { CountUp, HexBadge } from '@/components/data'
import { Shield, useLeague } from './home'

type Tab = 'badges' | 'league' | 'passport'

function useBadgeProgress(): Record<BadgeId, [number, number]> {
  const s = useApp()
  return {
    'quiz-ace': [1, 1], 'perfect-week': [1, 1], bookworm: [10, 10],
    'homework-hero': [Math.min(3, hwDoneCount(s)), 3],
    packed: [s.earned.packed ? 1 : 0, 1],
    'early-bird': [Math.min(20, onTimeStreak()), 20],
    'recall-pro': [Math.min(10, s.recall.days), 10],
    'science-star': [LATEST.scores.sci, 90],
    'kind-voice': [Math.min(5, moodCount(s)), 5],
  }
}

export function Achievements() {
  const { t } = useI18n()
  const xp = useApp((s) => s.xp)
  const tab = (useApp((s) => s.tabs.achievements) as Tab) ?? 'badges'
  const update = useApp((s) => s.update)
  const lv = level(xp)
  return (
    <>
      <Header root title={t('nav.achievements')} />
      <div className="deck-dots mt-5 overflow-hidden rounded-3xl bg-deck p-5 text-[#f4f7fc]">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-amber text-navy"><Sparkles className="size-8" strokeWidth={1.9} /></span>
          <span className="min-w-0 flex-1">
            <span className="eyebrow text-[#a9b8d3]">{t('ac.level', { n: lv.level })}</span>
            <span className="block text-[30px] leading-9 font-bold tracking-[-0.05em]"><CountUp to={xp} /> <small className="text-base font-semibold text-[#a9b8d3]">XP</small></span>
          </span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/12">
          <motion.div className="h-full rounded-full bg-amber" initial={{ width: 0 }} animate={{ width: `${(lv.into / lv.need) * 100}%` }} transition={{ duration: 1, ease: ease.enter, delay: 0.2 }} />
        </div>
        <p className="mt-2 text-[12.5px] text-[#a9b8d3]">{t('ac.xpTo', { n: lv.need - lv.into, l: lv.level + 1 })}</p>
      </div>
      <div className="mt-5">
        <Tabs label={t('nav.achievements')} value={tab} onChange={(v) => update((s) => ({ tabs: { ...s.tabs, achievements: v } }))} options={[{ id: 'badges', label: t('ac.badges') }, { id: 'league', label: t('ac.league') }, { id: 'passport', label: t('ac.passport') }]} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {tab === 'badges' && <Badges />}
          {tab === 'league' && <League />}
          {tab === 'passport' && <Passport />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function Badges() {
  const { t, tx, d } = useI18n()
  const earned = useApp((s) => s.earned)
  const progress = useBadgeProgress()
  const [open, setOpen] = useState<BadgeId>()
  const b = BADGES.find((x) => x.id === open)
  return (
    <>
      <motion.div variants={list} initial="hidden" animate="show" className="mt-5 grid grid-cols-3 gap-2.5 md:grid-cols-5">
        {BADGES.map((x) => {
          const on = !!earned[x.id]
          const [a, n] = progress[x.id]
          return (
            <motion.button key={x.id} variants={item} whileTap={{ scale: 0.95 }} onClick={() => setOpen(x.id)} className="flex flex-col items-center gap-2 rounded-[22px] bg-surface px-2 py-4 text-center shadow-e1">
              <HexBadge id={x.id} earned={on} size={54} />
              <span className="text-[12.5px] leading-4 font-semibold">{tx(x.name)}</span>
              {on ? <span className="text-[11px] text-amber-ink">✓</span> : <span className="h-1 w-12 overflow-hidden rounded-full bg-muted"><motion.span className="block h-full bg-amber" initial={{ width: 0 }} animate={{ width: `${(a / n) * 100}%` }} transition={{ delay: 0.3, duration: 0.8, ease: ease.enter }} /></span>}
            </motion.button>
          )
        })}
      </motion.div>
      <Sheet open={!!b} onClose={() => setOpen(undefined)} title={b ? tx(b.name) : ''}>
        {b && (
          <div className="flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={spring.celebrate}><HexBadge id={b.id} earned={!!earned[b.id]} size={110} /></motion.div>
            <span className="eyebrow mt-5 text-ink-3">{t('ac.howTo')}</span>
            <p className="mt-1 text-[16px] font-semibold">{tx(b.how)}</p>
            {earned[b.id] ? <Chip tone="amber" className="mt-3">{t('ac.earned', { d: d.dm(new Date(earned[b.id]!)) })}</Chip> : <Chip tone="muted" className="mt-3">{t('ac.locked')} · {t('ac.progress', { a: progress[b.id][0], b: progress[b.id][1] })}</Chip>}
          </div>
        )}
      </Sheet>
    </>
  )
}

function League() {
  const { t, tx, d } = useI18n()
  const { houses, rank } = useLeague()
  const bonus = useApp((s) => s.housePts)
  const max = houses[0].points
  return (
    <>
      {bonus > 0 && rank === 1 && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl bg-amber-soft p-3 text-center text-sm font-semibold text-amber-ink">{t('ac.overtook', { n: 1 })}</motion.p>}
      <LayoutGroup>
        <div className="mt-5 flex flex-col gap-2">
          {houses.map((h, i) => {
            const mine = h.id === 'blue'
            return (
              <motion.div key={h.id} layout transition={spring.indicator} className={clsx('flex items-center gap-3 rounded-[22px] p-3', mine ? 'bg-amber-soft shadow-[inset_0_0_0_1.5px_var(--color-amber)]' : 'bg-surface shadow-e1')}>
                <span className="w-5 text-center font-mono text-sm font-semibold text-ink-3">{i + 1}</span>
                <Shield letter={tx(h.name)[0]} mine={mine} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><b className="text-[15px] font-semibold">{tx(h.name)}</b>{mine && <Chip tone="amber">{t('ac.you')}</Chip>}</span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted"><motion.span className={clsx('block h-full rounded-full', mine ? 'bg-amber' : 'bg-sky')} initial={{ width: 0 }} animate={{ width: `${(h.points / max) * 100}%` }} transition={{ duration: 0.9, ease: ease.enter, delay: 0.1 + i * 0.08 }} /></span>
                </span>
                <motion.b key={h.points} initial={{ scale: mine && bonus ? 1.3 : 1 }} animate={{ scale: 1 }} transition={spring.celebrate} className="w-12 text-right text-[15px] tabular-nums">{h.points}</motion.b>
              </motion.div>
            )
          })}
        </div>
      </LayoutGroup>
      <h2 className="eyebrow mt-7 mb-2.5 text-ink-3">{t('ac.feed')}</h2>
      <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-2">
        {LEAGUE_FEED.map((f, i) => (
          <motion.div key={i} variants={item} className="flex items-center gap-3 rounded-[20px] bg-surface p-3 shadow-e1">
            <Shield letter={tx(HOUSES.find((h) => h.id === f.house)!.name)[0]} mine={f.house === 'blue'} size={28} />
            <span className="min-w-0 flex-1 text-[13.5px] leading-[18px] font-medium">{tx(f.what)}<span className="block text-xs text-ink-3">{d.dm(f.date)}</span></span>
            <span className="font-mono text-[13px] font-semibold text-amber-ink">+{f.pts}</span>
          </motion.div>
        ))}
      </motion.div>
    </>
  )
}

const KIND: Record<string, [typeof Award, 'amber' | 'coral' | 'royal', Key]> = {
  award: [Medal, 'amber', 'ac.kind.award'], participation: [Award, 'coral', 'ac.kind.participation'], certificate: [ScrollText, 'royal', 'ac.kind.certificate'],
}

function Passport() {
  const { t, tx, d } = useI18n()
  const years = [...new Set(PASSPORT.map((p) => String(p.date.getFullYear())))]
  const [year, setYear] = useState<string>('all')
  const items = PASSPORT.filter((p) => year === 'all' || String(p.date.getFullYear()) === year)
  return (
    <>
      <p className="mt-5 text-sm text-ink-3">{t('ac.passportSub')}</p>
      <div className="mt-3"><Chips label={t('ac.passport')} value={year} onChange={setYear} options={[{ id: 'all', label: t('c.all') }, ...years.map((y) => ({ id: y, label: y }))]} /></div>
      <motion.ol key={year} variants={list} initial="hidden" animate="show" className="relative mt-5 flex flex-col gap-3 pl-6 before:absolute before:top-3 before:bottom-3 before:left-[9px] before:w-0.5 before:rounded before:bg-line">
        {items.map((p, i) => {
          const [Icon, tone, label] = KIND[p.kind]
          return (
            <motion.li key={i} variants={item} className="relative">
              <span className={clsx('absolute top-4 -left-6 size-[18px] rounded-full ring-4 ring-bg', tone === 'amber' ? 'bg-amber' : tone === 'coral' ? 'bg-coral' : 'bg-royal')} />
              <div className="flex items-center gap-3 rounded-[22px] bg-surface p-3.5 shadow-e1">
                <Tile icon={Icon} tone={tone} />
                <span className="min-w-0 flex-1"><span className="block text-[14.5px] leading-5 font-semibold">{tx(p.title)}</span><span className="text-xs text-ink-3">{t(label)} · {d.dmy(p.date)}</span></span>
              </div>
            </motion.li>
          )
        })}
      </motion.ol>
    </>
  )
}
