// Single source of truth for SONIQ prototype content.
// Every product, price, colour and specification below comes from the supplied brand brief.
// All of it is FICTIONAL demo content.

export const DEMO_NOTE = 'Fictional prototype content — no real products, orders or payments.'

const c = (id, name, body, extra = {}) => ({ id, name, body, accent: '#7C3AED', cushion: '#171220', metal: '#9d97ad', light: false, ...extra })

export const PRODUCTS = [
  {
    id: 'halo-one', name: 'HALO ONE', cat: 'headphones', tagline: 'Flagship ANC Headphones',
    type: 'Over-ear wireless headphones', price: 7999, ref: 8999, msg: 'Your world. Tuned your way.',
    pitch: 'The hero of the range: sculptural over-ear headphones with hybrid noise cancellation and a restrained violet light ring.',
    design: 'Smooth matte surfaces, refined metal joints and plush cushions. Industrial-design restraint rather than gaming flash.',
    model: 'headphones', variant: 'one',
    colors: [
      c('void-black', 'Void Black', '#1a1624', { accent: '#7C3AED' }),
      c('sonic-violet', 'Sonic Violet', '#6a38c9', { accent: '#C4B5FD', cushion: '#2a1850' }),
      c('cloud-white', 'Cloud White', '#ebe8f3', { accent: '#7C3AED', cushion: '#c9c2dc', metal: '#b9b3c9', light: true }),
    ],
    features: ['Hybrid active noise cancellation', 'Transparency mode', 'Up to 45 h playback (ANC off)', 'Dual-device connection', 'Fold-flat earcups', 'USB-C charging'],
    specs: [
      ['Category', 'Over-ear wireless headphones'], ['Noise cancellation', 'Hybrid active noise cancellation'],
      ['Transparency mode', 'Yes'], ['Playback', 'Up to 45 hours (ANC off)'], ['Connection', 'Wireless, dual-device'],
      ['Folding', 'Fold-flat earcups'], ['Charging', 'USB-C'], ['Colours', 'Void Black, Sonic Violet, Cloud White'],
    ],
    attrs: { wireless: true, anc: true, portable: 'bag', uses: ['commute', 'travel', 'work', 'study', 'entertainment'], battery: 45, ip: null, form: 'Over-ear', light: 'violet ring' },
    anatomy: [
      { id: 'ring', label: 'Light ring', text: 'A restrained violet light ring on each earcup — the signature of the HALO family.', cam: [3.4, 0.7, 3.8], target: [1.1, 0.1, 0], rot: -0.2 },
      { id: 'cushion', label: 'Cushions', text: 'Plush cushions designed for long listening sessions.', cam: [-1.2, 0.3, 4.1], target: [-0.7, 0, 0], rot: 0.9 },
      { id: 'joint', label: 'Metal joints', text: 'Refined metal joints connect headband and earcups.', cam: [2.6, 1.9, 3.2], target: [1.0, 0.8, 0], rot: -0.3 },
      { id: 'fold', label: 'Fold-flat cups', text: 'Earcups fold flat so the headphones pack down for travel.', cam: [0, 0.4, 6.4], target: [0, 0.2, 0], rot: 1.5 },
    ],
  },
  {
    id: 'halo-air', name: 'HALO AIR', cat: 'headphones', tagline: 'Everyday Wireless Headphones',
    type: 'Lightweight over-ear wireless headphones', price: 5499, ref: 5999, msg: 'Comfort that keeps up.',
    pitch: 'Everyday comfort for commuting, studying, work and entertainment — lighter, softer and more minimal than HALO ONE.',
    design: 'A lighter, softer structure that makes the headband, cushions and folding hinges easy to read.',
    model: 'headphones', variant: 'air',
    colors: [
      c('mist-lavender', 'Mist Lavender', '#b8a6ef', { cushion: '#8c78c9', light: true, metal: '#d3c9f3' }),
      c('graphite', 'Graphite', '#4b4658', { cushion: '#2a2633' }),
      c('pearl', 'Pearl', '#f1eef7', { cushion: '#cfc8df', light: true, metal: '#c3bdd0' }),
    ],
    features: ['Lightweight construction', 'Up to 35 h playback', 'Foldable design', 'Adjustable EQ presets (fictional companion experience)', 'USB-C charging'],
    specs: [
      ['Category', 'Lightweight over-ear wireless headphones'], ['Playback', 'Up to 35 hours'], ['Folding', 'Foldable design'],
      ['EQ', 'Adjustable EQ presets in the fictional companion experience'], ['Charging', 'USB-C'], ['Colours', 'Mist Lavender, Graphite, Pearl'],
    ],
    attrs: { wireless: true, anc: false, portable: 'bag', uses: ['commute', 'study', 'work', 'entertainment'], battery: 35, ip: null, form: 'Over-ear' },
    anatomy: [
      { id: 'band', label: 'Headband', text: 'A slim headband keeps the weight low.', cam: [0, 2.2, 5], target: [0, 1.2, 0], rot: 0 },
      { id: 'cushion', label: 'Cushions', text: 'Soft cushions for everyday comfort.', cam: [-1.2, 0.3, 4], target: [-0.7, 0, 0], rot: 0.9 },
      { id: 'hinge', label: 'Folding hinge', text: 'Foldable design — the cups rotate in for carrying.', cam: [2.6, 1.0, 3.4], target: [1.0, 0.5, 0], rot: -0.3 },
    ],
  },
  {
    id: 'orbit-pro', name: 'ORBIT PRO', cat: 'earbuds', tagline: 'Noise-Cancelling Earbuds',
    type: 'True wireless earbuds', price: 4999, ref: 5499, msg: 'Your space, wherever you go.',
    pitch: 'Compact premium earbuds for commuting and everyday listening, in a smooth pebble-shaped charging case.',
    design: 'A pebble-shaped case with carefully modelled earbuds. Open the case to meet them.',
    model: 'earbuds', variant: 'pro',
    colors: [
      c('midnight', 'Midnight', '#1d1731'),
      c('lavender-frost', 'Lavender Frost', '#cbbff6', { light: true, metal: '#e2dbfb' }),
      c('soft-white', 'Soft White', '#f1eef7', { light: true, metal: '#d8d2e6' }),
    ],
    features: ['Active noise cancellation', 'Transparency mode', 'Up to 30 h with the case', 'Multiple listening modes', 'IPX4 water resistance (fictional spec)', 'USB-C case charging'],
    specs: [
      ['Category', 'True wireless earbuds'], ['Noise cancellation', 'Active noise cancellation'], ['Transparency mode', 'Yes'],
      ['Playback', 'Up to 30 hours combined with the case'], ['Listening modes', 'Multiple'], ['Water resistance', 'IPX4 (fictional specification)'],
      ['Case charging', 'USB-C'], ['Colours', 'Midnight, Lavender Frost, Soft White'],
    ],
    attrs: { wireless: true, anc: true, portable: 'pocket', uses: ['commute', 'travel', 'work'], battery: 30, ip: 'IPX4', form: 'In-ear' },
    anatomy: [
      { id: 'case', label: 'Open the case', text: 'The pebble-shaped case opens to reveal both earbuds.', cam: [0, 2.4, 4.4], target: [0, 0.3, 0], rot: 0, open: true },
      { id: 'bud', label: 'Earbud close-up', text: 'Carefully modelled earbuds with a compact stem.', cam: [1.4, 1.3, 2.8], target: [0.35, 0.45, 0], rot: 0, open: true },
      { id: 'closed', label: 'Closed case', text: 'Smooth and pocketable when closed.', cam: [2.8, 0.6, 3.6], target: [0, 0, 0], rot: 0 },
    ],
  },
  {
    id: 'orbit-lite', name: 'ORBIT LITE', cat: 'earbuds', tagline: 'Compact Wireless Earbuds',
    type: 'True wireless earbuds', price: 2499, ref: 2799, msg: 'Small case. Big part of your day.',
    pitch: 'Accessible, everyday audio in a friendly, pocket-sized case that is clearly its own thing next to ORBIT PRO.',
    design: 'Friendly, minimal and pocket-sized.',
    model: 'earbuds', variant: 'lite',
    colors: [
      c('chalk', 'Chalk', '#e6e2ee', { light: true, metal: '#cfc9de' }),
      c('lilac', 'Lilac', '#b69cf0', { light: true, metal: '#d6c8f7' }),
      c('charcoal', 'Charcoal', '#2c2836'),
    ],
    features: ['Compact charging case', 'Up to 24 h with the case', 'Touch controls', 'Voice-call microphones', 'USB-C charging'],
    specs: [
      ['Category', 'True wireless earbuds'], ['Playback', 'Up to 24 hours combined with the case'], ['Controls', 'Touch controls'],
      ['Calls', 'Voice-call microphones'], ['Case charging', 'USB-C'], ['Colours', 'Chalk, Lilac, Charcoal'],
    ],
    attrs: { wireless: true, anc: false, portable: 'pocket', uses: ['commute', 'study', 'travel'], battery: 24, ip: null, form: 'In-ear' },
    anatomy: [
      { id: 'case', label: 'Open the case', text: 'A compact case that opens to show the earbuds.', cam: [0, 2.2, 4.2], target: [0, 0.3, 0], rot: 0, open: true },
      { id: 'bud', label: 'Earbud close-up', text: 'Touch controls and voice-call microphones.', cam: [1.2, 1.2, 2.7], target: [0.4, 0.4, 0], rot: 0, open: true },
      { id: 'closed', label: 'Closed case', text: 'Pocket-sized and friendly.', cam: [2.6, 0.5, 3.4], target: [0, 0, 0], rot: 0 },
    ],
  },
  {
    id: 'aura-360', name: 'AURA 360', cat: 'speakers', tagline: 'Portable Wireless Speaker',
    type: 'Portable speaker', price: 5499, ref: 5999, msg: 'Bring your atmosphere.',
    pitch: 'A room-filling design object for home listening and small gatherings.',
    design: 'A compact cylinder with a refined acoustic grille and a distinctive top control surface.',
    model: 'speaker', variant: 'aura',
    colors: [
      c('violet-ink', 'Violet Ink', '#2b1a52'),
      c('stone-white', 'Stone White', '#dcd8e2', { light: true, metal: '#bdb8c8' }),
      c('graphite', 'Graphite', '#3a3642'),
    ],
    features: ['360-degree sound concept', 'Up to 12 h playback', 'IPX6 water resistance (fictional spec)', 'USB-C charging', 'Wireless stereo-pairing concept'],
    specs: [
      ['Category', 'Portable speaker'], ['Sound', '360-degree sound concept'], ['Playback', 'Up to 12 hours'],
      ['Water resistance', 'IPX6 (fictional specification)'], ['Charging', 'USB-C'], ['Pairing', 'Wireless stereo-pairing concept'], ['Colours', 'Violet Ink, Stone White, Graphite'],
    ],
    attrs: { wireless: true, anc: false, portable: 'bag', uses: ['home', 'entertainment'], battery: 12, ip: 'IPX6', form: 'Speaker' },
    anatomy: [
      { id: 'grille', label: 'Acoustic grille', text: 'A refined acoustic grille wraps the cylinder.', cam: [1.6, 0.4, 3.3], target: [0, 0.1, 0], rot: 0 },
      { id: 'top', label: 'Top controls', text: 'A distinctive top control surface.', cam: [0.6, 3.6, 2.4], target: [0, 0.9, 0], rot: 0 },
      { id: 'rings', label: 'Sound rings', text: 'Illustrative sound-ring animation around the product — a visual, not a measurement.', cam: [0, 0.6, 6.4], target: [0, 0, 0], rot: 0 },
    ],
  },
  {
    id: 'pulse-mini', name: 'PULSE MINI', cat: 'speakers', tagline: 'Pocket Bluetooth Speaker',
    type: 'Compact portable speaker', price: 2799, ref: 2999, msg: 'Take your sound with you.',
    pitch: 'A small, colourful speaker for desks, bedrooms and travel — smaller and more playful than AURA 360, but still premium.',
    design: 'Materials, portability and scale come first.',
    model: 'speaker', variant: 'pulse',
    colors: [
      c('ultraviolet', 'Ultraviolet', '#7C3AED', { accent: '#C4B5FD' }),
      c('cloud', 'Cloud', '#e8e5ef', { light: true, metal: '#c8c2d6' }),
      c('graphite', 'Graphite', '#403c4a'),
    ],
    features: ['Up to 8 h playback', 'Compact body and carry loop', 'USB-C charging', 'IPX5 water resistance (fictional spec)'],
    specs: [
      ['Category', 'Compact portable speaker'], ['Playback', 'Up to 8 hours'], ['Body', 'Compact, with carry loop'],
      ['Charging', 'USB-C'], ['Water resistance', 'IPX5 (fictional specification)'], ['Colours', 'Ultraviolet, Cloud, Graphite'],
    ],
    attrs: { wireless: true, anc: false, portable: 'pocket', uses: ['home', 'travel', 'study'], battery: 8, ip: 'IPX5', form: 'Speaker' },
    anatomy: [
      { id: 'loop', label: 'Carry loop', text: 'A carry loop makes it easy to clip or hang.', cam: [1.0, 2.4, 3.0], target: [0, 0.9, 0], rot: 0 },
      { id: 'body', label: 'Compact body', text: 'Small enough for desks, bedrooms and bags.', cam: [2.4, 0.4, 3.0], target: [0, 0.2, 0], rot: 0 },
    ],
  },
  {
    id: 'arc-studio', name: 'ARC STUDIO', cat: 'headphones', tagline: 'Wired Studio Headphones',
    type: 'Wired over-ear headphones', price: 3499, ref: 3999, msg: 'Stay close to the detail.',
    pitch: 'A straightforward option for desk listening, editing and focused work.',
    design: 'More technical and understated: earcup profile, adjustable headband, connector and cushions in clear detail.',
    model: 'headphones', variant: 'arc',
    colors: [c('studio-black', 'Studio Black', '#15121b', { cushion: '#0f0c14' }), c('graphite-violet', 'Graphite Violet', '#4c4068', { cushion: '#241d36' })],
    features: ['Closed-back over-ear design', 'Detachable audio cable', 'Cushioned earcups', 'Adjustable headband', '3.5 mm connection'],
    specs: [
      ['Category', 'Wired over-ear headphones'], ['Design', 'Closed-back over-ear'], ['Cable', 'Detachable audio cable'],
      ['Earcups', 'Cushioned'], ['Headband', 'Adjustable'], ['Connection', '3.5 mm'], ['Colours', 'Studio Black, Graphite Violet'],
    ],
    attrs: { wireless: false, anc: false, portable: 'bag', uses: ['work', 'study', 'home'], battery: null, ip: null, form: 'Over-ear' },
    anatomy: [
      { id: 'slider', label: 'Adjustable headband', text: 'An adjustable headband with metal sliders.', cam: [2.3, 2.3, 3.4], target: [1, 1.1, 0], rot: -0.3 },
      { id: 'cup', label: 'Earcup profile', text: 'Closed-back earcups with cushioned padding.', cam: [4, 0.4, 2.4], target: [1, 0, 0], rot: -0.1 },
      { id: 'cable', label: 'Detachable cable', text: 'A detachable audio cable with a 3.5 mm connection.', cam: [-3.2, -0.6, 3.6], target: [-1, -0.6, 0], rot: 0 },
    ],
  },
  {
    id: 'link-dac', name: 'LINK USB-C DAC', cat: 'accessories', tagline: 'Compact Audio Adapter',
    type: 'Audio accessory', price: 999, ref: 1199, msg: 'A small link to better listening.',
    pitch: 'A small accessory for compatible devices and wired listening.',
    design: 'Macro product detail: a compact metallic enclosure, precise lighting and a reinforced cable.',
    model: 'dac', variant: 'link',
    colors: [c('metallic', 'Metallic', '#a8a3b6', { metal: '#c7c2d3' })],
    features: ['USB-C input', '3.5 mm audio output', 'Compact metallic enclosure', 'Reinforced cable'],
    specs: [
      ['Category', 'Audio accessory'], ['Input', 'USB-C'], ['Output', '3.5 mm audio'], ['Enclosure', 'Compact metallic'], ['Cable', 'Reinforced'], ['Compatibility', 'Device support varies'],
    ],
    attrs: { wireless: false, anc: false, portable: 'pocket', uses: ['work', 'study', 'travel'], battery: null, ip: null, form: 'Adapter' },
    anatomy: [
      { id: 'plug', label: 'USB-C input', text: 'USB-C input plug on a reinforced cable.', cam: [-2.4, 0.8, 2.6], target: [-1.2, 0, 0], rot: 0 },
      { id: 'out', label: '3.5 mm output', text: '3.5 mm audio output on the metallic enclosure.', cam: [2.6, 0.8, 2.6], target: [1.0, 0, 0], rot: 0 },
    ],
  },
  // ---- accessories
  { id: 'wave-case', name: 'WAVE CASE', cat: 'accessories', tagline: 'Protective Carry Pouch', type: 'Accessory', price: 599, ref: null, msg: null,
    pitch: 'A protective carry pouch for compatible headphones.', design: 'Premium fabric pouch with a violet zip pull.', model: 'pouch', variant: 'wave',
    colors: [c('standard', 'Standard', '#26222f', { accent: '#7C3AED' })], features: ['Protective carry pouch', 'Fits compatible SONIQ over-ear headphones'],
    specs: [['Category', 'Accessory'], ['Role', 'Protective carry pouch for compatible headphones'], ['Compatible with', 'HALO ONE, HALO AIR, ARC STUDIO']],
    attrs: { wireless: null, anc: false, portable: 'pocket', uses: ['commute', 'travel'], battery: null, ip: null, form: 'Pouch' }, anatomy: [] },
  { id: 'halo-cushions', name: 'HALO Cushion Set', cat: 'accessories', tagline: 'Replacement Cushions', type: 'Accessory', price: 799, ref: null, msg: null,
    pitch: 'Replacement cushions for HALO ONE.', design: 'Matches the plush cushions on HALO ONE.', model: 'cushions', variant: 'halo',
    colors: [c('standard', 'Standard', '#171220')], features: ['Replacement cushions for HALO ONE'],
    specs: [['Category', 'Accessory'], ['Role', 'Replacement cushions'], ['Compatible with', 'HALO ONE']],
    attrs: { wireless: null, anc: false, portable: 'pocket', uses: [], battery: null, ip: null, form: 'Cushions' }, anatomy: [] },
  { id: 'usbc-cable', name: 'SONIQ USB-C Cable', cat: 'accessories', tagline: 'Charging Cable', type: 'Accessory', price: 399, ref: null, msg: null,
    pitch: 'A charging cable for USB-C SONIQ products.', design: 'Braided cable with violet detailing.', model: 'cable', variant: 'usbc',
    colors: [c('standard', 'Standard', '#6d3fd4', { accent: '#C4B5FD' })], features: ['USB-C charging cable'],
    specs: [['Category', 'Accessory'], ['Role', 'Charging cable'], ['Compatible with', 'HALO ONE, HALO AIR, ORBIT PRO, ORBIT LITE, AURA 360, PULSE MINI']],
    attrs: { wireless: null, anc: false, portable: 'pocket', uses: [], battery: null, ip: null, form: 'Cable' }, anatomy: [] },
  { id: 'orbit-silicone', name: 'ORBIT Silicone Case', cat: 'accessories', tagline: 'Earbud-Case Cover', type: 'Accessory', price: 399, ref: null, msg: null,
    pitch: 'A protective earbud-case cover.', design: 'Soft-touch cover that follows the pebble case.', model: 'siliconecase', variant: 'orbit',
    colors: [c('standard', 'Standard', '#b69cf0', { light: true })], features: ['Protective earbud-case cover'],
    specs: [['Category', 'Accessory'], ['Role', 'Protective earbud-case cover'], ['Compatible with', 'ORBIT PRO']],
    attrs: { wireless: null, anc: false, portable: 'pocket', uses: [], battery: null, ip: null, form: 'Case cover' }, anatomy: [] },
  { id: 'arc-cable', name: 'ARC Coiled Audio Cable', cat: 'accessories', tagline: 'Replacement Cable', type: 'Accessory', price: 499, ref: null, msg: null,
    pitch: 'A replacement cable for compatible ARC products.', design: 'A coiled cable with 3.5 mm connectors.', model: 'coil', variant: 'arc',
    colors: [c('standard', 'Standard', '#2a2535', { accent: '#7C3AED' })], features: ['Replacement cable for compatible ARC products'],
    specs: [['Category', 'Accessory'], ['Role', 'Replacement cable'], ['Compatible with', 'ARC STUDIO']],
    attrs: { wireless: null, anc: false, portable: 'pocket', uses: [], battery: null, ip: null, form: 'Cable' }, anatomy: [] },
]

