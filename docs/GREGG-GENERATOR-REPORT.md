# Dregg — Gregg Generator Report

**Audience:** the implementing agent building the outline generator and lexicon.
**Purpose:** one place to see what the real Anniversary Edition looks like, how to turn a word into a
correct outline, and where the current rules are still approximations.
**Status:** the rules and selected geometry have been checked against the **scanned 1929 Anniversary
Edition**, not only the Wikisource transcription. Page images are in
[`reference/anniversary/`](reference/anniversary/README.md).

---

## 0. The short version

The generator is not a font and not a stroke-by-stroke concatenation. It is a **rule-based layout engine**
with four things that make Gregg look right:

1. **Contextual allographs** — `s`, `th`, `r`, `w`, `y`, `l`, `x` change form by position.
2. **Loop join variants** — `pr`/`pl`, `br`/`bl`, `fr`/`fl` are loops; `kr`/`gl`, `gr`/`kl`, `rk`/`lk`
   are single waves; `ld` has an upward terminal.
3. **Vowel placement** — the circle goes inside a curve, outside an angle, or on a specific side of a
   straight stroke. Marks sit **below** the circle.
4. **Contractions** — `con` = `k`, `-tion` = `sh`, `-ing` = dot, `-ly` = circle, and the rest of the
   productive set. Brief forms and phrasing are a later layer.

If the generator only concatenates `k` + `a` + `t`, it will produce something that looks like shorthand
but is not Gregg. The scans in `reference/anniversary/` are the ground truth for shape; the manual text
in `COMBINATIONS.md` is the ground truth for rules.

**Advanced material** — final `t`/`d` omission, analogical word-beginnings/endings, phrasing, initials,
intersection, and the later chapters — is covered separately in
[`GREGG-ADVANCED-REPORT.md`](GREGG-ADVANCED-REPORT.md). Most of it is post-v1 and should be stored as
whole-word records, not generated.

---

## 1. What was verified

| Source | What it gives us | Confidence |
| --- | --- | --- |
| 1916 alphabet chart, `reference/gregg-alphabet-1916.png` | Individual glyph shapes, six chart blends | High for shapes; no joins |
| Wikisource *Anniversary Edition*, Chapters 1–7 | Rule text, examples, section numbers | High for rules; illustrations stripped |
| Scanned *Anniversary Edition*, pages 17–112 | Actual printed joins, vowel placement, proportions | High for selected pages; not every page was captured |
| `text2Gregg` (`steno.tu-clausthal.de`) | A second opinion on whole-word output | Low as authority: Centennial-oriented, no license, not a rule engine |
| Gregg-1916 / GreggBF / LION | Research and validation only | Do not ship; licensing/validation caveats |

The scanned pages now in the repo cover the parts most likely to make the output look wrong: basic
consonants, A/E vowels, circle placement, `kr`/`gl`/`gr`/`kl`, `pr`/`pl`/`br`/`bl`/`fr`/`fl`, `th`, the
`r` circle, `w`/`wh`, `nt`/`nd`, `ld`, and the `ted`/`men` blends. Additional page numbers are listed at
the end of the image README.

**Still unverified visually:** the exact curvature constants, the `sh` angle, the O/U hook orientation in
every context, the `w` dash length, how the `r` circle merges with a preceding circle vowel, and the
two-curve vowel placement. These are the first things to tune against the scan pages.

---

## 2. Complete inventory

Use these IDs in `units.js`. “Forward” = written left-to-right; “downward” = written down the page.
Short ≈ 1 unit, long ≈ 2 units. The printed page references are in the image README.

### 2.1 Consonants (20)

