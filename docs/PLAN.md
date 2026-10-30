# Dregg — Build Plan

**Companion to:** [`SPEC.md`](SPEC.md), [`STROKE-REFERENCE.md`](STROKE-REFERENCE.md),
[`GREGG-GENERATOR-REPORT.md`](GREGG-GENERATOR-REPORT.md),
[`GREGG-ADVANCED-REPORT.md`](GREGG-ADVANCED-REPORT.md), [`COMBINATIONS.md`](COMBINATIONS.md),
[`HANDWRITING.md`](HANDWRITING.md), [`DESIGN.md`](DESIGN.md), and [`OFFLINE-IOS.md`](OFFLINE-IOS.md)
**Status:** Implemented; v1 lives in `app/`.
**Target:** a static, installable web app that runs on phones, tablets, and desktop.

---

## 0. Current status

The app, tools, and tests are in place. `npm test`, `npm run coverage`, `npm run audit`,
`npm run golden:check`, and `npm run precache:check` pass. The PWA shell was smoke-tested in headless
Chrome (onboarding → session → summary → chart → explorer → progress → settings, no console errors).

Known v1 simplifications, relative to the milestone text below:

- Sessions use a seeded mode cycle with a focus unit every third item. The warm-up/cooldown framing
  in `SPEC.md` §7.5 is folded into focus weighting rather than separate phases.
- Dictation is not a mode; the sound setting adds a “Hear it” button in Write.
- The lexicon is 2,005 real words, not the 1,000–1,500 originally budgeted. It still fits the gzip
  budget (about 37KB).
- Precision is reachable after every Core unit is unlocked, not after a separate precision phase.

---

## 0. For the implementing agent

Read in this order: `SPEC.md` → `STROKE-REFERENCE.md` → `GREGG-GENERATOR-REPORT.md` →
`GREGG-ADVANCED-REPORT.md` → `COMBINATIONS.md` → `HANDWRITING.md` → `DESIGN.md` → `OFFLINE-IOS.md` →
this plan. Run **M0** (the offline distribution spike) before building any app features. Do not edit
`Gregg Drill.html`; it is the reference prototype. Keep the runtime dependency-free and the network
surface at zero after install.

---

## 1. Strategy

Build the hard, reusable parts first — the stroke library and the word/curriculum data — then put a
small UI on top. Prove the offline install before writing the app. Ship in vertical slices so there
is something demonstrable after each milestone:

0. **Prove offline:** deploy a minimal shell, install it on the iPhone, and verify Airplane Mode.

1. **See it:** every stroke and vowel renders correctly in a chart.
2. **Read it:** a complete adaptive reading session with real words.
3. **Write it:** canvas writing and guided tracing.
4. **Complete it:** all 12 vowels, diphthongs, glides, and blends.
5. **Ship it:** PWA, accessibility, offline, export/import, device testing.

The existing `Gregg Drill.html` stays untouched as a reference and fallback. The rebuild lives in
`app/`.

---

## 2. Technical decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Language | Modern JavaScript (ES2020), ES modules | No framework overhead; testable in Node |
| UI | Vanilla DOM + small render functions | The app has ~6 screens; a framework would add weight |
| Routing | Hash-based (`#/today`, `#/practice`) | No server rewrites; works on GitHub Pages subpaths and offline |
| Rendering | Inline SVG, generated from primitives | Crisp at any size, easy to animate and snapshot |
| Build step | None for the app | `python3 -m http.server` locally; any static host in production |
| Tooling | Node 20+ for lexicon generation and tests | Node is already available; no runtime dependency |
| Styling | CSS custom properties + system font stack | Fast, themeable, no webfont requests |
| Storage | `localStorage`, versioned, plus `navigator.storage.persist()` | Private, offline, no backend |
| Distribution | GitHub Pages (public repo), install once | Free HTTPS, no Apple Developer account, no server |
| Offline | Service worker precache, cache-first, strict CSP | Usage never depends on the network after install |
| Build step | No app bundling; `tools/precache.mjs` generates the SW asset list before deploy | Keeps the runtime dependency-free |
| Audio | `speechSynthesis` (optional) | On-device voices; never required for a session |
| Tests | `node:test` + golden SVG snapshots | Zero dependencies; deterministic |

Why ES modules rather than classic scripts: clean imports, direct Node testing, and no global
namespace. The tradeoff is that `file://` is not an installable path on iOS anyway, so local
development uses a one-line static server and real-device testing uses the deployed HTTPS site. See
[`OFFLINE-IOS.md`](OFFLINE-IOS.md).

---

## 3. Repository layout

