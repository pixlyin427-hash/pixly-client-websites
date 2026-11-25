/**
 * Facts verified from the school's own website (stkvem.com — "OASIS" school-details page,
 * About, Admissions, Affiliation and Contact pages), inspected 25 Nov 2026.
 * Figures are as published there; the school should re-confirm before launch.
 */
export const verified = {
  motto: { sanskrit: 'सर्वेऽपि सुखिनः सन्तु', meaning: 'May all be happy' },
  trust: { name: 'Jeevan Vikas Shikshan Sanstha', founded: 1966, founder: 'Late Shri Sadanand T. Kadam', institutions: 9 },
  school: { founded: 2018, chairman: 'Shri Vagesh Sadanand Kadam', treasurer: 'Shri Pranav Vagesh Kadam', principal: 'Shri Pradeep Murlidhar Panigrahi' },
  cbse: { affiliationNo: '1131284', schoolCode: '31271', period: '01.04.2023 – 31.03.2028', firstBoardBatch: 2025 },
  stats: {
    students: 1219, // Bal Vatika 1 – Class 10, OASIS student table
    teachers: 57,
    digitalClassrooms: 23,
    computers: 50,
    labs: 3,
    libraryBooks: 5103,
    campusSqM: 8222,
    playgroundSqFt: 39460,
  },
  classes: 'Bal Vatika (pre-school) to Class 10',
  timings: { school: 'Mon – Sat · 8:00 am – 1:30 pm', office: 'Mon – Sat · 8:00 am – 4:00 pm' },
  contact: {
    phone: '+91 76858 59009',
    email: 'office.stkvem@gmail.com',
    address: 'S. T. Kadam Educational Complex, S. No. 115/A/1/D, Palghar–Boisar Road, Palghar (W), Tal/Dist Palghar 401404',
  },
  activities: ['Horse riding', 'Skating', 'Yoga', 'Music', 'Dance', 'Folk fitness', 'Brain gym', 'Zumba', 'Outdoor activities'],
  mission: 'To create a safe and nurturing learning environment where students are inspired to excel academically, socially and emotionally.',
  vision: 'To provide world class education that empowers students to reach their full potential and become responsible global citizens.',
  principalQuote: 'Our children’s lives change when their natural passion for knowledge is nurtured and transformed into habits of life-long learning.',
  admissions: {
    opens: 'Applications open from 1 December every year for the academic year beginning in April; seats are allotted first come, first served.',
    age: 'For Std 1, the child must complete 6 years on or before 31 December of the academic year.',
  },
  transport: 'The school does not run its own transport; private bus operators contracted with the school offer transport.',
} as const;
