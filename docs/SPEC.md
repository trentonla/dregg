# Dregg — Product Spec

**Status:** Decisions locked; ready for M0.
**Date:** 2026-10-28
**Supersedes:** the prototype `Gregg Drill.html`
**Name:** Dregg (a keybr for Gregg shorthand)

---

## 1. Summary

Dregg is a mobile-first web app that teaches Gregg shorthand from zero using an adaptive,
keybr-style curriculum: a small set of strokes at a time, real words that can be written with only
those strokes, mastery-based unlocks, and practice in both reading and writing.

The prototype proved the core loop. This rebuild replaces its ad-hoc stroke set and spelling-based
word list with a complete, phonemic, testable model of the Gregg system, and turns the single drill
into a structured learning app that works on a phone, tablet, or desktop.

---

## 2. Why rebuild

The prototype (`Gregg Drill.html`) has these limitations:

| Area | Prototype | Rebuild |
| --- | --- | --- |
| Consonants | 9 (`n m t d k r l g s`) | All 20 |
| Vowel signs | 3 (`a e o`) | 12 Anniversary signs (Core: 4), plus 4 diphthongs |
| Vowel quality | Long/short collapsed silently | Explicit Core → Precision progression |
| Diphthongs | None | ī, ow, oi, ū |
| Glides | None | Initial/medial `w`, `y` rules |
| Word data | ~200 hand-written spelling→stroke strings | Phonemic lexicon, build-time generated and audited |
| Word selection | Random from fixed list | Weighted to weakest unit, coverage-gated |
| Mastery | Rough EMA over letters | Per-unit accuracy + confidence, explicit unlock rules |
| Modes | Read, write (self-grade) | Read, write, trace, drill, optional dictation |
| Mobile | Desktop-first, small canvas | Thumb-first layout, stylus canvas, PWA/offline |
| Distribution | Double-click a local HTML file | One-time static deploy; install via Safari; fully offline |
| Theme | Warm cream and bright vermillion | Near-white paper, retro serif, one restrained accent |
| Rendering | Approximate quadratic joins | Primitive stroke engine + join/vowel rules + golden corpus |
| Persistence | Untyped blob | Versioned schema, export/import |

The most important gap is not cosmetic: the prototype cannot express most of Gregg. A learner who
finishes its 12 units still cannot write `p`, `b`, `f`, `v`, `ch`, `j`, `sh`, `th`, `h`, `ng`, `nk`,
`w`, `y`, any `u`/`oo` sound, any long-vowel distinction, or any diphthong.

---

## 3. Goals and non-goals

### Goals

1. Teach the complete Anniversary consonant, vowel, diphthong, glide, and blend inventory.
2. Make the keybr loop work for shorthand: short sessions, adaptive focus, mastery unlocks.
3. Teach reading **and** writing, since shorthand is a motor skill first.
4. Render consistent, explainable outlines — and say when a join is an approximation.
5. Work well on phones (finger or stylus), tablets, and desktop browsers.
6. Be installed once from a static host, then work **fully offline** — no accounts, no sync, and no
   runtime network requests. All progress stays on the device.
7. Keep the curriculum, lexicon, and rendering data-driven and covered by tests.

### Non-goals for v1

- Speed/reporting drills (120+ WPM), phrasing, and dictation at speed.
- Brief forms and phraseography as a required part of the curriculum. (A dedicated optional module
  is designed for after v1; see §7.3.)
- User accounts, cloud sync, and social features. The app is intentionally single-user and
  local-only.
- Any feature that requires a network request after installation.
- A true home-screen app installed from a local `file://` HTML file. iOS requires HTTPS for
  installability and service workers; see [`OFFLINE-IOS.md`](OFFLINE-IOS.md).
- Automatic handwriting recognition of arbitrary outlines. Trace mode scores similarity; free
  writing is self-graded.
- Non-English Gregg adaptations.
- Teaching penmanship (paper angle, pen grip) beyond on-screen guidance.

---

## 4. Audience and outcomes

**Primary audience:** an adult beginner who wants to take faster handwritten notes and is willing to
practice 5–10 minutes a day. They may have tried the prototype or a textbook and stalled.

**Secondary audience:** a learner who already knows Simplified Gregg and wants to sharpen vowel
precision, or a hobbyist who wants to read historical Gregg.

By the end of the core curriculum a learner should be able to:

- Recognize and write all 20 consonant strokes, 4 core vowel signs, 4 diphthongs, and the `w`/`y`
  positional forms.
- Read and write a core vocabulary of roughly 500 common words from their sounds.
- Explain the placement rules for vowels (inside curves, outside angles, on straight lines).

By the end of the precision phases they should additionally be able to:

- Distinguish and write all 12 Anniversary vowel signs, including dot (broad/short) and tick (long)
  variants.
- Read a short passage written in Anniversary Gregg with the help of a dictionary.

These are learning targets for the curriculum, not measured claims about a particular user.

---

## 5. Design principles

Borrowed from keybr:

- **One new thing at a time.** Introduce a single unit, then practice it in context.
- **Practice the weakest unlocked unit**, not a random sample.
- **Unlock on mastery, never on time served.** No streaks required to progress.
- **Short, repeatable sessions** with a clear end.
- **Immediate, non-punitive feedback.** A miss is information, not a penalty.
- **Minimal chrome.** The outline and the answer are the interface.
- **Quiet, bookish surface.** Monochrome by default, one restrained accent, generous whitespace,
  and a near-white paper ground. The interface should feel like a clean reading room, not a
  stationery store.

