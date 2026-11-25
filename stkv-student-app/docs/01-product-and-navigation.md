# STKV Student App: product scope and navigation

Frontend demo for Shri S. T. Kadam Vidyalaya. One fictional student, simulated school data, browser-local persistence. No backend.

## Sources consolidated
- Approved 15-module structure and the list of existing school functions (project brief).
- "STKV Student App: 20 Daily-Use Features" and "20 New Feature Concepts" (Claude Docs).
- Approved visual direction: design board v3 "Instrument".
- Approved colour system with fixed accent meanings.

## Module map: every approved item has exactly one home

| # | Module | Route | Contains (existing functions in **bold**) |
|---|---|---|---|
| 1 | Home / My Day | `/` | Tomorrow Brief, live Today timeline, Tonight Planner, announcements, exam countdown, progress snapshot, Champion League preview, quick actions, **Birthdays** strip, Dinner-Table Question, Little Learners Daily Report (only for Nursery–Class 2 profiles) |
| 2 | Academic Calendar & Timetable | `/timetable` | **Timetable** (day/week), Week Ahead & Clash Guard, academic calendar (month), **Events** with RSVP |
| 3 | Digital Classroom & Library | `/classroom` | **Digital Classroom** (subjects, now-teaching pages, materials), Lesson Pulse, Library Shelf (borrowed, renew, search, reserve) |
| 4 | Classwork & Homework Manager | `/homework` | **Homework**, **Classwork**, Tonight Planner (full), Homework Mode, Notebook Check Tracker |
| 5 | Study Planner & Revision | `/study` | Study goals and sessions, Daily Recall, Dictation Buddy |
| 6 | Examination & Assessment Centre | `/exams` | Upcoming exams, Test Ready Card, **Online Exam**, **Exam Report** |
| 7 | Academic Progress & Reports | `/progress` | Term overview, subjects, test trend, **Analytics Report** (STKV Study & Homework Analytics) |
| 8 | Smart Attendance | `/attendance` | Month calendar, day detail, **Attendance Report**, today confirmation |
| 9 | School Communication Centre | `/messages` | **Notice Board**, Two-Way Digital Diary, **Chat**, class birthdays |
| 10 | Student Service Desk | `/requests` | **Request Panel**: leave, certificates, ID reissue, transport change; status tracking |
| 11 | Fee & Payments | `/fees` | **Pending Fees**, **Paid Fees**, demo payment, receipts |
| 12 | Student Profile & ID | `/profile` | **Student Profile**, **ID Card**, featured badges, Settings, Personalisation Centre |
| 13 | Achievement & Recognition Centre | `/achievements` | Level and XP, badges, STKV Champion League, STKV Student Achievement Passport |
| 14 | Wellbeing & Safe Support | `/wellbeing` | Mood check-in, talk to someone (booking), report a concern (anonymous option), help lines |
| 15 | Ride & Gate Tracker (pilot) | `/ride` | Bus ETA, boarded / reached school / dropped confirmations, running-late note. Labelled "Pilot · needs school approval" |

## Navigation

Five labelled destinations. Labels are always visible.

| Tab | Opens | Purpose |
|---|---|---|
| Home | Module 1 | Today and tomorrow at a glance |
| Learn | Hub for modules 2–7 | Everything about lessons, work, tests and results |
| School | Hub for modules 8–11, 14, 15 | Attendance, messages, requests, fees, support, transport |
| Achievements | Module 13 | Badges, league, passport |
| Profile | Module 12 | Profile, ID, settings |

- Phone (< 768 px): floating bottom dock.
- Tablet (768–1199 px): navigation rail on the left.
- Desktop (≥ 1200 px): sidebar with the five tabs plus the 15 modules grouped; content up to 1120 px wide with multi-column layouts.
- Global: notification bell, One Search and the **All features** directory (every module once, grouped Learn / School / You).
- Depth: tab → module → detail. Detail screens open as pages (push) or bottom sheets (quick looks). No level deeper than three.

## Journey
1. Welcome → Sign in (Student ID + password, demo values prefilled) → Onboarding (name → age and gender (optional) → class and division → language and theme) → Home.
2. Signing out returns to Welcome. Saved data stays on the device; "Reset demo data" in Settings clears it.

## Sample data rules
- One student, one class (7 B unless changed in onboarding), one timetable, one set of teachers.
- Dates are relative to the device's today, so the demo always looks current. Sunday is a holiday.
- The same records feed every screen: e.g. the Hindi test appears in Tomorrow Brief, Timetable, Exams, Progress and Study (Daily Recall).
- All names are fictional. No real student data.
