# Gregg Combinations, Joins, and Real-World Outlines

**Purpose:** the rulebook for everything that happens *between* strokes: how consonants join, which
allograph a unit takes, when a sound is contracted or omitted, and how handwritten Gregg differs from
the printed chart. This is the companion to [`STROKE-REFERENCE.md`](STROKE-REFERENCE.md), which defines
the individual glyphs. [`OUTLINE-NOTES.md`](OUTLINE-NOTES.md) records the cases we still approximate.

**Scope:** Anniversary Edition rules, with the 1916 chart as the visual reference. Dregg teaches a
Simplified-compatible **Core** subset and an Anniversary **Precision** layer, so rules that belong only
to later editions are flagged rather than silently mixed in.

**Confidence legend**

- ✅ rule verified in the manual text and consistent with the chart
- ◐ rule verified in the manual text; exact geometry still has to be tuned against a printed model
- ○ rule documented but edition-dependent, rare, or with unresolved edge cases
- ⚠ a Dregg product decision, not a rule of Gregg

**Source notation**

- `[Ann §n]` — *Gregg Shorthand (Anniversary Edition)*, chapter section number on Wikisource.
- `[1916]` — the public-domain alphabet chart in [`reference/gregg-alphabet-1916.png`](reference/gregg-alphabet-1916.png).
- `[HW §n]` — [`HANDWRITING.md`](HANDWRITING.md), for scoring implications.

The Wikisource transcription preserves the manual's wording but strips its shorthand illustrations.
Rules below are therefore text-verified; the exact curvature of a join is **not** verified unless it
also appears on the 1916 chart. Treat every geometry note as a target for the golden sheet, not a
coordinate.

---

## 1. How to use this document

The outline engine needs five different kinds of rule. Keeping them separate prevents the most common
failure mode: treating a contraction or an omission as if it were a glyph.

| Kind | What it changes | Example | Where |
| --- | --- | --- | --- |
| **Allograph** | Which form of the *same* unit is drawn | left vs right `s`; left vs right `th`; `r` stroke vs `r` circle | §4–§7 |
| **Join** | How two units connect, sometimes deforming the first | `pr`, `br`, `fr`, `kr`, `gl`, `ld` | §3 |
| **Blend** | Two or more consonants become *one* stroke | `ten`, `ent`, `tive` | §8 |
| **Contraction** | A sound or syllable is represented by a shorter sign | `con` → `k`; `-tion` → `sh`; `-ing` → dot | §9 |
| **Omission** | A sound is not written at all | unstressed `r`; short `u` before `n`/`m`; schwa | §5.3, §7.3, §11.3 |

A further kind, **phrasing** (joining whole words), is out of v1 and is mentioned only to keep it out
of the engine.

### 1.1 The two outline forms

Dregg should be explicit about which Gregg it is rendering:

- **Full outline** — every vowel is written, marks are shown in Precision, and contractions are limited
  to the productive ones in §9. This is the teaching form. It is deliberately slower and more explicit
  than a stenographer's notebook.
- **Running outline** — vowels, `r`, and minor sounds are omitted where Gregg allows it, and brief forms
  and phrasing appear. This is what real Gregg looks like at speed. It is a post-v1 reading layer.

The app must never mix the two silently. A word record stores `full` units (already in the lexicon) and,
later, an optional `running` variant. The scorer accepts the taught form and any documented variant, and
reports which one matched `[HW §3.2, §3.8]`.

⚠ **v1 renders the full outline.** Required allographs and the productive contractions in §9.1 are
still applied, because using the wrong allograph is not a stylistic choice; it produces a different
outline child learners would have to unlearn.

**Core and Precision affect vowel marks and the vowel inventory, not the consonant allographs.** A Core
outline still uses left/right `s`, left/right `th`, and the post-vocalic `r` circle. Do not switch the
consonant rules with the track.

---

## 2. Base motion and circle placement

These rules apply to every combination. They are the foundation the rest of the document assumes.

### 2.1 Direction and orientation

- Forward consonants (`k g r l n m t d th`) are written left to right. `th`, `t`, and `d` are struck
  upward from the line `[Ann §3]`.
- Downward consonants (`p b f v ch j s sh`, plus `ng`/`nk`) are written downward `[Ann §35, §105]`.
- Consonant primitives keep their absolute orientation. The pen changes direction at a join; the glyph
  is not rotated to make the join look smooth. The exceptions are the documented **join variants** in
  §3, which are precomputed shapes, not runtime rotations.
- **“Left motion” and “right motion” are historical names for the two curvatures**, not directions of
  travel. The manual defines them by the generating oval `[Ann §9–10]`. Do not infer a direction from
  the name; match the chart and the rule.

### 2.2 Where a circle goes

The manual gives a small, complete set of placement rules `[Ann §11–18]`:

1. At the beginning or end of a **single curve**, place the circle **inside** the curve.
2. At the beginning or end of a **single straight stroke**, write the circle with **right motion**.
3. At an **angle or point** between consonants, place the circle **outside** the angle.
4. Where a straight and a curve join **without an angle**, or two similar-motion curves join without an
   angle, place the circle **inside** the curve.
5. Between **opposite curves**, turn the circle back on the first curve.
6. Between **straight strokes in the same direction**, write the circle with right motion.

The manual adds the rule that matters most for joins: *“A circle placed outside the angle in any of
these joinings does not change the motion.”* `[Ann §49]` The consonants keep their direction; the pen
simply loops outside the corner.

### 2.3 Vowel-adjacent modifications

- The **o-hook** slant is modified slightly before `n`, `m`, `r`, and `l` to avoid an unnecessary angle.
  The rule does **not** apply when a downstroke precedes the hook `[Ann §67]`.
- The **ōō-hook** is turned under after `n` and `m`, and after `k` or `g` when followed by `r` or `l`
  `[Ann §94]`.
- The combination **`us`** is written without an angle at the beginning of a word, or when it follows a
  downstroke or `k`/`g` `[Ann §93]`.
- A **circle vowel before `s` between strokes** belongs with the preceding consonant; if the circle
  follows the `s`, the `s` belongs with the following consonant `[Ann §51]`.

