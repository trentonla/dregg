# Gregg Stroke Reference

**Purpose:** the implementation data dictionary for the stroke library, phoneme mapping, and
rendering rules. The product rationale is in [`SPEC.md`](SPEC.md); this file is what an engineer or
designer opens while building the outline engine.

**Confidence legend**

- ✅ shape verified against the 1916 chart
- ◐ shape verified; exact angle/length/curvature to be tuned visually
- ○ behavior documented but needs a manual/dictionary check before shipping

All glyph descriptions use SVG coordinates: **x grows right, y grows down.** Angles are measured
clockwise from +x. A “rising” stroke therefore has a negative angle.

---

## 1. Geometry conventions

| Quantity | Value | Notes |
| --- | --- | --- |
| Base unit `u` | 24 px at 1× | Short stroke length |
| Long stroke | 2.0 u | Pairs with a short stroke |
| Large circle | ellipse, r ≈ 0.42 u | Slightly wider than tall |
| Small circle | ellipse, r ≈ 0.20 u | |
| Vowel hook | ≈ 0.45 u across | O and U are two orientations |
| H dot | r ≈ 0.06 u | Filled |
| Vowel dot mark | r ≈ 0.05 u | Offset below the glyph |
| Vowel tick mark | 0.25 u line, ≈45° | Offset below the glyph |
| Stroke weight | 1.6–2.0 px at 1× | Round caps and joins |
| Padding | 0.35 u | Around the fitted viewBox |

Curves are cubic Béziers. Keep control-point handles symmetric for predictable joins. The primitive
is authored **once**, in a local frame with its start at `(0,0)`; placement translates it so the
start touches the pen position. Do not rotate primitives at joins — Gregg strokes keep their
absolute orientation, and the pen changes direction. The one exception is a documented **join
variant** (for example `pr`, `br`, `fr`, `kr`, `gl`, `ld`): author it as a second precomputed shape of
the first unit and select it by the following unit. See [`COMBINATIONS.md`](COMBINATIONS.md) §3.

```ts
interface GlyphSpec {
  type: "line" | "curve" | "circle" | "hook" | "half-ellipse" | "composite" | "dot" | "dash";
  length: number;            // in u
  angle: number;             // degrees, SVG clockwise from +x
  bulge?: number;            // curve depth in u; sign = which side
  variants?: GlyphSpec[];    // mirror/positional allographs
  mark?: "none" | "dot" | "tick";
  markOffset?: number;       // in u, below the glyph
}
```

Suggested starting primitive values (tune against the golden sheet):

| Stroke | Angle | Length | Bulge |
| --- | --- | --- | --- |
| `n` | 0° | 1.0 u | 0 |
| `m` | 0° | 2.0 u | 0 |
| `t` | −30° | 1.0 u | 0 |
| `d` | −30° | 2.0 u | 0 |
| `k` | 0° | 1.0 u | +0.18 u (arch up, peak right of centre) |
| `g` | 0° | 2.0 u | +0.18 u (arch up, peak right of centre) |
| `r` | 0° | 1.0 u | −0.14 u (cup down, low point left of centre) |
| `l` | 0° | 2.0 u | −0.14 u (cup down, low point left of centre) |
| `p` | 90° | 1.0 u | +0.20 u (bulge left) |
| `b` | 90° | 2.0 u | +0.20 u (bulge left) |
| `f` | 90° | 1.0 u | −0.20 u (bulge right) |
| `v` | 90° | 2.0 u | −0.20 u (bulge right) |
| `ch` | 135° | 1.0 u | 0 |
| `j` | 135° | 2.0 u | 0 |
| `sh` | 115° (≈65° from horizontal) | 0.6 u | 0 |
| `th` (short) | −30° | 1.0 u | −0.10 u |
| `th` (long, /ð/) | −30° | 2.0 u | −0.10 u |
| `ng` | 20° | 1.0 u | 0 |
| `nk` | 20° | 2.0 u | 0 |
| `s` | 90° | 0.5 u | two mirror arcs |
| `h` | — | dot | — |

