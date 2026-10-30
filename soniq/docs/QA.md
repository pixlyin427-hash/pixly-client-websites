# QA report (honest)

Tested in headless Chromium with software WebGL (SwiftShader) — not on real GPUs or real phones.

## Automated browser checks that passed (22)
Shop shows 13 products; ANC and wired filters; add-to-bag; quantity → ₹15,998; Esc closes bag; search "under 3000" and empty state; checkout validation errors; review total ₹16,097 (incl. ₹99 demo shipping); confirmation says no real order; bag emptied; compare shows 3 columns; bundle ₹5,899 in bag; finder ranks ORBIT PRO first for commute/earbuds/ANC/pocket/≤₹5,500; swatch selection; all five product tabs; specs battery; close-up button. Reduced-motion context: no errors, keyboard Tab order, shelf ArrowRight, `/` opens search, rotate button.

## Defects found and fixed
Product tabs clipped (Specs unreachable); earbud-case lid invisible when open; earbud framing too tight; mobile demo banner truncated; stage rendered at full rate behind document pages (now throttled).

## Visually reviewed
Desktop: home, product (HALO ONE, ORBIT PRO), Sound Lab, studio, headphones shop. Mobile 390px: home, product, earbuds shop, Sound Lab, studio, story.

## Not verified / known limits
- Not visually reviewed: desktop/mobile support, checkout, compare, finder, bundles, discover pages (behaviour tested, layout not inspected).
- No real-device or performance profiling; bundle size is large (~1 MB r3f chunk).
- Screen-reader testing not done; contrast checked by design only.
- "In demo stock" availability filter filters nothing (all products equal); "Newest" sort = reverse catalogue order (brief has no dates).
- Figma and Spline not used; research limited (docs/RESEARCH.md).
- Data note: Personal Audio Set ₹5,999 exceeds its items' sum (₹5,398); shown as supplied and flagged.
