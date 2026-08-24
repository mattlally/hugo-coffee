# Handoff — read this first

**Project:** the **hugo.coffee** home page — a real coffee-shop site for a client
who supplied a complete 186-file design system.

**Where things stand:** the page is **drafted and verified**, and the hero video
is **live** — scroll-scrubbed, all three verify passes clean. The user is
reviewing the page and has feedback.

```
website-skill-test/
├── HANDOFF.md              ← you are here. Start every session with this.
├── LESSONS-LEARNED.md      ← costly, non-obvious lessons. Read before spending money.
├── hugo-site/              ← the build
│   ├── HANDOFF.md          ← build detail: file map, hard rules, how to verify
│   ├── BRIEF.md            ← all 10 slots, resolved
│   ├── brand/BRAND.md      ← voice, colour, 14 flagged assumptions
│   └── media/STATUS.md     ← hero asset state
└── Hugo coffee design system/   ← the client's system. Read-only. Never edit.
```

Run `/site-build` for the full procedure. Read `hugo-site/HANDOFF.md` for the
build's own rules before touching any code.

---

## What's next — in priority order

### 1 · ~~Drop in the hero video~~ ✅ DONE

The clip is encoded, wired in, and scrubbing. `media/hero.mp4` + `hero.webm`,
no audio, every frame a keyframe, poster is the clip's own frame 0. All three
verify passes clean — **FROZEN CLIP is live for the first time and passing**.

The scroll mapping was the real work: the clip's beats are very unevenly
distributed (50% of all visual change is in 4 frames), so the speed ramp in
`js/site.js` stretches the build, holds the splash, makes the spin the fastest
traverse, and gives the near-static tail to the stage's exit. Runway came down
320vh → 260vh, **desktop and mobile both** — the ramp's handover point is a
ratio, so mobile keeping a smaller number played the tumble as the hero slid
away. **`ramp()` and `--runway-h` are tuned together** — read the comment above
`ramp()` before touching either.

Two things worth knowing, both written up in `media/STATUS.md`:

- **Match the hero stage colour off a page screenshot** — not ffprobe, and not
  a canvas read either (canvas skips the compositor's colour management). The
  three disagree; only the screenshot closes the seam. A mismatch shows up as a
  lighter/darker rectangle around the cup, not as a hairline.
- **The clip ships interpolated to 60fps.** The 24fps master repeated the same
  image across 80% of paints during a scroll, which is what read as choppy.
- **`_library/verify/serve.mjs` had never implemented range requests** — it
  advertised `Accept-Ranges` and answered 200 with the whole body, which makes
  Chrome abort the media fetch. Fixed there, in shared tooling. Any future page
  with a scrubbed video would have hit it.

Do not re-render the clip at a higher frame rate. `STATUS.md` explains why fps
is not the constraint here.

### 2 · Act on the user's review feedback ← start here
The user is reviewing the drafted page. **Ask for the feedback and work through
it before starting new workstreams** — polish on what exists beats adding more.

### 3 · Update the copy
Current copy passes `_library/brand/COPY.md` mechanically (headlines ≤4 words,
CTAs 2–3, zero banned words, all owned vocabulary present), but the user wants
another pass. Re-read `COPY.md` first, and note that Hugo's CAPS/lowercase
casing rule **overrides** COPY.md §3.4 — see `brand/BRAND.md` §2.

### 4 · More motion and richer components
Bring in techniques from the 11 torn-down reference sites in
`~/Documents/coding-projects/websites/sites/` — the teardowns are in each site's
`research/` folder, and `_library/INDEX.md` has a plain-language pattern lookup.

Two constraints that are binding here:
- The current budget is deliberately **4 effects beyond the signature**
  (`BRIEF.md` §7). Going past that is a real decision, not a freebie — say so.
- The design system's motion character is stricter than the library default:
  *"small, physical, dry. Nothing floats or fades in from far away."*
  `--ease-bounce` is rationed to cow moments only.

Keep **one reveal style everywhere** (PRINCIPLES §15). Invention belongs to the
hero, not to eight different section entrances.

### 5 · Bonus — the Three.js 3D hero
A second pass at the hero where the cup label is projected geometry and cannot
degrade. See `_library/recipes/baked-image-sequence.md` and the note at the
bottom of `media/STATUS.md`. **Separate piece of work — do not start it until
1–4 are done.**

---

## Current state, verified

| | |
|---|---|
| Page | `hugo-site/index.html` + `css/site.css` + `js/site.js` |
| Design system | vendored byte-identical in `hugo-site/vendor/tokens/` |
| Verify | **0 failures, 0 warnings** — desktop, mobile 390×844, reduced-motion |
| Frozen clip | **passing** — exercised for the first time |
| Contrast | lilac blocks **8.37:1** (the ≈3.9:1 trap is closed) |
| Hero | **video live** — scroll-scrubbed `hero.mp4`, wordmark slide, push-in |
| Dialect | static HTML/CSS, no build step, no framework. **Do not add one.** |

## Two things worth knowing before you start

- **A green verify run is a floor, not a verdict.** It cannot see composition. It
  reported clean on a page where one section was a near-black rectangle in a
  void. Open the screenshots.
- **Read `LESSONS-LEARNED.md` before touching any paid API.** Probing model slugs
  with valid input bills real money; there is a free technique documented there.