The exact sign convention for bulges depends on how the Bézier is authored; treat the table as a
visual target, not a formula. The golden sheet is the arbiter.

---

## 2. Consonants

### 2.1 Written forward (left to right)

| ID | Phoneme(s) | Length | Description | Examples | Confidence |
| --- | --- | --- | --- | --- | --- |
| `k` | /k/ | short | shallow arch, bowing up, peak right of centre | *can*, *key* | ✅ |
| `g` | /ɡ/ | long | shallow arch, bowing up, peak right of centre | *go*, *good* | ✅ |
| `r` | /r/ | short | shallow cup, bowing down, low point left of centre | *run*, *are* | ✅ |
| `l` | /l/ | long | shallow cup, bowing down, low point left of centre | *look*, *all* | ✅ |
| `n` | /n/ | short | horizontal line | *no*, *in* | ✅ |
| `m` | /m/ | long | horizontal line | *me*, *am* | ✅ |
| `t` | /t/ | short | straight, rising right ≈30° | *it*, *at* | ✅ |
| `d` | /d/ | long | straight, rising right ≈30° | *do*, *day* | ✅ |
| `th` | /θ/, /ð/ | short | shallow rising curve; left/right motion variants | *think*, *the* | ✅ |

### 2.2 Written downward

| ID | Phoneme(s) | Length | Description | Examples | Confidence |
| --- | --- | --- | --- | --- | --- |
| `p` | /p/ | short | curve bowing left `(` | *put*, *up* | ✅ |
| `b` | /b/ | long | curve bowing left `(` | *be*, *by* | ✅ |
| `f` | /f/ | short | curve bowing right `)` | *for*, *if* | ✅ |
| `v` | /v/ | long | curve bowing right `)` | *have*, *very* | ✅ |
| `ch` | /tʃ/ | short | straight, down-left ≈45° | *which*, *each* | ✅ |
| `j` | /dʒ/ | long | straight, down-left ≈45° | *just*, *age* | ✅ |
| `s` | /s/, /z/ | short | small curve; two mirror join variants | *is*, *so* | ✅ |
| `sh` | /ʃ/, /ʒ/ | very short (≈0.6 u) | straight, steep down-left ≈65–70°; very small | *shall*, *she* | ◐ |
| `h` | /h/ | — | dot at the vowel | *he*, *have* | ✅ |
| `ng` | /ŋ/ | short | shallow down-right line | *sing*, *long* | ◐ |
| `nk` | /ŋk/ | long | shallow down-right line | *think*, *bank* | ◐ |

### 2.3 Variants and contextual forms

| Unit | Variants | Rule |
| --- | --- | --- |
| `s` | left s, right s, `x` | **Left s** before or after `p`, `b`, `r`, `l`; **left s** after `t`, `d`, `n`, `m`, and `o`; **right s** in all other positions. At the end of or within a word, `/ks/` is `s` modified in slant (the `x` variant). The names are historical; match the chart. `[Ann §49, §57]` |
| `th` | left-motion, right-motion | **Left-motion** before or after `o`, `r`, `l`; **right-motion** otherwise; **right-motion** when `th` is the only consonant stroke or is combined with `s`. `[Ann §78–79]` |
| `r` | stroke, post-vocalic circle | **Stroke** when `r` precedes a vowel; **circle** (or loop) when `r` follows a vowel, and for the obscure `ur` sound. `[Ann §71–72]` |
| `w` | ōō-hook; medial dash | Initial/final before a vowel; medial as a dash under the following vowel. `qu` = `k` + `w`. After `s` before a circle vowel, the hook is preferred: *swim, sweet, swell*. `[Ann §97–99]` |
| `y` | small circle; small loop; large loop | Small circle before a hook vowel; **`ye`** is a small loop; **`ya`** is a large loop. `[Ann §104]` |
| `l` | normal, `ld` variant | Give `l` a swinging upward turn at the finish before `d`: *old, field, child*. `[Ann §136]` |
| `ng` / `nk` | single strokes | Do not decompose into `n` + `g` / `n` + `k` in the unit sequence. `ng` is `n` at a downward slant; `nk` is the longer stroke. `[Ann §105]` |