| ID | Sound | Direction | Length | Shape | Variants / notes |
| --- | --- | --- | --- | --- | --- |
| `k` | /k/ | forward | short | shallow arch bowing up | right-motion |
| `g` | /ɡ/ | forward | long | shallow arch bowing up | right-motion |
| `r` | /r/ | forward | short | shallow cup bowing down | **stroke before a vowel; post-vocalic circle after a vowel** |
| `l` | /l/ | forward | long | shallow cup bowing down | `ld` variant with upward terminal |
| `n` | /n/ | forward | short | horizontal line | |
| `m` | /m/ | forward | long | horizontal line | |
| `t` | /t/ | forward/up | short | straight rising ≈30° | |
| `d` | /d/ | forward/up | long | straight rising ≈30° | |
| `th` | /θ/, /ð/ | forward/up | short | shallow rising curve | **left/right motion**; no length/voicing distinction |
| `p` | /p/ | downward | short | curve bowing left `(` | `pr`/`pl` loop variants |
| `b` | /b/ | downward | long | curve bowing left `(` | `br`/`bl` loop variants |
| `f` | /f/ | downward | short | curve bowing right `)` | `fr`/`fl` loop variants |
| `v` | /v/ | downward | long | curve bowing right `)` | |
| `ch` | /tʃ/ | downward | short | straight down-left ≈45° | |
| `j` | /dʒ/ | downward | long | straight down-left ≈45° | |
| `s` | /s/, /z/ | downward | short | small curve | **left s / right s**; `x` is a modified `s`; loop after `r` circle |
| `sh` | /ʃ/, /ʒ/ | downward | short | straight steep down-left ≈60° | very small; steeper than `ch` |
| `h` | /h/ | — | — | dot | placed at/over the vowel; `a` before `w`/`h` is a dot on the line |
| `ng` | /ŋ/ | downward | short | `n` at a downward slant | never decompose into `n` + `g` |
| `nk` | /ŋk/ | downward | long | `n` at a downward slant | never decompose into `n` + `k` |

### 2.2 Glides (2)

| ID | Form | Rule |
| --- | --- | --- |
| `w` | ōō-hook; medial dash | Hook at the beginning/end of a word. Dash **under the vowel that follows** in the body of a word. After `s` before a circle vowel, use the hook (*swim, sweet, swell*). `qu` = `k` + `w`. In `wh`, the `h` is sounded first: `w` form + `h` dot (*wheat, wheel*). |
| `y` | small circle; loops | Small circle before a hook vowel (*yacht, yellow, youth*). `ye` = small loop (*year, yet*). `ya` = large loop (*yawn, yard*). Final `y` often becomes `ai`/`oi`; `Y UW` may become `yu`. |

### 2.3 Vowels (12) and diphthongs (4)

| Family | Plain | Dot | Tick | Shape |
| --- | --- | --- | --- | --- |
| A | `a1` ǎ /æ/ *at* | `a2` ä /ɑː/ *art* | `a3` ā /eɪ/ *ale* | large ellipse |
| E | `e1` ǐ /ɪ/ *it* | `e2` ě /ɛ/ *bet* | `e3` ē /iː/ *eat* | small ellipse |
| O | `o1` ǒ /ɒ/ *on* | `o2` aw /ɔː/ *all* | `o3` ō /oʊ/ *old* | small hook, O orientation |
| U | `u1` ŭ /ʌ/ *up* | `u2` ŏŏ /ʊ/ *book* | `u3` ōō /uː/ *food* | small hook, U orientation |

| Diphthong | Composition | Form |
| --- | --- | --- |
| `ai` /aɪ/ | `a2` + `e3` | broken circle (large circle with an indentation) |
| `ow` /aʊ/ | `a2` + `u3` | large circle + ōō-hook |
| `oi` /ɔɪ/ | `o2` + `e3` | o-hook + small circle |
| `yu` /juː/ | `e3` + `u3` | small circle + ōō-hook |

The broken circle is treated **as a circle** for all joining rules.

### 2.4 Blends

| Blend | Form | Examples |
| --- | --- | --- |
| `ten`/`den` | short upward curve | *ten, den, written* |
| `ent`/`end` | short upward curve (`-nt`/`-nd`) | *went, end, bond, print* |
| `tem`/`dem` | longer upward curve | *item, victim* |
| `emt`/`emd` | longer upward curve (`-mt`/`-md`) | *seemed, prompt, trimmed* |
| `def`/`-v`, `-tive` | large loop | *defeat, native, motive* |
| `jent`/`-d`, `pent`/`-d` | large loop | *gentle, spend, happened* |
| `ted`/`ded`/`det` | one long stroke | *added, rated, today* |
| `men`/`mem` | one long stroke | *men, many, money* |

