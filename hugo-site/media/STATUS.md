# Hero asset — status

## Done ✅ — the hero is live

| File | What it is |
|---|---|
| `hero.mp4` | **The clip.** **2240×960**, 60fps, 294 frames, 4.9s, h264, 8.1MB. No audio. Every frame a keyframe. Tagged BT.709. Ghost cups masked out — trap 3. |
| `hero.webm` | Same clip, VP9 crf 40, 6.2MB. Fallback source. Same masks. |
| `hero-poster.png` | **The poster.** Frame 0, 2240×960, colour-lifted AND highlight-rolled so the lift does not clip the cup — see trap 2. |
| `hero-video.mp4` | The delivered master. 960×960, **24fps**, with an audio track. Keep — every encode derives from it. |
| `HERO_A.png` | Source start frame, 1254×1254. **No longer the poster** — see below. |
| `HERO_B.png` | Source end frame, 1254×1254. |

The `<video>` is wired into `index.html` §1 and scrubbed by `js/site.js`. All
three verify passes are clean, FROZEN CLIP included.

## The encode

```bash
# Two DIFFERENT interpolation configs, split at the moment the ice lands.
ICE='minterpolate=fps=60:mi_mode=mci:mc_mode=obmc:me_mode=bidir:me=tdls:mb_size=4:search_param=64'
REST='minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmc=1:me_mode=bidir:me=epzs'

ffmpeg -i hero-video.mp4 -filter_complex "\
[0:v]trim=start=0:end=0.9583,setpts=PTS-STARTPTS,$ICE[a];\
[0:v]trim=start=0.9583,setpts=PTS-STARTPTS,$REST[b];\
[a][b]concat=n=2:v=1:a=0,pad=2240:960:(ow-iw)/2:0:0xBD8DB9[out]" -map "[out]" \
  -c:v libx264 -crf 20 -g 1 -keyint_min 1 -sc_threshold 0 -pix_fmt yuv420p \
  -x264opts "colorprim=bt709:transfer=bt709:colormatrix=bt709" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -movflags +faststart -an hero.mp4

# ...same filtergraph for the webm, with -c:v libvpx-vp9 -crf 40 -b:v 0

# GHOST MASKS (trap 3). The shipped clip adds a per-pixel mask pass on top of
# the graph above. Generate the PGM sequence, then use ghost-filtergraph.txt,
# which is the same graph with the mask alphamerged+overlaid after the pad:
#   python3 ghost-genmask.py                    # writes masks + seq/
#   ffmpeg -i hero-video.mp4 -framerate 60 -i seq/s_%04d.pgm \
#     -filter_complex_script ghost-filtergraph.txt -map "[out]" <same codec args>

# Poster = frame 0 with the inverse of Chrome's video gamma applied.
# See "THE ROOT CAUSE" below. Constants in poster-gamma.txt.
ffmpeg -i hero.mp4 -vf "select=eq(n\,0)" -vsync 0 -frames:v 1 f0.png
ffmpeg -i f0.png -vf "lutrgb=r='255*pow(val/255,0.8314)':g='255*pow(val/255,0.8064)':b='255*pow(val/255,0.8056)'" hero-poster.png
```

Note the variables must be written INTO the filtergraph string, not passed as
shell vars in a `-vf` — ffmpeg will not expand them and fails with
`No such filter: ''`.

Every part is load-bearing:

- **`-g 1`** — every frame a keyframe. The master has 2 keyframes in 121 frames,
  so each `currentTime` write forced a decode of up to 60 P-frames and the
  scrub lurched. Biggest single smoothness lever; it is why the file is 8.2MB.
- **`-an`** — the master has an audio track. Strip it.
- **Two interpolation configs** — see the next section.
- **`pad=...:0xBD8DB9`** — see trap 1. That exact hex, not the ground colour.
- **No `scale`.** The master is 960x960; scaling up gains nothing.

## The ice fall needs a DIFFERENT interpolation config

The default `mci` config (`aobmc` + `vsbmc` + `epzs`) is right for the splash
and the tumble and wrong for the falling ice. The cubes are small, hard-edged,
fast and isolated against flat lilac; that estimator smears each one into a
translucent ghost with torn edges. It is very visible and it stops exactly when
the splash takes over, because the splash is large and soft.

Configs tried on the ice, in order:

