import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { Camera, Check, ChevronRight, CircleHelp, Clock, ImagePlus, Lock, Send, Trash2 } from 'lucide-react'
import { back, navigate } from '@/lib/router'
import { item, list, spring } from '@/lib/motion'
import { TODAY, addDays, dayKey, sameDay } from '@/lib/date'
import { useI18n } from '@/i18n'
import { toast, useApp } from '@/store'
import { SUBJECTS, TOMORROW, periodsFor, type SubjectId } from '@/data/school'
import { HOMEWORK, NOTEBOOK, type Homework as HW } from '@/data/content'
import { useTonight } from '@/lib/derived'
import { Button, Card, Chip, Group, Header, Row, Section, Tile } from '@/components/core'
import { Chips, PinPad, Tabs, Textarea } from '@/components/form'
import { Confirm, Sheet } from '@/components/overlay'
import { EmptyState, Ring } from '@/components/data'
import { TonightList } from './home'

type Tab = 'homework' | 'classwork' | 'notebook'
type Filter = 'tomorrow' | 'week' | 'done' | 'all'
const CHAT_FOR: Partial<Record<SubjectId, string>> = { mat: 'ch-desai', sci: 'ch-kulkarni' }

function useStatus() {
  const done = useApp((s) => s.done)
  const submitted = useApp((s) => s.submitted)
  return (h: HW) => (submitted[h.id] ? 'submitted' : done[h.id] ? 'done' : 'open') as 'submitted' | 'done' | 'open'
}

