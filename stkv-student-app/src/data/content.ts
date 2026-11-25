import { TODAY, addDays, dayKey, isSchoolDay, nextSchoolDay, prevSchoolDay } from '@/lib/date'
import { T, TOMORROW, type SubjectId, type Txt } from './school'

const at = (d: Date, h: number, m = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
/** Minutes before the app opened, so "today" items are never in the future. */
const ago = (mins: number) => new Date(Date.now() - mins * 60_000)

/* ---------------- Homework ---------------- */
export type Homework = { id: string; subj: SubjectId; title: Txt; desc: Txt; due: Date; mins: number; tonight?: number; kind: 'written' | 'project' | 'reading'; submitted?: Date }
export const HOMEWORK: Homework[] = [
  { id: 'hw-mat', subj: 'mat', title: T('Exercise 4.2, questions 1–8', 'अभ्यास 4.2, प्रश्न 1–8', 'स्वाध्याय 4.2, प्रश्न 1–8'), desc: T('Solve in your homework notebook. Show every step, as in class.', 'होमवर्क कॉपी में हल करें। कक्षा की तरह हर चरण लिखें।', 'गृहपाठ वहीत सोडवा. वर्गात शिकवल्याप्रमाणे प्रत्येक पायरी लिहा.'), due: TOMORROW, mins: 25, kind: 'written' },
  { id: 'hw-mar', subj: 'mar', title: T('Worksheet 6, new words', 'वर्कशीट 6, नए शब्द', 'कार्यपत्रिका 6, नवे शब्द'), desc: T('Write the meaning of each word and use it in a sentence.', 'हर शब्द का अर्थ लिखें और वाक्य में प्रयोग करें।', 'प्रत्येक शब्दाचा अर्थ लिहा आणि वाक्यात उपयोग करा.'), due: TOMORROW, mins: 15, kind: 'written' },
  { id: 'hw-sci', subj: 'sci', title: T('Water-cycle model, part 2 of 4', 'जल-चक्र मॉडल, भाग 2 / 4', 'जलचक्र प्रतिकृती, भाग 2 / 4'), desc: T('Build the clouds and rain section. Use cotton, thread and blue paper. 20 minutes tonight is enough.', 'बादल और वर्षा वाला भाग बनाएँ। रुई, धागा और नीला कागज़ लें। आज रात 20 मिनट काफ़ी हैं।', 'ढग आणि पाऊस हा भाग बनवा. कापूस, दोरा आणि निळा कागद वापरा. आज रात्री 20 मिनिटे पुरेशी आहेत.'), due: nextSchoolDay(TODAY, 3), mins: 80, tonight: 20, kind: 'project' },
  { id: 'hw-eng', subj: 'eng', title: T('Essay: My favourite festival', 'निबंध: मेरा प्रिय त्योहार', 'निबंध: माझा आवडता सण'), desc: T('150 words. Describe what your family does and why you enjoy it.', '150 शब्द। परिवार क्या करता है और आपको क्यों पसंद है, लिखें।', '150 शब्द. कुटुंब काय करते आणि तुम्हाला का आवडतो ते लिहा.'), due: nextSchoolDay(TODAY, 2), mins: 30, kind: 'written' },
  { id: 'hw-sst', subj: 'sst', title: T('Map work: rivers of India', 'मानचित्र कार्य: भारत की नदियाँ', 'नकाशा काम: भारतातील नद्या'), desc: T('Mark eight major rivers on the outline map.', 'रूपरेखा मानचित्र पर आठ प्रमुख नदियाँ दिखाएँ।', 'आराखडा नकाशावर आठ प्रमुख नद्या दाखवा.'), due: prevSchoolDay(TODAY), mins: 25, kind: 'written', submitted: at(prevSchoolDay(TODAY, 2), 19, 40) },
  { id: 'hw-hin', subj: 'hin', title: T('Read Lesson 5 aloud twice', 'पाठ 5 दो बार ज़ोर से पढ़ें', 'पाठ 5 दोनदा मोठ्याने वाचा'), desc: T('Practise reading the dohe with the right pauses.', 'सही विराम के साथ दोहे पढ़ने का अभ्यास करें।', 'योग्य विरामांसह दोहे वाचण्याचा सराव करा.'), due: prevSchoolDay(TODAY), mins: 15, kind: 'reading', submitted: at(prevSchoolDay(TODAY), 18, 5) },
]
export const OWN_TASK_SEED = { id: 'own-sign', title: T('Get Hindi test paper signed', 'हिंदी टेस्ट पेपर पर हस्ताक्षर करवाएँ', 'हिंदी चाचणी पेपरवर सही घ्या'), mins: 2 }

export const NOTEBOOK = [
  { id: 'nb-sci', subj: 'sci' as SubjectId, note: T('Copy the water-cycle notes into your classwork book', 'जल-चक्र के नोट्स कक्षा-कार्य कॉपी में लिखें', 'जलचक्राच्या नोंदी वर्गकार्य वहीत लिहा') },
  { id: 'nb-mat', subj: 'mat' as SubjectId, note: T('3 corrections on page 34', 'पृष्ठ 34 पर 3 सुधार', 'पान 34 वर 3 दुरुस्त्या') },
  { id: 'nb-eng', subj: 'eng' as SubjectId, note: T('Complete. Neat work!', 'पूर्ण। सुंदर काम!', 'पूर्ण. नीटनेटके काम!'), complete: true },
]

/* ---------------- Exams ---------------- */
export type Exam = { id: string; subj: SubjectId; title: Txt; date: Date; portions: Txt[]; format: Txt; marks: number }
export const EXAMS: Exam[] = [
  { id: 'ex-hin', subj: 'hin', title: T('Hindi class test', 'हिंदी कक्षा परीक्षा', 'हिंदी वर्ग चाचणी'), date: at(TOMORROW, 8, 50), portions: [T('Lesson 5: Kabir’s dohe, pages 41–52', 'पाठ 5: कबीर के दोहे, पृष्ठ 41–52', 'पाठ 5: कबीराचे दोहे, पाने 41–52'), T('Word meanings from the lesson', 'पाठ के शब्दार्थ', 'पाठातील शब्दार्थ')], format: T('2 short answers and 1 long answer · 20 marks', '2 लघु उत्तर और 1 दीर्घ उत्तर · 20 अंक', '2 लघु उत्तरे आणि 1 दीर्घ उत्तर · 20 गुण'), marks: 20 },
  { id: 'ex-mat', subj: 'mat', title: T('Maths unit test 4', 'गणित इकाई परीक्षा 4', 'गणित घटक चाचणी 4'), date: at(nextSchoolDay(TODAY, 5), 7, 30), portions: [T('Ch 4: Simple equations', 'अध्याय 4: सरल समीकरण', 'प्रकरण 4: साधी समीकरणे'), T('Ch 5: Lines and angles', 'अध्याय 5: रेखाएँ और कोण', 'प्रकरण 5: रेषा आणि कोन')], format: T('Objective and short answers · 50 marks', 'वस्तुनिष्ठ और लघु उत्तर · 50 अंक', 'वस्तुनिष्ठ आणि लघु उत्तरे · 50 गुण'), marks: 50 },
  { id: 'ex-sci', subj: 'sci', title: T('Science unit test 4', 'विज्ञान इकाई परीक्षा 4', 'विज्ञान घटक चाचणी 4'), date: at(nextSchoolDay(TODAY, 7), 7, 30), portions: [T('Ch 5: Water: a precious resource', 'अध्याय 5: जल', 'प्रकरण 5: पाणी'), T('Ch 6: Weather and climate', 'अध्याय 6: मौसम और जलवायु', 'प्रकरण 6: हवामान')], format: T('Diagrams and short answers · 50 marks', 'आरेख और लघु उत्तर · 50 अंक', 'आकृत्या आणि लघु उत्तरे · 50 गुण'), marks: 50 },
]

export type Report = { id: string; title: Txt; date: Date; scores: Record<'eng' | 'hin' | 'mar' | 'mat' | 'sci' | 'sst', number>; remark: Txt }
export const REPORTS: Report[] = [
  { id: 'ut1', title: T('Unit test 1', 'इकाई परीक्षा 1', 'घटक चाचणी 1'), date: addDays(TODAY, -130), scores: { eng: 84, hin: 82, mar: 78, mat: 76, sci: 79, sst: 87 }, remark: T('A good start. Practise maths daily.', 'अच्छी शुरुआत। रोज़ गणित का अभ्यास करें।', 'चांगली सुरुवात. रोज गणिताचा सराव करा.') },
  { id: 'ut2', title: T('Unit test 2', 'इकाई परीक्षा 2', 'घटक चाचणी 2'), date: addDays(TODAY, -95), scores: { eng: 88, hin: 84, mar: 80, mat: 81, sci: 82, sst: 89 }, remark: T('Steady progress in every subject.', 'हर विषय में लगातार प्रगति।', 'प्रत्येक विषयात सातत्यपूर्ण प्रगती.') },
  { id: 'term1', title: T('Term 1 examination', 'सत्र 1 परीक्षा', 'सत्र 1 परीक्षा'), date: addDays(TODAY, -60), scores: { eng: 87, hin: 80, mar: 81, mat: 78, sci: 84, sst: 88 }, remark: T('Strong writing. Revise maths formulae.', 'लेखन अच्छा है। गणित के सूत्र दोहराएँ।', 'लेखन उत्तम. गणिताची सूत्रे उजळणी करा.') },
  { id: 'ut3', title: T('Unit test 3', 'इकाई परीक्षा 3', 'घटक चाचणी 3'), date: addDays(TODAY, -14), scores: { eng: 91, hin: 76, mar: 82, mat: 86, sci: 88, sst: 90 }, remark: T('Excellent science answers. Give Hindi extra time.', 'विज्ञान के उत्तर उत्कृष्ट। हिंदी को अधिक समय दें।', 'विज्ञानाची उत्तरे उत्कृष्ट. हिंदीला जास्त वेळ द्या.') },
]
export const CLASS_AVG = { eng: 80, hin: 79, mar: 78, mat: 74, sci: 77, sst: 81 }
export const grade = (p: number) => (p >= 91 ? 'A1' : p >= 81 ? 'A2' : p >= 71 ? 'B1' : p >= 61 ? 'B2' : p >= 51 ? 'C1' : p >= 41 ? 'C2' : p >= 33 ? 'D' : 'E')
export const avg = (r: Report) => Math.round(Object.values(r.scores).reduce((a, b) => a + b, 0) / 6)

export type Q = { q: Txt; options: Txt[]; answer: number; subj: SubjectId }
const o = (...x: Txt[]) => x
const same = (s: string) => T(s, s, s)
export const QUIZ: { id: string; title: Txt; minutes: number; questions: Q[] } = {
  id: 'quiz-water',
  title: T('Science practice quiz: Water', 'विज्ञान अभ्यास प्रश्नोत्तरी: जल', 'विज्ञान सराव प्रश्नमंजुषा: पाणी'),
  minutes: 10,
  questions: [
    { subj: 'sci', q: T('Which process turns water vapour into liquid water?', 'कौन-सी प्रक्रिया जलवाष्प को पानी में बदलती है?', 'कोणती प्रक्रिया पाण्याच्या वाफेचे पाण्यात रूपांतर करते?'), options: o(T('Evaporation', 'वाष्पीकरण', 'बाष्पीभवन'), T('Condensation', 'संघनन', 'संघनन'), T('Melting', 'पिघलना', 'वितळणे'), T('Freezing', 'जमना', 'गोठणे')), answer: 1 },
    { subj: 'sci', q: T('About how much of Earth’s water is fresh water?', 'पृथ्वी के पानी का लगभग कितना भाग मीठा पानी है?', 'पृथ्वीवरील पाण्यापैकी साधारण किती पाणी गोडे आहे?'), options: o(same('3%'), same('25%'), same('50%'), same('70%')), answer: 0 },
    { subj: 'sci', q: T('Water stored under the ground is called…', 'ज़मीन के नीचे जमा पानी कहलाता है…', 'जमिनीखाली साठलेल्या पाण्याला म्हणतात…'), options: o(T('Groundwater', 'भूजल', 'भूजल'), T('Rainwater', 'वर्षा जल', 'पावसाचे पाणी'), T('Sea water', 'समुद्री जल', 'समुद्राचे पाणी'), T('Ice', 'बर्फ़', 'बर्फ')), answer: 0 },
    { subj: 'sci', q: T('Which of these saves water at home?', 'इनमें से कौन घर में पानी बचाता है?', 'यापैकी कोणते घरात पाणी वाचवते?'), options: o(T('Leaving taps open', 'नल खुला छोड़ना', 'नळ उघडा ठेवणे'), T('Fixing leaking taps', 'टपकते नल ठीक करना', 'गळके नळ दुरुस्त करणे'), T('Washing cars daily', 'रोज़ कार धोना', 'रोज गाडी धुणे'), T('Long showers', 'लंबा स्नान', 'दीर्घ अंघोळ')), answer: 1 },
    { subj: 'sci', q: T('Collecting rain from rooftops is called…', 'छत से वर्षा जल इकट्ठा करना कहलाता है…', 'छतावरील पावसाचे पाणी साठवणे म्हणजे…'), options: o(T('Irrigation', 'सिंचाई', 'सिंचन'), T('Rainwater harvesting', 'वर्षा जल संचयन', 'पर्जन्य जलसंधारण'), T('Drainage', 'जल निकासी', 'सांडपाणी'), T('Filtration', 'छनन', 'गाळणे')), answer: 1 },
    { subj: 'sci', q: T('Water changes to vapour when it is…', 'पानी वाष्प में बदलता है जब उसे…', 'पाण्याची वाफ होते जेव्हा ते…'), options: o(T('Cooled', 'ठंडा किया जाए', 'थंड केले जाते'), T('Heated', 'गरम किया जाए', 'गरम केले जाते'), T('Stirred', 'हिलाया जाए', 'ढवळले जाते'), T('Filtered', 'छाना जाए', 'गाळले जाते')), answer: 1 },
  ],
}
export const PAST_QUIZ = { title: T('GK quiz: Our India', 'सामान्य ज्ञान: हमारा भारत', 'सामान्य ज्ञान: आपला भारत'), score: 8, total: 10, date: addDays(TODAY, -12) }

export const RECALL: Q[] = [
  { subj: 'sci', q: T('Which gas do plants take in to make food?', 'पौधे भोजन बनाने के लिए कौन-सी गैस लेते हैं?', 'वनस्पती अन्न तयार करण्यासाठी कोणता वायू घेतात?'), options: o(T('Oxygen', 'ऑक्सीजन', 'ऑक्सिजन'), T('Carbon dioxide', 'कार्बन डाइऑक्साइड', 'कार्बन डायऑक्साइड'), T('Nitrogen', 'नाइट्रोजन', 'नायट्रोजन'), T('Hydrogen', 'हाइड्रोजन', 'हायड्रोजन')), answer: 1 },
  { subj: 'mat', q: T('Solve: 3x + 5 = 20', 'हल करें: 3x + 5 = 20', 'सोडवा: 3x + 5 = 20'), options: o(same('x = 3'), same('x = 5'), same('x = 15'), same('x = 25')), answer: 1 },
  { subj: 'hin', q: T('How many lines does a doha have?', 'एक दोहे में कितनी पंक्तियाँ होती हैं?', 'एका दोह्यात किती ओळी असतात?'), options: o(same('1'), same('2'), same('4'), same('6')), answer: 1 },
  { subj: 'sst', q: T('Who began building the Qutb Minar?', 'क़ुतुब मीनार का निर्माण किसने शुरू किया?', 'कुतुबमिनारचे बांधकाम कोणी सुरू केले?'), options: o(T('Akbar', 'अकबर', 'अकबर'), T('Qutbuddin Aibak', 'क़ुतुबुद्दीन ऐबक', 'कुतुबुद्दीन ऐबक'), T('Shah Jahan', 'शाहजहाँ', 'शाहजहान'), T('Babur', 'बाबर', 'बाबर')), answer: 1 },
  { subj: 'eng', q: T('Pick the adverb: “She sings beautifully.”', 'क्रिया-विशेषण चुनें: “She sings beautifully.”', 'क्रियाविशेषण निवडा: “She sings beautifully.”'), options: o(same('She'), same('sings'), same('beautifully'), T('none', 'कोई नहीं', 'काहीही नाही')), answer: 2 },
  { subj: 'mat', q: T('What is 15% of 200?', '200 का 15% कितना है?', '200 चे 15% किती?'), options: o(same('15'), same('20'), same('30'), same('45')), answer: 2 },
  { subj: 'sst', q: T('Which is the largest ocean?', 'सबसे बड़ा महासागर कौन-सा है?', 'सर्वात मोठा महासागर कोणता?'), options: o(T('Indian', 'हिंद', 'हिंदी'), T('Atlantic', 'अटलांटिक', 'अटलांटिक'), T('Pacific', 'प्रशांत', 'पॅसिफिक'), T('Arctic', 'आर्कटिक', 'आर्क्टिक')), answer: 2 },
  { subj: 'sci', q: T('Light travels faster than sound. True or false?', 'प्रकाश ध्वनि से तेज़ चलता है। सही या गलत?', 'प्रकाश ध्वनीपेक्षा वेगाने प्रवास करतो. बरोबर की चूक?'), options: o(T('True', 'सही', 'बरोबर'), T('False', 'गलत', 'चूक')), answer: 0 },
]

export const DICTATION = [
  { word: 'शाळा', meaning: T('school', 'विद्यालय', 'शाळा') },
  { word: 'फुलपाखरू', meaning: T('butterfly', 'तितली', 'फुलपाखरू') },
  { word: 'आकाश', meaning: T('sky', 'आकाश', 'आकाश') },
  { word: 'पाऊस', meaning: T('rain', 'बारिश', 'पाऊस') },
  { word: 'अभ्यास', meaning: T('study', 'पढ़ाई', 'अभ्यास') },
  { word: 'मैत्री', meaning: T('friendship', 'दोस्ती', 'मैत्री') },
]

/* ---------------- Communication ---------------- */
export type NoticeCat = 'general' | 'events' | 'exams' | 'fees' | 'library'
export type Notice = { id: string; cat: NoticeCat; title: Txt; body: Txt; date: Date; pinned?: boolean }
export const NOTICES: Notice[] = [
  { id: 'nt-ptm', cat: 'general', pinned: true, date: at(addDays(TODAY, -1), 15), title: T('Parent–teacher meeting tomorrow', 'कल अभिभावक-शिक्षक बैठक', 'उद्या पालक-शिक्षक सभा'), body: T('School closes at 12:30 tomorrow. Meetings run from 1:00 to 4:00 pm in Room 12. Bus 4 leaves at 12:40.', 'कल स्कूल 12:30 बजे बंद होगा। बैठकें दोपहर 1 से 4 बजे तक कक्ष 12 में होंगी। बस 4, 12:40 पर निकलेगी।', 'उद्या शाळा 12:30 ला सुटेल. सभा दुपारी 1 ते 4 वर्ग 12 मध्ये होतील. बस 4 12:40 ला निघेल.') },
  { id: 'nt-annual', cat: 'events', date: at(addDays(TODAY, -2), 11), title: T('Annual Day auditions are open', 'वार्षिकोत्सव ऑडिशन शुरू', 'वार्षिक स्नेहसंमेलन ऑडिशन सुरू'), body: T('Dance, drama, anchoring and choir. Sign up with your class teacher by Friday. Rehearsals are after school.', 'नृत्य, नाटक, संचालन और गायन। शुक्रवार तक कक्षा शिक्षक के पास नाम दें। अभ्यास स्कूल के बाद होगा।', 'नृत्य, नाटक, सूत्रसंचालन आणि गायन. शुक्रवारपर्यंत वर्गशिक्षकांकडे नाव द्या. सराव शाळेनंतर होईल.') },
  { id: 'nt-trip', cat: 'events', date: ago(400), title: T('Science centre trip: consent needed', 'विज्ञान केंद्र यात्रा: अनुमति ज़रूरी', 'विज्ञान केंद्र सहल: संमती आवश्यक'), body: T('Class 7 visits the science centre next month. Return the signed consent form by Thursday.', 'कक्षा 7 अगले महीने विज्ञान केंद्र जाएगी। हस्ताक्षरित अनुमति पत्र गुरुवार तक लौटाएँ।', 'इयत्ता 7 पुढच्या महिन्यात विज्ञान केंद्राला भेट देईल. सही केलेले संमतीपत्र गुरुवारपर्यंत परत करा.') },
  { id: 'nt-uniform', cat: 'general', date: at(addDays(TODAY, -3), 10), title: T('Winter uniform from 1 December', '1 दिसंबर से शीतकालीन वर्दी', '1 डिसेंबरपासून हिवाळी गणवेश'), body: T('Navy sweaters and full-sleeve shirts are allowed from 1 December.', '1 दिसंबर से नेवी स्वेटर और पूरी बाँह की शर्ट पहन सकते हैं।', '1 डिसेंबरपासून नेव्ही स्वेटर आणि पूर्ण बाह्यांचे शर्ट घालता येतील.') },
  { id: 'nt-library', cat: 'library', date: at(addDays(TODAY, -5), 12), title: T('Library week: read 3 books', 'पुस्तकालय सप्ताह: 3 किताबें पढ़ें', 'ग्रंथालय सप्ताह: 3 पुस्तके वाचा'), body: T('Borrow and finish three books this month to earn the Reader badge.', 'इस महीने तीन किताबें पढ़कर रीडर बैज पाएँ।', 'या महिन्यात तीन पुस्तके वाचून वाचक बॅज मिळवा.') },
  { id: 'nt-fee', cat: 'fees', date: at(addDays(TODAY, -4), 10), title: T('Term 2 fee reminder', 'सत्र 2 शुल्क अनुस्मारक', 'सत्र 2 शुल्क आठवण'), body: T('Term 2 tuition is due in 10 days. Pay from the Fees section.', 'सत्र 2 शिक्षण शुल्क 10 दिनों में देय है। शुल्क विभाग से भुगतान करें।', 'सत्र 2 शिक्षण शुल्क 10 दिवसांत भरायचे आहे. शुल्क विभागातून भरा.') },
]

export type Diary = { id: string; who: Txt; role: Txt; initials: string; text: Txt; time: Date; needsSeen: boolean; attach?: string }
export const DIARY: Diary[] = [
  { id: 'dy-consent', who: T('Mrs. Joshi', 'श्रीमती जोशी', 'सौ. जोशी'), role: T('Class teacher', 'कक्षा शिक्षक', 'वर्गशिक्षिका'), initials: 'SJ', text: T('Please send the signed consent form for the science-centre trip by Thursday.', 'कृपया विज्ञान केंद्र यात्रा का हस्ताक्षरित अनुमति पत्र गुरुवार तक भेजें।', 'कृपया विज्ञान केंद्र सहलीचे सही केलेले संमतीपत्र गुरुवारपर्यंत पाठवा.'), time: ago(30), needsSeen: true, attach: 'Trip-consent-form.pdf' },
  { id: 'dy-notebook', who: T('Mrs. Patil', 'श्रीमती पाटील', 'सौ. पाटील'), role: T('Marathi', 'मराठी', 'मराठी'), initials: 'MP', text: T('Marathi notebook: corrections on page 34 are pending.', 'मराठी कॉपी: पृष्ठ 34 के सुधार बाकी हैं।', 'मराठी वही: पान 34 वरील दुरुस्त्या बाकी आहेत.'), time: at(addDays(TODAY, -1), 13, 20), needsSeen: true },
  { id: 'dy-praise', who: T('Mr. Desai', 'श्री देसाई', 'श्री. देसाई'), role: T('Mathematics', 'गणित', 'गणित'), initials: 'RD', text: T('Excellent explanation of simple equations in class today. Well done!', 'आज कक्षा में सरल समीकरण बहुत अच्छे से समझाए। शाबाश!', 'आज वर्गात साधी समीकरणे उत्तम समजावून सांगितली. छान!'), time: at(addDays(TODAY, -2), 12, 5), needsSeen: false },
]

export type ChatMsg = { me: boolean; text: Txt | string; time: Date }
export const CHATS: { id: string; who: Txt; role: Txt; initials: string; msgs: ChatMsg[] }[] = [
  { id: 'ch-joshi', who: T('Mrs. Joshi', 'श्रीमती जोशी', 'सौ. जोशी'), role: T('Class teacher · English', 'कक्षा शिक्षक · अंग्रेज़ी', 'वर्गशिक्षिका · इंग्रजी'), initials: 'SJ', msgs: [
    { me: false, text: T('Reminder: bring the consent form by Thursday.', 'याद रखें: गुरुवार तक अनुमति पत्र लाएँ।', 'आठवण: गुरुवारपर्यंत संमतीपत्र आणा.'), time: ago(28) },
  ] },
  { id: 'ch-desai', who: T('Mr. Desai', 'श्री देसाई', 'श्री. देसाई'), role: T('Mathematics', 'गणित', 'गणित'), initials: 'RD', msgs: [
    { me: true, text: T('Sir, in question 6 do we show the check step?', 'सर, प्रश्न 6 में जाँच वाला चरण भी लिखें?', 'सर, प्रश्न 6 मध्ये तपासणीची पायरी लिहायची का?'), time: at(addDays(TODAY, -1), 18, 30) },
    { me: false, text: T('Yes. Substitute x back to check. Good question!', 'हाँ। x रखकर जाँचें। अच्छा सवाल!', 'हो. x परत ठेवून तपासा. छान प्रश्न!'), time: at(addDays(TODAY, -1), 19, 2) },
  ] },
  { id: 'ch-kulkarni', who: T('Mr. Kulkarni', 'श्री कुलकर्णी', 'श्री. कुलकर्णी'), role: T('Science', 'विज्ञान', 'विज्ञान'), initials: 'AK', msgs: [
    { me: false, text: T('Project groups are on the notice board. Part 2 is due Friday.', 'प्रोजेक्ट समूह सूचना पट्ट पर हैं। भाग 2 शुक्रवार तक।', 'प्रकल्प गट सूचना फलकावर आहेत. भाग 2 शुक्रवारपर्यंत.'), time: at(addDays(TODAY, -2), 14) },
  ] },
]
export const AUTO_REPLY = T('Thank you. I will check and reply in class tomorrow.', 'धन्यवाद। मैं देखकर कल कक्षा में बताऊँगी।', 'धन्यवाद. मी पाहून उद्या वर्गात सांगेन.')

export const BIRTHDAYS = [
  { name: T('Riya Sharma', 'रिया शर्मा', 'रिया शर्मा'), date: TODAY, initials: 'RS' },
  { name: T('Om Kulkarni', 'ओम कुलकर्णी', 'ओम कुलकर्णी'), date: addDays(TODAY, 2), initials: 'OK' },
  { name: T('Sana Shaikh', 'सना शेख', 'सना शेख'), date: addDays(TODAY, 5), initials: 'SS' },
]

export const DINNER = { q: T('Why do we see lightning before we hear thunder?', 'बिजली पहले दिखती है और गड़गड़ाहट बाद में क्यों सुनाई देती है?', 'वीज आधी दिसते आणि गडगडाट नंतर का ऐकू येतो?'), a: T('Light travels much faster than sound.', 'प्रकाश ध्वनि से बहुत तेज़ चलता है।', 'प्रकाश ध्वनीपेक्षा खूप वेगाने प्रवास करतो.') }

/* ---------------- Calendar ---------------- */
export type EventItem = { id: string; title: Txt; date: Date; place: Txt; going: number; kind: 'event' | 'meeting' }
export const EVENTS: EventItem[] = [
  { id: 'ev-ptm', kind: 'meeting', title: T('Parent–teacher meeting', 'अभिभावक-शिक्षक बैठक', 'पालक-शिक्षक सभा'), date: at(TOMORROW, 13), place: T('Room 12', 'कक्ष 12', 'वर्ग 12'), going: 38 },
  { id: 'ev-rehearsal', kind: 'event', title: T('Annual Day dance rehearsal', 'वार्षिकोत्सव नृत्य अभ्यास', 'स्नेहसंमेलन नृत्य सराव'), date: at(nextSchoolDay(TODAY, 3), 14), place: T('Main hall', 'मुख्य सभागार', 'मुख्य सभागृह'), going: 14 },
  { id: 'ev-quiz', kind: 'event', title: T('Inter-house quiz final', 'अंतर-सदन प्रश्नोत्तरी फ़ाइनल', 'आंतरगृह प्रश्नमंजुषा अंतिम फेरी'), date: at(nextSchoolDay(TODAY, 5), 11), place: T('Auditorium', 'सभागार', 'सभागृह'), going: 120 },
  { id: 'ev-expo', kind: 'event', title: T('Science exhibition', 'विज्ञान प्रदर्शनी', 'विज्ञान प्रदर्शन'), date: at(nextSchoolDay(TODAY, 9), 10), place: T('Labs and corridor', 'प्रयोगशालाएँ और गलियारा', 'प्रयोगशाळा आणि व्हरांडा'), going: 64 },
  { id: 'ev-annual', kind: 'event', title: T('Annual Day', 'वार्षिकोत्सव', 'वार्षिक स्नेहसंमेलन'), date: at(nextSchoolDay(TODAY, 15), 17), place: T('School ground', 'स्कूल मैदान', 'शाळेचे मैदान'), going: 410 },
]

/* ---------------- Attendance (generated, deterministic) ---------------- */
export type Att = 'P' | 'L' | 'A'
const ABSENT = new Set([-8, -40, -77].map((n) => dayKey(addDays(TODAY, n))))
const LATE = new Set([-22, -51, -96].map((n) => dayKey(addDays(TODAY, n))))
export const ACADEMIC_START = addDays(TODAY, -150)
export function attendanceOn(d: Date): { status: Att; arrive?: number } | null {
  if (d > TODAY || d < ACADEMIC_START || !isSchoolDay(d)) return null
  const k = dayKey(d)
  if (ABSENT.has(k)) return { status: 'A' }
  if (LATE.has(k)) return { status: 'L', arrive: 7 * 60 + 38 }
  return { status: 'P', arrive: 7 * 60 + 18 + (d.getDate() % 9) }
}
export const ABSENT_REASON = T('Fever · leave note received', 'बुख़ार · अवकाश पत्र मिला', 'ताप · रजा अर्ज मिळाला')

/* ---------------- Fees ---------------- */
export type Fee = { id: string; title: Txt; amount: number; due: Date; paidOn?: Date; receipt?: string }
export const FEES: Fee[] = [
  { id: 'fee-t2', title: T('Tuition · Term 2', 'शिक्षण शुल्क · सत्र 2', 'शिक्षण शुल्क · सत्र 2'), amount: 14500, due: addDays(TODAY, 10) },
  { id: 'fee-bus', title: T('Transport · this month', 'परिवहन · इस माह', 'वाहतूक · या महिन्याचे'), amount: 1800, due: addDays(TODAY, 5) },
  { id: 'fee-bus-prev', title: T('Transport · last month', 'परिवहन · पिछला माह', 'वाहतूक · मागील महिना'), amount: 1800, due: addDays(TODAY, -25), paidOn: addDays(TODAY, -27), receipt: 'STKV/R/0587' },
  { id: 'fee-t1', title: T('Tuition · Term 1', 'शिक्षण शुल्क · सत्र 1', 'शिक्षण शुल्क · सत्र 1'), amount: 14500, due: addDays(TODAY, -140), paidOn: addDays(TODAY, -143), receipt: 'STKV/R/0412' },
  { id: 'fee-annual', title: T('Annual charges', 'वार्षिक शुल्क', 'वार्षिक शुल्क'), amount: 6000, due: addDays(TODAY, -150), paidOn: addDays(TODAY, -152), receipt: 'STKV/R/0398' },
]

/* ---------------- Library ---------------- */
export type Book = { id: string; title: Txt; author: Txt; due?: Date; onLoan?: boolean }
export const BOOKS: Book[] = [
  { id: 'bk-jungle', title: same('The Jungle Book'), author: T('Rudyard Kipling', 'रुडयार्ड किपलिंग', 'रुडयार्ड किपलिंग'), due: addDays(TODAY, 2) },
  { id: 'bk-wings', title: same('Wings of Fire'), author: T('A. P. J. Abdul Kalam', 'ए. पी. जे. अब्दुल कलाम', 'ए. पी. जे. अब्दुल कलाम'), due: addDays(TODAY, 9) },
  { id: 'bk-malgudi', title: same('Malgudi Days'), author: T('R. K. Narayan', 'आर. के. नारायण', 'आर. के. नारायण') },
  { id: 'bk-umbrella', title: same('The Blue Umbrella'), author: T('Ruskin Bond', 'रस्किन बॉन्ड', 'रस्किन बाँड'), onLoan: true },
  { id: 'bk-shyam', title: T('Shyamchi Aai', 'श्यामची आई', 'श्यामची आई'), author: T('Sane Guruji', 'साने गुरुजी', 'साने गुरुजी') },
  { id: 'bk-idgah', title: T('Idgah and other stories', 'ईदगाह और अन्य कहानियाँ', 'ईदगाह आणि इतर कथा'), author: T('Premchand', 'प्रेमचंद', 'प्रेमचंद') },
  { id: 'bk-panch', title: T('Panchatantra Tales', 'पंचतंत्र की कहानियाँ', 'पंचतंत्रातील गोष्टी'), author: T('Retold', 'पुनर्कथित', 'पुनर्कथन'), onLoan: true },
]

/* ---------------- Achievements ---------------- */
export type BadgeId = 'quiz-ace' | 'perfect-week' | 'bookworm' | 'homework-hero' | 'packed' | 'early-bird' | 'recall-pro' | 'science-star' | 'kind-voice'
export const BADGES: { id: BadgeId; name: Txt; how: Txt; earned?: Date }[] = [
  { id: 'quiz-ace', name: T('Quiz Ace', 'क्विज़ ऐस', 'क्विझ एक्का'), how: T('Top score in the inter-house quiz', 'अंतर-सदन क्विज़ में सर्वोच्च अंक', 'आंतरगृह प्रश्नमंजुषेत सर्वाधिक गुण'), earned: addDays(TODAY, -1) },
  { id: 'perfect-week', name: T('Perfect week', 'परफ़ेक्ट सप्ताह', 'परिपूर्ण आठवडा'), how: T('All homework on time for a week', 'पूरे सप्ताह सारा होमवर्क समय पर', 'आठवडाभर सर्व गृहपाठ वेळेवर'), earned: addDays(TODAY, -6) },
  { id: 'bookworm', name: T('Bookworm', 'पुस्तक प्रेमी', 'पुस्तकप्रेमी'), how: T('Read 10 library books', 'पुस्तकालय की 10 किताबें पढ़ीं', 'ग्रंथालयातील 10 पुस्तके वाचली'), earned: addDays(TODAY, -30) },
  { id: 'homework-hero', name: T('Homework hero', 'होमवर्क हीरो', 'गृहपाठ हिरो'), how: T('Finish 3 homework tasks in the app', 'ऐप में 3 होमवर्क पूरे करें', 'ॲपमध्ये 3 गृहपाठ पूर्ण करा') },
  { id: 'packed', name: T('Ready the night before', 'रात में ही तैयार', 'आदल्या रात्रीच तयार'), how: T('Pack your whole bag from the pack list', 'पैक सूची से पूरा बस्ता तैयार करें', 'यादीतून संपूर्ण दप्तर भरा') },
  { id: 'early-bird', name: T('Early bird', 'समय के पक्के', 'वेळेचे पक्के'), how: T('On time for 20 school days in a row', 'लगातार 20 दिन समय पर', 'सलग 20 दिवस वेळेवर') },
  { id: 'recall-pro', name: T('Recall pro', 'रिकॉल प्रो', 'रिकॉल प्रो'), how: T('Finish Daily Recall on 10 days', '10 दिन डेली रिकॉल पूरा करें', '10 दिवस डेली रिकॉल पूर्ण करा') },
  { id: 'science-star', name: T('Science star', 'विज्ञान सितारा', 'विज्ञान तारा'), how: T('Score 90% or more in a Science test', 'विज्ञान परीक्षा में 90% या अधिक', 'विज्ञान चाचणीत 90% किंवा अधिक') },
  { id: 'kind-voice', name: T('Kind to myself', 'खुद का ख़याल', 'स्वतःची काळजी'), how: T('Check in with your mood on 5 days', '5 दिन अपने मूड की जाँच करें', '5 दिवस मनःस्थिती नोंदवा') },
]
export const BASE_XP = 1240

export type HouseId = 'green' | 'blue' | 'red' | 'yellow'
export const HOUSES: { id: HouseId; name: Txt; points: number }[] = [
  { id: 'green', name: T('Green House', 'ग्रीन हाउस', 'ग्रीन हाउस'), points: 412 },
  { id: 'blue', name: T('Blue House', 'ब्लू हाउस', 'ब्लू हाउस'), points: 378 },
  { id: 'red', name: T('Red House', 'रेड हाउस', 'रेड हाउस'), points: 320 },
  { id: 'yellow', name: T('Yellow House', 'येलो हाउस', 'यलो हाउस'), points: 284 },
]
export const LEAGUE_FEED = [
  { house: 'blue' as HouseId, pts: 20, what: T('Inter-house quiz · Aarav, Class 7', 'अंतर-सदन क्विज़ · आरव, कक्षा 7', 'आंतरगृह प्रश्नमंजुषा · आरव, इयत्ता 7'), date: addDays(TODAY, -1) },
  { house: 'green' as HouseId, pts: 25, what: T('Relay race win · Class 9', 'रिले दौड़ जीत · कक्षा 9', 'रिले शर्यत विजय · इयत्ता 9'), date: addDays(TODAY, -2) },
  { house: 'red' as HouseId, pts: 15, what: T('Drawing contest · Class 4', 'चित्रकला प्रतियोगिता · कक्षा 4', 'चित्रकला स्पर्धा · इयत्ता 4'), date: addDays(TODAY, -3) },
  { house: 'yellow' as HouseId, pts: 10, what: T('Clean-up drive', 'सफ़ाई अभियान', 'स्वच्छता मोहीम'), date: addDays(TODAY, -5) },
]
export const PASSPORT = [
  { date: addDays(TODAY, -1), kind: 'award', title: T('Quiz Ace · inter-house quiz', 'क्विज़ ऐस · अंतर-सदन क्विज़', 'क्विझ एक्का · आंतरगृह प्रश्नमंजुषा') },
  { date: addDays(TODAY, -64), kind: 'award', title: T('2nd place · drawing competition', 'द्वितीय स्थान · चित्रकला प्रतियोगिता', 'दुसरा क्रमांक · चित्रकला स्पर्धा') },
  { date: addDays(TODAY, -98), kind: 'participation', title: T('Science exhibition: solar cooker model', 'विज्ञान प्रदर्शनी: सौर कुकर मॉडल', 'विज्ञान प्रदर्शन: सौर कुकर प्रतिकृती') },
  { date: addDays(TODAY, -158), kind: 'participation', title: T('International Yoga Day', 'अंतरराष्ट्रीय योग दिवस', 'आंतरराष्ट्रीय योग दिन') },
  { date: addDays(TODAY, -300), kind: 'certificate', title: T('Elementary drawing grade exam · A grade', 'एलिमेंट्री ड्रॉइंग परीक्षा · A ग्रेड', 'एलिमेंटरी चित्रकला परीक्षा · A श्रेणी') },
  { date: addDays(TODAY, -420), kind: 'award', title: T('Best reader · Class 6', 'सर्वश्रेष्ठ पाठक · कक्षा 6', 'उत्कृष्ट वाचक · इयत्ता 6') },
] as const

/* ---------------- Services, wellbeing, transport ---------------- */
export type ReqType = 'leave' | 'bonafide' | 'id' | 'transport' | 'other'
export const REQ_TYPES: ReqType[] = ['leave', 'bonafide', 'id', 'transport', 'other']
export const REQ_SEED = [{ id: 'rq-0112', type: 'bonafide' as ReqType, note: T('For the scholarship form', 'छात्रवृत्ति फ़ॉर्म के लिए', 'शिष्यवृत्ती अर्जासाठी'), created: addDays(TODAY, -6).getTime() }]

export const COUNSEL_SLOTS = [at(TOMORROW, 9, 30), at(nextSchoolDay(TODAY, 2), 13, 15), at(nextSchoolDay(TODAY, 3), 9, 30)]

export const ROUTE_STOPS = [
  { name: T('Station Road', 'स्टेशन रोड', 'स्टेशन रोड'), am: 425 },
  { name: T('Shivaji Chowk', 'शिवाजी चौक', 'शिवाजी चौक'), am: 432, mine: true },
  { name: T('Market Yard', 'मार्केट यार्ड', 'मार्केट यार्ड'), am: 440 },
  { name: T('Hospital Road', 'हॉस्पिटल रोड', 'हॉस्पिटल रोड'), am: 448 },
  { name: T('School gate', 'स्कूल गेट', 'शाळेचे प्रवेशद्वार'), am: 461 },
]

/* ---------------- Notifications ---------------- */
export type Notif = { id: string; kind: 'diary' | 'badge' | 'notice' | 'homework' | 'fee' | 'exam'; title: Txt; body: Txt; time: Date; to: string }
export const NOTIFS: Notif[] = [
  { id: 'nf-diary', kind: 'diary', to: '/messages', time: ago(30), title: T('New diary note', 'नया डायरी नोट', 'नवी डायरी नोंद'), body: T('Mrs. Joshi: consent form for the trip', 'श्रीमती जोशी: यात्रा अनुमति पत्र', 'सौ. जोशी: सहल संमतीपत्र') },
  { id: 'nf-hw', kind: 'homework', to: '/homework/hw-mat', time: ago(150), title: T('Due tomorrow', 'कल तक जमा', 'उद्यापर्यंत'), body: T('Maths: Exercise 4.2, questions 1–8', 'गणित: अभ्यास 4.2, प्रश्न 1–8', 'गणित: स्वाध्याय 4.2, प्रश्न 1–8') },
  { id: 'nf-badge', kind: 'badge', to: '/achievements', time: at(addDays(TODAY, -1), 14, 30), title: T('You earned Quiz Ace', 'आपने क्विज़ ऐस जीता', 'तुम्हाला क्विझ एक्का मिळाला'), body: T('+20 points for Blue House', 'ब्लू हाउस को +20 अंक', 'ब्लू हाउसला +20 गुण') },
  { id: 'nf-notice', kind: 'notice', to: '/messages/notice/nt-annual', time: at(addDays(TODAY, -2), 11), title: T('Annual Day auditions', 'वार्षिकोत्सव ऑडिशन', 'स्नेहसंमेलन ऑडिशन'), body: T('Sign up by Friday', 'शुक्रवार तक नाम दें', 'शुक्रवारपर्यंत नाव द्या') },
  { id: 'nf-fee', kind: 'fee', to: '/fees', time: at(addDays(TODAY, -4), 10), title: T('Transport fee due soon', 'परिवहन शुल्क जल्द देय', 'वाहतूक शुल्क लवकरच भरायचे'), body: T('Transport · ₹1,800', 'परिवहन · ₹1,800', 'वाहतूक · ₹1,800') },
]
export const LIVE_NOTIF: Notif = { id: 'nf-live', kind: 'exam', to: '/exams/ex-hin', time: new Date(), title: T('Hindi test portions posted', 'हिंदी परीक्षा का पाठ्यक्रम आया', 'हिंदी चाचणीचा अभ्यासक्रम आला'), body: T('Lesson 5, pages 41–52 · tomorrow, period 3', 'पाठ 5, पृष्ठ 41–52 · कल, पीरियड 3', 'पाठ 5, पाने 41–52 · उद्या, तासिका 3') }