| config | result |
|---|---|
| `aobmc`+`vsbmc`+`epzs` (the default) | cubes smeared into ghosts |
| `mi_mode=blend` | worse — every cube double-exposed |
| plain frame duplication (`fps=60`) | crisp, but only 24 real images/sec — still choppy |
| `obmc`+`umh`+`mb_size=8` | good, slight softening on the fastest cube |
| **`obmc`+`tdls`+`mb_size=4`+`search_param=64`** | **crisp at every cube** ← use this |

The smaller macroblock (4 vs the default 16) is what lets the estimator lock
onto an object the size of an ice cube instead of averaging it with the
background around it.

Frame duplication was tried and rejected: it keeps the cubes crisp but only
delivers 24 distinct images per second, which measured **69% repeated paints**
across the ice fall — the exact stutter it was supposed to fix.

The split is at **0.9583s** (source frame 23, just before first contact). If you
re-cut the clip, re-find it: it is the frame before the ice touches the surface.

## Trap 3: the AI render's GHOST CUPS (fixed in the file)

The delivered master contains TWO stray cup renders during the close-up —
one entering from the TOP-LEFT and one from the BOTTOM-LEFT, plus a band that
wraps the TOP-RIGHT. **They are in the source master**, not caused by the pad,
the interpolation or the encode. Confirm on the raw file before blaming an
encode setting:

    ffmpeg -i hero-video.mp4 -vf "select='gte(n\,49)*lt(n\,55)',tile=3x2" -vsync 0 -frames:v 1 /tmp/src.png

### The geometry, which is why the obvious fixes all fail

Map the square region (x 640-1600) at shipped f118 and it is almost entirely
content: the cup fills the middle AND the ghosts fill the rest. The ghosts are
**not in corners** — they are bands above and below the cup, separated from it
only by narrow diagonal strips of lilac. So:

- a corner box does not reach them,
- a bigger corner box lands on the coffee,
- connectivity treats cup+ghost as one mass when they touch.

### The fix: per-column and per-row RUN detection, then validation

`ghost-detect.py` scans every 4th column top-to-bottom and every 4th row
left-to-right. In each scanline it finds the runs of content; the LONGEST run is
the real cup, every other run >=8px is a ghost, emitted as a 4px-wide box.
Two axes are needed: the vertical scan catches the top and bottom ghosts, the
horizontal scan catches the top-right band that merges vertically with the cup.

`ghost-validate.py` then REJECTS any box that is
  - "sandwiched" (strong content >90 dev on both sides) -> it is a slice
    through the middle of the cup, not a ghost, or
  - covering strong content (mean dev >=170) -> it is the cup itself.

This is the step that matters. Without it the run test misfires on frames where
the wide shot is dissolving into the close-up and cuts visible lilac LINES
across the coffee. It drops f118 from 136 boxes to 31, f121 from 180 to 33.

**Frame 116 is excluded entirely.** It is the blend frame — 41.8% of it is
faint half-transparent overlap, so no run test is meaningful there. Masking it
produces visible rectangular blocks. One frame at 60fps is 16ms; leave it.

Result: 1156 boxes across 25 frames. Frames 0-109 are **byte-identical** to the
unmasked encode (verified), so the ice fall and splash are untouched.

### Approaches that FAILED — do not repeat

| approach | why |
|---|---|
| Zoom / push-in (1.20) | Scales ghosts and cup equally; relative position never changes. |
| Cropping | Content runs edge-to-edge; any useful crop cuts the cup asymmetrically during the fastest beat. |
| One corner rectangle per ghost | The ghosts are not in corners. Lands on the coffee. |
| Stepped corner boxes (4px bands) | Only captures ghost material that TOUCHES the corner — measured 96px wide where the ghost is ~600px. Looked plausible, changed almost nothing. |
| Downsampled per-pixel mask | Stair-stepped notches on the cup edge. |
| Connectivity + erosion/dilation | Erosion leaves the ghost; dilation eats the cup. |
| Splitting interpolation at the shot cut (src f49, t=2.0417s) | Removes minterpolate's own phantom cups — real improvement, worth keeping if re-encoding — but changes frame count to 290 and does not remove the source ghosts. |

### The fill hex is NOT the pad hex

Pad is `0xBD8DB9`; boxes use **`0xBC8BB8`**, tuned against a PAGE SCREENSHOT
(the file-exact match `0xB885B6` is wrong on screen). Within +/-3/255 of the
surrounding lilac as shipped.

## Frame rate: the clip ships at 60fps

