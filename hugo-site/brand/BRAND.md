# BRAND — Hugo

**Serious coffee. Unserious cow.**

Hugo is a neighbourhood coffee shop in the West Village, NYC, run — in a fiction the
brand commits to completely — by a small purple cow who is a little dramatic. Every
drink is one of his moods. Once a month he feels something new, it becomes a limited
drink, and when the mood is over the drink is gone.

> **The coffee isn't the product. The cow is.**

**Arrival path: `full-guide`.** The client supplied a complete, hand-authored design
system (186 files) with semantic tokens, four type roles, 27 photographs, voice rules
and a component library. This document does not restate it — read
`../../Hugo coffee design system/readme.md` for the brand rules. This file records
only what *this site build* decided on top of it.

---

## 1. What the design system already settled

| Slot | Status | Source |
|---|---|---|
| Palette | ✅ Complete, already semantic | `tokens/colors.css` |
| Type roles | ✅ Four families, three roles | `tokens/typography.css` |
| Spacing / shape | ✅ Complete | `tokens/spacing.css`, `tokens/shape.css` |
| Voice + casing | ✅ Unusually complete | `readme.md` §CONTENT FUNDAMENTALS |
| Photography | ✅ 27 shots, two registers | `assets/photography/` |
| Illustration | ✅ Six mood cows + marks | `assets/moods/`, `assets/` |
| Motion | ⚠️ Partial — controls only, no page motion | `tokens/motion.css` |
| Font fallbacks | ❌ Absent | — |
| Fluid display type | ❌ Fixed rem | — |
| Signature moment | ❌ Not specified | — |

The last three are what `brand/tokens.css` adds.

---

## 2. Voice — calibrated against COPY.md §4

| Axis | Position | Evidence |
|---|---|---|
| **Warmth** | warm | "a coffee shop run by a small purple cow" |
| **Play** | **very playful — the extreme** | the whole brand is a bit about a cow's feelings |
| **Ornament** | plain / monosyllabic | "A little weird. Very good." |
| **Stance** | confident, deadpan | "the cow is the judge. the cow is biased." |

COPY.md requires **one dial at an extreme**. Hugo's is **Play**, which puts it in
Touchy Coffee's quadrant — the corpus anchor for playful/plain/confident. That is the
calibration anchor for every line on this page.

**Owned vocabulary (COPY.md §3.8 wants 5–8, each used more than once):**
`mood` · `drop` · `gone` · `regular` · `attached` · `the cow`

**Casing — the load-bearing rule, and it overrides COPY.md §3.4.**
COPY.md measures sentence case as the corpus plurality. Hugo mandates the opposite and
it is doing real brand work, so Hugo wins:

- Headlines are **CAPS** — `THE MENU`, `CLOSURE`, `SIX MOODS. ONE FREE.`
- Supporting lines are **lowercase** — `every drink is one of his moods`
- Mixed case appears **only** in italic serif taglines carrying a full stop —
  *The cow knows good coffee.*

**Person.** Third person about the cow, never first person as the brand. It is `the
cow`, never `we`. Second person used sparingly and dryly.

**Banned, brand-specific** (on top of COPY.md §7): artisanal, curated, crafted,
journey, elevated, community-as-noun, "we're thrilled", **exclamation marks**,
**emoji of any kind**. The mood cows are the emotional vocabulary.

---

## 3. Colour deployment

Four core values; the discipline is deployment, not count.

| Role | Token | Hex | Deployment on this page |
|---|---|---|---|
| Primary | `--hugo-lilac` | `#D0B9D3` | The hero ground and two full-bleed blocks. Never a 1px accent — lilac wants area. |
| Secondary | `--hugo-cream` | `#F5EECD` | Alternate section grounds, card surfaces. |
| Accent | `--hugo-plum` | `#562A42` | The **ink**: body copy, rules, buttons, outlines. A text colour first. |
| Background | `--hugo-white` | `#FFFFFF` | Default ground, so lilac and cream read as discrete blocks. |
| Flag | `--hugo-pink` | `#F0879F` | Drops and limited flags **only**, plus the focus ring. |

**Two background colours per page beyond white** is the brand's hard cap. This page
uses **lilac and cream**. Plum appears as a block once, in the footer, which the
system permits as ink rather than as a third ground.

### The accessibility trap, and how this build handles it

Plum does double duty as the text colour, and **plum on lilac is ≈3.9:1 — it fails
WCAG AA for body text.** This is the one real trap in the system and it is where the
verify step will be pointed.

Rules applied throughout:
- Long copy sits on **cream or white**, never lilac.
- On lilac grounds, text is `--text-on-lilac` (`--hugo-plum-900`, ≈5.4:1) at **16px+**.
- The `.t-lilac` theme class enforces this — it sets `--sec-text` to plum-900, so a
  component reading `--sec-text` cannot accidentally use plum-800 on lilac.

---

## 4. Motion character

The design system's own words: **small, physical, dry. Nothing floats or fades in
from far away.** That constrains this build more than the library's defaults would.

| Behaviour | Value | Origin |
|---|---|---|
| Control hover | fill darkens one step + 1px lift | design system |
| Press | `scale(0.97)` — a rubber stamp | design system |
| Link hover | underline 1px → 2px, no colour-only change | design system |
| Photo/card hover | **no scale, no tilt**, at most 1px lift | design system |
| `--ease-bounce` | **rationed to cow moments only** — never a nav item | design system |
| Marquee | linear, 28s, pauses on hover | design system |
| Reveal-on-scroll | one style everywhere, 760ms, `--ease-quint`, `once` | PRINCIPLES §15 |
| Page curve | `cubic-bezier(.22,1,.36,1)` | PRINCIPLES §1 |

