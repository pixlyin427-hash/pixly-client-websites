import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { BookOpen, GraduationCap, Megaphone, NotebookPen, Search as SearchIcon, Trophy, Wallet, X, type LucideIcon } from 'lucide-react'
import { navigate } from '@/lib/router'
import { item, list, spring } from '@/lib/motion'
import { sameDay, TODAY } from '@/lib/date'
import { useI18n, type Key } from '@/i18n'
import { useApp } from '@/store'
import { BOOKS, EXAMS, HOMEWORK, NOTICES, type Notif } from '@/data/content'
import { ACADEMIC, SUBJECTS, type Txt } from '@/data/school'
import { useNotifs } from '@/lib/derived'
import { Button, Group, Header, IconButton, Row, type Tone } from '@/components/core'
import { EmptyState } from '@/components/data'
import { MODULES } from './hubs'

const KIND: Record<Notif['kind'], [LucideIcon, Tone]> = {
  diary: [NotebookPen, 'royal'], badge: [Trophy, 'amber'], notice: [Megaphone, 'royal'], homework: [NotebookPen, 'royal'], fee: [Wallet, 'royal'], exam: [GraduationCap, 'amber'],
}

export function Notifications() {
  const { t, tx, d } = useI18n()
  const notifs = useNotifs()
  const read = useApp((s) => s.read)
  const update = useApp((s) => s.update)
  const unread = notifs.filter((n) => !read[n.id]).length
  const open = (n: Notif) => {
    update((s) => ({ read: { ...s.read, [n.id]: true } }))
    navigate(n.to)
  }
  const groups = [
    { label: t('c.today'), items: notifs.filter((n) => sameDay(n.time, TODAY)) },
    { label: t('n.earlier'), items: notifs.filter((n) => !sameDay(n.time, TODAY)) },
  ].filter((g) => g.items.length)
  return (
    <>
      <Header title={t('n.title')} sub={unread ? t('n.unread', { n: unread }) : t('n.allRead')} actions={unread ? <Button size="sm" variant="tonal" onClick={() => update((s) => ({ read: { ...s.read, ...Object.fromEntries(notifs.map((n) => [n.id, true])) } }))}>{t('n.markAll')}</Button> : undefined} />
      {groups.map((g) => (
        <section key={g.label} className="mt-6">
          <h2 className="eyebrow mb-2.5 text-ink-3">{g.label}</h2>
          <Group>
            <AnimatePresence initial={false}>
              {g.items.map((n) => {
                const [Icon, tone] = KIND[n.kind]
                return (
                  <motion.div key={n.id} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="relative">
                    <Row
                      icon={Icon} tone={tone} onClick={() => open(n)}
                      title={<span className={clsx(!read[n.id] && 'text-ink', read[n.id] && 'font-medium text-ink-2')}>{tx(n.title)}</span>}
                      meta={`${tx(n.body)} · ${d.time(n.time)}`}
                      end={<AnimatePresence>{!read[n.id] && <motion.span exit={{ scale: 0 }} className="size-2 shrink-0 rounded-full bg-royal dark:bg-sky" aria-label={t('c.new')} />}</AnimatePresence>}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </Group>
        </section>
      ))}
      {!notifs.length && <div className="mt-6"><EmptyState title={t('n.empty')} /></div>}
    </>
  )
}

type Hit = { id: string; title: string; meta: string; to: string; icon: LucideIcon; tone: Tone; group: Key; tab?: [string, string] }

export function Search() {
  const { t, tx } = useI18n()
  const recent = useApp((s) => s.recent)
  const update = useApp((s) => s.update)
  const [q, setQ] = useState('')
  const index = useMemo(() => {
    const all = (x: Txt) => `${x.en} ${x.hi} ${x.mr}`
    const rows: (Hit & { hay: string })[] = [
      ...MODULES.map((m) => ({ id: m.to, title: t(m.label), meta: t(m.desc), to: m.to, icon: m.icon, tone: m.tone, group: 's.features' as Key, hay: `${t(m.label)} ${t(m.desc)}` })),
      ...HOMEWORK.map((h) => ({ id: h.id, title: tx(h.title), meta: tx(SUBJECTS[h.subj].name), to: `/homework/${h.id}`, icon: SUBJECTS[h.subj].icon, tone: 'royal' as Tone, group: 's.homework' as Key, hay: `${all(h.title)} ${all(SUBJECTS[h.subj].name)} ${all(h.desc)}` })),
      ...NOTICES.map((n) => ({ id: n.id, title: tx(n.title), meta: tx(n.body), to: `/messages/notice/${n.id}`, icon: Megaphone, tone: 'royal' as Tone, group: 's.notices' as Key, hay: `${all(n.title)} ${all(n.body)}` })),
      ...ACADEMIC.map((s) => ({ id: s, title: tx(SUBJECTS[s].name), meta: tx(SUBJECTS[s].now), to: `/classroom/${s}`, icon: SUBJECTS[s].icon, tone: 'royal' as Tone, group: 's.subjects' as Key, hay: `${all(SUBJECTS[s].name)} ${all(SUBJECTS[s].now)} ${all(SUBJECTS[s].teacher)}` })),
      ...EXAMS.map((e) => ({ id: e.id, title: tx(e.title), meta: e.portions.map(tx).join(' · '), to: `/exams/${e.id}`, icon: GraduationCap, tone: 'amber' as Tone, group: 's.exams' as Key, hay: `${all(e.title)} ${e.portions.map(all).join(' ')}` })),
      ...BOOKS.map((b) => ({ id: b.id, title: tx(b.title), meta: tx(b.author), to: '/classroom', icon: BookOpen, tone: 'royal' as Tone, group: 's.books' as Key, tab: ['classroom', 'library'] as [string, string], hay: `${all(b.title)} ${all(b.author)}` })),
    ]
    return rows.map((r) => ({ ...r, hay: r.hay.toLowerCase() }))
  }, [t, tx])
  const term = q.trim().toLowerCase()
  const hits = term ? index.filter((h) => h.hay.includes(term)) : []
  const groups = [...new Set(hits.map((h) => h.group))]
  const go = (h: Hit) => {
    update((s) => ({ recent: [q.trim(), ...s.recent.filter((r) => r !== q.trim())].slice(0, 5), ...(h.tab ? { tabs: { ...s.tabs, [h.tab[0]]: h.tab[1] } } : {}) }))
    navigate(h.to)
  }
  return (
    <>
      <Header title={t('c.search')} />
      <div className="sticky top-[calc(60px+env(safe-area-inset-top))] z-20 -mx-5 bg-bg px-5 pt-3 pb-3 md:-mx-8 md:px-8">
        <div className="relative flex items-center">
          <SearchIcon className="pointer-events-none absolute left-4 size-5 text-ink-3" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('s.placeholder')} aria-label={t('c.search')} className="h-[52px] w-full rounded-full bg-surface pr-12 pl-12 text-base shadow-e1 outline-none focus:shadow-[inset_0_0_0_2px_var(--color-royal),0_0_0_4px_rgb(36_87_197/0.14)]" />
          {q && <IconButton icon={X} label={t('s.clear')} tone="muted" className="absolute right-1.5 size-10" onClick={() => setQ('')} />}
        </div>
      </div>
      {!term && (
        <div className="mt-4">
          {recent.length > 0 && (
            <>
              <h2 className="eyebrow mb-2.5 text-ink-3">{t('s.recent')}</h2>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <motion.button key={r} whileTap={{ scale: 0.95 }} transition={spring.tap} onClick={() => setQ(r)} className="h-9 rounded-full bg-surface px-3.5 text-[13.5px] font-semibold text-ink-2 shadow-[inset_0_0_0_1px_var(--border)]">{r}</motion.button>
                ))}
              </div>
            </>
          )}
          <p className="mt-6 text-sm text-ink-3">{t('s.hint')}</p>
        </div>
      )}
      {term && !hits.length && (
        <div className="mt-6"><EmptyState title={t('s.noResults', { q: q.trim() })} action={<Button size="sm" variant="tonal" onClick={() => setQ('')}>{t('s.clear')}</Button>} /></div>
      )}
      <motion.div key={term} variants={list} initial="hidden" animate="show">
        {groups.map((g) => (
          <motion.section key={g} variants={item} className="mt-5">
            <h2 className="eyebrow mb-2.5 text-ink-3">{t(g)}</h2>
            <Group>
              {hits.filter((h) => h.group === g).slice(0, 6).map((h) => (
                <Row key={h.group + h.id} icon={h.icon} tone={h.tone} title={h.title} meta={<span className="line-clamp-1">{h.meta}</span>} onClick={() => go(h)} />
              ))}
            </Group>
          </motion.section>
        ))}
      </motion.div>
    </>
  )
}
