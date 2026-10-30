# Outline accuracy audit

How close the generated outlines are to real Anniversary Gregg, measured word by word against the
1929 manual and the *Gregg Shorthand Dictionary*. The report is produced by
`npm run audit:outlines` (`tools/audit-outlines.mjs`); this page records the findings and the agreed
fix order.

**Sources**

- Anniversary Edition scans in `docs/reference/anniversary/` (p25 `rk`/`lk`, p69 `w`/`wh`, p89
  `nt`/`nd`/`mt`/`md`, p90 `ld`, p100–101 word drills).
- *Gregg Shorthand Dictionary* (1929), rendered pages cited per item. The PDF is not in the repo;
  page numbers below are PDF page indices.
- `docs/COMBINATIONS.md` §8–9 for the written rules.

**Method.** Every lexicon record (8,000 words) is resolved to drawn units and rendered, then checked
for a structural property the rule requires (a unit present, absent, or drawn as a particular
stroke). Spot checks name the manual/dictionary page that shows the expected outline. Counts are
per word, not per learner.

## Summary

| # | Finding | Words | Severity | Root cause |
| --- | --- | --- | --- | --- |
| 1 | `-tion`/`-sion` never contracts; a trailing `n` is drawn | 107 | High | Contraction expects `sh u1 n`; syllabic rule already reduced it to `sh n` |
| 2 | `con`/`com` contraction misses most words | 109 of 126 | High | Rule matches only `k u1 n/m`; short-o and syllabic forms differ |
| 3 | `wh` lacks the `h` dot | 42 of 47 | High | CMUdict gives `W` only; no spelling-aware `h` |
| 4 | `blend-tive` fires on `ad-v-`, `-ful`, `-f-` | 17 of 17 | High | `t/d + f/v` treated as a syllable everywhere |
| 5 | `x` form leaks to every `s` in an x word | 58 extra in 52 + 18 words | Medium | `word.includes("x")` used as the phoneme test |
| 6 | `rk` wave never fires after a vowel | 40 of 40 | Medium | `selectVariant` returns `circle` before the join variant |
| 7 | `ld` terminal selected but not drawn | 88 pairs | Medium | `outline.js` still emits a separate `d` |
| 8 | `blend-tem` spans prefix/compound boundaries | 26 of 40 | Medium | Pairwise blend test has no morpheme boundary |
| 9 | `blend-emt` spans compound boundaries | 4 of 30 | Low | Same |
| 10 | `spend`, `gentle` use `ent` instead of `pent` | 2 | Low | `detectLongBlend` only sees `p/j + n + t/d` |
| 11 | `-tain` not written with `ten` | 11 of 16 | Medium | No `-tain` rule |
| 12 | `mpt` written as three strokes | 9 | Low | No `mpt`/`mt` long blend |
| 13 | Syllabic-schwa tag over-applies | 1,165 tags | Root cause | Prefix/suffix vowels marked syllabic |

## Findings

### 1. `-tion` / `-sion` (High)

The rule says `-tion`/`-sion` is the `sh` sign (`Ann §58`; `COMBINATIONS.md` §9.1). The generator
contracts only the tail `sh u1 n`, but the syllabic-schwa rule has already rewritten the lexicon tail
to `sh n`, so the contraction never fires: **0 of 107** words contract, and every one draws an extra
`n`.

```
nation     n a3 sh n   (expected n a3 sh)
action     a1 k sh n   (expected a1 k sh)
vision     v e1 sh n   (expected v e1 sh)
```

**Fix:** accept `sh n` (and `zh n` if present) in `applyContractions`. One condition, ~107 words.

### 2. `con` / `com` (High)

`Ann §80–81` has three branches:

| Spelling | Outline | Example |
| --- | --- | --- |
| `con`/`com` + consonant | `k` | *confess, convention, compel, combat* |
| `comm`/`conn` | `k` + one `m`/`n` | *comment, common, commence* |
| `con`/`com` + vowel, `r`, `l` | `k` + `n`/`m` | *comedy, comrade, comic* |

The code only contracts the exact heads `k u1 n` / `k u1 m`. Of **126** `con`/`com` + consonant words
(exception list excluded), **109** miss. The prefix vowel arrives as `o1` (short-o), or the syllabic
rule drops it to `k n` / `k m`:

```
convention   k n v e2 n sh n      (expected k + v ...)
computer     k m p y u3 t r       (expected k + p ...)
contact      k o1 n t a1 k t      (expected k + t ...)
comment      k o1 m e2 n t        (expected k + m + ent)
```

Head distribution of the 126: `k n` 48, `k o1` 47, `k m` 18, `k u1` 18, `k o3` 1, `k a2` 1.

