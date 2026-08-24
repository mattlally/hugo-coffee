# Hero — locked spec

## The signature moment, in one sentence

The wordmark slides away and the ice drops, and the coffee erupts as the camera
pushes in.

## Beats

| Scroll | What happens | Layer |
|---|---|---|
| 0% | Wide. Cup small and low. Wordmark large in the negative space above it. | DOM + video frame 0 |
| 0–20% | Wordmark slides **right, off screen**. Cup untouched. | DOM, `--progress` |
| 20–45% | Ice falls into frame from above. Camera begins pushing in. | video scrub |
| 45–100% | Ice hits. Splash erupts. Camera closest. **Ends on peak splash.** | video scrub |

Then the user scrolls on into the page. No fall-back, no resolve — the splash
holds at its peak as the section leaves.

## Rules this build follows

**One motion arc, monotonic.** Ice falls, liquid erupts, camera pushes in — all
one direction, all at once. Never reverses inside the clip. A scrub maps position
to time, so non-monotonic motion is unreadable under the user's thumb.

**The zoom is linear in the video; the easing lives in the page.** Baking easing
into the clip and then scrubbing it stacks two curves and feels mushy. The page
applies the curve, so motion character is tunable in CSS with no regeneration.

```js
const eased = 1 - Math.pow(1 - p, 3);     // easeOutCubic, tune freely
video.currentTime = eased * video.duration;
```

**The wordmark is DOM, never generated.** `assets/wordmark.png` is real artwork
in an `<img>`, moved by CSS transform. It cannot degrade, cannot be misspelled,
and needs no model to render it. This is the Hungry Tiger principle (label as
texture, not as drawn image) applied at zero cost.

**The cup starts from `start_raw.png`.** One generation deep, best liquid colour
`rgb(253,189,73)`, crispest lettering. Every later version degraded it.

**The push-in helps the lettering.** As the camera closes, the cup face gains
pixels; by peak splash the sub-line may be out of frame entirely. The failure
mode removes itself.

## Asset contract

| Property | Value |
|---|---|
| Duration | 5s |
| Frame rate | 24 or 30fps |
| Resolution | 1440×1440 square (crop to taste per breakpoint) |
| Alpha | none — lilac baked in |
| Audio | none |
| Start frame | cup small + low, generous headroom, flat `#D0B9D3`, no ice |
| End frame | peak splash, camera close, cup fills more of frame |
| Motion | ice falls → impact → splash, camera pushes in linearly throughout |
| Camera | pushes in only. No pan, no tilt, no roll, never pulls back |

## Where the wordmark sits

Start: centred in the upper negative space, above the cup.
End: off the right edge, gone by ~20% scroll.

Its travel is DOM-side, so the video's headroom just needs to be **empty** — the
wordmark is composited live by the browser, not rendered into the clip.
