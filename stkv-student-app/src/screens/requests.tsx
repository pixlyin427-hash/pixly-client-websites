import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { Bus, CalendarOff, ChevronRight, FileBadge, IdCard, MessageSquareMore, Plus, Send } from 'lucide-react'
import { back, navigate } from '@/lib/router'
import { item, list } from '@/lib/motion'
import { TODAY, addDays, dayKey } from '@/lib/date'
import { useI18n, type Key } from '@/i18n'
import { toast, useApp, type Request } from '@/store'
import { REQ_TYPES, type ReqType } from '@/data/content'
import { Button, Chip, Header, Tile, type Tone } from '@/components/core'
import { Input, Options, Textarea } from '@/components/form'
import { Confirm, Sheet } from '@/components/overlay'
import { EmptyState } from '@/components/data'

const REQ_ICON: Record<ReqType, typeof Bus> = { leave: CalendarOff, bonafide: FileBadge, id: IdCard, transport: Bus, other: MessageSquareMore }
type Status = 'submitted' | 'review' | 'approved' | 'cancelled'
export function reqStatus(r: Request, now = Date.now()): Status {
  if (r.cancelled) return 'cancelled'
  const age = now - r.created
  return age < 60e3 ? 'submitted' : age < 180e3 ? 'review' : 'approved'
}
const STATUS: Record<Status, [Key, Tone]> = { submitted: ['rq.submitted', 'info'], review: ['rq.review', 'warning'], approved: ['rq.approved', 'success'], cancelled: ['rq.cancelled', 'muted'] }
const STEPS: Status[] = ['submitted', 'review', 'approved']

function useTick() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function Requests() {
  const { t, d } = useI18n()
  const requests = useApp((s) => s.requests)
  const update = useApp((s) => s.update)
  const now = useTick()
  const [open, setOpen] = useState<string>()
  const [cancel, setCancel] = useState(false)
  const r = requests.find((x) => x.id === open)
  const sorted = [...requests].sort((a, b) => b.created - a.created)
  return (
    <>
      <Header title={t('m.requests')} />
      <Button size="lg" block icon={Plus} className="mt-5" onClick={() => navigate('/requests/new')}>{t('rq.new')}</Button>
      <p className="mt-3 text-center text-xs text-ink-3">{t('rq.demo')}</p>
      <h2 className="eyebrow mt-6 mb-2.5 text-ink-3">{t('rq.title')}</h2>
      {sorted.length ? (
        <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-2.5">
          {sorted.map((x) => {
            const st = reqStatus(x, now)
            return (
              <motion.button key={x.id} variants={item} whileTap={{ scale: 0.98 }} onClick={() => setOpen(x.id)} className="flex items-center gap-3 rounded-[22px] bg-surface p-3.5 text-left shadow-e1">
                <Tile icon={REQ_ICON[x.type]} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{t(`rq.t.${x.type}` as Key)}</span>
                  <span className="block truncate text-[12.5px] text-ink-3">{t('rq.ref', { id: x.id.toUpperCase() })} · {d.dm(new Date(x.created))}</span>
                </span>
                <motion.span key={st} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Chip tone={STATUS[st][1]} dot>{t(STATUS[st][0])}</Chip></motion.span>
                <ChevronRight className="size-4 shrink-0 text-ink-3" />
              </motion.button>
            )
          })}
        </motion.div>
      ) : <EmptyState title={t('rq.empty')} />}
      <Sheet open={!!r} onClose={() => setOpen(undefined)} title={r ? t(`rq.t.${r.type}` as Key) : ''} description={r ? t('rq.ref', { id: r.id.toUpperCase() }) : undefined}>
        {r && (() => {
          const st = reqStatus(r, now)
          const at = st === 'cancelled' ? -1 : STEPS.indexOf(st)
          return (
            <>
              {(r.from || r.note) && <p className="mb-4 rounded-2xl bg-bg p-3.5 text-sm text-ink-2">{r.from && `${r.from}${r.to && r.to !== r.from ? ` → ${r.to}` : ''} · `}{r.note}</p>}
              <ol className="flex flex-col gap-4 pl-1">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex items-center gap-3">
                    <motion.span initial={false} animate={{ scale: i === at ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.4 }} className={clsx('grid size-7 place-items-center rounded-full text-xs font-bold', i <= at ? 'bg-teal text-white' : 'bg-muted text-ink-3')}>{i + 1}</motion.span>
                    <span className={clsx('text-[15px]', i <= at ? 'font-semibold' : 'text-ink-3')}>{t(STATUS[s][0])}</span>
                  </li>
                ))}
              </ol>
              {st === 'cancelled' && <Chip tone="muted" className="mt-4">{t('rq.cancelled')}</Chip>}
              {(st === 'submitted' || st === 'review') && <Button size="lg" block variant="danger" className="mt-6" onClick={() => setCancel(true)}>{t('rq.cancel')}</Button>}
            </>
          )
        })()}
      </Sheet>
      <Confirm open={cancel} onClose={() => setCancel(false)} title={t('rq.cancel')} body={r ? t(`rq.t.${r.type}` as Key) : ''} confirm={t('rq.cancel')} danger onConfirm={() => { update((s) => ({ requests: s.requests.map((x) => (x.id === open ? { ...x, cancelled: true } : x)) })); setCancel(false); setOpen(undefined); toast(t('rq.cancelToast'), 'info') }} />
    </>
  )
}