export const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]))
export const AUDIO = PRODUCTS.filter((p) => ['headphones', 'earbuds', 'speakers'].includes(p.cat))
export const SHELF = ['halo-one', 'halo-air', 'orbit-pro', 'orbit-lite', 'aura-360', 'pulse-mini', 'arc-studio', 'link-dac']
export const ACCESSORY_IDS = ['wave-case', 'halo-cushions', 'usbc-cable', 'orbit-silicone', 'arc-cable']

export const COLLECTIONS = {
  headphones: { title: 'Headphones', blurb: 'HALO ONE, HALO AIR and ARC STUDIO — three ways to sit inside your music.', ids: ['halo-one', 'halo-air', 'arc-studio'] },
  earbuds: { title: 'Earbuds', blurb: 'ORBIT PRO and ORBIT LITE — compact cases, carefully modelled earbuds.', ids: ['orbit-pro', 'orbit-lite'] },
  speakers: { title: 'Speakers', blurb: 'AURA 360 fills a room; PULSE MINI goes wherever you do.', ids: ['aura-360', 'pulse-mini'] },
  accessories: { title: 'Accessories', blurb: 'The LINK USB-C DAC plus pouches, cushions, cables and cases — each with its compatibility spelled out.', ids: ['link-dac', ...ACCESSORY_IDS] },
}
export const CAT_LABEL = { headphones: 'Headphones', earbuds: 'Earbuds', speakers: 'Speakers', accessories: 'Accessories' }

