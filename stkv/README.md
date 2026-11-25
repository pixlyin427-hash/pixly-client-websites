# Shri S. T. Kadam Vidyalaya — Website (frontend demonstration)

A premium, fully static frontend demo for **Shri S. T. Kadam Vidyalaya (STKV)**, CBSE, Palghar.
Built with **Astro 5 + TypeScript + vanilla CSS design tokens**. No backend, no client framework.

> ⚠️ **Demonstration build.** Forms, the assistant and notices are simulated and nothing is sent to the
> school. Unverified details are visibly marked. The crest is a placeholder. See `docs/CONTENT-GAPS.md`
> before launch.

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/ — deploy to any static host
npm run preview
```

## Pages

| Route | Purpose |
|---|---|
| `/` | Hero, intro, parent quick access, highlights, academics, activities, facilities, achievements, news, admissions CTA |
| `/our-school/` | About, vision & mission, leadership messages, leadership & faculty, infrastructure, verified school information |
| `/academics/` | Approach, **Academic Centre** (class 1–10 selector, subjects, book lists), exams, calendar, resources |
| `/campus-life/` | Activities mosaic, achievement showcase, events, filterable gallery + lightbox, videos, facilities |
| `/admissions/` | Eligibility, process, document checklist, **4-step validated enquiry**, campus-visit modal, FAQs |
| `/resources/` | **Smart Notice Centre** (search, category, year, sort, archive), calendar, downloads |
| `/disclosure/` | **CBSE Transparency Centre**: Mandatory Public Disclosure in CBSE's sections A–E |
| `/contact/` | Contact details, transport enquiry, information-assistant demo |
| `/search-index.json` | Build-time site search index (generated from the content files) |

## Architecture

```
src/
  data/        ← ALL content lives here (edit these, not components)
    site.ts        school identity; every fact carries a source + verified flag
    nav.ts         navigation for header, mobile menu, footer and search
    notices.ts     notice centre data (currently SAMPLE entries)
    disclosure.ts  CBSE mandatory disclosure structure (values only where verified)
    academics.ts   stages, classes, indicative subjects, resources
    admissions.ts  steps, checklist, FAQs
    calendar.ts    events (national observances real; school events SAMPLE)
    campus.ts      activity/facility areas, gallery items
  components/  ← reusable UI (Header, Footer, Button, Art, Calendar, PageHero, SubNav, Fact, Pending…)
  layouts/     Base.astro (head/meta, overlays, shared modals)
  scripts/     motion.ts · ui.ts · header.ts · search.ts · forms.ts · notices.ts · calendar.ts · interactions.ts
  styles/      tokens.css (design tokens) · base.css (type, layout, motion primitives) · components.css · features.css
public/docs/   clearly marked SAMPLE / PLACEHOLDER PDFs
```

### Connecting a backend later
- **Forms:** `src/scripts/forms.ts → submitDemo()` is the single integration seam. Replace it with a `fetch()` to your API.
- **Notices / calendar / documents:** replace the arrays in `src/data/*.ts` with a CMS fetch at build time (or an API at runtime). The UI does not need to change.
- **Official crest:** set `CREST_SRC` in `src/components/Logo.astro`.
- **Photography:** `Art.astro` accepts a `photo` prop. Pass `{ src, alt, width, height }` to replace any illustration.

## Honesty rules built into the code
- `Fact` renders verified values normally. Unverified values (third-party sources) get a dotted underline and a source tooltip. Missing values render a dashed "To be provided by the school" marker.
- Sample notices and events carry a visible **Sample** tag. Downloads of sample files trigger a "placeholder" notice.
- Nothing claims an enquiry reached the school.

## Quality checks performed (Nov 2026)
- 33 scripted interaction tests (dropdowns, search, notices, calendar, class selector, tabs, accordions, multi-step form validation and submission, checklist, modals, gallery and lightbox, assistant, mobile menu, reduced motion, no-JS). All pass, with no console errors.
- No horizontal overflow at 1440 px or 390 px on any page.
- Lighthouse (mobile, throttled): Performance 97, LCP 2.3 s, CLS 0, TBT ≤ 90 ms. Accessibility 100 on all inner pages and 96 on home. The home deduction is the intentional dim-before-scroll intro sentence; the full sentence is always available to screen readers.
- SEO is held back deliberately: `noindex` is set for the demo. Remove it in `Base.astro` at launch.

See `docs/DESIGN-SYSTEM.md`, `docs/CONTENT-GAPS.md` and `docs/ASSET-PLAN.md`.
