import { useState } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { ChevronRight, Receipt, ShieldCheck, Wallet } from 'lucide-react'
import { item, list } from '@/lib/motion'
import { TODAY, daysBetween } from '@/lib/date'
import { useI18n } from '@/i18n'
import { toast, useApp } from '@/store'
import { FEES, type Fee } from '@/data/content'
import { Button, Chip, Header, Section, Tile } from '@/components/core'
import { Sheet } from '@/components/overlay'
import { CountUp, EmptyState } from '@/components/data'

export function Fees() {
  const { t, tx, d, money } = useI18n()
  const paid = useApp((s) => s.paid)
  const profile = useApp((s) => s.profile)
  const update = useApp((s) => s.update)
  const [pay, setPay] = useState<Fee>()
  const [receipt, setReceipt] = useState<Fee>()
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')
  const pending = FEES.filter((f) => !f.paidOn && !paid[f.id])
  const done = FEES.filter((f) => f.paidOn || paid[f.id]).sort((a, b) => (paid[b.id]?.time ?? b.paidOn!.getTime()) - (paid[a.id]?.time ?? a.paidOn!.getTime()))
  const total = pending.reduce((a, f) => a + f.amount, 0)
  const confirmPay = () => {
    if (!pay) return
    setState('loading')
    setTimeout(() => {
      update((s) => ({ paid: { ...s.paid, [pay.id]: { time: Date.now(), receipt: `STKV/R/${String(Date.now()).slice(-4)}` } } }))
      setState('success')
      toast(t('fe.paidToast'))
    }, 1200)
    setTimeout(() => { const f = pay; setPay(undefined); setState('idle'); setReceipt(f) }, 2000)
  }
  const info = (f: Fee) => paid[f.id] ? { date: new Date(paid[f.id].time), no: paid[f.id].receipt } : { date: f.paidOn!, no: f.receipt! }
  return (
    <>
      <Header title={t('m.fees')} />
      <div className="deck-dots rounded-3xl mt-5 overflow-hidden bg-deck p-5 text-[#f4f7fc]">
        <span className="eyebrow text-[#a9b8d3]">{t('fe.totalDue')}</span>
        <p className="mt-1 text-[38px] leading-[42px] font-bold tracking-[-0.05em]"><CountUp to={total} format={money} /></p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#a9b8d3]"><ShieldCheck className="size-4" />{t('fe.demoNote')}</p>
      </div>
      <Section title={t('fe.pending')}>
        {pending.length ? (
          <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-2.5">
            {pending.map((f) => {
              const n = daysBetween(TODAY, f.due)
              return (
                <motion.div key={f.id} variants={item} layout className="flex items-center gap-3 rounded-[22px] bg-surface p-3.5 shadow-e1">
                  <Tile icon={Wallet} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{tx(f.title)}</span>
                    <span className={clsx('block text-[12.5px]', n <= 5 ? 'text-warning-ink' : 'text-ink-3')}>{n < 0 ? t('fe.overdue') : t('fe.dueOn', { d: d.dm(f.due) })}</span>
                  </span>
                  <span className="text-right"><b className="block text-[15px] tabular-nums">{money(f.amount)}</b></span>
                  <Button size="sm" onClick={() => setPay(f)}>{t('fe.pay')}</Button>
                </motion.div>
              )
            })}
          </motion.div>
        ) : <EmptyState title={t('fe.allPaid')} />}
      </Section>
      <Section title={t('fe.paid')}>
        <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-2">
          {done.map((f) => (
            <motion.button key={f.id} variants={item} layout whileTap={{ scale: 0.98 }} onClick={() => setReceipt(f)} className="flex items-center gap-3 rounded-[22px] bg-surface p-3.5 text-left shadow-e1">
              <Tile icon={Receipt} tone="success" />
              <span className="min-w-0 flex-1"><span className="block text-[14.5px] font-semibold">{tx(f.title)}</span><span className="text-xs text-ink-3">{d.dmy(info(f).date)}</span></span>
              <b className="text-[14.5px] tabular-nums">{money(f.amount)}</b>
              <ChevronRight className="size-4 text-ink-3" />
            </motion.button>
          ))}
        </motion.div>
      </Section>
      <Sheet open={!!pay} onClose={() => state === 'idle' && setPay(undefined)} title={pay ? tx(pay.title) : ''} description={t('fe.demoNote')}>
        {pay && (
          <>
            <div className="flex flex-col gap-2">
              {[[t('fe.student'), profile.name], [t('fe.amount'), money(pay.amount)], [t('fe.dueDate'), d.dmy(pay.due)]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 rounded-2xl bg-bg px-3.5 py-3"><span className="text-[13px] text-ink-3">{k}</span><span className="text-[14.5px] font-semibold">{v}</span></div>
              ))}
            </div>
            <Button size="lg" block className="mt-5" state={state} onClick={confirmPay}>{state === 'idle' && t('fe.payDemo', { a: money(pay.amount) })}</Button>
          </>
        )}
      </Sheet>
      <Sheet open={!!receipt} onClose={() => setReceipt(undefined)} title={t('fe.receipt')} description={receipt ? tx(receipt.title) : undefined}>
        {receipt && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border-[1.5px] border-dashed border-line-strong p-4">
            <div className="flex items-center justify-between"><b className="text-[15px]">{t('app.school')}</b><Chip tone="success" dot>{t('fe.paid')}</Chip></div>
            <div className="mt-4 flex flex-col gap-2.5 text-[14px]">
              {[[t('fe.receiptNo'), info(receipt).no], [t('fe.student'), `${profile.name} · ${profile.cls} ${profile.div}`], [t('fe.paidOn'), d.dmy(info(receipt).date)], [t('fe.amount'), money(receipt.amount)]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><span className="text-ink-3">{k}</span><span className="text-right font-semibold">{v}</span></div>
              ))}
            </div>
            <span className="barcode mt-5 block h-8 w-full text-ink opacity-60" aria-hidden />
          </motion.div>
        )}
      </Sheet>
    </>
  )
}
