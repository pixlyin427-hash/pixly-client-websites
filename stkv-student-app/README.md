# STKV Student App (interactive demo)

A student app for Shri S. T. Kadam Vidyalaya. It runs in the browser as an installable app (PWA) and is ready to wrap with Capacitor later. This is a **demo**:

- one fictional student
- simulated data
- no backend

Everything you change is saved on the device and survives a refresh.

## Run it

Requires Node 20.19+ or 22.12+ (Vite 8).

```bash
npm install
npm run dev        # development server with hot reload
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build on http://localhost:4173
npm test           # Playwright suite (builds and serves the app itself)
```

The first time you run the tests on a new machine, run `npx playwright install chromium`.

### Open it on a phone

1. Run `npm run build`, then `npm run preview -- --host`.
2. On a phone on the same Wi-Fi, open `http://<computer-ip>:4173`.

Over plain `http` on a network address the app works, but the browser will not offer **Install**. Installing and offline use need `https` or `localhost`. To install it, deploy the `dist/` folder to any static host with https, then open it in Chrome and choose **Add to Home screen**.

## Demo access

| What | Value |
|---|---|
| Sign in | Tap **Use the demo account**, or enter any ID such as `STKV-2019-0714` and a password of 4 or more characters |
| App lock PIN | `1234` (Profile → Settings → App lock) |
| Homework Mode parent PIN | `1234` |
| Start over | Profile → Settings → **Reset demo data** |

Dates in the demo are relative to the device's date. "Tomorrow", due dates and the attendance calendar always line up with today.

## What's inside

- **Tabs:** Home, Learn, School, Achievements and Profile.
- **Modules:** all 15 modules, listed once each under **All features**.
- **Languages:** English, हिंदी and मराठी. Switch on the welcome screen or in Settings.
- **Appearance:** light, dark or system theme, plus text size, motion (system / reduced / full) and Home widget order.

Folder guide:

```
src/
  App.tsx            route table, page transitions, sign-in gating
  store.ts           persisted demo state (localStorage key "stkv-demo")
  i18n/              en / hi / mr dictionaries (a missing key fails the build)
  data/              sample school data (timetable, homework, exams, notices…)
  lib/               router, dates, motion tokens, derived selectors
  components/        design-system components (core, form, overlay, data, shell)
  screens/           one file per module
tests/               Playwright suite
docs/                product map, interaction map, design & motion spec, test report
```

## Status

See [docs/04-test-report.md](docs/04-test-report.md) for what was tested, what was fixed, and what still needs checking before a real launch.
