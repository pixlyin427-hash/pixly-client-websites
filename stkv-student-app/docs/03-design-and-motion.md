# Design system and motion specification

Direction: **Instrument**, the school day as a precision instrument. Navy deck, data-first visuals, mono details, pill and circle controls.

## Colour (exact approved values)
| Token | Hex | Use |
|---|---|---|
| navy | #142B50 | Identity, deck, dock, headings, dark-mode base |
| royal | #2457C5 | Primary actions, active navigation, current period, links |
| sky | #62A5F5 | Charts, sparklines, focus ring, dark-mode links |
| ice | #DCEAFF | Tonal buttons, icon tiles, selected states |
| teal | #14A38B | Attendance, completed, wellbeing, positive change |
| amber | #F0A52B | Achievements, League, reminders, deadlines, tomorrow's changes |
| purple | #8065D8 | Study Planner, revision, Daily Recall |
| coral | #EA7951 | Events, clubs, creative work |
| white / bg / muted / border | #FFFFFF / #F4F7FC / #EAF0F8 / #DCE4EF | Surfaces |
| success / warning / error / info | #21845A / #D99121 / #C43D45 / #3975B9 | System feedback only |

Text shades (contrast ≥ 4.5:1 on white): teal #0B7A67, amber and warning #8A5A0B, purple #5F45BF, coral #B14A27. Dark mode uses lighter text shades and translucent soft fills; meanings never change.

## Type
Geist (UI and numbers, 400–700, tight tracking on large sizes), Geist Mono (times, codes, eyebrows), Mukta (Devanagari). Scale: 34 / 28 / 21 / 17 / 15 / 13 / 11. Minimum body size 15; minimum caption 11 (mono eyebrow only). Large text setting multiplies by 1.125.

## Shape and depth
Radius 12 tile · 16 input · 20 row · 24 card · 32 hero/sheet · pill for everything tappable. Nested radius = outer − padding. Elevation e1 card, e2 raised, e3 floating; navy-tinted shadows in light mode, borders plus deep shadows in dark.

## Layout
Mobile first. Gutter 20 / 28 / 40. Bottom dock (phone), rail (tablet), sidebar (desktop). Safe-area insets respected. Touch targets ≥ 44 px.

## Motion system

Research basis: Apple HIG motion (brief, precise feedback; never the only carrier of information; optional), Material 3 easing and duration tokens (emphasized decelerate for entering, short durations for small components). Sources: developer.apple.com/design/human-interface-guidelines/motion, developer.apple.com/design/human-interface-guidelines/tab-bars, Material 3 motion token references.

### Tokens
| Name | Value | Use |
|---|---|---|
| tap | scale 0.96, spring 600/30 | Every pressable |
| quick | 150 ms, ease-out | Colour, opacity, icon swaps |
| enter | 320 ms, cubic-bezier(0.05, 0.7, 0.1, 1) | Elements and pages entering |
| exit | 200 ms, cubic-bezier(0.3, 0, 0.8, 0.15) | Elements and pages leaving |
| indicator | spring stiffness 500, damping 38 | Tab pills, segment and date selection |
| sheet | spring stiffness 380, damping 36 | Bottom sheets and dialogs |
| celebrate | spring stiffness 260, damping 14 | Badge unlock, success marks only |
| stagger | 40 ms per item, max 8 items | Lists and grids on first appearance |
| count | 900 ms ease-out | Number count-ups |

Reduced motion (system or app setting): all movement becomes opacity fades ≤ 150 ms; count-ups show final values; celebrations show the badge without particles.

### By pattern
| Pattern | Motion | Reason |
|---|---|---|
| Tab switch | Content cross-fades with 8 px rise; dock pill slides (layout animation) | Same level, no direction |
| Push (detail) | New page slides from 32 px right + fade; previous fades back | Shows depth |
| Back | Reverse of push | Spatial consistency |
| Sheet | Rises from bottom on spring; drag down to dismiss (velocity aware) | Physical, thumb-friendly |
| Dialog | Scale 0.94 → 1 with fade | Focus without spatial travel |
| Menu / picker | Scale from trigger origin 0.95 → 1 | Shows where it came from |
| Toast | Drops from top on spring; slides up to dismiss | Arrival is noticeable but brief |
| List filter | Items re-flow with layout animation; removed items fade/scale out | Shows what changed |
| Card entrance | First view only: 12 px rise + fade, staggered | Calm loading of a page |
| Expand/collapse | Height auto with spring, chevron rotates 180° | Continuity |

### By interaction
| Interaction | Motion |
|---|---|
| Primary button submit | Label → spinner → check (pop) → label; colour shifts royal → teal on success |
| Task / homework done | Circle fills teal, check path draws 250 ms, title strike sweeps, progress bar grows, "+5 XP" chip floats up |
| Pack item | Icon swaps to check with pop; stub counter rolls; final item tears stub (rotate −3.5°) |
| Mark as seen | Button morphs to teal pill with check |
| Attendance confirmation | Ring draws to 100 %, check draws, soft teal ripple once |
| Calendar date select | Selection pill moves between dates (shared layout) |
| Timeline period select | Period lifts 4 px with sky ring; detail card cross-fades |
| Charts | Bars grow from baseline, lines draw, gauges sweep, numbers count; on first view only |
| Badge unlock | Scrim fades, badge scales in on celebrate spring, 18 particles burst once in amber/royal/sky, title rises |
| XP gain | XP bar fills, level number flips on level up |
| League update | Rows reorder with layout animation; point delta flashes amber once |
| Notification arrival | Toast drops in, bell rotates ±12° twice, badge pops |
| Switch | Thumb slides on spring and stretches while pressed |
| Input focus | Ring fades in 150 ms; error shakes 6 px twice |
| Loading | Skeleton shimmer only while loading (≤ 600 ms in the demo) |
| Empty state | Illustration floats in once |

Continuous animation is limited to loading indicators and the live "now" marker on today's timeline.
