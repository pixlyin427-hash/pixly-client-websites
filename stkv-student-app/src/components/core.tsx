import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence, type HTMLMotionProps } from 'motion/react'
import clsx from 'clsx'
import { Bell, Check, ChevronLeft, Search, type LucideIcon } from 'lucide-react'
import { back, navigate } from '@/lib/router'
import { spring } from '@/lib/motion'
import { useI18n } from '@/i18n'
import { useUI } from '@/store'
import { useUnread } from '@/lib/derived'

export type Tone = 'royal' | 'teal' | 'amber' | 'purple' | 'coral' | 'muted' | 'success' | 'warning' | 'error' | 'info' | 'navy'

const TONE: Record<Tone, string> = {
  royal: 'bg-ice text-royal dark:text-sky',
  teal: 'bg-teal-soft text-teal-ink',
  amber: 'bg-amber-soft text-amber-ink',
  purple: 'bg-purple-soft text-purple-ink',
  coral: 'bg-coral-soft text-coral-ink',
  muted: 'bg-muted text-ink-2',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  error: 'bg-error-soft text-error-ink',
  info: 'bg-info-soft text-info-ink',
  navy: 'bg-navy text-white dark:bg-royal',
}

/* ---------------- Buttons ---------------- */
type BtnVariant = 'primary' | 'tonal' | 'outline' | 'ghost' | 'danger'
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-royal text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(20_43_80/0.18),0_6px_16px_-6px_rgb(36_87_197/0.55)] hover:bg-[#2a5fd0] active:bg-royal-press',
  tonal: 'bg-ice text-link',
  outline: 'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--border-strong)] active:bg-muted',
  ghost: 'text-link hover:bg-ice',
  danger: 'bg-error-soft text-error-ink',
}
const SIZE = { sm: 'h-9 px-3.5 text-[13.5px] gap-1.5', md: 'h-11 px-5 text-[15px] gap-2', lg: 'h-[54px] px-6 text-base gap-2' }

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: BtnVariant
  size?: keyof typeof SIZE
  block?: boolean
  icon?: LucideIcon
  state?: 'idle' | 'loading' | 'success'
  children?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', block, icon: Icon, state = 'idle', className, children, disabled, ...rest }: ButtonProps) {
  const busy = state !== 'idle'
  return (
    <motion.button
      whileTap={disabled || busy ? undefined : { scale: 0.96 }}
      transition={spring.tap}
      disabled={disabled}
      aria-busy={state === 'loading' || undefined}
      className={clsx(
        'relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors duration-200 select-none',
        SIZE[size], block && 'w-full',
        state === 'success' ? 'bg-teal-deep text-white' : BTN[variant],
        disabled && 'pointer-events-none opacity-45',
        className,
      )}
      {...rest}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {state === 'loading' ? (
          <motion.span key="l" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} />
        ) : state === 'success' ? (
          <motion.span key="s" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={spring.celebrate}><Check className="size-[18px]" strokeWidth={2.6} /></motion.span>
        ) : Icon ? (
          <motion.span key="i" className="flex" initial={false}><Icon className="size-[18px]" strokeWidth={2} /></motion.span>
        ) : null}
      </AnimatePresence>
      {children}
    </motion.button>
  )
}