These are layout rules, not optional style. They should be functions of the neighboring units and should
be recorded in `Placement.note` so the UI can explain them.

---

## 3. Consonant-to-consonant joins

The manual teaches a small set of joins as **movement drills** because they are frequent and because a
naive butt-join is slow or ambiguous. Each is a *join variant* of the first stroke: the start point,
start tangent, or curvature changes so the pen can continue into the second stroke without a corner.

| Join | Manual rule | Examples | Implementation | Confidence |
| --- | --- | --- | --- | --- |
| `pr`, `pl` | “start to the left” | *pray, play, prim, plate* | `p` **loop variant** starting to the left; then a tail into `r`/`l` | ◐ |
| `br`, `bl` | “start down” | *brain, blame, brave, bled* | `b` **loop variant** starting down; larger than `pr`/`pl` | ◐ |
| `fr`, `fl` | round the angle; motion like part of longhand **y** | *fray, flame, fresh, flee* | `f` **rounded loop variant** into `r`/`l` | ◐ |
| `kr`, `gl` | equal curves, made a little flatter | *cream, eagle, glen, glee* | one **shallow wave** composite; continuous tangent | ◐ |
| `gr`, `kl` | unequal curves join without an angle; `gr` like longhand **y**, `kl` like **h** | *green, clay, grim, clan* | one **wave with a hump**; preserve the length contrast | ◐ |
| `rk`, `lk` | equal-length curves made flatter; `lk` is rare | *ark, milk* | flatter **wave** | ○ |
| `ld` | give `l` a swinging upward turn at the finish | *old, field, child, gold* | `l` **upward terminal** variant | ◐ |

Source: `[Ann §19–21, §37–39, §136]`. Visual targets: scans p24, p25, p35, p36, p90 in
[`reference/anniversary/`](reference/anniversary/README.md).

**Why these are not “rotation at join.”** A runtime rotation would make the outline depend on the
previous stroke's angle and would break determinism. Instead, author a small set of `joinVariants` on
the first unit and select one when the next unit matches. The primitive is still defined in its own
frame; only its control points differ. Golden tests can then pin each variant.

**What about other pairs?** The manual does not prescribe a special movement for most pairs. They join
at a shared point, with the circle rules in §2.2 and the `s`/`th` allograph rules below. Do not invent
join variants for pairs the manual does not discuss; if a pair looks bad, record it in
`OUTLINE-NOTES.md` and tune the shared tangent.

---

## 4. The `s` family

`s` is the most frequent consonant and the one with the most explicit positional rules. The two signs
are mirror images, called **left s** and **right s**. The names are historical; use the manual's
distribution, not a tangent heuristic.

### 4.1 Which `s`

| Context | Sign | Examples |
| --- | --- | --- |
| Before or after `p`, `b`, `r`, `l` | **left s** | *sips, phrase, sables, slim, press, praise* |
| After `t`, `d`, `n`, `m`, and `o` | **left s** | *tease, daze, knees, mass, series* |
| All other positions | **right s** | *saves, seeds, snap, staff, seeks, sashes* |

Source: `[Ann §49]`. The list is deliberately asymmetric: left s is used *before and after* the first
group, but only *after* the second group.

Two joining details:

- When `s` precedes another consonant, the **base of the following consonant** rests on the line
  `[Ann §48]`. The `s` may sit above it.
- A circle placed outside an angle does not change the motion of the consonants `[Ann §49]`.

### 4.2 `s` between strokes

The manual's rule is about syllable attachment, not geometry:

- If a **circle vowel immediately precedes** `s`, treat the `s` as belonging to the preceding consonant.
- If the **circle follows** the `s`, treat the `s` as belonging to the following consonant.
- Otherwise, write the `s` with the syllable to which it belongs.

Examples: *cast, mask, least, guest, grasp, risk, taste, desk, task, chest, pressed, ransack*
`[Ann §51]`.

For Dregg's full outline this mostly affects where the `s` is anchored and which side the following
circle uses. It matters more in running outlines, where the vowel may be absent.

### 4.3 `s` after the post-vocalic `r` circle

When `s` follows a **final left-motion circle on a straight stroke** (the `r` circle; §5), change the
circle into a **loop**:

- *tears, shares, stairs, dares, nears, manners* `[Ann §74]`.

This is also how some plurals are distinguished. It is not a generic “add s” rule; the loop is a
different terminal form.

### 4.4 `ses`

The `ses` sound, as in *faces*, is written by joining the two `s` signs as a blend: *senses, ceases,
basis, cases, thesis, census, masses, traces, analysis* `[Ann §52]`.

In rapid writing the first `s` may become obscure. The second `s`, written contrary to the rule for a
single `s`, still signals the plural: *face / faces*, *lease / leases* `[Ann §52]`.

### 4.5 `x`, `z`, and plurals

- **`x`** at the end of or within a word is `s` **slightly modified in slant** `[Ann §57]`. It is not
  `k` + `s` in this edition. The plural adds `s` as usual: *mixes, fixes, taxes*.
- **`z`** is written with the sign for `s`; the two sounds are not distinguished in connected writing.
  When a distinction is necessary, a short dash is struck at a right angle to the `s` `[Ann §47]`.
  Dregg v1 writes `s` and omits the dash, as the manual says the distinction is seldom needed.
- **Plurals of brief forms**: if the brief form ends in `s`, add another `s` of the same motion
  (*cause / causes*, *business / businesses*). Other brief forms add `s` normally (*parts, changes,
  ships, forms*) `[Ann §55]`. This is post-v1, because brief forms are post-v1.

### 4.6 `-ings` and `-ingly`

- The suffix **`-ings`** is a **left s** `[Ann §106]`.
- **`-ingly`** is a **small circle substituted for the `ing` dot** `[Ann §106]`.

Both are post-v1, but they explain why a terminal `s` after `-ing` is not simply the `s` allograph.

---

## 5. The `r` family

This is the biggest correction to a naive “`r` is one stroke” model. Gregg uses **two `r` forms**:

- the **`r` stroke** (forward, short cup) when `r` precedes a vowel;
- the **post-vocalic `r` circle** (a circle or loop written with left motion) when `r` follows a vowel.

