# Interaction map

Every visible control and what it does. "Saved" = persists after refresh (localStorage key `stkv-demo`). States: E = empty, L = loading, S = success, X = error.

## Global
| Control | Result | Saved |
|---|---|---|
| Bell | Opens Notifications | – |
| Search | Opens One Search | Recent searches |
| Dock / rail / sidebar item | Switches tab; indicator slides; scroll restores per tab | Last tab |
| Back (header, Esc, browser back) | Returns to previous screen with reverse transition | – |
| Toast | Confirms an action; auto-hides in 2.5 s; "Undo" where an action is reversible | – |
| New notification (simulated 6 s after Home opens, once per session) | Toast drops in, bell shakes, badge count +1 | Read state |

## Welcome, Sign in, Onboarding
| Control | Result | States | Saved |
|---|---|---|---|
| Get started | Sign in | – | – |
| Language chips (Welcome) | Switch UI language immediately | – | Language |
| Student ID / password | Validated: ID required, password ≥ 4 chars | X inline | – |
| Sign in | L spinner 0.8 s → S check → Onboarding (first time) or Home | X wrong format | Session |
| Use demo account | Fills demo values and signs in | – | Session |
| Onboarding Next / Back | Step 1 name → 2 age, gender (optional) → 3 class, division → 4 language, theme | X per field | Profile |
| Finish | Celebration, then Home | S | Onboarded flag |

## 1 Home / My Day
| Control | Result | Navigates |
|---|---|---|
| Deck period (Today / Tomorrow timeline) | Lifts, detail card updates | – |
| Detail card | – | Timetable for that day |
| Pack-list item | Ticks; stub counts down; all packed → stub tears, toast | Saved |
| Tonight task check | Done/undone; time bar, counts update; XP +5 on done | Saved (shared with Homework) |
| Tonight task text | – | Homework detail |
| Start focus | – | Homework Mode |
| Announcement card | – | Notice detail |
| Exam countdown | – | Test Ready Card |
| Subject row | – | Progress → Subjects |
| Attendance tile | – | Attendance |
| League tile | – | Achievements → League |
| Quick actions (4, customisable in Settings) | – | Chosen module |
| Birthday wish | Sends wish once, button becomes "Wished" | Saved |
| Dinner-Table Question → reveal | Shows answer; Knew it / Needed help / Didn't know | Saved |
| All features | – | Directory |
E: nothing changes tomorrow → "A normal day" message. E: no tasks → "All caught up" illustration.

## Learn hub / School hub / All features
Cards open their module. Directory groups modules; every module appears once.

## 2 Calendar & Timetable
| Control | Result | Saved |
|---|---|---|
| Tabs Day / Week / Month / Events | Switch view, indicator slides | Last tab |
| Day pill | Shows that day's periods; current period highlighted (live) | – |
| Period card | Sheet: teacher, room, topic, changes | – |
| Week view cell | Day load (tests, deadlines); heavy days marked (Clash Guard) | – |
| Month date | Selects date (pill slides); list of that day's items | – |
| Month ‹ › | Previous / next month | – |
| Event RSVP | Going / not going; count updates; toast | Saved |
| Add to my plan | Adds event to Study Planner | Saved |
E: holiday / Sunday → "No school" card.

## 3 Digital Classroom & Library
| Control | Result | Saved |
|---|---|---|
| Subject card | Subject page: now teaching (chapter, pages), materials, recent classwork | – |
| Material item | Sheet preview of the resource | Viewed state |
| Lesson Pulse (Got it / Partly / Lost) per lesson | Recorded; "Ask for help" toggles teacher flag | Saved |
| Library tab: book search | Filters catalogue live | – |
| Renew (once) | Due date +7 days; button disabled after | Saved |
| Reserve | Status "Reserved"; cancel available | Saved |
E: no search results → message with clear-search button.

## 4 Classwork & Homework
| Control | Result | Saved |
|---|---|---|
| Filters (Due tomorrow / This week / Done / All) | Filters list with layout animation | Last filter |
| Homework item | Detail page | – |
| Mark as done (detail) | Check animation, XP +5, toast with Undo | Saved |
| Attach photo | File picker, thumbnail preview, remove | Kept for session (images not persisted) |
| Submit | Confirm dialog → L → S "Submitted at hh:mm"; status chip changes | Saved |
| Ask a doubt | Sheet with text field → sends to Chat thread | Saved |
| Homework Mode: duration chips, Start | Full-screen timer ring; tasks tick; End early needs 4-digit parent PIN (demo 1234) | Session log saved |
| Notebook Check tab | Pending corrections per subject; Mark fixed | Saved |
| Classwork tab | Today's classwork by period | – |

