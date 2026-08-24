# BRIEF — hugo.coffee

Filled per `_library/brand/BRIEF.schema.md`. Slots 1–5 resolved with the user.
Slots 6–9 are **open** — that is where a new session picks up.

## 1. brand ✅
```yaml
tokens: brand/tokens.css          # layers over the client design system
doc:    brand/BRAND.md
arrival_path: full-guide          # 186-file hand-authored design system
assumptions_flagged: true         # 9 rows in BRAND.md §5
```
Source of truth for colour/type/spacing stays `../Hugo coffee design system/`.
It is already semantic (§13-compliant). Do not duplicate or redefine it.

## 2. dialect ✅ — **D/B hybrid**
Static HTML + CSS, no build step, no framework. A small `rAF` scroll callback
writes `--progress`; CSS does the rest (the Air/Cosmos approach without React).
**Chosen because** the user maintains it and the design system is already plain CSS.
Do not introduce GSAP, React or a bundler.

## 3. skeleton ✅ — **narrative hero on a modular body**
The legitimate hybrid (Cosmos's shape): signature confined to the hero, everything
below it is `modular-marketing`. One long home page.

## 4. signature_moment ✅ — **LIVE**
> The wordmark slides away and the ice drops, the coffee erupts, and the cup
> tumbles into a close-up of the mark.

Full spec in `media/HERO-SPEC.md`. **The wordmark is DOM artwork, never generated.**

The clip runs longer than the original one-line spec: after the splash the cup
tumbles and settles into a close-up on the logo, whose tail wags for the rest of
the shot. That tail is the resting state the hero ends on, and the scroll mapping
is built around it — see slot 5.

## 5. hero_recipe ✅ — tier 3, video scrubbed by scroll — **SHIPPED**
`_library/recipes/image-to-video-scrub.md`. The clip is wired in and all three
verify passes are clean, including FROZEN CLIP, which is exercised here for the
first time.

**Files:** `media/hero.mp4` (8.2MB, h264) and `media/hero.webm` (6.2MB, VP9),
both **2240x960**, 60fps, 294 frames, 4.9s, **no audio track**, every frame a
keyframe. Poster is `media/hero-poster.png` — frame 0, colour-lifted.

The clip is **pre-padded in the file** from its native 960x960 with a flat
colour (`0xBD8DB9`, tuned by experiment so it survives chroma subsampling), so
it covers the stage with no CSS ground beside it. That is what removes the seam;
`media/STATUS.md` trap 1 lists five approaches that did not — including
stretching the frame's own edge columns, which streaks, produces a white line
and bleeds brown during the tumble.

**Why every frame is a keyframe.** The source had 2 keyframes in 121 frames, so
every `currentTime` write forced a decode of up to 60 P-frames and the scrub
lurched. `-g 1` makes each seek a single decode. This is the single biggest
smoothness lever and costs only file size.

**The clip is 60fps, and that mattered.** A scrub holds one decoded frame until
you seek to another, so at 24fps the display repeated the same image across 4-5
refreshes — measured at **80% repeated paints** over a real wheel scroll, which
is exactly what reads as choppy. Nothing was being skipped (largest jump: 1
frame); there were simply not enough images. 60fps cut that to **54%**.

**But the ice fall needs a different interpolation config.** The default `mci`
estimator cannot track small, fast, hard-edged objects against flat ground:
every falling cube became a smeared ghost. The timeline is split at 0.9583s and
the ice half uses `obmc`+`tdls`+`mb_size=4` — a macroblock small enough to lock
onto a cube instead of averaging it with the background. Frame duplication was
tried and rejected: crisp, but only 24 real images/sec, which still stuttered.

**And the scroll ramp had to move too.** The encode alone left the ice fall at
69% repeated paints because the ramp was deliberately holding it at 2.8 frames
per 100px. The dwell moved to the settle; the ice now runs at 5.3 and measures
49%. Cost: 3.6MB -> 8.2MB. If the clip is ever regenerated, ask for 48-60fps AT
SOURCE — true frames beat interpolated ones.

**The scroll mapping is the real design work.** The beats are very unevenly
distributed — 86% of all visual change is in frames 0-59, and 50% of it is in
frames 47-50 alone. Mapped linearly, the last half of the runway would be a
near-static tail wag and read as dead scroll. The five-segment speed ramp in
`js/site.js` stretches the build, holds on the splash crown, makes the spin the
fastest traverse on the page, and gives the tail to the stage's exit. Runway
came down 320vh -> 260vh to match. The ramp and `--runway-h` are tuned
together; the rationale is in the comment above `ramp()`.

---

## 6. sections ✅ RESOLVED

Page job: **"come to the shop."** The visitor is local, deciding where to go this
morning. Weight sits on the mood menu and Visit; everything else earns its keep by
making the shop feel like a place with a personality already in it.

**Skeleton:** narrative hero on a modular body. The hero is the only pinned,
scrubbed thing on the page. Below it the page is flat, blocked, and scannable.

### Order, ground, and why each one is there

| # | Section | Ground | Job | Register |
|---|---|---|---|---|
| 0 | Nav | transparent → cream | get out of the way, then reappear | — |
| 1 | **Hero** (pinned, scrubbed) | lilac | the signature moment | generated frame |
| 2 | Marquee | cream | a breath; the voice in one pass | — |
| 3 | **The mood menu** | white | the page's real payload — five drinks | mood cows |
| 4 | Meet Hugo | cream | the fiction, stated deadpan and briefly | 35mm |
| 5 | **The drop** | lilac | scarcity, the return mechanic | 35mm |
| 6 | Out back | white | the shop has a calendar, so it has a life | — |
| 7 | The card | cream | loyalty, six moods | mood cow |
| 8 | **Visit** | white | address, hours, the actual conversion | 35mm |
| 9 | Footer | plum | close on ink | wordmark |

**Ground rhythm.** lilac → cream → white → cream → lilac → white → cream → white →
plum. Two background colours beyond white (lilac, cream) as the brand caps it; plum
appears once, as the footer, which the system permits as ink rather than a third
ground. No two adjacent blocks share a ground.

**Emotional shape.** Loud at the hero (the eruption), then flat and dry for the
menu — the quiet section is doing the selling. The drop is the second peak but a
quieter kind: one photograph, one pink flag, a lot of space. Visit lands plain and
factual, because that is what someone deciding where to go actually needs.

### Section notes that constrain the build

- **Mood menu is a list, not a card grid.** Ruled rows, ink hairline between each,
  the mood cow at 56px on the left. The design system forbids "card grids floating
  in grey", and a five-item list is more scannable than five cards anyway.
- **Meet Hugo** is a staff bio, not a founder story. Three short paragraphs, an
  italic serif tagline under them, one square photograph.
- **The drop** is the one section allowed asymmetric space. `CLOSURE` is live; the
  pink flag is the only place pink appears besides the focus ring.
- **Visit is a real answer, not a map embed.** Address, hours, the awning, one
  photograph. Nothing to click except directions.
- **The film-border shots** (`plush-counter`, `iced-orange`) carry a printed border
  in the file. They get no card frame and no radius — framing a framed photo twice
  is the tell.

## 7. motion_budget ✅ RESOLVED

Budget: **4 effects beyond the signature.** The design system's motion character is
binding and stricter than the library default — *"small, physical, dry. Nothing
floats or fades in from far away."*

| # | Effect | Where | Values |
|---|---|---|---|
| — | **Signature** — wordmark slide + scrubbed eruption | hero only | `--progress`, sticky runway |
| 1 | **Reveal-on-scroll** — one style, everywhere | every section | 14px rise + mask sweep, 760ms `--ease-quint`, once |
| 2 | **Marquee** | §2 | linear, derived duration (60px/sec), pauses on hover |
| 3 | **Nav scroll-state** | fixed | hides on down, shows on up, 420ms |
| 4 | **Stamp fill** | §7 the card | six stamps, staggered, `--ease-bounce` — the one cow moment |

**Reveal travel is 14px, not 100–150px.** This is a deliberate departure from
PRINCIPLES §15, which measures 100–150px across the reference set. The design
system's "nothing floats or fades in from far away" is a direct instruction and it
is the client's system, so it wins. The rule §15 actually protects — *one reveal
style everywhere, once, one curve* — is followed exactly. Logged as an assumption.

**Masks, not fades** (PRINCIPLES §7). The reveal is a `mask-image` sweep plus the
14px rise, so it reads as deliberate rather than as loading.

**Asymmetric gains** (PRINCIPLES §5). Menu rows stagger 0/40/95/125/190ms — the gaps
widen, they are not a uniform multiple. Stamps use varied rotation per stamp.

**`--ease-bounce` appears exactly once**, on the stamp fill. Never on a nav item.

### Explicitly not doing

No smooth-scroll library. No parallax on the photography. No hover scale or tilt on
photos (the design system forbids both). No cursor effects. No page transitions. No
preloader curtain — the hero's first frame is the page's first impression and a
curtain would delay it.

## 8. assets ✅ RESOLVED

**Nothing is generated.** Every asset already exists.

| Asset | Source | Placement |
|---|---|---|
| `media/HERO_A.png` | generated, verified | hero poster / video frame 0 |
| `media/HERO_B.png` | generated, verified | end frame — for the video render only |
| `assets/wordmark.png` | client artwork | hero lockup, footer |
| `assets/moods/*.png` (6) | client illustration | menu rows at 56px, card at 96px |
| `assets/badge-seal.png` | client artwork | drop section, rotated -9deg |
| `photography/storefront-lilac.png` | 35mm | visit |
| `photography/plush-counter.png` | 35mm, printed border | meet hugo |
| `photography/iced-orange.png` | 35mm, printed border | the drop |
| `photography/interior-bar.png` | 35mm | out back |

**Hero video:** outstanding, blocked on tool access. The hero ships now with
`HERO_A.png` as a static poster inside the same markup the `<video>` will use. The
scrub callback is written and live — it drives the wordmark and the push-in on the
poster today, and gains the clip's `currentTime` when the file lands. No markup
change required beyond adding the two `<source>` elements.

## 9. copy ✅ RESOLVED

Written against `_library/brand/COPY.md`, with Hugo's casing rule overriding §3.4.
Selected from the design system's reference copy wherever a line already existed.

**Measured against the corpus** (targets from COPY.md §1):

| Metric | Corpus | This page |
|---|---|---|
| H1 words | median 2 | 4 (`SERIOUS COFFEE. UNSERIOUS COW.`) — the brand anchor line |
| Section headings | median 2, ≤3 | 2–4 |
| CTA words | median 2, 89% ≤3 | 2–3 |
| Body sentence median | 9 | 8 |
| Sentences ≤5 words | 28% | ~30% |
| Paragraphs with a checkable number | ~16% | 4 of 14 |

**Owned vocabulary, each used more than once:** `mood` · `drop` · `gone` ·
`regular` · `attached` · `the cow`.

**Checkable numbers on the page:** `412 Bleecker St` · `7a to 7p` · `$5`–`$7` ·
`six moods` · `every friday, 7pm` · `sunday, 8 to 11`.

**Casing:** headlines CAPS, supporting lines lowercase, mixed case only in the two
italic serif taglines that carry a full stop. No emoji. No exclamation marks.

## 10. verify ✅ RESOLVED — all three passes clean

`_library/verify/` over HTTP with real Chrome.

| Pass | Result |
|---|---|
| Desktop 1440×900 | **0 failures, 0 warnings** |
| Mobile 390×844 | **0 failures, 0 warnings** |
| Reduced motion | **0 failures, 0 warnings** |

Dead scroll: none. Ghost copy: none. **Frozen clip: all clips advancing** —
live for the first time now that the hero runs a real video.
Horizontal overflow: `scrollWidth == viewport` at both widths.

**The contrast trap is closed.** Measured on the composited page, the lilac
blocks come in at **8.37:1** and the hero tagline at **6.65:1** — both well past
AA, because every lilac block carries `.t-lilac` and it forces plum-900. The
≈3.9:1 pairing does not occur anywhere on the page.

### What the harness found that inspection did not

1. **Reduced-motion dead track.** With the scrub disabled, `--progress` was
   pinned to 0 and the 320vh runway became 1827px of scrolling with nothing
   changing. Fixed by collapsing the runway to `100svh` under reduced motion —
   the hero becomes a single designed still rather than a frozen scrubber.
2. **Portrait photography swamping the layout.** The 1536×2752 assets rendered
   ~1500px tall, producing two dead-scroll regions and huge empty grounds. Every
   photo is now height-bounded and centred in its column.
3. **A collapsed `fit-content` wrapper.** `width:auto` + `max-height` on the
   photo gave the shrink-wrap nothing to measure, so it computed 0×0 and the
   badge seal detached to its intrinsic 578px. Photos are now sized from height.

### What the harness found when the video landed

4. **`serve.mjs` never implemented range requests.** It advertised
   `Accept-Ranges: bytes` and then answered every Range request with a 200 and
   the whole body. Chrome aborts a media fetch that does that, so the clip never
   decoded and FROZEN CLIP failed against a page that was fine. Fixed in
   `_library/verify/serve.mjs` — it now returns real 206s. This was latent in
   shared tooling; hugo.coffee is the first page with a scrubbed clip to hit it.
5. **The scrub finished a full viewport before the hero did.** `measure()`
   divided by `trackHeight - innerHeight`, which reaches 1.0 the moment the
   sticky stage unsticks — leaving ~900px where the stage was still on screen
   and the playhead was parked on the last frame. Now divides by the full track
   height, so the clip advances until the stage clears the viewport. Invisible
   with a static poster; a real failure with a clip.

### Composition changes the harness could not see

- **The hero seam is fixed IN THE FILE, not in CSS.** Chrome colour-manages a
  `<video>` but not a CSS background or a PNG, and the gap varies with the
  viewer's display profile — so no CSS colour can match the clip on every
  screen. It reads as a large darker RECTANGLE around the cup (it looks like a
  vignette; it is not) and **it does not reproduce in a headless screenshot**,
  so it must be checked on a real display. The clip is pre-padded to 2240x960
  with a flat hex tuned by experiment. Five other approaches failed first and
  are listed in `media/STATUS.md` so nobody retries them.
- **The frame's edge mask was removed.** Feathering the clip's edges to
  transparent made any colour mismatch read as a soft-edged rectangle rather
  than a hard seam, and dimmed real content during the spin frames where coffee
  reaches the frame edge. With the colours matched there is nothing to hide.
- **The poster was a different drink from the clip.** `HERO_A.png` is an opaque
  orange latte; the clip opens on a layered iced one. Same cup, same logo, same
  composition — but the hero popped visibly the moment the video decoded. The
  poster is now `hero-poster.png`, the clip's own frame 0. `HERO_A.png` is kept
  in `media/` as the source start-frame.
- **The hero lockup is anchored to the CUP, not centred in the stage.** It used
  to sit at `margin-bottom: 52vh`, tuned at 1440x900 — the verify width. The
  frame is sized `clamp(78vh, 62vw, 112vh)`, so the cup's top edge swings
  between ~31vh and ~40vh depending on aspect ratio, and a fixed margin cannot
  track it: at 1728x962 the tagline sat 41px INTO the coffee, at 1920x1080 25px
  in, while 1440x900 cleared by 27px. Both the frame and the lockup now derive
  from one `--frame-h` expression, so the tagline clears the cup by 21-34px at
  every ratio tested. **The two expressions must stay in sync.**
- **The push-in came down 1.14 → 1.06.** It was the only camera move behind a
  static poster. The clip carries its own push-in *and* a full tumble, and 14%
  of extra scale on top of a rotating frame read as wobble through the spin.
- Under reduced motion the `<video>` is **replaced** by an `<img>`, not just
  emptied. A sourceless video that never decodes is indistinguishable from a
  broken one, to the harness and to a reader.
- Hero geometry is measured, not guessed: the cup occupies y 41.4%→95.0% of the
  square frame. The frame is sized in `vh` and hung so the cup keeps its
  composed scale and the wordmark gets its 42% headroom at any viewport ratio.
- The badge seal is pale-lilac ink and vanished on the lilac block. It moved to
  the Meet Hugo photograph, which gives it something to read against.
