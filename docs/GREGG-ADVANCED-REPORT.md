# Dregg — Advanced Gregg Report

**Audience:** the implementing agent and anyone extending the generator beyond the Core/Precision
curriculum.
**Purpose:** the second scan pass. It resolves most of the remaining glyph questions, catalogues the
advanced Anniversary material (Chapters VIII–XII), and says which parts belong in the generator versus a
separate post-v1 reference module.
**Companion:** [`GREGG-GENERATOR-REPORT.md`](GREGG-GENERATOR-REPORT.md), [`COMBINATIONS.md`](COMBINATIONS.md),
and the scans in [`reference/anniversary/`](reference/anniversary/README.md).

---

## 0. The short version

- **Advanced Gregg is mostly lexical, not generative.** Final `t`/`d` omission, analogical
  word-beginnings/endings, phrasing, initials, and intersection all depend on the word, the context, or
  the writer. Do not add them as blanket rules to the core outline engine.
- **The generator should stay at V1/V1.5** from `COMBINATIONS.md` §9. Advanced forms belong in a
  post-v1 module backed by **whole-word records and diagrams**, not phoneme rules.
- **Three geometry questions are now resolved:** `sh` is a very small steep down-left stroke; the O hook
  is the lower half of the small ellipse (`∪`); the ōō hook is the upper half (`∩`).
- **Still open:** exact `sh` angle/length, O/U hook orientation in every context, `y`/`ng`/`nk` visual
  confirmation, the `r` circle merge, and the `w` dash length.

---

## 1. Resolved and remaining geometry

### 1.1 `sh` — resolved

Scan p34 shows P B F V CH J S SH together. `sh` is **much smaller than `ch`**, a steep down-left stroke,
almost vertical. It is not a full short stroke.

- Starting constants: length ≈ **0.6 u**, angle ≈ **65–70°** from +x.
- `ch` remains ≈45°, `j` ≈45° and long; `sh` is shorter and steeper.
- Update `STROKE-REFERENCE.md` and `SPEC.md`; the old 1.0 u / 60° value was too long and too shallow.

### 1.2 O hook — resolved

Scan p50: the O hook is the **lower half of the small ellipse**, a `∪`-shaped hook opening up. The three
forms are plain `ŏ`, dot `aw`, tick `ō`. The hook attaches to the preceding stroke; in the word drill it
sits at the end of a forward stroke (*rot, raw, wrote*) or at the top/bottom of a downstroke depending on
the join.

### 1.3 ōō hook — resolved

Scan p64: the ōō hook is the **upper half of the small ellipse**, a `∩`-shaped hook opening down. The
three forms are plain `ŭ`, dot `ŏŏ`, tick `ōō`. Examples: *plus, pull, food, cut, us* (p65).

**Implementation note:** store the hook as the generating half-ellipse, not as a generic “curve.” The
orientation in a word still depends on the adjacent stroke; the scans show several placements. Keep the
O/U table in `STROKE-REFERENCE.md` §3.2 as a starting hypothesis and tune against p50/p64/p51/p65.

### 1.4 `s` after the `r` circle — resolved

Scan p56: when `s` follows a final left-motion circle on a straight stroke, the circle becomes a
**loop** (*tears, shares, stairs, dares, nears, manners*). The same page shows the joined vs disjoined
`-er`/`-or`: *keeper, dearer, worker* use a disjoined `r`; *greater, bigger, smaller* join it.

### 1.5 `r` circle merge — still open

Scan p29 and p55 show the `r` circle as a small loop attached after the vowel. For `ER` it stands alone
(*her, church, murmur*); for other vowel + `r` it follows the vowel (*art, care, near*). The exact way it
merges with a preceding large/small circle is still a geometry question. Measure from p29/p55 and log the
result.

### 1.6 `w` dash — still open

