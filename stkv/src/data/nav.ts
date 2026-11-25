/** Centralised navigation — header, mobile menu, footer and search all read from here. */
export interface NavLink {
  label: string;
  href: string;
  note?: string;
}
export interface NavGroup extends NavLink {
  intro: string;
  children: NavLink[];
  art: 'campus' | 'classroom' | 'sports' | 'book' | 'notice' | 'science';
}

export const mainNav: NavGroup[] = [
  {
    label: 'Our School',
    href: '/our-school/',
    intro: 'Who we are, what we believe and the people who lead STKV.',
    art: 'campus',
    children: [
      { label: 'About STKV', href: '/our-school/#about' },
      { label: 'Vision & Mission', href: '/our-school/#vision' },
      { label: 'Messages from Leadership', href: '/our-school/#messages' },
      { label: 'Leadership & Faculty', href: '/our-school/#people' },
      { label: 'Infrastructure', href: '/our-school/#infrastructure' },
      { label: 'School Information', href: '/our-school/#information' },
    ],
  },
  {
    label: 'Academics',
    href: '/academics/',
    intro: 'The CBSE curriculum from Class 1 to Class 10, class by class.',
    art: 'classroom',
    children: [
      { label: 'Academic Approach', href: '/academics/#approach' },
      { label: 'Academic Centre (Classes 1–10)', href: '/academics/#centre' },
      { label: 'Book Lists', href: '/academics/#centre', note: 'by class' },
      { label: 'Examinations', href: '/academics/#exams' },
      { label: 'Academic Calendar', href: '/academics/#calendar' },
      { label: 'Resources', href: '/academics/#resources' },
    ],
  },
  {
    label: 'Campus Life',
    href: '/campus-life/',
    intro: 'Sport, the arts, celebrations and everyday life at school.',
    art: 'sports',
    children: [
      { label: 'Sports', href: '/campus-life/#sports' },
      { label: 'Activities & Culture', href: '/campus-life/#activities' },
      { label: 'Student Achievements', href: '/campus-life/#achievements' },
      { label: 'Events', href: '/campus-life/#events' },
      { label: 'Photo Gallery', href: '/campus-life/#gallery' },
      { label: 'Videos', href: '/campus-life/#videos' },
      { label: 'Facilities', href: '/campus-life/#facilities' },
    ],
  },
  {
    label: 'Admissions',
    href: '/admissions/',
    intro: 'Everything a family needs to apply, step by step.',
    art: 'book',
    children: [
      { label: 'Overview & Eligibility', href: '/admissions/#overview' },
      { label: 'Admission Process', href: '/admissions/#process' },
      { label: 'Required Documents', href: '/admissions/#documents' },
      { label: 'Online Enquiry', href: '/admissions/#enquiry' },
      { label: 'Campus Visit', href: '/admissions/#visit' },
      { label: 'Admission FAQs', href: '/admissions/#faq' },
    ],
  },
  {
    label: 'News & Resources',
    href: '/resources/',
    intro: 'Notices, circulars, downloads and statutory documents.',
    art: 'notice',
    children: [
      { label: 'Notice Centre', href: '/resources/#notices' },
      { label: 'Academic Calendar', href: '/resources/#calendar' },
      { label: 'Downloads', href: '/resources/#downloads' },
      { label: 'CBSE Mandatory Disclosure', href: '/disclosure/' },
      { label: 'Certificates & Reports', href: '/disclosure/#documents' },
    ],
  },
];

export const utilityLinks: NavLink[] = [
  { label: 'Mandatory Public Disclosure', href: '/disclosure/' },
  { label: 'Contact & Transport', href: '/contact/' },
];

export const languages = [
  { code: 'en', label: 'English', native: 'English', ready: true },
  { code: 'mr', label: 'Marathi', native: 'मराठी', ready: false },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', ready: false },
] as const;