export function Homework() {
  const { t } = useI18n()
  const tab = (useApp((s) => s.tabs.homework) as Tab) ?? 'homework'
  const update = useApp((s) => s.update)
  const nb = NOTEBOOK.filter((n) => !n.complete).length
  const fixed = useApp((s) => s.nbFixed)
  return (
    <>
      <Header title={t('m.homework')} />
      <div className="mt-4">
        <Tabs label={t('m.homework')} value={tab} onChange={(v) => update((s) => ({ tabs: { ...s.tabs, homework: v } }))} options={[{ id: 'homework', label: t('hw.homework') }, { id: 'classwork', label: t('hw.classwork') }, { id: 'notebook', label: t('hw.notebook'), badge: nb - Object.keys(fixed).length }]} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {tab === 'homework' && <HomeworkList />}
          {tab === 'classwork' && <Classwork />}
          {tab === 'notebook' && <Notebook />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function HomeworkList() {
  const { t, tx, d } = useI18n()
  const status = useStatus()
  const filter = (useApp((s) => s.tabs.hwFilter) as Filter) ?? 'tomorrow'
  const update = useApp((s) => s.update)
  const inWeek = addDays(TODAY, 7)
  const items = HOMEWORK.filter((h) => {
    const st = status(h)
    if (filter === 'done') return st !== 'open'
    if (filter === 'tomorrow') return st !== 'submitted' && h.due <= TOMORROW && h.due >= TODAY
    if (filter === 'week') return st !== 'submitted' && h.due >= TODAY && h.due <= inWeek
    return true
  }).sort((a, b) => a.due.getTime() - b.due.getTime())
  return (
    <>
      <Section title={t('h.tonight')}>
        <TonightList compact />
      </Section>
      <Section title={t('hw.homework')}>
        <Chips label={t('hw.homework')} value={filter} onChange={(v) => update((s) => ({ tabs: { ...s.tabs, hwFilter: v } }))} options={[{ id: 'tomorrow', label: t('hw.dueTomorrow') }, { id: 'week', label: t('hw.thisWeek') }, { id: 'done', label: t('hw.doneTab') }, { id: 'all', label: t('c.all') }]} />
        <motion.div layout className="mt-3 flex flex-col gap-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((h) => {
              const st = status(h)
              const S = SUBJECTS[h.subj]
              return (
                <motion.button layout key={h.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/homework/${h.id}`)} className="flex items-center gap-3 rounded-[22px] bg-surface p-3.5 text-left shadow-e1">
                  <Tile icon={S.icon} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow text-ink-3">{tx(S.name)}</span>
                    <span className={clsx('block text-[15px] leading-5 font-semibold tracking-[-0.012em]', st !== 'open' && 'text-ink-3')}>{tx(h.title)}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      {st === 'submitted' ? <Chip tone="success" dot>{t('hw.submittedChip')}</Chip> : st === 'done' ? <Chip tone="teal" dot>{t('hw.doneTab')}</Chip> : <Chip tone={sameDay(h.due, TOMORROW) ? 'warning' : 'muted'} dot>{sameDay(h.due, TOMORROW) ? t('hw.dueTomorrow') : t('c.due', { d: d.dm(h.due) })}</Chip>}
                      <span className="flex items-center gap-1 text-xs text-ink-3"><Clock className="size-3.5" />{t('c.min', { n: h.mins })}</span>
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-3" />
                </motion.button>
              )
            })}
          </AnimatePresence>
          {!items.length && <EmptyState title={t('hw.empty')} />}
        </motion.div>
      </Section>
      <Card className="mt-6 flex items-center gap-3 p-3.5">
        <Tile icon={Lock} tone="royal" size={44} />
        <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{t('hw.focusTitle')}</span><span className="block text-[12.5px] leading-[17px] text-ink-3">{t('hw.focusSub')}</span></span>
        <Button size="sm" onClick={() => navigate('/homework/focus')}>{t('h.start')}</Button>
      </Card>
    </>
  )
}

function Classwork() {
  const { t, tx, d } = useI18n()
  const days = [TODAY, addDays(TODAY, -1), addDays(TODAY, -2)].filter((x) => periodsFor(x).length)
  return (
    <>
      {days.map((x) => (
        <Section key={dayKey(x)} title={sameDay(x, TODAY) ? t('hw.cwToday') : d.day(x)}>
          <Group>
            {periodsFor(x).filter((p) => SUBJECTS[p.subj].academic).map((p) => (
              <Row key={p.n} icon={SUBJECTS[p.subj].icon} title={tx(SUBJECTS[p.subj].name)} meta={`${t('c.period', { n: p.n })} · ${tx(SUBJECTS[p.subj].now)}`} />
            ))}
          </Group>
        </Section>
      ))}
      {!days.length && <div className="mt-6"><EmptyState title={t('hw.cwNone')} /></div>}
    </>
  )
}

function Notebook() {
  const { t, tx } = useI18n()
  const fixed = useApp((s) => s.nbFixed)
  const update = useApp((s) => s.update)
  return (
    <motion.div variants={list} initial="hidden" animate="show" className="mt-5 flex flex-col gap-2.5">
      {NOTEBOOK.map((n) => {
        const ok = n.complete || fixed[n.id]
        return (
          <motion.div key={n.id} variants={item} className="flex items-center gap-3 rounded-[22px] bg-surface p-3.5 shadow-e1">
            <Tile icon={SUBJECTS[n.subj].icon} size={44} />
            <span className="min-w-0 flex-1">
              <span className="eyebrow text-ink-3">{tx(SUBJECTS[n.subj].name)}</span>
              <span className="block text-[14.5px] leading-5 font-semibold">{tx(n.note)}</span>
              <Chip tone={ok ? 'teal' : 'warning'} dot className="mt-1">{t(n.complete ? 'hw.nbComplete' : fixed[n.id] ? 'hw.nbFixed' : 'hw.nbPending')}</Chip>
            </span>
            {!n.complete && (
              <Button size="sm" variant={fixed[n.id] ? 'tonal' : 'outline'} onClick={() => { update((s) => { const f = { ...s.nbFixed }; if (f[n.id]) delete f[n.id]; else f[n.id] = true; return { nbFixed: f } }); if (!fixed[n.id]) toast(t('hw.nbFixedToast')) }}>
                {fixed[n.id] ? <Check className="size-4" /> : t('hw.nbFix')}
              </Button>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export function HomeworkDetail({ params }: { params: Record<string, string> }) {
  const { t, tx, d } = useI18n()
  const h = HOMEWORK.find((x) => x.id === params.id)
  const status = useStatus()
  const toggleDone = useApp((s) => s.toggleDone)
  const update = useApp((s) => s.update)
  const submittedAt = useApp((s) => (h ? s.submitted[h.id] : undefined))
  const [photos, setPhotos] = useState<string[]>([])
  const [confirm, setConfirm] = useState(false)
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')
  const [ask, setAsk] = useState(false)
  const [doubt, setDoubt] = useState('')
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => () => photos.forEach(URL.revokeObjectURL), [photos])
  if (!h) return <><Header title={t('hw.homework')} /><EmptyState title={t('c.empty')} /></>
  const S = SUBJECTS[h.subj]
  const st = status(h)
  const submit = () => {
    setConfirm(false)
    setState('loading')
    setTimeout(() => {
      setState('success')
      update((s) => ({ submitted: { ...s.submitted, [h.id]: Date.now() } }))
      if (st === 'open') toggleDone(h.id)
      toast(t('hw.submitToast', { t: tx(S.teacher) }))
    }, 1000)
    setTimeout(() => setState('idle'), 2200)
  }
  const sendDoubt = () => {
    if (doubt.trim().length < 3) return
    const chat = CHAT_FOR[h.subj] ?? 'ch-joshi'
    update((s) => ({ chats: { ...s.chats, [chat]: [...(s.chats[chat] ?? []), { me: true, text: `${tx(h.title)}: ${doubt.trim()}`, time: Date.now() }] } }))
    toast(t('hw.askToast', { t: tx(CHAT_FOR[h.subj] ? S.teacher : SUBJECTS.eng.teacher) }))
    setDoubt('')
    setAsk(false)
  }
  return (
    <>
      <Header title={tx(h.title)} eyebrow={tx(S.name)} sub={`${tx(S.teacher)} · ${t('c.due', { d: d.day(h.due) })}`} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip tone="royal"><Clock className="size-3.5" />{h.tonight ? t('hw.tonightPart', { n: h.tonight }) : t('hw.estimate', { n: h.mins })}</Chip>
        {st === 'submitted' && <Chip tone="success" dot>{t('hw.submitted', { t: d.time(submittedAt ?? h.submitted ?? Date.now()) })}</Chip>}
        {st === 'done' && <Chip tone="teal" dot>{t('hw.doneTab')}</Chip>}
      </div>
      <Section title={t('hw.instructions')}>
        <Card className="p-4 text-[15px] leading-[23px]">{tx(h.desc)}</Card>
      </Section>
      {st !== 'submitted' && (
        <Section title={t('hw.attach')}>
          <input ref={file} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => { const f = [...(e.target.files ?? [])].map((x) => URL.createObjectURL(x)); setPhotos((p) => [...p, ...f].slice(0, 4)); e.target.value = '' }} />
          <div className="flex flex-wrap gap-2.5">
            <AnimatePresence>
              {photos.map((src) => (
                <motion.div key={src} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="relative size-24 overflow-hidden rounded-2xl shadow-e1">
                  <img src={src} alt="" className="size-full object-cover" />
                  <button onClick={() => setPhotos((p) => p.filter((x) => x !== src))} aria-label={t('hw.remove')} className="absolute top-1 right-1 grid size-8 place-items-center rounded-full bg-navy/80 text-white"><Trash2 className="size-4" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.button layout whileTap={{ scale: 0.95 }} onClick={() => file.current?.click()} className="flex size-24 flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-line-strong text-[12px] font-semibold text-link">
              {photos.length ? <ImagePlus className="size-6" /> : <Camera className="size-6" />}
              {photos.length ? t('hw.attached', { n: photos.length }) : t('hw.addPhoto')}
            </motion.button>
          </div>
        </Section>
      )}
      <div className="mt-8 grid gap-2.5 md:auto-cols-fr md:grid-flow-col">
        {st !== 'submitted' && <Button size="lg" block state={state} icon={Send} onClick={() => setConfirm(true)}>{state === 'idle' && t('hw.submit')}</Button>}
        {st !== 'submitted' && (
          <Button size="lg" block variant={st === 'done' ? 'tonal' : 'outline'} icon={Check} onClick={() => { const on = toggleDone(h.id); if (on) toast(t('hw.doneToast', { t: tx(h.title) }), 'ok', () => toggleDone(h.id)) }}>
            {t(st === 'done' ? 'hw.markUndone' : 'hw.markDone')}
          </Button>
        )}
        <Button size="lg" block variant="ghost" icon={CircleHelp} onClick={() => setAsk(true)}>{t('hw.ask')}</Button>
      </div>
      <Confirm open={confirm} onClose={() => setConfirm(false)} title={t('hw.submitTitle')} body={t('hw.submitBody', { t: tx(S.teacher) })} confirm={t('c.submit')} onConfirm={submit} icon={<Tile icon={Send} size={44} />} />
      <Sheet open={ask} onClose={() => setAsk(false)} title={t('hw.ask')} description={tx(h.title)}>
        <Textarea label={t('ms.noteText')} value={doubt} onChange={(e) => setDoubt(e.target.value)} placeholder={t('hw.askPlaceholder')} />
        <Button size="lg" block className="mt-4" disabled={doubt.trim().length < 3} onClick={sendDoubt}>{t('c.send')}</Button>
      </Sheet>
    </>
  )
}

export function Focus() {
  const { t, tx } = useI18n()
  const update = useApp((s) => s.update)
  const done = useApp((s) => s.done)
  const toggleDone = useApp((s) => s.toggleDone)
  const tasks = useTonight()
  const [mins, setMins] = useState(25)
  const [end, setEnd] = useState<number>()
  const [left, setLeft] = useState(0)
  const [pin, setPin] = useState(false)
  const [pinErr, setPinErr] = useState<string>()
  const [finished, setFinished] = useState<number>()
  useEffect(() => {
    if (!end) return
    const id = setInterval(() => setLeft(Math.max(0, Math.round((end - Date.now()) / 1000))), 1000)
    return () => clearInterval(id)
  }, [end])
  useEffect(() => {
    if (end && left === 0) stop()
  })
  const stop = () => {
    const spent = Math.max(1, Math.round((mins * 60 - left) / 60))
    update((s) => ({ sessions: [...s.sessions, { id: `focus-${Date.now()}`, subj: 'focus', mins: spent, day: dayKey(TODAY) }] }))
    setEnd(undefined)
    setPin(false)
    setFinished(spent)
  }
  if (finished)
    return (
      <div className="grid min-h-[70dvh] place-items-center text-center">
        <div className="flex flex-col items-center">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.celebrate} className="grid size-24 place-items-center rounded-full bg-teal text-white"><Check className="size-12" strokeWidth={2.6} /></motion.span>
          <h1 className="mt-6 text-[28px] font-bold tracking-[-0.04em]">{t('hw.focusDone')}</h1>
          <p className="mt-1 text-ink-3">{t('hw.focusLog', { n: finished })}</p>
          <Button size="lg" className="mt-8 w-56" onClick={() => back('/homework')}>{t('c.done')}</Button>
        </div>
      </div>
    )
  if (!end)
    return (
      <>
        <Header title={t('hw.focusTitle')} sub={t('hw.focusSub')} />
        <div className="mt-8 flex flex-col items-center">
          <Ring value={mins / 60} size={220} stroke={14} color="var(--color-royal)">
            <span className="text-center"><motion.span key={mins} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="block text-[56px] leading-none font-bold tracking-[-0.06em] tabular-nums">{mins}</motion.span><span className="eyebrow text-ink-3">{t('st.minutes')}</span></span>
          </Ring>
          <div className="mt-8 flex w-full max-w-sm gap-2" role="radiogroup" aria-label={t('st.minutes')}>
            {[15, 25, 45, 60].map((m) => (
              <button key={m} role="radio" aria-checked={mins === m} onClick={() => setMins(m)} className={clsx('h-12 flex-1 rounded-full text-[15px] font-semibold transition-colors', mins === m ? 'bg-navy text-white dark:bg-royal' : 'bg-muted text-ink-2')}>{m}</button>
            ))}
          </div>
          <Button size="lg" className="mt-6 w-full max-w-sm" icon={Lock} onClick={() => { setLeft(mins * 60); setEnd(Date.now() + mins * 60000) }}>{t('hw.focusStart')}</Button>
        </div>
      </>
    )
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0')
  return (
    <div className="deck-dots fixed inset-0 z-[60] overflow-y-auto bg-navy px-6 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))] text-[#f4f7fc]">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <p className="eyebrow flex items-center gap-2 text-[#a9b8d3]"><Lock className="size-3.5" />{t('hw.focusTitle')}</p>
        <div className="mt-8">
          <Ring value={left / (mins * 60)} size={240} stroke={12} color="var(--color-sky)">
            <span className="text-center"><span className="block font-mono text-[52px] leading-none font-semibold tabular-nums">{mm}:{ss}</span><span className="eyebrow text-[#a9b8d3]">{t('hw.focusLeft')}</span></span>
          </Ring>
        </div>
        <div className="mt-8 w-full rounded-3xl bg-white/7 p-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.11)]">
          {tasks.map((x) => (
            <button key={x.id} onClick={() => toggleDone(x.id)} role="checkbox" aria-checked={!!done[x.id]} className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left">
              <span className={clsx('grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors', done[x.id] ? 'border-teal bg-teal' : 'border-white/30')}>{done[x.id] && <Check className="size-3.5" strokeWidth={3} />}</span>
              <span className={clsx('flex-1 text-[14.5px] font-medium', done[x.id] && 'text-[#a9b8d3] line-through')}>{tx(x.title)}</span>
              <span className="font-mono text-xs text-[#a9b8d3]">{t('c.minShort', { n: x.mins })}</span>
            </button>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPinErr(undefined); setPin(true) }} className="mt-6 h-[54px] w-full rounded-full bg-white/8 text-base font-semibold shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.2)]">{t('hw.focusEnd')}</motion.button>
      </div>
      <Sheet open={pin} onClose={() => setPin(false)} title={t('hw.focusPin')} description={t('hw.focusPinHint')}>
        <div className="py-2"><PinPad label={t('hw.focusPin')} delLabel={t('c.back')} error={pinErr} onDone={(p) => (p === '1234' ? stop() : setPinErr(t('hw.focusPinErr')))} /></div>
      </Sheet>
    </div>
  )
}

