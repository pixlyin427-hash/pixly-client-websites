# THE LAST TRAIN: Phases 1 & 2

A Roblox multiplayer exploration game. This folder holds:

- **Phase 1:** the Expedition Terminal and its four boarding cabins.
- **The Phase 1 polish pass.**
- **Phase 2:** the train itself.

Everything is plain Luau source plus a ready-to-open place file.

> **Read first.** I could not access the Studio place you built earlier. It was never saved to a file, and this cloud session cannot reach your computer. So everything here was **built new from scratch**. Nothing in your open Studio place was changed or deleted. To keep work from that place, open this file next to it and copy over what you want.

---

## 1. How to open it

### On a PC (Roblox Studio)

1. Download `build/TheLastTrain.rbxlx` from this repository.
2. In Studio, choose **File → Open from File…** and pick it.
3. Press **Play**. The server builds the whole world in about a second, then spawns you in the terminal.
4. To play on your phone: **File → Publish to Roblox**, then open the experience in the Roblox app.

### On a phone (no PC)

Open the 3D browser preview that Claude published (the link is in the chat). It is generated from the same build code, so every part, light and sign is the real layout.

It is still only an approximation:

- materials, fog, shadows and fonts look different in Roblox;
- there is no sound, no players and no interaction.

The preview source is in `preview/`.

### Editing the world by hand (recommended once you start polishing)

The world is built by code at server start, so in Edit mode Workspace looks empty. To turn it into normal, editable parts:

1. In Studio (Edit mode), open **View → Command Bar** and run:
   ```lua
   require(game.ServerScriptService.World.WorldBuilder).Build()
   ```
2. Save the place.

From then on the server sees `Workspace.Lobby` and skips building, so your manual edits are kept.

### Optional: Rojo

`default.project.json` maps `src/` with the standard Rojo layout (`*.server.luau` → Script, `*.client.luau` → LocalScript, `*.luau` → ModuleScript).

---

## 2. Folder and script architecture

```
ReplicatedStorage
└── Shared
    ├── Config
    │   ├── GameConfig          group sizes, countdowns, transition timing, camera, hints
    │   ├── CabinDefinitions    Solo / Duo / Squad / Crew: capacity, size, style
    │   ├── DialogueData        Station Keeper, Conductor, sealed door lines
    │   ├── AudioConfig         every sound id (all empty placeholders, see §5)
    │   └── LightingPresets     "Terminal" and "Train" moods
    ├── Modules
    │   ├── ExpeditionGroup     pure membership logic (unit tested)
    │   ├── Remotes             creates and fetches every RemoteEvent
    │   ├── UITheme             colours and fonts shared by UI and signs
    │   └── Emblem              the train's symbol, drawn with GUI frames
    └── Remotes  (created at runtime)
        ExpeditionRequest, TrainRequest, ExpeditionState, Notice, Transition, TrainState, CabinFeedback

ServerScriptService
├── ServerMain                  the only server Script
├── Services
│   ├── PlayerService           manual character loading and respawn
│   ├── ExpeditionService       cabins: join, leave, leader, start, countdown, depart
│   └── TrainService            boarding the train, spawn slots, return to terminal
└── World                       builders (run once; can be baked into the place)
    ├── WorldBuilder            entry point, runs each step protected
    ├── BuildKit, Props, Graphics
    ├── LightingBuilder, LobbyBuilder, CabinBuilder, EnvironmentBuilder
    ├── TrainBuilder, CarriageInteriors, ExpeditionZoneBuilder
    └── NPCBuilder

StarterPlayer.StarterPlayerScripts
├── ClientMain                  the only LocalScript
├── UI/UIKit                    panels, buttons, responsive scaling, animations
└── Controllers
    SoundController, InterfaceController, TransitionController, ExpeditionController,
    CabinVisualsController, DialogueController, TrainHUDController, ZoneController, ClockController

Workspace (built at runtime)
├── Lobby                       terminal hall, clock, signs, props, Station Keeper
├── ExpeditionCabins            Solo, Duo, Squad, Crew
├── Environment                 train yard, teaser train, distant silhouettes
└── ExpeditionTrain             the playable train, scrolling scenery, Conductor
```

Screen UI is created by the client controllers in code, so there are no ScreenGuis in StarterGui.

---

## 3. What was built

### Expedition Terminal (Phase 1 and its polish pass)

