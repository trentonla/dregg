# Outline Notes

Running log of joins, placements, and glyphs that the default rules do not handle exactly. Each entry
records what is approximated, why, and what would verify it. The UI should label approximations
rather than present them as authoritative.

**Status values:** `open` (known issue), `approximated` (shipped with a label), `verified` (checked
against a manual/dictionary), `fixed` (rule or override added).

| # | Area | Status | Notes | Verification |
| --- | --- | --- | --- | --- |
| 1 | Medial `w` under-dash | open | Rule documented; exact dash length/placement relative to the vowel is unverified. | Anniversary Manual, units on `w`/`qu` |
| 2 | Initial/final `y` | approximated | Small circle before a hook vowel; `ye` is a small loop; `ya` is a large loop; final `y` often becomes `ai`/`oi`. | Anniversary Manual ch4 §104; COMBINATIONS §7 |
| 3 | `th` motion variants | fixed | The two chart forms are left/right motion, not short/long or /θ/ vs /ð/. Left before/after `o`, `r`, `l`; right otherwise. | Anniversary Manual ch3 §78–79; COMBINATIONS §6 |
| 4 | `sh` angle/length | approximated | Scan p34 shows a **very small** steep down-left stroke, shorter than `ch`. Start at ≈0.6 u and ≈65–70°; tune against the scan. | Anniversary scan p34; STROKE-REFERENCE §2.2 |
| 5 | `ng` / `nk` curvature | approximated | Chart looks like shallow straight down-right strokes; could be slight curves. | 1929 chart |
| 6 | Two-curve vowel placement | open | When both neighbors are curves, “inside the nearest curve” is a heuristic. | Manual examples; golden corpus |
| 7 | Vowel hook orientation | fixed | O hook is the lower half of the small ellipse and always opens up; ōō is the upper half and always opens down. No side-mirroring of the hook shape. | Anniversary scans p50, p64, p51, p65 |
| 8 | Diphthong ligatures | fixed | `ai`, `ow`, `oi`, `yu` are composites: circle + attached part via `rim`/`end`, drawn as one path. | 1916 chart / 1929 chart; STROKE-REFERENCE §4 |
| 9 | `ten`/`ent` blends | approximated | Approximated with a fillet; the printed form is a deliberate large curve. Prefer an explicit composite path. | 1916 chart blends |
| 10 | `def-v` / `jent-d` loops | open | May need explicit composite paths rather than a fillet. | 1916 chart blends |
| 11 | `s` mirror variants | fixed | Explicit distribution: left before/after `p`, `b`, `r`, `l` and after `t`, `d`, `n`, `m`, `o`; right otherwise. Geometry still to tune. | Anniversary Manual ch2 §49; COMBINATIONS §4 |
| 12 | Schwa omission | approximated | v1 writes `AH0` as `u1`; natural Gregg often omits unstressed vowels. | Manual examples |
| 13 | `h` dot placement | open | Dot position relative to the vowel and adjacent strokes needs examples. | Manual examples |
| 14 | `r` after a vowel | fixed | Standard form is the post-vocalic `r` circle, not the `r` stroke; obscure `ur` is the circle alone. Circle vowel + `r` merges into one loop (scan p29/p55); `s` after a final left-motion `r` loop folds in; a **final** `r` circle is drawn closed at the stroke end, not as an open loop. | Anniversary Manual ch3 §71–72, ch7 §161–163; COMBINATIONS §5; scans p29, p55, p56 |
| 15 | Join variants | open | `pr`/`pl` start left; `br`/`bl` start down; `fr`/`fl` rounded; `kr`/`gl` flatter; `gr`/`kl` unequal; `ld` upward turn. Need precomputed variants, not runtime rotation. | Anniversary Manual ch1 §19–21, ch2 §37–39, ch6 §136; COMBINATIONS §3 |
| 16 | Full vs running outline | approximated | v1 writes every vowel; real Gregg omits obscure vowels, short `u`/`ow`, and unstressed `r`. The running form is post-v1. | Anniversary Manual ch1 §16, ch5 §124–125, ch7 §165; COMBINATIONS §11 |
| 17 | `-ly` circle / `-ily` loop | open | Small circle for `-ly`, loop for `-ily`/`-ally`; attachment side after a circle vowel needs geometry checks. | Anniversary Manual ch3 §80–82; COMBINATIONS §7.4 |
| 18 | `-ed` joined vs disjoined | approximated | Join `t`/`d` when distinctive and facile; otherwise disjoin `t` close to the preceding character. Contextual, not purely phonetic. | Anniversary Manual ch2 §59; COMBINATIONS §9.2 |
| 19 | Productive contractions | approximated | `con`/`com` = `k`, `-tion` = `sh`, `-ing` dot, `-ment` = `m`, etc. change the unit sequence; avoid false positives (*complete*/*keep*, *baggage*/*package*). | Anniversary Manual ch2 §58, ch3 §80–81, ch5 §127, ch7 §170; COMBINATIONS §9 |
| 20 | Additional blends | open | `ted`/`ded`/`det` and `men`/`mem` are single-stroke blends in the manual but not on the six-blend chart. Deferred to post-v1. | Anniversary Manual ch1 §26–27; COMBINATIONS §8.2 |
| 21 | `x` form | fixed | `x` is `s` modified in slant at the end of or within a word, not `k` + `s`. | Anniversary Manual ch2 §57 |

## Adding an entry

- Describe the smallest reproducible unit sequence (e.g. `k w e1 k` for *quick*).
- State the observed rendering and the expected printed form.
- Link or name the reference page/image.
- If an override is added, record the word/sequence and the test that covers it.
