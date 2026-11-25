# Image & asset plan

## Current state (honest)
- **No photographs are used.** AI image generation could not be completed: the Higgsfield account has 0 credits, and this build environment cannot download images from external hosts.
- Every image slot uses an original, on-brand **geometric illustration** (`src/components/Art.astro`, 14 subjects × 5 tones). These are labelled as illustrations on the site and are never presented as STKV photographs.
- The crest is a temporary arch mark. **The official crest must never be recreated with AI.**

## Replacing illustrations with photos
`<Art name="science" tone="navy" photo={{ src: '/images/lab-1.avif', alt: 'Class 8 students during a chemistry practical', width: 1600, height: 2000 }} />`
Export AVIF/WebP at 1600 px on the long edge. The arch frames are 4:5 portrait, the news and infrastructure frames are 4:3 or 16:10, and the gallery is 1:1 (tall tiles are 1:2).

## Photography brief (real school shoot — preferred)
Natural daylight, warm but true colours, eye-level with students and candid moments, uncluttered backgrounds, and consent from parents. Shot list: classroom discussion (primary and secondary), science lab practical, library reading, computer lab, PE and sports ground, music/dance rehearsal, art class, assembly, a national-day celebration, the school gate and building exterior, teachers with students, and the reception/office (for "Visit us").

## If AI-generated imagery is used (clearly labelled "illustrative")
Use the school's real uniform photos as reference. Never invent the uniform, crest or campus.
Prompt template: *"Editorial documentary photograph, Indian CBSE school, [scene], students aged [x] wearing [uniform from reference], natural window light, warm neutral grade with deep navy and marigold accents, shallow depth of field, candid, 4:5, no text, no logos."*
Do not present AI images as genuine STKV students, staff or campus.
