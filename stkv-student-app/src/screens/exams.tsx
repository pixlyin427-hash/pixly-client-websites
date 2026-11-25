import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { Brain, Check, ChevronRight, Clock, Flag, GraduationCap, Play, X } from 'lucide-react'
import { back, navigate } from '@/lib/router'
import { ease, item, list, spring } from '@/lib/motion'
import { TODAY, daysBetween } from '@/lib/date'
import { useI18n } from '@/i18n'
import { useApp } from '@/store'
import { SUBJECTS, ACADEMIC } from '@/data/school'
import { EXAMS, PAST_QUIZ, QUIZ, REPORTS, avg, grade } from '@/data/content'
import { Button, Card, Chip, Group, Header, Pressable, Row, Section, Tile } from '@/components/core'
import { Tabs } from '@/components/form'
import { Confirm, Sheet } from '@/components/overlay'
import { EmptyState, Ring } from '@/components/data'

type Tab = 'upcoming' | 'online' | 'reports'

export function Exams() {
  const { t } = useI18n()
  const tab = (useApp((s) => s.tabs.exams) as Tab) ?? 'upcoming'
  const update = useApp((s) => s.update)
  return (
    <>
      <Header title={t('m.exams')} />
      <div className="mt-4">
        <Tabs label={t('m.exams')} value={tab} onChange={(v) => update((s) => ({ tabs: { ...s.tabs, exams: v } }))} options={[{ id: 'upcoming', label: t('ex.upcoming') }, { id: 'online', label: t('ex.online') }, { id: 'reports', label: t('ex.reports') }]} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {tab === 'upcoming' && <Upcoming />}
          {tab === 'online' && <Online />}
          {tab === 'reports' && <Reports />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function Upcoming() {
  const { t, tx, d } = useI18n()
  const revised = useApp((s) => s.revised)
  return (
    <motion.div variants={list} initial="hidden" animate="show" className="mt-5 flex flex-col gap-3">
      {EXAMS.map((e, i) => {
        const n = e.portions.filter((_, k) => revised[`${e.id}:${k}`]).length
        const days = daysBetween(TODAY, e.date)
        return (
          <motion.div key={e.id} variants={item}>
            <Pressable onClick={() => navigate(`/exams/${e.id}`)} className={clsx('flex w-full items-center gap-4 rounded-3xl p-4', i === 0 ? 'deck-dots bg-deck text-[#f4f7fc]' : 'bg-surface shadow-e1')}>
              <Ring value={n / e.portions.length} size={56} stroke={6} color="var(--color-amber)"><span className="text-[13px] font-bold tabular-nums">{n}/{e.portions.length}</span></Ring>
              <span className="min-w-0 flex-1">
                <span className={clsx('eyebrow', i === 0 ? 'text-amber' : 'text-amber-ink')}>{days <= 1 ? t('h.tomorrowShort') : t('h.inDays', { n: days })} · {d.dm(e.date)}</span>
                <span className="mt-0.5 block text-[16px] leading-5 font-semibold tracking-[-0.015em]">{tx(e.title)}</span>
                <span className={clsx('mt-0.5 block truncate text-[12.5px]', i === 0 ? 'text-[#a9b8d3]' : 'text-ink-3')}>{tx(e.format)}</span>
              </span>
              <ChevronRight className={clsx('size-4 shrink-0', i === 0 ? 'text-[#a9b8d3]' : 'text-ink-3')} />
            </Pressable>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function useCountdown(to: Date) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])
  const ms = Math.max(0, to.getTime() - now)
  return { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60 }
}

export function TestReady({ params }: { params: Record<string, string> }) {
  const { t, tx, d } = useI18n()
  const e = EXAMS.find((x) => x.id === params.id)
  const revised = useApp((s) => s.revised)
  const update = useApp((s) => s.update)
  const cd = useCountdown(e?.date ?? TODAY)
  if (!e) return <><Header title={t('ex.ready')} /><EmptyState title={t('c.empty')} /></>
  const n = e.portions.filter((_, k) => revised[`${e.id}:${k}`]).length
  return (
    <>
      <Header title={tx(e.title)} eyebrow={t('ex.ready')} sub={`${d.day(e.date)} · ${d.time(e.date)}`} />
      <div className="deck-dots rounded-3xl mt-5 flex items-center gap-5 overflow-hidden bg-deck p-5 text-[#f4f7fc]">
        <Ring value={n / e.portions.length} size={84} stroke={8} color="var(--color-amber)"><span className="text-lg font-bold tabular-nums">{n}/{e.portions.length}</span></Ring>
        <span>
          <span className="eyebrow text-[#a9b8d3]">{t('ex.countdown')}</span>
          <span className="mt-1 block font-mono text-[30px] leading-9 font-semibold tabular-nums">{cd.d ? t('ex.dh', { d: cd.d, h: cd.h }) : t('ex.hm', { h: cd.h, m: cd.m })}</span>
          <span className="block text-[13px] text-[#a9b8d3]">{t('h.revised', { a: n, b: e.portions.length })}</span>
        </span>
      </div>
      <Section title={t('ex.portions')}>
        <Group>
          {e.portions.map((p, k) => {
            const key = `${e.id}:${k}`
            const on = !!revised[key]
            return (
              <motion.button key={key} whileTap={{ scale: 0.98 }} role="checkbox" aria-checked={on} onClick={() => update((s) => { const r = { ...s.revised }; if (on) delete r[key]; else r[key] = true; return { revised: r } })} className="relative flex min-h-14 w-full items-center gap-3 px-3 py-3 text-left">
                <span className={clsx('grid size-[26px] shrink-0 place-items-center rounded-full border-2 transition-colors duration-200', on ? 'border-teal bg-teal text-white' : 'border-line-strong')}>
                  <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring.celebrate}><Check className="size-3.5" strokeWidth={3} /></motion.span>}</AnimatePresence>
                </span>
                <span className="min-w-0 flex-1 text-[14.5px] leading-5 font-semibold">{tx(p)}</span>
                <span className={clsx('text-xs font-semibold', on ? 'text-teal-ink' : 'text-ink-3')}>{t(on ? 'ex.revised' : 'ex.markRevised')}</span>
              </motion.button>
            )
          })}
        </Group>
      </Section>
      <Section title={t('ex.format')}>
        <Card className="flex items-center gap-3 p-4"><Tile icon={SUBJECTS[e.subj].icon} /><span className="text-[14.5px] font-semibold">{tx(e.format)}</span></Card>
      </Section>
      <Button size="lg" block variant="tonal" icon={Brain} className="mt-6" onClick={() => navigate('/study/recall')}>{t('ex.practice')}</Button>
    </>
  )
}

function Online() {
  const { t, tx, d } = useI18n()
  const quiz = useApp((s) => s.quiz)
  return (
    <motion.div variants={list} initial="hidden" animate="show" className="mt-5 flex flex-col gap-3">
      <motion.div variants={item} className="rounded-3xl bg-surface p-4 shadow-e1">
        <div className="flex items-center gap-3">
          <Tile icon={SUBJECTS.sci.icon} size={44} />
          <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{tx(QUIZ.title)}</span><span className="text-[12.5px] text-ink-3">{QUIZ.questions.length} · {t('c.min', { n: QUIZ.minutes })}</span></span>
          {quiz.result && <Chip tone="success">{quiz.result.score}/{QUIZ.questions.length}</Chip>}
        </div>
        <Button className="mt-3.5" block icon={Play} onClick={() => navigate('/exams/quiz')}>{quiz.result ? t('ex.retake') : quiz.started ? t('c.continue') : t('ex.startQuiz')}</Button>
      </motion.div>
      <motion.div variants={item}>
        <Row className="bg-surface shadow-e1" icon={GraduationCap} title={tx(PAST_QUIZ.title)} meta={`${t('ex.completed')} · ${d.dm(PAST_QUIZ.date)}`} end={<Chip tone="success">{PAST_QUIZ.score}/{PAST_QUIZ.total}</Chip>} />
      </motion.div>
    </motion.div>
  )
}

function Reports() {
  const { t, tx, d } = useI18n()
  const [open, setOpen] = useState<string>()
  const r = REPORTS.find((x) => x.id === open)
  return (
    <>
      <motion.div variants={list} initial="hidden" animate="show" className="mt-5 flex flex-col gap-2.5">
        {[...REPORTS].reverse().map((x) => (
          <motion.div key={x.id} variants={item}>
            <Pressable onClick={() => setOpen(x.id)} className="flex w-full items-center gap-3 rounded-[22px] bg-surface p-3.5 shadow-e1">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ice text-[17px] font-bold text-link tabular-nums">{avg(x)}</span>
              <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{tx(x.title)}</span><span className="text-[12.5px] text-ink-3">{d.dmy(x.date)} · {t('ex.grade', { g: grade(avg(x)) })}</span></span>
              <ChevronRight className="size-4 text-ink-3" />
            </Pressable>
          </motion.div>
        ))}
      </motion.div>
      <Sheet open={!!r} onClose={() => setOpen(undefined)} title={r ? tx(r.title) : ''} description={r ? `${t('ex.overall')} ${avg(r)}% · ${t('ex.grade', { g: grade(avg(r)) })}` : undefined}>
        {r && (
          <div className="flex flex-col gap-2">
            {ACADEMIC.map((s) => (
              <div key={s} className="flex items-center gap-3 rounded-2xl bg-bg px-3 py-2.5">
                <Tile icon={SUBJECTS[s].icon} size={28} />
                <span className="flex-1 text-[14px] font-semibold">{tx(SUBJECTS[s].name)}</span>
                <span className="font-mono text-[13px] text-ink-3">{grade(r.scores[s])}</span>
                <span className="w-10 text-right text-[15px] font-bold tabular-nums">{r.scores[s]}</span>
              </div>
            ))}
            <div className="mt-2 rounded-2xl bg-ice p-3.5"><span className="eyebrow text-link">{t('ex.remark')}</span><p className="mt-1 text-[14.5px]">{tx(r.remark)}</p></div>
          </div>
        )}
      </Sheet>
    </>
  )
}

export function Quiz() {
  const { t, tx } = useI18n()
  const quiz = useApp((s) => s.quiz)
  const update = useApp((s) => s.update)
  const [rules, setRules] = useState(!quiz.started || !!quiz.result)
  const [i, setI] = useState(0)
  const [flags, setFlags] = useState<Record<number, true>>({})
  const [ask, setAsk] = useState(false)
  const [review, setReview] = useState(false)
  const [now, setNow] = useState(Date.now())
  const total = QUIZ.minutes * 60
  const left = quiz.started ? Math.max(0, total - Math.floor((now - quiz.started) / 1000)) : total
  const running = !!quiz.started && !quiz.result && !rules
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])
  const submit = () => {
    const score = QUIZ.questions.filter((q, k) => quiz.answers[k] === q.answer).length
    update((s) => ({ quiz: { ...s.quiz, result: { score, time: Date.now() } }, xp: s.xp + score * 2 }))
    setAsk(false)
  }
  useEffect(() => {
    if (running && left === 0) submit()
  })
  const begin = () => {
    update({ quiz: { answers: {}, started: Date.now() } })
    setNow(Date.now())
    setRules(false)
    setI(0)
    setFlags({})
  }
  if (rules)
    return (
      <>
        <Header title={tx(QUIZ.title)} />
        <Card className="mt-6 flex flex-col items-center gap-3 p-6 text-center">
          <Tile icon={Clock} size={56} />
          <h2 className="text-[21px] font-bold tracking-[-0.03em]">{t('ex.rules')}</h2>
          <p className="max-w-[36ch] text-[15px] text-ink-2">{t('ex.rulesBody', { n: QUIZ.questions.length, m: QUIZ.minutes })}</p>
          <Button size="lg" block className="mt-2" icon={Play} onClick={begin}>{t('ex.begin')}</Button>
          {quiz.started && !quiz.result && <Button size="lg" block variant="tonal" onClick={() => setRules(false)}>{t('c.continue')}</Button>}
        </Card>
      </>
    )
  if (quiz.result) {
    const score = quiz.result.score
    return (
      <>
        <Header title={t('ex.result')} />
        <div className="mt-4 flex flex-col items-center text-center">
          <Ring value={score / QUIZ.questions.length} size={170} stroke={12} color="var(--color-royal)"><span className="text-[44px] font-bold tracking-[-0.05em] tabular-nums">{score}/{QUIZ.questions.length}</span></Ring>
          {left === 0 && <p className="mt-3 text-sm text-ink-3">{t('ex.timeUp')}</p>}
          <div className="mt-6 flex w-full max-w-sm flex-col gap-2.5">
            <Button size="lg" block onClick={() => setReview(!review)}>{t('ex.review')}</Button>
            <Button size="lg" block variant="tonal" onClick={() => setRules(true)}>{t('ex.retake')}</Button>
            <Button size="lg" block variant="ghost" onClick={() => back('/exams')}>{t('c.done')}</Button>
          </div>
        </div>
        <AnimatePresence>
          {review && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 flex flex-col gap-2.5 overflow-hidden">
              {QUIZ.questions.map((q, k) => {
                const ok = quiz.answers[k] === q.answer
                return (
                  <Card key={k} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className={clsx('grid size-7 shrink-0 place-items-center rounded-full text-white', ok ? 'bg-teal' : 'bg-error')}>{ok ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />}</span>
                      <span className="text-[15px] leading-[21px] font-semibold">{tx(q.q)}</span>
                    </div>
                    <p className="mt-2 pl-10 text-[13px] text-ink-3">{t('ex.yourAnswer')}: {quiz.answers[k] !== undefined ? tx(q.options[quiz.answers[k]]) : '—'}</p>
                    {!ok && <p className="pl-10 text-[13px] font-semibold text-teal-ink">{t('ex.right')}: {tx(q.options[q.answer])}</p>}
                  </Card>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }
  const q = QUIZ.questions[i]
  const answered = Object.keys(quiz.answers).length
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0')
  return (
    <>
      <Header title={tx(QUIZ.title)} actions={<span className={clsx('flex h-10 items-center gap-1.5 rounded-full px-3.5 font-mono text-[15px] font-semibold tabular-nums', left < 60 ? 'bg-error-soft text-error-ink' : 'bg-ice text-link')} aria-label={t('ex.timeLeft')}><Clock className="size-4" />{mm}:{ss}</span>} />
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto py-1" role="tablist" aria-label={t('st.question', { n: i + 1, t: QUIZ.questions.length })}>
        {QUIZ.questions.map((_, k) => (
          <button key={k} role="tab" aria-selected={k === i} onClick={() => setI(k)} className={clsx('relative grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors', k === i ? 'bg-navy text-white dark:bg-royal' : quiz.answers[k] !== undefined ? 'bg-ice text-link' : 'bg-muted text-ink-2')}>
            {k + 1}
            {flags[k] && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-amber ring-2 ring-bg" />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: ease.enter } }} exit={{ opacity: 0, x: -16, transition: { duration: 0.12 } }}>
          <p className="eyebrow mt-5 text-ink-3">{t('st.question', { n: i + 1, t: QUIZ.questions.length })}</p>
          <h2 className="mt-2 text-[22px] leading-[28px] font-bold tracking-[-0.03em] text-balance">{tx(q.q)}</h2>
          <div className="mt-5 flex flex-col gap-2.5" role="radiogroup" aria-label={tx(q.q)}>
            {q.options.map((o, k) => {
              const on = quiz.answers[i] === k
              return (
                <motion.button key={k} role="radio" aria-checked={on} whileTap={{ scale: 0.98 }} onClick={() => update((s) => ({ quiz: { ...s.quiz, answers: { ...s.quiz.answers, [i]: k } } }))} className={clsx('flex min-h-14 items-center gap-3 rounded-[20px] px-4 py-3 text-left text-[16px] font-semibold transition-[background-color,box-shadow] duration-200', on ? 'bg-ice shadow-[inset_0_0_0_2px_var(--color-royal)]' : 'bg-surface shadow-e1')}>
                  <span className={clsx('grid size-8 shrink-0 place-items-center rounded-full font-mono text-[13px] transition-colors', on ? 'bg-royal text-white' : 'bg-muted text-ink-2')}>{String.fromCharCode(65 + k)}</span>
                  {tx(o)}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex items-center gap-2">
        <Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}>{t('ex.prev')}</Button>
        <Button variant={flags[i] ? 'tonal' : 'ghost'} icon={Flag} aria-pressed={!!flags[i]} onClick={() => setFlags((f) => { const x = { ...f }; if (x[i]) delete x[i]; else x[i] = true; return x })}>{t(flags[i] ? 'ex.flagged' : 'ex.flag')}</Button>
        <span className="flex-1" />
        {i < QUIZ.questions.length - 1 ? <Button onClick={() => setI(i + 1)}>{t('c.next')}</Button> : <Button onClick={() => setAsk(true)}>{t('ex.submitQuiz')}</Button>}
      </div>
      {i < QUIZ.questions.length - 1 && <Button block variant="tonal" className="mt-3" onClick={() => setAsk(true)}>{t('ex.submitQuiz')}</Button>}
      <Confirm open={ask} onClose={() => setAsk(false)} title={t('ex.submitAsk')} body={answered < QUIZ.questions.length ? t('ex.unanswered', { n: QUIZ.questions.length - answered }) : t('ex.allAnswered')} confirm={t('c.submit')} onConfirm={submit} />
    </>
  )
}