The last two are **post-v1** in Dregg but should stay in the data dictionary. Do not blend when a
strongly accented vowel is in the syllable (*dean, team, dome*); prefer the right-motion blend where
`ten`/`den` and `ent`/`end` are both possible; `tain` = `ten`; `moun` = `men`; `tern`/`dern` = `ten`.

---

## 3. Geometry that makes it look correct

These are observations from the scanned pages, not guesses. Use them as starting constants and tune
against the page images.

### 3.1 Proportions

| Quantity | Starting value | Evidence |
| --- | --- | --- |
| Short stroke | 1.0 u | p17, p29 |
| Long stroke | 2.0 u | p17, p29 |
| Large vowel circle | ellipse, ≈0.84 u diameter | p19, p21, p23 |
| Small vowel circle | ≈0.40 u diameter | p19, p21 |
| `pr`/`pl` loop | ≈0.8–1.0 u tall | p35 |
| `br`/`bl` loop | ≈1.0–1.2 u tall | p35 |
| `fr`/`fl` loop | ≈0.9–1.1 u, rounded | p36 |
| `kr`/`gl` wave | ≈2.0 u long, shallow | p24 |
| `gr`/`kl` wave | ≈2.0–2.2 u, distinct hump | p25 |
| `ld` terminal | l + upward turn ≈0.6 u | p90 |
| Stroke weight | 1.6–2.0 px at 1× | p17, p21 |

The scans are small. Do not measure absolute pixels from the JPEG; measure **ratios** within a word.
The long/short ratio is the most important; a short stroke that is only 1.3× shorter than a long one
will not read as Gregg.

### 3.2 Vowel placement — use the manual's rules, not the old heuristic

The previous `STROKE-REFERENCE.md` §7 heuristic (“inside the nearest curve; otherwise outside the
angle; otherwise on top of the straight stroke”) has been replaced. Use the manual's exact rules,
which the scans confirm:

1. **Single curve:** circle **inside** the curve (p21: *ear, ill, air, ray*).
2. **Single straight:** circle written with **right motion** (p21: *aim, tea, ham, heat*).
3. **Angle or point between consonants:** circle **outside** the angle (p23: *kick, make, rain, team*).
4. **Straight + curve without an angle, or two similar-motion curves:** circle **inside** the curve
   (p23: *writ, raid, dig, tag*).
5. **Opposite curves:** turn the circle **back on the first curve** (p24: *wreck, rag, lake, kill*).
6. **Straight strokes in the same direction:** circle with **right motion**, and in the printed examples
   it sits **below** the line (*deed, dad, mean, main*, p24; *man, make, came*, p29).

After placing the circle, place the **dot/tick below the circle**, not “away from the anchor.” The scans
show this consistently (*mat, calm, came, kit, get, need* on p19; *man, make, tin, tan* on p29).

For `r` after a vowel, the `r` circle is a small loop attached at the same joint. Place it **above** the
next stroke after `p`/`b` (*burn, bird*) and **below** otherwise (*charm, farm*); see p55. For `ER`
(the obscure `ur` sound), the standard form is the **`r` circle alone** (*her, church, murmur, urge,
hurt*) — this is a required allograph, not an omission. For other vowel + `r` sequences, write the
vowel plus the `r` circle (*art, care, near, sort*). Omitting an unstressed `r` in *large, serve, warm*
is a running form, not the v1 full form.

### 3.3 What the joins actually look like