// Accessory → compatible product ids. "Compatible headphones" in the brief is resolved to the
// three SONIQ over-ear models; USB-C charging products are taken from each product's spec list.
export const COMPAT = {
  'wave-case': ['halo-one', 'halo-air', 'arc-studio'],
  'halo-cushions': ['halo-one'],
  'usbc-cable': ['halo-one', 'halo-air', 'orbit-pro', 'orbit-lite', 'aura-360', 'pulse-mini'],
  'orbit-silicone': ['orbit-pro'],
  'arc-cable': ['arc-studio'],
  'link-dac': ['arc-studio'], // pairs with wired 3.5 mm listening; device (phone/laptop) support varies
}
export const accessoriesFor = (pid) => Object.keys(COMPAT).filter((a) => COMPAT[a].includes(pid)).map((a) => byId[a])
export const compatibleWith = (aid) => (COMPAT[aid] || []).map((id) => byId[id])

export const BUNDLES = [
  { id: 'everyday', name: 'The Everyday Set', price: 5899, blurb: 'A proposed everyday listening bundle.', items: [{ id: 'halo-air', color: 'mist-lavender' }, { id: 'wave-case', color: 'standard' }] },
  { id: 'studio', name: 'The Studio Set', price: 3999, blurb: 'A wired-listening bundle.', items: [{ id: 'arc-studio', color: 'studio-black' }, { id: 'link-dac', color: 'metallic' }] },
  { id: 'personal', name: 'The Personal Audio Set', price: 5999, blurb: 'A compact personal listening bundle.', items: [{ id: 'orbit-pro', color: 'midnight' }, { id: 'orbit-silicone', color: 'standard' }] },
]
export const bundleParts = (b) => b.items.reduce((s, i) => s + byId[i.id].price, 0)