Specific to shorthand:

- **Sound first.** Words are chosen and displayed by phoneme, not spelling. Silent letters vanish.
- **Reading scaffolds writing.** Recognition comes before production for each unit, but writing is
  the goal.
- **Show the why.** Every miss can reveal the placement rule, the vowel mark, or the blend that
  caused it.
- **Two precision tracks, one system.** Core (Simplified-compatible) gets a learner usable fast;
  Precision (Anniversary) completes the system without invalidating earlier progress.
- **Mobile is the default surface.** Writing with a finger or stylus is the natural interaction;
  desktop should not be an afterthought but is the secondary surface.

---

## 6. The shorthand system we teach

### 6.1 Edition decision

We teach **Gregg Shorthand Anniversary (1929)** as the complete system, with a **Core**
(Simplified-compatible) presentation for the first phases.

Rationale:

- Anniversary is the canonical edition with the full 12-vowel matrix, 4 diphthongs, and the
  consonant inventory used by all later editions.
- Simplified/Series 90 collapse the vowel distinctions to four signs and drop the dot/tick marks.
  Teaching that first produces usable reading and writing much faster, and it is what most modern
  learners actually use.
- The same unit IDs, lexicon, and renderer support both. Precision is an additive layer, not a
  different app.
- Period references (the 1916 chart and the 1929 Anniversary manual/dictionary) are available for verification.

The reference chart used to author the stroke library is the public-domain 1916 alphabet chart in
[`docs/reference/gregg-alphabet-1916.png`](reference/gregg-alphabet-1916.png). The 1929 Anniversary
vowel table on Wikisource matches its 12-vowel layout. Exact angles and lengths still need a
side-by-side review against the 1929 manual during implementation (see §15).

### 6.2 Unit model

A **unit** is the atomic thing the learner masters. There are five kinds:

| Kind | Examples | Count |
| --- | --- | --- |
| Consonant | `n`, `p`, `ch`, `th`, `ng` | 20 |
| Vowel sign | `a1`, `a2`, `a3`, `e1`… | 12 (4 in Core) |
| Diphthong | `ai`, `ow`, `oi`, `yu` | 4 |
| Glide | `w`, `y` (positional variants) | 2 |
| Blend | `ten`, `dem`, `ent`, `tive` | 6 (Fluency phase, outside the 38 learned signs) |

That is **38 learned units** in the complete system, versus 12 in the prototype. Blends are join
forms rather than new sounds, so they are not counted among the 38. They are still taught
explicitly: each blend unlocks in turn during the Fluency phase, and until it does, a word falls
back to the same consonants written separately. Both outlines are correct Gregg.

**Facets and the two tracks.** A vowel sign carries two kinds of knowledge: *sound* (which family it
belongs to and which word it represents) and *form* (the exact shape and mark). Each vowel sign
tracks both. Core practice credits the sound facet; Precision practice credits both. Core unlock
rules aggregate the sound facets of a family; Precision unlock rules read the form facet. Switching
tracks therefore preserves sound knowledge but does not hand the learner mark mastery they have not
practiced.

A unit has:

```ts
interface Unit {
  id: string;                 // "n", "a2", "ai"
  kind: "consonant" | "vowel" | "diphthong" | "glide" | "blend";
  phonemes: string[];         // ARPAbet, e.g. ["N"]
  label: string;              // "N", "A (art)"
  family?: "a" | "e" | "o" | "u";
  mark?: "none" | "dot" | "tick";
  direction?: "forward" | "downward";
  length?: "short" | "long";
  glyph: GlyphSpec;           // geometry primitive + variants
  description: string;        // plain-language name for a11y and feedback
  examples: string[];         // words that use it
  phase: number;              // curriculum phase
  prerequisites: string[];    // unit ids
}
```

### 6.3 Complete consonant inventory

Directions and lengths are as printed in the 1916 chart. “Forward” means written left-to-right;
“downward” means written down the page. Lengths are relative: short ≈ 1 unit, long ≈ 2 units.

| ID | Sound(s) | Direction | Length | Shape | Notes |
| --- | --- | --- | --- | --- | --- |
| `p` | /p/ | downward | short | curve bowing left `(` | |
| `b` | /b/ | downward | long | curve bowing left `(` | |
| `t` | /t/ | forward | short | straight rising right ≈30° | |
| `d` | /d/ | forward | long | straight rising right ≈30° | |
| `ch` | /tʃ/ | downward | short | straight, down-left ≈45° | |
| `j` | /dʒ/ | downward | long | straight, down-left ≈45° | |
| `k` | /k/ | forward | short | shallow arch (bowing up) | |
| `g` | /ɡ/ | forward | long | shallow arch (bowing up) | |
| `f` | /f/ | downward | short | curve bowing right `)` | |
| `v` | /v/ | downward | long | curve bowing right `)` | |
| `th` | /θ/, /ð/ | forward | short | upward curve | left/right motion variants; voicing is not distinguished by length |
| `s` | /s/, /z/ | downward | short | small curve | left/right variants chosen by context, not tangent |
| `sh` | /ʃ/, /ʒ/ | downward | very short (≈0.6 u) | straight, steep down-left ≈65–70° | very small; steeper than `ch` |
| `l` | /l/ | forward | long | shallow cup (bowing down) | |
| `r` | /r/ | forward | short | shallow cup (bowing down) | stroke before a vowel; post-vocalic circle after a vowel |
| `m` | /m/ | forward | long | horizontal straight | |
| `n` | /n/ | forward | short | horizontal straight | |
| `ng` | /ŋ/ | downward | short | shallow down-right straight | |
| `nk` | /ŋk/ | downward | long | shallow down-right straight | |
| `h` | /h/ | — | — | dot | placed at the vowel |
| `w` | /w/ | glide | — | ōō-hook / under-dash | initial/final hook; medial dash under next vowel; `sw` prefers the hook |
| `y` | /j/ | glide | — | small circle / loops | small circle before a hook vowel; `ye` small loop; `ya` large loop |

