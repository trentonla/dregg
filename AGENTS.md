# AGENTS.md

Dregg teaches Gregg shorthand (1929 Anniversary) with a rule-based outline
generator. Mobile-first PWA, no runtime dependencies, no network after install.
Live at https://trentonla.github.io/dregg/ (GitHub Pages serves `app/`).

Read this before touching the outline engine. `Gregg Drill.html` is an untouched
prototype: never edit it. README carries a deliberately self-deprecating
disclaimer; keep it.

## Commands

```sh
npm test            # node --test tests/
npm run coverage    # every curriculum phase must have enough eligible words
npm run audit       # lexicon sanity (real words only, unit coverage)
npm run golden      # regenerate docs/outline-sheet.html
npm run golden:check
npm run precache    # rewrite app/sw.js asset list after adding/removing files
npm run precache:check
node tools/golden.mjs --update   # regenerate tests/golden/*.svg + sheet
```

Before committing, run `test`, `coverage`, `audit`, `golden:check`,
`precache:check`. If the outline engine changed, run `--update` first, then
review the sheet and commit the snapshots. If files under `app/` changed, run
`precache`.

Local preview: `python3 -m http.server 8799`, then
`http://localhost:8799/app/index.html`. Delete temporary preview files under
`app/` immediately: `precache` would otherwise list them.

## Layout

- `app/js/units.js` — glyph definitions: strokes, vowels, diphthongs, blends,
  phases. `curve()`, `apex`, `UNIT_FRAME` inputs live here/outline.
- `app/js/outline.js` — geometry and SVG rendering. `pathBuilder`,
  `diphthongPath`, `loopBlendPath`, `markSegment`, blend attachment,
  `referenceViewBox`, `outlineForUnit`, `outlineForWord`.
- `app/js/combinations.js` — join vs. blend choice, `resolveUnits` gating.
- `app/js/engine.js` — sessions, mastery (EMA), unlocks, recommendations.
- `app/js/store.js` — state, persistence, actions screens call.
- `app/js/ui/*.js` — string-template screens, no framework.
- `app/css/app.css` — all styling.
- `docs/STROKE-REFERENCE.md` — stroke geometry rules (§3 vowels, §4
  diphthongs, §5 blends). `docs/OUTLINE-NOTES.md` — decision log.
- `tests/golden/*.svg` — committed snapshots; regenerate, never hand-edit.

## Invariants

- Only real words; never emit a stroke the learner has not unlocked, including
  blends. Blends are gated by the learner's unlocked set; an empty set means
  none.
- Vowel marks sit below the sign. Vowel tick points up-right.
- Diphthongs are one continuous stroke (`diphthong` type, `diphthongPath`).
- Blends after a vowel circle start at the circle's right rim; `-nt/-nd` and
  `-mt/-md` are upward cups; `tive`/`pent` are loops. `pr/pl/br/bl` bow left.
- Fixed frames keep stroke sizes comparable: `UNIT_FRAME = [4.4, 4.5]` centred
  per glyph via `referenceViewBox`, `WORD_FRAME = [7.0, 4.5]` centred per word.
  Short words look smaller by design. Do not reintroduce origin-aligned frames.
- k/g peak right of centre; r/l low point left of centre (`apex`).
- Sessions are memory-only. `ensureSession()` may create one silently; a
  session only appears on Today (resume) after `results.length > 0`.
- Drill options show the stroke label only, never descriptions.
- Mastery tiles show `% accuracy` and `times seen` side by side.
- Chart detail is a bottom sheet over the page on phones (`max-width: 899px`);
  desktop keeps the sticky side panel.

## Gotchas

- No lockfile; deploy uses `npm install`.
- GitHub auth is SSH as `trentonla`; `gh` is not installed. OAuth token:
  `security find-internet-password -s github.com -w` with the REST API.
- Headless Chrome screenshots need a unique `--user-data-dir`; minimum window
  width is 500px. Onboarding blocks fresh profiles: seed
  `localStorage["dregg.v2.settings"]` with `{"onboardingDone":true,"version":2}`
  from a temporary same-origin page.
- `save()` persists settings and progress, not the active session.
- `exitSession()` only finishes a session that has at least one result.

## Style

Smallest complete change. Follow the existing string-template UI and plain
ES modules; no new dependencies, no abstractions for later. Add a small test
for non-trivial branches (parser, money/security, new script). Keep comments to
the non-obvious why.
