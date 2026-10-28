# Lexicon sources and refresh

The shipped app never fetches anything. These files are used only by
`tools/build-lexicon.mjs`; the generated result is committed at `app/js/data/lexicon.js`.

## Sources

| File | Source | License | Used for |
| --- | --- | --- | --- |
| `tools/data/cmudict.dict` | [CMU Pronouncing Dictionary](https://github.com/cmusphinx/cmudict) (`cmudict.dict`) | BSD-2-Clause | ARPAbet pronunciations |
| `tools/data/en_50k.txt` | [FrequencyWords](https://github.com/hermitdave/FrequencyWords) `content/2018/en/en_50k.txt` | MIT | Frequency rank and tier |

`tools/data/` is not shipped and may be re-downloaded at any time.

## Refresh

```sh
mkdir -p tools/data
curl -L -o tools/data/cmudict.dict https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict
curl -L -o tools/data/en_50k.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt
node tools/build-lexicon.mjs
node tools/coverage.mjs
node tools/audit-lexicon.mjs
node tools/precache.mjs
```

`build-lexicon.mjs` selects ~2,000 real words: the most frequent usable words first, then tops up
rare units and phase gates. It filters a profanity blocklist, drops words longer than 12 letters or
over 3 syllables, and writes `tools/lexicon-audit.csv` for review. No synthetic spellings are
generated: Gregg is phonemic, so an invented spelling asks the learner to guess a pronunciation.

## Attribution in the app

Settings → About credits CMUdict and the public frequency list. The repository license note should
also mention both when the app is published.
