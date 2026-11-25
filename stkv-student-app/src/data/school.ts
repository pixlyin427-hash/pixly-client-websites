import type { LucideIcon } from 'lucide-react'
import { BookOpen, Calculator, FlaskConical, Globe, Languages, Library, Monitor, Palette, PenLine, Dumbbell } from 'lucide-react'
import { TODAY, isSchoolDay, nextSchoolDay, sameDay } from '@/lib/date'

export type Txt = { en: string; hi: string; mr: string }
export const T = (en: string, hi: string, mr: string): Txt => ({ en, hi, mr })

export type SubjectId = 'eng' | 'hin' | 'mar' | 'mat' | 'sci' | 'sst' | 'art' | 'pe' | 'lib' | 'comp'

type Subject = { name: Txt; short: Txt; teacher: Txt; room: Txt; icon: LucideIcon; now: Txt; pages: string; academic: boolean }

const ROOM = T('Room 12', 'कक्ष 12', 'वर्ग 12')

export const SUBJECTS: Record<SubjectId, Subject> = {
  eng: { name: T('English', 'अंग्रेज़ी', 'इंग्रजी'), short: T('Eng', 'अंग्रे.', 'इंग्र.'), teacher: T('Mrs. Joshi', 'श्रीमती जोशी', 'सौ. जोशी'), room: ROOM, icon: BookOpen, now: T('Unit 3 · Poems of nature', 'इकाई 3 · प्रकृति की कविताएँ', 'घटक 3 · निसर्ग कविता'), pages: '41–58', academic: true },
  hin: { name: T('Hindi', 'हिंदी', 'हिंदी'), short: T('Hin', 'हिंदी', 'हिंदी'), teacher: T('Mrs. Shah', 'श्रीमती शाह', 'सौ. शाह'), room: ROOM, icon: Languages, now: T('Lesson 5 · Kabir’s dohe', 'पाठ 5 · कबीर के दोहे', 'पाठ 5 · कबीराचे दोहे'), pages: '41–52', academic: true },
  mar: { name: T('Marathi', 'मराठी', 'मराठी'), short: T('Mar', 'मराठी', 'मराठी'), teacher: T('Mrs. Patil', 'श्रीमती पाटील', 'सौ. पाटील'), room: ROOM, icon: PenLine, now: T('Lesson 6 · New words', 'पाठ 6 · नए शब्द', 'पाठ 6 · नवे शब्द'), pages: '30–36', academic: true },
  mat: { name: T('Mathematics', 'गणित', 'गणित'), short: T('Maths', 'गणित', 'गणित'), teacher: T('Mr. Desai', 'श्री देसाई', 'श्री. देसाई'), room: ROOM, icon: Calculator, now: T('Ch 4 · Simple equations', 'अध्याय 4 · सरल समीकरण', 'प्रकरण 4 · साधी समीकरणे'), pages: '52–58', academic: true },
  sci: { name: T('Science', 'विज्ञान', 'विज्ञान'), short: T('Sci', 'विज्ञान', 'विज्ञान'), teacher: T('Mr. Kulkarni', 'श्री कुलकर्णी', 'श्री. कुलकर्णी'), room: T('Lab 2', 'प्रयोगशाला 2', 'प्रयोगशाळा 2'), icon: FlaskConical, now: T('Ch 5 · Water: a precious resource', 'अध्याय 5 · जल: एक बहुमूल्य संसाधन', 'प्रकरण 5 · पाणी: एक मौल्यवान संसाधन'), pages: '61–70', academic: true },
  sst: { name: T('Social Science', 'सामाजिक विज्ञान', 'सामाजिक शास्त्र'), short: T('SSt', 'सा. वि.', 'सा. शा.'), teacher: T('Mr. Iyer', 'श्री अय्यर', 'श्री. अय्यर'), room: ROOM, icon: Globe, now: T('Ch 3 · Delhi Sultans', 'अध्याय 3 · दिल्ली के सुल्तान', 'प्रकरण 3 · दिल्लीचे सुलतान'), pages: '28–39', academic: true },
  art: { name: T('Art', 'कला', 'कला'), short: T('Art', 'कला', 'कला'), teacher: T('Mr. Naik', 'श्री नाइक', 'श्री. नाईक'), room: T('Art room', 'कला कक्ष', 'कला दालन'), icon: Palette, now: T('Warli patterns', 'वारली चित्रकला', 'वारली चित्रकला'), pages: '—', academic: false },
  pe: { name: T('Physical Education', 'शारीरिक शिक्षा', 'शारीरिक शिक्षण'), short: T('PE', 'खेल', 'खेळ'), teacher: T('Mr. Pawar', 'श्री पवार', 'श्री. पवार'), room: T('Ground', 'मैदान', 'मैदान'), icon: Dumbbell, now: T('Relay practice', 'रिले अभ्यास', 'रिले सराव'), pages: '—', academic: false },
  lib: { name: T('Library', 'पुस्तकालय', 'ग्रंथालय'), short: T('Lib', 'पुस्त.', 'ग्रंथा.'), teacher: T('Mrs. Gokhale', 'श्रीमती गोखले', 'सौ. गोखले'), room: T('Library', 'पुस्तकालय', 'ग्रंथालय'), icon: Library, now: T('Reading hour', 'पठन घंटा', 'वाचन तास'), pages: '—', academic: false },
  comp: { name: T('Computer', 'कंप्यूटर', 'संगणक'), short: T('Comp', 'कंप्यू.', 'संगणक'), teacher: T('Mr. Shaikh', 'श्री शेख', 'श्री. शेख'), room: T('Computer lab', 'कंप्यूटर लैब', 'संगणक कक्ष'), icon: Monitor, now: T('Spreadsheets basics', 'स्प्रेडशीट की मूल बातें', 'स्प्रेडशीटची मूलतत्त्वे'), pages: '—', academic: false },
}