The table lists 20 consonants plus the two glides `w` and `y` (counted separately in §6.2). The
`th` unit’s two motion forms count once.

A few conventions:

- `z` is written with `s`; historical editions may add a distinguishing tick. v1 uses `s`.
- `x` is `s` modified in slant at the end of or within a word; `qu` = `k` + medial-`w` dash.
- `zh` uses `sh`.
- `ng` and `nk` are treated as single units because they are single pen movements and extremely
  common.
- `th` is one unit with left/right motion allographs. The learner can start with the right-motion
  form; there is no voiced/voiceless length distinction.

### 6.4 Complete vowel inventory

The 12 Anniversary vowel signs are a 4 × 3 matrix: four shapes (A, E, O, U) × three marks
(plain, dot, tick). This structure is the heart of the “different vowel types” requirement, and it
is much easier to teach than 12 unrelated symbols.

| Family | Plain (short) | Dot (broad/short) | Tick (long) |
| --- | --- | --- | --- |
| **A** — large circle | `a1` ǎ /æ/ *at* | `a2` ä /ɑː/ *art* | `a3` ā /eɪ/ *ale* |
| **E** — small circle | `e1` ǐ /ɪ/ *it* | `e2` ě /ɛ/ *bet* | `e3` ē /iː/ *eat* |
| **O** — small hook | `o1` ǒ /ɒ/ *on* | `o2` aw /ɔː/ *all* | `o3` ō /oʊ/ *old* |
| **U** — small hook (other orientation) | `u1` ŭ /ʌ/ *up* | `u2` ŏŏ /ʊ/ *book* | `u3` ōō /uː/ *food* |

Notes:

- The dot/tick marks sit under the vowel glyph. They are the distinguishing feature; the shape
  alone gives the family.
- In **Core** mode, all three variants in a family render as the plain shape and the marks are
  hidden. The unit IDs still carry the sound, so progress and lexicon filtering remain exact.
- In running Anniversary text the marks are optional when context makes the vowel clear. The app
  teaches them as the precise form and notes the shorthand practice.
- The chart’s “large circle” is an ellipse in practice; render it as an ellipse, not a perfect
  circle, to match the printed model.
- General American merges the vowels in *art* and *on*, but Gregg distinguishes them (`a2` vs `o1`).
  A pure ARPAbet mapping cannot recover the distinction, so the lexicon uses a spelling-aware
  short-o list plus an audited exception table (plan §4.2). This is a data-quality risk, not a
  rendering risk.

### 6.5 Diphthongs

Diphthongs are composite glyphs, not new primitives:

| ID | Sound | Example | Composition |
| --- | --- | --- | --- |
| `ai` | /aɪ/ | *isle* | `a2` (large circle) + `e3` (small circle) |
| `ow` | /aʊ/ | *owl* | `a2` (large circle) + `u3` (oo hook) |
| `oi` | /ɔɪ/ | *oil* | `o2` (aw hook) + `e3` (small circle) |
| `yu` | /juː/ | *unit* | `e3` (small circle) + `u3` (oo hook) |

The composite is placed and joined as one unit so it does not get split across a consonant or
mis-anchored.

### 6.6 Glides and positional forms

These rules are the least certain part of the reference and are flagged for verification; the
primary-source rules are in [`COMBINATIONS.md`](COMBINATIONS.md) §5–§7.

- Initial and final **w** use the ōō-hook shape. Medial **w** is a short dash under the vowel that
  follows; `qu` is `k` plus that dash. After `s` before a circle vowel, the hook is preferred:
  *swim, sweet, swell*.
- Initial **y** uses the small circle (E family) before a hook vowel; `ye` is a small loop and `ya`
  is a large loop. Medial/final **y** usually appears as part of a diphthong (`ai`, `oi`).
- `h` is a dot placed at the vowel, not a full stroke.
- `r` after a vowel is the left-motion circle, not the `r` stroke; use the stroke before a vowel.
- The renderer must choose glide and `r` variants by context, not by a single fixed glyph.

### 6.7 Blends

Certain adjacent straight strokes join at an obtuse angle and are written as one large curve:

| Blend | Example |
| --- | --- |
| `t` + `n`, `d` + `n` | *ten*, *den* |
| `n` + `t`, `n` + `d` | *ent*, *end* |
| `t` + `m`, `d` + `m` | *tem*, *dem* |
| `m` + `t`, `m` + `d` | *emt*, *emd* |
| `d` + `f` + `v`, `t` + `v` | *def-v*, *tive* |
| `j` + `nt` + `d`, `p` + `nt` + `d` | *jent-d*, *pent-d* |

