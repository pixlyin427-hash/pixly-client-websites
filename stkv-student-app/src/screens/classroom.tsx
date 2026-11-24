import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { BookOpen, ChevronRight, FileText, Frown, HandHelping, Headphones, Meh, Search as SearchIcon, Smile } from 'lucide-react'
import { navigate } from '@/lib/router'
import { item, list, spring } from '@/lib/motion'
import { TODAY, addDays, dayKey, daysBetween, prevSchoolDay } from '@/lib/date'
import { useI18n, type Key } from '@/i18n'
import { toast, useApp } from '@/store'
import { ACADEMIC, SUBJECTS, periodsFor, type SubjectId } from '@/data/school'
import { BOOKS, HOMEWORK } from '@/data/content'
import { Button, Card, Chip, Group, Header, Row, Section, Tile } from '@/components/core'
import { Tabs } from '@/components/form'
import { Sheet } from '@/components/overlay'
import { EmptyState } from '@/components/data'

type Tab = 'subjects' | 'library'

export function Classroom() {
  const { t } = useI18n()
  const tab = (useApp((s) => s.tabs.classroom) as Tab) ?? 'subjects'
  const update = useApp((s) => s.update)
  return (
    <>
      <Header title={t('m.classroom')} />
      <div className="mt-4">
        <Tabs label={t('m.classroom')} value={tab} onChange={(v) => update((s) => ({ tabs: { ...s.tabs, classroom: v } }))} options={[{ id: 'subjects', label: t('cl.subjects') }, { id: 'library', label: t('cl.library') }]} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {tab === 'subjects' ? <Subjects /> : <LibraryShelf />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function Subjects() {
  const { t, tx } = useI18n()
  const today = periodsFor(TODAY).filter((p) => SUBJECTS[p.subj].academic)
  return (
    <>
      <motion.div variants={list} initial="hidden" animate="show" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {ACADEMIC.map((s) => {
          const S = SUBJECTS[s]
          return (
            <motion.button key={s} variants={item} whileTap={{ scale: 0.975 }} transition={spring.tap} onClick={() => navigate(`/classroom/${s}`)} className="flex min-h-[156px] flex-col gap-3 rounded-3xl bg-surface p-4 text-left shadow-e1 hover:shadow-e2">
              <span className="flex items-start justify-between"><Tile icon={S.icon} size={44} /><Chip tone="muted" className="font-mono">{S.pages}</Chip></span>
              <span className="mt-auto">
                <span className="block text-[15px] font-semibold tracking-[-0.015em]">{tx(S.name)}</span>
                <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-[17px] text-ink-3">{tx(S.now)}</span>
              </span>
            </motion.button>
          )
        })}
      </motion.div>
      <Section title={t('cl.pulse')}>
        <p className="-mt-1.5 mb-3 text-[13px] text-ink-3">{t('cl.pulseSub')}</p>
        {today.length ? <Group>{today.map((p) => <PulseRow key={p.n} subj={p.subj} />)}</Group> : <EmptyState title={t('cl.noLessonToday')} />}
      </Section>
    </>
  )
}

const PULSE: { id: 'got' | 'partly' | 'lost'; icon: typeof Smile; label: Key; on: string }[] = [
  { id: 'got', icon: Smile, label: 'cl.got', on: 'bg-teal-deep text-white' },
  { id: 'partly', icon: Meh, label: 'cl.partly', on: 'bg-amber text-navy' },
  { id: 'lost', icon: Frown, label: 'cl.lost', on: 'bg-navy text-white dark:bg-royal' },
]

function PulseRow({ subj }: { subj: SubjectId }) {
  const { t, tx } = useI18n()
  const key = `${dayKey(TODAY)}:${subj}`
  const val = useApp((s) => s.pulse[key])
  const help = useApp((s) => s.help[key])
  const update = useApp((s) => s.update)
  const S = SUBJECTS[subj]
  return (
    <div className="relative flex flex-col gap-2.5 px-3 py-3">
      <div className="flex items-center gap-3">
        <Tile icon={S.icon} />
        <span className="min-w-0 flex-1 text-[14.5px] font-semibold">{tx(S.name)}<span className="block text-[12px] font-normal text-ink-3">{tx(S.now)}</span></span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-12" role="radiogroup" aria-label={`${t('cl.pulse')}: ${tx(S.name)}`}>
        {PULSE.map((p) => (
          <motion.button key={p.id} role="radio" aria-checked={val === p.id} whileTap={{ scale: 0.92 }} transition={spring.tap}
            onClick={() => { update((s) => ({ pulse: { ...s.pulse, [key]: p.id } })); if (!val) toast(t('cl.pulseToast', { t: tx(S.teacher) })) }}
            className={clsx('flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors duration-200', val === p.id ? p.on : 'bg-muted text-ink-2')}>
            <p.icon className="size-4" strokeWidth={2.1} />{t(p.label)}
          </motion.button>
        ))}
        {val === 'lost' && (
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileTap={{ scale: 0.92 }} aria-pressed={!!help}
            onClick={() => update((s) => ({ help: help ? Object.fromEntries(Object.entries(s.help).filter(([k]) => k !== key)) as Record<string, true> : { ...s.help, [key]: true } }))}
            className={clsx('flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold', help ? 'bg-teal-soft text-teal-ink' : 'bg-ice text-link')}>
            <HandHelping className="size-4" strokeWidth={2.1} />{t(help ? 'cl.helpAsked' : 'cl.askHelp')}
          </motion.button>
        )}
      </div>
    </div>
  )
}

const MATERIALS: { id: string; icon: typeof FileText; label: Key }[] = [
  { id: 'notes', icon: FileText, label: 'cl.mat1' },
  { id: 'sheet', icon: BookOpen, label: 'cl.mat2' },
  { id: 'audio', icon: Headphones, label: 'cl.mat3' },
]

export function SubjectPage({ params }: { params: Record<string, string> }) {
  const { t, tx, d } = useI18n()
  const id = params.id as SubjectId
  const read = useApp((s) => s.read)
  const update = useApp((s) => s.update)
  const [sheet, setSheet] = useState<string>()
  const S = SUBJECTS[id]
  if (!S) return <EmptyState title={t('c.empty')} />
  const recent = Array.from({ length: 12 }, (_, i) => prevSchoolDay(TODAY, i + 1)).filter((x) => periodsFor(x).some((p) => p.subj === id)).slice(0, 3)
  const hw = HOMEWORK.filter((h) => h.subj === id)
  const today = periodsFor(TODAY).some((p) => p.subj === id)
  const open = (k: string) => { update((s) => ({ read: { ...s.read, [`mat:${id}:${k}`]: true } })); setSheet(k) }
  return (
    <>
      <Header title={tx(S.name)} sub={tx(S.teacher)} />
      <div className="deck-dots rounded-3xl mt-5 overflow-hidden bg-deck p-5 text-[#f4f7fc]">
        <span className="eyebrow text-[#a9b8d3]">{t('cl.nowTeaching')}</span>
        <p className="mt-1.5 text-[22px] leading-7 font-bold tracking-[-0.03em]">{tx(S.now)}</p>
        <p className="mt-1 text-sm text-[#a9b8d3]">{t('cl.pages', { p: S.pages })}</p>
        <Button className="mt-4" variant="tonal" icon={BookOpen} onClick={() => setSheet('book')}>{t('cl.openPage')}</Button>
      </div>
      <Section title={t('cl.materials')}>
        <Group>
          {MATERIALS.map((m) => (
            <Row key={m.id} icon={m.icon} title={t(m.label)} meta={tx(S.now)} onClick={() => open(m.id)} end={read[`mat:${id}:${m.id}`] ? <Chip tone="teal">{t('cl.viewed')}</Chip> : <ChevronRight className="size-4 text-ink-3" />} />
          ))}
        </Group>
      </Section>
      {today && S.academic && <Section title={t('cl.pulse')}><Group><PulseRow subj={id} /></Group></Section>}
      <Section title={t('cl.classwork')}>
        <Group>
          {recent.map((x) => <Row key={dayKey(x)} title={d.short(x)} meta={tx(S.now)} />)}
        </Group>
      </Section>
      {hw.length > 0 && (
        <Section title={t('hw.homework')}>
          <Group>{hw.map((h) => <Row key={h.id} icon={S.icon} title={tx(h.title)} meta={t('c.due', { d: d.dm(h.due) })} onClick={() => navigate(`/homework/${h.id}`)} end={<ChevronRight className="size-4 text-ink-3" />} />)}</Group>
        </Section>
      )}
      <Sheet open={!!sheet} onClose={() => setSheet(undefined)} title={sheet === 'book' ? `${tx(S.name)} · ${t('cl.pages', { p: S.pages })}` : sheet ? t(MATERIALS.find((m) => m.id === sheet)!.label) : ''} description={tx(S.now)}>
        <p className="rounded-2xl bg-bg p-4 text-sm text-ink-2">{t('cl.textbookNote')}</p>
        <Button size="lg" block className="mt-4" onClick={() => setSheet(undefined)}>{t('c.done')}</Button>
      </Sheet>
    </>
  )
}

function LibraryShelf() {
  const { t, tx, d } = useI18n()
  const renewed = useApp((s) => s.renewed)
  const reserved = useApp((s) => s.reserved)
  const update = useApp((s) => s.update)
  const [q, setQ] = useState('')
  const borrowed = BOOKS.filter((b) => b.due)
  const term = q.trim().toLowerCase()
  const catalogue = BOOKS.filter((b) => !b.due && (!term || `${b.title.en} ${b.title.hi} ${b.author.en} ${b.author.hi} ${b.author.mr}`.toLowerCase().includes(term)))
  return (
    <>
      <Section title={t('cl.borrowed')}>
        <div className="grid gap-2.5 md:grid-cols-2">
          {borrowed.map((b) => {
            const due = renewed[b.id] ? addDays(b.due!, 7) : b.due!
            const n = daysBetween(TODAY, due)
            return (
              <Card key={b.id} className="flex items-center gap-3 p-3.5">
                <span className="grid h-16 w-12 shrink-0 place-items-center rounded-lg bg-navy text-[#f4f7fc] shadow-[inset_-4px_0_0_rgb(255_255_255/0.12)]"><BookOpen className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{tx(b.title)}</span>
                  <span className="block truncate text-[12.5px] text-ink-3">{tx(b.author)}</span>
                  <span className={clsx('mt-1 block text-[12.5px] font-semibold', n <= 2 ? 'text-amber-ink' : 'text-ink-2')}>{n <= 1 ? t('cl.dueTomorrow') : t('cl.dueIn', { n })} · {d.dm(due)}</span>
                </span>
                <Button size="sm" variant={renewed[b.id] ? 'tonal' : 'outline'} disabled={!!renewed[b.id]} onClick={() => { update((s) => ({ renewed: { ...s.renewed, [b.id]: true } })); toast(t('cl.renewToast')) }}>{t(renewed[b.id] ? 'cl.renewed' : 'cl.renew')}</Button>
              </Card>
            )
          })}
        </div>
      </Section>
      <Section title={t('cl.catalogue')}>
        <div className="relative mb-3 flex items-center">
          <SearchIcon className="pointer-events-none absolute left-4 size-5 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('cl.searchBooks')} aria-label={t('cl.searchBooks')} className="h-12 w-full rounded-full bg-surface pl-12 text-[15px] shadow-e1 outline-none focus:shadow-[inset_0_0_0_2px_var(--color-royal)]" />
        </div>
        {catalogue.length ? (
          <motion.div layout className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {catalogue.map((b) => {
                const res = !!reserved[b.id]
                return (
                  <motion.div key={b.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="flex items-center gap-3 rounded-[22px] bg-surface p-3 shadow-e1">
                    <Tile icon={BookOpen} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-semibold">{tx(b.title)}</span>
                      <span className="block truncate text-[12.5px] text-ink-3">{tx(b.author)} · <span className={b.onLoan ? 'text-amber-ink' : 'text-teal-ink'}>{t(b.onLoan ? 'cl.onLoan' : 'cl.available')}</span></span>
                    </span>
                    <Button size="sm" variant={res ? 'tonal' : 'outline'} aria-pressed={res} onClick={() => { update((s) => { const r = { ...s.reserved }; if (res) delete r[b.id]; else r[b.id] = true; return { reserved: r } }); toast(t(res ? 'cl.cancelReserve' : 'cl.reserveToast'), res ? 'info' : 'ok') }}>
                      {t(res ? 'cl.reserved' : 'cl.reserve')}
                    </Button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <EmptyState title={t('cl.noBooks', { q: q.trim() })} action={<Button size="sm" variant="tonal" onClick={() => setQ('')}>{t('s.clear')}</Button>} />
        )}
      </Section>
    </>
  )
}