### 5.1 The post-vocalic circle

> “The circle is written with left motion to express `r` following the vowel.” `[Ann §71]`

Examples: *art, mar, arch, share*; between straight strokes in the same direction: *tart, dared,
church, murmur* `[Ann §71]`.

The circle is also the natural way to write the obscure vowel in *ur*: *church, murmur, urge, hurt*
`[Ann §72]`. In other words, **schwa + `r` is the `r` circle alone**, not a vowel sign plus a stroke.

Placement details `[Ann §161–163]`:

- Between a downward character and a forward straight stroke, the circle is placed **above** the next
  stroke after `p` and `b` (*burn, bird*), and **below** the next stroke in all other cases (*charm,
  farm*).
- Between a horizontal and an upward stroke, the circle is turned with left motion on the upward stroke
  (*cart, card, curt, guard, mart, smart*).
- Before straight lines, `s` in **ser/cer/sar** and `th` in **ther/thir** may be written contrary to the
  usual joining to express `r` (*desert, concert, insert, search, sermon, third, thirty*)
  `[Ann §164]`.

### 5.2 When `r` is the stroke

Use the `r` stroke when `r` is followed by a vowel, including across a syllable boundary:

- *run, red, carry, around, very, hero*.

The distinction is contextual: `r` before a vowel is a consonant onset; `r` after a vowel is a coda.
Dregg's phoneme mapper must inspect the neighboring phonemes, not just map `R` to one glyph.

### 5.3 `r` omitted

In many words containing `ar`, `er`, `or`, `ir`, the `r` is omitted when it is not stressed: *large,
serve, warm, sort, firm, circle, corner, learn, turn, north, board* `[Ann §165–166]`.

This is a **running-outline** rule. v1 writes the `r` circle; a later reading layer may omit it. Do not
omit it in the teaching form without telling the learner.

### 5.4 `-er` / `-or`

After abbreviated words, and after words ending in a left-motion circle on straight strokes, a
**disjoined `r`** expresses `er`/`or`: *keeper, dearer, worker* `[Ann §76]`.

When the form is distinctive, the `r` is joined: *greater, bigger, smaller* `[Ann §76]`. When a brief
form ends with the last consonant of a word, the left-motion circle expresses `or`/`er` after straight
strokes: *sooner, former*.

The **disjoined** form is post-v1 (it depends on brief forms); the joined form is V1.5. The
**joined vs disjoined** distinction belongs in the scorer's variant set `[HW §3.8]`.

### 5.5 Impact on the current reference

`STROKE-REFERENCE.md` previously mapped `ER` to `e3` + `r` and left the circle as an open question.
The correct default is:

- `ER` (the obscure `ur` sound) → the **`r` circle alone**: *her, church, murmur, urge, hurt*.
- Any other vowel followed by `r` → the vowel sign plus the **`r` circle**: *art, care, near, sort*.
- `R` before a vowel → the **`r` stroke**: *run, red, carry, around*.

The exact geometry of the circle (size, attachment point, how it merges with a preceding circle vowel)
is still ◐ and belongs in `OUTLINE-NOTES.md`.

---

## 6. The `th` family

The manual is unambiguous:

> “The sign for `t` is curved to express `th`.” `[Ann §22]`

There are **two motions**, not two lengths:

- **Left-motion `th`** before and after `o`, `r`, `l`: *though, author, bath, earth, thought, health,
  throw, throat, birth, path* `[Ann §78]`.
- **Right-motion `th`** in all other cases: *although, teeth, thief, both, theater, thin, cloth*
  `[Ann §78]`.
- **Right-motion `th`** when `th` is the only consonant stroke (the brief forms for *that*, *they*) or
  when it is combined with `s` (*these, seethe*) `[Ann §79]`.

This corrects the earlier assumption that the two chart forms were short `/θ/` and long `/ð/`. The 1916
chart shows two **same-length mirror forms**, and the Anniversary manual assigns them by neighboring
stroke, not by voicing. Dregg should render one short `th` primitive with `left`/`right` variants.

Related contractions (post-v1 or v1.5):

- **`ther`** as in *mother, father, brother, weather, gather, leather* is expressed by the `th` sign
  `[Ann §168]`. In *father* the left-motion `th` is used to distinguish it from *faith* `[Ann §168]`.
- **`-worthy`** is `thĭ`; **`worth`** is `ŭth` `[Ann §167]`.

`th` is not a blend and not a vowel carrier. Do not add a “voiced length” variant unless a future
edition is explicitly supported.

---

## 7. Vowels and glides in combination

### 7.1 Diphthongs

Diphthongs are **composed of the vowel signs**, written in sounded order `[Ann §112]`:

| Diphthong | Composition | Chart form |
| --- | --- | --- |
| `yu` / long `u` | `ē` + `ōō` | small circle + ōō-hook |
| `ow` | `ä` + `ōō` | large circle + ōō-hook |
| `oi` | `aw` + `ē` | o-hook + small circle |
| `ai` / long `i` | `ä` + `ē`, written as the **broken circle** | large circle with an indentation |

The broken circle is treated **as a circle** for joining purposes, so all the placement rules in §2.2
apply to it `[Ann §112]`.

### 7.2 Vowel sequences

- Vowels that do not form a diphthong are written in sounded order: *poet, poem, snowy, radio, showy,
  folio* `[Ann §118]`.
- A vowel following the diphthong `i` is a **small circle within the large circle**: *via, science,
  riot, fiat, diet, prior* `[Ann §119]`.
- Short `i` followed by `a` is a large circle with a **dot** inside; `e` followed by the large-circle
  vowel is a large circle with a **dash** inside `[Ann §120]`. These distinctions are rare.

### 7.3 Omission rules that affect layout

The manual allows several omissions. They are listed here because they change the *unit sequence*, not
just the glyph, and the engine must decide whether it is rendering a full or running outline.