```
app/
  index.html
  manifest.webmanifest
  sw.js
  icons/
    icon-192.png
    icon-512.png
    maskable-512.png
  css/
    tokens.css          # colors, type, spacing, light/dark
    base.css            # reset, layout, a11y utilities
    app.css             # shell, nav, cards
    practice.css        # session, canvas, feedback
  js/
    main.js             # bootstrap, router
    router.js
    store.js            # app state, subscriptions
    storage.js          # versioned localStorage + migrations
    offline.js          # SW registration, readiness, persist()
    rng.js              # seeded RNG
    units.js            # unit definitions (glyphs + metadata)
    geometry.js         # primitives, Bézier helpers, bounds, fillets
    outline.js          # unit sequence -> SVG path + segments + placements
    phonemes.js         # ARPAbet -> units, special sequences
    combinations.js     # allographs, joins, contractions, omissions
    curriculum.js       # phases, prerequisites, unlock config
    engine.js           # item selection, mastery, session logic
    grader.js           # answer normalization, trace similarity
    audio.js            # speechSynthesis wrapper
    data/
      lexicon.js        # generated word records
    ui/
      components.js     # outline card, chip, progress ring, toast
      today.js
      practice.js
      chart.js
      explorer.js
      progress.js
      settings.js
      onboarding.js
    draw/
      canvas.js         # pointer capture, DPR, smoothing
      trace.js          # target overlay + similarity scoring
      animate.js        # "show me" ink animation
.github/workflows/
  pages.yml             # deploy app/ to GitHub Pages
tools/
  build-lexicon.mjs     # CMUdict + frequency list -> data/lexicon.js
  audit-lexicon.mjs     # writes review CSV / flags
  coverage.mjs          # curriculum coverage gates
  golden.mjs            # renders golden SVGs + review sheet
  precache.mjs          # scans app/ and writes the SW precache list
  sources.md            # licenses, source URLs, refresh instructions
tests/
  units.test.mjs
  phonemes.test.mjs
  combinations.test.mjs
  outline.test.mjs
  engine.test.mjs
  storage.test.mjs
  coverage.test.mjs
  golden/               # checked-in SVG snapshots
docs/
  SPEC.md
  STROKE-REFERENCE.md
  PLAN.md
  GREGG-GENERATOR-REPORT.md # scanned-book geometry and generator guidance
  GREGG-ADVANCED-REPORT.md # later chapters, advanced forms, refinement
  DESIGN.md             # visual system and tokens
  COMBINATIONS.md       # joins, allographs, contractions, real-world variation
  HANDWRITING.md        # handwriting scoring feasibility and rubric
  OFFLINE-IOS.md        # install, offline verification, troubleshooting
  OUTLINE-NOTES.md      # intentional approximations and known hard cases
  reference/
    gregg-alphabet-1916.png
    anniversary/        # scanned Anniversary pages; see its README
```

`app/js/data/lexicon.js` is committed. It is generated, but it is an ordinary ES module so the app
has no fetch/build dependency at runtime.

---

## 4. Data pipeline

### 4.1 Sources

| Data | Source | License / handling |
| --- | --- | --- |
| Pronunciations | CMU Pronouncing Dictionary (ARPAbet) | BSD-2-Clause; use during generation, ship only the selected subset with attribution |
| Frequency tiers | A permissively licensed frequency list (e.g. `wordfreq` output) | Verify license; commit the derived tier values, not the source database |
| Stroke geometry | 1916 public-domain chart; Anniversary manual text via Wikisource | 1916 chart is public domain; Wikisource text is CC BY-SA. Cite both, and do not redistribute scanned manual pages. |
| Word definitions | Optional; not needed for v1 | Keep the app lean |

Network access is only needed for the one-time lexicon generation and for looking up reference
material. The shipped app performs no network requests. The generation tool reads local copies
(vendored or downloaded once); `tools/sources.md` records URLs, licenses, and refresh steps.

### 4.2 Generation steps

1. **Select candidates.** Lowercase ASCII words, 2–12 letters, 1–3 syllables, no apostrophes or
   hyphens in v1. Intersect CMUdict with the frequency list, then choose ~8,000 real words by
   frequency plus per-unit and per-phase coverage top-ups. No synthetic spellings.
2. **Get pronunciations.** CMUdict lookup, including variants. Choose the most common pronunciation;
   flag words with multiple pronunciations for audit.
3. **Apply the mapping** from `STROKE-REFERENCE.md` §6, including:
   - `NG K` → `nk`
   - schwa policy (`AH0` → `u1`)
   - syllabic consonants drop the schwa
   - `Y UW` → `yu` when initial
