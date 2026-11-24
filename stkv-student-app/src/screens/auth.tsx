import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { ArrowRight, Check, Eye, EyeOff, IdCard, KeyRound, Minus, Plus } from 'lucide-react'
import { ease, spring } from '@/lib/motion'
import { useI18n, LANG_NAMES, type Key } from '@/i18n'
import { useApp, useUI, type Lang, type Profile } from '@/store'
import { T } from '@/data/school'
import { Button } from '@/components/core'
import { Input, Options, PinPad, Segmented } from '@/components/form'
import { Crest } from '@/components/brand'

const LANGS: Lang[] = ['en', 'hi', 'mr']

function LangSwitch({ dark }: { dark?: boolean }) {
  const lang = useApp((s) => s.settings.lang)
  const setSettings = useApp((s) => s.setSettings)
  const { t } = useI18n()
  return (
    <div role="radiogroup" aria-label={t('auth.language')} className={clsx('flex rounded-full p-1', dark ? 'bg-white/8 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.11)]' : 'bg-muted')}>
      {LANGS.map((l) => (
        <button key={l} role="radio" aria-checked={lang === l} onClick={() => setSettings({ lang: l })} className={clsx('relative h-9 flex-1 rounded-full px-3 text-[13.5px] font-semibold', lang === l ? (dark ? 'text-navy' : 'text-ink') : dark ? 'text-[#a9b8d3]' : 'text-ink-2')}>
          {lang === l && <motion.span layoutId={dark ? 'lang-d' : 'lang'} transition={spring.indicator} className={clsx('absolute inset-0 rounded-full', dark ? 'bg-[#f4f7fc]' : 'bg-raised shadow-e1')} />}
          <span className="relative">{LANG_NAMES[l]}</span>
        </button>
      ))}
    </div>
  )
}

function Welcome({ onStart }: { onStart: () => void }) {
  const { t } = useI18n()
  return (
    <div className="deck-dots relative flex min-h-dvh flex-col overflow-hidden bg-navy px-6 pt-[calc(28px+env(safe-area-inset-top))] pb-[calc(28px+env(safe-area-inset-bottom))] text-[#f4f7fc]">
      <svg viewBox="0 0 400 400" className="pointer-events-none absolute -top-32 -right-40 w-[520px] text-sky" aria-hidden>
        {[180, 140, 100].map((r, i) => (
          <motion.circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeOpacity={0.22 - i * 0.05} strokeDasharray={i === 1 ? '1 7' : undefined} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: 0.2 + i * 0.15, ease: ease.enter }} />
        ))}
      </svg>
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
        <LangSwitch dark />
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.celebrate} className="mt-[14vh]">
          <Crest className="size-20" />
        </motion.div>
        <motion.p className="eyebrow mt-7 text-[#a9b8d3]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>{t('app.school')}</motion.p>
        <motion.h1 className="mt-3 text-[40px] leading-[42px] font-bold tracking-[-0.05em] text-balance" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.5, ease: ease.enter }}>
          {t('auth.tagline')}
        </motion.h1>
        <div className="flex-1" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Button size="lg" block onClick={onStart} className="mt-10">{t('auth.start')}<ArrowRight className="size-[18px]" /></Button>
          <p className="mt-4 text-center text-[12.5px] text-[#a9b8d3]">{t('auth.demoNote')}</p>
        </motion.div>
      </div>
    </div>
  )
}