**The delivered master is 24fps. The shipped clip is 60fps.** Measured as
"repeated paints" — how often a rAF tick shows the same image as the one before,
over a real wheel scroll:

    24fps, whole clip                    80% repeated
    60fps, whole clip                    50% repeated
    60fps, ice fall only, slow ramp      69% repeated   <- still stuttered
    60fps, ice fall only, retuned ramp   49% repeated   <- fixed

A scrub holds one decoded frame until you seek to another, and the display
refreshes 60-120x/sec. At 24fps every frame was held across 4-5 refreshes, which
is what reads as choppy. The largest single-step jump at 24fps was 1 frame —
nothing was being skipped and no seek was failing. There simply were not enough
images.

Note the third row: **the encode alone was not enough.** The scroll ramp was
holding the ice fall at 2.8 frames per 100px, so the reader was dwelling on a
passage where a repeated frame is most visible. See the ramp comment in
`js/site.js`. The two have to be tuned together.

**Cost:** 3.6MB -> 8.2MB. Correct trade for the signature moment of the page.

**If the clip is ever regenerated, ask for 48-60fps AT SOURCE.** True frames beat
interpolated ones and would make both interpolation configs unnecessary.

## Three traps this clip set, all now closed

### 1. The clip is PRE-PADDED to 2240x960 with a FLAT colour

The source is 960x960. Sized from viewport height it left bare stage either
side — 328px of it at 1728x962 — and something has to paint that band.

**A CSS colour cannot do it.** Chrome colour-manages a `<video>` and does NOT
colour-manage a CSS background or a PNG poster, and the gap depends on the
viewer's display profile. On a P3 laptop it reads as a large darker RECTANGLE
around the cup, and it changes the instant the clip decodes because the poster
and the video land on different values. **A headless screenshot does not
reproduce any of this** — it must be checked on a real display.

Approaches tried and rejected:

1. Match the CSS colour to `ffprobe`'s decode — measures the file, not the screen.
2. Match it to a `<canvas>` read — canvas bypasses the same colour management.
3. Match it to a page screenshot — closer, but the poster and the video need
   different values, so one of the two is always wrong.
4. A second blurred `<video>` behind the frame painting the bands — same
   pipeline but different pixels through a filter, so it still left an edge;
   it also turned brown during the tumble when it followed the clip.
5. **Stretching the frame's own 2px edge columns outward** — actively bad. A
   2px column stretched to 640px smears whatever is in it: flat lilac becomes
   horizontal STREAKS (the column varies 1-2/255 row to row), a single stray
   bright pixel becomes a full-width WHITE LINE, and during the tumble the
   column contains coffee, so the bands BLEED BROWN. Do not do this.

**What works: a flat `pad` in the file, with the hex tuned by experiment.**
Padding with the ground colour measured off a raw decode (`0xBC8DB7`) is 2/255
off after encoding, because chroma subsampling shifts it — that leaves a faint
step exactly at the pad boundary. Encode a one-frame test, measure both sides,
and adjust until they match:

    pad 0xBC8DB7 -> encodes to bc8db6, image side bd8db9   (2/255 step)
    pad 0xBD8DB9 -> encodes to bd8db9, image side bd8db9   (exact)

`0xBD8DB9` is correct for THIS master. Re-derive it if the clip is re-rendered.
Verified steady at every frame: the pad reads identically at f0, f40, f80, f140,
f200 and f290, so there are no streaks, no line, and no bleed.

The CSS `--hero-ground` colour still exists as a fallback for the moment before
decode and for reduced motion. It no longer has to be perfect, but keep it close
or the first paint flashes.

### 2. The poster has to be the clip's own frame 0, colour-lifted

`HERO_A.png` was the poster while the hero ran a still. It is a different drink
from the clip — an opaque orange latte, where the clip opens on a layered iced
one. Same cup, same logo, same composition, but the hero **popped visibly** the
moment the video decoded.

`hero-poster.png` is extracted from the encode, so there is nothing to pop.

**THE ROOT CAUSE, measured (2026-08-23).** Earlier notes here guessed at this
and fitted correction curves to samples. Do not do that; the transform is a
single measurable constant. Method:

Render a 0-255 RGB ramp as BOTH a PNG and a one-frame h264 (same tagging as
`hero.mp4`), put them side by side in a page, screenshot in Chrome, and read
the transfer:

    input   PNG out   VIDEO out
      64      64        73
     128     128       139
     192     192       199

