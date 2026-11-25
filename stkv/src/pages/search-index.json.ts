/** Build-time search index — generated from the same content files the pages use. */
import type { APIRoute } from 'astro';
import { mainNav } from '../data/nav';
import { notices } from '../data/notices';
import { documents, academicDocs } from '../data/disclosure';
import { faqs } from '../data/admissions';
import { classes } from '../data/academics';
import { facilities, activities } from '../data/campus';
import { school } from '../data/site';

export const GET: APIRoute = () => {
  const items: { t: string; s: string; u: string; k?: string }[] = [];
  for (const g of mainNav) {
    items.push({ t: g.label, s: 'Page', u: g.href, k: g.intro });
    for (const c of g.children) items.push({ t: c.label, s: g.label, u: c.href, k: c.note });
  }
  items.push(
    { t: 'Contact & office details', s: 'Page', u: '/contact/', k: 'phone email address map location office timings' },
    { t: 'Transport enquiry', s: 'Contact', u: '/contact/#transport', k: 'bus van route pickup stop travel' },
    { t: `CBSE affiliation number ${school.affiliationNo.value}`, s: 'Key fact', u: '/our-school/#information', k: 'affiliation cbse saras code number board' },
    { t: 'School address — Palghar–Boisar Road', s: 'Key fact', u: '/contact/', k: 'address location map palghar boisar 401404 directions' },
    { t: 'Parent / Student App (Google Play)', s: 'Key fact', u: school.app.url, k: 'app android mobile iconic stkvem parents students login' },
    { t: 'Fee information', s: 'Parents', u: '/disclosure/#academics', k: 'fees fee structure payment charges' },
    { t: 'School information assistant (demo)', s: 'Feature', u: '/contact/#assistant', k: 'ask question help chat assistant' },
  );
  for (const c of classes) items.push({ t: `Class ${c.n} — subjects & book list`, s: 'Academic Centre', u: `/academics/?class=${c.n}#centre`, k: `class ${c.n} ${c.roman} book list books subjects ${c.stage.name} ${c.subjects.join(' ')}` });
  for (const n of notices) items.push({ t: n.title, s: `Notice · ${n.category}`, u: `/resources/?q=${encodeURIComponent(n.title.replace(/^Sample (notice|circular) — /, ''))}#notices`, k: `${n.summary} ${n.year} circular notice` });
  for (const d of [...documents, ...academicDocs]) items.push({ t: d.label, s: 'Mandatory Disclosure', u: `/disclosure/#${d.id}`, k: 'document certificate cbse disclosure pdf' });
  for (const f of faqs) items.push({ t: f.q, s: 'Admission FAQ', u: '/admissions/#faq', k: f.a });
  for (const f of facilities) items.push({ t: f.name, s: 'Facilities', u: '/campus-life/#facilities', k: f.line });
  for (const a of activities) items.push({ t: a.name, s: 'Activities', u: '/campus-life/#activities', k: a.line });
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