function SignIn({ onBack }: { onBack: () => void }) {
  const { t } = useI18n()
  const update = useApp((s) => s.update)
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState<{ id?: string; pw?: string }>({})
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle')
  const submit = (sid = id, spw = pw) => {
    const e = { id: /^stkv-\d{4}-\d{3,4}$/i.test(sid.trim()) ? undefined : t('auth.idErr'), pw: spw.length >= 4 ? undefined : t('auth.pwErr') }
    setErr(e)
    if (e.id || e.pw) return
    setState('loading')
    setTimeout(() => setState('success'), 800)
    setTimeout(() => update({ signedIn: true }), 1300)
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex min-h-11 items-center gap-1 text-[15px] font-semibold text-link">← {t('c.back')}</button>
        <Crest className="size-10" />
      </div>
      <motion.form initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.36, ease: ease.enter }} onSubmit={(e) => { e.preventDefault(); submit() }} className="mt-10 flex flex-col gap-4" noValidate>
        <div>
          <h1 className="text-[32px] leading-9 font-bold tracking-[-0.045em]">{t('auth.signInTitle')}</h1>
          <p className="mt-2 text-[15px] text-ink-3">{t('auth.signInSub')}</p>
        </div>
        <Input label={t('auth.id')} icon={IdCard} value={id} onChange={(e) => setId(e.target.value)} error={err.id} placeholder="STKV-2019-0714" autoCapitalize="characters" autoComplete="username" />
        <Input
          label={t('auth.password')} icon={KeyRound} type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} error={err.pw} autoComplete="current-password"
          end={<button type="button" onClick={() => setShow(!show)} aria-label={t(show ? 'auth.hide' : 'auth.show')} className="grid size-10 place-items-center rounded-full text-ink-3">{show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>}
        />
        <Button size="lg" block type="submit" state={state} className="mt-2">{state === 'idle' && t('auth.signIn')}</Button>
        <Button size="lg" block type="button" variant="tonal" disabled={state !== 'idle'} onClick={() => { setId('STKV-2019-0714'); setPw('demo1234'); submit('STKV-2019-0714', 'demo1234') }}>{t('auth.demo')}</Button>
        <p className="text-center text-[12.5px] text-ink-3">{t('auth.demoNote')}</p>
      </motion.form>
      <div className="mt-auto pt-8"><LangSwitch /></div>
    </div>
  )
}

export function Auth() {
  const [step, setStep] = useState<'welcome' | 'signin'>('welcome')
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
        {step === 'welcome' ? <Welcome onStart={() => setStep('signin')} /> : <SignIn onBack={() => setStep('welcome')} />}
      </motion.div>
    </AnimatePresence>
  )
}

const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
export const CLASS_NAMES: Record<string, ReturnType<typeof T>> = { Nursery: T('Nursery', 'नर्सरी', 'नर्सरी'), LKG: T('LKG', 'एलकेजी', 'छोटा गट'), UKG: T('UKG', 'यूकेजी', 'मोठा गट') }
export const isLittle = (cls: string) => ['Nursery', 'LKG', 'UKG', '1', '2'].includes(cls)

function Pills<V extends string>({ items, value, onChange, label, cols = 4 }: { items: { id: V; label: string }[]; value: V; onChange: (v: V) => void; label: string; cols?: number }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {items.map((o) => (
        <motion.button key={o.id} type="button" role="radio" aria-checked={o.id === value} whileTap={{ scale: 0.94 }} onClick={() => onChange(o.id)} className={clsx('relative h-12 truncate rounded-2xl px-2 text-[14.5px] font-semibold transition-colors', o.id === value ? 'text-white' : 'bg-muted text-ink-2')}>
          {o.id === value && <motion.span layoutId={`pill-${label}`} transition={spring.indicator} className="absolute inset-0 rounded-2xl bg-navy dark:bg-royal" />}
          <span className="relative">{o.label}</span>
        </motion.button>
      ))}
    </div>
  )
}