v1 uses explicit composite paths where possible; a fillet is a fallback. Do not blend when a strongly
accented vowel occurs in the syllable (*dean, team, dome*), and prefer the right-motion blend where
`ten`/`den` and `ent`/`end` are both possible. The golden corpus must show each blend next to the
printed model, and the app should label them “blended join” in the explanation panel. The manual also
teaches `ted`/`ded`/`det` and `men`/`mem` as single-stroke blends; they are post-v1. See
[`COMBINATIONS.md`](COMBINATIONS.md) §8.

### 6.8 What “complete” means

The app is complete when every unit in §6.3–§6.5, every V1 combination rule, and every blend has:

- a golden SVG outline,
- a plain-language description,
- at least three example words,
- a curriculum phase and prerequisites,
- coverage in the lexicon (enough words to practice it),
- a test that its glyph renders without gaps or NaN coordinates.

---

## 7. Learning model

### 7.1 Units, items, sessions

- **Unit:** a stroke/vowel sign (§6.2).
- **Item:** one prompt — an outline to read, a word to write, a stroke to identify.
- **Session:** 15–25 items, normally 5–10 minutes.
- **Track:** Core (4 vowel signs) or Precision (12 signs). One curriculum, with precision phases
  appended.

### 7.2 Mastery and unlocks

Per unit, store `attempts`, `correct`, an accuracy EMA, and `lastSeen`.

```
ema       = 0.3 * correct + 0.7 * ema        (starts at 0.5)
confidence = min(1, attempts / 8)
mastery    = ema * confidence
```

An item credits every unit it contains. An item only counts for a unit when the learner has had a
fair chance to use it: in Read mode, the outline is visible; in Write/Trace, the word is visible.
Vowel units update `soundEma` in both tracks and `formEma` only in Precision mode; consonants,
diphthongs, and glides use a single `ema`.

**Unlock rule:** a unit unlocks when every currently unlocked unit has `attempts >= 8` and
`ema >= 0.9`, and the learner has seen at least two items containing the weakest unit in the last
10 trials. Unlock at most one new unit per session, at the end of a successful run.

**Focus rule:** the next item’s word is weighted toward the unlocked unit with the lowest mastery,
with a recency penalty so the same word does not repeat within 20 items. At least one in three
items must contain the focus unit when a suitable word exists.

Mastery never decreases from time passing. A unit not seen recently is down-weighted for
selection, not marked as lost.

### 7.3 Curriculum

The order below is a starting hypothesis; the coverage tool (§Plan) is the source of truth and may
reorder units within a phase.

| Phase | Name | New units | Core examples | Why here |
| --- | --- | --- | --- | --- |
| 1 | Foundations | `n m t d a e` | *man, ten, date, mean* | Highest-frequency strokes plus the two circles; unlocks many CVC words |
| 2 | Core expansion | `k g r l o` | *cat, dog, log, road* | Builds the first large word families (cat, dog, rock, log) |
| 3 | Sibilants & H | `s u h` | *sun, hug, hand, sit* | Plurals, `-s`, short-u words, the h dot |
| 4 | Labials | `p b f v` | *pan, bed, fun, save* | Completes the common stop/fricative pairs |
| 5 | Affricates | `ch j sh th` | *chat, jet, ship, thin* | High-frequency word onsets and endings |
| 6 | Nasals & glides | `ng nk w y` | *sing, bank, win, yes* | *-ing*, *-nk*, *we/way/yes/you* |
| 7 | Diphthongs | `ai ow oi yu` | *my, how, boy, use* | *I/my/time*, *how/now*, *boy/oil*, *you/use* |
| 8 | Precision I — long vowels | `a3 e3 o3 u3` | *make, team, home, food* | Tick marks; switches rendering to Full for these sounds |
| 9 | Precision II — broad/short vowels | `a2 e2 o2 u2` | *art, bet, all, book* | Dot marks; completes the 12-sign matrix |
| 10 | Fluency | blends | *ten, end, stem, active* | Reading speed and smooth joins; each blend unlocks in turn |
| 11 | Brief forms (post-v1) | `bf_*` | *the, and, of, to* | Real Gregg speed work |

Notes:

- The “Core examples” column assumes the Core track, where vowel variants share one sign. In
  Precision-from-start, the engine introduces the tick/dot mark a word needs before using that word.
- Phase 7 introduces diphthongs before precision because they are unavoidable in common words
  (*I*, *my*, *how*, *now*, *you*).
- Phases 8–9 are the “different vowel types” payoff. They are contrast drills: the same word is
  shown with the base sign and the marked sign, and the learner chooses the precise one.
- The default path is **Core → Precision**. A “Precision from the start” option is deferred; the
  unit model supports it later, but onboarding does not present it in v1.
- Brief forms are memorized abbreviations, not generated from strokes. Four high-frequency forms
  (*the, and, of, to*) are stored as strokes and drilled separately from the generated word mix; the
  rest of the manual's list is still post-v1.

### 7.4 Lexicon and item generation

The lexicon is a build-time artifact, not a runtime dictionary:

