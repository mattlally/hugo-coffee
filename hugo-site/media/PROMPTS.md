# Hero asset — generation prompts

**Upload `assets/photography/iced-orange.png` with every one of these prompts.**
This is an *edit* pass, not a generation. Editing the real photo is the strongest
substitute for seed reuse when the tool has no seed field (recipe rule 4).

**The logo is the pass/fail test.** Zoom to 100% on the cup face before judging
anything else. The lockup reads: a lilac cow with a black tail and ear, `HUGO` in
chunky bubble caps with a period, and beneath it `The Usual — House Oat Latte`.
If any letterform is soft, doubled, or misspelled — reject it. Nothing downstream
fixes a wrong logo.

---

## PROMPT 1 — START FRAME (the still cup)

```
Edit the attached photograph. Keep the cup itself completely unchanged.

REMOVE: the hand holding the cup, all fingers and the rings, the terrazzo
countertop, and the entire dark cafe background. Remove them cleanly, including
any shadow they cast on the cup.

REPLACE the background with a completely flat, seamless, matte solid colour
field of #D0B9D3 (a soft muted lilac). No gradient, no vignette, no texture,
no floor line, no horizon, no surface, no reflection, no cast shadow. The cup
floats against flat colour.

PRESERVE EXACTLY, do not redraw or restyle:
- The printed artwork on the cup: the lilac cow with its black tail and ear,
  the chunky bubble-lettering wordmark "HUGO" with its full stop, and the small
  line of text beneath it reading "The Usual — House Oat Latte". Every letterform,
  its spelling, spacing, weight and position must be pixel-identical to the
  original. Do not re-letter, re-typeset, straighten or clean up this artwork.
- The clear plastic cup, its rim, its moulded ridges and its slight taper.
- The layered oat latte inside: dark coffee at the base rising to warm caramel,
  with the pale foam cap and the dusting of cinnamon on top.
- The original lighting on the cup: warm, directional, coming from the upper
  right, with the existing soft highlight down the left edge of the plastic.

COMPOSITION: the cup centred, upright, vertical, occupying the central 55% of
the frame with at least 20% empty lilac margin on every side. Locked-off camera,
straight-on eye-level product view, 85mm lens, f/5.6.

The liquid is perfectly still. No ice cubes above the cup. No motion, no splash,
no droplets.

Negative: no hand, no fingers, no people, no countertop, no background objects,
no text other than the existing cup artwork, no watermark, no new logo, no
redrawn lettering, no lens flare, no motion blur, no drop shadow, no gradient
background, no reflection.

Square 1:1, 2048x2048.
```

---

## PROMPT 2 — END FRAME (mid-splash)

**Upload the APPROVED output of prompt 1**, not the original photo. Everything
below is copied from prompt 1 character-for-character except the state clause.
Do not paraphrase the lighting or the background — paraphrasing is what causes
flicker across the interpolated frames.

```
Edit the attached image. Keep the cup, its printed artwork, the camera, the
lighting and the background completely identical to the attached image.

CHANGE ONLY THIS: three clear ice cubes have just dropped into the cup and the
oat latte is erupting. A vivid crown of coffee and milk bursts upward and
outward from the cup mouth, arcing well above the rim, with distinct airborne
droplets and long liquid tendrils frozen sharply in mid-air. The splash is
dramatic and reaches beyond the width of the cup on both sides. The liquid
surface inside is churning.

The cup itself has NOT moved, rotated, shifted or tilted by even one pixel. It
sits in exactly the same position in the frame.

PRESERVE EXACTLY, do not redraw or restyle:
- The printed artwork on the cup: the lilac cow with its black tail and ear,
  the chunky bubble-lettering wordmark "HUGO" with its full stop, and the small
  line of text beneath it reading "The Usual — House Oat Latte". Every letterform,
  its spelling, spacing, weight and position must be pixel-identical. No splash
  or droplet obscures the wordmark.
- The flat seamless #D0B9D3 lilac background, unchanged, with no gradient and
  no shadow.
- The original lighting: warm, directional, from the upper right, consistent
  exposure, identical highlight position on the plastic.

COMPOSITION: identical framing to the attached image. The cup centred, occupying
the central 55% of the frame. Locked-off camera, 85mm lens, f/5.6. The splash
must stay inside the frame with margin to spare.

Negative: no hand, no fingers, no people, no countertop, no camera movement, no
zoom, no text other than the existing cup artwork, no watermark, no redrawn
lettering, no lens flare, no motion blur, no drop shadow, no background change,
no lighting change, no exposure change.

Square 1:1, 2048x2048.
```

---

## PROMPT 3 — VIDEO (only if 1 and 2 both pass)

Feed `start.png` as first frame and `end.png` as last frame into Kling 2.x
"start & end frame", Runway Gen-3/4 "last frame", or Luma "keyframes". The video
model interpolates — it does not direct. Describe only the delta, then forbid
everything else from changing.

```
Three clear ice cubes fall into the cup and the oat latte erupts upward in a
dramatic splash, milk and coffee arcing above the rim with airborne droplets.
The cup does not move, rotate, shift or tilt at any point. The printed artwork
on the cup stays sharp, fixed and completely unchanged throughout.
Locked-off tripod camera, absolutely static framing, no pan, no tilt, no zoom,
no dolly. The flat lilac background never changes. Lighting is constant
throughout with no change in exposure or highlight position. Single continuous
shot, no cuts.
Duration 5 seconds.
```

**Output contract — check the download against this before spending time on it:**

| Property | Required |
|---|---|
| Duration | 4–6 s |
| Frame rate | 24 or 30 fps |
| Resolution | 1440×1440 (square) |
| Alpha | none — the lilac is baked in |
| Audio | none |
| Motion arc | single, monotonic — ice falls, liquid erupts. Nothing else |
| **The cup does not translate** | check frame 1 against the last frame |
| **The wordmark is legible and correct in every frame** | scrub manually before encoding |

---

## What to reject

Reject and regenerate on any of these — they get worse, not better, downstream:

1. **The wordmark is redrawn.** Any change to the letterforms, spacing or the
   period. This is the whole reason for the test.
2. **"The Usual — House Oat Latte" is misspelled or mushy.** Small text is where
   models fail first. It is also the easiest thing to miss.
3. **The cow's shape changed** — ear, tail or body silhouette.
4. **The cup drifted** between start and end frame. Flip between them; the rim
   should not move.
5. **The lilac shifted** in hue or picked up a gradient between the two frames.
6. **A drop shadow appeared** under the cup. There is no ground plane.

## If the wordmark fails

It usually will on a splash frame — the erupting liquid gives the model an excuse
to re-render the cup face. Two fallbacks, in order:

1. **Keep the splash clear of the cup face.** Add to prompt 2: `the splash rises
   from the rim only and no liquid crosses the front face of the cup below the
   rim.` Protects the artwork by keeping it out of the churn.
2. **Go to the 3D route.** Hungry Tiger's jar holds its label across all 342
   frames because the label is a UV texture on geometry, not a drawn image. That
   is the only method with a guarantee.