| Join | Visual target | Implementation |
| --- | --- | --- |
| `pr`, `pl` | a **loop** starting to the left, then a tail into `r`/`l` | precomputed `p` join variant; loop, not an extended butt-joint (p35) |
| `br`, `bl` | a **larger loop** starting down, then a tail | precomputed `b` variant; larger than `pr`/`pl` (p35) |
| `fr`, `fl` | a **rounded loop** like part of longhand `y` | precomputed `f` variant; rounded, not angular (p36) |
| `kr`, `gl` | a **single shallow wave**; both curves flattened | one continuous composite, not two visible strokes (p24) |
| `gr`, `kl` | a **single wave with a hump**; length contrast preserved | one composite; `gr` like longhand `y`, `kl` like `h` (p25) |
| `rk`, `lk` | a flatter wave | composite; `lk` is rare (p25) |
| `ld` | `l` with a **swinging upward turn** at the finish | `l` variant with an upward terminal (p90) |
| `-nt`/`-nd`, `-mt`/`-md` | an **upward curve** with a hook at the start/end | composite path, not a fillet (p89) |
| `ted`/`ded`/`det` | one long stroke with a small terminal | composite path (p28) |
| `men`/`mem` | one long horizontal with a small terminal hook | composite path (p28) |

**Do not rotate primitives at runtime.** Author each join variant as a second precomputed shape of the
first unit and select it by the following unit. That keeps output deterministic and testable. The old
“absolute orientation” rule still holds; a join variant is not a runtime rotation.

### 3.4 `s`, `th`, and `x`

- **`s`:** left s before/after `p`, `b`, `r`, `l`; left s after `t`, `d`, `n`, `m`, `o`; right s
  otherwise. Do not choose by tangent continuity. `s` after a final left-motion circle on a straight
  stroke becomes a **loop** (*tears, shares, stairs*). `ses` is two `s` signs joined. `x` is `s`
  **modified in slant**, not `k` + `s`.
- **`th`:** one short curved stroke with **left/right motion** variants. Left before/after `o`, `r`,
  `l`; right otherwise; right when `th` is alone or with `s`. The two forms are the same length. There is
  no `/θ/` vs `/ð/` length distinction (p25).
- **`z`:** `s`; a distinguishing dash is optional and not used in v1.

### 3.5 `w`, `y`, `ng`, `nk`

- `w` at the start/end is a **small hook** attached above/at the following stroke; in the body it is a
  **short dash under the following vowel**. `sw` before a circle vowel uses the hook (*sweet, swim,
  swell*). `wh` is the `w` form + `h` dot. See p69.
- `y` before a hook vowel is a **small circle**; `ye` is a small loop; `ya` is a large loop.
- `ng` is a short `n` on a downward slant; `nk` is the longer stroke. They are single units.

### 3.6 Baseline, slant, spacing

- **Baseline:** forward consonants sit on it; downward strokes descend from it. The scans have no
  ruled line, but every word sits on an invisible baseline. Keep the baseline stable across a word.
- **Slant:** the printed chart and drills are nearly upright; real connected writing (p18, p27) is
  slanted. Author primitives upright and, if desired, apply a **global** slant at render time. Do not
  slant or rotate individual strokes at joins; that breaks the precomputed variants.
- **Spacing:** keep vowel circles tangent to the consonant and avoid extra gaps. The scans are compact:
  loops and circles occupy the same vertical band as a short stroke; they are not decorative add-ons.
- **Pen lifts:** the printed forms are continuous; dots and marks are separate. Do not insert a gap
  between consonants just because the glyphs are separate primitives.

---

## 4. Generator pipeline

```
word / phonemes (ARPAbet)
  -> units                     context-free mapping (STROKE-REFERENCE §6)
  -> contractions              longest match; prefix/suffix (COMBINATIONS §9)
  -> allographs                s, th, r, w, y, l, x (COMBINATIONS §4–§7)
  -> layout                    circle placement rules; §3.2 above
  -> joins                     pr/pl, br/bl, fr/fl, kr/gl, gr/kl, rk/lk, ld
  -> blends                    six chart blends + ted/ded, men/mem
  -> marks                     vowel dot/tick, h dot, ing dot
  -> fit viewBox / serialize
```

Order is not optional:

1. **Contractions before allographs.** `-tion` must become `sh` before the `sh` join is chosen.
2. **Longest match wins.** `convention` = `k` + …, not `k` + `o` + `n` + …; `nation` = `n` + `a3` +
   `sh`, not `n` + `a3` + `sh` + `u1` + `n`.
