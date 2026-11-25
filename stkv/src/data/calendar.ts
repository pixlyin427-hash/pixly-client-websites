/**
 * Calendar events. National observances are real fixed dates; every school event is a
 * DEMONSTRATION entry (`sample: true`) until the school publishes its academic calendar.
 */
export type EventKind = 'Holiday' | 'Examination' | 'Event' | 'Meeting';
export interface CalEvent { date: string; title: string; kind: EventKind; sample: boolean }

export const eventKinds: EventKind[] = ['Event', 'Examination', 'Meeting', 'Holiday'];

export const calendarEvents: CalEvent[] = [
  { date: '2026-11-14', title: 'Children’s Day', kind: 'Event', sample: false },
  { date: '2026-11-21', title: 'Sample: Parent–teacher meeting', kind: 'Meeting', sample: true },
  { date: '2026-11-26', title: 'Constitution Day', kind: 'Event', sample: false },
  { date: '2026-12-04', title: 'Sample: Inter-house sports meet', kind: 'Event', sample: true },
  { date: '2026-12-10', title: 'Sample: Periodic test begins', kind: 'Examination', sample: true },
  { date: '2026-12-11', title: 'Sample: Periodic test', kind: 'Examination', sample: true },
  { date: '2026-12-12', title: 'Sample: Periodic test ends', kind: 'Examination', sample: true },
  { date: '2026-12-19', title: 'Sample: Annual day', kind: 'Event', sample: true },
  { date: '2026-12-25', title: 'Christmas', kind: 'Holiday', sample: false },
  { date: '2027-01-12', title: 'National Youth Day', kind: 'Event', sample: false },
  { date: '2027-01-16', title: 'Sample: Science exhibition', kind: 'Event', sample: true },
  { date: '2027-01-26', title: 'Republic Day', kind: 'Holiday', sample: false },
  { date: '2027-02-08', title: 'Sample: Pre-board examinations', kind: 'Examination', sample: true },
  { date: '2027-02-27', title: 'Marathi Bhasha Din', kind: 'Event', sample: false },
  { date: '2027-02-28', title: 'National Science Day', kind: 'Event', sample: false },
  { date: '2026-10-02', title: 'Gandhi Jayanti', kind: 'Holiday', sample: false },
  { date: '2026-10-24', title: 'Sample: Term I results', kind: 'Meeting', sample: true },
];
