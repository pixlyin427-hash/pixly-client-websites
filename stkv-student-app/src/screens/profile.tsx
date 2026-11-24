import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { ArrowDown, ArrowUp, Bell, ChevronRight, Eye, Globe, IdCard as IdIcon, Info, LayoutGrid, Lock, LogOut, Moon, Pencil, RotateCcw, Settings as Cog, Type, Wand2 } from 'lucide-react'
import { back, navigate } from '@/lib/router'
import { item, list, spring } from '@/lib/motion'
import { TODAY } from '@/lib/date'
import { useI18n, LANG_NAMES, type Key } from '@/i18n'
import { level, toast, useApp, useUI, WIDGETS, type Profile as P, type QuickId, type WidgetId } from '@/store'
import { BADGES } from '@/data/content'
import { thisMonth } from '@/lib/derived'
import { Button, Card, Chip, Group, Header, Row, Section, Tile } from '@/components/core'
import { Input, Options, Segmented, Select, SwitchRow } from '@/components/form'
import { Confirm } from '@/components/overlay'
import { HexBadge } from '@/components/data'
import { Crest } from '@/components/brand'
import { CLASS_NAMES } from './auth'
import { QUICK, Shield } from './home'

const AVATARS = ['bg-navy text-white', 'bg-royal text-white', 'bg-teal text-white', 'bg-purple text-white', 'bg-coral text-navy', 'bg-amber text-navy']
const STUDENT_ID = 'STKV-2019-0714'
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

function Avatar({ p, size = 'size-20 text-2xl' }: { p: P; size?: string }) {
  return <span className={clsx('grid shrink-0 place-items-center rounded-full font-bold', size, AVATARS[p.avatar % AVATARS.length])}>{initials(p.name)}</span>
}

export function Profile() {
  const { t, tx } = useI18n()
  const profile = useApp((s) => s.profile)
  const xp = useApp((s) => s.xp)
  const earned = useApp((s) => s.earned)
  const settings = useApp((s) => s.settings)
  const cls = CLASS_NAMES[profile.cls] ? tx(CLASS_NAMES[profile.cls]) : profile.cls
  const featured = BADGES.filter((b) => earned[b.id]).slice(0, 4)
  return (
    <>
      <Header root title={t('nav.profile')} />
      <Card className="mt-5 flex flex-col items-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.celebrate}><Avatar p={profile} /></motion.div>
        <h2 className="mt-4 text-[24px] font-bold tracking-[-0.035em]">{profile.name}</h2>
        <p className="mt-0.5 text-[14px] text-ink-3">{t('pf.class', { c: cls, d: profile.div })} · {t('pf.roll', { n: 14 })}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2"><Chip tone="royal">{STUDENT_ID}</Chip><Chip tone="amber">{t('pf.level', { n: level(xp).level })}</Chip></div>
        <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-hair pt-4">
          {[[`${thisMonth().pct}%`, t('h.attendance')], [String(Object.keys(earned).length), t('h.badges')], [String(xp), 'XP']].map(([v, l]) => (
            <span key={l} className="flex flex-col"><b className="text-[18px] font-bold tracking-[-0.03em]">{v}</b><span className="text-xs text-ink-3">{l}</span></span>
          ))}
        </div>
        <Button className="mt-5" variant="tonal" icon={Pencil} onClick={() => navigate('/profile/edit')}>{t('pf.editProfile')}</Button>
      </Card>
      <Section title={t('pf.featured')} action={{ label: t('c.seeAll'), to: '/achievements' }}>
        <div className="grid grid-cols-4 gap-2">
          {featured.map((b) => (
            <button key={b.id} onClick={() => navigate('/achievements')} className="flex flex-col items-center gap-1.5 rounded-[20px] bg-surface p-2.5 shadow-e1"><HexBadge id={b.id} earned size={40} /><span className="line-clamp-2 text-[11px] leading-[14px] font-semibold">{tx(b.name)}</span></button>
          ))}
        </div>
      </Section>
      <Section title={t('grp.you')}>
        <Group>
          <Row icon={IdIcon} title={t('pf.idCard')} meta={STUDENT_ID} onClick={() => navigate('/id')} end={<ChevronRight className="size-4 text-ink-3" />} />
          <Row icon={Cog} title={t('pf.settings')} meta={`${LANG_NAMES[settings.lang]} · ${t(`th.${settings.theme}` as Key)}`} onClick={() => navigate('/settings')} end={<ChevronRight className="size-4 text-ink-3" />} />
          <Row icon={LayoutGrid} title={t('nav.all')} meta={t('hub.allSub')} onClick={() => navigate('/features')} end={<ChevronRight className="size-4 text-ink-3" />} />
        </Group>
      </Section>
    </>
  )
}

