/**
 * CBSE Mandatory Public Disclosure — structure follows CBSE's prescribed format (Appendix IX).
 * Values are only filled where verified (CBSE SARAS). Everything else stays `null` and the UI shows
 * "Awaiting document from school". Never type an invented number, date or certificate here.
 */
import { school } from './site';

export interface InfoRow { label: string; value: string | null; source?: string }
export interface DocRow { id: string; label: string; file: string | null; note?: string }

export const generalInfo: InfoRow[] = [
  { label: 'Name of the school', value: school.name, source: 'CBSE SARAS' },
  { label: 'Affiliation number', value: school.affiliationNo.value, source: 'CBSE SARAS' },
  { label: 'Affiliation period', value: school.affiliationPeriod.value, source: 'CBSE SARAS' },
  { label: 'Affiliation status', value: school.affiliationStatus.value, source: 'CBSE SARAS' },
  { label: 'School code', value: null },
  { label: 'Complete address with PIN code', value: school.address.value, source: 'CBSE SARAS' },
  { label: 'Principal name', value: school.principal.value, source: 'CBSE SARAS — confirm current' },
  { label: 'Principal qualification', value: null },
  { label: 'School email ID', value: null },
  { label: 'Contact details (landline / mobile)', value: null },
];

export const documents: DocRow[] = [
  { id: 'd-affiliation', label: 'Copies of affiliation / upgradation letter and recent extension of affiliation', file: null },
  { id: 'd-trust', label: 'Copies of societies / trust / company registration or renewal certificate', file: null },
  { id: 'd-noc', label: 'Copy of No Objection Certificate (NOC) issued by the State Government / UT', file: null },
  { id: 'd-rte', label: 'Copies of recognition certificate under the RTE Act, 2009, and its renewal', file: null },
  { id: 'd-building', label: 'Copy of valid building safety certificate as per the National Building Code', file: null },
  { id: 'd-fire', label: 'Copy of valid fire safety certificate issued by the competent authority', file: null },
  { id: 'd-deo', label: 'Copy of the DEO certificate submitted for affiliation / upgradation / extension, or self-certification by school', file: null },
  { id: 'd-water', label: 'Copies of valid water, health and sanitation certificates', file: null },
];

export const academicDocs: DocRow[] = [
  { id: 'a-fee', label: 'Fee structure of the school', file: null },
  { id: 'a-calendar', label: 'Annual academic calendar', file: null },
  { id: 'a-smc', label: 'List of School Management Committee (SMC)', file: null },
  { id: 'a-pta', label: 'List of Parent–Teacher Association (PTA) members', file: null },
  { id: 'a-results', label: 'Last three-year results of the Board examination (Class X)', file: null, note: 'Class XII not applicable — school is affiliated up to Class X' },
];

export const staffInfo: InfoRow[] = [
  { label: 'Principal', value: null },
  { label: 'Total number of teachers', value: null },
  { label: 'PGT', value: null },
  { label: 'TGT', value: null },
  { label: 'PRT', value: null },
  { label: 'Teachers–section ratio', value: null },
  { label: 'Details of special educator', value: null },
  { label: 'Details of counsellor and wellness teacher', value: null },
];

export const infraInfo: InfoRow[] = [
  { label: 'Total campus area of the school (sq. m)', value: null },
  { label: 'Number and size of classrooms (sq. m)', value: null },
  { label: 'Number and size of laboratories, including computer labs (sq. m)', value: null },
  { label: 'Internet facility', value: null },
  { label: 'Number of girls’ toilets', value: null },
  { label: 'Number of boys’ toilets', value: null },
  { label: 'Link to YouTube video of the inspection of school covering infrastructure', value: null },
];
