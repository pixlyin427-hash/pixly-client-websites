import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { ChevronRight, Megaphone, PenLine, Pin, Send } from 'lucide-react'
import { navigate } from '@/lib/router'
import { item, list, spring } from '@/lib/motion'
import { TODAY, dayKey, sameDay } from '@/lib/date'
import { useI18n, type Key } from '@/i18n'
import { toast, useApp } from '@/store'
import { CLASS_TEACHER } from '@/data/school'
import { AUTO_REPLY, BIRTHDAYS, CHATS, DIARY, NOTICES, type NoticeCat } from '@/data/content'
import { Button, Card, Chip, Group, Header, Row, Tile } from '@/components/core'
import { Chips, Options, Tabs, Textarea } from '@/components/form'
import { Sheet } from '@/components/overlay'
import { EmptyState } from '@/components/data'

type Tab = 'notices' | 'diary' | 'chat' | 'birthdays'

export function Messages() {
  const { t } = useI18n()
  const tab = (useApp((s) => s.tabs.messages) as Tab) ?? 'notices'
  const update = useApp((s) => s.update)
  const read = useApp((s) => s.read)
  const seen = useApp((s) => s.seen)
  const unreadN = NOTICES.filter((n) => !read[`notice:${n.id}`]).length
  const diaryN = DIARY.filter((x) => x.needsSeen && !seen[x.id]).length
  return (
    <>
      <Header title={t('m.messages')} />
      <div className="mt-4">
        <Tabs label={t('m.messages')} value={tab} onChange={(v) => update((s) => ({ tabs: { ...s.tabs, messages: v } }))} options={[{ id: 'notices', label: t('ms.notices'), badge: unreadN }, { id: 'diary', label: t('ms.diary'), badge: diaryN }, { id: 'chat', label: t('ms.chat') }, { id: 'birthdays', label: t('ms.birthdays') }]} />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {tab === 'notices' && <Notices />}
          {tab === 'diary' && <DiaryTab />}
          {tab === 'chat' && <ChatList />}
          {tab === 'birthdays' && <Birthdays />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function Notices() {
  const { t, tx, d } = useI18n()
  const read = useApp((s) => s.read)
  const [cat, setCat] = useState<'all' | NoticeCat>('all')
  const cats: ('all' | NoticeCat)[] = ['all', 'general', 'events', 'fees', 'library']
  const items = NOTICES.filter((n) => cat === 'all' || n.cat === cat).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.getTime() - a.date.getTime())
  return (
    <div className="mt-5">
      <Chips label={t('ms.notices')} value={cat} onChange={setCat} options={cats.map((c) => ({ id: c, label: t(`ms.cat.${c}` as Key) }))} />
      <motion.div layout className="mt-3 flex flex-col gap-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((n) => {
            const unread = !read[`notice:${n.id}`]
            return (
              <motion.button key={n.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/messages/notice/${n.id}`)} className={clsx('flex items-start gap-3 rounded-[22px] p-3.5 text-left', n.pinned ? 'bg-ice' : 'bg-surface shadow-e1')}>
                <Tile icon={n.pinned ? Pin : Megaphone} tone={n.cat === 'events' ? 'coral' : n.pinned ? 'navy' : 'royal'} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="eyebrow text-ink-3">{n.pinned ? t('ms.pinned') : t(`ms.cat.${n.cat}` as Key)} · {d.dm(n.date)}</span>{unread && <span className="size-2 rounded-full bg-royal dark:bg-sky" aria-label={t('c.new')} />}</span>
                  <span className={clsx('mt-0.5 block text-[15px] leading-5 tracking-[-0.012em]', unread ? 'font-semibold' : 'font-medium text-ink-2')}>{tx(n.title)}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-[17px] text-ink-3">{tx(n.body)}</span>
                </span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export function NoticePage({ params }: { params: Record<string, string> }) {
  const { t, tx, d } = useI18n()
  const n = NOTICES.find((x) => x.id === params.id)
  const update = useApp((s) => s.update)
  useEffect(() => {
    if (n) update((s) => ({ read: { ...s.read, [`notice:${n.id}`]: true } }))
  }, [n, update])
  if (!n) return <><Header title={t('ms.notices')} /><EmptyState title={t('c.empty')} /></>
  return (
    <>
      <Header title={tx(n.title)} eyebrow={`${t(`ms.cat.${n.cat}` as Key)} · ${d.day(n.date)}`} />
      <Card className="mt-5 p-5 text-[16px] leading-[25px]">{tx(n.body)}</Card>
      <p className="mt-4 text-[13px] text-ink-3">{t('app.school')} · {d.time(n.date)}</p>
    </>
  )
}

function DiaryTab() {
  const { t, tx, d } = useI18n()
  const seen = useApp((s) => s.seen)
  const replies = useApp((s) => s.replies)
  const notes = useApp((s) => s.notes)
  const update = useApp((s) => s.update)
  const [reply, setReply] = useState<string>()
  const [text, setText] = useState('')
  const [note, setNote] = useState(false)
  const [type, setType] = useState<'absence' | 'pe' | 'other'>('absence')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState<string>()
  const sendReply = () => {
    if (!reply || text.trim().length < 2) return
    update((s) => ({ replies: { ...s.replies, [reply]: [...(s.replies[reply] ?? []), { me: true, text: text.trim(), time: Date.now() }] } }))
    toast(t('ms.replySent'))
    setText('')
    setReply(undefined)
  }
  const sendNote = () => {
    if (msg.trim().length < 3) return setErr(t('ms.noteErr'))
    update((s) => ({ notes: [{ id: `n-${Date.now()}`, type, text: msg.trim(), time: Date.now() }, ...s.notes] }))
    toast(t('ms.noteSent', { t: tx(CLASS_TEACHER) }))
    setMsg('')
    setErr(undefined)
    setNote(false)
  }
  const TYPE_LABEL: Record<typeof type, Key> = { absence: 'ms.noteAbsence', pe: 'ms.notePe', other: 'ms.noteOther' }
  return (
    <div className="mt-5">
      <Button variant="tonal" icon={PenLine} onClick={() => setNote(true)}>{t('ms.newNote')}</Button>
      <motion.div variants={list} initial="hidden" animate="show" className="mt-4 flex flex-col gap-4">
        {DIARY.map((x) => {
          const isSeen = !x.needsSeen || !!seen[x.id]
          return (
            <motion.div key={x.id} variants={item} className="grid grid-cols-[40px_1fr] items-start gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-ice text-[13px] font-bold text-link">{x.initials}</span>
              <div className="rounded-[6px_24px_24px_24px] bg-surface px-4 py-3.5 shadow-e1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b className="text-[13.5px] font-semibold">{tx(x.who)} · {tx(x.role)}</b>
                  {x.needsSeen && !seen[x.id] ? <Chip tone="warning" dot>{t('ms.needsSeen')}</Chip> : <span className="eyebrow text-ink-3">{d.dm(x.time)}</span>}
                </div>
                <p className="mt-2 text-[15px] leading-[22px]">{tx(x.text)}</p>
                {(replies[x.id] ?? []).map((r) => (
                  <p key={r.time} className="mt-2 ml-6 rounded-[18px_6px_18px_18px] bg-royal px-3.5 py-2 text-[14px] text-white">{r.text}</p>
                ))}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {x.needsSeen && (
                    <motion.button layout disabled={isSeen} whileTap={isSeen ? undefined : { scale: 0.96 }} onClick={() => { update((s) => ({ seen: { ...s.seen, [x.id]: Date.now() } })); toast(t('ms.seenToast', { t: tx(x.who) })) }} className={clsx('h-10 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-300', isSeen ? 'bg-teal-soft text-teal-ink' : 'bg-royal text-white')}>
                      {isSeen ? `✓ ${t('ms.seenAt', { t: d.time(seen[x.id]) })}` : t('ms.markSeen')}
                    </motion.button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setReply(x.id)}>{t('ms.reply')}</Button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
      {notes.length > 0 && (
        <>
          <h2 className="eyebrow mt-8 mb-2.5 text-ink-3">{t('ms.yourNotes')}</h2>
          <Group>
            {notes.map((n) => <Row key={n.id} icon={PenLine} title={t(TYPE_LABEL[n.type])} meta={`${n.text} · ${d.dm(new Date(n.time))}`} />)}
          </Group>
        </>
      )}
      <Sheet open={!!reply} onClose={() => setReply(undefined)} title={t('ms.reply')} description={reply ? tx(DIARY.find((x) => x.id === reply)!.text) : undefined}>
        <Textarea label={t('ms.noteText')} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('ms.replyPlaceholder')} />
        <Button size="lg" block className="mt-4" icon={Send} disabled={text.trim().length < 2} onClick={sendReply}>{t('c.send')}</Button>
      </Sheet>
      <Sheet open={note} onClose={() => setNote(false)} title={t('ms.newNote')} description={tx(CLASS_TEACHER)}>
        <div className="flex flex-col gap-4">
          <Options label={t('ms.noteType')} value={type} onChange={setType} options={(['absence', 'pe', 'other'] as const).map((k) => ({ id: k, label: t(TYPE_LABEL[k]) }))} />
          <Textarea label={t('ms.noteText')} value={msg} error={err} onChange={(e) => setMsg(e.target.value)} />
          <Button size="lg" block icon={Send} onClick={sendNote}>{t('c.send')}</Button>
        </div>
      </Sheet>
    </div>
  )
}

function useThread(id: string) {
  const extra = useApp((s) => s.chats[id])
  const chat = CHATS.find((c) => c.id === id)
  return chat ? [...chat.msgs.map((m) => ({ ...m, time: m.time.getTime() })), ...(extra ?? [])] : []
}

function ChatList() {
  const { tx, d } = useI18n()
  const all = useApp((s) => s.chats)
  return (
    <motion.div variants={list} initial="hidden" animate="show" className="mt-5 flex flex-col gap-2">
      {CHATS.map((c) => {
        const msgs = [...c.msgs.map((m) => ({ ...m, time: m.time.getTime() })), ...(all[c.id] ?? [])]
        const last = msgs[msgs.length - 1]
        return (
          <motion.button key={c.id} variants={item} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/messages/chat/${c.id}`)} className="flex items-center gap-3 rounded-[22px] bg-surface p-3 text-left shadow-e1">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ice text-sm font-bold text-link">{c.initials}</span>
            <span className="min-w-0 flex-1">
              <span className="flex justify-between gap-2"><b className="text-[15px] font-semibold">{tx(c.who)}</b><span className="text-xs text-ink-3">{sameDay(new Date(last.time), TODAY) ? d.time(last.time) : d.dm(new Date(last.time))}</span></span>
              <span className="block text-xs text-ink-3">{tx(c.role)}</span>
              <span className="mt-0.5 block truncate text-[13px] text-ink-2">{tx(last.text)}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-ink-3" />
          </motion.button>
        )
      })}
    </motion.div>
  )
}