```ts
interface Word {
  w: string;              // "team"
  ipa?: string;           // "tiːm"
  arpabet: string[];      // ["T","IY","M"]
  core: string[];         // ["t","e","m"]
  full: string[];         // ["t","e3","m"]
  tier: 1 | 2 | 3 | 4 | 5; // frequency band
  tags?: string[];        // ["long-e", "cvvc"]
  notes?: string;         // audit flags
}
```

The shipped lexicon contains real words only. Selection is coverage-balanced: start from the most
frequent usable words, then top up any learned unit or phase prefix that is short of material. The
current build is 2,005 words at roughly 37KB gzipped. Synthetic spellings were considered and
rejected: Gregg is phonemic, so an invented spelling asks the learner to infer a pronunciation that
is not in their vocabulary. A future onset/rime drill can cover productive word parts without
polluting the main corpus.

Generation:

1. Filter to words whose active-track units are all unlocked.
2. Score by focus-unit presence, recency, tier, length, and syllable-shape variety.
3. Draw with a seeded RNG so tests are reproducible.
4. Enforce: no word within the last 20 items; at least one focus unit per three items; prefer
   tier 1–2 words unless the focus unit is rare.
5. Fall back to relaxing tier/length before unlocking anything early.

A **coverage gate** runs in CI: for every curriculum prefix, at least 20 eligible words must exist,
and each newly introduced unit must appear in at least 5 eligible words within the next two phases.
If a phase fails, the curriculum order changes — not the gate.

**Homophones and ambiguity.** In Core mode the vowel variants collapse, so several spellings can
share an outline (*team* / *teem*, or *meet* / *meat*). Read mode accepts any spelling whose
active-track units match, and the feedback lists the accepted set. The lexicon groups spellings by
unit sequence. Homographs with different pronunciations use the most common pronunciation in v1 and
are flagged in the audit. This ambiguity is a property of Gregg, not a bug: it is also the clearest
demonstration of what Precision mode buys the learner.

### 7.5 Session shape

1. **Warm-up (3 items):** the two weakest units, single-stroke drills or short words.
2. **Main set (12–18 items):** mixed read/write according to the mode setting; focus unit appears
   at least every third item.
3. **Cooldown (2 items):** review the oldest weak unit and today’s focus.
4. **Unlock (optional):** if the rule fires, introduce one new unit with a short explanation and two
   easy items, then end on a win.
5. **Summary:** accuracy, time, units practiced, new unit, and a one-line recommendation for next
   time.

### 7.6 Feedback

- **Correct:** show the word, outline, and unit breakdown; auto-advance after a short pause in Read
  mode; require an explicit “Next” in Write/Trace.
- **Incorrect:** show the correct answer, highlight the missed unit, and give one sentence of
  explanation (“The circle sits inside the `r` curve.”). Offer “Try again” once in Write/Trace.
- **Give up:** always available; it reveals the answer and counts as a miss, without penalty copy.
- **Unlock:** a quiet celebration, the new glyph, its name, and two example words.
- Never use red for a wrong answer alone; pair color with an icon and text.

---

## 8. Practice modes

| Mode | Prompt | Response | Auto-graded | Best on |
| --- | --- | --- | --- | --- |
| **Read** | Outline | Type the English word (or 4-choice assist) | Yes | All devices |
| **Write** | Word + phonemes | Draw on canvas or paper | Self-grade + overlay | Tablet/stylus, paper |
| **Trace** | Ghost outline | Trace each stroke | Yes (shape similarity) | Phone/tablet |
| **Drill** | Glyph, sound, or description | Choose/answer | Yes | All devices |
| **Dictation** (optional) | Spoken word | Write the outline | Self-grade | Tablet/stylus |

Mode rules:

- Read is the default on first run; it teaches recognition and is usable with a keyboard.
- Trace is the recommended mobile mode once a unit is introduced; it gives the motor pattern.
- Write is the “real” test; on desktop, pen and paper is explicitly encouraged, with a reveal and
  self-grade.
- A session setting can mix modes (“Mostly read”, “Mostly write”, “Mixed”).
- Dictation uses `speechSynthesis` and is optional because voice availability varies.

---

## 9. Screens and navigation

### Onboarding (3 short steps)

1. What Gregg is and what the app will do (one screen).
2. How vowels work: four core shapes now, precision marks later. No track choice in v1.
3. Daily goal (5/10/15 minutes) and the Safari install instructions.

No account, no email, no permissions.

### Today (home)

- Continue button (resumes or starts a session).
- Thin progress line (or a small mastery ring): units mastered / total in the active track.
- Streak and daily goal.
- “Weak spots” list: 3 units with mastery bars; tapping opens a targeted drill.
- A quiet “New unit ready” notice when one is available.

### Practice

- Full-screen focused route.
- Top: progress bar, exit, mode label.
- Center: prompt stage (outline or word) on paper, with no card behind it; canvas or answer input.
- Bottom: primary action, reveal/give up, undo/clear in drawing modes.
- A one-tap **Hide learned strokes** toggle, also available as a default in Settings. It hides model
  outlines and stroke hints during the item; the Read prompt and Trace ghost stay because they are
  the exercise. Feedback always reveals the answer and breakdown.
- After each item: feedback panel with the outline breakdown.

### Chart

