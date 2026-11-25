/**
 * DEMONSTRATION NOTICES — not issued by the school.
 * They exist only to show how the Notice Centre searches, filters, sorts and archives.
 * Replace with the school's real notices (or connect a CMS/API) before launch.
 */
export type NoticeCategory = 'Academic' | 'Examination' | 'Events' | 'Admissions' | 'Holiday' | 'Circular';

export interface Notice {
  id: string;
  title: string;
  category: NoticeCategory;
  date: string; // ISO yyyy-mm-dd
  year: '2026–27' | '2025–26';
  summary: string;
  file: string | null;
  archived?: boolean;
}

export const noticeCategories: NoticeCategory[] = ['Academic', 'Examination', 'Events', 'Admissions', 'Holiday', 'Circular'];
export const academicYears = ['2026–27', '2025–26'] as const;

const SAMPLE_PDF = '/docs/sample-notice.pdf';

export const notices: Notice[] = [
  { id: 'n01', title: 'Sample notice — Term II examination timetable, Classes 6 to 10', category: 'Examination', date: '2026-11-20', year: '2026–27', summary: 'Demonstration entry showing how an examination timetable would be published with a downloadable PDF.', file: SAMPLE_PDF },
  { id: 'n02', title: 'Sample circular — Parent–teacher meeting schedule', category: 'Circular', date: '2026-11-14', year: '2026–27', summary: 'Demonstration circular. Real circulars will list the date, timings and classes concerned.', file: SAMPLE_PDF },
  { id: 'n03', title: 'Sample notice — Annual sports meet: house practice timings', category: 'Events', date: '2026-11-06', year: '2026–27', summary: 'Demonstration event notice with practice timings by house and class.', file: null },
  { id: 'n04', title: 'Sample notice — Admission enquiries for the next academic year', category: 'Admissions', date: '2026-10-28', year: '2026–27', summary: 'Demonstration admissions notice. Dates and eligibility will be published by the school office.', file: SAMPLE_PDF },
  { id: 'n05', title: 'Sample notice — Holiday on account of a festival', category: 'Holiday', date: '2026-10-16', year: '2026–27', summary: 'Demonstration holiday notice. The school calendar is the authoritative source for holidays.', file: null },
  { id: 'n06', title: 'Sample circular — Revised book list for Class 8', category: 'Academic', date: '2026-09-30', year: '2026–27', summary: 'Demonstration academic circular linked to the class-wise book list.', file: SAMPLE_PDF },
  { id: 'n07', title: 'Sample notice — Science exhibition registrations', category: 'Events', date: '2026-09-12', year: '2026–27', summary: 'Demonstration notice for student registrations to an in-school exhibition.', file: null },
  { id: 'n08', title: 'Sample notice — Periodic test schedule, Classes 1 to 5', category: 'Examination', date: '2026-08-21', year: '2026–27', summary: 'Demonstration test schedule for primary classes.', file: SAMPLE_PDF },
  { id: 'n09', title: 'Sample circular — Uniform and ID card guidelines', category: 'Circular', date: '2026-06-15', year: '2026–27', summary: 'Demonstration circular showing how guidelines are shared at the start of the year.', file: SAMPLE_PDF },
  { id: 'n10', title: 'Sample notice — School reopens for the new academic year', category: 'Academic', date: '2026-06-08', year: '2026–27', summary: 'Demonstration reopening notice.', file: null },
  { id: 'n11', title: 'Sample notice — Result declaration for Classes 1 to 9', category: 'Examination', date: '2026-04-10', year: '2025–26', summary: 'Archived demonstration notice from the previous academic year.', file: SAMPLE_PDF, archived: true },
  { id: 'n12', title: 'Sample circular — Summer vacation and holiday homework', category: 'Holiday', date: '2026-04-02', year: '2025–26', summary: 'Archived demonstration circular from the previous academic year.', file: SAMPLE_PDF, archived: true },
  { id: 'n13', title: 'Sample notice — Annual day rehearsals', category: 'Events', date: '2025-12-09', year: '2025–26', summary: 'Archived demonstration event notice.', file: null, archived: true },
  { id: 'n14', title: 'Sample notice — Board examination admit cards', category: 'Examination', date: '2026-01-27', year: '2025–26', summary: 'Archived demonstration notice for Class 10 students.', file: SAMPLE_PDF, archived: true },
];
