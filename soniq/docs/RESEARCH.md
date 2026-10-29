# SONIQ — research record (honest scope)

**Important limitation:** the brief asked for 15–20 live references inspected interactively. That did **not** happen in this session. The environment has no interactive browsing of external sites for design review, and research was deliberately kept small to limit cost. What was actually done:

## What was actually consulted

| Source | What was learned | Used for |
|---|---|---|
| Codrops — [Building Aether 1: Sound Without Boundaries](https://tympanus.net/codrops/2025/08/06/building-aether-1-sound-without-boundaries/) (surfaced via web search; **summary read, site not interacted with**) | Audio product launches work best when the *visual language of sound* (rings/flow fields, reactive visuals) is the world the product sits in, rather than decoration. | Persistent "Soundstage": concentric-ring floor, spectrum ring in Sound Lab. |
| Awwwards — [Sennheiser "Reshaping Excellence"](https://AWWWARDS.com/sites/sennheiser-reshaping-excellence) (listing only; **not inspected**) | Confirms headphone brands publish WebGL showcase experiences. | Context only. |
| pmndrs R3F docs — performance pitfalls (via search summaries; [pitfalls](https://website-of26kuvgc-pmndrs.vercel.app/react-three-fiber/advanced/pitfalls)) | Don't `setState` per frame; share geometries/materials; mounting/unmounting 3D objects is costly; manual `gl.render` interplay with render priority. | Colour lerps and camera tweens run in `useFrame` on refs; one persistent canvas; offscreen thumbnails rendered one at a time. |

Everything else (navigation concept, motion language, chamfered-panel UI) is original design reasoning, not derived from inspected sites. No Awwwards/FWA/CSSDA/Behance/Dribbble/Spline Community sites were opened.

## Three concepts weighed (desk exercise, no external prototypes)

1. **Sonic Void** — dark environment, products emerge from light; one scene per page.
2. **The Acoustic Laboratory** — instrument-panel UI, visualisers drive navigation.
3. **The Persistent Soundstage** *(selected)* — one WebGL stage that never unmounts; routes move the camera, change the product and ring behaviour. Conventional shop pages dim the stage so information stays readable.

Why 3: strongest cohesion (same space everywhere), cheapest in performance (one canvas + offscreen thumbnails instead of many canvases), and it keeps conventional category/product routes available for usability.

## Additional features chosen (beyond the 25)

Keyboard shortcuts (`/`, `B`, `C`, arrows, `+/-`, `0`), saved items, recently viewed, 3D quality switch (Full / Lite / Off), ripple "ping" on the stage floor, mock order-status lookup, product-page keyboard orbit, listening-context browse.