4. **Derive Core and Full units.** Full keeps the vowel variant (`e3`); Core collapses the family
   (`e`). Store both.
5. **Filter for teachability.** Drop words with units that would require an out-of-phase unit for
   too long; drop homographs with confusing spellings; keep tier 1–2 words preferentially.
6. **Audit.** Emit a CSV with word, IPA, ARPAbet, Core units, Full units, tier, and flags. Review:
   - every word in phases 1–6,
   - the first 300 words overall,
   - all words containing schwa, `w`, `y`, `th`, `ng`/`nk`, or a diphthong.
7. **Emit** `app/js/data/lexicon.js` sorted by word, plus a summary report (counts by tier, unit,
   and phase).
8. **Gate** the build with `tools/coverage.mjs`.

**The A/O split (important).** General American merges the vowels in *art* and *on*, but Gregg
distinguishes them (`a2` vs `o1`). A pure ARPAbet mapping cannot recover the distinction. The
generator therefore uses a spelling-aware short-`o` list (words such as *hot, dog, log, rock, on,
not, top, stop*) plus an audited exception table; everything else follows ARPAbet. Flag every AA/AO
word in the audit CSV. If the list proves unreliable, fall back to a curated word → vowel table for
the top 500 words.

### 4.3 Coverage gates

For every curriculum prefix:

- at least 20 eligible words exist;
- each unit introduced in that phase appears in at least 5 eligible words within the next two
  phases;
- no phase has fewer than 5 new words per new unit on average.

The tool prints a table of phase, unlocked units, eligible words, and per-unit exposure. If a gate
fails, reorder the curriculum or add audited words; do not weaken the gate silently.

### 4.4 Size budget

Target under ~40KB gzip. The current build is 2,005 real words: about 232KB raw and 36.6KB gzip in
`app/js/data/lexicon.js`. Keep it under budget; if a future expansion needs more, split into an
eager core tier and an on-demand larger tier rather than growing the initial download.

### 4.5 Reference corpora and research

These sources inform the stroke library, the combination rules, and the handwriting rubric. **None of
their data is shipped with the app.** They are reference and validation material only; the shipped
lexicon is derived from CMUdict plus our own audited overrides.

| Source | What it is | Use | License / handling |
| --- | --- | --- | --- |
| 1916 alphabet chart | Public-domain plate from *Gregg Shorthand: New and Revised Edition* | Primary visual reference for glyph shapes and the six chart blends | Public domain; already in `docs/reference/` |
| *Anniversary Edition* manual | Text of Chapters 1–7 on Wikisource | Primary source for joins, allographs, contractions, and omissions; see `COMBINATIONS.md` | CC BY-SA text; cite, do not copy long passages into the app |
| Gregg-1916 (`anonimously/Gregg1916-Recognition`) | ~15,711 printed word images from a 1916 Gregg dictionary | Visual comparison of printed joined words; synthetic pretraining research | Repository declares **no license**; do not ship images or derived data |
| GreggBF (`lyshasilva/GreggBF`) | 3,753 handwritten brief-form images, 139 classes, 27 writers | Research on writer variability and isolated brief-form classification | Undergraduate dataset, not formally validated; do not assume a permissive license; do not ship |
| text2Gregg (`steno.tu-clausthal.de/Gregg.php`) | Server-side text→Gregg generator with SVG/GIF export; the site's samples identify it as Centennial | Secondary visual cross-check of whole-word outlines; discovering running forms | No explicit license; copyright S. J. Šarman; do not scrape or ship output; typeset, not handwritten; edition mismatch |
| LION (Heil & Nauwerck) | 2,900 handwritten Melin shorthand lines, Swedish | Difficulty calibration and HTR baselines (best 44.8–48.2% WER) | Not Gregg; do not train a Gregg model on it |

**Rules for using this material.**

- Read and cite; do not copy glyph images, word images, or dataset records into the repository or the
  app bundle.
- If a public-domain manual page is needed for the golden sheet, verify its provenance first and keep
  it in `docs/reference/` with a source note.
- Treat a corpus statistic as evidence about difficulty, not as a specification. The manual and the
  1916 chart are the specification.
- **text2Gregg is a second opinion, not an oracle.** It emits a whole-word typeset form from a
  font/dictionary, not a unit sequence, and does not expose stroke order or rules. Its samples point
  to **Centennial**, while Dregg teaches Anniversary. Do not use it to generate app data, and do not
  scrape or redistribute its SVG/GIF output without permission.
- When a rule is text-verified but the illustration is missing (the Wikisource pages strip glyph
  images), mark the geometry ◐/○ in `STROKE-REFERENCE.md` and log it in `OUTLINE-NOTES.md`.

