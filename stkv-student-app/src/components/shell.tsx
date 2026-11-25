import { useEffect, useLayoutEffect, type ReactNode } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { GraduationCap, House, School, Trophy, UserRound, LayoutGrid } from 'lucide-react'
import { navigate, tabOf, useRoute, TABS } from '@/lib/router'
import { spring } from '@/lib/motion'
import { useI18n, type Key } from '@/i18n'
import { toast, useUI } from '@/store'
import { LIVE_NOTIF } from '@/data/content'
import { MODULES } from '@/screens/hubs'
import { Crest } from './brand'

const NAV: { to: (typeof TABS)[number]; icon: typeof House; label: Key }[] = [
  { to: '/', icon: House, label: 'nav.home' },
  { to: '/learn', icon: GraduationCap, label: 'nav.learn' },
  { to: '/school', icon: School, label: 'nav.school' },
  { to: '/achievements', icon: Trophy, label: 'nav.achievements' },
  { to: '/profile', icon: UserRound, label: 'nav.profile' },
]

function Dock({ active }: { active: string }) {
  const { t } = useI18n()
  return (
    <nav aria-label={t('nav.main')} className="fixed inset-x-3 max-[379px]:inset-x-2 bottom-[calc(10px+env(safe-area-inset-bottom))] z-40 md:hidden">
      <div className="mx-auto grid max-w-[480px] grid-cols-5 rounded-[30px] bg-dock p-1.5 max-[379px]:p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_18px_40px_-14px_rgb(20_43_80/0.65)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_var(--border-strong),0_18px_40px_-12px_rgb(0_0_0/0.6)]">
        {NAV.map(({ to, icon: Icon, label }) => {
          const on = active === to
          return (
            <motion.button key={to} whileTap={{ scale: 0.92 }} transition={spring.tap} onClick={() => navigate(to)} aria-current={on ? 'page' : undefined} className={clsx('relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-3xl text-[10px] leading-[13px] font-semibold tracking-[-0.01em] max-[379px]:tracking-[-0.025em] transition-colors duration-200', on ? 'text-white' : 'text-[#a9b8d3]')}>
              {on && <motion.span layoutId="dock" transition={spring.indicator} className="absolute inset-0 rounded-3xl bg-royal shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]" />}
              <motion.span className="relative" animate={{ y: on ? -1 : 0 }} transition={spring.indicator}><Icon className="size-[21px]" strokeWidth={on ? 2.1 : 1.8} /></motion.span>
              <span className="relative w-full truncate text-center">{t(label)}</span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}

function Side({ active, path }: { active: string; path: string }) {
  const { t } = useI18n()
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col gap-1 border-r border-line bg-surface px-2 pt-[calc(16px+env(safe-area-inset-top))] pb-4 md:flex xl:w-[264px] xl:px-4">
      <button onClick={() => navigate('/')} className="mb-5 flex items-center gap-3 px-2 xl:px-1" aria-label={t('app.name')}>
        <Crest className="size-11" />
        <span className="hidden text-left xl:block">
          <span className="block text-[15px] font-bold tracking-[-0.02em]">STKV</span>
          <span className="block text-[12px] leading-4 text-ink-3">{t('app.school')}</span>
        </span>
      </button>
      <nav aria-label={t('nav.main')} className="flex flex-col gap-1">
        {NAV.map(({ to, icon: Icon, label }) => {
          const on = active === to
          return (
            <motion.button key={to} whileTap={{ scale: 0.96 }} onClick={() => navigate(to)} aria-current={on ? 'page' : undefined} className={clsx('relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 text-[10px] font-semibold tracking-[-0.01em] xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-sm xl:tracking-normal', on ? 'text-link' : 'text-ink-2 hover:bg-muted/70')}>
              {on && <motion.span layoutId="side" transition={spring.indicator} className="absolute inset-0 rounded-2xl bg-ice" />}
              <Icon className="relative size-[22px] xl:size-5" strokeWidth={on ? 2.1 : 1.8} />
              <span className="relative max-w-full truncate">{t(label)}</span>
            </motion.button>
          )
        })}
      </nav>
      <div className="no-scrollbar mt-6 hidden min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto border-t border-line pt-4 xl:flex">
        <p className="eyebrow mb-2 px-3 text-ink-3">{t('nav.all')}</p>
        {MODULES.filter((m) => m.to !== '/').map((m) => (
          <button key={m.to} onClick={() => navigate(m.to)} className={clsx('flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-left text-[13px] font-medium', path.startsWith(m.to) ? 'bg-muted text-ink' : 'text-ink-2 hover:bg-muted/60')}>
            <m.icon className="size-4 shrink-0" strokeWidth={2} />
            <span className="truncate">{t(m.label)}</span>
          </button>
        ))}
      </div>
      <button onClick={() => navigate('/features')} className="mt-auto flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-ink-2 hover:bg-muted/70 xl:hidden">
        <LayoutGrid className="size-[22px]" strokeWidth={1.8} />
        {t('nav.all')}
      </button>
    </aside>
  )
}

const scrolls = new Map<string, number>()

/** Restores scroll on back, resets on push and tab switch. Mounted inside each page so it runs after the enter transition starts. */
export function ScrollRestore({ path, dir }: { path: string; dir: number }) {
  useLayoutEffect(() => {
    window.scrollTo(0, dir === -1 ? (scrolls.get(path) ?? 0) : 0)
    const save = () => scrolls.set(path, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [path, dir])
  return null
}

/** One simulated push notification per session, a few seconds after Home opens. */
function useLiveNotification(onHome: boolean) {
  const { tx } = useI18n()
  useEffect(() => {
    if (!onHome || useUI.getState().liveNotif) return
    const id = setTimeout(() => {
      useUI.setState((s) => ({ liveNotif: true, bell: s.bell + 1 }))
      try { sessionStorage.setItem('stkv-live', '1') } catch { /* private mode */ }
      toast(tx(LIVE_NOTIF.title), 'info')
    }, 6000)
    return () => clearTimeout(id)
  }, [onHome, tx])
}

export function Shell({ children }: { children: ReactNode }) {
  const { path } = useRoute()
  const active = tabOf(path)
  useLiveNotification(path === '/')
  return (
    <div className="min-h-dvh md:pl-[88px] xl:pl-[264px]">
      <Side active={active} path={path} />
      <main className="mx-auto w-full max-w-[1120px] px-5 pb-[calc(112px+env(safe-area-inset-bottom))] md:px-8 md:pb-14">{children}</main>
      <Dock active={active} />
    </div>
  )
}