export function NewRequest() {
  const { t } = useI18n()
  const preset = useApp((s) => s.tabs.reqType) as ReqType | undefined
  const update = useApp((s) => s.update)
  const [type, setType] = useState<ReqType>(preset && REQ_TYPES.includes(preset) ? preset : 'leave')
  const [from, setFrom] = useState(dayKey(addDays(TODAY, 1)))
  const [to, setTo] = useState(dayKey(addDays(TODAY, 1)))
  const [note, setNote] = useState('')
  const [err, setErr] = useState<{ note?: string; date?: string }>({})
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')
  const dated = type === 'leave' || type === 'transport'
  useEffect(() => () => { useApp.getState().update((s) => { const x = { ...s.tabs }; delete x.reqType; return { tabs: x } }) }, [])
  const submit = () => {
    const e = { note: note.trim().length < 5 ? t('rq.reasonErr') : undefined, date: dated && to < from ? t('rq.dateErr') : undefined }
    setErr(e)
    if (e.note || e.date) return
    const id = `rq-${String(Date.now()).slice(-4)}`
    setState('loading')
    setTimeout(() => {
      update((s) => ({ requests: [...s.requests, { id, type, note: note.trim(), from: dated ? from : undefined, to: dated ? to : undefined, created: Date.now() }] }))
      setState('success')
      toast(t('rq.sentToast', { id: id.toUpperCase() }))
    }, 800)
    setTimeout(() => back('/requests'), 1500)
  }
  return (
    <>
      <Header title={t('rq.new')} />
      <div className="mt-5 flex flex-col gap-5">
        <Options label={t('rq.type')} value={type} onChange={setType} options={REQ_TYPES.map((r) => ({ id: r, label: t(`rq.t.${r}` as Key), icon: REQ_ICON[r] }))} />
        {dated && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-3">
            <Input label={t('rq.from')} type="date" value={from} min={dayKey(TODAY)} onChange={(e) => setFrom(e.target.value)} />
            <Input label={t('rq.to')} type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} error={err.date} />
          </motion.div>
        )}
        <Textarea label={t('rq.reason')} value={note} onChange={(e) => setNote(e.target.value)} error={err.note} />
        <Button size="lg" block icon={Send} state={state} onClick={submit}>{state === 'idle' && t('c.submit')}</Button>
      </div>
    </>
  )
}