**The PNG passes through EXACTLY. The video does not.** Chrome applies a
transfer-function conversion to `<video>` that it does not apply to an `<img>`,
lifting midtones by up to ~11/255, pinned at 0 and 255. Fitted: the video is
the poster raised to **gamma 0.8795** (mean err <2/255 over the whole ramp).

Note what this is NOT, all tested and ruled out:
- NOT the PNG's `gAMA`/`cHRM` chunks. Stripping them changes nothing.
- NOT a limited/full range (16-235 vs 0-255) expansion — that predicts the
  ground's red and blue but misses green by 14/255.
- NOT a BT.601/BT.709 matrix mismatch — neither direction lands on the
  measured value.

### The fix

Apply the inverse gamma to the poster. Per-channel, refined by fitting the
residual on ~185k FLAT page pixels (skip edges — they average across the cow
logo and give nonsense):

    lutrgb r=0.8314  g=0.8064  b=0.8056        (poster-gamma.txt)

    ffmpeg -i hero.mp4 -vf "select=eq(n\,0)" -vsync 0 -frames:v 1 f0.png
    ffmpeg -i f0.png -vf "lutrgb=r='255*pow(val/255,0.8314)':\
      g='255*pow(val/255,0.8064)':b='255*pow(val/255,0.8056)'" hero-poster.png

Measured on the built page, mean over flat pixels, delta (video - poster):

    raw frame 0, untouched      (+10.8, +16.2, +12.0)   <- the visible jump
    old colorlevels multiply    ( -0.7,  -3.3,  +6.9)   also 25,520 clipped px
    per-channel gamma           ( +0.49, -1.24, -1.35)  <- shipped

Ground now reads poster (194,152,192) vs video (195,151,191); cup (243,185,108)
vs (244,186,105). Re-derive with the ramp method if the clip is re-encoded.

## The scroll mapping

**The speed ramp is not baked into the clip and must not be.** It lives in
`js/site.js` so it stays tunable without a re-render and the scrub stays linear
in time. The comment above `ramp()` carries the full rationale; in short:

(Frame numbers below are the SOURCE's 24fps numbering; the shipped clip is
60fps, so multiply by 2.5.)

| scroll | frames | rate | beat |
|---|---|---|---|
| 0.000–0.105 | f0→f14 | 5.3 /100px | the ice falls |
| 0.105–0.175 | f14→f22 | 4.6 /100px | the splash crown |
| 0.175–0.520 | f22→f46 | 2.8 /100px | the settle — the slow beat |
| 0.520–0.615 | f46→f58 | **5.1 /100px** | the whip — fastest pinned beat |
| 0.615–1.000 | f58→f120 | 6.4 /100px | tail wag, across the exit |

**The ice fall must not be the slow beat.** It was, originally, at 2.8 — chosen
so the reader could dwell on it. But dwelling on a scrub means holding each
frame across more refreshes, and the ice is the one passage where that reads as
stutter: small hard-edged cubes against flat lilac, with no motion blur to hide
a repeat. It measured 69% repeated paints against 50% for the clip overall.
The dwell moved to the settle (f22–f46), which is soft and low-contrast and
holds up fine at 2.8. The ice now runs at 5.3 and measures 49%.

Two rules it obeys, both learned the hard way:

1. **The spin must finish before the stage unsticks** (p=0.615 at 260vh).
   Anything after that plays while the stage is travelling off screen. A tail
   wag reads fine sliding away; a tumble does not.
2. **No segment may park the playhead.** The harness fails a clip whose
   `currentTime` repeats across 3 consecutive samples.

**Mobile uses the same 260vh ratio, not a smaller one.** The handover point is
`(runway - 100vh) / runway`, so the ratio is what has to match, not the pixel
count. At 200vh mobile unstuck at p=0.50 while the spin ran at p=0.55–0.615 —
the tumble played as the hero slid away. A shorter viewport already makes 260vh
fewer pixels.

`ramp()` and `--runway-h` are tuned **together**. Changing one without the other
breaks both rules.

## Later: the 3D version

The user wants a second pass via the Blender/UV-texture route
(`_library/recipes/baked-image-sequence.md`), where the label is projected
geometry and cannot degrade. Separate piece of work.

## Do not repeat these mistakes

See `WHAT-WORKED.md`. In short: name every attribute you need preserved (the
drink silently became iced tea when unspecified), never chain edits (three passes
corrupted the sub-line to `The Useal — House Oat Laffe`), and describe the delta
rather than the whole scene.