## 5 Study Planner & Revision
| Control | Result | Saved |
|---|---|---|
| Goal check | Completes goal, streak update | Saved |
| Add session | Sheet: subject, minutes, day → added to planner | Saved |
| Daily Recall Start | 5 questions; choose answer → correct/incorrect feedback; summary; spaced repetition | Saved (progress, streak) |
| Dictation Buddy | Play word (speech synthesis if available, else shows word briefly); type answer; check; score | Saved (best score) |

## 6 Examinations
| Control | Result | Saved |
|---|---|---|
| Upcoming exam | Test Ready Card: countdown, portions, question types, practice link | – |
| Mark portion revised | Progress ring on card | Saved |
| Online exam Start | Rules dialog → timed quiz (10 min), question navigator, flag | In-progress answers saved |
| Submit exam | Confirm → score, review answers | Attempt saved |
| Reports tab → exam | Marks per subject, grade, remarks | – |

## 7 Progress & Reports
Tabs Overview / Subjects / Tests / Analytics. Charts animate in on view. Subject row → sheet with test history. No editable data.

## 8 Attendance
| Control | Result | Saved |
|---|---|---|
| Month ‹ › | Changes month (Jul–current) | – |
| Date | Sheet: status, arrival time, periods attended, note | – |
| Today confirmation | Present check animates on first view each day | Seen flag |
| Report tab | Monthly percentages chart + table | – |
| Apply for leave | Service Desk new request (Leave) | – |

## 9 Communication Centre
| Control | Result | Saved |
|---|---|---|
| Tabs Notices / Diary / Chat / Birthdays | Switch | Last tab |
| Notice filter chips | Filter by category | – |
| Notice | Detail page; marks read | Read state |
| Diary note: Mark as seen | Morph to "Seen hh:mm" | Saved |
| Diary note: Reply | Sheet, send; reply shown under note | Saved |
| New note to teacher | Sheet with type (Absence / PE excuse / Other) + text | Saved |
| Chat thread | Conversation; send message; simulated teacher reply after 2 s | Saved |

## 10 Service Desk
| Control | Result | Saved |
|---|---|---|
| New request | Type picker → form (dates, reason) → validation → Submit | Saved |
| Request item | Sheet with timeline (Submitted → In review → Approved), cancel if pending | Saved |
E: no requests → illustration.

## 11 Fees
| Control | Result | Saved |
|---|---|---|
| Pay (pending item) | Sheet: summary → "Pay (demo)" → L → S receipt; no card or UPI details collected | Saved |
| Paid item | Receipt sheet | – |

## 12 Profile, ID, Settings
| Control | Result | Saved |
|---|---|---|
| Edit profile | Form (name, age, gender, class, division) with validation | Saved |
| Avatar | Pick colour and initials style | Saved |
| ID card | Flip to back (emergency contact, validity) | – |
| Language | English / हिंदी / मराठी, instant | Saved |
| Theme | Light / Dark / System | Saved |
| Text size | Standard / Large | Saved |
| Reduce motion | On / Off / System | Saved |
| Notification preferences | Switches per category + quiet hours | Saved |
| Home widgets | Show/hide and reorder (up/down) | Saved |
| Privacy: hide marks on Home, app lock (demo PIN) | Applies immediately | Saved |
| Sign out | Confirm → Welcome | Session cleared |
| Reset demo data | Confirm → everything back to sample | Cleared |

## 13 Achievements
| Control | Result | Saved |
|---|---|---|
| Badge | Sheet with how it was earned or progress to unlock | – |
| Newly earned badge | Celebration overlay on first view | Seen flag |
| League tab | House standings, points feed | – |
| Passport tab | Timeline of certificates and participation; filter by year | – |

## 14 Wellbeing
| Control | Result | Saved |
|---|---|---|
| Mood check-in (5 faces) | Saves today; week strip updates | Saved |
| Talk to someone | Pick person + slot → booked | Saved |
| Report a concern | Form with "stay anonymous" switch → reference number | Saved |
| Help line numbers | Shown as text with copy button | – |

## 15 Ride & Gate (pilot)
Live ETA simulation, stop list, confirmations timeline, "Running late" note to class teacher (saved).