export const REVIEW_LABEL = 'Prototype reviews — fictional names, ratings and comments created for this demo. Not real customer testimonials.'
export const REVIEWS = [
  { name: 'Aarav M.', place: 'Palghar', rating: 4.8, cats: ['headphones'], text: 'The headphones feel thoughtfully designed, and I like how the product details are easy to explore. The violet finish gives the range a distinctive identity.' },
  { name: 'Mira S.', place: 'Palghar', rating: 4.7, cats: ['earbuds'], text: 'The earbud case is compact, and the product comparison made it easier to understand the differences between the two models.' },
  { name: 'Dev P.', place: 'Boisar', rating: 5.0, cats: ['speakers', 'accessories', 'any'], text: 'The listening-style selector is a useful idea. I could narrow down the options without reading a wall of technical specifications.' },
]
export const reviewsFor = (cat) => REVIEWS.filter((r) => r.cats.includes(cat) || r.cats.includes('any'))

export const PROFILES = {
  balanced: { name: 'Balanced', blurb: 'Even weight across lows, mids and highs — the reference shape for everyday listening.', hue: '#C4B5FD', bands: [0.55, 0.6, 0.62, 0.6, 0.58, 0.55], speed: 1, spread: 1 },
  bass: { name: 'Bass', blurb: 'Low frequencies lead. Wide, slow rings with weight at the centre.', hue: '#7C3AED', bands: [1, 0.9, 0.6, 0.4, 0.3, 0.25], speed: 0.7, spread: 1.35 },
  vocal: { name: 'Vocal', blurb: 'Mid-range forward, so voices and lead instruments sit at the front of the stage.', hue: '#67E8F9', bands: [0.3, 0.5, 0.95, 1, 0.7, 0.4], speed: 1.15, spread: 0.9 },
  focus: { name: 'Focus', blurb: 'Calm, narrow and steady — a low-distraction profile for work and study.', hue: '#A8A2B5', bands: [0.35, 0.45, 0.55, 0.45, 0.3, 0.2], speed: 0.55, spread: 0.7 },
}