- Full unit inventory grouped by family (A/E/O/U circles and hooks; consonants by direction).
- Locked units are dimmed but visible; tapping shows the glyph, sound, description, examples, and
  the phase where it unlocks.
- A “blend” section with the six blended joins.
- A “brief forms” teaser (disabled in v1) if we want to signal the roadmap.

### Word explorer

- Type a word → see its phonemes, unit sequence, and outline.
- If the word is in the lexicon, show the audited outline. If not, show a heuristic outline with a
  visible “unverified” badge and a “copy details” action for feedback.
- Recent words and “practice this word” action.

### Progress

- Per-unit mastery grid, sortable by weakest.
- Accuracy and volume over time (last 14 days).
- Session history.
- Export/import/reset.

### Settings

- Vowel display: Core / Precision (Precision becomes available after the precision phase unlocks).
- Hide learned strokes (default off), also toggleable during Practice.
- Session length, and which question types (read, write, trace, drill) are in rotation.
- Sound on/off (dictation only).
- Theme: system/light/dark.
- Haptics (mobile, optional).
- Storage status (“Persistent” / “Best effort”), last saved time, export backup.
- Offline/install status and the Safari “Add to Home Screen” instructions.
- Export/import/reset.
- About, edition notes, credits, and the outline-accuracy disclaimer.

### Navigation

- Mobile: bottom tab bar (Today, Practice, Chart, Progress, More) with 44px targets.
- Desktop: left sidebar with the same sections; content max-width ~1040px.
- Practice is a route, not a modal, so the back button behaves predictably.

### Visual direction

Minimal and quiet, closer to monkeytype than to a textbook page: mostly monochrome, one restrained
accent, generous whitespace, and the outline as the hero. Paper is near-white with only a hint of
warmth (`#FBFAF7`, not the prototype’s `#F6F1E7`); ink is near-black; a retro book serif carries
words and headings (system `Iowan Old Style` / Palatino / Georgia), system sans carries controls,
and a mono face carries phonemes. No gradients, paper textures, heavy shadows, or stacked cards.

Full color tokens, type scale, component rules, and screen-level guidance are in
[`DESIGN.md`](DESIGN.md). The theme is a deliberate departure from the prototype’s cream-and-
vermillion look.

---

## 10. Mobile and web requirements

### Layout

- Mobile-first, 320px minimum width; fluid type with `clamp()`.
- Safe-area insets for notches and home indicators.
- Touch targets ≥44×44px; no hover-only controls.
- One-handed primary actions at the bottom of the viewport.
- The drawing canvas fills available width and at least 45% of viewport height in landscape.

### Input

- Read mode: `inputmode="text"`, `autocapitalize="off"`, `autocorrect="off"`,
  `spellcheck="false"`, `enterkeyhint="done"`; submit on exact match; Enter also works.
- Use the `visualViewport` API to keep the input and feedback above the keyboard.
- Drawing: Pointer Events with `touch-action: none`, `setPointerCapture`, coalesced events, and
  device-pixel-ratio scaling. Prevent page scroll while drawing.
- Undo per stroke and a clear-all action; confirm only for clear-all if strokes exist.
- Palm rejection is delegated to the OS; provide a “pen only” note and a large canvas.

### PWA / offline

**Distribution model.** The app is published once to a static host (GitHub Pages recommended; any
HTTPS static host works), then installed on the phone via Safari → Share → **Add to Home Screen** →
**Open as Web App**. No Apple Developer account, App Store, signing, or paid service is involved.
After the first successful load, the service worker serves everything from cache: **usage is never
tied to being online.**

**Why hosting is required once.** iOS installability and service workers both require HTTPS (or
localhost). A local `file://` HTML file cannot be added as a standalone home-screen web app, and
service workers do not register from `file://`. The one-time deploy is what makes the offline app
possible. See [`OFFLINE-IOS.md`](OFFLINE-IOS.md) for the exact steps, limitations, and test
protocol.

**Install and cache.**

- HTTPS origin, `manifest.webmanifest` with name, short name, 192/512 icons (maskable), standalone
  display, theme/background colors, `start_url`, and `scope`.
- Service worker precaches the complete app shell, CSS, JS modules, icons, and lexicon. Cache-first
  with a versioned cache; no runtime dependency on the network.
- The UI shows “Preparing offline…” until `navigator.serviceWorker.ready` and the cache are
  populated, then “Ready offline.” Do not claim offline readiness before that check passes.
- Call `navigator.storage.persist()` after install. Home Screen web apps have their own counter for
  Safari’s 7-day script-writable-storage cap and are the most durable storage case, but persistent
  mode is still worth requesting. Offer export backups regardless.
- Update flow: bump the cache version on deploy. When online, the new worker installs in the
  background and a toast offers “Reload to update.” Offline use continues on the cached version
  indefinitely; updating is optional.
- No external fonts, analytics, CDNs, or runtime lexicon fetches. Optional speech uses on-device
  voices; if a voice is unavailable, the app continues without it and never requires a download. A
  strict CSP (`default-src 'self'`; `connect-src 'none'`) should make accidental network calls fail.
- `beforeinstallprompt` is unavailable on iOS; show the Safari share-sheet instructions instead.

### Accessibility