export function Chat({ params }: { params: Record<string, string> }) {
  const { t, tx, d } = useI18n()
  const chat = CHATS.find((c) => c.id === params.id)
  const msgs = useThread(params.id)
  const update = useApp((s) => s.update)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs.length, typing])
  if (!chat) return <><Header title={t('ms.chat')} /><EmptyState title={t('c.empty')} /></>
  const add = (me: boolean, body: string) => update((s) => ({ chats: { ...s.chats, [chat.id]: [...(s.chats[chat.id] ?? []), { me, text: body, time: Date.now() }] } }))
  const send = () => {
    const body = text.trim()
    if (!body) return
    add(true, body)
    setText('')
    setTyping(true)
    setTimeout(() => { setTyping(false); add(false, tx(AUTO_REPLY)) }, 2000)
  }
  return (
    <>
      <Header title={tx(chat.who)} sub={tx(chat.role)} />
      <p className="mt-3 text-center text-xs text-ink-3">{t('ms.replyHours')}</p>
      <div className="mt-4 flex flex-col gap-2 pb-24">
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div key={`${m.time}-${i}`} layout initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring.sheet} className={clsx('flex max-w-[82%] flex-col', m.me ? 'items-end self-end' : 'items-start')}>
              <span className={clsx('px-4 py-2.5 text-[15px] leading-[21px]', m.me ? 'rounded-[20px_6px_20px_20px] bg-royal text-white' : 'rounded-[6px_20px_20px_20px] bg-surface shadow-e1')}>{tx(m.text)}</span>
              <span className="mt-1 px-1 text-[11px] text-ink-3">{sameDay(new Date(m.time), TODAY) ? d.time(m.time) : `${d.dm(new Date(m.time))} · ${d.time(m.time)}`}</span>
            </motion.div>
          ))}
          {typing && (
            <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-1 self-start rounded-[6px_20px_20px_20px] bg-surface px-4 py-3.5 shadow-e1" aria-hidden>
              {[0, 1, 2].map((k) => <motion.i key={k} className="size-2 rounded-full bg-ink-3" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: k * 0.15 }} />)}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send() }} className="fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-[560px] gap-2 px-4 md:bottom-6 md:pl-[104px] xl:pl-[280px]">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('ms.typeMessage')} aria-label={t('ms.typeMessage')} className="h-12 min-w-0 flex-1 rounded-full bg-surface px-5 text-[15px] shadow-e2 outline-none focus:shadow-[inset_0_0_0_2px_var(--color-royal),var(--e2)]" />
        <motion.button whileTap={{ scale: 0.9 }} type="submit" disabled={!text.trim()} aria-label={t('c.send')} className="grid size-12 shrink-0 place-items-center rounded-full bg-royal text-white shadow-e2 disabled:opacity-45"><Send className="size-5" /></motion.button>
      </form>
    </>
  )
}