export function IconButton({ icon: Icon, label, tone = 'surface', badge, className, ...rest }: Omit<HTMLMotionProps<'button'>, 'children'> & { icon: LucideIcon; label: string; tone?: 'surface' | 'muted' | 'deck'; badge?: number }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      transition={spring.tap}
      aria-label={badge ? `${label} (${badge})` : label}
      className={clsx(
        'relative grid size-11 shrink-0 place-items-center rounded-full',
        tone === 'surface' && 'bg-surface text-ink shadow-e1',
        tone === 'muted' && 'bg-muted text-ink',
        tone === 'deck' && 'size-10 bg-white/8 text-[#f4f7fc] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.11)] hover:bg-white/12',
        className,
      )}
      {...rest}
    >
      <Icon className="size-5" strokeWidth={1.9} />
      <AnimatePresence>
        {!!badge && (
          <motion.span
            key={badge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={spring.celebrate}
            className={clsx('absolute -top-1 -right-1 min-w-[18px] rounded-full bg-royal px-1 text-center font-mono text-[10px] leading-[18px] font-semibold text-white', tone === 'deck' ? 'ring-2 ring-deck' : 'ring-2 ring-surface')}
          >
            {badge}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

/* ---------------- Tiles, chips, cards ---------------- */
export function Tile({ icon: Icon, tone = 'royal', size = 36, className }: { icon: LucideIcon; tone?: Tone; size?: 28 | 36 | 44 | 56; className?: string }) {
  const box = { 28: 'size-7 rounded-[9px]', 36: 'size-9 rounded-[11px]', 44: 'size-11 rounded-[14px]', 56: 'size-14 rounded-full' }[size]
  const ic = { 28: 'size-4', 36: 'size-5', 44: 'size-[22px]', 56: 'size-6' }[size]
  return (
    <span className={clsx('grid shrink-0 place-items-center', box, TONE[tone], className)} aria-hidden>
      <Icon className={ic} strokeWidth={size === 28 ? 2.1 : 1.9} />
    </span>
  )
}

export function Chip({ tone = 'muted', dot, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap', TONE[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function Card({ className, children, ...rest }: HTMLMotionProps<'div'>) {
  return <motion.div className={clsx('rounded-3xl bg-surface shadow-e1', className)} {...rest}>{children}</motion.div>
}

export function Pressable({ className, children, ...rest }: HTMLMotionProps<'button'>) {
  return (
    <motion.button whileTap={{ scale: 0.975 }} transition={spring.tap} className={clsx('text-left', className)} {...rest}>
      {children}
    </motion.button>
  )
}

export function Section({ title, aside, action, children, className }: { title: string; aside?: ReactNode; action?: { label: string; to: string }; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('mt-9', className)}>
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <h2 className="text-[19px] leading-6 font-bold tracking-[-0.03em]">{title}</h2>
        {action ? (
          <button onClick={() => navigate(action.to)} className="flex min-h-11 items-center text-[13px] font-semibold text-link">{action.label}</button>
        ) : (
          aside && <span className="eyebrow text-ink-3">{aside}</span>
        )}
      </div>
      {children}
    </section>
  )
}

/* ---------------- Page header ---------------- */
export function TopActions({ deck }: { deck?: boolean }) {
  const { t } = useI18n()
  const unread = useUnread()
  const bell = useUI((s) => s.bell)
  return (
    <div className="flex items-center gap-2">
      <IconButton icon={Search} label={t('c.search')} tone={deck ? 'deck' : 'surface'} onClick={() => navigate('/search')} />
      <motion.div key={bell} animate={bell ? { rotate: [0, 14, -10, 8, -4, 0] } : undefined} transition={{ duration: 0.7 }}>
        <IconButton icon={Bell} label={t('nav.notifications')} tone={deck ? 'deck' : 'surface'} badge={unread} onClick={() => navigate('/notifications')} />
      </motion.div>
    </div>
  )
}

/** Screen header: compact bar that gains a title and background after scrolling, plus a large title in the content. */
export function Header({ title, sub, root, actions, eyebrow }: { title: string; sub?: ReactNode; root?: boolean; actions?: ReactNode; eyebrow?: string }) {
  const { t } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 56)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <>
      <div className={clsx('sticky top-0 z-30 -mx-5 flex h-[calc(60px+env(safe-area-inset-top))] items-end px-5 pb-2 pt-safe transition-colors duration-200 md:-mx-8 md:px-8', scrolled ? 'bg-bg/95 shadow-[0_1px_0_var(--hair)] backdrop-blur-md' : '')}>
        {!root && (
          <IconButton icon={ChevronLeft} label={t('c.back')} tone="muted" className="size-10 -ml-1" onClick={() => back()} />
        )}
        <motion.span
          animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : 6 }}
          className={clsx('min-w-0 flex-1 truncate text-[16px] font-semibold tracking-[-0.02em]', !root && 'px-3')}
          aria-hidden={!scrolled}
        >
          {title}
        </motion.span>
        <div className="flex shrink-0 items-center gap-2">{actions ?? (root && <TopActions />)}</div>
      </div>
      <div className="pt-2 pb-1">
        {eyebrow && <p className="eyebrow mb-1.5 text-ink-3">{eyebrow}</p>}
        <h1 className="text-[30px] leading-[34px] font-bold tracking-[-0.045em] text-balance">{title}</h1>
        {sub && <p className="mt-1.5 text-[14.5px] leading-5 text-ink-3">{sub}</p>}
      </div>
    </>
  )
}

/** Full-width list row used inside grouped cards. */
export function Row({ icon, tone, title, meta, end, onClick, className }: { icon?: LucideIcon; tone?: Tone; title: ReactNode; meta?: ReactNode; end?: ReactNode; onClick?: () => void; className?: string }) {
  const inner = (
    <>
      {icon && <Tile icon={icon} tone={tone} />}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-5 font-semibold tracking-[-0.012em]">{title}</span>
        {meta && <span className="mt-0.5 block text-[12.5px] leading-[17px] text-ink-3">{meta}</span>}
      </span>
      {end}
    </>
  )
  const cls = clsx('relative flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left', className)
  return onClick ? (
    <motion.button whileTap={{ scale: 0.98 }} transition={spring.tap} onClick={onClick} className={clsx(cls, 'min-h-14 hover:bg-muted/60')}>
      {inner}
    </motion.button>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

export function Group({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-3xl bg-surface p-1 shadow-e1 [&>*+*]:before:absolute [&>*+*]:before:inset-x-3 [&>*+*]:before:top-0 [&>*+*]:before:h-px [&>*+*]:before:bg-hair', className)}>{children}</div>
}
