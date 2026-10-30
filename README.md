# Dregg

⚠️ **Disclaimer:** This entire project is vibecoded and probably trash. It is a
throwaway experiment and should not be used by anyone. No guarantees, no support,
no warranty of any kind. Use at your own risk (or better, don't use it at all).

Dregg is a web app for learning Gregg shorthand, inspired by [keybr.com](https://keybr.com): a small
set of strokes at a time, real words that can be written with only those strokes, and mastery-based
unlocks. It is mobile-first, installable, and works offline after the first load.

The prototype in `Gregg Drill.html` is kept unchanged as a reference. The rebuild lives in `app/`.

## Run it

The app is plain ES modules with no runtime dependencies and no build step. Serve `app/` over HTTP
(ES modules and service workers do not run from `file://`):

```sh
python3 -m http.server 8765
# open http://localhost:8765/app/
```

To try the installed/offline path, open the page on an HTTPS origin (or localhost), add it to the
Home Screen, then enable Airplane Mode. See [`docs/OFFLINE-IOS.md`](docs/OFFLINE-IOS.md).

## What is implemented

- **Onboarding** — three short steps, daily goal, no account or permissions.
- **Today** — one primary action, mastery ring, streak, weak spots, new-stroke notice.
- **Practice** — Read, Write, Trace, and Drill in one adaptive session; seeded and reproducible.
- **Hide learned strokes** — a one-tap toggle in Practice (and a default in Settings) that hides
  model outlines and stroke hints while you work. Feedback still reveals the answer.
- **Chart** — the full inventory, grouped by family and direction, with locked strokes visible.
- **Explorer** — audited lexicon first, spelling heuristic second, clearly marked unverified.
- **Progress** — per-unit mastery grid, 14-day volume, session history, export/import/reset.
- **Settings** — Core/Precision track, session length, question types, theme, sound, haptics, storage and
  offline status, backup, credits.
- **PWA** — manifest, icons, service worker, strict CSP, cache-first offline shell.
- **Storage** — versioned `localStorage`, migration from v1, export/import validation, reset.

Core teaches four vowel shapes (`a`, `e`, `o`, `u`). Precision adds the twelve-sign Anniversary
vowel matrix. The Precision track unlocks after Core is complete.

## Practice corpus

`app/js/data/lexicon.js` ships **2,005 real words** selected from CMUdict pronunciations and a
frequency list. Selection is coverage-balanced: common words first, then top-ups so every learned
unit and every curriculum phase has enough practice material. No synthetic spellings are generated;
Gregg is phonemic, so an invented spelling asks the learner to guess a pronunciation that is not in
their vocabulary. The file is about 37KB gzipped.

The build and audit tools live in `tools/`:

```sh
npm test            # unit, engine, storage, coverage, golden tests
npm run coverage    # phase and per-unit coverage gates
npm run audit       # lexicon integrity and coverage audit
npm run golden      # docs/outline-sheet.html visual review sheet
npm run golden:check
npm run precache    # regenerate app/sw.js after changing app files
```

Sources, licenses, and refresh steps are in [`tools/sources.md`](tools/sources.md).

## Privacy and network

There is no backend, no account, no analytics, and no runtime fetch. The app stores progress only in
this browser. Export a JSON backup from Progress or Settings if you want a copy. After install, the
service worker serves the app cache-first, so sessions work with no network.

## Layout

```
app/            static app: HTML, CSS, ES modules, manifest, service worker, icons
docs/           spec, plan, design, shorthand references, outline notes
tools/          lexicon generation, coverage, audit, golden sheet, precache, icons
tests/          node:test suites and golden SVG snapshots
Gregg Drill.html  untouched prototype
```

## Documents

- [Product spec](docs/SPEC.md) — what we are building and why
- [Build plan](docs/PLAN.md) — architecture, data pipeline, milestones, testing
- [Stroke reference](docs/STROKE-REFERENCE.md) — the full unit inventory, phoneme mapping, geometry
- [Gregg generator report](docs/GREGG-GENERATOR-REPORT.md) — scanned-book geometry, joins, and how to build the generator
- [Advanced Gregg report](docs/GREGG-ADVANCED-REPORT.md) — later chapters, advanced forms, and what not to generate
- [Combinations](docs/COMBINATIONS.md) — joins, allographs, contractions, and real-world variation
- [Anniversary scan references](docs/reference/anniversary/README.md) — the printed pages the generator should match
- [Handwriting scoring](docs/HANDWRITING.md) — what can and cannot be graded automatically
- [Design direction](docs/DESIGN.md) — minimalist near-white paper, retro serif, one accent
- [Offline use on iPhone](docs/OFFLINE-IOS.md) — install, offline verification, troubleshooting
- [Outline notes](docs/OUTLINE-NOTES.md) — known hard cases and intent

The generator is not a font or a naive stroke concatenation. The **primary visual model** is the
scanned 1929 Anniversary Edition in [`docs/reference/anniversary/`](docs/reference/anniversary/README.md).
Start with [`GREGG-GENERATOR-REPORT.md`](docs/GREGG-GENERATOR-REPORT.md) for the geometry, joins,
vowel-placement rules, and the refinement workflow.