| Rule | Examples | Stage |
| --- | --- | --- |
| A minor vowel in a vowel sequence may be omitted | *theory, genius, arduous, tedious* `[Ann §121]` | POST |
| The circle may be omitted in the diphthong `u` | *new, due, music, reduce, renew* `[Ann §121]` | POST |
| Long `i` may be a large circle | *life, line, quite, might, idea, ideal* `[Ann §114, §121]` | POST |
| Short `u` and `ow` are omitted before `n` and `m` | *sun, sunk, fun, town, down, brown, ton, done* `[Ann §124]` | POST |
| Short `u` is omitted before straight downstrokes | *crush, clutch, touch, trunk, judge, brush* `[Ann §124]` | POST |
| `ow` between `n`–`n` is a jog; short `u` is inserted between `n`–`n` and `n`–`m` | *announce, nun, numb* `[Ann §125]` | POST |
| `u` is omitted in the termination `-sume` | *assume, resume, consume, presume* `[Ann §126]` | POST |
| Obscure/neutral vowels may be omitted when legibility is unaffected | *taken, maker* `[Ann §16]` | POST |
| Vowel marks are optional when context is clear | the dot/dash are “seldom used” `[Ann §8]` | V1.5 reading |

⚠ The **full outline** writes the vowel. The **running outline** omits it. Do not let a lexicon word
silently switch forms between screens; the mode must be explicit.

### 7.4 `-ly`, `-ily`, `-ally`

- The suffix **`-ly`** is a **small circle** `[Ann §80]`.
- **`-ily`** and **`-ally`** are a **loop** `[Ann §80]`.
- After a circle vowel, `-ly` is written on the **opposite side** from the vowel: *dearly, daily,
  nearly* `[Ann §82]`.
- When a word form ends with the diphthong `i`, the **double circle** expresses `i` + `ly`: *lightly,
  kindly, rightly, nightly* `[Ann §116]`.

The circle/loop distinction is easy to miss and is a good Precision reading drill.

### 7.5 `a` before `w` or `h`

In words beginning with `a-b` or `a-w`, a **dot on the line close to the next character** expresses the
`a`: *ahead, awake, await, away, awoke, awaken* `[Ann §100]`.

This is a contraction, not a vowel glyph. It appears in common words, so it is worth implementing early
if the lexicon includes them.

### 7.6 The glides `w` and `y`

`w` and `y` are consonant glides, but they are written with vowel-shaped signs and they change the
placement of the following vowel. Treat them as positional allographs of one unit, not as new vowels.

**`w` (`[Ann §97–100]`).**

- At the beginning or end of a word, `w` is the **ōō-hook**: *we, way, win, wave, wall*.
- In the body of a word, `w` is a **short dash beneath the vowel that follows**: *quick, queen, quit,
  quote, twin, dwell*.
- After `s` before a circle vowel, the **hook is preferred** to the dash: *swim, sweet, swell, swift*.
  `qu` is `k` + `w`.
- In `wh`, the `h` is sounded first; write the `w` form and place the `h` dot for the following vowel:
  *wheat, wheel, whip, whale*.

**`y` (`[Ann §104]`).**

- Before a hook vowel, `y` is the **small circle**: *yacht, yellow, youth, yoke, yarn*.
- **`ye`** is a **small loop**: *year, yet*.
- **`ya`** is a **large loop**: *yawn, yard*.
- Final `y` often becomes `ai` or `oi`; `Y UW` may become the `yu` diphthong.

Both are ◐: the rules are text-verified, but the hook/loop geometry needs the golden sheet. The `h`
dot in `wh` is ○ because the exact dot placement is not illustrated in the transcription.

---

## 8. Blends: two consonants in one stroke

A blend is not a join; the pen makes **one movement**, and the resulting stroke represents a syllable.

### 8.1 The six chart blends

These are the six shown on the 1916 chart and in `STROKE-REFERENCE.md` §5:

| Blend | Written as | Examples | Confidence |
| --- | --- | --- | --- |
| `ten`, `den` | short upward curve | *ten, den, written, sudden* | ◐ |
| `ent`, `end` | short upward curve (the `-nt`/`-nd` blend) | *went, end, bond, print* | ◐ |
| `tem`, `dem` | longer upward curve | *tem, dem, item, victim* | ◐ |
| `emt`, `emd` | longer upward curve (the `-mt`/`-md` blend) | *empt, seemed, prompt, trimmed* | ◐ |
| `def`/`-v`, `-tive` | large loop | *defeat, native, motive, captive* | ○ |
| `jent`/`-d`, `pent`/`-d` | large loop | *gentle, spend, happened, opened* | ○ |

The manual describes the `-nt`/`-nd` blend as an upward curve “corresponding in length to the sign for
`f`”, and the `-mt`/`-md` blend as a longer curve “corresponding to `v`” `[Ann §133–134]`. The `n` or
`m` governs the length. At the beginning of a word, short `e` and short `i` are omitted before these
blends: *entry, empty, induce* `[Ann §134]`.

### 8.2 Two more blended consonants

The early chapters teach two additional single-stroke blends that are **not** on the six-blend chart:

| Blend | Written as | Examples | Stage |
| --- | --- | --- | --- |
| `ted`, `ded`, `det` | one long stroke | *added, rated, today, needed, treated* `[Ann §26]` | POST |
| `men`, `mem` | one long stroke | *men, many, month, money, mental, minute* `[Ann §27]` | POST |

The manual notes that `det` usually begins a word, while `ted`/`ded` usually end one `[Ann §26]`. The
`men` blend also covers `min` in *minute* and `mun` in *money* `[Ann §27]`.

**Decision:** keep v1 to the six chart blends. The two extra blends are frequent but they add
curriculum surface and interact with the `ten`/`dem` family. Add them in a later fluency pass, with the
same golden-sheet treatment.

### 8.3 Blend conditions

- Do **not** use the `ten`/`dem` blend when a strongly accented vowel or diphthong occurs in the
  syllable. One-syllable words such as *dean, dine, team, tame, dome, dime* are written in full
  `[Ann §155]`.
- Where either `ten`/`den` or `ent`/`end` is possible, the **right-motion blend** is preferred, as in
  *intention* `[Ann §156]`.
- `tain` in *maintain, attain* is expressed by `ten` `[Ann §155]`.
- `moun` is expressed by the `men` blend, as in *mountain* `[Ann §125]`.
- `tern` and `dern` are expressed by `ten`, as in *eastern* `[Ann §166 note]`.

