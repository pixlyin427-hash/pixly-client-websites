import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'motion/react'
import clsx from 'clsx'
import { Backpack, BookOpen, Brain, CalendarCheck, FlaskConical, HeartHandshake, Lock, NotebookPen, Star, Sunrise } from 'lucide-react'
import type { BadgeId } from '@/data/content'
import { useApp } from '@/store'
import { ease } from '@/lib/motion'

function useReduce() {
  const os = useReducedMotion()
  const pref = useApp((s) => s.settings.motion)
  return pref === 'reduce' || (pref === 'system' && !!os)
}

const draw = { duration: 1, ease: ease.enter }

export function CountUp({ to, className, format }: { to: number; className?: string; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useInView(ref, { once: true })
  const reduce = useReduce()
  const [v, setV] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!seen) return
    if (reduce) return setV(to)
    const c = animate(0, to, { duration: 0.9, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [seen, to, reduce])
  return <span ref={ref} className={clsx('tabular-nums', className)}>{format ? format(v) : v}</span>
}

export function Ring({ value, size = 52, stroke = 6, color = 'var(--color-teal)', children, className }: { value: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode; className?: string }) {
  const r = (size - stroke) / 2
  return (
    <span className={clsx('relative inline-grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: Math.max(0.001, value) }} transition={draw} />
      </svg>
      {children && <span className="absolute inset-0 grid place-items-center">{children}</span>}
    </span>
  )
}

const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')

export function Spark({ values, w = 56, h = 24, min, max }: { values: number[]; w?: number; h?: number; min?: number; max?: number }) {
  const lo = min ?? Math.min(...values) - 2, hi = max ?? Math.max(...values) + 2
  const pts = values.map((v, i) => [2 + (i * (w - 4)) / (values.length - 1), h - 2 - ((v - lo) / (hi - lo)) * (h - 4)] as [number, number])
  const end = pts[pts.length - 1]
  return (
    <svg width={w} height={h} className="shrink-0 overflow-visible" aria-hidden>
      <motion.path d={path(pts)} fill="none" stroke="var(--color-sky)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={draw} />
      <circle cx={end[0]} cy={end[1]} r={3.5} className="fill-royal stroke-surface dark:fill-sky" strokeWidth={2} />
    </svg>
  )
}

export function LineChart({ values, labels, min, max, label }: { values: number[]; labels: string[]; min: number; max: number; label: string }) {
  const W = 320, H = 150, L = 30, R = 310, T = 14, B = 124
  const x = (i: number) => L + (i * (R - L)) / (values.length - 1)
  const y = (v: number) => B - ((v - min) / (max - min)) * (B - T)
  const pts = values.map((v, i) => [x(i), y(v)] as [number, number])
  const ticks = [min + (max - min) / 4, min + (max - min) / 2, min + ((max - min) * 3) / 4].map(Math.round)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={label}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={R} y1={y(v)} y2={y(v)} stroke="var(--hair)" />
          <text x={0} y={y(v) + 4} className="fill-ink-3 font-mono text-[10px]">{v}</text>
        </g>
      ))}
      <motion.path d={`${path(pts)} V${B} H${L}Z`} className="fill-royal/8 dark:fill-sky/12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.6 }} />
      <motion.path d={path(pts)} fill="none" className="stroke-royal dark:stroke-sky" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.3, ease: ease.enter }} />
      {pts.map(([px, py], i) => (
        <motion.circle key={i} cx={px} cy={py} r={i === pts.length - 1 ? 5.5 : 4} className="fill-surface stroke-royal dark:stroke-sky" strokeWidth={2.5} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.15, type: 'spring', stiffness: 400, damping: 18 }} />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 4} textAnchor="middle" className="fill-ink-3 font-mono text-[10px]">{l}</text>
      ))}
    </svg>
  )
}