Scan p69 confirms the form and placement: initial/final `w` is a small hook; medial `w` is a short dash
**under the vowel that follows**; `sw` before a circle vowel uses the hook; `wh` is the hook plus the `h`
dot. The exact dash length and vertical offset still need measurement.

### 1.7 `th` — confirmed again

Scan p25 shows the two `th` forms as the same short curved stroke, mirrored. There is no long `/ð/` form.
The rules in `COMBINATIONS.md` §6 stand.

### 1.8 `y`, `ng`, `nk` — still not captured

The sign table is in the y/ng/nk unit around scan p68–p71; p71 is a reading-practice page, not the sign
table. The 1916 chart and the text rules are sufficient for now. Fetch p68–p70 if a visual check is
needed. Do not invent a new shape.

---

## 2. Advanced material — Chapters VIII–XII

These chapters are the “real Gregg” layer. They are useful for reading historical text and for a future
advanced module, but they are **not** generated from phonemes by simple rules.

### 2.1 Chapter VIII — omissions and simple prefixes/suffixes (scan 113–123)

| Rule | Examples | Stage |
| --- | --- | --- |
| Final `t` omitted when slightly enunciated, especially after `s`, `k`, `p`, `den` | *best, largest, adjust, rest, act, fact, project, induct, president* | post-v1 running |
| Final `t` is written in a lexical exception list | *lost, dust, worst, east, taste, distant, fast, missed, intent, cast, mixed, content, vast, post, extent, least, coast, patent* | post-v1 |
| Final `d` omitted when slightly enunciated | *mind, remind, intend, extend, demand, command, beyond* | post-v1 running |
| `d` is written in a lexical list | *commend, contend, attend* | post-v1 |
| `d` omitted before `m` or `v` | *admit, admire, advance, adverb, adventure, advise* | post-v1 |
| Initial vowel also omitted in *admire, advice, advise, advance* in phrases | *we admire, in advance* | post-v1 phrasing |
| Past tense after an omitted final = **disjoined `t`** | *contested, insisted, extended, requested* | post-v1 |
| `ul` = ōō hook; `al` = ō hook | *ultimatum, alternative, almanac* | post-v1 |
| `sub` = joined `s`; `less` = `l` | *subway, submit, substance; thoughtless, homeless, needless* | post-v1 |
| `sub` before `r`, `l`, `ch`, `j`, or a hook is written contrary to rule | *suburb, sublime, subchief, subjoin* | post-v1 |
| `sub` before a circle vowel: disjoin `s` on the line close to the following character | *subeditor, subhead* | post-v1 |
| Phrasing may omit unimportant words | *in the world, day or two, more or less* | post-v1 phrasing |

**Why not generate:** the `t`/`d` rules have long exception lists, and the omission changes the outline.
Treat them as **lexical variants** selected per word, not a default.

### 2.2 Chapter IX — the abbreviating principle (scan 124–136)

- Abbreviation is flexible and depends on the writer's familiarity with the subject.
- Longhand abbreviations are used when they give a distinctive outline: *R.R., O.K., U.S., U.S.A.*
- Write through the consonant following the accented syllable if writing through the accented syllable
  is not distinctive.
- The vowel before `-shun` is omitted (the `sh` already carries the syllable).
- Compound words are formed by joining brief forms; irregular compounds are listed.
- Figures and commercial signs: after numerals, *dollars* is `d`; the signs may follow *a, per, few,
  several*.

**Why not generate:** this is the beginning of the brief-form/phrasing layer. It needs a lexicon of
sanctioned forms and a writer model, not a phoneme rule.

### 2.3 Chapter X — analogical word-beginnings (scan 137–149)

Certain prefixes/letters are **disjoined** and placed above the line, very close to the remainder of the
word, to express `tr` + a following vowel. The chapter gives long lists of sanctioned forms:

- `con-`, `contr-`, `construct-`, `detr-`, `distr-`, `electr-`, `extr-`, `inter-`, `instruct-`,
  `retr-`, `restr-`