---

## 5. Assumptions — everything this build invented

Per the skill's rule: every invented value gets a row, with basis and confidence.
Unflagged guesses become fact by the third build.

| # | Value | What I assumed | Basis | Confidence |
|---|---|---|---|---|
| 1 | Font fallback metrics (4 faces) | `ascent/descent/size-adjust` overrides against Arial / Times / Arial Black | Computed from published head/hhea tables. **Not machine-verified against the actual binaries** — the fonts load from Google Fonts CDN, so I could not read the files. | **Medium** — they eliminate most shift; a Fontaine run would tighten them |
| 2 | `--ease-out` override | Replaced the design system's `cubic-bezier(.22,.61,.36,1)` with the library house curve `cubic-bezier(.22,1,.36,1)` | PRINCIPLES §1 is 11/11 and two teams converged on it. Applied to **page motion only** — control transitions keep the DS feel | **High** |
| 3 | Fluid display clamps | `clamp()` floors at 44/32/24px | PRINCIPLES §3 requires fluid display. Ceilings match the DS exactly (88/60/40) so desktop is unchanged; only the floors are invented | **High** |
| 4 | `--size-hero: clamp(3rem,13vw,9rem)` | A hero size **above** the DS scale (144px vs 88px) | The hero is the signature moment and the DS scale was written for a conventional page. Flagged because it exceeds a documented scale | **Medium** |
| 5 | `--runway-h: 320vh` | Scrub runway length | Skeleton says 400–800vh for a full narrative runway; this is a *hero* runway on a modular body, so it is shorter. 5 beats + lead-in | **Medium** — tune against the real clip |
| 6 | `--duration-reveal: 760ms` | Reveal timing | PRINCIPLES §15 measures 0.6–1.0s across all 11 sites; Mercury's is 670ms | **High** |
| 7 | Theme cross-fade 500ms | Section repaint | Mercury's measured value, `cubic-bezier(0,0,.6,1)` | **High** |
| 8 | Hero asset (ice-drop clip) | Generated, not photographed | Client-directed. See BRIEF.md §Assets — this is the only generated asset on the page | **High** (explicit instruction) |
| 9 | Contrast figures ≈3.9:1 / ≈5.4:1 | Quoted from the design system's own readme | ~~Not independently recomputed.~~ **Now measured on the composited page:** lilac blocks read **8.37:1**, hero tagline **6.65:1**, cream **9.97:1**. The ≈3.9:1 pairing does not occur — `.t-lilac` prevents it. The client's figures were conservative | **Confirmed** |

| 10 | Reveal travel `14px` | Departure from PRINCIPLES §15, which measures 100–150px across all 11 reference sites | The design system's own motion character — *"nothing floats or fades in from far away"* — is a direct client instruction and contradicts the library default. The rule §15 actually protects (one style, once, one curve) is followed exactly | **High** — client instruction beats library median |
| 11 | Hero stage ground `rgb(203,157,198)` | A hero-local colour that is **not** `--hugo-lilac` (`208,185,211`) | Measured off `HERO_A.png`. The generated frame's baked ground differs from the token, and painting the stage in the token leaves a visible vertical seam. Scoped to the hero only; nothing else uses it | **High** — measured, not chosen |
| 12 | Hero frame geometry `97vh`, `min 62vw` | Frame sizing and placement | Measured from the source frame: the cup occupies y 41.4%→95.0%, i.e. 53.6% of frame height. Sized so the cup keeps its composed scale and the wordmark keeps its 42% headroom at any viewport ratio | **High** — derived from the asset |
| 13 | Photo height bound `72vh` / `74vh` | Cap on the 1536×2752 photography | Unbounded, the assets render ~1500px tall and produce dead scroll plus large empty grounds — both caught by the verify harness. The design system says "layout follows the assets", which here means cropping them | **Medium** — tune per section if the art direction changes |
| 14 | Badge seal placement | Moved from the drop (lilac) to Meet Hugo (photograph) | The seal is pale lilac ink on transparent and is effectively invisible on `--hugo-lilac`. It needs a photograph or warm ground | **High** — verified visually |

**Not invented:** every colour, every spacing value, every radius, every shadow, all
four font families, all voice rules, all photography. Those come from the client.

---

## 6. Photography rules that constrain layout

- **Two registers, never mixed inside one grid.** 35mm film (warm, grainy, shallow,
  hands in frame) is editorial/hero/lifestyle. Hard flash (punchy, flat, specular) is
  merch and cans.
- **Never tint a photo lilac. Never duotone.** Lilac appears in-frame as a real object.
- **No text on photos without a solid capsule.** No frosted glass, no backdrop-filter,
  no protection gradients — this is a flat-print system. Text over a photo sits in a
  solid cream or lilac capsule, or the photo gets a solid colour band.
- Assets are **1536×2752 portrait** (9:16) for most shots — that suits full-bleed
  columns and tall crops, and fights wide 16:9 bands. Layout follows the assets.

## 7. Illustration constraints

- Mood cows are **~220–255px PNGs**. Usable 48–160px. **Anything larger needs vector
  redraws from the illustrator** — the brand forbids tracing, generating or
  approximating them in code. This build never scales one past 160px.
- The wordmark is **artwork, not type**. Never re-set "HUGO" in a typeface.
- Hugo has **no icon set**, deliberately. Where another brand puts an icon, Hugo puts
  a mood cow, a small-caps label, or nothing. This build uses **no icon library** —
  the one place a glyph was tempting (the scroll cue) uses a hand-set caret in CSS.