export function IdCard() {
  const { t, tx, d } = useI18n()
  const profile = useApp((s) => s.profile)
  const [flip, setFlip] = useState(false)
  const cls = CLASS_NAMES[profile.cls] ? tx(CLASS_NAMES[profile.cls]) : profile.cls
  const qr = useMemo(() => Array.from({ length: 121 }, (_, i) => ((i * 7919 + 17) % 11 + (i % 13)) % 3 !== 0), [])
  const valid = new Date(TODAY.getFullYear() + (TODAY.getMonth() >= 3 ? 1 : 0), 2, 31)
  return (
    <>
      <Header title={t('pf.idCard')} sub={t('pf.flip')} />
      <div className="mx-auto mt-6 max-w-[360px] [perspective:1200px]">
        <motion.button onClick={() => setFlip(!flip)} animate={{ rotateY: flip ? 180 : 0 }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} className="relative aspect-[0.63] w-full text-left [transform-style:preserve-3d]" aria-label={t('pf.flip')}>
          <span className="deck-dots absolute inset-0 flex flex-col overflow-hidden rounded-[28px] bg-navy p-5 text-[#f4f7fc] shadow-e3 [backface-visibility:hidden]">
            <span className="flex items-center gap-2.5"><Crest className="size-10" /><span><b className="block text-[13px] leading-4">{t('app.school')}</b><span className="eyebrow text-[#a9b8d3]">{t('pf.student')}</span></span></span>
            <span className="mt-6 grid size-24 place-items-center self-center rounded-3xl bg-white/10 text-3xl font-bold">{initials(profile.name)}</span>
            <b className="mt-4 text-center text-[22px] tracking-[-0.03em]">{profile.name}</b>
            <span className="text-center text-sm text-[#a9b8d3]">{t('pf.class', { c: cls, d: profile.div })}</span>
            <span className="mt-auto flex items-end justify-between">
              <span><span className="eyebrow block text-[#a9b8d3]">{t('pf.studentId')}</span><b className="font-mono text-[15px]">{STUDENT_ID}</b><span className="mt-2 flex items-center gap-1.5 text-xs text-[#a9b8d3]"><Shield letter="B" mine size={16} />{t('pf.house')}: Blue</span></span>
              <span className="grid grid-cols-11 gap-px rounded-lg bg-white p-1.5" aria-hidden>{qr.map((on, i) => <i key={i} className={clsx('size-[5px]', on ? 'bg-navy' : 'bg-white')} />)}</span>
            </span>
          </span>
          <span className="absolute inset-0 flex flex-col gap-4 rounded-[28px] bg-surface p-5 shadow-e3 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {[[t('pf.emergency'), '+91 98XXX XX021'], [t('pf.blood'), 'B+'], [t('pf.age', { n: profile.age }), t('pf.roll', { n: 14 })], [t('pf.validLabel'), d.dmy(valid)]].map(([k, v]) => (
              <span key={k} className="flex flex-col border-b border-hair pb-3"><span className="eyebrow text-ink-3">{k}</span><b className="text-[16px]">{v}</b></span>
            ))}
            <span className="mt-auto rounded-2xl bg-warning-soft p-3 text-center text-[12.5px] font-semibold text-warning-ink">{t('pf.idDemo')}</span>
          </span>
        </motion.button>
      </div>
    </>
  )
}