export function Onboarding() {
  const { t, tx } = useI18n()
  const { profile, settings, update, setSettings } = useApp()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [p, setP] = useState<Profile>({ ...profile, name: profile.name || 'Aarav Deshmukh' })
  const [err, setErr] = useState<string>()
  const [ready, setReady] = useState(false)
  const titles: Key[] = ['ob.nameTitle', 'ob.aboutTitle', 'ob.classTitle', 'ob.prefsTitle']
  const go = (n: number) => {
    if (n > step) {
      if (step === 0 && p.name.trim().length < 2) return setErr(t('ob.nameErr'))
      if (step === 1 && (p.age < 3 || p.age > 19)) return setErr(t('ob.ageErr'))
    }
    setErr(undefined)
    setDir(n > step ? 1 : -1)
    if (n === 4) {
      update({ profile: { ...p, name: p.name.trim() } })
      setReady(true)
      setTimeout(() => update({ onboarded: true }), 1600)
      return
    }
    setStep(n)
  }
  if (ready)
    return (
      <div className="deck-dots grid min-h-dvh place-items-center bg-navy px-6 text-center text-[#f4f7fc]">
        <div className="flex flex-col items-center">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.celebrate} className="grid size-24 place-items-center rounded-full bg-teal">
            <motion.svg viewBox="0 0 24 24" className="size-12" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><motion.path d="M20 6 9 17l-5-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.4 }} /></motion.svg>
          </motion.span>
          <motion.h1 className="mt-7 text-[30px] font-bold tracking-[-0.04em]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>{t('ob.ready', { name: p.name.trim().split(' ')[0] })}</motion.h1>
          <motion.p className="mt-2 text-[#a9b8d3]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>{t('ob.readySub')}</motion.p>
        </div>
      </div>
    )
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[calc(18px+env(safe-area-inset-top))] pb-[calc(24px+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-1.5" aria-label={t('ob.step', { n: step + 1, t: 4 })}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.span className="block h-full rounded-full bg-royal" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.4, ease: ease.enter }} />
          </span>
        ))}
      </div>
      <p className="eyebrow mt-4 text-ink-3">{t('ob.step', { n: step + 1, t: 4 })}</p>
      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.34, ease: ease.enter } }} exit={{ opacity: 0, x: dir * -24, transition: { duration: 0.15 } }} className="mt-2 flex flex-col gap-5">
          <h1 className="text-[30px] leading-[34px] font-bold tracking-[-0.045em] text-balance">{t(titles[step])}</h1>
          {step === 0 && <Input label={t('ob.name')} value={p.name} error={err} onChange={(e) => setP({ ...p, name: e.target.value })} autoComplete="name" autoFocus />}
          {step === 1 && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink-2">{t('ob.age')}</span>
                <div className="flex items-center gap-3">
                  <motion.button whileTap={{ scale: 0.9 }} aria-label="−" onClick={() => setP({ ...p, age: Math.max(3, p.age - 1) })} className="grid size-12 place-items-center rounded-full bg-muted"><Minus className="size-5" /></motion.button>
                  <motion.span key={p.age} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-20 text-center text-[40px] font-bold tracking-[-0.05em] tabular-nums" aria-live="polite">{p.age}</motion.span>
                  <motion.button whileTap={{ scale: 0.9 }} aria-label="+" onClick={() => setP({ ...p, age: Math.min(19, p.age + 1) })} className="grid size-12 place-items-center rounded-full bg-muted"><Plus className="size-5" /></motion.button>
                </div>
                {err && <p className="text-[12.5px] text-error-ink" role="alert">{err}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink-2">{t('ob.gender')} · {t('c.optional')}</span>
                <Pills label={t('ob.gender')} cols={2} value={p.gender || 'na'} onChange={(g) => setP({ ...p, gender: g === 'na' ? '' : g })} items={[{ id: 'girl', label: t('ob.girl') }, { id: 'boy', label: t('ob.boy') }, { id: 'other', label: t('ob.other') }, { id: 'na', label: t('ob.skip') }]} />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink-2">{t('ob.class')}</span>
                <Pills label={t('ob.class')} cols={5} value={p.cls} onChange={(cls) => setP({ ...p, cls })} items={CLASSES.map((c) => ({ id: c, label: CLASS_NAMES[c] ? tx(CLASS_NAMES[c]) : c }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink-2">{t('ob.division')}</span>
                <Pills label={t('ob.division')} value={p.div} onChange={(div) => setP({ ...p, div })} items={['A', 'B', 'C', 'D'].map((d) => ({ id: d, label: d }))} />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Options label={t('set.language')} value={settings.lang} onChange={(lang) => setSettings({ lang })} options={LANGS.map((l) => ({ id: l, label: LANG_NAMES[l] }))} />
              <div className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink-2">{t('ob.theme')}</span>
                <Segmented label={t('ob.theme')} value={settings.theme} onChange={(theme) => setSettings({ theme })} options={[{ id: 'light', label: t('th.light') }, { id: 'dark', label: t('th.dark') }, { id: 'system', label: t('th.system') }]} />
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <p className="mt-6 text-[12.5px] text-ink-3">{t('ob.privacy')}</p>
      <div className="mt-auto flex gap-3 pt-8">
        {step > 0 && <Button size="lg" variant="outline" onClick={() => go(step - 1)}>{t('c.back')}</Button>}
        <Button size="lg" block onClick={() => go(step + 1)}>{step === 3 ? t('ob.finish') : t('c.next')}{step === 3 ? <Check className="size-[18px]" /> : <ArrowRight className="size-[18px]" />}</Button>
      </div>
    </div>
  )
}

export function LockScreen() {
  const { t } = useI18n()
  const [err, setErr] = useState<string>()
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="flex flex-col items-center gap-6">
        <Crest className="size-16" />
        <h1 className="text-[24px] font-bold tracking-[-0.03em]">{t('set.lockTitle')}</h1>
        <PinPad label={t('set.lockTitle')} delLabel={t('c.back')} error={err} onDone={(pin) => (pin === '1234' ? useUI.setState({ unlocked: true }) : setErr(t('set.lockErr')))} />
      </div>
    </div>
  )
}