---

## 5. Outline engine plan

### 5.1 Modules

- `geometry.js`: point/vector math, cubic Bézier sampling, bounding boxes, tangent estimation,
  fillet construction, path serialization.
- `units.js`: the data dictionary. Each unit has a `GlyphSpec` and optional variants; vowels carry
  family/mark metadata; diphthongs carry component IDs.
- `combinations.js`: the rule layer. Allograph selection (`s`, `th`, `r`, `w`, `y`, `l`, `x`), join
  variants (`pr`/`pl`, `br`/`bl`, `fr`/`fl`, `kr`/`gl`, `gr`/`kl`, `rk`/`lk`, `ld`), blends, and
  productive contractions. Rules are declarative and carry `stage` and `confidence` metadata; see
  [`COMBINATIONS.md`](COMBINATIONS.md).
- `outline.js`: the layout algorithm. Input: `units: string[]`, `track: "core" | "precision"`,
  `form: "full" | "running"` (v1 always `full`), options. Output: `Outline` with `d`, `viewBox`,
  `segments`, `placements`, `contractions`.

### 5.2 Layout algorithm

```
units = applyContractions(units, contractions)   // longest match, prefix/suffix; COMBINATIONS §9
pen = (0,0)
segments = []
placements = []

for each unit in sequence:
    switch unit.kind:
      consonant -> chooseAllograph; chooseJoinVariant(next); translate to pen; append; update pen/tangent
      vowel     -> chooseAnchor; chooseSide; orient; place tangent; append; update pen
      diphthong -> placeComposite at anchor/side; append
      glide     -> choose positional variant (initial/medial/final); place; append

applyFillets(segments, blendRules)
addMarks(segments, placements)
fitViewBox(segments, padding)
serialize(d)
```

Implementation notes:

- **Contractions first.** Apply productive contractions before layout, so `-tion` becomes `sh` and
  `convention` becomes `k` + … before any glyph is chosen. Longest match wins; keep the applied rules
  in the result so the UI can explain them.
- **Allographs are explicit rules.** Do not choose `s` or `th` by tangent continuity alone. Use the
  distribution tables in `COMBINATIONS.md` §4 and §6. `r` is a stroke before a vowel and a circle
  after one (§5). Expose the chosen variant in `Placement`.
- **Absolute orientation, with precomputed join variants.** Translate consonant primitives; do not
  rotate them at runtime. The documented joins (`pr`, `pl`, `br`, `bl`, `fr`, `fl`, `kr`, `gl`, `gr`,
  `kl`, `rk`, `lk`, `ld`) select a precomputed variant of the first unit. That keeps output
  deterministic and testable.
- **Pen lifts:** circles, dots, and marks are separate subpaths. Consecutive consonants share a
  point.
- **Tangent continuity:** compute start/end tangents numerically from the Bézier control points; use
  them for join variants and fillets.
- **Fillets:** replace a corner with a cubic whose handles lie along the incoming/outgoing directions;
  radius scales with the turn angle. Clamp to avoid overshoot on short strokes. Prefer explicit blend
  paths over fillets for the six chart blends.
- **Vowel placement:** use `SPEC.md` §11 / `STROKE-REFERENCE.md` §7. Return the rule and side in
  `Placement` so the UI can explain it.
- **Overrides:** `Word.outlineOverride` is an escape hatch. Store it as a unit sequence plus
  placement hints, not a raw path, so it still scales and animates.

### 5.3 Visual review loop

`tools/golden.mjs` produces `docs/outline-sheet.html`:

- one row per consonant (glyph, name, description);
- the 4 × 3 vowel matrix;
- the four diphthongs;
- the six chart blends;
- combination rows: `pr`/`pl`, `br`/`bl`, `fr`/`fl`, `kr`/`gl`, `gr`/`kl`, `ld`; the `s` and `th`
  distributions; the post-vocalic `r` circle; `-tion`, `-ing`, `-ly`, `con`/`com`;
- a 100-word corpus, each with its unit breakdown.

Open it at phone width and desktop width. Compare against the chart. Iterate constants until the
shapes are close enough to read fluently. Only then write snapshot tests.

### 5.4 Snapshot tests

`node tools/golden.mjs --check` regenerates the paths and diffs them against
`tests/golden/*.svg`. Intentional geometry changes require `--update`, which should be a reviewed
commit with the visual sheet attached. Snapshots catch accidental regressions, not subjective
quality.

### 5.5 Approximations

Some joins will not match a printed manual exactly. That is acceptable if:

- the outline is unambiguous when read,
- the app labels it as a simplified join when relevant,
- the case is recorded in `docs/OUTLINE-NOTES.md` with the reason and a reference image.