`z` is written as `s` in v1. Historical texts may add a short dash at a right angle to distinguish the
voiced sound; do not render it by default. `x` is `s` **modified in slant** at the end of or within a
word, not `k` + `s` `[Ann §57]`. `zh` is `sh`.

---

## 3. Vowels

### 3.1 The 4 × 3 matrix

Each vowel is a shape (family) plus an optional mark. The mark is the only difference between
variants; this is why the matrix is teachable.

| Family | Shape | Plain | Dot | Tick |
| --- | --- | --- | --- | --- |
| A | large ellipse | `a1` ǎ /æ/ *at* | `a2` ä /ɑː/ *art* | `a3` ā /eɪ/ *ale* |
| E | small ellipse | `e1` ǐ /ɪ/ *it* | `e2` ě /ɛ/ *bet* | `e3` ē /iː/ *eat* |
| O | small hook (O orientation) | `o1` ǒ /ɒ/ *on* | `o2` aw /ɔː/ *all* | `o3` ō /oʊ/ *old* |
| U | small hook (U orientation) | `u1` ŭ /ʌ/ *up* | `u2` ŏŏ /ʊ/ *book* | `u3` ōō /uː/ *food* |

Mark rendering:

- **Dot:** small filled dot centered below the glyph, offset outward from the stroke.
- **Tick:** short line at ≈45°, below the glyph, pointing down-left.
- In **Core** mode, omit the mark and use the plain shape. The underlying unit ID still carries the
  precise sound.
- In running Anniversary text the marks are optional when context is clear. The app should show
  them in Precision mode and explain that they are a precision aid.

### 3.2 Hook orientations

The O and U hooks are generating halves of the same small ellipse. The O is always the **lower half**
and opens up (`∪`); the U is always the **upper half** and opens down (`∩`). The anchor side never mirrors
the opening.

- Attached to a forward stroke: place at the stroke's end (opening up for O, down for U).
- Attached to a downward stroke: place on the appropriate side, opening the same way (up for O, down for
  U).