3. **Do not contract across a morpheme boundary you cannot justify.** *complete* keeps its angle to
   distinguish it from *keep*; *baggage* keeps its vowel to distinguish it from *package*.
4. **Never contract into a different word.** If a rule would make *complete* look like *keep*, keep the
   angle or the vowel.
5. **Store the applied rules** in the output (`placements[].rule`, `contractions[]`) so the UI can say
   “`-tion` is written `sh`”.

### 4.1 Data model

```ts
interface GlyphSpec {
  type: "line" | "curve" | "circle" | "hook" | "dot" | "dash";
  length: number;              // in u
  angle: number;               // SVG degrees clockwise from +x
  bulge?: number;              // curve depth in u
  variants?: Record<string, GlyphSpec>;
  mark?: "none" | "dot" | "tick";
  markOffset?: number;
}

interface VariantRule {
  unit: string;                // "s", "th", "r", "w", "y", "l", "x"
  variant: string;             // "left" | "right" | "circle" | "loop" | ...
  when: (ctx: NeighborContext) => boolean;
  stage: "v1" | "v1.5" | "post";
  confidence: "verified" | "approximated" | "open";
  note: string;
}

interface JoinRule {
  from: string;                // "p"
  to: string | string[];       // "r" | ["r", "l"]
  variant: string;             // precomputed shape on `from`
  kind: "loop" | "wave" | "terminal" | "blend" | "disjoin";
  stage: "v1" | "v1.5" | "post";
  confidence: "verified" | "approximated" | "open";
  note: string;
}

interface ContractionRule {
  pattern: string[];           // units or phonemes
  replace: string[];           // shorter sequence / special segment
  scope: "prefix" | "suffix" | "any";
  stage: "v1" | "v1.5" | "post";
  priority: number;            // longest match wins
  note: string;
}
```

### 4.2 What v1 must implement

| Area | v1 | v1.5 | post-v1 |
| --- | --- | --- | --- |
| `s` left/right, `x`, `ses` | ✅ | | |
| `th` left/right | ✅ | | |
| `r` stroke vs circle | ✅ | | |
| `w`/`y` positional | ✅ | | |
| `ng`/`nk`, `qu` | ✅ | | |
| six chart blends | ✅ | | |
| `ld`, `us` | ✅ | | |
| `con`/`com` = `k` | ✅ | | |
| `-tion`/`-sion` = `sh` | ✅ | | |
| `-ing` dot, `-ly` circle/`-ily` loop | ✅ | | |
| `o`/`oo` hook modifications | ✅ | | |
| `per`/`pro`/`pur`, `-ment`, `-ble`, `-ple` | | ✅ | |
| `en`/`in`/`un`/`em`/`im`, `ex` | | ✅ | |
| `be`/`de`/`re`/`dis`/`mis` | | ✅ | |
| `for`/`fore`/`fur`, `-ful`, `-self`, `-age`, `-ture`, `-ther`, `-ings`, `-ingly` | | ✅ | |
| `-ed`, joined `-er`/`-or` | | ✅ | |
| disjoined `-er`/`-or`, `ted`/`ded`, `men`/`mem` | | | ✅ |
| vowel omission, `r` omission | | | ✅ |
| brief forms, phrasing | | | ✅ |

Full details and sources: [`COMBINATIONS.md`](COMBINATIONS.md) §9.

### 4.3 Full vs running outline

This is the single most important product distinction for “looks correct.”

- **Full teaching outline:** every vowel is written, marks are shown in Precision, and only the V1
  contractions are applied. This is what Dregg displays and grades in v1.
- **Running outline:** obscure vowels, short `u`/`ow`, and unstressed `r` are omitted; brief forms and
  phrasing appear. This is what the book’s connected text (p18, p27) shows.

Do not mix them silently. A word record stores `full` units; a later `running` variant is separate. The
scorer accepts both and reports which matched. If the generator applies an omission rule in a v1
session, the learner will see an outline that does not match the lesson.

---

## 5. The mistakes that make Gregg look wrong