**Fix:** decide the branch from the spelling (`comm`/`conn` vs `con`/`com` + consonant vs vowel),
not from the phoneme head. Keep `FALSE_CONTRACTIONS` (`complete`, `company`, …) as-is.

### 3. `wh` (High)

The manual writes `wh` as `hw` with the `h` dot before the `w` (`Ann p69 §98`; scan p69: *wheat,
wheel, whim, whale*). CMUdict drops the `h`, so **42 of 47** `wh` words have no dot. The five that
already carry `h` are `who, whoever, whole, whom, whose` (pronounced /h/).

```
when   w e2 n    (expected h + w + e2 + n)
white  w ai t    (expected h + w + ai + t)
```

**Fix:** when a word starts with `wh` and its units start with `w` with no `h`, insert `h` before
`w`. The dot lands before the `w`, matching the scan.

### 4. `blend-tive` (High)

`t/d + f/v` is treated as the loop blend everywhere, but the loop means a `-tive`/`def` syllable
(`Ann p101`). **All 17 uses are wrong:** `ad-v-` (*advance, advantage, adventure, advice*), `-ful`
(*delightful, dreadful, grateful, thoughtful, ungrateful*), and compounds (*godfather, outfit,
platform*). No word in the lexicon needs the loop under the current rules.

**Fix:** remove `blend-tive` from `detectBlend`, or gate it on a `-tive` suffix. Keeping the glyph for
a later brief-form layer is fine; the generator should not select it.

### 5. `x` (Medium)

`selectVariant("s", …)` returns `x` whenever `word.includes("x")`. Two consequences:

- **52 words** with a second `s` draw it as a second `x` — **58 extra x signs** (`access, boxes,
  exercise, excess, six, taxes, texts`).
- **18 words** spelled with `x` but no /ks/ get a spurious `x` (`exact, exam, example, exist, exit,
  anxious, sexual`); 21 letter-`x` words lack the `x-form` tag, 2 start with `x` and are excluded by
  the guard, and `luxury` has no `s` to misdraw.

```
six        s e1 s      (expected s + x, one x sign)
exercise   e2 s r s ai s  (three x signs; expected one)
exact      e1 g s a1 k t  (expected the s to stay s)
```

**Fix:** store which `s` is the /ks/ sign in the lexicon (an index or a `x-form` position), and stop
using the spelling as the test. `x` is one sign for the whole /ks/.

### 6. `rk` (Medium)

`Ann p25` writes post-vocalic `r + k` as one wave (`ark, dark, mark, park, pork, fork, work`).
`selectVariant` returns `circle` for `r` after any vowel, so the `rk` join is never reached:
**40 of 40** occurrences are blocked (`ark, bark, dark, fork, park, pork, shark, spark, stark,
market, york, …`). The wave is used only when `r` follows a consonant (`burke, circle, clerk`).

**Fix:** in `selectVariant`, check `next === "k"` (and `next === "l"` for `lk`) before the
post-vocalic circle rule. The `rk`/`lk` glyphs already exist.

### 7. `ld` (Medium)

`Ann p90 §136`: `l + d` is one `l` curve with an upward turn at the finish (*old, field, child*). The
`ld` variant is selected for **88** `l + d` pairs, but `outline.js` does not branch on it and still
draws a separate `d`. The variant exists in `units.js` and is unused.

**Fix:** when the `l` variant is `ld`, emit the upward terminal and skip the `d` stroke.

### 8. `blend-tem` (Medium)

`t/d + m` is one long upward curve in a single syllable (*item, victim, bottom, custom, autumn,
freedom, kingdom, wisdom, system, symptoms*). **26 of 40** uses cross a prefix or compound boundary
and should be two strokes: `adam(s), admiral, admire(d), admission, admit(ted), apartment(s),
atmosphere, batman, commitment, compartment, department, excitement, headmaster, investment,
madam(e), madman, nightmare(s), statement(s), treatment`. The other 14 are correct.

**Fix:** only blend when `t/d + m` is inside one syllable. The lexicon needs a syllable or morpheme
boundary for this; a spelling guard for the listed prefixes (`ad-`, `-ment`, `-mate`) is the cheap
interim.

### 9. `blend-emt` (Low)

**25 of 30** are correct (*armed, seemed, dreamed, formed, named, …*). Four cross a compound
boundary: `hometown, someday, sometime, sometimes`. `temptation` is borderline (`mpt` reduced to
`mt`). Same boundary fix as `blend-tem`.

### 10. `blend-pent` (Low)

**10 uses, all correct:** `agent(s), carpenter, happened, imagined, legend(s), opened, sergeant,
urgent`. Two words that need it use `blend-ent` instead: `spend` (`s p e2 + ent`) and `gentle`
(`j e2 + ent + l`) — `Ann p89` writes both with the `pent` loop.