- U at a large circle rim for diphthongs (e.g. `ow`: U hook at the circle's upper right).

The scans (p50, p64, p51, p65) fix the orientation; the renderer exposes it in `Placement` so feedback can
say “the hook opens upward.”

---

## 4. Diphthongs

Diphthongs are composites. Render them as one ligature so the two vowel glyphs touch and are placed
together.

| ID | Sound | Example | Components | Starting geometry |
| --- | --- | --- | --- | --- |
| `ai` | /aɪ/ | *isle*, *my* | `a2` + `e3` | Large circle with a small circle attached at its upper right |
| `ow` | /aʊ/ | *owl*, *how* | `a2` + `u3` | Large circle with the U hook attached at its right |
| `oi` | /ɔɪ/ | *oil*, *boy* | `o2` + `e3` | O hook with a small circle attached at its upper right |
| `yu` | /juː/ | *unit*, *you* | `e3` + `u3` | Small circle with the U hook attached above/right |

The chart shows these as distinct ligatures, not as two separately placed vowels. Match the chart
rather than naively concatenating the two glyphs.

---

## 5. Blends

Blends are not joins: two or more consonants become **one stroke**, and the pen makes one movement.
The six blends on the 1916 chart:

| Blend | Written as | Example | Confidence |
| --- | --- | --- | --- |
| `t` + `n` / `d` + `n` | short upward curve | *ten*, *den* | ◐ |
| `n` + `t` / `n` + `d` | short upward curve (`-nt`/`-nd`) | *ent*, *end* | ◐ |
| `t` + `m` / `d` + `m` | longer upward curve | *tem*, *dem* | ◐ |
| `m` + `t` / `m` + `d` | longer upward curve (`-mt`/`-md`) | *emt*, *emd* | ◐ |
| `d` + `f` + `v` / `t` + `v` | large loop | *def-v*, *tive* | ○ |
| `j` + `nt` + `d` / `p` + `nt` + `d` | large loop | *jent-d*, *pent-d* | ○ |

The manual teaches two more single-stroke blends. They are **post-v1** in Dregg, but they belong in
the data dictionary so the engine does not accidentally generate the long way around:

| Blend | Written as | Example | Stage |
| --- | --- | --- | --- |
| `ted` / `ded` / `det` | one long stroke | *added*, *rated*, *today* | post-v1 |
| `men` / `mem` | one long stroke | *men*, *many*, *money* | post-v1 |

Implementation: prefer an explicit composite path for each blend; a fillet is a fallback, not the
primary model. Do not blend blindly: the `ten`/`dem` blend is not used when a strongly accented vowel
occurs in the syllable (*dean, team, dome*), and the right-motion blend is preferred where either
`ten`/`den` or `ent`/`end` is possible. Mark the placement `blend` so the UI can explain it. See
[`COMBINATIONS.md`](COMBINATIONS.md) §8.

---

## 6. Phoneme → unit mapping

### 6.1 Consonants (ARPAbet)

| ARPAbet | Unit | Notes |
| --- | --- | --- |
| B | `b` | |
| CH | `ch` | |
| D | `d` | |
| DH | `th` | voiced *th*; same left/right motion variants as TH |
| F | `f` | |
| G | `g` | |
| HH | `h` | dot |
| JH | `j` | |
| K | `k` | |
| L | `l` | |
| M | `m` | |
| N | `n` | |
| NG | `ng` | |
| P | `p` | |
| R | `r` | |
| S | `s` | |
| SH | `sh` | |
| T | `t` | |
| TH | `th` | voiceless *th*; left/right motion variants |
| V | `v` | |
| W | `w` | positional variant |
| Y | `y` | positional variant; `Y UW` may become `yu` |
| Z | `s` | voicing not distinguished in v1 |
| ZH | `sh` | |

Special sequences:

- `NG K` → `nk` (e.g., *bank*, *think*).
- `K S` at the end of or within a word → `s` in its `x` variant (*box, tax*); otherwise `k` + `s`.
- `K W` → `k` + `w` (*quick*); the `w` renders as an under-dash.
- A syllabic consonant (`AH0 L`, `AH0 M`, `AH0 N`) drops the schwa: `l`, `m`, `n`.

### 6.2 Vowels (ARPAbet)

| ARPAbet | Full unit | Core unit | Example |
| --- | --- | --- | --- |
| AA | `a2` or `o1` | `a` or `o` | *art* vs *on* (see A/O split) |
| AE | `a1` | `a` | *at* |
| AH | `u1` | `u` | *up* |
| AH0 | `u1` | `u` | schwa; may be omitted in a future “fast writing” option |
| AO | `o2` or `o1` | `o` | *all* vs *dog* (see A/O split) |
| AW | `ow` | `ow` | *how* |
| AY | `ai` | `ai` | *my* |
| EH | `e2` | `e` | *bet* |
| ER | `r` (circle variant) | `r` (circle) | *her, church, murmur*; the circle carries the obscure `ur` vowel |
| EY | `a3` | `a` | *say* |
| IH | `e1` | `e` | *it* |
| IY | `e3` | `e` | *eat* |
| OW | `o3` | `o` | *old* |
| OY | `oi` | `oi` | *boy* |
| UH | `u2` | `u` | *book* |
| UW | `u3` | `u` | *food* |

Schwa (`AH0`) is the biggest source of ambiguity. v1 writes it as `u1` for consistency; a later
“natural writing” mode can omit it in unstressed syllables. Flag schwa-containing words in the
audit so they can be reviewed first.

**A/O split.** General American merges the vowels in *art* and *on*, but Gregg distinguishes `a2`
and `o1`. A pure ARPAbet mapping cannot recover the difference. The build uses a spelling-aware
short-`o` list plus an audited exception table (see the plan), and flags every AA/AO word for
review. Treat the table above as the default before that pass runs.

### 6.3 Word records

```json
{
  "w": "team",
  "ipa": "tiːm",
  "arpabet": ["T", "IY", "M"],
  "core": ["t", "e", "m"],
  "full": ["t", "e3", "m"],
  "tier": 1,
  "tags": ["long-e", "cvvc"]
}
```

```json
{
  "w": "bank",
  "ipa": "bæŋk",
  "arpabet": ["B", "AE", "NG", "K"],
  "core": ["b", "a", "nk"],
  "full": ["b", "a1", "nk"],
  "tier": 1,
  "tags": ["short-a", "nk"]
}
```

```json
{
  "w": "quick",
  "ipa": "kwɪk",
  "arpabet": ["K", "W", "IH", "K"],
  "core": ["k", "w", "e", "k"],
  "full": ["k", "w", "e1", "k"],
  "tier": 2,
  "tags": ["medial-w", "short-i"]
}
```

---

## 7. Vowel placement rules (starting heuristic)

Placement is the hardest part of the renderer. Use this hierarchy, then correct it with the golden
sheet.

1. **Find the anchor.** For a vowel between consonants, anchor to the end of the preceding
   consonant. For an initial vowel, anchor to the start of the following consonant. For a final
   vowel, anchor to the end of the preceding consonant.
2. **Choose the placement from the manual's rules**, in this order:
   - **Single curve:** place the circle **inside** the curve.
   - **Single straight:** write the circle with **right motion**.
   - **Angle or point** between consonants: place the circle **outside** the angle.
   - **Straight + curve without an angle**, or **two similar-motion curves** without an angle: place
     the circle **inside** the curve.
   - **Opposite curves:** turn the circle **back on the first curve**.
   - **Straight strokes in the same direction:** write the circle with **right motion**. In the printed
     examples it sits **below** the line (*deed, dad, mean, main*; *man, make, came*).
3. **Choose the hook orientation.** Use the O/U table in §3.2; mirror if the anchor is on the
   opposite side. Record the choice in `Placement`.
4. **Attach.** For circles, place the ellipse tangent to the anchor point so the pen can loop it
   without a gap. For hooks, start at the anchor and sweep outward.
5. **Add the mark below the circle.** Dot or tick sits below the vowel glyph; do not place it “away
   from the anchor” as a general rule. The scans show it consistently below (*mat, calm, came, kit,
   get, need*; *man, make, tin, tan*).
6. **Diphthongs.** Treat the composite as one glyph; do not run the side rule twice.
7. **`r` after a vowel.** Do not place the `r` stroke after a vowel; use the post-vocalic `r` circle.
   Place it above the next stroke after `p`/`b`, and below the next stroke otherwise. See
   [`COMBINATIONS.md`](COMBINATIONS.md) §5.

**The old “on top of the straight stroke” heuristic was wrong for medial vowels.** It produced
disconnected, floating circles. Use the manual rules above. The scans that verify them are
[`reference/anniversary/p19-vowels-ae.jpg`](reference/anniversary/p19-vowels-ae.jpg),
[`p21-circles-single-strokes.jpg`](reference/anniversary/p21-circles-single-strokes.jpg),
[`p23-circles-between-strokes.jpg`](reference/anniversary/p23-circles-between-strokes.jpg),
[`p24-circles-direction-kr-gl.jpg`](reference/anniversary/p24-circles-direction-kr-gl.jpg), and
[`p29-word-drill-vowels-r.jpg`](reference/anniversary/p29-word-drill-vowels-r.jpg). See also
[`GREGG-GENERATOR-REPORT.md`](GREGG-GENERATOR-REPORT.md) §3.2.

#### Does the direction of travel matter?

Yes, but not because the vowel changes. A large-A or small-E vowel circle is the same ellipse whichever
way the pen goes around it. Direction matters for three things:

1. **Joining.** The circle must enter and leave tangent to the adjacent strokes. Drawing it the wrong
   way creates a cusp, a gap, or places it on the wrong side of the join.
2. **Allographs.** The post-vocalic `r` circle is specifically **left motion**. `s` and `th` have
   left/right **mirror forms**, and `w` uses O/ōō half-ellipse hooks. For those, direction is part of
   the sign, not just a join detail.
3. **Scoring and animation.** Stroke order and direction are visible in the ink. Check them for `s`,
   `th`, and the `r` circle; do not reject a plain vowel circle just because it was drawn clockwise
   instead of counterclockwise when position, size, and attachment are correct.

The manual's “left motion” and “right motion” are names for the two rotations of the generating oval,
**not** directions across the page `[Ann §10]`. Once printed, a closed circle has no visible direction;
the direction is encoded in the entry/exit tangent and, for `s`/`th`/`r`, in which mirror form is used.

**Practical rule for the generator:** represent a circle as a closed path with `motion`,
`startAngle`, `sweep`, and an attachment point. Choose `startAngle`/`sweep` so the incoming and
outgoing tangents match; do not use a plain `<ellipse>`. See p21 (single strokes), p23 (between
strokes), p24 (same-direction and opposite curves), p55 (`r` circle), and p56 (`s` loop).

**Example — *eat*.** *eat* is `e3` + `t`. The small E circle and its tick sit at the **base** of the
rising `t`; the `t` is a single straight stroke, so the manual writes the circle with **right motion**.
*tea* is `t` + `e3`: the same circle and tick sit at the **top** of the `t`. The circle's rotation is
the same; the attachment point and exit tangent differ. If a learner loops the circle the other way
but the size, base/top placement, and tick are correct, do not fail it on direction alone. Check the
tick, the attachment, and the `t` direction; save strict direction checks for `s`, `th`, and the `r`
circle.

When two curves meet, prefer the curve nearest the vowel. When the rule is ambiguous, use the
lexicon override and note it. The explanation text should name the rule that was used
(“outside the angle,” “inside the `r` curve”).

---

## 8. Verification checklist

Before the stroke library is considered done:

- [ ] Render all 20 consonants and compare side-by-side with the 1916 chart.
- [ ] Render the 12-vowel matrix; verify dot/tick position and the O/U hook orientations.
- [ ] Render the four diphthong ligatures; match the chart’s composition.
- [ ] Render the six chart blends; verify the curve/loop shapes.
- [ ] Render `pr`, `pl`, `br`, `bl`, `fr`, `fl`, `kr`, `gl`, `gr`, `kl`, `rk`, `lk`, `ld`.
- [ ] Render the `s` distribution in `COMBINATIONS.md` §4 and the `x` modified slant.
- [ ] Render the post-vocalic `r` circle in *art, heart, learn, car, carry, around*.
- [ ] Render 100 audited words and review at phone and desktop sizes.
- [ ] Check every consonant pair that occurs in the top 500 lexicon words for gaps/overlaps.
- [ ] Verify `w`/`y` positional forms against the 1929 manual.
- [ ] Verify `th` left/right motion and `sh` angle against the 1929 manual.
- [ ] Verify `-tion`, `-ing`, `-ly`, and `con`/`com` in context.
- [ ] Confirm no NaN, no zero-length segments, and a viewBox that contains every point.
- [ ] Record every intentional approximation in `docs/OUTLINE-NOTES.md`.

---

## 9. Sources

- Gregg, John Robert. *The Alphabet of Gregg Shorthand*, in *Gregg Shorthand: New and Revised
  Edition* (1916). Public-domain chart reproduced at
  [`reference/gregg-alphabet-1916.png`](reference/gregg-alphabet-1916.png).
- *Gregg Shorthand (Anniversary Edition)*, Wikisource: *The Alphabet of Gregg Shorthand* and Chapters
  1–7. The source of the contextual rules in [`COMBINATIONS.md`](COMBINATIONS.md). The text is
  CC BY-SA; cite the transcription and do not redistribute scanned manual pages.
- *Gregg shorthand*, Wikipedia (phonemic principle, vowel groupings, diphthong composition, W/Y
  behavior).
- *Gregg Shorthand Manual Simplified* (1955) and the *Anniversary Manual* (1929) for exact
  geometry and contextual variants — required for the ◐/○ items above.