These conditions are the beginning of a **blend selector**; a naive “if the units are adjacent, blend”
rule will produce wrong outlines.

---

## 9. Productive prefixes and suffixes

These are contractions: a unit or sequence stands for a syllable. They are not new learned units and do
not change the 38-unit count. Apply them **after** phoneme-to-unit mapping and **before** layout.

### 9.1 Stage V1 — required for a correct teaching outline

| Pattern | Written as | Examples | Notes |
| --- | --- | --- | --- |
| `con`, `com`, `coun`, `cog` + consonant | `k` | *confess, council, conform, compel, county, convention* | `[Ann §80]` |
| `comm`, `conn` | write the second `m`/`n` | *common, connote, commence* | `[Ann §81]` |
| `con`/`com` + vowel, `r`, or `l` | `k` + `n` / `k` + `m` | *comedy, comrade, comic* | `[Ann §81]` |
| `-tion`, `-sion` (`shun`) | `sh` | *mention, nation, action, vision, session* | `[Ann §58]` |
| `-ing` at the end of a word | dot | *making, going, writing* | `[Ann §3]` |
| `-ly` | small circle | *lonely, lately, safely, only* | `[Ann §80]` |
| `-ily`, `-ally` | loop | *easily, heartily, family, totally* | `[Ann §80]` |

**Notes.**

- `-tion`/`-sion` is the most important contraction in the list. Without it, *nation* would be written
  with an extra `u` + `n` after the `sh`, which is not the taught outline.
- `-ment`, `-ble`, `-ple`, and `per`/`pro`/`pur` are authentic but can be written in full in v1; they
  are staged as V1.5 in §9.2 to keep the first release small.

### 9.2 Stage V1.5 — authentic, but a full outline is still readable

| Pattern | Written as | Examples | Notes |
| --- | --- | --- | --- |
| `per`, `pro`, `pur` | `pr` | *proper, process, perhaps, permit, pursue, prove* | `[Ann §127]`; when `pro` precedes an upward character or `k`, insert the vowel: *protection, produce* `[Ann §128]` |
| `-ment` | `m` | *apartment, moment, payment, treatment* | `[Ann §127]` |
| `-ble` | `b` | *trouble, sensible, suitable, reliable* | `[Ann §127]` |
| `-ple` | `p` | *sample, example, simple, ample* | `[Ann §127]`; only the listed class |
| `en`, `in`, `un`, `em`, `im` + consonant | drop the vowel | *infer, unseen, impel, embrace, indeed* | `[Ann §106]`; retain the vowel before a written vowel |
| `ex` | `es` | *expense, examine, excess, expect* | `[Ann §106]` |
| `be`, `de`, `re`, `dis`, `mis` | drop the vowel | *below, delay, review, discover, mistake* | `[Ann §145–147]`; `de` keeps the vowel before `k`/`g`; `re` drops only before a downstroke |
| `for`, `fore`, `fur` | `f` | *forget, forgive, foresee, furnish* | `[Ann §170]`; disjoin `f` before a vowel; form an angle before `r`/`l` |
| `-ful`, `-ify` | `f` | *useful, wonderful, notify, simplify* | `[Ann §170]` |
| `-self` | `s` | *myself, yourself, himself, herself, itself* | `[Ann §170]` |
| `-selves` | `ses` | *themselves, ourselves, yourselves* | `[Ann §170]` |
| `-age` | `j` | *courage, storage, baggage, package* | `[Ann §170]`; the vowel in *baggage* is kept to distinguish it from *package* |
| `-ture` | `tr` | *nature, future, picture* | `[Ann §170]` |
| `-ther` | `th` | *mother, father, brother, weather* | `[Ann §168]`; *father* uses left `th` |
| `-ings` | left `s` | *meetings, savings, evenings* | `[Ann §106]` |
| `-ingly` | small circle for the `ing` dot | *lovingly, seemingly, exceedingly* | `[Ann §106]` |
| `-ed` | joined `t`/`d`, or disjoined `t` | *passed, raced, shaped, mentioned, visited* | `[Ann §59]`; after abbreviated words, disjoined `t`; join only if distinctive and facile |
| `-er`/`-or` | joined `r`, or disjoined `r` | *keeper, worker, greater, bigger* | `[Ann §76]`; the joined form is V1.5; the disjoined form is post-v1 because it depends on brief forms |

**Notes.**

- `per`/`pro`/`pur` is a prefix contraction, not the `pr` join. It is written as the `p` + `r` movement,
  but the vowel is omitted.
- `-ment` and `-ble`/`-ple` are productive but can create ambiguity with a full outline. The manual
  itself preserves the angle between `k` and `p` in *complete* to distinguish it from *keep*
  `[Ann §88 note]`. The lexicon audit must check these.

### 9.3 Stage POST — deferred combinations, brief forms, and phrasing

These are documented and useful, but they either depend on brief forms or change the outline so much
that they belong in a separate reading layer.

| Pattern | Written as | Examples | Notes |
| --- | --- | --- | --- |
| `ted`/`ded`/`det` | long stroke | *added, rated, today* | `[Ann §26]` |
| `men`/`mem` | long stroke | *men, many, money* | `[Ann §27]` |
| `-worthy` | `thĭ` | *noteworthy, trustworthy* | `[Ann §167]` |
| `worth` | `ŭth` | *worth, worthy* | `[Ann §167]` |
| vowel omission (short `u`/`ow`, schwa, minor vowels) | omit | *sun, town, taken, theory* | `[Ann §16, §121, §124–125]`; see §7.3 |
| `r` omission in unstressed `ar`/`er`/`or`/`ir` | omit | *large, serve, warm, sort, firm* | `[Ann §165]`; see §5.3 |

Brief forms are memorized whole-word abbreviations, not productive rules. They are excluded from v1 by
design. A representative table is in §10 so the builder can see the shape of the future module and so
the lexicon can reserve a `briefForm` flag.

Phrasing (joining whole words) is also post-v1. The manual devotes several sections to it; none of it is
needed for a word-level trainer.

---

## 10. Brief forms (post-v1)

