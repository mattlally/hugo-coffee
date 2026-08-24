# Revision 1 — fixing composition drift

## Measured problems in the first pair

Measured from `start_raw.png` / `end_raw.png` (both 1254×1254), by sampling the
background lilac from a corner patch and thresholding everything more than 45
units of RGB distance away from it.

| Metric | START | END | Delta | Verdict |
|---|---|---|---|---|
| Cup base row | 1074px | 1122px | **+48px (+3.8%)** | ❌ cup sank |
| Cup max width | 462px | 513px | **+51px (+11.0%)** | ❌ **camera zoomed in** |
| Background lilac | `#CFADD0` | `#C9A3CB` | **10/255** | ❌ background darkened |
| Content top | 183px | 0px | splash used all headroom | — the cause |

**Root cause, all three:** the model needed vertical room for the splash and had
none, so it recomposed — pulling the camera in and dropping the cup to fit.

**Why the zoom is the serious one.** Recipe rule 1 (locked camera) exists because
a camera that moves during a scrub reads as a jump cut on scroll reversal — the
brain reads background motion as its own movement and then gets contradicted. An
11% scale change across the clip is exactly that failure.

**The background shift is reject criterion #5.** The lilac is meant to butt
seamlessly against a CSS `--hugo-lilac` section; a drifting background separates
from the page as the user scrolls.

## The fix: give the splash room in the START frame

Regenerate the start frame zoomed out, so the end frame has somewhere to put the
splash without moving the cup.

### Revised PROMPT 1 — reframe the approved still

Upload the **approved start frame** (the tall-cup version).

```
Edit the attached image. Keep the cup, its printed artwork, the lighting and the
background colour completely unchanged.

CHANGE ONLY THE FRAMING: zoom out so the cup is smaller within the frame. The cup
should occupy only the central 40% of the image width and sit LOW in the frame —
its base near the bottom, with a large area of empty lilac above the rim taking
up roughly the top 40% of the image. Leave generous empty space on the left and
right as well.

The cup is not modified in any way — same shape, same proportions, same printed
artwork, same liquid, same foam cap and cinnamon. Only the camera is further back.

The background stays a completely flat, seamless, matte #D0B9D3 lilac with no
gradient, no vignette, no shadow and no surface.

Negative: no change to the cup, no redrawn lettering, no crop of the cup, no
gradient background, no drop shadow, no change to the liquid colours, no change
to the lighting.

Square 1:1, 2048x2048.
```

### Revised PROMPT 2 — add the anti-recomposition clause

Use the original prompt 2, with this added to `PRESERVE EXACTLY`:

```
- The cup's exact size and position in the frame. Do not zoom in, scale up, or
  reposition the cup to make room for the splash — the empty space above the rim
  is already there for the splash to occupy. The cup's base stays at exactly the
  same height in the frame and the cup's width is unchanged.
- The exact background colour #D0B9D3. It must not darken, lighten or shift hue.
```

And extend the negative with:

```
no zoom, no scale change, no recomposition, no cropping in, no background colour
shift
```

## On "more spillage" — recommend against

Frame 2's splash is a good terminal state: full crown, tendrils, separated
droplets. Pushing further starts the liquid falling back, which is a **second
motion arc**. The output contract requires a single monotonic arc — ice falls,
liquid erupts, stop. A clip that continues into the fall-back would show the
splash *collapsing* as the user scrubs to the end, undercutting the payoff.

## Acceptance test for the new pair

Re-run the measurement before encoding:

```bash
# from hugo-site/media
python3 verify-frames.py start_raw.png end_raw.png
```

| Metric | Tolerance |
|---|---|
| Cup base drift | **< 6px** of 1254 |
| Cup width delta | **< 1%** |
| Background delta | **< 3 / 255** |
| Wordmark legible in both | manual, at 100% zoom |
