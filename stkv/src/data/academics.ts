/**
 * Academic structure. Stages follow the NEP 2020 / NCF 5+3+3+4 framework that CBSE schools use.
 * Subject lists are INDICATIVE (CBSE scheme of studies) — the school must confirm its actual
 * subject offering, languages and book lists before launch.
 */
export interface Stage {
  id: string;
  name: string;
  classes: string;
  range: [number, number];
  lead: string;
  focus: string[];
  art: 'book' | 'classroom' | 'science' | 'maths';
}

export const stages: Stage[] = [
  {
    id: 'foundational', name: 'Foundational', classes: 'Classes 1–2', range: [1, 2], art: 'book',
    lead: 'Early literacy and numeracy built through play, stories and hands-on activity.',
    focus: ['Foundational literacy & numeracy', 'Language through stories and rhymes', 'Play- and activity-based learning'],
  },
  {
    id: 'preparatory', name: 'Preparatory', classes: 'Classes 3–5', range: [3, 5], art: 'classroom',
    lead: 'Discovery and interactive learning, with a gradual introduction to textbooks.',
    focus: ['Reading, writing and speaking with confidence', 'The world around us', 'Art, music and physical education'],
  },
  {
    id: 'middle', name: 'Middle', classes: 'Classes 6–8', range: [6, 8], art: 'science',
    lead: 'Subject-based learning in mathematics, sciences and social sciences, with experiments and projects.',
    focus: ['Concept-building across subjects', 'Experiments and project work', 'Introduction to skill education'],
  },
  {
    id: 'secondary', name: 'Secondary', classes: 'Classes 9–10', range: [9, 10], art: 'maths',
    lead: 'Deeper disciplinary study and preparation for the CBSE Secondary School Examination (Class X).',
    focus: ['Depth across core subjects', 'Board examination readiness', 'Critical thinking and application'],
  },
];

const subjects = {
  foundational: ['English', 'Hindi', 'Marathi', 'Mathematics', 'Art Education', 'Health & Physical Education'],
  preparatory: ['English', 'Hindi', 'Marathi', 'Mathematics', 'The World Around Us (EVS)', 'Art Education', 'Health & Physical Education'],
  middle: ['English', 'Hindi', 'Marathi', 'Mathematics', 'Science', 'Social Science', 'Computer / Skill Education', 'Art Education', 'Health & Physical Education'],
  secondary: ['English', 'Hindi / Marathi', 'Mathematics (Standard / Basic)', 'Science', 'Social Science', 'Skill subject (optional)', 'Health & Physical Education', 'Art Education'],
};

export interface ClassInfo {
  n: number;
  roman: string;
  stage: Stage;
  subjects: string[];
  bookList: { status: 'awaiting'; file: string };
}

const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export const classes: ClassInfo[] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  const stage = stages.find((s) => n >= s.range[0] && n <= s.range[1])!;
  return {
    n,
    roman: roman[i],
    stage,
    subjects: subjects[stage.id as keyof typeof subjects],
    bookList: { status: 'awaiting', file: '/docs/sample-book-list.pdf' },
  };
});

export const resources = [
  { title: 'Class-wise book lists', type: 'PDF', desc: 'Published by the school each academic year.', file: '/docs/sample-book-list.pdf' },
  { title: 'Academic calendar', type: 'PDF', desc: 'Term dates, examinations and holidays.', file: '/docs/sample-notice.pdf' },
  { title: 'Examination guidelines', type: 'PDF', desc: 'Assessment pattern and examination conduct rules.', file: '/docs/sample-notice.pdf' },
  { title: 'CBSE curriculum documents', type: 'Link', desc: 'Official curriculum published by CBSE.', file: 'https://cbseacademic.nic.in/curriculum.html' },
];