The manual introduces brief forms from the first lesson. They are the main reason real Gregg looks
shorter than a full phonetic outline. **Do not generate these from strokes.** Store them as separate
records with a form diagram, a `briefForm: true` flag, and a list of the words they cover.

### 10.1 The highest-frequency set

| Word(s) | Manual hint / form | Source |
| --- | --- | --- |
| *of* | `o` | `[Ann §23]` |
| *and, end* | `nd` | `[Ann §23]` |
| *them* | `thm` | `[Ann §23]` |
| *that* | `tha` | `[Ann §23]` |
| *to, too, two* | `too` | `[Ann §23]` |
| *is, his* | `s` | `[Ann §23]` |
| *was* | `os` | `[Ann §23]` |
| *be, by, but* | `b` | `[Ann §23]` |
| *great* | `gr` | `[Ann §23]` |
| *they* | `the` | `[Ann §23]` |
| *you, your* | `oo` | `[Ann §23]` |
| *with* | `ith` | `[Ann §23]` |
| *this* | `ths` | `[Ann §23]` |
| *than, then* | `thn` | `[Ann §23]` |
| *without* | `itht` | `[Ann §23]` |
| *one, won* | brief form | `[Ann §41]` |
| *from, form* | brief form | `[Ann §41]` |
| *never* | brief form | `[Ann §41]` |
| *after* | `af` as a prefix | `[Ann §41–42]` |
| *been, bound* | brief form | `[Ann §41]` |
| *should* | brief form | `[Ann §41]` |
| *people* | brief form | `[Ann §41]` |
| *very* | brief form | `[Ann §41]` |
| *over* | prefix sign written above the following character | `[Ann §41 note]` |
| *about* | brief form | `[Ann §41]` |
| *before* | brief form | `[Ann §41]` |
| *ever* | brief form | `[Ann §41]` |
| *most* | brief form | `[Ann §41]` |
| *much* | brief form | `[Ann §41]` |
| *every* | `ev` in compounds | `[Ann §41–42]` |
| *under* | prefix sign written above the following character | `[Ann §53 note]` |
| *cause, because* | brief form | `[Ann §53]` |
| *work* | brief form | `[Ann §53]` |
| *must* | brief form | `[Ann §53]` |
| *thoroughly, three* | brief form | `[Ann §53]` |
| *part* | brief form | `[Ann §53]` |
| *some* | brief form | `[Ann §53]` |
| *think, thing* | brief form | `[Ann §53]` |
| *matter* | brief form | `[Ann §53]` |
| *such* | brief form | `[Ann §53]` |
| *system, says* | brief form | `[Ann §53]` |
| *again* | brief form | `[Ann §53]` |
| *first* | brief form | `[Ann §53]` |
| *public, publish* | brief form | `[Ann §53]` |
| *against* | brief form | `[Ann §53]` |
| *business* | brief form | `[Ann §53]` |
| *far, always* | brief form | `[Ann §53]` |
| *favor* | brief form | `[Ann §53]` |
| *also* | brief form | `[Ann §60]` |
| *letter, let* | brief form | `[Ann §60]` |
| *until* | brief form | `[Ann §60]` |
| *nothing* | brief form | `[Ann §60]` |
| *present, presence* | brief form | `[Ann §60]` |
| *got* | brief form | `[Ann §60]` |
| *between* | brief form | `[Ann §60]` |
| *big, beg* | brief form | `[Ann §60]` |
| *gave* | brief form | `[Ann §60]` |
| *another* | brief form | `[Ann §60]` |
| *give, given* | brief form | `[Ann §60]` |
| *next* | brief form | `[Ann §60]` |
| *woman* | brief form | `[Ann §60]` |
| *tell, till* | brief form | `[Ann §60]` |
| *soon* | brief form | `[Ann §60]` |
| *morning* | brief form | `[Ann §60]` |
| *still* | brief form | `[Ann §60]` |
| *name* | brief form | `[Ann §60]` |

### 10.2 Later, equally common forms

The same pattern continues: *want, went, told, order, upon, small, glad, during, believe, possible,
purpose, receive, either, above, rather, love, collect, capital, send, agree, ask, office, official,
future, special, speak, speech, week, weak, floor, flour, complete, complaint, immediate, express,
committee, knowledge, care, carry, force, charge, look, clear, skill, school, usual, wish, govern,
expect, full, sure, number, enough, position, question, purchase, remember* `[Ann §69, §75, §88, §95]`.

The point of the table is not to memorize forms from text; it is to show the **size and shape** of the
post-v1 module. Each brief form needs a diagram from a public-domain manual or a newly drawn
reconstruction, plus a note when the form is ambiguous.

### 10.3 Design rules for the future module

- A brief form is a **whole-word** item, not a unit sequence.
- It must not be mixed into a generated write item until the learner has explicitly opted into brief
  forms.
- Reading items may show brief forms earlier, with a tap-to-reveal gloss.
- The scorer treats a brief form as a **variant**, not as the canonical outline `[HW §3.8]`.

---

## 11. What real Gregg looks like

The chart is an idealization. Real Gregg is written continuously, at speed, by a person with a pen.
Several differences matter for Dregg.

### 11.1 Proportions drift; length is relative

The long/short pairs (`k`/`g`, `t`/`d`, `p`/`b`, `f`/`v`, `n`/`m`, `ch`/`j`, `ng`/`nk`) are defined
relatively, not in millimetres. A writer's `m` may be only slightly longer than their `n`, and a
different writer may use different proportions. The manual's own standard is “the size of the
characters given in this manual will be a safe standard” `[Ann §3]`, which is a teaching target, not a
measurement.

**Implication:** the scorer must compare ratios within the learner's own writing, not absolute lengths
`[HW §3.5, §3.7]`. The renderer should keep a consistent 1:2 ratio, but feedback should say “your `m`
is about the same length as `n`”, not “your `m` is 19 pixels”.

### 11.2 Vowel marks are often omitted

The dot and dash are “occasionally needed … but otherwise they are seldom used” `[Ann §8]`. Real
Precision text often has no marks at all; the reader uses context and consonant skeleton.

**Implication:** Precision mode should teach the marks, then offer **unmarked reading** items. The
scorer must accept a mark omitted where context is clear, and must not treat a missing dot as a wrong
vowel family `[HW §3.8]`.

