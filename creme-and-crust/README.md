# Crème & Crust — waffle shop site + POS

- `site/` holds the live static site that Vercel serves (its root directory is `creme-and-crust/site`).
- `source/` holds the React/TypeScript source, the Supabase SQL and the tests.

## Rebuild after changing the source
```
cd creme-and-crust/source
npm i -D esbuild && node build.mjs     # writes dist/
cp dist/index.html dist/vercel.json ../site/ && cp dist/assets/app.js dist/assets/app.css ../site/assets/
```
Keep `site/config.js` as it is. It holds the Supabase URL and the public anon key, which is safe in a browser. All access is enforced by Row Level Security and the database functions.

## Database
Supabase project `cdgvztmryzmzvvpxikjm`. Run `supabase/001…004` in order on a fresh project. `003_seed.sql` loads the demo menu and the demo orders.
