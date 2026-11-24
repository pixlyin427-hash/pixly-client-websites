import { useEffect, type ComponentType } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { match, navigate, useRoute } from '@/lib/router'
import { page } from '@/lib/motion'
import { useApp, useUI } from '@/store'
import { useI18n } from '@/i18n'
import { Shell, ScrollRestore } from '@/components/shell'
import { Celebration, Toaster } from '@/components/overlay'
import { Auth, LockScreen, Onboarding } from '@/screens/auth'
import { Home } from '@/screens/home'
import { AllFeatures, LearnHub, SchoolHub } from '@/screens/hubs'
import { Notifications, Search } from '@/screens/inbox'
import { Timetable } from '@/screens/timetable'
import { Classroom, SubjectPage } from '@/screens/classroom'
import { Focus, Homework, HomeworkDetail } from '@/screens/homework'
import { Dictation, Recall, Study } from '@/screens/study'
import { Exams, Quiz, TestReady } from '@/screens/exams'
import { Progress } from '@/screens/progress'
import { Attendance } from '@/screens/attendance'
import { Chat, Messages, NoticePage } from '@/screens/messages'
import { NewRequest, Requests } from '@/screens/requests'
import { Fees } from '@/screens/fees'
import { Achievements } from '@/screens/achievements'
import { Wellbeing } from '@/screens/wellbeing'
import { Ride } from '@/screens/ride'
import { EditProfile, IdCard, Profile, Settings } from '@/screens/profile'

type Screen = ComponentType<{ params: Record<string, string> }>
const ROUTES: [string, Screen][] = [
  ['/', Home], ['/learn', LearnHub], ['/school', SchoolHub], ['/achievements', Achievements], ['/profile', Profile],
  ['/features', AllFeatures], ['/notifications', Notifications], ['/search', Search],
  ['/timetable', Timetable], ['/classroom', Classroom], ['/classroom/:id', SubjectPage],
  ['/homework', Homework], ['/homework/focus', Focus], ['/homework/:id', HomeworkDetail],
  ['/study', Study], ['/study/recall', Recall], ['/study/dictation', Dictation],
  ['/exams', Exams], ['/exams/quiz', Quiz], ['/exams/:id', TestReady],
  ['/progress', Progress], ['/attendance', Attendance],
  ['/messages', Messages], ['/messages/notice/:id', NoticePage], ['/messages/chat/:id', Chat],
  ['/requests', Requests], ['/requests/new', NewRequest], ['/fees', Fees],
  ['/wellbeing', Wellbeing], ['/ride', Ride],
  ['/id', IdCard], ['/settings', Settings], ['/profile/edit', EditProfile],
]

function Router() {
  const { path, dir, key } = useRoute()
  let found: [Screen, Record<string, string>] | null = null
  for (const [pattern, C] of ROUTES) {
    const p = match(pattern, path)
    if (p) { found = [C, p]; break }
  }
  useEffect(() => { if (!found) navigate('/') }, [found])
  if (!found) return null
  const [C, params] = found
  return (
    <AnimatePresence mode="wait" custom={dir} initial={false}>
      <motion.div key={key} custom={dir} variants={page} initial="initial" animate="animate" exit="exit">
        <ScrollRestore path={path} dir={dir} />
        <C params={params} />
      </motion.div>
    </AnimatePresence>
  )
}

function useDocumentSettings() {
  const { theme, lang, text } = useApp((s) => s.settings)
  const { t } = useI18n()
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0A1730' : '#142B50')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dataset.text = text
    document.title = t('app.name')
  }, [lang, text, t])
}

export default function App() {
  const signedIn = useApp((s) => s.signedIn)
  const onboarded = useApp((s) => s.onboarded)
  const lock = useApp((s) => s.settings.lock)
  const motionPref = useApp((s) => s.settings.motion)
  const unlocked = useUI((s) => s.unlocked)
  useDocumentSettings()
  return (
    <MotionConfig reducedMotion={motionPref === 'reduce' ? 'always' : motionPref === 'full' ? 'never' : 'user'}>
      {!signedIn ? <Auth /> : !onboarded ? <Onboarding /> : lock && !unlocked ? <LockScreen /> : <Shell><Router /></Shell>}
      <Toaster />
      <Celebration />
    </MotionConfig>
  )
}
