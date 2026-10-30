# Outline Notes

Running log of joins, placements, and glyphs that the default rules do not handle exactly. Each entry
records what is approximated, why, and what would verify it. The UI should label approximations
rather than present them as authoritative.

**Status values:** `open` (known issue), `approximated` (shipped with a label), `verified` (checked
against a manual/dictionary), `fixed` (rule or override added).

| # | Area | Status | Notes | Verification |
| --- | --- | --- | --- | --- |
| 1 | Medial `w` under-dash | fixed | The dash is emitted on the pass that places the following vowel: 0.4 u long, horizontal, centred under the vowel and 0.16 u below its lowest point. It also survives when the vowel carries a final `r` (*beware*). | Anniversary Manual p69 §99 (*quick*, *queen*, *twin*); scan p69 |
| 2 | Initial/final `y` | approximated | Small circle before a hook vowel; `ye` is a small loop; `ya` is a large loop; final `y` often becomes `ai`/`oi`. | Anniversary Manual ch4 §104; COMBINATIONS §7 |
| 3 | `th` motion variants | fixed | The two chart forms are left/right motion, not short/long or /θ/ vs /ð/. Left before/after `o`, `r`, `l`; right otherwise. | Anniversary Manual ch3 §78–79; COMBINATIONS §6 |
| 4 | `sh` angle/length | approximated | Scan p34 shows a **very small** steep down-left stroke, shorter than `ch`. Start at ≈0.6 u and ≈65–70°; tune against the scan. | Anniversary scan p34; STROKE-REFERENCE §2.2 |
| 5 | `ng` / `nk` curvature | approximated | Chart looks like shallow straight down-right strokes; could be slight curves. | 1929 chart |
| 6 | Two-curve vowel placement | approximated | Unchanged heuristic: the vowel goes inside the preceding curve, or outside the angle when the preceding stroke is straight. Checked against the drill words in *cream*, *crane*, *glen* with no counter-example; still a heuristic when both neighbours are curves. | Anniversary scans p24/p25/p36 |
| 7 | Vowel hook orientation | fixed | O hook is the lower half of the small ellipse and always opens up; ōō is the upper half and always opens down. No side-mirroring of the hook shape. | Anniversary scans p50, p64, p51, p65 |
| 8 | Diphthong ligatures | fixed | `ai`, `ow`, `oi`, `yu` are one continuous stroke each; see #24. | 1916 chart / 1929 chart; STROKE-REFERENCE §4 |
| 9 | `ten`/`ent` blends | approximated | Approximated with a fillet; the printed form is a deliberate large curve. Prefer an explicit composite path. | 1916 chart blends |
| 10 | `def-v` / `jent-d` loops | approximated | `tive` and `pent` already use the single-oval loop; `def-v` and `jent-d` fall back to separate strokes because the loop only triggers on adjacent consonants. Adding them means a new blend unit that carries an intervening vowel. | 1916 chart, blended consonants |
| 11 | `s` mirror variants | fixed | Explicit distribution: left before/after `p`, `b`, `r`, `l` and after `t`, `d`, `n`, `m`, `o`; right otherwise. Geometry still to tune. | Anniversary Manual ch2 §49; COMBINATIONS §4 |
| 12 | Schwa omission | approximated | v1 writes `AH0` as `u1`; natural Gregg often omits unstressed vowels. | Manual examples |
| 13 | `h` dot placement | approximated | The dot is drawn at the pen, which is where the following vowel attaches, so it reads as "at the vowel" (*he*, *have*); after a vowel it sits below it (*ah*). No manual page in the reference set shows the dot in a longer outline. | Manual examples (*he*, *have*, *ah*) |
| 14 | `r` after a vowel | fixed | Standard form is the post-vocalic `r` circle, not the `r` stroke; obscure `ur` is the circle alone. Circle vowel + `r` merges into one loop (scan p29/p55); `s` after a final left-motion `r` loop folds in; a **final** `r` circle is drawn closed at the stroke end, not as an open loop. | Anniversary Manual ch3 §71–72, ch7 §161–163; COMBINATIONS §5; scans p29, p55, p56 |
| 15 | Join variants | verified | Precomputed variants, no runtime rotation: `pr`/`pl` bow left, `br`/`bl` start down, `fr`/`fl` rounded, `kr`/`gl` equal flatter curves, `gr`/`kl` unequal, `ld` a swinging upward turn. Rendered drill words match the printed forms closely enough to keep. | Anniversary p24 §19, p25 §20–21, p36 §39, p90 §136 |
| 16 | Full vs running outline | approximated | v1 writes every vowel; real Gregg omits obscure vowels, short `u`/`ow`, and unstressed `r`. The running form is post-v1. | Anniversary Manual ch1 §16, ch5 §124–125, ch7 §165; COMBINATIONS §11 |
| 17 | `-ly` circle / `-ily` loop | approximated | `-ly` is a small circle at the end of `l`; it attaches at the pen, so its side follows the preceding stroke. `-ily`/`-ally` are not distinguished yet. | Anniversary Manual ch3 §80–82 |
| 18 | `-ed` joined vs disjoined | approximated | Join `t`/`d` when distinctive and facile; otherwise disjoin `t` close to the preceding character. Contextual, not purely phonetic. | Anniversary Manual ch2 §59; COMBINATIONS §9.2 |
| 19 | Productive contractions | approximated | `con`/`com` = `k`, `-tion` = `sh`, `-ing` dot, `-ment` = `m`, etc. change the unit sequence; avoid false positives (*complete*/*keep*, *baggage*/*package*). | Anniversary Manual ch2 §58, ch3 §80–81, ch5 §127, ch7 §170; COMBINATIONS §9 |
| 20 | Additional blends | open | `ted`/`ded`/`det` and `men`/`mem` are single-stroke blends in the manual but not on the six-blend chart. Deferred to post-v1. | Anniversary Manual ch1 §26–27; COMBINATIONS §8.2 |
| 21 | `x` form | fixed | `x` is `s` modified in slant at the end of or within a word, not `k` + `s`. | Anniversary Manual ch2 §57 |
| 22 | `k`/`g`/`r`/`l` curve asymmetry | fixed | The curves are elliptical segments, not symmetric arcs: the `k`/`g` peak sits right of centre with a short down-tail, and the `r`/`l` low point sits left of centre with a long rise. Modelled with offset control points (`apex`). | Anniversary scan p17; STROKE-REFERENCE §2 |
| 23 | Vowel tick direction | fixed | The tick below `a3`/`e3` rises to the right, not down-right. `markSegment` now uses −45°. | Anniversary scans p19, p50, p64; STROKE-REFERENCE §3.1 |
| 24 | Diphthongs as one stroke | fixed | `ai`/`ow`/`oi`/`yu` were a circle plus a separate hook/loop. They are now a single continuous path (`diphthong` glyph): the circle closes and runs straight into its tail. | 1916 chart; STROKE-REFERENCE §4 |
| 25 | Blend orientation | fixed | `-nt/-nd` and `-mt/-md` cup upward from the bottom of the preceding circle; they no longer arch over its top. `tive`/`pent` are single oval loops. | Anniversary p89 §133–135; 1916 chart; STROKE-REFERENCE §5 |
| 26 | `pr`/`pl`/`br`/`bl` joins | fixed | The first stroke bows further left so the pair reads as a `C` with a bottom tail, matching “start to the left” / “start down”. | Anniversary p35 §37–38; COMBINATIONS §3 |

## Adding an entry

- Describe the smallest reproducible unit sequence (e.g. `k w e1 k` for *quick*).
- State the observed rendering and the expected printed form.
- Link or name the reference page/image.
- If an override is added, record the word/sequence and the test that covers it.
