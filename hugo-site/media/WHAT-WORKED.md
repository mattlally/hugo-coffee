# What worked — Seedream prompting, learned the hard way

Nine generations. The two that worked are `A_start.png` and `B_end2.png`,
from `p1-start.txt` and `p2-end.txt`.

## The three rules that actually mattered

**1. Name every attribute you need preserved, especially the obvious ones.**
The single worst failure was the drink turning into clear iced tea. The prompt
said "keep the drink the same rich golden amber colour" — not enough. What fixed
it was naming the physical property:

> The drink is an OPAQUE CREAMY OAT MILK LATTE, rich golden amber and completely
> opaque like milky coffee, with its thick white foam cap. It is not clear, not
> transparent, not iced tea, not translucent. The splashing liquid is the same
> opaque creamy golden latte colour, milky and thick, not see-through.

"Splash" pulls hard toward clear-liquid imagery in training data. Anything the
prompt doesn't pin down gets replaced by the most common version of itself.

**2. One conceptual change per generation — or name the second one just as hard.**
Asking for camera move + splash in one pass produced a re-render of everything.
The successful end frame asked for both too, but spent four sentences defending
the drink. Either constrain hard or split the request.

**3. Don't chain edits.** Each pass re-renders the cup and degrades it:

| | liquid | sub-line |
|---|---|---|
| `start_raw` (ChatGPT) | `(253,189,73)` | correct |
| after 3 chained edits (`v5`) | `(254,218,112)` washed | `The Useal — House Oat Laffe` |

`A_start` is **one** pass from `start_raw`, and its lettering is intact. Always
regenerate from the cleanest source, never from the last output.

## What did NOT matter

- **`seed`** — on an *edit* model the reference image does the work the seed does
  in text-to-image. Set it for reproducibility, but it will not hold a background
  steady. Overstated earlier in this project.
- **Long scene descriptions** — 1828 chars produced the worst result (studio
  gradient, cast shadow, soft lettering). 437 chars produced the best background.
  Describe the delta, defend the constants, stop.
- **Negative lists** — Seedream honours a positive statement (`opaque, milky,
  not see-through`) far better than a trailing `no X, no Y`.

## The final pair

| | A_start | B_end2 |
|---|---|---|
| Background distance from `#D0B9D3` | 18.8 | 29.0 |
| Background spread | 2/255 | 11/255 |
| Cup width | 27.3% | 36.4% |
| Liquid | `(252,182,67)` | `(248,195,116)` |
| Logo | intact, sub-line legible | intact, sub-line legible |

**Camera push-in: +33%.** Monotonic, forward only — what the scrub needs.

## Next

1. Feed both frames to a video model as first/last frame. Prompt describes only
   the delta: ice falls, splash erupts, camera pushes in, nothing else changes.
2. `ffmpeg -g 1` so every frame is a keyframe and seeking is frame-accurate.
3. Wordmark rides above in the DOM and slides right on scroll — real artwork,
   never generated.
