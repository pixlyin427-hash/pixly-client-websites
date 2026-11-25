import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { Brain, Check, ChevronRight, Ear, Eye, Plus, Timer, Volume2, X } from 'lucide-react'
import { back, navigate } from '@/lib/router'
import { ease, item, list, spring } from '@/lib/motion'
import { TODAY, addDays, dayKey, fromKey } from '@/lib/date'
import { useI18n, type Key } from '@/i18n'
import { toast, useApp } from '@/store'
import { ACADEMIC, SUBJECTS } from '@/data/school'
import { DICTATION, RECALL } from '@/data/content'
import { Button, Card, Group, Header, Pressable, Row, Section, Tile } from '@/components/core'
import { Segmented, Select } from '@/components/form'
import { Sheet } from '@/components/overlay'
import { CountUp, Ring } from '@/components/data'

const GOALS: Key[] = ['st.goal1', 'st.goal2', 'st.goal3']

export function Study() {
  const { t, tx, d } = useI18n()
  const recall = useApp((s) => s.recall)
  const goals = useApp((s) => s.goals)
  const sessions = useApp((s) => s.sessions)
  const dictBest = useApp((s) => s.dictBest)
  const update = useApp((s) => s.update)
  const [add, setAdd] = useState(false)
  const doneToday = recall.last === dayKey(TODAY)
  const acc = recall.total ? Math.round((recall.correct / recall.total) * 100) : 0
  const planned = sessions.filter((s) => s.subj !== 'focus' && s.day >= dayKey(TODAY))
  return (
    <>
      <Header title={t('m.study')} />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Card className="p-4"><span className="eyebrow text-ink-3">{t('st.recallDays')}</span><span className="mt-1 block text-[32px] leading-9 font-bold tracking-[-0.05em] text-purple-ink"><CountUp to={recall.days} /></span></Card>
        <Card className="p-4"><span className="eyebrow text-ink-3">{t('st.accuracy')}</span><span className="mt-1 block text-[32px] leading-9 font-bold tracking-[-0.05em]">{recall.total ? <><CountUp to={acc} />%</> : '—'}</span></Card>
      </div>
      <Pressable onClick={() => navigate('/study/recall')} className="deck-dots mt-3 flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-deck p-5 text-[#f4f7fc]">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-purple text-white"><Brain className="size-7" strokeWidth={1.9} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[18px] font-bold tracking-[-0.025em]">{t('st.recall')}</span>
          <span className="block text-[13px] leading-[18px] text-[#a9b8d3]">{doneToday ? t('st.recallDoneToday') : t('st.recallSub')}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-[#a9b8d3]" />
      </Pressable>
      <Pressable onClick={() => navigate('/study/dictation')} className="mt-3 flex w-full items-center gap-4 rounded-3xl bg-surface p-4 shadow-e1">
        <Tile icon={Ear} tone="purple" size={44} />
        <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{t('st.dictation')}</span><span className="block text-[12.5px] text-ink-3">{t('st.dictSub')}{dictBest ? ` · ${t('st.best', { n: dictBest })}` : ''}</span></span>
        <ChevronRight className="size-4 shrink-0 text-ink-3" />
      </Pressable>
      <Section title={t('st.goals')}>
        <Group>
          {GOALS.map((g) => {
            const on = !!goals[g]
            return (
              <motion.button key={g} whileTap={{ scale: 0.98 }} role="checkbox" aria-checked={on} onClick={() => update((s) => { const x = { ...s.goals }; if (on) delete x[g]; else x[g] = true; return { goals: x } })} className="relative flex min-h-14 w-full items-center gap-3 px-3 py-3 text-left">
                <span className={clsx('grid size-[26px] shrink-0 place-items-center rounded-full border-2 transition-colors duration-200', on ? 'border-purple bg-purple text-white' : 'border-line-strong')}>
                  <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring.celebrate}><Check className="size-3.5" strokeWidth={3} /></motion.span>}</AnimatePresence>
                </span>
                <span className={clsx('text-[14.5px] font-semibold transition-colors', on && 'text-ink-3 line-through')}>{t(g)}</span>
              </motion.button>
            )
          })}
        </Group>
      </Section>
      <Section title={t('st.sessions')}>
        {planned.length ? (
          <Group>
            <AnimatePresence initial={false}>
              {planned.map((x) => {
                const S = SUBJECTS[x.subj as keyof typeof SUBJECTS]
                return (
                  <motion.div key={x.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative">
                    <Row icon={S?.icon ?? Timer} tone="purple" title={S ? tx(S.name) : t('hw.focusTitle')} meta={`${x.day === dayKey(TODAY) ? t('c.today') : d.wdLong(fromKey(x.day))} · ${t('c.min', { n: x.mins })}`}
                      end={<button aria-label={t('c.cancel')} onClick={() => update((s) => ({ sessions: s.sessions.filter((y) => y.id !== x.id) }))} className="grid size-10 place-items-center rounded-full text-ink-3 hover:bg-muted"><X className="size-4" /></button>} />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </Group>
        ) : <p className="rounded-3xl bg-surface p-4 text-sm text-ink-3 shadow-e1">{t('st.noSessions')}</p>}
        <Button className="mt-3" variant="tonal" icon={Plus} onClick={() => setAdd(true)}>{t('st.addSession')}</Button>
      </Section>
      <AddSession open={add} onClose={() => setAdd(false)} />
    </>
  )
}

function AddSession({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, tx } = useI18n()
  const update = useApp((s) => s.update)
  const [subj, setSubj] = useState<(typeof ACADEMIC)[number]>('hin')
  const [mins, setMins] = useState<'15' | '20' | '30' | '45'>('20')
  const [day, setDay] = useState<'0' | '1' | '2'>('0')
  const save = () => {
    update((s) => ({ sessions: [...s.sessions, { id: `s-${Date.now()}`, subj, mins: +mins, day: dayKey(addDays(TODAY, +day)) }] }))
    toast(t('st.sessionAdded'))
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title={t('st.addSession')}>
      <div className="flex flex-col gap-4">
        <Select label={t('st.subject')} value={subj} onChange={setSubj} options={ACADEMIC.map((s) => ({ id: s, label: tx(SUBJECTS[s].name), icon: SUBJECTS[s].icon }))} />
        <div className="flex flex-col gap-1.5"><span className="text-[12.5px] font-semibold text-ink-2">{t('st.minutes')}</span><Segmented label={t('st.minutes')} value={mins} onChange={setMins} options={(['15', '20', '30', '45'] as const).map((m) => ({ id: m, label: m }))} /></div>
        <div className="flex flex-col gap-1.5"><span className="text-[12.5px] font-semibold text-ink-2">{t('st.when')}</span><Segmented label={t('st.when')} value={day} onChange={setDay} options={[{ id: '0', label: t('c.today') }, { id: '1', label: t('c.tomorrow') }, { id: '2', label: '+2' }]} /></div>
        <Button size="lg" block onClick={save}>{t('c.save')}</Button>
      </div>
    </Sheet>
  )
}

export function Recall() {
  const { t, tx } = useI18n()
  const finishRecall = useApp((s) => s.finishRecall)
  const recall = useApp((s) => s.recall)
  const qs = useMemo(() => {
    const start = Math.floor(TODAY.getTime() / 864e5) % RECALL.length
    return Array.from({ length: 5 }, (_, i) => RECALL[(start + i) % RECALL.length])
  }, [])
  const [i, setI] = useState(0)
  const [pick, setPick] = useState<number>()
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const q = qs[i]
  const choose = (k: number) => {
    if (pick !== undefined) return
    setPick(k)
    if (k === q.answer) setScore((s) => s + 1)
  }
  const next = () => {
    if (i === qs.length - 1) { setDone(true); finishRecall(score, qs.length); return }
    setPick(undefined)
    setI(i + 1)
  }
  if (done)
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <Ring value={score / qs.length} size={170} stroke={12} color="var(--color-purple)">
          <span className="text-[44px] font-bold tracking-[-0.05em] tabular-nums">{score}/{qs.length}</span>
        </Ring>
        <h1 className="mt-6 text-[26px] font-bold tracking-[-0.035em]">{t('st.score', { a: score, b: qs.length })}</h1>
        <p className="mt-1 text-ink-3">{t('st.streakDays', { n: recall.days })} · {t('c.xp', { n: 10 })}</p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-2.5">
          <Button size="lg" block onClick={() => back('/study')}>{t('c.done')}</Button>
          <Button size="lg" block variant="tonal" onClick={() => { setI(0); setPick(undefined); setScore(0); setDone(false) }}>{t('st.recallAgain')}</Button>
        </div>
      </div>
    )
  return (
    <>
      <Header title={t('st.recall')} sub={t('st.question', { n: i + 1, t: qs.length })} />
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {qs.map((_, k) => <span key={k} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><motion.span className="block h-full bg-purple" initial={false} animate={{ width: k < i || (k === i && pick !== undefined) ? '100%' : '0%' }} transition={{ duration: 0.4, ease: ease.enter }} /></span>)}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={i} initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.32, ease: ease.enter } }} exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}>
          <span className="eyebrow mt-6 block text-purple-ink">{tx(SUBJECTS[q.subj].name)}</span>
          <h2 className="mt-2 text-[24px] leading-[30px] font-bold tracking-[-0.03em] text-balance">{tx(q.q)}</h2>
          <motion.div variants={list} initial="hidden" animate="show" className="mt-6 flex flex-col gap-2.5" role="radiogroup" aria-label={tx(q.q)}>
            {q.options.map((o, k) => {
              const right = pick !== undefined && k === q.answer
              const wrong = pick === k && k !== q.answer
              return (
                <motion.button key={k} variants={item} role="radio" aria-checked={pick === k} whileTap={pick === undefined ? { scale: 0.98 } : undefined}
                  animate={wrong ? { x: [0, -6, 6, -4, 4, 0] } : undefined} onClick={() => choose(k)}
                  className={clsx('flex min-h-14 items-center gap-3 rounded-[20px] px-4 py-3 text-left text-[16px] font-semibold transition-colors duration-200', right ? 'bg-teal-deep text-white' : wrong ? 'bg-error-soft text-error-ink shadow-[inset_0_0_0_1.5px_var(--color-error)]' : 'bg-surface shadow-e1')}>
                  <span className={clsx('grid size-8 shrink-0 place-items-center rounded-full font-mono text-[13px]', right ? 'bg-white/20' : 'bg-muted text-ink-2')}>{right ? <Check className="size-4" strokeWidth={3} /> : wrong ? <X className="size-4" strokeWidth={3} /> : String.fromCharCode(65 + k)}</span>
                  {tx(o)}
                </motion.button>
              )
            })}
          </motion.div>
          <AnimatePresence>
            {pick !== undefined && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                <p className={clsx('mb-3 text-[14.5px] font-semibold', pick === q.answer ? 'text-teal-ink' : 'text-error-ink')} role="status">{pick === q.answer ? t('st.correct') : t('st.wrong', { a: tx(q.options[q.answer]) })}</p>
                <Button size="lg" block onClick={next}>{i === qs.length - 1 ? t('st.finish') : t('c.next')}</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function speak(word: string) {
  if (!('speechSynthesis' in window)) return false
  const voices = speechSynthesis.getVoices()
  const v = voices.find((x) => x.lang.startsWith('mr')) ?? voices.find((x) => x.lang.startsWith('hi'))
  if (!v) return false
  const u = new SpeechSynthesisUtterance(word)
  u.voice = v
  u.lang = v.lang
  u.rate = 0.8
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
  return true
}

export function Dictation() {
  const { t, tx } = useI18n()
  const dictBest = useApp((s) => s.dictBest)
  const update = useApp((s) => s.update)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(false)
  const [noVoice, setNoVoice] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const w = DICTATION[i]
  const mark = (ok: boolean) => {
    const s = score + (ok ? 1 : 0)
    setScore(s)
    if (i === DICTATION.length - 1) { setDone(true); if (s > dictBest) update({ dictBest: s }); return }
    setI(i + 1)
    setShown(false)
    setNoVoice(false)
  }
  if (done)
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <Ring value={score / DICTATION.length} size={170} stroke={12} color="var(--color-purple)"><span className="text-[44px] font-bold tracking-[-0.05em] tabular-nums">{score}/{DICTATION.length}</span></Ring>
        <h1 className="mt-6 text-[24px] font-bold tracking-[-0.035em]">{t('st.dictResult', { a: score, b: DICTATION.length })}</h1>
        <p className="mt-1 text-ink-3">{t('st.best', { n: Math.max(score, dictBest) })}</p>
        <Button size="lg" className="mt-8 w-full max-w-sm" onClick={() => back('/study')}>{t('c.done')}</Button>
      </div>
    )
  return (
    <>
      <Header title={t('st.dictation')} sub={t('st.dictSub')} />
      <p className="eyebrow mt-4 text-ink-3">{t('st.question', { n: i + 1, t: DICTATION.length })}</p>
      <Card className="mt-3 flex flex-col items-center gap-5 p-6">
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => { if (!speak(w.word)) setNoVoice(true) }} className="grid size-28 place-items-center rounded-full bg-purple text-white shadow-[0_16px_32px_-14px_rgb(128_101_216/0.8)]" aria-label={t('st.play')}>
          <Volume2 className="size-11" strokeWidth={1.8} />
        </motion.button>
        <span className="text-[15px] font-semibold">{t('st.play')}</span>
        {noVoice && <p className="max-w-[34ch] text-center text-[13px] text-ink-3" role="status">{t('st.noVoice')}</p>}
        <AnimatePresence mode="wait">
          {shown ? (
            <motion.div key="w" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring.celebrate} className="text-center">
              <p className="font-sans text-[40px] leading-tight font-bold">{w.word}</p>
              <p className="mt-1 text-sm text-ink-3">{t('st.meaning', { m: tx(w.meaning) })}</p>
            </motion.div>
          ) : (
            <motion.div key="b" exit={{ opacity: 0 }}><Button variant="tonal" icon={Eye} onClick={() => setShown(true)}>{t('st.showWord')}</Button></motion.div>
          )}
        </AnimatePresence>
      </Card>
      {shown && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-2 gap-2.5">
          <Button size="lg" icon={Check} onClick={() => mark(true)}>{t('st.iGotIt')}</Button>
          <Button size="lg" variant="outline" icon={X} onClick={() => mark(false)}>{t('st.iMissed')}</Button>
        </motion.div>
      )}
    </>
  )
}