| Mistake | Why it looks wrong | Fix |
| --- | --- | --- |
| Concatenating every unit at a shared point | Real `pr`/`br`/`fr` are loops; `kr`/`gl` are waves | Precomputed join variants; p35, p36, p24, p25 |
| Choosing `s`/`th` by tangent continuity | The manual uses an explicit distribution | Use the tables in `COMBINATIONS.md` §4/§6 |
| Using the `r` stroke after a vowel | Real Gregg uses the `r` circle/loop | `r` stroke before a vowel, circle after; p55 |
| Drawing a long `th` for /ð/ | The two forms are motion variants, not lengths | One short `th`; left/right; p17, p25 |
| Writing `x` as `k` + `s` | The printed `x` is a modified `s` | `s` with an `x` slant variant |
| Putting the vowel mark above the circle | Marks sit **below** the circle | `markOffset` below; p19, p29 |
| Placing a medial vowel above a horizontal line | Same-direction straights use right motion and the circle sits below | Follow §3.2 rule 6; p24, p29 |
| Blending every `t`/`d` + `n`/`m` | The blend is skipped with a strong accented vowel | Blend conditions; p89, `COMBINATIONS.md` §8.3 |
| Writing `-tion` as `sh` + `u` + `n` | `-tion` is just `sh` | Contraction pass before layout |
| Writing `-ing` as `e` + `ng` | The dot is the standard | `-ing` dot |
| Writing `con` as `k` + `o` + `n` | `con` + consonant = `k` | `con`/`com` contraction |
| Using `sw` with a dash | `sw` before a circle vowel uses the hook | `w` hook; p69 |
| Leaving `y` as a plain circle before `ye`/`ya` | `ye`/`ya` are loops | `y` variants |
| Mixing full and running forms | The learner sees two different outlines | Explicit `form` flag |

---

## 6. How to refine against the scans

### 6.1 Build a visual comparison sheet

For each rule, render:

1. the Dregg outline at the same nominal size as the scan (short stroke ≈ 24–28 px),
2. the scan page beside it,
3. the word list from the manual (e.g. p29, p35, p36, p55).

Do not compare a 24 px Dregg outline to a 1920 px JPEG at 1:1. Normalize by the short-stroke length.

### 6.2 Measure these ratios, not pixels

- short : long stroke length;
- large-circle diameter : short stroke;
- small-circle diameter : short stroke;
- loop height for `pr`/`br`/`fr`;
- wave length for `kr`/`gr`;
- mark offset below the circle;
- `r` circle diameter and attachment point;
- `w` dash length relative to the following vowel;
- `th` curvature and angle;
- `sh` angle relative to `ch`.

Record the constants in `STROKE-REFERENCE.md` and any intentional deviation in `OUTLINE-NOTES.md`.

### 6.3 Page map for refining

| Need | Scan pages |
| --- | --- |
| Basic consonants, H dot, circles | 17 |
| Connected writing | 18, 27 |
| A/E vowels and marks | 19 |
| Circle at single strokes | 21 |
| Circle between strokes / inside curves | 23 |
| Same-direction circles, opposite curves, `kr`/`gl` | 24 |
| `gr`/`kl`, `rk`/`lk`, `th` | 25 |
| `ted`/`men` blends | 28 |
| Vowel placement and `r` circle word drill | 29 |
| P/B/F/V/CH/J/S/SH; the very small `sh` | 34 |
| `pr`/`pl`, `br`/`bl` | 35 |
| `fr`/`fl`, frequent words | 36 |
| O-hook signs and drill | 50–51 |
| `r` circle and `er`/`or` | 55 |
| `s` after the `r` circle; joined/disjoined `-er` | 56 |
| ōō-hook signs and drill | 64–65 |
| `w`/`wh`, medial `w` | 69 |
| `-nt`/`-nd`, `-mt`/`-md` | 89 |
| `ld` | 90 |

Additional pages: 39–41 (s, `ses`, `x`, `-tion`), 51–52 (o-hook), 56 (`th` joinings), 71 (`y`, `ng`,
`nk`), 100–105 (`ten`/`dem`, `r` details, `-ther`, prefixes/suffixes).