function Birthdays() {
  const { t, tx, d } = useI18n()
  const wished = useApp((s) => s.wished)
  const update = useApp((s) => s.update)
  return (
    <motion.div variants={list} initial="hidden" animate="show" className="mt-5 flex flex-col gap-2">
      {BIRTHDAYS.map((b) => {
        const k = `${dayKey(b.date)}:${b.initials}`
        const today = sameDay(b.date, TODAY)
        return (
          <motion.div key={k} variants={item} className="flex items-center gap-3 rounded-[22px] bg-surface p-3 shadow-e1">
            <span className={clsx('grid size-12 shrink-0 place-items-center rounded-full text-sm font-bold', today ? 'bg-coral text-navy' : 'bg-muted text-ink-2')}>{b.initials}</span>
            <span className="min-w-0 flex-1"><b className="block text-[15px] font-semibold">{tx(b.name)}</b><span className="text-[12.5px] text-ink-3">{today ? t('h.bdayToday') : d.day(b.date)}</span></span>
            {today && <Button size="sm" variant={wished[k] ? 'tonal' : 'outline'} disabled={!!wished[k]} onClick={() => { update((s) => ({ wished: { ...s.wished, [k]: true } })); toast(t('h.wishToast', { n: tx(b.name) })) }}>{wished[k] ? `✓ ${t('h.wished')}` : t('h.wish')}</Button>}
          </motion.div>
        )
      })}
    </motion.div>
  )
}