- Keyboard play for Read/Drill modes; visible focus rings.
- `aria-live="polite"` for answer feedback and unlock announcements.
- Every glyph has a text label and description; outlines get an `aria-label` with the word.
- Do not encode correctness with color alone.
- Respect `prefers-reduced-motion`; the ink-draw animation becomes instant.
- Contrast targets: WCAG AA for text; AA for large glyph strokes against the card background.
- Screen-reader users can use Drill (glyph → name/sound) as an equivalent path.

### Performance

- Initial payload target ≤150KB gzip (HTML + CSS + JS + lexicon subset); total precache target
  ≤2MB (code, lexicon, icons, and any self-hosted fonts).
- No external font requests; use a system serif stack for the bookish feel and `system-ui` for
  controls.
- Lazy-load the full lexicon if it exceeds the budget, but keep everything needed for a complete
  session in the precache.
- Lighthouse mobile performance ≥90; no layout shift when the outline loads.

### Privacy

- Local-only storage. No analytics, no accounts, and no network calls after installation.
- Progress stays on the device. Export/import is for backup and device migration, not sync.
- The static host serves files only; it has no application data and no user accounts.

---

## 11. Rendering and correctness

### Requirements

- One inline SVG per outline, responsive, `currentColor`, round caps/joins, ~2px visual weight.
- Deterministic: the same unit sequence and track always produce the same path.
- The renderer returns not just a path but a **segment list**:

```ts
interface Outline {
  d: string;                 // SVG path data, multiple subpaths allowed
  viewBox: [number, number, number, number];
  segments: Segment[];       // ordered pen movements, for tracing/animation
  placements: Placement[];   // unit, anchor, side, rule — for explanations
}

interface Segment {
  unitId: string;
  kind: "stroke" | "circle" | "hook" | "dot" | "mark" | "dash";
  liftBefore: boolean;
  points: { x: number; y: number }[];
}

interface Placement {
  unitId: string;
  rule: "inside-curve" | "outside-angle" | "on-straight" | "initial" | "final" | "blend";
  side: "left" | "right" | "above" | "below";
  anchorUnitId?: string;
  note: string;              // "Circle sits inside the r curve"
}
```

`segments` powers Trace mode and the “show me” animation; `placements` powers feedback.

### Engine approach

1. **Primitive library.** Each consonant, vowel shape, and mark is a parametric path in a normalized
   coordinate system (short stroke = 1 unit, long = 2 units). Curves are cubic Béziers; circles are
   ellipses; hooks are short cubics; dots are filled circles; marks are tiny lines/dots.
2. **Absolute placement.** Each stroke keeps its canonical orientation and is translated so its
   start touches the previous stroke’s end. It is not rotated to match the incoming tangent; the
   pen changes direction at the join, as in Gregg.
3. **Variant selection.** Strokes with mirror variants (`s`, `th`) are chosen by tangent continuity:
   pick the variant whose start tangent best matches the previous end tangent. Glides choose
   initial/medial/final variants by position.
4. **Vowel anchoring.** For a vowel between consonants, use the preceding consonant’s end (or the
   following consonant’s start if the vowel is initial). Determine the side by the rule hierarchy:
   inside a curve → outside an angle → on top of a straight line. Place the glyph tangent to the
   anchor, with the hook orientation from a small lookup table.
5. **Joins and blends.** For straight–straight joins with a gentle turn, apply a fillet of radius
   proportional to the turn; this produces the `ten`/`ent`-style blends. Mark these placements as
   `blend`.
6. **Fit and emit.** Compute the bounding box with padding, emit the SVG path, and produce the
   segment/placement metadata.
7. **Overrides.** If a word’s default layout is wrong (a known hard case), allow a curated
   `outlineOverride` in the lexicon. Overrides are a last resort and must be tested.

### Correctness process

- **Golden sheet:** an HTML page that renders every unit, the 12-vowel matrix, the diphthongs, the
  six blends, and a 100-word corpus next to the printed reference. Reviewed visually and checked
  into the repo as snapshots.
- **Snapshot tests:** compare the path `d` strings for the golden corpus; intentional changes
  require an explicit update flag.
- **Invariants:** no NaN/Infinity, every segment has ≥2 distinct points, the viewBox contains all
  points, and no unintended pen lift between consonants.
- **Honesty:** where a join is approximated, the UI says so. The app should not present a
  guess as authoritative penmanship.

### Known hard cases (to verify against the 1929 manual)

- `w` and `y` positional rules, especially medial `w` and final `y`.
- `th` vs `dh` length; whether the short/long pair is standard in Anniversary.
- `sh` angle relative to `ch`/`j`; `ng`/`nk` curvature.
- Vowel placement when two curves meet (inside which curve?).
- Circles attached to `s`, `h`, and other tiny strokes.
- Diphthong ligature shapes (`ai`, `ow`, `oi`, `yu`).
- The six blend shapes and their exact curvature.

These are implementation tasks in the plan, not hand-waves: each gets a golden image and a test.

---

## 12. Data and persistence

### Storage

- `localStorage` keys: `dregg.v2.settings`, `dregg.v2.progress`, `dregg.v2.history`.
- Version field on every record; migrations run on load and are covered by tests.
- Progress payload target <100KB; history capped (e.g., last 200 sessions).
- Call `navigator.storage.persist()` on launch and surface the result in Settings (“Storage:
  persistent / best effort”). Home Screen web apps are the most durable iOS case; persistence is
  still best-effort under system storage pressure.
