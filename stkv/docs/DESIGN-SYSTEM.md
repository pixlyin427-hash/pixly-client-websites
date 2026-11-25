# STKV Design System — specification

The source of truth is `src/styles/tokens.css`; this document explains intent.

## Direction
**"Editorial heritage, modern clarity."** A warm paper ground, deep academic navy and a marigold accent. The look draws on Indian school architecture: the **arch** is the signature frame shape for all imagery. A **kadamba radiance** motif (inspired by the spherical kadamba flower, a nod to the school's name) draws itself in on reveal. It is decorative only and is **not** the crest.

Each section has its own layout character: a cinematic arch collage (hero), a scroll-lit statement (intro), a bento grid on a navy background shift (parent access), a draggable rail (highlights), large-numeral stage tabs (academics), a sticky image swap (activities), a hover-reveal index (facilities), an honour board (achievements), editorial rows (news), a timeline band (admissions) and a staircase (academic stages).

## Colour (provisional until the crest colours are confirmed)
| Token | Hex | Use |
|---|---|---|
| `--navy-900` | #0d1b3e | Primary: text accents, buttons, dark sections |
| `--navy-950` | #081330 | Footer, utility bar, overlays |
| `--marigold-500` | #e2a32b | Accent fills only (never small text on paper) |
| `--marigold-600` | #8c5a0b | Accent **text**: 5.2:1 on paper |
| `--paper` / `--paper-2` | #f6f1e7 / #efe7d7 | Backgrounds |
| `--ink` / `--ink-2` / `--ink-3` | #111a2e / #434c63 / #555c70 | Text, muted text, meta text (all AA) |
| `--clay-600` | #a4442a | Errors, "awaiting" status |
| `--sage-600` | #2f6650 | Success |

To re-brand, change these values only. Everything else derives from them.

## Typography (two families)
- **Fraunces** (variable, optical size): display, headings, statistics, italic emphasis.
- **Manrope** (variable): body, navigation, buttons, labels.
- Fluid scale: `--fs-display` (≈50–140 px), `--fs-h1`, `--fs-h2`, `--fs-h3`, `--fs-h4`, `--fs-lead`, `--fs-body`, `--fs-label` (12 px, uppercase, 0.16 em tracking), `--fs-stat`.
- Headings use −0.035 em tracking and 1.02 line height. Body text uses a 1.65 line height and a 62ch maximum measure.

## Motion system
| Token | Value | Use |
|---|---|---|
| `--ease-out` | cubic-bezier(.22,1,.36,1) | Entrances, reveals |
| `--ease-snap` | cubic-bezier(.32,.72,0,1) | Drawers, overlays, tab ink |
| `--ease-in-out` | cubic-bezier(.65,0,.35,1) | Masks, morphs |
| `--d-press` / `--d-ui` / `--d-panel` / `--d-reveal` | 120 / 260 / 420 / 900 ms | Press feedback / UI state / panels / reveals |

Reveal primitives (`data-reveal`): `up`, `fade`, `scale`, `left`, `line`, `mask` (arch/image clip + inner zoom-out), `wipe`, `stagger`, `words` (word-by-word rise), `draw` (SVG stroke).
Scroll effects: parallax (`data-parallax`), pointer depth (`data-depth`), scroll-lit words (`data-scrub-words`), section colour shift (`data-bg-shift`), timeline fills, sticky swap, horizontal rails (native scroll, no hijacking).

Component feedback: button fill sweep with arrow hand-off, 0.97 press scale, loading spinner and success tick. Also a sliding nav underline, clip-path mega menu, burger-to-X, tab ink, grid-row accordions, field nudge on error, toast with life bar, dialog rise and backdrop fade, a progress ring on back-to-top, and cross-document view transitions between pages.

Rules: transform and opacity only, with no continuous loops (the hero scroll hint runs 4 times, then stops). `prefers-reduced-motion` disables all of it, and content stays visible without JavaScript.

## Components
Button (primary / accent / light / ghost, sm/md, loading/success) · Link (draw underline) · Chip (filter, with counts) · Tabs · Accordion · Field (validation states) · Choice / Check / Switch · Tooltip · Toast · Modal · Arch frame · Art (14 illustrations × 5 tones) · PageHero · SubNav (scroll-spy) · Calendar · Notice row · Data table · Empty state · Pending marker · Fact.

## Figma
The Figma connector was used: an empty design file **"STKV Website — Design (from build)"** was created in your Figma drafts. Importing the built pages failed because this cloud environment's network proxy blocks uploads to `mcp.figma.com`. Once that host is allowed, regenerate snapshots with `tools/figma-snapshots.cjs` and import them with the Figma MCP `html_to_figma` tool (desktop and mobile frames for 8 pages).
