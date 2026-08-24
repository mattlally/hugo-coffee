# Revision 2 — the zoom changes the shot

## What changed in the brief

The end frame is no longer "the same composition plus splash". It is a **push-in**:
the camera moves toward the cup while the splash happens, with non-linear easing.

### Consequence 1 — the "cup must not move" rule no longer applies as written

That constraint exists to prevent *accidental* drift, because uncontrolled drift on
scroll-reverse reads as a jump cut. A **deliberate, monotonic push-in is different**
— it is Mercury's hero exactly (a product moving toward a fixed camera). What still
must not happen:

- the cup drifting **sideways** or tilting
- the background changing colour or gaining a gradient
- the push-in reversing or stalling mid-clip

The zoom must be **monotonic**: always inward, never out. A scrub maps position to
time, so any non-monotonic motion becomes unreadable under the user's thumb.

### Consequence 2 — the easing belongs in the PAGE, not the video

**Render the video with a linear push-in.** Apply the easing in the scroll handler.

Baking easing into the clip and then scrubbing it applies the page's scroll curve
*on top of* the baked curve — easing-on-easing, which feels mushy and cannot be
tuned without regenerating the asset.

```js
// linear video + eased mapping = tunable motion character, one asset
const eased = 1 - Math.pow(1 - p, 3);        // easeOutCubic on scroll progress
video.currentTime = eased * video.duration;
```

This is PRINCIPLES §10 — JS owns one number, CSS/curve owns the character.

### Consequence 3 — the zoom HELPS the logo problem

As the camera pushes in, the cup face occupies more pixels, so the model has more
resolution to render the lettering. If the push-in is strong enough, the sub-line
may leave the frame entirely by the end — removing the failure mode rather than
fighting it.

**Framing implication:** the start frame wants *generous* headroom, since the zoom
target sits inside it. v5's 34% above / 15% below is close to ideal.

## Why v5 is still a reject

Measured cumulative degradation across three edit passes:

| Sample | Original (ChatGPT) | v5 | Drift |
|---|---|---|---|
| Liquid, mid-cup | `rgb(253,189,73)` | `rgb(254,218,112)` | washed out, +39 green |
| Foam cap | `rgb(253,237,212)` | `rgb(250,206,137)` | lost its cream white |
| Background | `#D0B9D3` target | `#F6DBFC` | dist 65, too pale/pink |
| Sub-line | `The Usual — House Oat Latte` | `The Useal — House Oat Laffe` | **corrupted** |

**Each edit pass re-renders the whole cup.** Three passes compounded into a washed
out image with broken lettering. The composition is right; the pixels are not.

## The plan

**Regenerate the start frame in ONE pass from the original**, not by patching v5.
Chained edits are what caused the degradation — so collapse the chain.

One edit from `start_raw.png` (the good ChatGPT frame), asking for all three
changes at once:

1. reframe — cup smaller, whole cup visible, generous headroom
2. background — flat `#D0B9D3`, no table, no shadow
3. everything else — untouched

Then the splash/push-in frame is generated **from that**, one pass, keeping the
chain at depth 2 rather than 4.

If the lettering still degrades, repair it mechanically by compositing the wordmark
region from `start_raw.png`, which is untouched artwork.

## Then: the 3D version

Planned as a separate build. The label as a UV texture cannot degrade at all, which
removes this whole class of problem. See `KIE-API.md` and the recipes ladder tier 4.