Do not let perfect typography block the learning loop. Do not hide approximations either.

---

## 6. Application architecture

```
UI (screens) ──> store ──> engine ──> curriculum + lexicon
                   │           │
                   │           └──> outline (for rendering)
                   └──> storage (localStorage)
```

- **store.js** holds the active track, settings, progress, current session, and current route. It
  exposes `getState`, `dispatch`, and `subscribe`. Screens re-render on relevant changes.
- **engine.js** is pure: given progress, curriculum, lexicon, and an RNG, it returns the next item,
  grades an attempt, and decides unlocks. This makes it fully testable without the DOM.
- **grader.js** normalizes answers and scores traces. It does not touch the DOM.
- **ui/** modules render and attach event listeners; they call engine functions and dispatch
  results. No business logic in event handlers.
- **draw/** owns pointer capture and coordinate transforms; it emits stroke point arrays.
- **storage.js** validates and migrates records; the rest of the app never touches `localStorage`
  directly.

### State shape

```ts
interface AppState {
  route: "onboarding" | "today" | "practice" | "chart" | "explorer" | "progress" | "settings";
  track: "core" | "precision";
  settings: { sessionLength: number; modeMix: "read" | "write" | "mixed"; sound: boolean; theme: ... };
  progress: Progress;
  session: SessionState | null;
  toast: Toast | null;
}
```

### Session state

```ts
interface SessionState {
  id: string;
  seed: number;
  items: Item[];        // pre-generated or generated lazily from the seed
  index: number;
  results: Result[];
  startedAt: number;
  focusUnit: string;
  unlockCandidate: string | null;
}
```

Pre-generate a session’s item queue from a seed so the back button, reload, or a test can reproduce
it. If an item is answered in a way that changes mastery, the remaining queue can still be
regenerated from the seed plus a short attempt log.

---

## 7. Milestones

Estimates are focused engineering days for one developer, excluding content review time. Treat them
as ordering, not a promise.

### M0 — Offline distribution spike (0.5–1 day)

**Goal:** prove the riskiest constraint before building the app: a one-time static deploy can be
installed on the actual iPhone and used in Airplane Mode.

**Deliverables**

- Minimal `app/` shell (“Dregg — offline test”) with a manifest, icons, service worker, one
  CSS/JS asset, and a tiny `localStorage` counter.
- GitHub Pages deploy (or alternative host) from a public repo.
- Install on the actual iPhone via Safari → Add to Home Screen → Open as Web App.
- A short result note in `docs/OFFLINE-IOS.md`: iOS version, install path, cache behavior, storage
  persistence, and any quirks.

**Exit criteria**

- The icon launches standalone (no Safari chrome).
- Airplane Mode + force-quit + relaunch: the shell loads and the counter persists.
- No runtime requests are observed (desktop network panel or Safari Web Inspector); the Airplane
  Mode cold launch is the primary check.
- It works with no Apple Developer account and no paid service.
- If any of this fails, stop and choose a different distribution approach before M1.

### M1 — See it (3–5 days)

**Deliverables**

- `app/` scaffold, design tokens from [`DESIGN.md`](DESIGN.md), light/dark theme, shell/nav.
- `units.js` with all 20 consonants, 12 vowels, 4 diphthongs, 2 glides, 6 blends.
- `combinations.js` v0: allograph and join rules from [`COMBINATIONS.md`](COMBINATIONS.md) §3–§7.
- A visual reference sheet from [`docs/reference/anniversary/`](reference/anniversary/README.md), used
  for the first golden comparison.
- `geometry.js` + `outline.js` v0 for consonants and circles/hooks/marks.
- Chart screen and `docs/outline-sheet.html`.
- Basic unit tests for geometry invariants.

**Exit criteria**

- Every unit renders; the chart is usable on a 375px phone.
- The 20 consonants and 12-vowel matrix are visually reviewed by the user.
- The `s`, `th`, and post-vocalic `r` allographs select the printed form in test words.
- Known hard cases are listed in `OUTLINE-NOTES.md`.

### M2 — Read it (3–5 days)

**Deliverables**

- Lexicon pipeline + 2,005-word real lexicon; all phase 1–6 words reviewed in the audit CSV.
- Contraction pass for the V1 rules in `COMBINATIONS.md` §9.1, with an audited word per rule.
- Coverage report and curriculum phases 1–6.
- `store`, `storage`, `engine`, mastery, unlock rules, seeded item generation.
- Today screen, onboarding, Read mode, feedback, summary.
- Persistence and reset.

**Exit criteria**

- A 20-item reading session works on phone and desktop.
- Words only use unlocked units; focus weighting is visible in the unit stats.
- Unlock fires once, persists across reload, and is covered by tests.
- Coverage gates pass for phases 1–6.
- Each V1 contraction has at least one golden word and one negative test.

### M3 — Write it (3–4 days)

**Deliverables**

- Canvas with pointer capture, DPR scaling, smoothing, undo/clear.
- Write mode: word + phonemes → draw → reveal overlay → self-grade.
- Trace mode: ghost outline, per-stroke guidance, similarity score.
- Scoring follows [`HANDWRITING.md`](HANDWRITING.md): trace conformity in v1, prompted
  free-write conformity as a research spike, self-grade always available.
- “Show me” animation in stroke order.
- Mobile keyboard/scroll handling.

**Exit criteria**

- Drawing does not scroll or misalign on iPhone Safari and Android Chrome.
- A learner can complete a mixed session with finger, stylus, and mouse.
- Trace scoring accepts reasonable traces and rejects wrong directions.
- The scorer accepts documented variants (post-vocalic `r` circle, `-ed` joined/disjoined, optional
  vowel marks) and reports which matched; see `HANDWRITING.md` §3.8.
- Reduced-motion mode disables the ink animation.

### M4 — Complete it (2–3 days)

**Deliverables**

- Phases 7–10: diphthongs, long-vowel ticks, broad/short dots, blend fluency.
- V1.5 contractions from `COMBINATIONS.md` §9.2, each with an audited word and a negative test.
- Precision rendering (marks) and Core/Precision switching without losing progress.
- Contrast drills for vowel variants.
- Explanations for placement and vowel marks.

**Exit criteria**

- All 38 units are reachable; coverage gates pass for every phase.
- Switching tracks does not corrupt unit stats or unlock state.
- The 12-vowel matrix and four diphthongs are visually reviewed.
- The V1.5 contraction set renders correctly and does not collide with a different word (*complete*/*keep*, *baggage*/*package*).

### M5 — Ship it (2–3 days)

**Deliverables**

- Manifest, icons, service worker, generated precache list, install flow, update toast.
- Offline readiness UI (“Preparing offline…” → “Ready offline”), `navigator.storage.persist()`,
  and a storage-status line in Settings.
- Strict CSP and a no-runtime-network audit.
- Accessibility pass: keyboard, ARIA live feedback, focus management, contrast.
- Export/import with schema validation and an export reminder.
- Word explorer with “unverified” heuristic outlines.
- Error/empty states, About/credits/disclaimer, and the Safari install instructions.

**Exit criteria**

- Lighthouse mobile: performance ≥90, accessibility ≥95, installable.
- Installed on the actual iPhone; launches standalone from the Home Screen.
- Airplane Mode: a full session, a reload, and progress retention all work.
- The network panel shows zero runtime requests after install.
- Export → reset → import restores progress exactly.
- No console errors on the device matrix.

### M6 — Harden (1–2 days)

- Full test pass, golden snapshot review, storage migration test.
- Performance profiling of outline render and canvas.
- Documentation: README, local dev, deploy, offline install, data refresh, known limits.
- Self-test on the actual iPhone; optional bug bash with one other learner.

### Optional M7 — Extend

- Dictation mode (hear → write).
- Brief forms module.
- Printable drill sheets.
- Speed ladder.
- Additional languages/adaptations.

Cloud sync and accounts are explicitly out of scope and are not on this list.

---

## 8. Testing strategy

### Unit tests (`node --test`)

- `phonemes`: ARPAbet → units for a table of representative words; special sequences (`nk`, `qu`,
  `x`, syllabic consonants); schwa policy.
- `outline`: no NaN, every segment has distinct points, bounds contain all points, deterministic
  output for the same input, variant selection for `s`/`th`.
- `engine`: eligibility filtering, focus weighting bounds, no repeats within 20, unlock rule,
  determinism from a seed, and vowel facet updates across Core/Precision switching.
- `storage`: migration from v1/v2 fixtures, corrupt data falls back safely, export/import round-trip.
- `grader`: answer normalization, trace similarity thresholds.

### Golden tests

- All units + 100-word corpus rendered to SVG.
- `--check` diff in CI.
- A human reviews the sheet at each milestone.

### Coverage tests

- `tools/coverage.mjs` exits non-zero if any phase gate fails.
- Run in CI on every lexicon/curriculum change.

### Offline and install

- Install on a clean iPhone (or a fresh Safari profile) from the deployed HTTPS URL.
- Confirm the icon opens standalone with no browser chrome.
- First run online until “Ready offline” appears; then enable Airplane Mode.
- Force-quit and relaunch; complete a full session; reload; confirm progress persists.
- Check the network panel: zero requests after the first load, and no CSP violations.
- Test the update path: deploy a new cache version, open online, accept the reload, then go offline
  again and confirm the new version is cached.
- Test a denied or unsuccessful `navigator.storage.persist()` result; the app must still work and
  show “best effort” in Settings.

### Manual device matrix

| Device | Browser | Focus |
| --- | --- | --- |
| iPhone SE / 13 mini | Safari | Small screen, keyboard, safe areas |
| iPhone 15 | Safari + installed Home Screen app | PWA install, canvas, Airplane Mode |
| iPad + Pencil | Safari | Trace/write latency, palm rejection |
| Pixel | Chrome | Pointer events, canvas |
| Mac/Windows | Chrome, Safari, Firefox | Read/drill, keyboard, layout |
| Desktop | Keyboard only | Accessibility path |

### Accessibility

- Keyboard-only run through onboarding, a read session, and the chart.
- Screen-reader spot check of feedback and unlock announcements.
- Contrast check in light and dark themes.
- `prefers-reduced-motion` check.

### Performance

- Lighthouse mobile on the deployed build.
- Outline render timing measured over 1,000 words.
- Canvas point counts and frame rate during a 10-second trace.

---

## 9. Distribution and deployment

### Model

- Deploy once to a static HTTPS host; install on the iPhone; use fully offline thereafter.
- Recommended: **GitHub Pages from a public repo**, publishing `app/` through
  `.github/workflows/pages.yml`.
- No Apple Developer account, App Store, signing, server, or cloud service. The host only serves
  static files.

### GitHub Pages specifics

- Free GitHub Pages requires a **public** repository. Private Pages requires GitHub Pro. The repo
  contains no personal data; progress stays on the device, so a public repo is acceptable unless
  the source itself must be private.
- Use relative URLs so the app works under `https://<user>.github.io/<repo>/`.
- HTTPS is automatic on `github.io`, which is required for service workers and installability.
- Deploy workflow: checkout → `node tools/precache.mjs` (scans `app/` and writes the SW precache
  list) → upload `app/` as the Pages artifact → deploy.
- Bump `CACHE_VERSION` on every deploy. The service worker installs the new assets in the
  background; the app offers a reload when it is ready.
- A custom domain can be added later with no app changes.

### Install on iPhone

1. Open the Pages URL in **Safari** (not an in-app browser).
2. Wait for the app to show **“Ready offline.”**
3. Tap **Share → Add to Home Screen**, turn on **Open as Web App**, then **Add**.
4. Launch from the new icon, not from a Safari tab.
5. Test in Airplane Mode: complete a session, reload, and confirm progress persists.

Full steps, limitations, and troubleshooting: [`OFFLINE-IOS.md`](OFFLINE-IOS.md).

### Updates

- New deploy + bumped cache version → open online → update toast → reload. Offline use continues on
  the cached version indefinitely; updating is optional.
- If the installed app gets into a bad state, delete the Home Screen icon and re-add it. Progress is
  kept unless website data is cleared, so export a backup first if in doubt.

### Local development

```sh
cd app
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Service workers work on `localhost`. A phone on the same LAN using
`http://<computer-ip>:8080` is **not** a secure context for service workers, so test the installed
PWA on the deployed HTTPS URL. `file://` is not a distribution path.

### Offline guarantees

- Strict CSP (`default-src 'self'`; `connect-src 'none'`) so accidental network calls fail loudly.
- No external fonts, analytics, CDNs, or runtime lexicon fetches.
- The precache list is generated from the actual files; the deploy fails if an asset is missing.
- `navigator.storage.persist()` plus an export reminder, because no cloud copy exists.

---

## 10. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Outline fidelity (joins, vowel placement) | High | High | Golden sheet, overrides, honest labels, phased review; don’t block the loop on typography |
| Combination-rule errors (wrong `s`/`th`/`r` variant, bad contraction) | High | High | `COMBINATIONS.md` rule tables, a golden word per rule, negative tests, honest labels |
| Lexicon pronunciation errors | High | High | Curated subset + audit CSV; flag uncertain words; ship “unverified” badge for heuristics |
| Curriculum dead zones (too few words) | Medium | High | Coverage gates; reorder phases; add audited words |
| iOS install/offline behavior differs from expectations | Medium | High | M0 spike on the actual phone; readiness indicator; written test protocol in `OFFLINE-IOS.md` |
| iOS storage eviction or user clears website data | Medium | High | Home Screen install, `navigator.storage.persist()`, export backup, “Last saved” line |
| Stale service worker / update confusion | Medium | Medium | Versioned cache, update toast, documented delete-and-re-add recovery |
| Public repo requirement for free GitHub Pages | Low | Low | No personal data in the repo; use Netlify/Cloudflare if private source is required |
| Mobile drawing ergonomics | Medium | Medium | Large canvas, pointer capture, trace mode, self-grade fallback, early real-device tests |
| Scope creep (brief forms, speed, sync) | Medium | Medium | Explicit non-goals, milestone exit criteria; sync is out of scope by design |
| Edition confusion (Core vs Anniversary) | Low | Medium | Onboarding explanation, track toggle, About page, consistent labels |
| Performance of animations/SVG | Low | Low | Short paths, rAF, reduced motion, cap corpus size |
| Progress loss (localStorage cleared) | Medium | Medium | Export reminder, versioned schema, no destructive resets without confirmation |

---

## 11. Decision log

- **Vanilla JS + ES modules, no framework.** The app is small and long-lived; fewer dependencies is
  better for offline use.
- **No backend, no sync.** A one-time static deploy exists only to install the app; after that,
  usage is fully offline. Export/import is the backup and device-migration story.
- **Home Screen web app, not `file://`.** iOS requires HTTPS for installability and service workers,
  so the one-time deploy is a deliberate part of the architecture; see `OFFLINE-IOS.md`.
- **Strict CSP and zero runtime network requests.** Offline is enforced, not just intended.
- **Real words, not pseudo-words.** Gregg is phonemic; invented spellings would teach the wrong
  thing.
- **Core-first curriculum.** Gets a learner to usable reading/writing fast; Precision completes the
  system.
- **Self-grade for free writing; auto-grade for tracing.** Full handwriting recognition is out of
  scope and would give false confidence.
- **Commit the generated lexicon.** No build server, no runtime fetch, reproducible data.
- **System serif stack, not a webfont.** The bookish look comes from Iowan Old Style/Palatino/Georgia
  with no network request and no font licensing overhead.
- **Allographs and productive contractions are part of the taught outline.** The contextual forms
  (`s`, `th`, post-vocalic `r`, `w`, `y`, `l`) and the V1 contractions in `COMBINATIONS.md` §9.1 are
  required for correctness; brief forms and phrasing remain post-v1.

---

## 12. Definition of done (v1)

- [ ] All items in SPEC §13 pass.
- [ ] M0–M5 exit criteria met.
- [ ] Every unit and blend has a golden outline and a description.
- [ ] Every V1 combination rule has a golden word and a negative test.
- [ ] Coverage gates pass for all phases.
- [ ] Read, Write, Trace, and Drill work on the device matrix.
- [ ] Installed on the actual iPhone and passes the Airplane Mode test.
- [ ] Zero runtime network requests after install; strict CSP in place.
- [ ] Precache list complete; “Ready offline” indicator accurate.
- [ ] Export/import round-trips.
- [ ] Accessibility checks pass.
- [ ] Visual system follows `DESIGN.md`: near-white paper, retro serif, one restrained accent, no
      card shadows or gradients.
- [ ] `README.md` documents local dev, deploy, offline install, data refresh, and known limits.
- [ ] `OFFLINE-IOS.md` records the tested install and offline behavior.
- [ ] `OUTLINE-NOTES.md` records every intentional approximation.
- [ ] No known critical bugs.

---

## 13. Decisions locked

1. **Core → Precision** progression. The full 12-sign matrix is included as an earnable layer.
2. **No cloud sync or accounts.** One-time static deploy, then fully offline; all progress local.
3. **Brief forms out of v1.**
4. **Dictation out of v1.**
5. **General American**, with the A/O split handled by an audited short-o list.
6. **Visual direction:** minimalist and near-white, retro book serif, one restrained accent; see
   [`DESIGN.md`](DESIGN.md).
7. **Distribution:** GitHub Pages (public repo) recommended; free; no Apple Developer account.
8. **Name:** Dregg.
9. **Taught outline includes required allographs and V1 contractions.** Left/right `s` and `th`, the
   post-vocalic `r` circle, and the V1 contractions in `COMBINATIONS.md` §9.1 are part of correctness;
   brief forms and phrasing remain post-v1. The app distinguishes a full teaching outline from a
   running outline rather than mixing them silently.

Remaining choices for the builder/user:

- Is a **public GitHub repository** acceptable for free GitHub Pages? If not, use Netlify or
  Cloudflare Pages (private source, free tier).
- Use the **system serif stack** (recommended: free, offline, native on iOS) or self-host one
  open-source serif for cross-platform consistency?