- `agr-`, `anticip-`, `decl-`, `incl-`, `magn-`, `mult-`, `over-`, `par-`, `post-`, `recl-`,
  `self-`, `circ-`, `grand-`, `short-`, `super-`, `sus-`, `trans-`, `under-`

Examples: *central, contract, construct, detriment, destroy, electric, extra, interest, instruct,
retreat, restrain; agree, anticipate, declare, include, magnify, multitude, over, paragraph, postage,
recline, selfish, circular, grand, short, superintend, suspect, transact, under*.

**Why not generate:** these are **whole-word forms** chosen by the abbreviating principle. The prefix is
disjoined; it is not a productive string substitution you can safely apply to any word.

### 2.4 Chapter XI — analogical word-endings, initials, intersection (scan 150–161)

**Joined endings** (examples): `-scribe/-scription`, `-cient/-ciency`, `-pose/-position`,
`-pute/-putation`, `-ture`, `-ual`, `-spect/-spection`, `-quire/-quisition`, `-spire`,
`-pensive/-tensive`, `-gency`, `-sure`, `-flect/-fliction`, `-sult/-sultation`, `-ment`.

**Disjoined endings** (the vowel before the ending is understood): `-ical`, `-ality`,
`-ulate/-ulation`, `-ability/-ibility`, `-acity/-icity`, `-ology`, `-ority`, `-ification`, `-graphy`,
`-gram`, `-ward/-hood`, `-ship`, `-mental`, `-ity`, `-ic`.

Examples: *subscribe, ancient, compose, reputation, picture, actual, inspect, require, expire,
expensive, agency, assure, reflect, result, assignment; article, political, personality, formulate,
possibility, capacity, psychology, authority, classification, phonograph, telegram, forward, friendship,
fundamental, calamity, domestic.*

**Initials:** there is no context, so accuracy is critical. Many writers write initials in longhand or
join small letters.

**Intersection:** writing one character through another for special phrases (*A.D., A.M., P.M., C.O.D.*).
The manual explicitly says this depends on the writer's judgment and the terms of their work. It is not a
general rule.

**Why not generate:** disjoined endings are lexical, and intersection is a special-case notation. Store
them as **whole-word records with a diagram**; never infer them from a suffix string.

### 2.5 Chapter XII — names, states, cities, vocabulary (scan 162–178)

- Postal abbreviations for states and territories.
- Principal U.S. cities, Canadian provinces/cities.
- Name terminations; some city/state names may be joined; “State of” before a state name is omitted.
- A short vocabulary of advanced words.

**Why not generate:** this is reference data. It is useful for a future “read real Gregg” module, not for
the curriculum generator.

---

## 3. How to model advanced forms

Extend the rule layer rather than adding special cases to the layout engine.

```ts
type AdvancedKind =
  | "omission"        // final t/d, unstressed r, etc.
  | "joined"          // -scribe, -position, ...
  | "disjoined"       // prefix/ending placed above/close to the remainder
  | "intersection"    // one character through another
  | "analogical";     // sanctioned whole-word form

interface AdvancedRule {
  kind: AdvancedKind;
  pattern: string[];          // units or phonemes, when productive
  form: string;               // replacement / reference to a diagram
  placement?: {
    relation: "above" | "below" | "close" | "through";
    offset: number;           // in u
  };
  exceptions?: string[];      // e.g. final-t words that keep the t
  stage: "v1" | "v1.5" | "post";
  confidence: "verified" | "approximated" | "open";
  source: string;             // manual section + scan page
}
```

**Rules for using it:**

1. **Do not infer a disjoined form from a suffix.** Store the whole word, its base, the ending, and a
   diagram. The same ending can be joined or disjoined depending on the word.
2. **Do not apply an omission globally.** `t` is omitted in *best* but written in *lost*; `d` is omitted
   in *mind* but written in *commend*. Use a lexical exception list.
