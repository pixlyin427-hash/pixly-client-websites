/**
 * School identity & verified facts.
 *
 * RULE: nothing here may be invented. Every value carries a `source`.
 *  - verified: true  → taken from an official record (CBSE SARAS) or supplied by the client brief.
 *  - verified: false → found only on third-party listings, or a placeholder; the UI marks it
 *                      "Awaiting confirmation" until the school signs it off.
 *  - value: null     → unknown; the UI renders a "To be provided by the school" placeholder.
 */
export interface Fact<T = string> {
  value: T | null;
  source: string;
  verified: boolean;
}

const SARAS = 'CBSE SARAS affiliation record';
const BRIEF = 'Client brief';
const THIRD = 'Third-party school listing — needs school confirmation';
const PENDING = 'Not yet provided by the school';

export const SARAS_URL = 'https://saras.cbse.gov.in/SARAS/AffiliatedList/AfflicationDetails/1131284';

export const school = {
  name: 'Shri S. T. Kadam Vidyalaya',
  shortName: 'STKV',
  board: 'CBSE',
  city: 'Palghar',
  state: 'Maharashtra',

  affiliationNo: { value: '1131284', source: SARAS, verified: true } as Fact,
  affiliationPeriod: { value: '2023 – 2028', source: SARAS, verified: true } as Fact,
  affiliationStatus: { value: 'Secondary (up to Class X)', source: SARAS, verified: true } as Fact,
  schoolType: { value: 'Independent', source: SARAS, verified: true } as Fact,
  founded: { value: '2018', source: SARAS, verified: true } as Fact,
  classes: { value: 'Class 1 to Class 10', source: BRIEF, verified: true } as Fact,
  preprimary: { value: null, source: 'Third-party listings mention Nursery — school to confirm', verified: false } as Fact,
  schoolCode: { value: null, source: PENDING, verified: false } as Fact,
  medium: { value: null, source: PENDING, verified: false } as Fact,

  address: {
    value: 'Palghar–Boisar Road, Taluka Palghar, District Palghar, Maharashtra 401404',
    source: SARAS,
    verified: true,
  } as Fact,
  addressLines: ['Palghar–Boisar Road', 'Taluka Palghar, Dist. Palghar', 'Maharashtra 401404'],
  campusName: { value: 'S. T. Kadam Educational Complex, S. No. 115/A/1/D', source: THIRD, verified: false } as Fact,
  management: { value: 'Jeevan Vikas Shikshan Sanstha', source: THIRD, verified: false } as Fact,
  principal: { value: 'Pradeep Murlidhar Panigrahi', source: `${SARAS} — confirm this is current`, verified: false } as Fact,
  chairman: { value: null, source: PENDING, verified: false } as Fact,

  phone: { value: null, source: PENDING, verified: false } as Fact,
  email: { value: null, source: PENDING, verified: false } as Fact,
  officeHours: { value: null, source: PENDING, verified: false } as Fact,

  app: {
    package: 'iconic.stkvem',
    url: 'https://play.google.com/store/apps/details?id=iconic.stkvem',
    source: BRIEF,
  },
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Shri+S.+T.+Kadam+Vidyalaya+Palghar',
  legacySite: 'https://stkvem.com/',
  sarasUrl: SARAS_URL,
} as const;

export const externalLinks = [
  { label: 'CBSE — official website', href: 'https://www.cbse.gov.in/' },
  { label: 'CBSE SARAS affiliation record', href: SARAS_URL },
  { label: 'STKV Parent / Student App', href: 'https://play.google.com/store/apps/details?id=iconic.stkvem' },
] as const;

/** Shown wherever the UI needs to say a value is pending. */
export const PENDING_LABEL = 'To be provided by the school';
