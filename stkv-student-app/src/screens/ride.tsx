import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { Bus, CircleCheck, Clock, DoorOpen, MapPin } from 'lucide-react'
import { item, list } from '@/lib/motion'
import { TODAY, dayKey, isSchoolDay, nowMinutes } from '@/lib/date'
import { useI18n } from '@/i18n'
import { toast, useApp } from '@/store'
import { ROUTE_STOPS } from '@/data/content'
import { TOMORROW } from '@/data/school'
import { Button, Card, Chip, Header, Section } from '@/components/core'

const mine = ROUTE_STOPS.find((s) => s.mine)!
const START = ROUTE_STOPS[0].am, END = ROUTE_STOPS[ROUTE_STOPS.length - 1].am
const clock = (m: number) => new Date(2000, 0, 1, 0, m)

export function Ride() {
  const { t, tx, d } = useI18n()
  const late = useApp((s) => s.late)
  const update = useApp((s) => s.update)
  const [now, setNow] = useState(nowMinutes())
  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 20000)
    return () => clearInterval(id)
  }, [])
  const school = isSchoolDay(TODAY)
  const running = school && now >= START - 10 && now <= END
  const progress = Math.min(1, Math.max(0, (now - START) / (END - START)))
  const eta = mine.am - now
  const boarded = school && now >= mine.am
  const reached = school && now >= END
  const sentToday = !!late[dayKey(TODAY)]
  return (
    <>
      <Header title={t('m.ride')} sub={t('rd.pilot')} />
      <div className="deck-dots rounded-3xl mt-5 overflow-hidden bg-deck p-5 text-[#f4f7fc]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5"><span className="grid size-10 place-items-center rounded-xl bg-white/10"><Bus className="size-5" /></span><b className="text-[17px]">{t('rd.bus')}</b></span>
          <Chip tone="amber">{t('c.pilot')}</Chip>
        </div>
        <p className="mt-4 text-[28px] leading-8 font-bold tracking-[-0.04em]">
          {running && !boarded ? (eta <= 1 ? t('rd.arriving') : t('rd.eta', { n: eta })) : t('rd.nextTrip', { t: `${d.wd(running || now < START ? TODAY : TOMORROW)} ${d.time(clock(mine.am))}` })}
        </p>
        <div className="relative mt-6 mb-2 h-1.5 rounded-full bg-white/15">
          <motion.span className="absolute inset-y-0 left-0 rounded-full bg-sky" initial={{ width: 0 }} animate={{ width: `${(running ? progress : reached ? 1 : 0) * 100}%` }} transition={{ duration: 1 }} />
          {ROUTE_STOPS.map((s) => (
            <span key={s.am} className={clsx('absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-deck', s.mine ? 'size-4 bg-amber' : 'bg-white/60')} style={{ left: `${((s.am - START) / (END - START)) * 100}%` }} />
          ))}
          {running && <motion.span className="absolute top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sky text-navy shadow-[0_0_0_4px_rgb(98_165_245/0.3)]" animate={{ left: `${progress * 100}%` }} transition={{ duration: 1 }}><Bus className="size-4" /></motion.span>}
        </div>
      </div>
      <Section title={t('rd.today')}>
        {school ? (
          <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-2">
            {[[boarded, Bus, t('rd.boarded', { t: d.time(clock(mine.am)) })], [reached, DoorOpen, t('rd.reached', { t: d.time(clock(END)) })], [school && now >= 830, MapPin, t('rd.dropped', { t: d.time(clock(830)) })]].map(([on, I, label], i) => {
              const Icon = I as typeof Bus
              return (
                <motion.div key={i} variants={item} className={clsx('flex items-center gap-3 rounded-[20px] p-3.5', on ? 'bg-teal-soft' : 'bg-surface shadow-e1')}>
                  <span className={clsx('grid size-9 place-items-center rounded-full', on ? 'bg-teal text-white' : 'bg-muted text-ink-3')}>{on ? <CircleCheck className="size-5" /> : <Icon className="size-5" />}</span>
                  <span className={clsx('text-[14.5px] font-semibold', !on && 'text-ink-3')}>{label as string}</span>
                </motion.div>
              )
            })}
          </motion.div>
        ) : <p className="rounded-3xl bg-surface p-4 text-sm text-ink-3 shadow-e1">{t('rd.noTrip')}</p>}
      </Section>
      <Section title={t('rd.yourStop')}>
        <Card className="p-1">
          {ROUTE_STOPS.map((s) => (
            <div key={s.am} className={clsx('flex items-center gap-3 rounded-[20px] px-3 py-3', s.mine && 'bg-amber-soft')}>
              <MapPin className={clsx('size-5', s.mine ? 'text-amber-ink' : 'text-ink-3')} />
              <span className="flex-1 text-[14.5px] font-semibold">{tx(s.name)}</span>
              <span className="flex items-center gap-1 font-mono text-[13px] text-ink-3"><Clock className="size-3.5" />{d.time(clock(s.am))}</span>
            </div>
          ))}
        </Card>
      </Section>
      <Button size="lg" block variant={sentToday ? 'tonal' : 'outline'} disabled={sentToday || !school} className="mt-6" onClick={() => { update((s) => ({ late: { ...s.late, [dayKey(TODAY)]: Date.now() } })); toast(t('rd.lateSent')) }}>
        {sentToday ? `✓ ${t('rd.lateDone')}` : t('rd.late')}
      </Button>
    </>
  )
}
