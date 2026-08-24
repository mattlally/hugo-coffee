# Hero asset workflow

## The pipeline

```
start.png ──upload──► Seedream v4-edit ──► start_v2.png   (reframed, seed noted)
                              │
start_v2.png ─upload──► Seedream v4-edit ──► end_v2.png   (splash, SAME seed)
                              │
                    verify-frames.py  ◄─── gate: drift under tolerance?
                              │
                    video model (first+last frame)
                              │
                    ffmpeg -g 1  ──►  hero.mp4 + hero.webm
```

## Running it

```bash
cd hugo-site

./kie.py credits                    # sanity check

# 1. reframe the approved still so the splash has room
./kie.py edit --image media/start_raw.png \
              --prompt-file media/p1-start.txt \
              --out media/start_v2.png \
              --seed 424242

# 2. the splash — SAME SEED, only the state clause differs
./kie.py edit --image media/start_v2.png \
              --prompt-file media/p2-end.txt \
              --out media/end_v2.png \
              --seed 424242

# 3. gate on measured drift before spending anything on video
python3 media/verify-frames.py media/start_v2.png media/end_v2.png
```

**Pass the same `--seed` to both.** This is recipe rule 4 and the single biggest
upgrade over the ChatGPT attempt. The seed holds every detail you did not
describe — micro-texture, gradient falloff, incidental highlight shapes — and
those are exactly what drifted last time (background `#CFADD0` → `#C9A3CB`).

Any integer works. Keep a note of which one produced a good pair.

## Why the prompts are shaped this way

`p1-start.txt` / `p2-end.txt` are rewritten for Seedream, not ported from the
GPT-image versions in `PROMPTS.md`:

| GPT-image style | Seedream style | Why |
|---|---|---|
| `Edit the attached photograph. REMOVE: the hand…` | Declarative description of the **target** image | Seedream is not conversational; it renders what you describe, not a diff |
| `Negative: no gradient` | `completely flat matte lilac … uniform unshaded colour` | Seedream honours negatives less reliably. Critical constraints go in the **positive** prompt |
| Relies on attachment for identity | Same, but reinforced with an explicit preservation clause | `image_urls` is a reference, not a canvas |

The two prompts share their background, lighting and camera paragraphs
**word for word**. Do not paraphrase between them — divergent wording is what
produces exposure flicker across the interpolated frames (recipe rule 2).

## Costs

Uploads are free (files deleted after 3 days). A Seedream job ran 3.5 credits on
this account. Balance: `./kie.py credits`.

## Acceptance gate

`verify-frames.py` measures the three drifts that ruin a scrub:

| Metric | Tolerance | Why |
|---|---|---|
| Cup base drift | < 6px of 1254 | A cup that sinks reads as a jump cut on scroll reversal |
| Cup width delta | < 1% | A zoom reads as the camera lurching — recipe rule 1 |
| Background delta | < 3/255 | The lilac must butt seamlessly against the CSS section |

**Plus one manual check the script cannot do:** open both frames at 100% and read
`The Usual — House Oat Latte`. Small text is where these models fail first, and a
mangled wordmark is fatal — nothing downstream fixes it.

## If the wordmark keeps failing

`p2-end.txt` already keeps the splash clear of the cup face. If it still degrades,
the fallback is the Hungry Tiger route: a 3D cup with `wordmark.png` as a UV
texture, rendered to a frame sequence. That is the only method with a guarantee,
because the label is projected geometry rather than a drawn image.