- **Hall:** a train-shed hall, 88 × 130 studs, with:
  - riveted arched iron trusses and a glass skylight ridge;
  - tall arched windows onto a cold railway yard;
  - pilasters, gables and a round north window;
  - a sealed grand entrance under the station nameplate.
- **Two levels:** the arrival concourse, then grand stairs down to the lower platform where the cabins stand.
- **Guidance without arrows.** From the spawn medallion, a lighter stone path with brass inlay leads straight to:
  - the clock;
  - the `LOWER PLATFORM / EXPEDITION CABINS` gantry sign;
  - the cabins.

  A small one-time hint ("Choose an Expedition Cabin to begin.") disappears after you join a cabin.
- **Central landmark:** a 12-stud double-faced station clock hung from the trusses.
  - It has brass bezels and two small lamps, and runs on real local time.
  - The mystery: the train's emblem replaces XII, there is a faint thirteenth mark between XI and XII, and now and then the second hand slips back a tick (with a mechanical sound once you add one).
- **Information board:** "THE LAST TRAIN / EXPEDITIONS DEPART FROM THE LOWER PLATFORM" plus a live departures list (AVAILABLE / BOARDING / FULL / DEPARTING n).
- **Storytelling props:**
  - benches, a coat left on a bench, a luggage cart heading for the platform;
  - expedition crates and a rope coil;
  - mail sacks by the Station Office, and a telescope aimed at the train;
  - travel posters and a "Known Routes" wall map whose route fades into "UNCHARTED".
- **Future cosmetic area:** a closed "Expedition Outfitters" shop front with its shutter down. It has no interaction.
- **The Station Keeper,** by the Station Office:
  - wide-brim hat, long field coat, scarf, satchel and a lit lantern;
  - a drawn face and a small amber talk indicator;
  - short dialogue: "First expedition?" / "The cabins are ready." / "Choose your crew carefully."
- **Train teaser:** through the east windows (best from the viewing bay) the train waits in a foggy yard, headlamp lit and steam rising. It is exterior only and cannot be entered.

### The four cabins

All four share one architecture, with different size, layout and roof:

| Cabin | Capacity | Character |
|---|---|---|
| Solo | 1 | small and private: pitched roof, porthole, armchair, desk with route documents |
| Duo | 2 | compact shared room: arched carriage roof, two-seat bench, wall map |
| Squad | 3 | wider boarding room: flat roof with ventilator, long bench, gear shelf |
| Crew | 4 | largest: steep gable with emblem roundel, lit roof lantern, facing benches, map table, luggage racks |

Each cabin has:

- a name sign;
- **capacity bulbs** (one lights per explorer);
- a counter plate ("2 / 4 EXPLORERS · BOARDING");
- a **semaphore arm and signal lamp** that move with the state (level and dark → raised and amber → high and green);
- **pocket doors** that slide shut for departure;
- a warm interior lamp that brightens slightly while departing.

### The train (Phase 2)

Order: **ENGINE | MYSTERY | CREW | DISCOVERY | EXPLORER | BOARDING**. That is 280 studs; walking from the Boarding carriage to the sealed door takes about 12 seconds.

- **Locomotive:**
  - an original burgundy V-shaped prow guard;
  - an oversized smokebox whose door carries the brass-ringed emblem;
  - a high headlamp with a real SpotLight;
  - a tall flared chimney with slow steam;
  - a brass steam dome and smoke deflectors with emblem roundels;
  - three large spoked driving wheels per side (spokes drawn on the wheel faces, not modelled), with coupling and main rods;
  - a cab with porthole windows and a firebox glow;
  - a tender lettered THE LAST TRAIN.
- **Colours:** charcoal, dark blue-grey steel, restrained burgundy, a little aged brass and warm amber lamps.
- **Carriages:** segmented arched roofs, burgundy beltline, brass sills, name boards and emblem roundels.
- **Boarding carriage:**
  - an arrival space with 8 spawn points, so a group of four never lands inside each other;
  - a route display reading "PREPARING ROUTE";
  - luggage racks and a storage shelf;
  - compartment benches;
  - closed vestibule doors;
  - a rear **observation deck** with invisible guard walls, where the tracks slide away behind you;
  - **The Conductor**, in a peaked cap and ankle-length frock coat, who says: "All aboard." / "The route reveals itself to those who travel it."
- **Explorer carriage:**
  - lockers, a pegboard equipment rack and a central planning table with map and instruments;
  - a preparation bench, a route-engineering desk and storage shelves;
  - **placeholders** for Equipment, Inventory and Upgrades. Each is a model tagged `FutureInteraction`, with a brass placard and an **unlit indicator bulb**, and no UI.
