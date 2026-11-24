# 04 · Test report

**Result of the last full run:** 27 passed, 0 failed, 30 skipped by design.

The skipped tests are flow tests that only need to run once, on the phone size. TypeScript strict mode passes and the production build succeeds.

Run the suite yourself with `npm test`. It builds the app, serves it, and runs every test in Chromium at three sizes:

| Project | Viewport | Notes |
|---|---|---|
| phone | 360 × 780 | touch and mobile emulation |
| tablet | 820 × 1180 | side rail layout |
| desktop | 1440 × 900 | sidebar with the module list |

## What the automated suite checks

| Area | Test | Sizes |
|---|---|---|
| Every screen | All 33 routes open with **no console errors or page errors** and **no horizontal scroll** | phone, tablet, desktop |
| Language + motion | All 33 routes in **Marathi** with the system **reduced-motion** setting on: no errors, no overflow, `lang="mr"` applied | phone |
| Navigation | Tab labels are never cut off in English, Hindi or Marathi. Tapping a tab routes correctly and sets `aria-current` | phone, tablet, desktop |
| Sign-in and onboarding | Empty-ID error and demo sign-in work. A short name is rejected. The 4 steps lead to the success screen, and the profile survives a reload | phone |
| Home: Tonight Planner and pack list | Ticking a task and packing the whole bag fires the badge celebration. The task, the pack state and the earned badge all survive a reload | phone |
| Homework | Submit, confirm, then the success state. The Submit button is gone after a reload | phone |
| Service Desk | Empty-reason error, then the new request appears in the list and survives a reload | phone |
| Online exam | Start, answer 6 questions, confirm submit, see the score, open the answer review | phone |
| Daily Recall | Answer 5 questions; the streak goes from 7 to 8 days | phone |
| Fees | Demo payment, then a receipt. One fee is left to pay after a reload | phone |
| Chat | Sending a message shows it, then the simulated teacher reply arrives | phone |
| Settings | Language, dark theme, large text and app lock all survive a reload. The PIN screen appears and unlocks with 1234 | phone |
| Personalisation | Hiding a Home section removes it. "Hide marks" masks scores on Home | phone |
| Notifications | Opening one goes to its content and lowers the unread count | phone |
| Search | Finds a notice. An unmatched query shows the empty state | phone |
| Accessibility | axe-core WCAG 2.0/2.1 A + AA on six key screens, in light and in dark. The test fails on any *serious* or *critical* issue | phone |

## Issues found by testing and fixed

1. **Colour contrast (axe, serious).** Three places failed WCAG AA:
   - **Period-rail labels on amber.** Ratio 3.46. Fixed by raising the label opacity, which gives roughly 5:1.
   - **Ice chips and buttons in dark mode.** Ratio 4.26. Fixed by darkening the dark `--ice` to `#16326B`, which gives 4.83:1.
   - **White text on Teal `#14A38B`.** Ratio 3.16. Fixed by adding a deeper teal, `#0E8572`, used only behind text, which gives 4.55:1. This applies to attendance "present" days, the success state of buttons, Lesson Pulse "Got it", and correct quiz and recall answers. Teal `#14A38B` is unchanged for icons, bars and rings, where 3:1 is enough.
   - **"Late" attendance days.** These now use soft teal with dark teal text instead of white text on a pale teal.
2. **Horizontal overflow on tablet and desktop.** On the homework detail screen, the three action buttons were each full-width in a row, which made the page 2,144 px wide. They now share an equal-width row.
3. **"Achievements" label cut off.** This happened on the tablet rail, and on the phone dock at 360 px widths (common on Android). Fixed by tightening the rail label type, and the dock spacing on phones under 380 px. Hindi and Marathi labels were already fitting.
4. **Timestamps in the future.** Sample "today" items had fixed clock times, so a 4:10 pm note could show while it was 3:53 pm. They are now relative to when the app opened.
5. **Offline cache bloat.** The service worker precached Cyrillic and Vietnamese font files that the app never renders. These are now excluded.

Earlier visual QA, from full contact sheets at phone, tablet and desktop in light, dark, Hindi and Marathi, fixed these:

- dark deck cards that rendered white
- squashed badge cards
- a duplicated PE period in tomorrow's timetable
- truncated birthday names
- a welcome-screen overlap
- router state after sign-out
- a date parsed in UTC instead of local time

It also removed 28 unused translation keys and 5 unused exports.

## Not tested, or limits to be aware of

These are stated plainly so nothing is assumed to be verified when it is not:

- **Real devices.** All runs used Chromium with emulated phone and tablet sizes. The app has **not** been tried on a physical Android phone, an iPhone, Safari or Firefox, or as an installed PWA.
- **Performance.** The JavaScript is one bundle of 820 KB, or 242 KB gzipped. It is cached offline after the first visit. It is not code-split, and no Lighthouse or frame-rate profiling was done on a low-end Android phone.
- **Animations.** These were checked by eye in screenshots and by the reduced-motion run. Their smoothness is not measured.
- **Accessibility depth.** axe ran on 6 of the 33 screens, in both themes. No TalkBack or VoiceOver session was done. Automated checks cannot judge reading order or how labels sound.
- **Translations.** I wrote the Hindi and Marathi text myself. It renders correctly, but a native speaker should review the wording before real use.
- **Device features not covered by the tests:**
  - the photo picker in homework
  - Dictation Buddy's speech, which depends on which voices the device has (a Marathi voice may be missing)
  - the ID-card flip, which was checked by eye only
- **Flow tests on larger sizes.** Most flow tests run in English on the phone size. On tablet and desktop the suite checks screens, overflow and navigation, not every flow.
- **Simulated features.** All data, payments, teacher replies, notifications and the Ride & Gate route are simulated. The Ride & Gate module is a pilot.
- **Branding.** The crest is a placeholder until the school's official logo is supplied.