export const ACADEMIC = ['eng', 'hin', 'mar', 'mat', 'sci', 'sst'] as const satisfies readonly SubjectId[]
export const CLASS_TEACHER = SUBJECTS.eng.teacher

/** Period slots in minutes since midnight. Recess 9:30–9:50 falls between periods 3 and 4. */
export const SLOTS: [number, number][] = [[450, 490], [490, 530], [530, 570], [590, 630], [630, 670], [670, 710], [710, 750], [750, 790]]

const WEEK: Record<number, SubjectId[]> = {
  1: ['mat', 'eng', 'sci', 'hin', 'sst', 'mar', 'pe', 'lib'],
  2: ['eng', 'mat', 'hin', 'sci', 'mar', 'sst', 'comp', 'art'],
  3: ['sci', 'eng', 'mat', 'hin', 'pe', 'sst', 'mar', 'comp'],
  4: ['mat', 'sci', 'eng', 'mar', 'hin', 'art', 'sst', 'lib'],
  5: ['eng', 'hin', 'mat', 'sci', 'sst', 'mar', 'comp', 'pe'],
  6: ['mat', 'eng', 'sci', 'hin'],
}

export type Change = 'moved' | 'test' | 'uniform' | 'cancelled'
export type Period = { n: number; subj: SubjectId; start: number; end: number; change?: Change }

export const TOMORROW = nextSchoolDay(TODAY)

/** Tomorrow's plan as published by the class teacher: Art moved up, Hindi test, PE in house T-shirts, last period cancelled for PTM. */
const TOMORROW_PLAN: SubjectId[] = ['eng', 'art', 'hin', 'pe', 'sci', 'mar', 'mat', 'comp']
const CHANGES: Record<number, Change> = { 2: 'moved', 3: 'test', 4: 'uniform', 8: 'cancelled' }

export const CHANGE_INFO: Record<Change, Txt> = {
  moved: T('Moved here from period 8. Bring your sketchbook and pastels.', 'पीरियड 8 से यहाँ आया है। स्केचबुक और पेस्टल लाएँ।', 'तासिका 8 मधून इथे हलवली. स्केचबुक आणि पेस्टल आणा.'),
  test: T('Class test on Lesson 5, pages 41–52.', 'पाठ 5 पर कक्षा परीक्षा, पृष्ठ 41–52।', 'पाठ 5 वर वर्ग चाचणी, पाने 41–52.'),
  uniform: T('Wear your house T-shirt and white track pants.', 'हाउस टी-शर्ट और सफ़ेद ट्रैक पैंट पहनें।', 'हाउस टी-शर्ट आणि पांढरी ट्रॅक पँट घाला.'),
  cancelled: T('Cancelled. School ends at 12:30 for the parent–teacher meeting.', 'रद्द। अभिभावक-शिक्षक बैठक के कारण छुट्टी 12:30 बजे।', 'रद्द. पालक-शिक्षक सभेसाठी शाळा 12:30 ला सुटेल.'),
}

export function periodsFor(d: Date): Period[] {
  if (!isSchoolDay(d)) return []
  const plan = sameDay(d, TOMORROW) ? TOMORROW_PLAN : WEEK[d.getDay()]
  return WEEK[d.getDay()].map((_, i) => ({ n: i + 1, subj: plan[i], start: SLOTS[i][0], end: SLOTS[i][1], change: sameDay(d, TOMORROW) ? CHANGES[i + 1] : undefined }))
}
