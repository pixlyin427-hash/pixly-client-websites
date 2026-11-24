import { useEffect, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import clsx from 'clsx'
import { CircleAlert, Check, X } from 'lucide-react'
import { ease, spring } from '@/lib/motion'
import { useApp, useUI } from '@/store'
import { useI18n } from '@/i18n'
import { BADGES, HOUSES } from '@/data/content'
import { Button } from './core'
import { HexBadge } from './data'

const overlay = (
  <Dialog.Overlay asChild forceMount>
    <motion.div className="fixed inset-0 z-50 bg-[var(--scrim)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} />
  </Dialog.Overlay>
)

/** Bottom sheet: rises on a spring, drag the handle down to dismiss. */
export function Sheet({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode }) {
  const drag = useDragControls()
  const { t } = useI18n()
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {overlay}
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                drag="y"
                dragListener={false}
                dragControls={drag}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.05, bottom: 0.7 }}
                onDragEnd={(_, i) => (i.offset.y > 110 || i.velocity.y > 600) && onClose()}
                initial={{ y: '100%' }}
                animate={{ y: 0, transition: spring.sheet }}
                exit={{ y: '100%', transition: { duration: 0.24, ease: ease.exit } }}
                className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[520px] flex-col rounded-t-[32px] bg-raised text-ink shadow-e3 outline-none"
              >
                <div onPointerDown={(e) => drag.start(e)} className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing">
                  <span className="h-[5px] w-10 rounded-full bg-line-strong" />
                </div>
                <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
                  <Dialog.Title className="pr-10 text-[21px] leading-[26px] font-bold tracking-[-0.03em]">{title}</Dialog.Title>
                  {description && <p className="mt-1.5 text-[15px] leading-[22px] text-ink-2">{description}</p>}
                  <div className="mt-4">{children}</div>
                </div>
                <Dialog.Close className="absolute top-5 right-4 grid size-9 place-items-center rounded-full bg-muted text-ink-2" aria-label={t('c.close')}>
                  <X className="size-4" strokeWidth={2.2} />
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

/** Centred confirmation dialog. */
export function Confirm({ open, onClose, title, body, confirm, onConfirm, danger, icon }: { open: boolean; onClose: () => void; title: string; body: string; confirm: string; onConfirm: () => void; danger?: boolean; icon?: ReactNode }) {
  const { t } = useI18n()
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {overlay}
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, x: '-50%', y: '-46%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%', transition: spring.sheet }}
                exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-48%', transition: { duration: 0.16 } }}
                className="fixed top-1/2 left-1/2 z-50 w-[min(360px,calc(100%-40px))] rounded-[30px] bg-raised p-6 text-center text-ink shadow-e3 outline-none"
              >
                {icon && <div className="mb-3.5 flex justify-center">{icon}</div>}
                <Dialog.Title className="text-[21px] leading-[26px] font-bold tracking-[-0.03em]">{title}</Dialog.Title>
                <Dialog.Description className="mt-1.5 mb-5 text-[15px] leading-[22px] text-ink-2">{body}</Dialog.Description>
                <div className="flex flex-col gap-2">
                  <Button size="lg" block variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirm}</Button>
                  <Button size="lg" block variant="outline" onClick={onClose}>{t('c.cancel')}</Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

/** Toasts drop from the top on a spring. */
export function Toaster() {
  const toasts = useUI((s) => s.toasts)
  const { t } = useI18n()
  const dismiss = (id: number) => useUI.setState((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }))
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((x) => (
          <motion.div
            key={x.id}
            layout
            initial={{ opacity: 0, y: -28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: spring.sheet }}
            exit={{ opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.18 } }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, i) => i.offset.y < -24 && dismiss(x.id)}
            className="pointer-events-auto flex max-w-[min(440px,100%)] items-center gap-2.5 rounded-full bg-navy py-2 pr-2 pl-2 text-sm font-semibold text-[#f4f7fc] shadow-[0_18px_40px_-12px_rgb(10_23_48/0.6)] dark:bg-[#f4f7fc] dark:text-navy"
          >
            <span className={clsx('grid size-[26px] shrink-0 place-items-center rounded-full text-white', x.tone === 'bad' ? 'bg-error' : x.tone === 'info' ? 'bg-royal' : 'bg-teal')}>
              {x.tone === 'bad' ? <CircleAlert className="size-4" /> : <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1 py-1 pr-2">{x.text}</span>
            {x.undo && (
              <button onClick={() => { x.undo!(); dismiss(x.id) }} className="h-8 rounded-full bg-white/12 px-3 text-[13px] font-semibold dark:bg-navy/10">
                {t('c.undo')}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** Badge unlock: badge scales in on a celebratory spring with a single burst of particles. */
export function Celebration() {
  const queue = useUI((s) => s.celebrate)
  const reduce = useApp((s) => s.settings.motion === 'reduce')
  const { t, tx } = useI18n()
  const id = queue[0]
  const badge = BADGES.find((b) => b.id === id)
  const close = () => useUI.setState((s) => ({ celebrate: s.celebrate.slice(1) }))
  useEffect(() => {
    if (!id) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [id])
  const colors = ['#F0A52B', '#2457C5', '#62A5F5', '#F0A52B', '#14A38B']
  return (
    <AnimatePresence>
      {badge && (
        <motion.div key={badge.id} role="dialog" aria-modal="true" aria-label={t('ac.unlocked')} className="fixed inset-0 z-[80] grid place-items-center bg-[rgb(10_23_48/0.72)] px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <div className="relative flex flex-col items-center text-center text-white" onClick={(e) => e.stopPropagation()}>
            {!reduce &&
              Array.from({ length: 18 }, (_, i) => {
                const a = (i / 18) * Math.PI * 2
                const r = 120 + (i % 3) * 28
                return (
                  <motion.span
                    key={i}
                    className="absolute top-[70px] left-1/2 size-2.5 rounded-[3px]"
                    style={{ background: colors[i % colors.length] }}
                    initial={{ x: -5, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                    animate={{ x: Math.cos(a) * r - 5, y: Math.sin(a) * r, scale: [0, 1.2, 0.8], rotate: 180 + i * 20, opacity: [1, 1, 0] }}
                    transition={{ duration: 1.1, ease: ease.enter, delay: 0.15 }}
                  />
                )
              })}
            <motion.div initial={{ scale: 0.3, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={spring.celebrate}>
              <HexBadge id={badge.id} size={140} earned />
            </motion.div>
            <motion.p className="eyebrow mt-6 text-amber" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>{t('ac.unlocked')}</motion.p>
            <motion.h2 className="mt-2 text-[30px] font-bold tracking-[-0.04em]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.38 } }}>{tx(badge.name)}</motion.h2>
            <motion.p className="mt-1.5 max-w-[30ch] text-[15px] text-[#b8c6dd]" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.46 } }}>
              {tx(badge.how)} · {t('c.xp', { n: 50 })} · {t('ac.housePts', { h: tx(HOUSES[1].name) })}
            </motion.p>
            <motion.div className="mt-7 w-56" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.55 } }}>
              <Button size="lg" block onClick={close} autoFocus>{t('ac.awesome')}</Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
