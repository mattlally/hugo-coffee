/* ═══════════════════════════════════════════════════════════════════════════
   hugo.coffee — page behaviour
   ───────────────────────────────────────────────────────────────────────────
   Dialect D/B hybrid: static HTML, no build step, no framework.
   JS owns STATE only; CSS owns every pixel of motion (PRINCIPLES §10).

     1. hero scrub      — one rAF writes --progress; CSS + video.currentTime read it
     2. reveal          — IntersectionObserver adds one class, once
     3. marquee         — duration derived from content width (§11)
     4. nav state       — two data attributes
     5. engine mount    — hands the pinned/panning acts to vendor/scrollcraft.js
     6. mood machine    — one index; CSS owns the swap and the ground repaint
     7. curtain         — one class on load; CSS owns the parting
   ═════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─── 1. Hero scrub ──────────────────────────────────────────────────────
     The track is the runway; the stage is sticky inside it. Progress is the
     fraction of the track that has passed under the top of the viewport.

     One number, --progress, drives all three: the wordmark slide, the ground
     push-in, and video.currentTime through the speed ramp below. One rAF,
     one callback. */

  var track = document.querySelector(".hero-track");
  var video = document.querySelector(".hero-media video");

  /* iOS Safari will not repaint a PAUSED video on seek.

     currentTime advances exactly as it does everywhere else — verified on
     WebKit, it walks 0 -> 0.53 -> 1.24 as the reader scrolls — but the
     compositor never presents the new frame, so the hero shows frame 0 for
     the entire runway and reads as a frozen still. It is invisible in every
     desktop browser and in headless WebKit, because only the real device has
     the decoder path that defers the paint.

     The fix is to prime the decoder: play the clip muted for one frame and
     pause it immediately. After a real play() the element is in a state where
     seeks do present. play() returns a promise that rejects if the gesture
     policy blocks it — the clip is muted and playsinline so it should not,
     but the rejection is caught either way, because an unhandled rejection
     here would take out the rest of this module. */
  if (video) {
    var primed = false;
    var prime = function () {
      if (primed) return;
      primed = true;
      var pr = video.play();
      if (pr && typeof pr.then === "function") {
        pr.then(function () {
          video.pause();
          video.currentTime = 0;
        }).catch(function () {
          /* Autoplay refused. The scrub still runs; on iOS the frame may not
             advance until the reader touches the page, which the listener
             below covers. */
        });
      } else {
        video.pause();
        video.currentTime = 0;
      }
    };

    if (video.readyState >= 2) prime();
    else video.addEventListener("loadeddata", prime, { once: true });

    /* Belt and braces: a real user gesture is the one thing that always
       unlocks media on iOS, so re-prime on the reader's first touch. */
    addEventListener("touchstart", prime, { once: true, passive: true });
  }

  if (track) {
    var target = 0;
    var current = 0;
    var running = false;

    /* Progress spans the stage's whole time on screen: the pinned phase AND
       the exit.

       A 100vh sticky stage inside an N-vh track is pinned for (N-100)vh, then
       scrolls away over one final viewport. Measuring against
       (trackHeight - innerHeight), as this did before, makes progress reach
       1.0 the moment the stage UNSTICKS — leaving a full viewport of
       scrolling where the stage is still visible and the clip has already
       ended. That tail held a frozen last frame for ~900px, which the verify
       harness correctly failed.

       Dividing by the full track height keeps the clip advancing until the
       stage clears the viewport, so the playhead is never parked while the
       stage is on screen.

       The consequence, which the ramp below is built around: the stage
       unsticks at progress (N-100)/N — at 260vh that is p=0.615. Everything
       after that point plays while the stage is travelling off, so the ramp
       lands the SPIN and the logo settle BEFORE p=0.615, and gives the tail
       wag to the exit. A tail wag reads fine sliding away; a tumble does not.

       Invisible while the hero ran a static poster — a still has no playhead
       to park. It only became a failure once a real clip landed. */
    function measure() {
      var r = track.getBoundingClientRect();
      var travel = r.height;
      if (travel <= 0) { target = 0; return; }
      target = Math.min(Math.max(-r.top / travel, 0), 1);
    }

    /* ── The speed ramp ───────────────────────────────────────────────────
       Maps scroll progress (0-1) to normalised clip time (0-1). Lives here,
       not baked into the clip (media/STATUS.md), so it stays tunable without
       a re-render and the scrub stays linear in time.

       Tuned against the REAL clip's measured motion. The beats are very
       unevenly distributed, so a linear map wastes over half the runway:

       (Beats below are quoted in the SOURCE's 24fps frame numbers, because
       that is how the motion was measured. The shipped clip is interpolated
       to 60fps, so multiply by 2.5 for its frame numbers — the normalised
       times this function returns are unaffected either way.)

         f0-f13    ice falling            low motion
         f14-f22   the splash crown       first payoff — peaks ~f16-20
         f23-f45   splash settling        moderate, falling off
         f46-f57   the tumble             THE SPIKE (peaks 33.9 at f47-50)
         f58-f120  logo close-up, tail    low but NOT static (0.6-1.0)

       50% of all visual change is in frames 47-50; frames 60-120 are 14%.

       Two constraints shape the segments:

       1. THE SPIN MUST FINISH BEFORE THE STAGE UNSTICKS. See measure():
          progress spans the stage's whole time on screen, so at 260vh the
          stage unsticks at p=0.615 and everything after plays while the
          stage travels off. A tail wag reads fine sliding away; a tumble
          does not. So f0-f58 gets the pinned phase and the tail gets the
          exit, landing the logo settle exactly at the handover.

       2. NO SEGMENT MAY PARK THE PLAYHEAD. The harness fails a clip whose
          currentTime (2dp) repeats across 3 consecutive samples.

       Source frames traversed per 100px of scroll, at 260vh / 900px viewport
       (x2.5 for shipped 60fps frames):

         0.000-0.105  f0  -> f14   5.3 /100px  the ice falls
         0.105-0.175  f14 -> f22   4.6 /100px  the splash crown
         0.175-0.520  f22 -> f46   2.8 /100px  the settle — the slow beat
         0.520-0.615  f46 -> f58   5.1 /100px  THE WHIP — fastest pinned beat
         0.615-1.000  f58 -> f120  6.4 /100px  tail wag, across the exit

       THE ICE FALL MUST NOT BE THE SLOW BEAT. It was, originally: 2.8
       frames per 100px, chosen to let the reader dwell on it. But dwelling on
       a scrub means holding each frame across more refreshes, and the ice is
       the one passage where that reads as stutter — the cubes are small, hard-
       edged and isolated against flat lilac, so a repeated frame is obvious in
       a way it never is under the splash's motion blur. Measured at 69%
       repeated paints there against 54% for the clip overall.

       The dwell moved to the SETTLE (f22-f46), which is soft, low-contrast
       and holds up fine at 2.8. The ice now runs at 5.3.

       A tumble read slowly is a wobble; read fast it is a whip. The spin is
       still the fastest PINNED beat; only the tail, sliding away during the
       exit, moves faster.

       This and --runway-h in brand/tokens.css are tuned TOGETHER. Changing
       either without the other breaks both constraints above. */
    function ramp(p) {
      if (p < 0.105) return  p              * (0.1167 / 0.105);   /* f0  -> f14  */
      if (p < 0.175) return  0.1167 + (p - 0.105) * (0.0666 / 0.070); /* f14 -> f22  */
      if (p < 0.520) return  0.1833 + (p - 0.175) * (0.2000 / 0.345); /* f22 -> f46  */
      if (p < 0.615) return  0.3833 + (p - 0.520) * (0.1000 / 0.095); /* f46 -> f58  */
      return                 0.4833 + (p - 0.615) * (0.5167 / 0.385); /* f58 -> f120 */
    }

    function frame() {
      /* The spring. Writing raw scroll position to currentTime judders,
         because scroll events are discrete and seeks are quantised. */
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.0002) current = target;

      track.style.setProperty("--progress", current.toFixed(4));

      if (video && video.readyState >= 2 && video.duration) {
        var t = ramp(current) * video.duration;
        if (Math.abs(video.currentTime - t) > 0.01) video.currentTime = t;
      }

      if (Math.abs(target - current) > 0.0001) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function kick() {
      measure();
      if (!running) { running = true; requestAnimationFrame(frame); }
    }

    if (reduced) {
      /* No scrub. The hero collapses to one designed still (see the
         prefers-reduced-motion block in css/site.css) and the wordmark stays
         put. Drop the clip entirely rather than leaving it parked on frame 0:
         a stalled video is 3.6MB of download for a frame the poster already
         shows, and it keeps a decoder alive for a surface that never moves.
         Clearing the sources and calling load() releases both. */
      track.style.setProperty("--progress", "0");
      if (video) {
        /* Replace the element outright rather than emptying it. A <video>
           left in the DOM with no sources is still a video that never
           decodes and whose playhead never moves — indistinguishable, to any
           observer, from a clip that failed to load. Swapping in the poster
           as a plain <img> states the intent in the markup: this reader gets
           a designed still, not a broken player. */
        var still = new Image();
        still.src = video.getAttribute("poster");
        still.alt = "A house oat latte on a lilac background";
        still.width = 2240;
        still.height = 960;
        video.replaceWith(still);
        video = null;
      }
    } else {
      addEventListener("scroll", kick, { passive: true });
      addEventListener("resize", kick);
      kick();
    }
  }

  /* ─── 2. Reveal — one style, everywhere, once (PRINCIPLES §15) ───────────
     JS adds one class. Every value of the motion lives in CSS. */

  var revealables = document.querySelectorAll("[data-reveal]");

  if (!("IntersectionObserver" in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
    document.querySelectorAll(".stamps").forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);            /* once — never replay on scroll-back */
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.01 });

    revealables.forEach(function (el) { io.observe(el); });
    document.querySelectorAll(".stamps").forEach(function (el) { io.observe(el); });
  }

  /* ─── 3. Marquee — duration derived from content (PRINCIPLES §11) ────────
     Constant 60px/sec regardless of how many lines are in the track, so
     editing the copy never changes the speed. */

  document.querySelectorAll(".marquee").forEach(function (m) {
    var trackEl = m.querySelector(".marquee-track");
    if (!trackEl) return;

    /* Duplicate the run so the -50% keyframe loops seamlessly. */
    trackEl.innerHTML += trackEl.innerHTML;

    function size() {
      var w = trackEl.scrollWidth / 2;
      if (w > 0) m.style.setProperty("--marquee-duration", (w / 60).toFixed(2) + "s");
    }

    size();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    addEventListener("resize", size);
  });

  /* ─── 4. Nav state ───────────────────────────────────────────────────────
     Hides on scroll down, returns on scroll up. Two data attributes; CSS
     does the transform and the background. */

  var nav = document.querySelector(".nav");

  if (nav) {
    var last = window.scrollY;
    var ticking = false;

    function navState() {
      var y = window.scrollY;
      var down = y > last && y > 120;

      nav.dataset.hidden = String(down && !reduced);
      nav.dataset.solid = String(y > window.innerHeight * 0.6);

      last = y;
      ticking = false;
    }

    addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(navState); }
    }, { passive: true });

    navState();
  }

  /* ─── 5. Engine mount ────────────────────────────────────────────────────
     vendor/scrollcraft.js is a manual-mount runtime: it exposes
     ScrollCraft.mount() and deliberately does NOT auto-init, so the page
     decides when the DOM is ready to be measured. It drives the three ported
     acts — the pinned mood machine, the pinned drop, and the panning shop.

     Guarded rather than assumed: if the engine fails to load, the acts still
     render as ordinary stacked sections and the rest of the page is
     unaffected. */

  /* ─── Shop rail: drop the pan overshoot on narrow viewports ──────────────
     The rail carries data-sc-pan="0.62", which tells the engine to travel 62%
     FURTHER than the rail's overflow. On a wide window that is deliberate
     pacing — the rail keeps drifting a little after the last card lands.

     On a phone the overflow is most of the rail's width, so 62% of it is
     ~585px of travel with nothing left to show: measured at 400x875, the last
     card (MERCH) cleared the left edge halfway through the act and the
     remaining scroll pushed it 170px off-screen behind 570px of empty white.
     That is the trailing whitespace the reader hits before the section ends.

     Set to "0" below 820px, so the pan stops exactly when the rail ends.

     It must be SET, not removed: the engine finds the rail with
     querySelector("[data-sc-pan]"), so deleting the attribute makes it stop
     finding the rail at all and the pan never runs. Read once at startup,
     before mount() below, because the engine reads the value when it mounts. */
  var shopRail = document.querySelector(".shop-rail");
  if (shopRail && window.matchMedia("(max-width: 820px)").matches) {
    /* The engine's travel is `over + over * railExtra`, where `over` is
       scrollWidth - viewport. Adding trailing width (a spacer element, or
       padding on the rail) does NOT create a gap: scrollWidth is exactly what
       the travel is measured from, so any width added is width panned away and
       the last card lands flush on the edge again either way. Changing the
       multiplier is the only lever.

       A previous pass used -0.045 to "leave a gap", which was wrong in the
       other direction: it UNDER-panned, so MERCH stopped 42px past the right
       edge and was clipped. The card has to finish fully on screen first.

       Positive extra is what is needed. `over` alone lands the rail's right
       edge (last card + the rail's own right padding) exactly on the viewport
       edge; the padding below then shows as the trailing gap, and a little
       extra travel guarantees the card clears its own gutter. */
    shopRail.setAttribute("data-sc-pan", "0.06");
  }


  if (window.ScrollCraft && typeof window.ScrollCraft.mount === "function") {
    var sc = window.ScrollCraft.mount(document);

    /* RE-MEASURE WHEN THE PAGE GROWS.

       The engine caches each act's document offset in layout(), which it runs
       at mount and again on fonts.ready — but NOT after a lazy image decodes.
       Several sections below the fold carry loading="lazy" images (Meet Hugo,
       the Backyard poster, the drop photo), so as those land the page gets
       taller and every act beneath them slides DOWN, while the engine keeps
       driving them from the offsets it measured when they were higher.

       Measured on a 393x660 phone: the shop act really starts at y=9263 but
       the engine had it at 8895 — 368px stale. Because progress is
       (y - a.top) / travel, that means the rail was already 257px into its pan
       at the exact moment the stage pinned, so the reader arrives on BEANS
       instead of CANS. The drop photo's wipe had likewise finished ~500px
       before its stage reached the top of the screen, which is why neither
       animation appeared to play on the phone.

       The engine's own resize listener cannot cover this: it deliberately
       ignores height-only changes on mobile (URL-bar show/hide would otherwise
       relayout under the reader's thumb), and a lazy image landing is exactly
       a height-only change.

       A ResizeObserver on <body> catches every growth — images, fonts, late
       layout — and re-runs the engine's own layout(). rAF-coalesced so a burst
       of decodes costs one relayout, and guarded because layout() is only on
       the instance the mount returned. */
    if (sc && typeof sc.layout === "function" && window.ResizeObserver) {
      var relayoutPending = false;
      var lastH = document.documentElement.scrollHeight;
      var ro = new ResizeObserver(function () {
        var h = document.documentElement.scrollHeight;
        if (h === lastH || relayoutPending) return;
        lastH = h;
        relayoutPending = true;
        requestAnimationFrame(function () {
          relayoutPending = false;
          sc.layout();
          if (typeof sc.read === "function") sc.read();
        });
      });
      ro.observe(document.body);

      /* Final catch-all: everything has decoded by load. */
      addEventListener("load", function () { sc.layout(); }, { once: true });
    }
  }

  /* ─── 6. The mood machine ────────────────────────────────────────────────
     Ported from the scroll-test build. The engine pins the stage for six
     viewport-heights; this divides that travel into sixths and lights one
     mood per sixth. The cow swaps, the row lifts, and the ground repaints to
     that feeling's colour.

     JS writes ONE index and ONE colour, then returns — every transition is
     CSS (PRINCIPLES §10). The early-out on an unchanged index means the
     scroll handler does no work on the vast majority of frames.

     GROUNDS are brand values only, in mood order. No colour is invented:
     lilac-100, lilac, plum-900, matcha, cream and paper are all design-system
     tokens, read from the cascade rather than hard-coded so a token change
     reaches this list. COW IN GREEN borrows the derived matcha product
     colour at low strength — the system sanctions product colour running
     more saturated than the brand primary. */

  var moods = document.querySelector(".moods");

  if (moods) {
    var css = getComputedStyle(document.documentElement);
    function tok(name, fallback) {
      var v = css.getPropertyValue(name).trim();
      return v || fallback;
    }

    var GROUNDS = [
      tok("--hugo-lilac-100", "#F4EEF5"),  /* 0 THE USUAL          */
      tok("--hugo-lilac", "#D0B9D3"),      /* 1 PURPLE DAY         */
      tok("--hugo-plum-900", "#3B1B2D"),   /* 2 THE MONDAY BRUISE  */
      "#DDE7D2",                           /* 3 COW IN GREEN — matcha at low strength */
      tok("--hugo-cream", "#F5EECD"),      /* 4 CONTENT            */
      tok("--hugo-paper", "#E6DBC5")       /* 5 SULKY              */
    ];

    var cows = moods.querySelectorAll(".moods-cow img");
    var rows = moods.querySelectorAll(".moods-list li");
    var n = Math.min(cows.length, rows.length);
    var lastMood = -1;
    var moodTicking = false;

    function moodState() {
      var r = moods.getBoundingClientRect();
      var travel = moods.offsetHeight - window.innerHeight;
      var p = travel > 0 ? -r.top / travel : 0;
      /* Clamped just under 1 so the final sixth resolves to index n-1 rather
         than n, which would be past the end of the list. */
      p = Math.max(0, Math.min(0.9999, p));

      var i = Math.min(n - 1, Math.floor(p * n));
      moodTicking = false;
      if (i === lastMood) return;
      lastMood = i;

      for (var k = 0; k < n; k++) {
        cows[k].classList.toggle("is-on", k === i);
        rows[k].classList.toggle("is-on", k === i);
      }
      moods.style.setProperty("--ground", GROUNDS[i]);
      moods.setAttribute("data-mood-on", String(i));
    }

    addEventListener("scroll", function () {
      if (!moodTicking) { moodTicking = true; requestAnimationFrame(moodState); }
    }, { passive: true });
    addEventListener("resize", moodState);

    moodState();
  }

  /* ─── 7. Curtain ─────────────────────────────────────────────────────────
     Ported from the kumo-matcha build. JS does STATE only: unhide, add one
     class, remove the node when the parting ends. CSS owns the choreography.

     The element ships with `hidden` and is unhidden here, which is the whole
     no-JS story: if this file never runs, the curtain never appears and the
     reader lands on the hero. The alternative — shipping it visible and
     removing it with JS — turns any script failure into a permanently
     covered page.

     Reduced-motion readers are skipped entirely rather than given an instant
     version. A curtain is a flourish; the honest reduced-motion answer to a
     flourish is not to run it. */

  /* ─── Theme colour ───────────────────────────────────────────────────────
     Safari tints the status-bar strip and the URL-bar surround from
     <meta name="theme-color">. With viewport-fit=cover the page now paints
     into those strips, but Safari still draws its own chrome over them — so
     if the meta stays on one colour, the bands read as a mismatch against
     whatever section is actually on screen.

     Keeping it in step with the section under the top edge makes the strips
     disappear into the page. Sampled from the real painted background rather
     than a lookup table, so a section whose ground is driven by JS (the mood
     machine repaints --ground per mood) is picked up for free. */
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  if (themeMeta) {
    var themeTicking = false;
    var lastTheme = "";

    function opaqueBgOf(el) {
      /* Walk up until something actually paints. A section with no background
         of its own inherits the page ground, and transparent is not a colour
         Safari can tint with. */
      while (el && el !== document.documentElement) {
        var c = getComputedStyle(el).backgroundColor;
        if (c && c !== "transparent" && !/^rgba\(.*,\s*0\)$/.test(c)) return c;
        el = el.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    }

    function themeState() {
      themeTicking = false;
      /* One pixel below the top edge, past the fixed nav, so this reads the
         SECTION rather than the nav itself. */
      var probe = document.elementFromPoint(Math.round(innerWidth / 2), 1);
      if (!probe) return;
      if (probe.closest(".nav")) {
        probe = document.elementsFromPoint(Math.round(innerWidth / 2), 1)
          .filter(function (e) { return !e.closest(".nav"); })[0] || probe;
      }
      var c = opaqueBgOf(probe);
      if (c && c !== lastTheme) {
        lastTheme = c;
        themeMeta.setAttribute("content", c);
      }
    }

    addEventListener("scroll", function () {
      if (!themeTicking) { themeTicking = true; requestAnimationFrame(themeState); }
    }, { passive: true });
    addEventListener("resize", themeState);
    /* After the curtain has gone, so the first reading is the hero and not
       the curtain that is still covering it. */
    setTimeout(themeState, 3400);
  }

  var curtain = document.getElementById("curtain");
  var lockup = document.querySelector(".hero-lockup");

  /* The wordmark's entrance. Held on .is-entering so CSS owns the motion.

     The class is REMOVED when the run finishes. It cannot stay: `both` fill
     leaves the final keyframe pinned on the children, and the wordmark's
     scroll-away is a transform on the parent — a stuck `transform: none` on
     the children is harmless, but a stuck `opacity: 1` would override the
     parent's scrub fade at the exact moment the hero slides out. Removing
     the class returns both children to the stylesheet. */
  function armHero() {
    if (!lockup || reduced) return;
    lockup.classList.add("is-armed");
  }

  function enterHero() {
    if (!lockup || reduced) return;
    lockup.classList.add("is-entering");
    var sub = lockup.querySelector(".hero-sub");
    var end = function (e) {
      if (e && e.target !== sub) return;   /* the sub is last (140ms delay) */
      lockup.classList.remove("is-entering", "is-armed");
    };
    if (sub) sub.addEventListener("animationend", end, { once: true });
    setTimeout(end, 1600);                 /* backstop: 800ms + 140ms delay */
  }

  if (curtain) {
    if (reduced) {
      curtain.remove();
      /* No curtain to wait on, and enterHero() no-ops under reduced motion —
         the hero is simply already there. */
    } else {
      curtain.hidden = false;

      /* The wordmark arrives WHILE the panels are still parting, matching
         kumo-matcha: its hero copy starts at 2.91s against a curtain that
         runs 1.72s → 3.22s. Ours parts on the same schedule, so 2.91s puts
         the wordmark in the same relationship to the opening. */
      armHero();
      setTimeout(enterHero, 2910);

      /* Two frames before the class lands. One is not enough: unhiding and
         adding .is-opening in the same frame can have the browser resolve
         both against a single style pass, and the panels jump to their end
         state with no animation. The first rAF commits the unhide, the
         second starts the run. */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          curtain.classList.add("is-opening");
        });
      });

      /* The left panel is the last thing moving, so its animationend is the
         end of the whole opening. Scoped to that one element — animationend
         bubbles, and the label and logo fire it too, ~700ms earlier. */
      var left = curtain.querySelector(".curtain-panel--left");

      function done(e) {
        if (e && e.target !== left) return;
        curtain.remove();
      }

      if (left) left.addEventListener("animationend", done);

      /* Backstop. If the animation never fires — a background tab throttling
         rAF, a browser that skipped it — the curtain must still come down.
         The run itself ends at 3.22s (see the choreography note in
         css/site.css), so this must sit clear of that: a backstop that fires
         first would cut the parting off mid-slide. */
      setTimeout(done, 4500);
    }
  } else {
    /* No curtain in the document at all. Nothing is gating the hero, so it
       enters on its own. */
    enterHero();
  }
})();