- Show a quiet “Last saved …” line and offer an export reminder, because no cloud copy exists.
- Single user, single device. There is no sync, merge, or server-side account.

```ts
interface Progress {
  version: 2;
  createdAt: string;
  track: "core" | "precision";
  units: Record<string, UnitStat>;
  sessions: SessionSummary[];
  streak: { current: number; best: number; lastDay: string | null };
}

interface UnitStat {
  attempts: number;
  correct: number;
  ema: number;              // consonants, diphthongs, glides
  soundEma?: number;        // vowels: family/sound knowledge
  formEma?: number;         // vowels: exact mark, Precision only
  lastSeen: string | null;
  unlocked: boolean;
}
```

### Export/import

- Export a single JSON file with `version`, settings, progress, and history. This is the backup and
  device-migration path, not a sync feature.
- Import validates the schema, shows a summary (“23 units, 14 sessions”), and asks before replacing.
- Use the Web Share API on mobile where available; otherwise download a file.
- Never silently merge.

### Reset

- Reset progress for the active track only, or everything. Both require confirmation that names
  what will be lost.

---

## 13. Success criteria

### Functional

- All 38 learned units and 6 blends render and have descriptions/examples.
- Every curriculum phase passes the coverage gate (≥20 eligible words; each new unit in ≥5 words).
- Read, Write, Trace, and Drill modes complete a session on phone, tablet, and desktop.
- Unlock rules fire correctly and persist across reload.
- Export → reset → import restores progress exactly.
- The word explorer returns an outline for any typed word, flagged `unverified` when heuristic.
- After installation, the app launches from the Home Screen with the phone in Airplane Mode,
  completes a full session, reloads, and retains progress.

### Technical

- No console errors on the target browser matrix.
- Lighthouse mobile: performance ≥90, accessibility ≥95, PWA installable.
- Initial payload ≤150KB gzip; total precache ≤2MB; outline render <5ms on a mid-range phone.
- No runtime network requests after installation; strict CSP in place.
- Installs on iPhone via Safari “Add to Home Screen” without an Apple Developer account.
- Unit tests cover phoneme mapping, filtering, mastery, unlocks, storage migration, and geometry
  invariants.

### Usability

- A new user can complete onboarding and 10 items without external help.
- The drawing canvas does not scroll the page, lose strokes, or misalign on high-DPI screens.
- The app is usable one-handed on a 375px-wide phone.
- Feedback always explains a miss in one sentence.
- The offline install flow is clear enough to complete from the README, without a developer.

---

## 14. Out of scope / future

- Brief forms and phrasing module.
- Speed building (timed dictation, 60/80/100 WPM ladders).
- Handwriting recognition and penmanship scoring beyond trace similarity.
- Additional languages/adaptations.
- Printable drill sheets and progress reports.
- Cloud sync and accounts are **not** deferred; they are explicitly out of scope by design.
- Teacher/classroom mode is not planned; this is a single-learner app.

---

## 15. Decisions locked and remaining choices

Locked:

1. **Vowel progression:** Core first, then Precision. The full 12-sign matrix is included, but it is
   an earnable layer.
2. **Offline model:** one-time static deploy, then fully offline; no cloud sync, accounts, or runtime
   network requests.
3. **Brief forms:** out of v1.
4. **Dictation:** out of v1 (phase 2 at the earliest).
5. **Accent:** General American, with the A/O split handled by an audited short-o list.
6. **Visual direction:** minimalist and near-white paper, retro book serif, one restrained accent;
   see [`DESIGN.md`](DESIGN.md).
7. **Name:** Dregg.
8. **Hosting:** a free static host, GitHub Pages recommended; no Apple Developer account.

Remaining choices for the builder:

- Is a **public GitHub repository** acceptable for free GitHub Pages? (Private Pages requires a paid
  GitHub plan. The repo contains no personal data; progress stays on the device.) If not, choose
  Netlify or Cloudflare Pages.
- Use the **system serif stack** (free, offline, native on iOS) or self-host one open-source serif
  for cross-platform consistency? The recommendation is the system stack.

---

## Appendix A — Prototype vs rebuild inventory

| Prototype unit | Rebuild status |
| --- | --- |
| `n m t d k r l g s` | Kept, now part of all 20 consonants |
| `a e o` | Kept as Core shapes; expanded to 12 signs |
| — | Added `p b f v ch j sh th h ng nk w y` |
| — | Added `u`, `oo`, long/broad vowel marks |
| — | Added `ai ow oi yu` |
| — | Added blends, h-dot, s variants, glide rules |

## Appendix B — Reference

- Public-domain alphabet chart: [`reference/gregg-alphabet-1916.png`](reference/gregg-alphabet-1916.png)
  (Gregg, *Gregg Shorthand: New and Revised Edition*, 1916).
- Wikisource, *Gregg Shorthand (Anniversary Edition), The Alphabet of Gregg Shorthand* — corroborates
  the forward/downward grouping and the 12-vowel table.
- Wikipedia, *Gregg shorthand* — phonemic principle, vowel families, diphthong compositions, W/Y
  behavior.
- The 1929 Anniversary manual and dictionary remain the authority for exact stroke geometry and
  contextual variants; implementation must do a side-by-side review.