### 11.3 Vowels, `r`, and minor sounds are omitted

The manual explicitly permits omitting obscure vowels `[Ann §16]`, short `u`/`ow` before `n`/`m`
`[Ann §124–125]`, and unstressed `r` `[Ann §165]`. A real outline can be much shorter than the full
phonetic sequence.

**Implication:** the app needs a **running outline** as a separate rendering, not as a random
per-word abbreviation. Reading exercises can introduce it gradually; write exercises should keep the
full form until the learner is ready. This is the difference between “can read Gregg” and “can write
Gregg at speed”, and Dregg should teach both without conflating them.

### 11.4 Strokes merge and angles round

> “When two straight lines form an obtuse or blunt angle, the natural tendency of the hand is to ‘slur’
> the angle and allow the lines to form a curve.” `[Ann §133]`

That tendency is the reason blends exist. In real writing it also means a non-blend join can look
rounded, a circle can shrink, and a pen lift can disappear. The manual even notes that rapid writing
tends to curve a straight line followed by a circle `[Ann §161]`.

**Implication:** the scorer's shape tolerance must be larger at high speed, and a rounded angle must
not be scored as “wrong blend”. The golden sheet should include a **speed-consistent** variant of
common joins, not only the ideal chart form.

### 11.5 Edition differences

Anniversary, Simplified, and Centennial Gregg differ in vowel signs, brief forms, and some joins. The
1916 chart is an earlier edition; the rules above are Anniversary. Do not mix them silently.

**Implication:** every rule and every brief form carries an `edition` field. Dregg v1 teaches
Anniversary-compatible Core/Precision. If a Simplified-only form is added later, it is a named variant,
not a replacement.

### 11.6 What the corpora can and cannot tell us

- **Gregg-1916** (`anonimously/Gregg1916-Recognition`): ~15,711 printed word images from a 1916 Gregg
  dictionary. Best public word-level reference; printed, not handwritten; repository has **no declared
  license**. Use for visual comparison only; do not ship the images.
- **GreggBF** (`lyshasilva/GreggBF`): 3,753 handwritten brief-form samples, 139 classes, 27
  participants, Centennial Edition; not formally validated for symbol accuracy. Useful for
  understanding writer variability; do not assume a permissive license.
- **LION** (Heil & Nauwerck): 2,900 handwritten Melin shorthand lines, Swedish, not Gregg. Useful for
  difficulty calibration and HTR baselines (best reported 44.8–48.2% WER), not for Gregg geometry.
- **text2Gregg** (`steno.tu-clausthal.de/Gregg.php`): a server-side text→Gregg generator with SVG and
  GIF export. Useful as a **second opinion** on whole-word outlines and running forms. Its samples
  indicate **Centennial**, not Anniversary; its output is a typeset whole-word symbol from a
  font/dictionary, not a stroke sequence. No explicit license, so do not scrape or ship its output.
  It also has an “erroneous stenem” correction form, which is a reminder that it is curated, not
  infallible.

The honest conclusion is that **there is no large, validated, openly licensed corpus of handwritten
Gregg words**. Prompted conformity scoring against our own rendered outline is the tractable path;
open-vocabulary recognition is not `[HW §2–§4]`.

---

## 12. Implementation plan for the rulebook

### 12.1 Data structures

Keep the rules declarative and data-driven. A suggested shape:

```ts
type Stage = "v1" | "v1.5" | "post";
type Confidence = "verified" | "approximated" | "open";

interface VariantRule {
  unit: string;                       // "s", "th", "r", "w", "y", "l", "x"
  variant: string;                    // "left" | "right" | "circle" | ...
  when: (ctx: NeighborContext) => boolean;
  stage: Stage;
  confidence: Confidence;
  note: string;
}

interface JoinRule {
  from: string;                       // "p"
  to: string | string[];              // "r" | "l"
  variant: string;                    // join variant on `from`
  kind: "deform" | "fillet" | "blend" | "disjoin";
  stage: Stage;
  confidence: Confidence;
  note: string;
}

interface ContractionRule {
  pattern: string[];                  // unit or phoneme pattern
  replace: string[];                  // shorter sequence / special segment
  scope: "prefix" | "suffix" | "any";
  stage: Stage;
  priority: number;                   // longest match wins
  note: string;
}
```

### 12.2 Pipeline

```
phonemes
  -> units (context-free mapping; STROKE-REFERENCE §6)
  -> contractions (longest match; prefix/suffix; §9)
  -> allograph selection (s, th, r, w, y, l, x; §4–§7)
  -> layout (absolute orientation; join variants; §3)
  -> blends/fillets (§8)
  -> marks (vowel dots/ticks, h dot, ing dot; Precision)
  -> fit viewBox / serialize
```

Order matters:

1. **Contractions before allographs.** `-tion` must become `sh` before the `sh` join is chosen.
2. **Longest match wins.** `convention` is `k` + …, not `k` + `o` + `n` + …; `nation` is `n` + `a3` +
   `sh`, not `n` + `a3` + `sh` + `u1` + `n`.
3. **Do not contract across a morpheme boundary you cannot justify.** *complete* keeps its angle
   `[Ann §88 note]`; *baggage* keeps its vowel `[Ann §170 note]`.
4. **Never contract a word into an existing different word.** If the rule would make *complete* look
   like *keep*, keep the angle or the vowel.
5. **Store the applied rules** in the outline result (`placements[].rule`, `contractions[]`) so the UI
   can explain “`-tion` is written `sh`” rather than showing an opaque path.

### 12.3 What v1 should and should not do