export const MOMENTS = [
  { id: 'commute', label: 'Commuting', ids: ['orbit-pro', 'halo-one', 'orbit-lite'], why: 'Compact, quick to take out, and with noise cancellation where it matters.' },
  { id: 'study', label: 'Studying', ids: ['halo-air', 'orbit-lite', 'arc-studio'], why: 'Comfortable for long sessions without a premium price.' },
  { id: 'work', label: 'Working', ids: ['arc-studio', 'halo-air', 'halo-one'], why: 'Focused listening at a desk, wired or wireless.' },
  { id: 'travel', label: 'Travelling', ids: ['halo-one', 'orbit-pro', 'pulse-mini'], why: 'Fold-flat or pocket-sized, with long playback.' },
  { id: 'home', label: 'Home listening', ids: ['aura-360', 'pulse-mini', 'arc-studio'], why: 'Rooms, desks and bedrooms.' },
  { id: 'entertainment', label: 'Entertainment', ids: ['halo-air', 'halo-one', 'aura-360'], why: 'Shows, films and music with friends.' },
]

export const SHIPPING = [
  { id: 'pickup', name: 'Store pickup (demo)', fee: 0, window: 'Prototype option — the studio is fictional' },
  { id: 'standard', name: 'Standard delivery (demo)', fee: 99, window: 'Placeholder window: 4–6 working days' },
  { id: 'express', name: 'Express delivery (demo)', fee: 199, window: 'Placeholder window: 1–2 working days' },
]