- **Discovery carriage:**
  - archive bookshelves;
  - six **empty** display cases;
  - four empty pedestals;
  - a central marble pedestal with an empty brass cradle under a glass bell jar and a cool spotlight;
  - a specimen-drawer cabinet and a map chest.

  Every display spot is tagged `DiscoveryDisplaySlot` (attribute `SlotId`) for future progression.
- **Crew carriage:**
  - a sofa and armchairs around a low table with an unfinished card game;
  - a round map table;
  - a small bookshelf, a coat rack with hat, a trunk and an umbrella stand;
  - the largest windows, burgundy fabric walls and the warmest light.
- **Mystery carriage:**
  - darker metal, shuttered windows and a large emblem;
  - a thin cold seam of light;
  - its **sealed door** faces the Crew carriage, with an emblem, a three-notch lock with no keyhole and the train's only cold lamp.
  - "Inspect" says: "The door is sealed." / "There is no keyhole. Only the emblem."
  - There is no purchase, no "coming soon" and no explanation.
- **Outside the windows:** night, fog, telegraph poles, firs and boulders slide past.
  - Two layers move at different speeds for parallax; far ridges stay still.
  - One distant tower shows a single cold light.
  - The train itself never moves. The client scrolls the scenery (one `BulkMoveTo` per frame, only while you are aboard).
- **HUD aboard:** a small plate reading "THE LAST TRAIN / EXPEDITION CREW 3 / 4 / • PREPARING ROUTE". There are no currencies, levels or shops.

### UI (PC, tablet, phone)

- The only permanent UI is **MENU** and **SETTINGS** (top right, 42 px tall).
- **Settings:** Ambience / Effects / Interface sound levels and Hints on/off.
- **Menu:** a short explanation and, while aboard, **Return to Terminal**.
- **Expedition card** (right side, clear of the mobile thumbstick and jump button):
  - expedition type, capacity pips, "2 / 4 EXPLORERS", leader, status;
  - START EXPEDITION (leader only) and LEAVE.
- **Countdown:** "EXPEDITION DEPARTING" with a large numeral that fades in each second, without flashing.
- **Transition:** a fade to black with the emblem, "ALL ABOARD / CREW EXPEDITION", then "THE LAST TRAIN / BOARDING CARRIAGE" as the scene fades back.
- **Look:** deep charcoal panels, lamp-amber accents, thin brass strokes and 8–10 px corners. Fonts are Merriweather for names and numerals, Oswald for labels and Gotham for body text.
- **Animations:** fade, an 8–10 px rise and a 3% scale. Nothing bounces.
- **Responsive:** one `UIScale` per panel (0.8× on small phones up to 1.1×). Buttons are at least 46 px before scaling.

### Lighting and sound

- **Terminal:** late dusk with cool fog outside and warm practical lamps inside (about 22 PointLights). Bloom is low (0.35, threshold 1.35).
- **Train:** night, denser blue fog and warm carriage lamps. The client blends between the two presets in 2 seconds.
- **Lighting technology:** ShadowMap. PointLights do not cast shadows, for mobile cost.
- **Sound plan:**
  - three SoundGroups (Ambience / Effects / Interface);
  - zone beds that cross-fade and never stack;
  - positional emitters at the clock, the cabins and the engine;
  - random one-shots (distant metal, creaks, a rare horn) on a single 1 Hz scheduler;
  - the countdown tick, door close and departure whistle.

  **Every sound id is currently empty.** See §5.

---

## 4. The expedition flow (server-authoritative)

1. **Join.** Walk into a cabin and you join; walk out and you leave (after a 0.6 s grace).
   - The server checks positions 5 times a second with a point-in-box test (no Touched events, one loop in total).
   - A full or departing cabin tells you so with a toast.
2. **Leader.** The first explorer in leads. If the leader leaves, the next explorer in join order leads and is told so.
3. **Start.**
   - Only the leader can start, and it needs at least 1 explorer.
   - Starting locks the cabin, closes the doors and runs a countdown: 5 s for groups, 3 s for Solo.
   - The leader is never forced to start: Solo shows START EXPEDITION too.
4. **Leaving is always possible:** the LEAVE button teleports you just outside the door, with a 1.5 s rejoin cooldown.
5. **Leaving during the countdown:**
   - If one explorer leaves or disconnects, the countdown continues for the others.
   - If the last explorer leaves, the cabin resets and the countdown is cancelled.
