import { motion } from 'motion/react'
import clsx from 'clsx'
import {
  Bus, CalendarDays, ChartLine, ChevronRight, ClipboardList, GraduationCap, HeartHandshake, House, IdCard,
  Library, MessagesSquare, NotebookPen, Target, Trophy, UserCheck, Wallet, type LucideIcon,
} from 'lucide-react'
import { navigate } from '@/lib/router'
import { item, list, spring } from '@/lib/motion'
import { useI18n, type Key } from '@/i18n'
import { useApp } from '@/store'
import { DIARY, EXAMS, FEES, HOMEWORK } from '@/data/content'
import { TOMORROW } from '@/data/school'
import { TODAY, daysBetween } from '@/lib/date'
import { LATEST, thisMonth } from '@/lib/derived'
import { avg } from '@/data/content'
import { Header, Tile, type Tone } from '@/components/core'
import { reqStatus } from './requests'

type Mod = { to: string; icon: LucideIcon; label: Key; desc: Key; tone: Tone; group: 'learn' | 'school' | 'you' }
export const MODULES: Mod[] = [
  { to: '/', icon: House, label: 'm.home', desc: 'md.home', tone: 'navy', group: 'you' },
  { to: '/timetable', icon: CalendarDays, label: 'm.timetable', desc: 'md.timetable', tone: 'royal', group: 'learn' },
  { to: '/classroom', icon: Library, label: 'm.classroom', desc: 'md.classroom', tone: 'royal', group: 'learn' },
  { to: '/homework', icon: NotebookPen, label: 'm.homework', desc: 'md.homework', tone: 'royal', group: 'learn' },
  { to: '/study', icon: Target, label: 'm.study', desc: 'md.study', tone: 'purple', group: 'learn' },
  { to: '/exams', icon: GraduationCap, label: 'm.exams', desc: 'md.exams', tone: 'royal', group: 'learn' },
  { to: '/progress', icon: ChartLine, label: 'm.progress', desc: 'md.progress', tone: 'royal', group: 'learn' },
  { to: '/attendance', icon: UserCheck, label: 'm.attendance', desc: 'md.attendance', tone: 'teal', group: 'school' },
  { to: '/messages', icon: MessagesSquare, label: 'm.messages', desc: 'md.messages', tone: 'royal', group: 'school' },
  { to: '/requests', icon: ClipboardList, label: 'm.requests', desc: 'md.requests', tone: 'royal', group: 'school' },
  { to: '/fees', icon: Wallet, label: 'm.fees', desc: 'md.fees', tone: 'royal', group: 'school' },
  { to: '/profile', icon: IdCard, label: 'm.profile', desc: 'md.profile', tone: 'royal', group: 'you' },
  { to: '/achievements', icon: Trophy, label: 'm.achievements', desc: 'md.achievements', tone: 'amber', group: 'you' },
  { to: '/wellbeing', icon: HeartHandshake, label: 'm.wellbeing', desc: 'md.wellbeing', tone: 'teal', group: 'school' },
  { to: '/ride', icon: Bus, label: 'm.ride', desc: 'md.ride', tone: 'royal', group: 'school' },
]
const mod = (to: string) => MODULES.find((m) => m.to === to)!

function ModuleCard({ m, stat, wide }: { m: Mod; stat: string; wide?: boolean }) {
  const { t } = useI18n()
  return (
    <motion.button
      variants={item}
      whileTap={{ scale: 0.975 }}
      transition={spring.tap}
      onClick={() => navigate(m.to)}
      className={clsx('flex min-h-[150px] flex-col justify-between gap-4 rounded-3xl bg-surface p-4 text-left shadow-e1 hover:shadow-e2', wide && 'col-span-2 min-h-0 flex-row items-center')}
    >
      <span className={clsx('flex items-start justify-between', wide && 'contents')}>
        <Tile icon={m.icon} tone={m.tone} size={44} />
        {!wide && <ChevronRight className="size-4 text-ink-3" />}
      </span>
      <span className={clsx('min-w-0', wide && 'flex-1')}>
        <span className="block text-[15px] leading-5 font-semibold tracking-[-0.015em] text-balance">{t(m.label)}</span>
        <span className={clsx('mt-1 block text-[12.5px] leading-[17px] font-medium', m.tone === 'teal' ? 'text-teal-ink' : m.tone === 'purple' ? 'text-purple-ink' : 'text-link')}>{stat}</span>
      </span>
      {wide && <ChevronRight className="size-4 shrink-0 text-ink-3" />}
    </motion.button>
  )
}

