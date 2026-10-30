# SONIQ — fictional audio brand prototype

All content is fictional demo content (no real products, orders, payments, reviews or addresses).

```
npm install
npm run dev      # development
npm run build && npm run preview
```

Stack: React 19, Vite, three.js, @react-three/fiber + drei. Fonts self-hosted (Space Grotesk, Manrope). No external 3D assets: all products are procedural models in `src/three/models.jsx`.

Key ideas: one persistent WebGL "Soundstage" behind every route (`src/three/Stage.jsx`); routes only configure it (product, finish, camera). Product images in cards/bag are offscreen renders of the same models (`src/three/thumbs.jsx`). Single data source: `src/data/catalog.js`. State (bag, saved, compare, orders) is stored only in the browser (localStorage).

See `docs/RESEARCH.md` and `docs/QA.md`.