### 6.4 Use `text2Gregg` only as a second opinion

The site is useful for a quick whole-word check, but:

- its samples indicate **Centennial**, while Dregg teaches Anniversary;
- it emits whole-word typeset symbols, not stroke sequences or rules;
- it has no explicit license; do not scrape or ship its output;
- it has an “erroneous stenem” correction form, so it is not an oracle.

Use it to generate a word, look at it, and then go back to the manual/scan to decide.

---

## 7. Implementation checklist

### Generator

- [ ] `units.js` has all 20 consonants, 12 vowels, 4 diphthongs, 2 glides, 6 chart blends.
- [ ] `geometry.js` uses the ratios in §3.1 and the circle rules in §3.2.
- [ ] `s`/`th`/`r`/`w`/`y`/`l`/`x` selectors are explicit, not tangent-based.
- [ ] `pr`/`pl`, `br`/`bl`, `fr`/`fl`, `kr`/`gl`, `gr`/`kl`, `rk`/`lk`, `ld` have precomputed variants.
- [ ] Six chart blends and the `ted`/`men` blends are explicit composite paths.
- [ ] Contractions run before layout; longest match wins.
- [ ] V1 contractions from `COMBINATIONS.md` §9.1 are implemented.
- [ ] `full` vs `running` is an explicit flag; v1 uses `full`.
- [ ] Applied rules are stored with the outline for explanations.

### Golden sheet

- [ ] Render all 20 consonants and the 12-vowel matrix.
- [ ] Render every join and blend next to its scan page.
- [ ] Render 100 audited words, including *man, make, came, her, here, air, church, quick, nation,
      convention, complete, keep, baggage, package, old, child, think, church, mother, father*.
- [ ] Add negative tests: *dean* vs `ten`, *team* vs `tem`, *complete* vs *keep*, *baggage* vs *package*.
- [ ] Check no NaN, no zero-length segments, and a viewBox that contains every point.
- [ ] Review at 375 px phone width and desktop width.

### Sign-off

- [ ] A human compares the golden sheet against the scan pages with the short stroke normalized.
- [ ] Every intentional deviation is in `OUTLINE-NOTES.md`.
- [ ] No rule is applied silently outside its `stage`.

---

## 8. Open questions for the next research pass

1. Exact Bézier constants for each join variant; the scans give targets, not numbers.
2. How the `r` circle merges with a preceding large/small circle (does it become a loop? when?).
3. `w` dash length and vertical offset; `wh` dot placement.
4. `sh` angle vs `ch`/`j`; the scan says “very small” but the exact angle is unverified.
5. O/U hook orientation in every context; this remains the most likely source of mirroring errors.
6. Two-curve vowel placement when both neighbors are curves.
7. How much slant to apply; the chart is upright, the connected text is slanted.
8. Which contractions are acceptable in a “full” teaching outline versus a “running” one.
9. Anniversary vs Simplified/Centennial differences; do not mix forms.
10. How to represent brief forms and phrasing without breaking the generated word model.

---

## 9. Sources and licensing

- *Gregg Shorthand (Anniversary Edition)*, John Robert Gregg, 1929. Scan:
  `https://commons.wikimedia.org/wiki/File:Gregg_Shorthand,_Anniversary_Edition.djvu`.
  Commons marks it **PD-US-expired** / **PD-old-70**.
- Wikisource transcription, Chapters 1–7. Text is CC BY-SA; cite it, do not redistribute scanned
  pages as part of the app.
- *The Alphabet of Gregg Shorthand* (1916), public-domain chart in
  [`reference/gregg-alphabet-1916.png`](reference/gregg-alphabet-1916.png).
- `text2Gregg`, `https://steno.tu-clausthal.de/Gregg.php`. No explicit license; Centennial-oriented;
  reference only.
- Gregg-1916, GreggBF, LION: research material only; see `HANDWRITING.md` §4. Do not ship.

The page images in this repository are reference material for development. They are **not** part of the
offline app bundle.