**Fix:** `detectLongBlend` should see `p/j + n + d/t` after a vowel too. Small condition.

### 11. `-tain` (Medium)

`Ann §155`: `-tain` is `ten` (*contain, maintain, obtain, retain, detain*). **11 of 16** miss;
`britain, captain, certain, curtain` already end in `ten` for other reasons.

```
contain    k + ent + a3 + n   (expected k + ten)
maintain   m a3 + ent + a3 + n (expected m a3 + ten)
obtain     u1 b t a3 n         (expected u1 b + ten)
```

**Fix:** a `-tain` contraction in `applyContractions` that replaces the tail `t a3 n` with
`blend-ten`, applied after the con/com rule.

### 12. `mpt` (Low)

The manual writes `mpt`/`mt` as one long curve (*empty, prompt, attempt, contempt*). **9 words** write
`m + p + t` separately. `temptation` already collapses to `mt` and picks up `blend-emt`.

**Fix:** add an `mpt`/`mt` long blend, or accept the full strokes as a v1 approximation and label it.

### 13. Syllabic schwa (root cause)

**1,165** records carry the `syllabic` tag. The rule is meant for a syllabic consonant (`button`,
`written`, `sudden`) but it also fires on prefix and suffix vowels: `convention` → `k n …`,
`computer` → `k m …`, `balance` → `b a1 l n s`. That is why the con/com contraction sees `k n`/`k m`
instead of `k u1 n`/`k u1 m`, and why `-tion` sees `sh n` instead of `sh u1 n`.

**Fix:** restrict the tag to a consonant that follows an unstressed vowel and is followed by no vowel
(or by `n`/`l` in the same syllable). Fixing this first would make #1, #2 and part of #8 fall out
naturally, but it is the largest change; the targeted contraction fixes are cheaper.

## What is already correct

- **`-ing`**: 522 of 522 words contract to `ng` + dot.
- **`-ly`**: 131 of 131 true `-ly` suffix words contract to `l` + circle. The other 8 `-ly` spellings
  (`fly, apply, reply, supply, July, ally, rely, butterfly`) are /laɪ/, not the suffix, and correctly
  do not contract.
- **`-ment`**: 34 of 42 use `m` + `ent` (correct); 8 wrongly use `blend-tem` (finding 8). The suffix
  itself is right.
- **`-nt`/`-nd` blend**: correct in the manual drills (*plenty, apparent, prevent, land, bond, print,
  second, fastened, signed, event, count, ground, grant, convent*).
- **`-mt`/`-md` blend**: correct in *armed, seemed, dreamed, formed, named, …*.
- **`-tem` blend**: correct in *item, victim, bottom, custom, autumn, freedom, kingdom, wisdom,
  system, symptoms*.
- **`pent` loop**: correct in *agent, carpenter, happened, imagined, legend, opened, sergeant,
  urgent*.
- **Joins**: `pr/pl/br/bl/fr/fl/kr/kl/gr/gl/lk` are selected and drawn as precomputed variants.
- **`ld`**: the variant is selected (the geometry is the only gap).
- **Read grading**: aliases accept any spelling whose outline matches, so none of the above changes
  what a learner may type.

## Fix order

Cheapest and highest-impact first; each step changes golden snapshots.

| Order | Fix | Why first | Risk |
| --- | --- | --- | --- |
| 1 | `-tion` accepts `sh n` | 107 words, one condition | Low |
| 2 | `con`/`com` spelling-aware | 109 words, very common | Medium (exception list) |
| 3 | `wh` `h` dot | 42 words, one insert | Low |
| 4 | `x` metadata | 58 wrong signs | Medium (lexicon rebuild) |
| 5 | Drop `blend-tive` | 17 wrong loops | Low |
| 6 | `rk`/`lk` preference | 40 words, one branch | Low |
| 7 | `ld` geometry | 88 words, renderer only | Medium |
| 8 | `blend-tem`/`emt` boundary guard | 30 words | Medium |
| 9 | `-tain`, `mpt`, `pent` | 22 words | Low |
| 10 | Syllabic-schwa scope | root cause; large blast radius | High |

Steps 1–3 and 5–6 are self-contained and can land together. Step 4 needs `tools/build-lexicon.mjs`
to store the /ks/ position. Step 8 needs a boundary signal; until then a spelling guard is honest
enough.

After any step: `npm test`, `npm run coverage`, `npm run audit`, `node tools/golden.mjs --update`,
review `docs/outline-sheet.html`, then `golden:check`, `precache`, `precache:check`.