export const STUDIO = {
  name: 'SONIQ Sound Studio',
  address: 'Studio 01, Aural Arcade (fictional premises), Palghar West, Maharashtra 401404',
  phone: '+91 00000 00000', email: 'hello@soniq-audio.example', site: 'soniq-audio.example', social: '@soniq.audio.demo',
  founder: 'Ayaan Mhatre — fictional character created for the demo',
  hours: [['Monday–Saturday', '10:30 AM – 8:30 PM'], ['Sunday', '11:00 AM – 7:00 PM']],
  zones: [
    { id: 'bar', name: 'Listening bar', text: 'Compare headphones side by side.', ids: ['halo-one', 'halo-air', 'arc-studio'] },
    { id: 'counter', name: 'Product counter', text: 'Explore earbuds and speakers.', ids: ['orbit-pro', 'orbit-lite', 'aura-360', 'pulse-mini'] },
    { id: 'wave', name: 'Sound-wave installation', text: 'A distinctive demonstration area built around visualised sound.', ids: [] },
    { id: 'wall', name: 'Accessory wall', text: 'Accessory recommendations with compatibility guidance.', ids: ['link-dac', 'wave-case'] },
  ],
}

export const FAQ = [
  ['Is SONIQ a real company?', 'No. SONIQ is a fictional concept created for a website-design prototype. Nothing here can be bought or collected.'],
  ['Do the sound profiles change my audio?', 'No. The Sound Lab is an illustrative visual and educational experience. It does not process or change any sound.'],
  ['Are the reviews real?', 'No. Every review is fictional prototype content, with invented names and ratings.'],
  ['Can I place an order?', 'You can complete a simulated checkout and receive a clearly labelled fictional confirmation number. No order is placed and no payment is taken.'],
  ['Is the studio address real?', 'No. The Palghar address is invented for the prototype and is deliberately not linked to a map.'],
  ['Which accessories fit my product?', 'Use the compatibility guide in Support, or the “Pairs with” section on any product page.'],
  ['What does device support varies mean for LINK USB-C DAC?', 'The brief states that support varies by device. Final compatibility information would have to be verified before any real launch.'],
  ['How long does delivery take?', 'Delivery windows in checkout are placeholders. Live serviceability and charges would need real configured data.'],
]

export const POLICIES = {
  warranty: { title: 'Warranty (draft placeholder)', body: ['A proposed one-year limited product warranty, subject to product and eligibility terms.', 'Final terms must be written and legally reviewed before any real sales.'] },
  returns: { title: 'Returns & replacements (draft placeholder)', body: ['A proposed returns and replacement page covering eligibility, product condition and hygiene-related terms.', 'Final conditions must be established before real sales.'] },
  shipping: { title: 'Shipping (draft placeholder)', body: ['Checkout shows the delivery method, an estimated delivery window, charges and the address you enter.', 'Any live serviceability, delivery dates or charges must come from real configured data after launch.'] },
  privacy: { title: 'Privacy notice (draft placeholder)', body: ['This prototype stores your bag, saved items and any demo checkout details only in your own browser (localStorage). Nothing is sent to a server.', 'Do not enter real personal or payment details.'] },
  accessibility: { title: 'Accessibility', body: ['SONIQ aims to meet WCAG 2.2 AA: keyboard access to every control, visible focus, semantic landmarks, sufficient contrast and a reduced-motion experience.', 'The 3D stage can be set to Lite or switched off (static) from the footer. All product information is also available as plain text.'] },
}