3. **Do not add phrasing to the generator.** Phrasing joins whole words and depends on sense and
   context; it belongs in a separate reading module.
4. **Do not add intersection.** It is a special notation for a handful of phrases; use a lookup table if
   it is ever needed.
5. **Keep `stage` honest.** Advanced forms are `post` unless they are needed for the V1/V1.5 outline.

---

## 4. What not to implement in the core generator

| Do not add | Why | If needed |
| --- | --- | --- |
| Final `t`/`d` omission as a default | Lexical exceptions; changes the outline | Post-v1 `omission` records |
| Analogical beginnings/endings as productive rules | Whole-word, writer-dependent | `AnalogicalForm` records with diagrams |
| Phrasing | Sense/context-dependent; joins words | Separate post-v1 reading module |
| Intersection | Special-case notation | Lookup table |
| Brief forms in generated write items | Memorized, not generated | Post-v1 brief-form module |
| States/cities/vocabulary | Reference data | Read-real-Gregg module |
| `text2Gregg` output | Centennial, no license, not a rule engine | Manual cross-check only |

---

## 5. Refinement workflow

### 5.1 Page map for advanced material

| Chapter | Scan pages | Topic |
| --- | --- | --- |
| VIII | 113–123 | Final `t`/`d` omission, `ul`/`al`, `sub`/`less`, phrasing |
| IX | 124–136 | Abbreviating principle, vowel before `-shun`, compounds, figures |
| X | 137–149 | Analogical word-beginnings (disjoined), compounds, phrasing |
| XI | 150–161 | Analogical word-endings (joined/disjoined), initials, intersection |
| XII | 162–178 | States/cities, name terminations, vocabulary |

### 5.2 How to refine

1. Normalize the scan and the Dregg outline by the **short-stroke length**, not by pixels.
2. Compare one rule at a time; start with the V1/V1.5 forms, then move to advanced forms.
3. For an advanced form, record **the whole word**, not just the suffix. Note the manual section and the
   scan page.
4. Add a positive and a negative example to the golden sheet.
5. If a form is not in the manual's lists, do not invent it from the rule; use a full outline or a
   documented override.

### 5.3 What to measure next

- `sh` angle and length from p34 (start 0.6 u / 65–70°).
- O/U hook orientation in every context from p50/p51/p64/p65.
- `y`/`ng`/`nk` from p68–p70.
- `r` circle merge from p29/p55.
- `w` dash length/offset from p69.
- Final `t`/`d` omission frequency and exceptions from p113–p123.
- Which analogical forms are common enough to include (p137–p161).

---

## 6. Open questions

1. Exact Bézier constants for the small `sh` and the O/U hooks.
2. Does the O hook always open up, or does it mirror in some joins? The scans show context-dependent
   placement; verify against p50/p51/p64/p65.
3. Where is the `y`/`ng`/`nk` sign table in the scan? Likely p68–p70; p71 is reading practice.
4. How does the `r` circle merge with a preceding large/small circle?
5. Exact `w` dash length and vertical offset.
6. Which final `t`/`d` omissions are frequent enough to teach, and which are writer habits?
7. Which analogical beginnings/endings are worth a post-v1 module; the lists are long and old-fashioned.
8. Anniversary vs Simplified/Centennial differences; do not mix forms.

---

## 7. Sources and licensing

- *Gregg Shorthand (Anniversary Edition)*, 1929. Scan:
  `https://commons.wikimedia.org/wiki/File:Gregg_Shorthand,_Anniversary_Edition.djvu`.
  Commons marks it **PD-US-expired** / **PD-old-70**.
- Chapters VIII–XII on Wikisource: text only, CC BY-SA. Cite the transcription; do not redistribute
  scanned pages as part of the app.
- The page images in [`reference/anniversary/`](reference/anniversary/README.md) are development
  reference, not app assets.
