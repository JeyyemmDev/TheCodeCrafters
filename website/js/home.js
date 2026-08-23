/* ============================================================
   home.js  –  Homepage entrance animation
   Exposes: window.buildHomeEntranceTL()
   Returns a GSAP timeline that is appended to the master intro TL
   in global.js.  It does NOT auto-play.

   Sequence:
     1. Headline typewriter
     2. All chrome (nav, badge, subheading, carousel) rise / slide in
     3. Carousel CSS animation starts (via .is-spinning class)
============================================================ */

window.buildHomeEntranceTL = function () {

  /* ── Element refs ──────────────────────────────────────── */
  const headline        = document.querySelector('.hero-headline');
  const headlineWrapper = document.querySelector('.hero-headline-wrapper');
  const badge           = document.querySelector('.badge');
  const subWrapper      = document.querySelector('.hero-sub-wrapper');
  const sliderEntrance  = document.querySelector('.slider-entrance');
  const sliderEl        = document.querySelector('.slider');
  const nav             = document.querySelector('.nav');
  const navToggle       = document.querySelector('.nav-toggle');
  const isMobile        = window.matchMedia('(max-width: 900px)').matches;

  /* Build an empty TL so we always return something valid */
  const tl = gsap.timeline();
  if (!headline) return tl;

  /* ── Initial states (set once, immediately) ──────────────
     Elements are already opacity:0 in CSS; we just add the
     Y offsets and make sure visibility is correct.
  ──────────────────────────────────────────────────────── */
  gsap.set(nav,           { y: -56, opacity: 0 });
  if (!isMobile) {
    gsap.set(navToggle,   { y: -16, autoAlpha: 0 });
  }
  gsap.set(badge,         { y: -20, opacity: 0 });
  gsap.set(subWrapper,    { y:  28, opacity: 0 });

  // autoAlpha handles both opacity AND visibility toggling,
  // matching the CSS "visibility: hidden" initial state.
  gsap.set(sliderEntrance, { autoAlpha: 0, y: 40 });

  /* ── Reveal headline wrapper so innerText is readable ─── */
  headline.style.opacity       = '1';
  if (headlineWrapper) headlineWrapper.style.opacity = '1';

  /* ── Split headline into character spans ─────────────── */
  const rawText = headline.innerText.replace(/\s+/g, ' ').trim();
  let html = '';
  const words = rawText.split(' ');

  words.forEach((group, gi) => {
    const gapStyle = gi < words.length - 1 ? 'margin-right:0.28em;' : '';
    html += `<span class="tw-word" style="display:inline-block;white-space:nowrap;${gapStyle}">`;

    [...group].forEach(ch => {
      html += `<span class="tw-char" style="display:inline-block;opacity:0;">${ch}</span>`;
    });

    html += `</span>`;
  });

  headline.innerHTML = html;
  const chars = headline.querySelectorAll('.tw-char');

  if (!chars.length) {
    gsap.set(headline, { opacity: 1 });
    return tl;
  }

  /* ── Step 1: Typewriter ──────────────────────────────── */
  tl
    .to({}, { duration: 0.08 })                       // tiny breath before typing
    .to(chars, {
      opacity : 1,
      duration: 0.01,
      stagger : { each: 0.030, ease: 'none' },        // was 0.038 — slightly snappier
      ease    : 'none',
    })
    .to({}, { duration: 0.35 });                      // breath after typewriter (was 0.5)

  /* ── Step 2: All chrome enters simultaneously ────────── */
  const IN_DUR  = 1.0;                                // was 1.5 — tighter
  const IN_EASE = 'expo.out';

  tl
    .to(nav,          { y: 0, opacity: 1, duration: IN_DUR, ease: IN_EASE }, '+=0');

  if (!isMobile) {
    tl.to(navToggle,  { y: 0, autoAlpha: 1, duration: IN_DUR, ease: IN_EASE }, '<');
  }

  tl
    .to(badge,        { y: 0, opacity: 1, duration: IN_DUR, ease: IN_EASE }, '<')
    .to(subWrapper,   { y: 0, opacity: 1, duration: IN_DUR, ease: IN_EASE }, '<')

    // Carousel: use autoAlpha so CSS visibility flips too.
    // Small extra delay gives it a subtle staggered depth feel.
    .to(sliderEntrance, {
      autoAlpha : 1,
      y         : 0,
      duration  : IN_DUR,
      ease      : IN_EASE,
      delay     : 0.07,

      // ── Enhancement 4: start 3D spin only when visible ──
      onComplete () {
        if (sliderEl) sliderEl.classList.add('is-spinning');
      },
    }, '<');

  return tl;
};