export function LearnHub() {
  const { t, tx } = useI18n()
  const done = useApp((s) => s.done)
  const submitted = useApp((s) => s.submitted)
  const recall = useApp((s) => s.recall)
  const dueTomorrow = HOMEWORK.filter((h) => h.due <= TOMORROW && !done[h.id] && !submitted[h.id] && !h.submitted).length
  const next = EXAMS[0]
  const days = daysBetween(TODAY, next.date)
  return (
    <>
      <Header root title={t('hub.learnTitle')} sub={t('hub.learnSub')} />
      <motion.div variants={list} initial="hidden" animate="show" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <ModuleCard m={mod('/timetable')} stat={t('h.timetableOf', { d: t('c.tomorrow') })} />
        <ModuleCard m={mod('/homework')} stat={`${t('hw.dueTomorrow')} · ${dueTomorrow}`} />
        <ModuleCard m={mod('/exams')} stat={`${tx(next.title)} · ${days <= 1 ? t('h.tomorrowShort') : t('h.inDays', { n: days })}`} />
        <ModuleCard m={mod('/study')} stat={t('st.streakDays', { n: recall.days })} />
        <ModuleCard m={mod('/progress')} stat={`${t('pr.termScore')} · ${avg(LATEST)}%`} />
        <ModuleCard m={mod('/classroom')} stat={t('cl.nowTeaching')} />
      </motion.div>
    </>
  )
}

export function SchoolHub() {
  const { t, money } = useI18n()
  const seen = useApp((s) => s.seen)
  const paid = useApp((s) => s.paid)
  const requests = useApp((s) => s.requests)
  const needs = DIARY.filter((d) => d.needsSeen && !seen[d.id]).length
  const due = FEES.filter((f) => !f.paidOn && !paid[f.id]).reduce((a, f) => a + f.amount, 0)
  const open = requests.filter((r) => !r.cancelled && reqStatus(r) !== 'approved').length
  return (
    <>
      <Header root title={t('hub.schoolTitle')} sub={t('hub.schoolSub')} />
      <motion.div variants={list} initial="hidden" animate="show" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <ModuleCard m={mod('/attendance')} stat={`${t('at.thisMonth')} · ${thisMonth().pct}%`} />
        <ModuleCard m={mod('/messages')} stat={needs ? t('h.needsYou', { n: needs }) : t('n.allRead')} />
        <ModuleCard m={mod('/requests')} stat={open ? `${t('rq.review')} · ${open}` : t('rq.title')} />
        <ModuleCard m={mod('/fees')} stat={due ? `${t('fe.totalDue')} · ${money(due)}` : t('fe.allPaid')} />
        <ModuleCard m={mod('/wellbeing')} stat={t('wb.checkin')} wide />
        <ModuleCard m={mod('/ride')} stat={t('rd.pilot')} wide />
      </motion.div>
    </>
  )
}

export function AllFeatures() {
  const { t } = useI18n()
  const groups: { id: Mod['group']; label: Key }[] = [{ id: 'learn', label: 'grp.learn' }, { id: 'school', label: 'grp.school' }, { id: 'you', label: 'grp.you' }]
  return (
    <>
      <Header title={t('hub.allTitle')} sub={t('hub.allSub')} />
      {groups.map((g) => (
        <section key={g.id} className="mt-7">
          <h2 className="eyebrow mb-3 text-ink-3">{t(g.label)}</h2>
          <motion.div variants={list} initial="hidden" animate="show" className="grid gap-2 md:grid-cols-2">
            {MODULES.filter((m) => m.group === g.id).map((m) => (
              <motion.button key={m.to} variants={item} whileTap={{ scale: 0.98 }} onClick={() => navigate(m.to)} className="flex min-h-16 items-center gap-3 rounded-[22px] bg-surface p-3 text-left shadow-e1 hover:shadow-e2">
                <Tile icon={m.icon} tone={m.tone} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold tracking-[-0.015em]">{t(m.label)}</span>
                  <span className="block text-[12.5px] leading-[17px] text-ink-3">{t(m.desc)}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-3" />
              </motion.button>
            ))}
          </motion.div>
        </section>
      ))}
    </>
  )
}