export function EditProfile() {
  const { t, tx } = useI18n()
  const profile = useApp((s) => s.profile)
  const update = useApp((s) => s.update)
  const [p, setP] = useState(profile)
  const [err, setErr] = useState<{ name?: string; age?: string }>({})
  const save = () => {
    const e = { name: p.name.trim().length < 2 ? t('ob.nameErr') : undefined, age: p.age < 3 || p.age > 19 ? t('ob.ageErr') : undefined }
    setErr(e)
    if (e.name || e.age) return
    update({ profile: { ...p, name: p.name.trim() } })
    toast(t('pf.savedToast'))
    back('/profile')
  }
  const classes = ['Nursery', 'LKG', 'UKG', ...Array.from({ length: 12 }, (_, i) => String(i + 1))]
  return (
    <>
      <Header title={t('pf.editProfile')} />
      <div className="mt-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] font-semibold text-ink-2">{t('pf.avatar')}</span>
          <div className="flex gap-2.5" role="radiogroup" aria-label={t('pf.avatar')}>
            {AVATARS.map((c, i) => (
              <motion.button key={c} role="radio" aria-checked={p.avatar === i} aria-label={`${t('pf.avatar')} ${i + 1}`} whileTap={{ scale: 0.9 }} onClick={() => setP({ ...p, avatar: i })} className={clsx('grid size-11 place-items-center rounded-full text-sm font-bold', c, p.avatar === i && 'ring-[3px] ring-sky ring-offset-2 ring-offset-bg')}>{initials(p.name)}</motion.button>
            ))}
          </div>
        </div>
        <Input label={t('ob.name')} value={p.name} error={err.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        <Input label={t('ob.age')} type="number" inputMode="numeric" min={3} max={19} value={p.age} error={err.age} onChange={(e) => setP({ ...p, age: Number(e.target.value) })} />
        <Options label={t('ob.gender')} value={p.gender || 'na'} onChange={(g) => setP({ ...p, gender: g === 'na' ? '' : g })} options={[{ id: 'girl', label: t('ob.girl') }, { id: 'boy', label: t('ob.boy') }, { id: 'other', label: t('ob.other') }, { id: 'na', label: t('ob.skip') }]} />
        <Select label={t('ob.class')} value={p.cls} onChange={(cls) => setP({ ...p, cls })} options={classes.map((c) => ({ id: c, label: CLASS_NAMES[c] ? tx(CLASS_NAMES[c]) : `${t('ob.class')} ${c}` }))} />
        <div className="flex flex-col gap-1.5"><span className="text-[12.5px] font-semibold text-ink-2">{t('ob.division')}</span><Segmented label={t('ob.division')} value={p.div} onChange={(div) => setP({ ...p, div })} options={['A', 'B', 'C', 'D'].map((x) => ({ id: x, label: x }))} /></div>
        <Button size="lg" block onClick={save}>{t('c.save')}</Button>
      </div>
    </>
  )
}

const NOTIF_KEYS = ['homework', 'exams', 'diary', 'events', 'fees', 'achievements'] as const

export function Settings() {
  const { t } = useI18n()
  const s = useApp((x) => x.settings)
  const setSettings = useApp((x) => x.setSettings)
  const update = useApp((x) => x.update)
  const reset = useApp((x) => x.reset)
  const [ask, setAsk] = useState<'out' | 'reset'>()
  const move = (w: WidgetId, dir: -1 | 1) => {
    const arr = [...s.widgets]
    const i = arr.indexOf(w), j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setSettings({ widgets: arr })
  }
  const toggleQuick = (q: QuickId) => {
    if (s.quick.includes(q)) setSettings({ quick: s.quick.filter((x) => x !== q) })
    else if (s.quick.length < 4) setSettings({ quick: [...s.quick, q] })
  }
  return (
    <>
      <Header title={t('set.title')} />
      <Section title={t('set.general')}>
        <Card className="flex flex-col gap-4 p-4">
          <Select label={t('set.language')} value={s.lang} onChange={(lang) => setSettings({ lang })} options={(['en', 'hi', 'mr'] as const).map((l) => ({ id: l, label: LANG_NAMES[l], icon: Globe }))} />
          <Labelled icon={Moon} label={t('set.theme')}><Segmented label={t('set.theme')} value={s.theme} onChange={(theme) => setSettings({ theme })} options={[{ id: 'light', label: t('th.light') }, { id: 'dark', label: t('th.dark') }, { id: 'system', label: t('th.system') }]} /></Labelled>
          <Labelled icon={Type} label={t('set.text')}><Segmented label={t('set.text')} value={s.text} onChange={(text) => setSettings({ text })} options={[{ id: 'md', label: t('set.textMd') }, { id: 'lg', label: t('set.textLg') }]} /></Labelled>
          <Labelled icon={Wand2} label={t('set.motion')}><Segmented label={t('set.motion')} value={s.motion} onChange={(motion) => setSettings({ motion })} options={[{ id: 'system', label: t('set.motionSystem') }, { id: 'reduce', label: t('set.motionReduce') }, { id: 'full', label: t('set.motionFull') }]} /></Labelled>
        </Card>
      </Section>
      <Section title={t('set.notifications')}>
        <Group>
          {NOTIF_KEYS.map((k) => <SwitchRow key={k} title={t(`set.n.${k}` as Key)} checked={s.notif[k]} onChange={(v) => setSettings({ notif: { ...s.notif, [k]: v } })} icon={<Tile icon={Bell} size={28} />} />)}
          <SwitchRow title={t('set.quiet')} checked={s.quiet} onChange={(quiet) => setSettings({ quiet })} icon={<Tile icon={Moon} size={28} />} />
        </Group>
      </Section>
      <Section title={t('set.personalise')}>
        <p className="-mt-1.5 mb-3 text-[13px] text-ink-3">{t('set.widgetsSub')}</p>
        <motion.div layout className="flex flex-col gap-1.5">
          {s.widgets.map((w, i) => (
            <motion.div key={w} layout transition={spring.indicator} className="flex items-center gap-2 rounded-[20px] bg-surface py-1.5 pr-1.5 pl-1 shadow-e1">
              <div className="min-w-0 flex-1"><SwitchRow title={t(`w.${w}` as Key)} checked={!s.hidden.includes(w)} onChange={(on) => setSettings({ hidden: on ? s.hidden.filter((x) => x !== w) : [...s.hidden, w] })} /></div>
              <button disabled={i === 0} onClick={() => move(w, -1)} aria-label={`${t('set.moveUp')}: ${t(`w.${w}` as Key)}`} className="grid size-10 place-items-center rounded-full bg-muted disabled:opacity-35"><ArrowUp className="size-4" /></button>
              <button disabled={i === WIDGETS.length - 1} onClick={() => move(w, 1)} aria-label={`${t('set.moveDown')}: ${t(`w.${w}` as Key)}`} className="grid size-10 place-items-center rounded-full bg-muted disabled:opacity-35"><ArrowDown className="size-4" /></button>
            </motion.div>
          ))}
        </motion.div>
        <p className="mt-5 mb-2.5 text-[13px] font-semibold text-ink-2">{t('set.quickSub')} · {s.quick.length}/4</p>
        <motion.div variants={list} initial="hidden" animate="show" className="flex flex-wrap gap-2">
          {(Object.keys(QUICK) as QuickId[]).map((q) => {
            const on = s.quick.includes(q)
            const Q = QUICK[q]
            return (
              <motion.button key={q} variants={item} whileTap={{ scale: 0.94 }} aria-pressed={on} disabled={!on && s.quick.length >= 4} onClick={() => toggleQuick(q)} className={clsx('flex h-10 items-center gap-2 rounded-full pr-3.5 pl-2 text-[13.5px] font-semibold transition-colors disabled:opacity-40', on ? 'bg-navy text-white dark:bg-royal' : 'bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--border)]')}>
                <Q.icon className="size-4" />{t(Q.label)}
              </motion.button>
            )
          })}
        </motion.div>
      </Section>
      <Section title={t('set.privacy')}>
        <Group>
          <SwitchRow title={t('set.hideMarks')} checked={s.hideMarks} onChange={(hideMarks) => setSettings({ hideMarks })} icon={<Tile icon={Eye} size={28} />} />
          <SwitchRow title={t('set.lock')} checked={s.lock} onChange={(lock) => { useUI.setState({ unlocked: true }); setSettings({ lock }) }} icon={<Tile icon={Lock} size={28} />} />
        </Group>
      </Section>
      <Section title={t('set.account')}>
        <Group>
          <Row icon={LogOut} title={t('set.signOut')} onClick={() => setAsk('out')} />
          <Row icon={RotateCcw} tone="error" title={<span className="text-error-ink">{t('set.reset')}</span>} onClick={() => setAsk('reset')} />
        </Group>
      </Section>
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-ink-3"><Info className="size-4" />{t('set.version', { v: '1.0.0' })}</div>
      <Confirm open={ask === 'out'} onClose={() => setAsk(undefined)} title={t('set.signOutAsk')} body={t('set.signOutBody')} confirm={t('set.signOut')} onConfirm={() => { setAsk(undefined); navigate('/'); useUI.setState({ unlocked: false }); update({ signedIn: false }) }} />
      <Confirm open={ask === 'reset'} onClose={() => setAsk(undefined)} title={t('set.resetAsk')} body={t('set.resetBody')} confirm={t('set.reset')} danger onConfirm={() => { setAsk(undefined); navigate('/'); useUI.setState({ unlocked: false, liveNotif: false }); reset() }} />
    </>
  )
}

function Labelled({ icon: Icon, label, children }: { icon: typeof Moon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2"><Icon className="size-4" />{label}</span>
      {children}
    </div>
  )
}

