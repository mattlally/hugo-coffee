# Handoff — the build

**Read `../HANDOFF.md` first** for project status and what's next. This file is
the build's own detail: what exists, the rules it follows, and how to verify it.

Build: the **hugo.coffee** home page, using the `/site-build` skill.

## Status: drafted and verified, hero video live

All 10 brief slots are resolved. The page is built and passes every verify pass.
The hero runs the **real clip**, scroll-scrubbed — `media/hero.mp4` +
`hero.webm`, no audio, every frame a keyframe. FROZEN CLIP is exercised and
passing for the first time.

## The files

| Path | What |
|---|---|
| `index.html` | The page. Nine sections + nav + footer |
| `css/site.css` | Layout and components. Every value resolves to a DS token |
| `js/site.js` | 4 behaviours: hero scrub, reveal, marquee, nav state |
| `vendor/tokens/` | The client design system, **byte-identical**. Never edit |
| `brand/tokens.css` | This build's layer: fallbacks, curves, themes, runway |
| `brand/BRAND.md` | Voice, colour deployment, 14 flagged assumptions |
| `BRIEF.md` | All 10 slots, with what verify found |
| `media/STATUS.md` | Hero asset state and the encode recipe |
| `media/WHAT-WORKED.md` | Image-prompting rules, learned the hard way |

## Read in this order

1. `../HANDOFF.md` — what's next
2. `BRIEF.md` — the resolved brief, and the three things verify caught
3. `brand/BRAND.md` — voice, the contrast trap, the assumptions table
4. `media/STATUS.md` — only if touching the hero

## How to verify

Never judge a scroll page by looking at one screenshot. Serve over HTTP with
real Chrome — `file://` blocks the video fetch and bundled Chromium has no h264
decoder, and both make a broken page report clean.

```bash
cd ~/Documents/coding-projects/websites/sites/_library/verify
node serve.mjs --root <this dir> --port 4500 &
node walk.mjs --url http://localhost:4500
node walk.mjs --url http://localhost:4500 --width 390 --height 844
node walk.mjs --url http://localhost:4500 --reduced-motion
```

All three must stay at **0 failures**. The reduced-motion pass is not optional —
it is the one that caught the hero runway sitting dead with the scrub disabled.

`serve.mjs` implements range requests as of this build. It previously advertised
`Accept-Ranges` without honouring them, which makes Chrome abort a media fetch
and reports a working scrubbed video as a frozen clip. If you ever see
`ERR_ABORTED` on a video, check that first.

**A green run is a floor, not a verdict.** It cannot see composition. Open the
frames it writes.

## Hard rules for this project

- **Never redefine the design system's tokens.** It is already semantic. Layer
  only. Check with `diff -q` against `../Hugo coffee design system/tokens/`.
- **Never re-set "HUGO" in a typeface.** The wordmark is artwork —
  `assets/wordmark.png`. Same for the mood cows: never traced or approximated.
- **Never scale a mood cow past 160px.** They are ~220px PNGs.
- **Headlines CAPS, supporting lines lowercase.** Hugo's casing rule overrides
  COPY.md §3.4. Mixed case only in italic serif taglines carrying a full stop.
- **No emoji. No exclamation marks. No icon library.**
- **Long copy never sits on lilac** — plum-on-lilac is ≈3.9:1 and fails AA. Use
  `.t-lilac`, which forces plum-900. Measured at 8.37:1 on the built page.
- **Two background colours per page beyond white.** This page uses lilac + cream;
  plum appears once, as the footer.
- **One reveal style everywhere** (PRINCIPLES §15). Invention belongs to the hero.
- **`--ease-bounce` is for cow moments only.** Never a nav item. It appears
  exactly once, on the stamp fill.
- **No build step, no framework, no GSAP.** Static HTML/CSS + one rAF callback.

## Traps specific to this build

- **The hero seam is solved IN THE FILE.** `hero.mp4` is pre-padded to
  2240x960 with a flat hex (`0xBD8DB9`, tuned by experiment). Do not "simplify"
  this back to a square clip plus a CSS background: Chrome colour-manages
  `<video>` but not CSS backgrounds or PNGs, the gap depends on the viewer's
  display, and it shows as a large darker RECTANGLE around the cup that **a
  headless screenshot will not reproduce**. Check it on a real display.
  `media/STATUS.md` trap 1 lists five approaches that failed — including
  stretching the frame's edge columns, which streaks and bleeds brown.
- **The ice fall uses a different interpolation config** (`obmc`+`tdls`+
  `mb_size=4`); the default estimator smears the cubes into ghosts. The encode
  splits at 0.9583s.
- **The ice fall must not be the ramp's slow beat.** Holding it stutters,
  because small hard-edged cubes show a repeated frame that motion blur would
  hide. The dwell lives on the settle instead.
- **The hero lockup position derives from `--frame-h`, which mirrors the
  frame's own `clamp(78vh, 62vw, 112vh)`.** They are one value written twice.
  Change both together or the tagline lands in the coffee at some ratios and
  not others — the old fixed `margin-bottom` was correct only at 1440x900.
- **The hero speed ramp and `--runway-h` are tuned together.** The clip's beats
  are very unevenly distributed; the ramp in `js/site.js` compensates. Changing
  either alone will either bury the spin or reintroduce dead scroll. Read the
  comment above `ramp()` first.
- **The poster must be the clip's own frame 0** (`media/hero-poster.png`).
  `HERO_A.png` is a different drink and made the hero pop on decode.
- **Hero geometry is measured, not guessed** — the cup occupies y 41.4%→95.0% of
  the square frame. If you resize the hero, re-measure rather than eyeballing.
- **Portrait photography (1536×2752) must stay height-bounded.** Unbounded it
  renders ~1500px tall and produces dead scroll.
- **The badge seal is pale-lilac ink** and vanishes on a lilac ground. It lives
  on the Meet Hugo photograph for that reason.
