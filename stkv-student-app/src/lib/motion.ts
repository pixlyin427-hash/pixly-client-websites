import type { Transition, Variants } from 'motion/react'

export const ease = {
  enter: [0.05, 0.7, 0.1, 1] as const,
  exit: [0.3, 0, 0.8, 0.15] as const,
}

export const spring = {
  tap: { type: 'spring', stiffness: 600, damping: 30 } satisfies Transition,
  indicator: { type: 'spring', stiffness: 500, damping: 38 } satisfies Transition,
  sheet: { type: 'spring', stiffness: 380, damping: 36 } satisfies Transition,
  celebrate: { type: 'spring', stiffness: 260, damping: 14 } satisfies Transition,
}

export const tap = { whileTap: { scale: 0.96 }, transition: spring.tap }

/** Page transitions: dir 1 = push, -1 = back, 0 = tab switch. */
export const page: Variants = {
  initial: (dir: number) => (dir === 0 ? { opacity: 0, y: 8 } : { opacity: 0, x: dir * 32 }),
  animate: { opacity: 1, x: 0, y: 0, transition: { duration: 0.32, ease: ease.enter } },
  exit: (dir: number) => ({ opacity: 0, x: dir === 0 ? 0 : dir * -16, transition: { duration: 0.16, ease: ease.exit } }),
}

export const list: Variants = { show: { transition: { staggerChildren: 0.04 } } }

export const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.36, ease: ease.enter } },
}