export function Columns({ values, labels, max, color = 'var(--color-purple)', target, label, highlight }: { values: number[]; labels: string[]; max: number; color?: string; target?: number; label: string; highlight?: number }) {
  const W = 320, H = 150, L = 6, B = 122, T = 10
  const bw = Math.min(30, ((W - L * 2) / values.length) * 0.6)
  const gap = (W - L * 2) / values.length
  const y = (v: number) => B - (v / max) * (B - T)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={label}>
      <line x1={0} x2={W} y1={B} y2={B} stroke="var(--border)" />
      {values.map((v, i) => (
        <motion.rect
          key={i}
          x={L + i * gap + (gap - bw) / 2}
          width={bw}
          rx={7}
          fill={v === 0 ? 'var(--border-strong)' : color}
          opacity={highlight === undefined || highlight === i ? 1 : 0.55}
          initial={{ y: B, height: 0 }}
          whileInView={{ y: y(Math.max(v, max * 0.02)), height: B - y(Math.max(v, max * 0.02)) }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 200, damping: 24 }}
        />
      ))}
      {target !== undefined && <line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke="var(--color-sky)" strokeWidth={2} strokeDasharray="5 5" />}
      {labels.map((l, i) => (
        <text key={i} x={L + i * gap + gap / 2} y={H - 6} textAnchor="middle" className="fill-ink-3 font-mono text-[10px]">{l}</text>
      ))}
    </svg>
  )
}

export function Gauge({ value, children }: { value: number; children?: React.ReactNode }) {
  return (
    <div className="relative h-[92px] w-[150px]">
      <svg viewBox="0 0 150 92" className="h-[92px] w-[150px] overflow-visible" aria-hidden>
        <path d="M11 80a64 64 0 0 1 128 0" fill="none" stroke="var(--muted)" strokeWidth={12} strokeLinecap="round" />
        <motion.path d="M11 80a64 64 0 0 1 128 0" fill="none" className="stroke-royal dark:stroke-sky" strokeWidth={12} strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: value }} viewport={{ once: true }} transition={{ duration: 1.2, ease: ease.enter }} />
      </svg>
      <div className="absolute inset-x-0 bottom-0.5 text-center">{children}</div>
    </div>
  )
}

const BADGE_ICON: Record<BadgeId, typeof Star> = {
  'quiz-ace': Star, 'perfect-week': CalendarCheck, bookworm: BookOpen, 'homework-hero': NotebookPen, packed: Backpack,
  'early-bird': Sunrise, 'recall-pro': Brain, 'science-star': FlaskConical, 'kind-voice': HeartHandshake,
}

export function HexBadge({ id, size = 56, earned }: { id: BadgeId; size?: number; earned?: boolean }) {
  const Icon = BADGE_ICON[id]
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size * 1.11 }}>
      <svg viewBox="0 0 54 60" className="absolute inset-0 size-full" aria-hidden>
        <path d="M27 2.5 50.4 16v28L27 57.5 3.6 44V16z" fill={earned ? 'var(--color-amber)' : 'var(--muted)'} stroke={earned ? 'none' : 'var(--border-strong)'} strokeWidth={1.5} strokeLinejoin="round" />
        {earned && <path d="M27 8.5 45.2 19v22L27 51.5 8.8 41V19z" fill="none" stroke="rgb(20 43 80 / 0.18)" strokeWidth={1.2} />}
      </svg>
      <Icon className={clsx('relative', earned ? 'text-navy' : 'text-ink-3')} style={{ width: size * 0.38, height: size * 0.38 }} strokeWidth={2.2} />
      {!earned && (
        <span className="absolute -right-0.5 bottom-0 grid place-items-center rounded-full bg-surface p-1 shadow-e1">
          <Lock className="size-3 text-ink-3" strokeWidth={2.4} />
        </span>
      )}
    </span>
  )
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: ease.enter }} className="flex flex-col items-center gap-1.5 rounded-3xl bg-surface px-5 py-7 text-center shadow-e1">
      <svg viewBox="0 0 92 70" className="mb-2 h-[70px] w-[92px]" aria-hidden>
        <rect x="14" y="10" width="54" height="52" rx="12" fill="var(--ice)" />
        <rect x="24" y="4" width="54" height="52" rx="12" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
        <path d="M36 22h30M36 31h22M36 40h26" stroke="var(--border-strong)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="72" cy="52" r="13" fill="var(--color-teal)" />
        <path d="m66 52 4 4 8-8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[15px] font-semibold">{title}</p>
      {body && <p className="max-w-[32ch] text-[13px] text-ink-3">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}