6. **Departure.**
   - The group fades out together and is placed on free spawn points in the Boarding carriage.
   - The expedition record (members, capacity) stays intact aboard.
   - The cabin's doors stay shut 2.5 s, then it reopens for the next group.
7. **Aboard.** You cannot join a cabin while aboard. Dying respawns you on the train, not in the lobby.
8. **Returning.** Use the Boarding carriage's exit door or MENU → Return to Terminal. Your crew's HUD count updates.

---

## 5. Placeholders and things you must set up yourself

1. **Sounds (required for audio).** Every entry in `ReplicatedStorage.Shared.Config.AudioConfig` has `Id = ""`, so the game is **silent** until you fill them.
   - Each entry has a `Search` hint (for example "old clock ticking loop" or "steam train whistle distant").
   - Pick audio you own or that is free / Roblox-licensed in the Toolbox, and paste `rbxassetid://<number>`.
   - I did not invent ids: I cannot check which audio is public, and a wrong id would put load errors in Output.
2. **No Blender meshes.** Everything is Roblox primitives plus GUI-drawn detail (emblem, wheel spokes, signs, maps, faces).
   - A mesh made here could not get into your place: meshes must be uploaded through Studio's 3D Importer or Open Cloud, and this session has neither.
   - Pieces that would gain most from Blender later: the smokebox and boiler front, spoked driving wheels, the prow guard, the cab roof and the NPC bodies.
   - Each is a clearly named part, easy to swap.
3. **Future systems** (placeholders only, nothing pretends to work):
   - the Equipment, Preparation and Route Engineering stations;
   - the Discovery display slots;
   - the route display text;
   - the Outfitters shop front;
   - the sealed door.
4. **Lighting technology** is ShadowMap (in the place file). Switch to Future in Lighting if you target PC-heavy audiences.
5. **NPCs are static statues.** They have no Humanoid and no idle animation. They are cheap and never glitch, but they do not move.

---

## 6. Testing: what was verified and what was not

**Verified here, offline** (`tools/`, run with `pip install lupa`):

- `python3 tools/run_mock.py syntax`: all 36 Luau files compile.
- `python3 tools/run_mock.py build`: the real WorldBuilder runs end-to-end in a mock engine with no errors.
  - The mock rejects unknown properties, bad enums and nil errors.
  - Result: 2,968 parts (Lobby 632, Cabins 413, Environment 453, Train + world 1,470), 42 lights, 95 semi-transparent parts, 135 SurfaceGuis.
- `python3 tools/run_mock.py test`: **72 checks pass**, including the real ExpeditionService and TrainService with simulated players:
  - Solo full / start / depart / arrive;
  - Crew capacity (a 5th explorer is rejected);
  - a non-leader cannot start;
  - leader leaves → leadership passes on;
  - walking from one cabin into another never leaves you in two at once;
  - a disconnect mid-countdown, and the countdown cancelled when everyone leaves;
  - two groups aboard at once with no overlapping spawn points;
  - return to terminal, and a disconnect while aboard.
- `python3 tools/build_place.py` rebuilds `build/TheLastTrain.rbxlx`.
- The browser preview was rendered and inspected from several viewpoints.

**Not verified** (I have no Roblox Studio here, so do these in Studio):

- [ ] Open the place: no red errors in Output after pressing Play.
- [ ] Spawn on the medallion and follow the path to the cabins.
- [ ] Test → Clients and Servers → 2–4 players:
  - join, leave, the leader handoff;
  - start, the countdown, the fade, arrival in the Boarding carriage.
- [ ] Walk the whole train: doorways and gangways, the camera inside carriages (max zoom 14 aboard), the sealed door prompt, the Conductor.
- [ ] Device emulator (phone): card and buttons don't overlap the thumbstick or jump button, text is readable.
- [ ] Performance on a real phone, and sound once ids are added.

---

## 7. Known limitations (honest list)

- **One train per server.** Two expeditions departing in the same server ride the same physical train.
  - Each keeps its own membership and HUD, and neither can change the other's state.
  - Per-group trains or reserved servers are the next step.
- **No travel yet.** The route display says "PREPARING ROUTE" and there are no stations. That is intentional for Phase 2.
- **Return to Terminal is a development exit,** so you are never stuck aboard.
- **Same world for every server:** the world is built by code at runtime unless you bake it (see §1).
- **The preview is approximate:** the browser preview's colours, fog and text sizes differ from Roblox.