| Area | v1 | v1.5 | post-v1 |
| --- | --- | --- | --- |
| `s` left/right | ✅ | | |
| `th` left/right | ✅ | | |
| `r` stroke vs circle | ✅ | | |
| `w`/`y` positional | ✅ | | |
| `ng`/`nk`, `x`, `qu` | ✅ | | |
| six chart blends | ✅ | | |
| `ld`, `us` | ✅ | | |
| `con`/`com` = `k` | ✅ | | |
| `-tion`/`-sion` = `sh` | ✅ | | |
| `-ing` dot, `-ly` circle/`-ily` loop | ✅ | | |
| `o`/`oo` hook modifications | ✅ | | |
| `-ment`, `-ble`, `-ple`, `per`/`pro`/`pur` | | ✅ | |
| `en`/`in`/`un`/`em`/`im`, `ex` | | ✅ | |
| `be`/`de`/`re`/`dis`/`mis` | | ✅ | |
| `for`/`fore`/`fur`, `-ful`, `-self`, `-age`, `-ture`, `-ther`, `-ings`, `-ingly` | | ✅ | |
| `-ed`, `-er`/`-or` joined | | ✅ | |
| `-er`/`-or` disjoined | | | ✅ |
| `ted`/`ded`, `men`/`mem` | | | ✅ |
| vowel omission, `r` omission | | | ✅ |
| brief forms, phrasing | | | ✅ |

This table is the practical answer to “which combinations does the app need?” It is also the scope
boundary for the builder: do not implement a post-v1 omission in the middle of a v1 session.

### 12.4 Testing each rule

- **Positive tests:** at least three words per rule, chosen so the rule is the only explanation for the
  expected path.
- **Negative tests:** a word where the rule must *not* apply (*dean* vs `ten`; *complete* vs *keep*;
  *baggage* vs *package*).
- **Allograph tests:** the same word with the wrong `s`/`th`/`r` variant should fail a golden diff, and
  the scorer should report the specific issue.
- **Context tests:** `r` before vs after a vowel; `s` before vs after each consonant in the rule.
- **Edition tests:** a word with an Anniversary form and a Simplified form, if both are ever shipped.

---

## 13. Corrections to existing documents

These are the places where the primary sources contradict the earlier draft. The edits are applied in
the same change as this document.

| Document | Previous assumption | Correction |
| --- | --- | --- |
| `STROKE-REFERENCE.md` §2.1 | `th` short for `/θ/`, long for `/ð/` | One short `th`; two **motion** variants, not two lengths `[Ann §22, §78–79]` |
| `STROKE-REFERENCE.md` §2.3 | `s` variant chosen by start tangent | Explicit left/right rules by neighboring consonant `[Ann §49]` |
| `STROKE-REFERENCE.md` §2.3 | `x` is `k` + `s` | `x` is `s` modified in slant `[Ann §57]` |
| `STROKE-REFERENCE.md` §5 | six blends only | Six chart blends plus two manual blends (`ted`/`ded`, `men`/`mem`), post-v1 |
| `STROKE-REFERENCE.md` §6.1 | `DH` → long `th` | `DH` → `th` (right/left motion); voicing not distinguished |
| `STROKE-REFERENCE.md` §6.2 | `ER` → `e3` + `r` | `ER` → `r` circle alone (the obscure `ur` vowel); other vowel + `r` → vowel + `r` circle `[Ann §71–72]` |
| `OUTLINE-NOTES.md` #3 | `th` length unresolved | Resolved: two motions, not two lengths |
| `OUTLINE-NOTES.md` #11 | `s` mirror variant heuristic | Resolved: explicit distribution |
| `OUTLINE-NOTES.md` #14 | `ER` mapping approximated | Resolved in principle: `ER` is the `r` circle alone; circle geometry remains ◐ |

---

## 14. Verification checklist

Before the combination layer is considered done:

- [ ] Render `pr`, `pl`, `br`, `bl`, `fr`, `fl`, `kr`, `gl`, `gr`, `kl`, `rk`, `lk`, `ld` next to the
      manual/chart examples.
- [ ] Render both `s` variants in every context in §4.1 and confirm the rule selects the printed form.
- [ ] Render `ses`, `x`, `z`, and `-ings` and confirm the terminal forms.
- [ ] Render `r` stroke vs `r` circle in *red / heart*, *run / learn*, *carry / car*, *around / art*.
- [ ] Render `th` left/right in *though / thin*, *author / both*, *father / faith*.
- [ ] Render all six blends plus the `ted`/`ded` and `men`/`mem` forms (post-v1).
- [ ] Render `-tion`, `-ing`, `-ly`, `-ment`, `-ble`, `con`/`com` in context.
- [ ] Check `complete`/`keep` and `baggage`/`package` for the documented angle/vowel distinctions.
- [ ] Check the A/O split in `con`/`com` words and `o`-hook modifications.
- [ ] Record every geometry approximation in `OUTLINE-NOTES.md`.
- [ ] Confirm no rule fires across a morpheme boundary where the manual says not to.

---

## 15. Sources

- Gregg, John Robert. *Gregg Shorthand (Anniversary Edition)*. Wikisource. Chapters 1–7 and *The
  Alphabet of Gregg Shorthand*. Section numbers above refer to the manual's numbered paragraphs.
- Gregg, John Robert. *The Alphabet of Gregg Shorthand*, in *Gregg Shorthand: New and Revised Edition*
  (1916). Public-domain chart reproduced at
  [`reference/gregg-alphabet-1916.png`](reference/gregg-alphabet-1916.png).
- Zhai et al. *Gregg1916-A: A Corpus and a Novel Approach for Optical Gregg Shorthand Recognition*
  (2018). Repository: `anonimously/Gregg1916-Recognition`. No declared license; reference only.
- Silva, L. *Handwritten Gregg Shorthand Brief Forms Recognition Using Convolutional Neural Networks*
  (2025). Repository: `lyshasilva/GreggBF`. Dataset not formally validated; do not assume a permissive
  license.
- Heil, F. & Nauwerck, F. *LION: The Linnaeus–Östergren Inventory of Notation* (2024/2025). Handwritten
  Melin shorthand; not Gregg.
- Šarman, S. J. *text2Gregg* (`steno.tu-clausthal.de/Gregg.php`). Server-side text→Gregg generator;
  Centennial-oriented; no explicit license. Reference only.
- [`HANDWRITING.md`](HANDWRITING.md) for the scoring and recognition evidence.

**Verification gap:** the Wikisource transcription has the manual's text but not its shorthand
illustrations. The geometry of joins is therefore text-verified and chart-verified only where the 1916
chart shows the combination. Before shipping a golden sheet, compare against a public-domain printed
manual page or the 1916 dictionary images (reference only, not shipped).
