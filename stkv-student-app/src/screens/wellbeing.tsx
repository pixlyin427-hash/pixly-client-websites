import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { Angry, CalendarCheck, Copy, Frown, Laugh, Lightbulb, Meh, Phone, ShieldAlert, Smile } from 'lucide-react'
import { item, list, spring } from '@/lib/motion'
import { TODAY, addDays, dayKey } from '@/lib/date'
import { useI18n, type Key } from '@/i18n'
import { toast, useApp, type Mood } from '@/store'
import { COUNSEL_SLOTS } from '@/data/content'
import { Button, Card, Group, Header, Row, Section, Tile } from '@/components/core'
import { Input, Options, SwitchRow, Textarea } from '@/components/form'
import { Sheet } from '@/components/overlay'

const MOODS: { v: Mood; icon: typeof Smile; label: Key }[] = [
  { v: 1, icon: Angry, label: 'wb.m1' }, { v: 2, icon: Frown, label: 'wb.m2' }, { v: 3, icon: Meh, label: 'wb.m3' }, { v: 4, icon: Smile, label: 'wb.m4' }, { v: 5, icon: Laugh, label: 'wb.m5' },
]

export function Wellbeing() {
  const { t, d } = useI18n()
  const mood = useApp((s) => s.mood)
  const setMood = useApp((s) => s.setMood)
  const bookings = useApp((s) => s.bookings)
  const [talk, setTalk] = useState(false)
  const [report, setReport] = useState(false)
  const today = mood[dayKey(TODAY)]
  const week = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6))
  const copy = async (n: string) => {
    try { await navigator.clipboard.writeText(n); toast(t('c.copied')) } catch { toast(n, 'info') }
  }
  return (
    <>
      <Header title={t('m.wellbeing')} />
      <Card className="mt-5 p-5">
        <h2 className="text-[18px] font-bold tracking-[-0.02em]">{t('wb.checkin')}</h2>
        <div className="mt-4 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={t('wb.checkin')}>
          {MOODS.map((m) => {
            const on = today === m.v
            return (
              <motion.button key={m.v} role="radio" aria-checked={on} whileTap={{ scale: 0.9 }} onClick={() => { setMood(m.v); if (!today) toast(t('wb.thanks')) }} className="flex flex-col items-center gap-1.5">
                <motion.span animate={{ scale: on ? 1.12 : 1 }} transition={spring.celebrate} className={clsx('grid size-12 place-items-center rounded-full transition-colors duration-200', on ? 'bg-teal text-white' : 'bg-muted text-ink-2')}><m.icon className="size-6" strokeWidth={1.9} /></motion.span>
                <span className={clsx('text-[11.5px] font-semibold', on ? 'text-teal-ink' : 'text-ink-3')}>{t(m.label)}</span>
              </motion.button>
            )
          })}
        </div>
        <div className="mt-5 border-t border-hair pt-4">
          <span className="eyebrow text-ink-3">{t('wb.week')}</span>
          <div className="mt-2.5 grid grid-cols-7 gap-1.5">
            {week.map((x) => {
              const v = mood[dayKey(x)]
              const I = v ? MOODS[v - 1].icon : null
              return (
                <span key={dayKey(x)} className="flex flex-col items-center gap-1 font-mono text-[10px] text-ink-3">
                  <motion.span layout className={clsx('grid aspect-square w-full place-items-center rounded-full', v ? 'bg-teal-soft text-teal-ink' : 'bg-muted')}>{I && <I className="size-4" />}</motion.span>
                  {d.wd(x).slice(0, 2)}
                </span>
              )
            })}
          </div>
        </div>
      </Card>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setTalk(true)} className="flex items-center gap-3 rounded-3xl bg-surface p-4 text-left shadow-e1">
          <Tile icon={CalendarCheck} tone="teal" size={44} />
          <span><b className="block text-[15px] font-semibold">{t('wb.talk')}</b><span className="text-[12.5px] leading-[17px] text-ink-3">{t('wb.talkSub')}</span></span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => setReport(true)} className="flex items-center gap-3 rounded-3xl bg-surface p-4 text-left shadow-e1">
          <Tile icon={ShieldAlert} tone="royal" size={44} />
          <span><b className="block text-[15px] font-semibold">{t('wb.report')}</b><span className="text-[12.5px] leading-[17px] text-ink-3">{t('wb.reportSub')}</span></span>
        </motion.button>
      </div>
      {bookings.length > 0 && (
        <Section title={t('wb.yourBookings')}>
          <Group>{bookings.map((b) => <Row key={b.slot} icon={CalendarCheck} tone="teal" title={t(b.who === 'counsellor' ? 'wb.counsellor' : 'wb.classTeacher')} meta={`${d.short(new Date(b.slot))} · ${d.time(b.slot)}`} />)}</Group>
        </Section>
      )}
      <Section title={t('wb.help')}>
        <Group>
          {[['1098', 'wb.childline'], ['14416', 'wb.telemanas']].map(([n, k]) => (
            <Row key={n} icon={Phone} tone="teal" title={<span className="font-mono text-[17px]">{n}</span>} meta={`${t(k as Key)} · ${t('wb.free')}`} end={<Button size="sm" variant="tonal" icon={Copy} onClick={() => copy(n)}>{t('c.copy')}</Button>} />
          ))}
        </Group>
      </Section>
      <Section title={t('wb.tips')}>
        <motion.div variants={list} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-col gap-2">
          {(['wb.tip1', 'wb.tip2', 'wb.tip3'] as const).map((k) => (
            <motion.div key={k} variants={item} className="flex items-center gap-3 rounded-[20px] bg-teal-soft p-3 text-[14px] font-medium"><Lightbulb className="size-5 shrink-0 text-teal-ink" />{t(k)}</motion.div>
          ))}
        </motion.div>
      </Section>
      <TalkSheet open={talk} onClose={() => setTalk(false)} />
      <ReportSheet open={report} onClose={() => setReport(false)} />
    </>
  )
}

function TalkSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, d } = useI18n()
  const update = useApp((s) => s.update)
  const [who, setWho] = useState<'counsellor' | 'teacher'>('counsellor')
  const [slot, setSlot] = useState(String(COUNSEL_SLOTS[0].getTime()))
  const book = () => {
    update((s) => ({ bookings: [...s.bookings.filter((b) => String(b.slot) !== slot), { slot: +slot, who }] }))
    toast(t('wb.booked', { t: `${d.short(new Date(+slot))} ${d.time(+slot)}` }))
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title={t('wb.talk')} description={t('wb.talkSub')}>
      <div className="flex flex-col gap-4">
        <Options label={t('wb.talk')} value={who} onChange={setWho} options={[{ id: 'counsellor', label: t('wb.counsellor') }, { id: 'teacher', label: t('wb.classTeacher') }]} />
        <span className="text-[12.5px] font-semibold text-ink-2">{t('wb.pickSlot')}</span>
        <div className="-mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t('wb.pickSlot')}>
          {COUNSEL_SLOTS.map((s) => {
            const id = String(s.getTime())
            return <button key={id} role="radio" aria-checked={slot === id} onClick={() => setSlot(id)} className={clsx('h-11 rounded-full px-4 text-sm font-semibold transition-colors', slot === id ? 'bg-teal text-white' : 'bg-muted text-ink-2')}>{d.short(s)} · {d.time(s)}</button>
          })}
        </div>
        <Button size="lg" block onClick={book}>{t('wb.book')}</Button>
      </div>
    </Sheet>
  )
}

function ReportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const update = useApp((s) => s.update)
  const [what, setWhat] = useState('')
  const [where, setWhere] = useState('')
  const [anon, setAnon] = useState(true)
  const [err, setErr] = useState<string>()
  const [ref, setRef] = useState<string>()
  const send = () => {
    if (what.trim().length < 10) return setErr(t('wb.reportErr'))
    const r = `SV-${String(Date.now()).slice(-5)}`
    update((s) => ({ concerns: [...s.concerns, { ref: r, time: Date.now(), anon }] }))
    setRef(r)
    setWhat('')
    setWhere('')
    setErr(undefined)
  }
  const close = () => { setRef(undefined); onClose() }
  return (
    <Sheet open={open} onClose={close} title={t('wb.report')} description={t('wb.reportSub')}>
      <AnimatePresence mode="wait" initial={false}>
        {ref ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-4 text-center">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.celebrate} className="grid size-16 place-items-center rounded-full bg-teal text-white"><ShieldAlert className="size-8" /></motion.span>
            <b className="text-[17px]">{t('wb.sent', { ref })}</b>
            <Button size="lg" block onClick={close}>{t('c.done')}</Button>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }} className="flex flex-col gap-4">
            <Textarea label={t('wb.what')} value={what} error={err} onChange={(e) => setWhat(e.target.value)} />
            <Input label={t('wb.where')} value={where} onChange={(e) => setWhere(e.target.value)} />
            <div className="rounded-2xl bg-bg"><SwitchRow title={t('wb.anon')} checked={anon} onChange={setAnon} /></div>
            <p className="text-[12.5px] leading-[18px] text-ink-3">{t('wb.anonNote')}</p>
            <Button size="lg" block onClick={send}>{t('c.send')}</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}
