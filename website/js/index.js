// ─────────────────────────────────────────────────────────────────
//  global.js  –  scroll management + ONE unified intro timeline
// ─────────────────────────────────────────────────────────────────

/* ── Scroll restoration ──────────────────────────────────────── (need to fix this shits)*/ 
(function () {
  var navEntries = window.performance && performance.getEntriesByType
    ? performance.getEntriesByType("navigation")
    : [];
  var navType = navEntries.length ? navEntries[0].type : "";

  if (!navType && window.performance && performance.navigation) {
    navType = performance.navigation.type === 1 ? "reload" : "";
  }

  if (navType !== "reload") {
    return;
  }

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  document.documentElement.style.scrollBehavior = "auto";

  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function resetToTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  resetToTop();
  window.addEventListener("DOMContentLoaded", resetToTop);
  window.addEventListener("load", function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(resetToTop);
    });
  });
  window.addEventListener("pageshow", resetToTop);
})();


/* ── Master intro + homepage entrance ───────────────────────── */
window.addEventListener("load", () => {
  const skipHomeIntro = sessionStorage.getItem("skipHomeIntro") === "1";
  window.__skipHomeIntro = skipHomeIntro;

  if (skipHomeIntro) {
    const intro = document.querySelector(".intro-screen");
    const target = window.location.hash ? document.querySelector(window.location.hash) : null;

    if (intro) {
      intro.style.opacity = "0";
      intro.style.display = "none";
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (target) {
          target.scrollIntoView({ behavior: "auto", block: "start" });
        }

        sessionStorage.removeItem("skipHomeIntro");
      });
    });

    return;
  }

  const pillars = gsap.utils.toArray(".pillar");
  const logo    = document.querySelector(".logo-wrap");
  const logoImg = document.querySelector(".logo-img");
  const intro   = document.querySelector(".intro-screen");


  let savedScroll = 0;
  const preventScroll = () => window.scrollTo(0, savedScroll);
  const lockScroll    = () => {
    savedScroll = window.scrollY;
    window.addEventListener("scroll", preventScroll, { passive: false });
  };
  const unlockScroll  = () => {
    window.removeEventListener("scroll", preventScroll);
  };

  lockScroll();

  /* ── SINGLE MASTER TIMELINE ──────────────────────────────── */
  const master = gsap.timeline({ delay: 0.35 });

  // 1 ▸ Pillars drop in  (was 1.2 s)
  master.fromTo(pillars,
    { y: "-100%" },
    { y: "0%", duration: 0.85, stagger: 0.08, ease: "expo.inOut" }
  );

  // 2 ▸ Logo fades + scales in  (was 0.6 + 0.8 s)
  master.to(logoImg, { scale: 1, opacity: 1, duration: 0.55, ease: "power2.out" }, "-=0.3");
  master.to(logo,    { opacity: 1, duration: 0.45 }, "<");

  // 3 ▸ Hold  (was 1 s)
  master.to({}, { duration: 0.75 });

  // 4 ▸ Logo fades out  (was 0.4 s)
  master.to(logo, { opacity: 0, y: -12, duration: 0.28, ease: "power2.in" });

  // 5 ▸ Pillars retract  (was 1.2 s)
  master.to(pillars, {
    y: "-100%",
    duration: 0.85,
    stagger: 0.07,
    ease: "expo.inOut",
  });

  // 6 ▸ Intro screen dissolves  (was 0.4 s)
  master.to(intro, { opacity: 0, duration: 0.25 });
  master.add(() => {
    intro.style.display = "none";
    unlockScroll();
  });

  // 7 ▸ Append home entrance timeline seamlessly
  //     home.js exposes window.buildHomeEntranceTL() which returns
  //     a pre-built (but not yet playing) GSAP timeline.
  if (typeof window.buildHomeEntranceTL === "function") {
    master.add(window.buildHomeEntranceTL(), "+=0");
  }
});


/* ═══════════════════════════════════════════════
   Activities / Events Page — Interactive JS
═══════════════════════════════════════════════ */

/**
 * handleCard — toast notification on card click
 */
function handleCard(name) {
  /* Remove any existing toast first */
  const existing = document.querySelector('.act-toast');
  if (existing) existing.remove();

  const labels = {
    Beginner: 'Explore Workshops →',
    Expert:   'Explore Event Participations →',
    Employee: 'Explore Seminars →',
  };

  const toast = document.createElement('div');
  toast.className = 'act-toast';
  toast.textContent = labels[name] || `Explore ${name} →`;

  Object.assign(toast.style, {
    position:      'fixed',
    bottom:        '32px',
    left:          '50%',
    transform:     'translateX(-50%) translateY(16px)',
    background:    '#1F4FB2',
    color:         '#fff',
    fontFamily:    "'Montserrat', sans-serif",
    fontSize:      '14px',
    fontWeight:    '600',
    padding:       '12px 28px',
    borderRadius:  '100px',
    boxShadow:     '0 12px 32px rgba(31,79,178,.5)',
    opacity:       '0',
    transition:    'opacity .25s, transform .25s',
    zIndex:        '9999',
    pointerEvents: 'none',
    letterSpacing: '.03em',
    whiteSpace:    'nowrap',
    maxWidth:      'calc(100vw - 32px)',
    textAlign:     'center',
  });

  document.body.appendChild(toast);

  /* Animate in */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity    = '1';
      toast.style.transform  = 'translateX(-50%) translateY(0)';
    });
  });

  /* Animate out and remove */
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(16px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}


/* ═══════════════════════════════════════════════
   Parallax tilt on wrapper — DESKTOP ONLY
   (disabled on touch/mobile to avoid jank)
═══════════════════════════════════════════════ */
(function initParallax() {
  const wrapper = document.querySelector('.wrapper');
  if (!wrapper) return;

  /* Only activate on non-touch, wide-enough screens */
  const mq = window.matchMedia('(min-width: 700px) and (hover: hover) and (pointer: fine)');

  function enableParallax() {
    wrapper.style.transition = 'transform 0.12s ease';
    wrapper.style.willChange = 'transform';

    function onMouseMove(e) {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      wrapper.style.transform =
        `perspective(1200px) rotateY(${dx * 2.5}deg) rotateX(${-dy * 1.5}deg)`;
    }

    function onMouseLeave() {
      wrapper.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)';
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    /* Clean up if viewport shrinks below threshold */
    mq.addEventListener('change', function handler(e) {
      if (!e.matches) {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseleave', onMouseLeave);
        wrapper.style.transform  = '';
        wrapper.style.transition = '';
        wrapper.style.willChange = '';
        mq.removeEventListener('change', handler);
      }
    });
  }

  if (mq.matches) {
    enableParallax();
  }
})();


/* ═══════════════════════════════════════════════
   Image Lightbox
═══════════════════════════════════════════════ */
(function initLightbox() {

  /* Build overlay once */
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close preview">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="4" y1="4" x2="20" y2="20"/>
        <line x1="20" y1="4" x2="4" y2="20"/>
      </svg>
    </button>
    <img class="lightbox-img" src="" alt="Preview" draggable="false" />
  `;
  document.body.appendChild(overlay);

  const img   = overlay.querySelector('.lightbox-img');
  const close = overlay.querySelector('.lightbox-close');

  function openLightbox(src, alt) {
    img.src = src;
    img.alt = alt || 'Preview';
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    /* Clear src after transition so it doesn't flash on reopen */
    setTimeout(() => { img.src = ''; }, 350);
  }

  /* Close on button or overlay background click */
  close.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  /* Close on Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeLightbox();
    }
  });

  /* Delegate clicks on all .card-illustration img elements */
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.card-illustration img');
    if (!target) return;
    e.stopPropagation(); /* don't fire handleCard on the parent .folder */
    openLightbox(target.src, target.alt);
  });

})();


/* ═══════════════════════════════════════════════
   CONTACT PAGE — contact.js
   Circle text fitter + scroll rotation
═══════════════════════════════════════════════ */

(function initContact() {

  const arcSizer    = document.getElementById('arcSizer');
  const arcSvg      = document.getElementById('arcSvg');
  const arcText     = document.getElementById('arcText');
  const arcTextPath = document.getElementById('arcTextPath');

  if (!arcSizer || !arcSvg || !arcText || !arcTextPath) return;

  /* ── Constants ─────────────────────────────── */
  const RADIUS        = 400;                        // SVG units — matches circle-path
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;      // ≈ 2513.27 SVG units
  const TEXT_CONTENT  = 'CONNECT WITH US ✦CONNECT WITH US ✦';

  /* ── Core fitter ────────────────────────────── */
  function fitTextToCircle() {

    /* 1. Apply a known reference size so we can measure */
    const REF_SIZE = 10;
    arcText.setAttribute('font-size', REF_SIZE);
    arcText.setAttribute('letter-spacing', 0);
    arcTextPath.textContent = TEXT_CONTENT;

    /* 2. Measure rendered length at reference size */
    let measured;
    try {
      measured = arcTextPath.getComputedTextLength();
    } catch (e) {
      return; // SVG not in DOM yet — ResizeObserver will retry
    }
    if (!measured || measured === 0) return;

    /* 3. Scale font-size so text fills the full circumference */
    const scaledSize = REF_SIZE * (CIRCUMFERENCE / measured);
    arcText.setAttribute('font-size', scaledSize);
    arcText.setAttribute('letter-spacing', 0);

    /* 4. Fine-tune: distribute any residual gap as letter-spacing */
    const afterScale   = arcTextPath.getComputedTextLength();
    const residual     = CIRCUMFERENCE - afterScale;
    const extraPerChar = residual / TEXT_CONTENT.length;
    arcText.setAttribute('letter-spacing', extraPerChar);
  }

  /* ── Run after fonts are ready ──────────────── */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitTextToCircle);
  } else {
    window.addEventListener('load', fitTextToCircle);
  }

  /* ── Re-run on resize via ResizeObserver ─────── */
  const ro = new ResizeObserver(() => fitTextToCircle());
  ro.observe(arcSizer);

  /* ── Scroll rotation ────────────────────────── */
})();
document.addEventListener('DOMContentLoaded', () => {

  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  const links = document.querySelectorAll('.mobile-link');
  const line1 = document.getElementById('line1');
  const line2 = document.getElementById('line2');

  if (!nav || !toggle || !menu || !line1 || !line2) {
    console.error('❌ Missing required navbar DOM elements');
    return;
  }

  const BREAKPOINT = 900;
  let open = false;

  /* ----------------------------------------------------------
     Initial state: nav hidden (home.js will animate it in)
  ---------------------------------------------------------- */
  gsap.set(nav, { y: -80, opacity: 0 });
  gsap.set(toggle, { y: -16, autoAlpha: 0 });

  gsap.set([line1, line2], {
    clearProps: 'all',
    rotation: 0,
    y: 0,
    backgroundColor: '#1a1a1a'
  });

  gsap.set(menu, {
    clipPath: 'inset(0 0 100% 0)',
    pointerEvents: 'none',
    opacity: 0
  });

  /* ----------------------------------------------------------
     Scroll: subtle background tint on scroll
  ---------------------------------------------------------- */
  function scrollNav() {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }

  window.addEventListener('scroll', scrollNav);
  scrollNav();

  /* ----------------------------------------------------------
     Open / Close mobile menu
  ---------------------------------------------------------- */
  function openNav() {
    open = true;
    menu.classList.add('active');

    gsap.set(menu, { pointerEvents: 'auto', opacity: 1 });

    gsap.timeline()
      .to(line1, { y: 5, rotation: 42, backgroundColor: '#fff', duration: 0.38, ease: 'expo.out' }, 0)
      .to(line2, { y: -5, rotation: -42, backgroundColor: '#fff', duration: 0.38, ease: 'expo.out' }, 0);

    const tl = gsap.timeline();
    tl.to(nav, { opacity: 0, duration: 0.15 });
    tl.fromTo(menu,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 0.65, ease: 'expo.inOut' }
    );
    tl.fromTo(links,
      { opacity: 0, x: -70 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.09, ease: 'expo.out' },
      '-=0.35'
    );
  }

  function closeNav(instant = false) {
    open = false;

    gsap.timeline()
      .to(line1, { y: 0, rotation: 0, backgroundColor: '#1a1a1a', duration: instant ? 0 : 0.38 }, 0)
      .to(line2, { y: 0, rotation: 0, backgroundColor: '#1a1a1a', duration: instant ? 0 : 0.38 }, 0);

    if (instant) {
      gsap.set(menu, { clipPath: 'inset(0 0 100% 0)', pointerEvents: 'none', opacity: 0 });
      gsap.set(nav, { opacity: 1 });
      menu.classList.remove('active');
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        menu.classList.remove('active');
        gsap.set(menu, { pointerEvents: 'none', opacity: 0 });
      }
    });

    tl.to(links, { opacity: 0, x: -40, duration: 0.22, stagger: 0.04 });
    tl.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.55, ease: 'expo.inOut' });
    tl.to(nav, { opacity: 1, duration: 0.25 });
  }

  /* ----------------------------------------------------------
     Event listeners
  ---------------------------------------------------------- */
  toggle.addEventListener('click', () => open ? closeNav() : openNav());

  links.forEach(link => link.addEventListener('click', () => closeNav()));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) closeNav();
  });

  const resize = new ResizeObserver(() => {
    if (window.innerWidth > BREAKPOINT && open) closeNav(true);
  });

  resize.observe(document.body);

});
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

  /* Build an empty TL so we always return something valid */
  const tl = gsap.timeline();
  if (!headline) return tl;

  /* ── Initial states (set once, immediately) ──────────────
     Elements are already opacity:0 in CSS; we just add the
     Y offsets and make sure visibility is correct.
  ──────────────────────────────────────────────────────── */
  gsap.set(nav,           { y: -56, opacity: 0 });
  gsap.set(navToggle,     { y: -16, autoAlpha: 0 });
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
    .to(nav,          { y: 0, opacity: 1, duration: IN_DUR, ease: IN_EASE }, '+=0')
    .to(navToggle,    { y: 0, autoAlpha: 1, duration: IN_DUR, ease: IN_EASE }, '<')
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
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.scroll-top-btn')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'scroll-top-btn';
  button.setAttribute('aria-label', 'Back to top');
  button.innerHTML = `
    <span class="scroll-top-btn-label">Back to top</span>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5.5l-6.5 6.5 1.4 1.4 4.1-4.1V20h2V9.3l4.1 4.1 1.4-1.4z"></path>
    </svg>
  `;

  const toggleVisibility = () => {
    const shouldShow = window.scrollY > 260;
    button.classList.toggle('is-visible', shouldShow);
  };

  const updateSurfaceMode = () => {
    const rect = button.getBoundingClientRect();
    const probeX = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
    const probeY = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2));
    const elementBelow = document.elementFromPoint(probeX, probeY);
    const isDarkSurface = !!(elementBelow && elementBelow.closest('footer, .intro-screen'));

    button.classList.toggle('is-on-dark', isDarkSurface);
  };

  const syncButtonState = () => {
    toggleVisibility();
    updateSurfaceMode();
  };

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.body.appendChild(button);
  syncButtonState();
  window.addEventListener('scroll', syncButtonState, { passive: true });
  window.addEventListener('resize', syncButtonState);
});
/* ============================================================
   scroll-animations.js
   Requires GSAP + ScrollTrigger (already loaded in index.html)

   DROP-IN:  Add this script tag AFTER global.js / home.js:
     <script src="website/js/scroll-animations.js"></script>

   What it does
   ─────────────
   • HOME  – exit animation when scrolling away; re-entrance when
             scrolling back (re-runs the typewriter + chrome reveal)
   • ABOUT – staggered reveal for every block
   • OFFICERS – headline + card cascade
   • ACTIVITIES – header + folder cards fan in
   • CONTACT – arc + info panel split entrance
   • FOOTER – fade-up
============================================================ */

(function initScrollAnimations() {

  /* ── Wait for GSAP + DOM ──────────────────────────────── */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const MOBILE_QUERY = '(max-width: 900px)';
    const mobileMedia = window.matchMedia(MOBILE_QUERY);
    let setupTimer = null;
    let rebuildTimer = null;
    let cleanupSetup = null;
    let currentViewportMode = mobileMedia.matches ? 'mobile' : 'desktop';

    /* Give the intro timeline a moment to finish before we
       register ScrollTriggers (intro is ~3.5 s total).       */
    const INIT_DELAY = 4000; // ms — matches master TL duration

    const resolvedInitDelay = document.querySelector('.home') && !window.__skipHomeIntro ? INIT_DELAY : 0;

    function runSetup() {
      if (setupTimer) {
        clearTimeout(setupTimer);
        setupTimer = null;
      }

      if (cleanupSetup) {
        cleanupSetup();
        cleanupSetup = null;
      }

      cleanupSetup = setup();
      currentViewportMode = mobileMedia.matches ? 'mobile' : 'desktop';

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }

    function scheduleSetup(delay = 0) {
      if (setupTimer) {
        clearTimeout(setupTimer);
      }

      setupTimer = setTimeout(() => {
        setupTimer = null;
        runSetup();
      }, delay);
    }

    function scheduleRefreshOrRebuild(forceRebuild = false) {
      if (rebuildTimer) {
        clearTimeout(rebuildTimer);
      }

      rebuildTimer = setTimeout(() => {
        rebuildTimer = null;

        const nextViewportMode = mobileMedia.matches ? 'mobile' : 'desktop';

        if (forceRebuild || nextViewportMode !== currentViewportMode) {
          runSetup();
          return;
        }

        ScrollTrigger.refresh();
      }, 160);
    }

    if (resolvedInitDelay) scheduleSetup(resolvedInitDelay);
    else runSetup();

    if (mobileMedia.addEventListener) {
      mobileMedia.addEventListener('change', () => scheduleRefreshOrRebuild(true));
    } else if (mobileMedia.addListener) {
      mobileMedia.addListener(() => scheduleRefreshOrRebuild(true));
    }

    window.addEventListener('resize', () => scheduleRefreshOrRebuild(false), { passive: true });
    window.addEventListener('orientationchange', () => scheduleRefreshOrRebuild(true));
    window.addEventListener('pageshow', () => scheduleRefreshOrRebuild(false));
    window.addEventListener('load', () => scheduleRefreshOrRebuild(false));

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => scheduleRefreshOrRebuild(false));
    }
  });


  /* ══════════════════════════════════════════════════════
     SETUP — called once the intro is done
  ══════════════════════════════════════════════════════ */
  function setup() {

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {

    /* ── helpers ──────────────────────────────────────── */
    const qs  = (sel, ctx = document) => ctx.querySelector(sel);
    const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const isMobile = window.matchMedia('(max-width: 900px)').matches;

    /* ease presets */
    const EASE_OUT  = 'expo.out';
    const EASE_IN   = 'expo.in';
    const DUR_FAST  = 0.55;
    const DUR_MED   = 0.85;
    const DUR_SLOW  = 1.1;

    function createResettingReveal(
      target,
      fromVars,
      toVars,
      trigger,
      start = 'top 88%',
      end = 'bottom 6%',
      scrub = 0.8
    ) {
      if (!target) return;

      const {
        duration: _duration,
        delay: _delay,
        ease: _ease,
        overwrite: _overwrite,
        ...visibleVars
      } = toVars;

      const exitVars = {
        ...fromVars,
        overwrite: 'auto'
      };

      gsap.set(target, fromVars);

      const tl = gsap.timeline({
        defaults: { overwrite: 'auto' },
        scrollTrigger: {
          trigger,
          start,
          end,
          scrub
        }
      });

      tl.to(target, {
        ...visibleVars,
        duration: 0.42,
        ease: EASE_OUT
      })
      .to({}, { duration: 0.16 })
      .to(target, {
        ...exitVars,
        duration: 0.42,
        ease: EASE_IN
      });

      ScrollTrigger.create({
        trigger,
        start,
        onEnter() {
          gsap.set(target, fromVars);
        },
        onEnterBack() {
          gsap.set(target, fromVars);
        }
      });
    }

    function createSimpleReveal(
      target,
      fromVars,
      toVars,
      trigger,
      start = 'top 88%'
    ) {
      if (!target) return;

      gsap.set(target, fromVars);

      ScrollTrigger.create({
        trigger: trigger || target,
        start,
        onEnter() {
          gsap.to(target, {
            ...toVars,
            overwrite: 'auto'
          });
        },
        onLeaveBack() {
          gsap.set(target, fromVars);
        }
      });
    }

    function revealTeamGridCards(container, mobileMode = false) {
      const teamGrids = qsa('.team-grid', container);

      if (mobileMode) {
        const cards = qsa('.team-grid .card', container);
        cards.forEach((card, i) => {
          createSimpleReveal(
            card,
            { y: 34, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, delay: (i % 2) * 0.04, ease: EASE_OUT },
            card,
            'top 92%'
          );
        });
        return;
      }

      teamGrids.forEach((grid, gi) => {
        const cards = qsa('.card', grid);
        cards.forEach((card, ci) => {
          createResettingReveal(
            card,
            { y: 60, opacity: 0, scale: 0.9 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: DUR_MED,
              ease: EASE_OUT,
              delay: (gi * 0.08) + (ci * 0.1),
            },
            card,
            'top 90%'
          );
        });
      });
    }

    /* ══════════════════════════════════════════════════
       1.  HOME — EXIT  (scroll away)
           and RE-ENTRANCE (scroll back)
    ══════════════════════════════════════════════════ */
    setupHomeScrollBehavior(qs, qsa, EASE_IN, EASE_OUT, DUR_FAST, DUR_MED, isMobile);


    /* ══════════════════════════════════════════════════
       2.  ABOUT
    ══════════════════════════════════════════════════ */
    setupAbout(qs, qsa, EASE_OUT, DUR_MED, DUR_SLOW, createResettingReveal, createSimpleReveal, isMobile);


    /* ══════════════════════════════════════════════════
       3.  OFFICERS
    ══════════════════════════════════════════════════ */
    setupOfficers(qs, qsa, EASE_OUT, DUR_MED, createResettingReveal, createSimpleReveal, revealTeamGridCards, isMobile);
    setupCommitteePage(qs, qsa, EASE_OUT, DUR_MED, createResettingReveal, createSimpleReveal, revealTeamGridCards, isMobile);


    /* ══════════════════════════════════════════════════
       4.  ACTIVITIES
    ══════════════════════════════════════════════════ */
    setupActivities(qs, qsa, EASE_OUT, DUR_MED, DUR_SLOW, createResettingReveal, createSimpleReveal, isMobile);


    /* ══════════════════════════════════════════════════
       5.  CONTACT
    ══════════════════════════════════════════════════ */
    setupContact(qs, qsa, EASE_OUT, DUR_MED, createResettingReveal, createSimpleReveal, isMobile);


    /* ══════════════════════════════════════════════════
       6.  FOOTER
    ══════════════════════════════════════════════════ */
    setupFooter(qs, qsa, isMobile);

    }, document.body);

    return function cleanup() {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      ctx.revert();
    };

  } // end setup()


  /* ══════════════════════════════════════════════════════
     HOME SCROLL BEHAVIOR
  ══════════════════════════════════════════════════════ */
  function setupHomeScrollBehavior(qs, qsa, EASE_IN, EASE_OUT, DUR_FAST, DUR_MED, isMobile) {

    const homeSection   = qs('.home');
    if (!homeSection) return;

    const headline      = qs('.hero-headline');
    const headlineWrap  = qs('.hero-headline-wrapper');
    const badge         = qs('.badge');
    const subWrapper    = qs('.hero-sub-wrapper');
    const sliderEl      = qs('.slider-entrance');
    const nav           = qs('.nav');

    if (isMobile) {
      return;
    }

    /* Track whether the home elements are currently visible */
    let homeVisible = true;
    let reEnterTL = null;
    const REENTER_FAST = 0.48;

    /* ── EXIT tween (stored so we can reverse / kill it) ─── */
    function buildExitTween() {
      return gsap.timeline({ paused: true })
        /* Nav slides up */
        .to(nav, { y: -56, opacity: 0, duration: DUR_FAST, ease: EASE_IN }, 0)
        /* Badge collapses up */
        .to(badge, { y: -20, opacity: 0, duration: DUR_FAST, ease: EASE_IN }, 0)
        /* Headline falls and fades */
        .to(headlineWrap, { y: -40, opacity: 0, duration: DUR_MED, ease: EASE_IN }, 0)
        /* Sub fades downward */
        .to(subWrapper, { y: 20, opacity: 0, duration: DUR_FAST, ease: EASE_IN }, 0)
        /* Carousel shrinks away */
        .to(sliderEl, { scale: 0.82, opacity: 0, duration: DUR_FAST, ease: EASE_IN }, 0);
    }

    /* ── RE-ENTRANCE tween ─────────────────────────────── */
    function playReEntrance() {
      if (homeVisible) return;   // already visible — do nothing
      homeVisible = true;

      /* Restore CSS of headline that was replaced by typewriter spans */
      const twChars = qsa('.tw-char', headline);

      /* If typewriter markup still exists, just re-animate the chars */
      if (reEnterTL) {
        reEnterTL.kill();
      }

      reEnterTL = gsap.timeline({
        defaults: { overwrite: 'auto' }
      });

      reEnterTL
        /* reset positions */
        .set(nav,         { y: -36, opacity: 0 })
        .set(badge,       { y: -14, opacity: 0 })
        .set(headlineWrap,{ y: -24, opacity: 0 })
        .set(subWrapper,  { y:  18, opacity: 0 })
        .set(sliderEl,    { scale: 0.9, autoAlpha: 0, y: 14 })

        /* typewriter re-play */
        .set(twChars.length ? twChars : [headline], { opacity: 0 })
        .to(twChars.length ? twChars : [headline], {
          opacity:  1,
          duration: twChars.length ? 0.004 : 0.14,
          stagger:  twChars.length ? { each: 0.008, ease: 'none' } : 0,
          ease:     'none',
        })
        .to({}, { duration: 0.03 })

        /* chrome in */
        .to(nav,          { y: 0, opacity: 1,    duration: REENTER_FAST, ease: 'power3.out' }, '+=0')
        .to(badge,        { y: 0, opacity: 1,    duration: REENTER_FAST, ease: 'power3.out' }, '<+0.02')
        .to(headlineWrap, { y: 0, opacity: 1,    duration: REENTER_FAST + 0.06, ease: 'power3.out' }, '<')
        .to(subWrapper,   { y: 0, opacity: 1,    duration: REENTER_FAST + 0.08, ease: 'power2.out' }, '<+0.03')
        .to(sliderEl,     { scale: 1, autoAlpha: 1, y: 0, duration: REENTER_FAST + 0.12, ease: 'power3.out',
            onComplete() {
              const sl = qs('.slider');
              if (sl) sl.classList.add('is-spinning');
            }
          }, '<+0.05');
    }

    /* ── EXIT on scroll away ──────────────────────────── */
    const HOME_EXIT_PERCENT = 0.3;

    function getHomeExitOffset() {
      return Math.max(homeSection.offsetHeight * HOME_EXIT_PERCENT, 40);
    }

    ScrollTrigger.create({
      trigger: homeSection,
      start: 'top top',
      end: 'max',
      onUpdate(self) {
        const pastThreshold = self.scroll() > getHomeExitOffset();

        if (pastThreshold && homeVisible) {
          homeVisible = false;

          const exitTL = buildExitTween();
          exitTL.play();

          const sliderSpinner = qs('.slider');
          if (sliderSpinner) sliderSpinner.classList.remove('is-spinning');
        } else if (!pastThreshold && !homeVisible) {
          playReEntrance();
        }
      },
      onLeaveBack() {
        if (!homeVisible) {
          playReEntrance();
        }
      }
    });

  }


  /* ══════════════════════════════════════════════════════
     ABOUT
  ══════════════════════════════════════════════════════ */
  function setupAbout(qs, qsa, EASE_OUT, DUR_MED, DUR_SLOW, createResettingReveal, createSimpleReveal, isMobile) {

    const section = qs('#about');
    if (!section) return;

    const title   = qs('.title-box',    section);
    const divLine = qs('.box-top-line', section);
    const desc    = qs('.box-desc',     section);
    const descLines = qsa('.desc-line', desc);
    const imgBox  = qs('.box-left',     section);
    const cards   = qsa('.box-mission, .box-vision, .box-value', section);

    if (isMobile) {
      createSimpleReveal(
        title,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: EASE_OUT },
        title,
        'top 88%'
      );

      createSimpleReveal(
        divLine,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.55, ease: EASE_OUT, transformOrigin: 'left center' },
        title,
        'top 88%'
      );

      if (descLines.length) {
        gsap.set(descLines, { y: 26, opacity: 0, force3D: true });

        gsap.timeline({
          defaults: { overwrite: 'auto' },
          scrollTrigger: {
            trigger: desc,
            start: 'top 82%',
            end: 'bottom 34%',
            scrub: 0.4
          }
        })
          .to(descLines, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.08,
            ease: 'none'
          }, 0)
          .to({}, { duration: 0.14 })
          .to(descLines, {
            y: -26,
            opacity: 0,
            duration: 0.55,
            stagger: {
              each: 0.12,
              from: 'end'
            },
            ease: 'none'
          }, '+=0');
      }

      [imgBox, ...cards].forEach((el, i) => {
        createSimpleReveal(
          el,
          { y: 32, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, delay: i * 0.06, ease: EASE_OUT },
          el,
          'top 90%'
        );
      });
      return;
    }

    /* ── Title & divider ──────────────────────────────── */
    if (title) {
      createResettingReveal(
        title,
        { x: -60, opacity: 0 },
        { x: 0, opacity: 1, duration: DUR_MED, ease: EASE_OUT },
        title,
        'top 70%',
        'bottom -1%'
      );

      if (divLine) {
        createResettingReveal(
          divLine,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: DUR_SLOW, ease: EASE_OUT, delay: 0.08, transformOrigin: 'left center' },
          title,
          'top 70%',
          'bottom -1%'
        );
      }
    }

    /* ── Description ──────────────────────────────────── */
    if (descLines.length) {
      gsap.set(descLines, { x: 60, opacity: 0, force3D: true });

      gsap.timeline({
        defaults: { overwrite: 'auto' },
        scrollTrigger: {
          trigger: desc,
          start: 'top 60%',
          end: 'bottom -8%',
          scrub: 0.4
        }
      })
        .to(descLines, {
          x: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.08,
          ease: 'none'
        }, 0)
        .to({}, { duration: 0.14 })
        .to(descLines, {
          x: -60,
          opacity: 0,
          duration: 0.55,
          stagger: {
            each: 0.12,
            from: 'end'
          },
          ease: 'none'
        }, '+=0');
    }

    /* ── Left image ──────────────────────────────────── */
    createResettingReveal(
      imgBox,
      { x: -80, opacity: 0, scale: 0.92 },
      { x: 0, opacity: 1, scale: 1, duration: DUR_SLOW, ease: EASE_OUT, delay: 0.06 },
      imgBox,
      'top 60%'
    );

    /* ── Mission / Vision / Values cards ─────────────── */
    cards.forEach((card, i) => {
      createResettingReveal(
        card,
        { x: 60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: DUR_MED,
          ease: EASE_OUT,
          delay: i * 0.02,
        },
        card,
        'top 80%'
      );
    });

  }


  /* ══════════════════════════════════════════════════════
     OFFICERS
  ══════════════════════════════════════════════════════ */
  function setupCommitteePage(qs, qsa, EASE_OUT, DUR_MED, createResettingReveal, createSimpleReveal, revealTeamGridCards, isMobile) {

    const page = qs('.committee-page');
    if (!page) return;

    const header = qs('.committee-copy', page);

    if (isMobile) {
      createSimpleReveal(
        header,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: EASE_OUT },
        header,
        'top 88%'
      );

      revealTeamGridCards(page, true);
      return;
    }

    createResettingReveal(
      header,
      { x: -70, opacity: 0 },
      { x: 0, opacity: 1, duration: DUR_MED, ease: EASE_OUT },
      header,
      'top 85%',
      'bottom 0%'
    );

    revealTeamGridCards(page, false);

  }


  function setupOfficers(qs, qsa, EASE_OUT, DUR_MED, createResettingReveal, createSimpleReveal, revealTeamGridCards, isMobile) {

    const section = qs('#officers');
    if (!section) return;

    /* ── Hero row (headline + president card) ───────── */
    const heroLeft = qs('.hero-left',  section);
    const heroCard = qs('.hero-card',  section);
    const committeeLabel = qs('.committee-preview-label', section);

    if (isMobile) {
      createSimpleReveal(
        heroLeft,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: EASE_OUT },
        heroLeft,
        'top 88%'
      );

      createSimpleReveal(
        heroCard,
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: EASE_OUT },
        heroCard,
        'top 90%'
      );

      revealTeamGridCards(section, true);
      return;
    }

    createResettingReveal(
      heroLeft,
      { x: -70, opacity: 0 },
      { x: 0, opacity: 1, duration: DUR_MED, ease: EASE_OUT },
      heroLeft,
      'top 85%',
      'bottom 0%'
    );

    createResettingReveal(
      heroCard,
      { x: 70, opacity: 0, scale: 0.94 },
      { x: 0, opacity: 1, scale: 1, duration: DUR_MED, ease: EASE_OUT, delay: 0.1 },
      heroCard,
      'top 85%',
      'bottom 0%'
    );

    createResettingReveal(
      committeeLabel,
      { y: 26, opacity: 0, letterSpacing: '.18em' },
      { y: 0, opacity: 1, letterSpacing: '.08em', duration: DUR_MED, ease: EASE_OUT },
      committeeLabel,
      'top 88%',
      'bottom 18%',
      0.45
    );

    /* ── Team cards ──────────────────────────────────── */
    revealTeamGridCards(section, false);

  }


  /* ══════════════════════════════════════════════════════
     ACTIVITIES
  ══════════════════════════════════════════════════════ */
  function setupActivities(qs, qsa, EASE_OUT, DUR_MED, DUR_SLOW, createResettingReveal, createSimpleReveal, isMobile) {

    const section = qs('#activities');
    if (!section) return;

    const wrapper  = qs('.wrapper', section);
    const header   = qs('.header',  section);
    const folders  = qsa('.folder', section);

    if (isMobile) {
      createSimpleReveal(
        wrapper,
        { y: 28, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: EASE_OUT },
        wrapper || section,
        'top 90%'
      );

      if (header) {
        const title = qs('.header-title', header);
        const desc  = qs('.header-desc',  header);

        createSimpleReveal(
          title,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: EASE_OUT },
          title,
          'top 88%'
        );

        createSimpleReveal(
          desc,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: EASE_OUT },
          desc,
          'top 90%'
        );
      }

      folders.forEach((folder, i) => {
        createSimpleReveal(
          folder,
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, delay: i * 0.05, ease: EASE_OUT },
          folder,
          'top 92%'
        );
      });
      return;
    }

    /* ── Wrapper ─────────────────────────────────────── */
    createResettingReveal(
      wrapper,
      { y: 72, opacity: 0, scale: 0.94 },
      { y: 0, opacity: 1, scale: 1, duration: DUR_SLOW, ease: EASE_OUT },
      wrapper || section,
      'top 88%',
      'bottom 10%',
      0.42
    );

    /* ── Header ──────────────────────────────────────── */
    if (header) {
      const title = qs('.header-title', header);
      const desc  = qs('.header-desc',  header);

      createResettingReveal(
        title,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: DUR_MED, ease: EASE_OUT },
        title
      );

      createResettingReveal(
        desc,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: DUR_MED, ease: EASE_OUT, delay: 0.18 },
        desc
      );
    }

    /* ── Folder cards ────────────────────────────────── */
    /* Fan in from bottom with slight rotation per card   */
    const rotations = [-4, 0, 4];

    folders.forEach((folder, i) => {
      const rot = rotations[i] ?? 0;
      createResettingReveal(
        folder,
        { y: 80, opacity: 0, rotation: rot * 1.8, scale: 0.88 },
        {
          y: 0,
          opacity: 1,
          rotation: 0,
          scale: 1,
          duration: DUR_SLOW,
          ease: EASE_OUT,
          delay: i * 0.13,
        },
        folder,
        'top 90%'
      );
    });

  }


  /* ══════════════════════════════════════════════════════
     CONTACT
  ══════════════════════════════════════════════════════ */
  function setupContact(qs, qsa, EASE_OUT, DUR_MED, createResettingReveal, createSimpleReveal, isMobile) {

    const section = qs('#contact');
    if (!section) return;

    const arcWrap   = qs('.arc-wrap',          section);
    const arcSvg    = qs('.arc-svg',           section);
    const infoPanel = qs('.contact-info-panel', section);

    if (isMobile) {
      createSimpleReveal(
        arcWrap,
        { y: 30, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: EASE_OUT },
        arcWrap,
        'top 88%'
      );

      createSimpleReveal(
        arcSvg,
        { rotation: -45, opacity: 1, transformOrigin: '50% 50%' },
        { rotation: 0, opacity: 1, duration: 0.8, ease: EASE_OUT, transformOrigin: '50% 50%' },
        arcWrap || arcSvg,
        'top 82%'
      );

      createSimpleReveal(
        infoPanel,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: EASE_OUT },
        infoPanel,
        'top 92%'
      );

      const blocks = qsa('.contact-info-block', section);
      blocks.forEach((block, i) => {
        createSimpleReveal(
          block,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: i * 0.08, ease: EASE_OUT },
          block,
          'top 94%'
        );
      });
      return;
    }

    createResettingReveal(
      arcSvg,
      { x: -180, rotation: -180, opacity: 1, scale: 1, transformOrigin: '50% 50%' },
      { x: 0, rotation: 0, opacity: 1, scale: 1, duration: DUR_MED, ease: EASE_OUT, transformOrigin: '50% 50%' },
      arcWrap || arcSvg,
      'top 42%',
      'bottom 8%',
      0.28
    );

    createResettingReveal(
      arcWrap,
      { x: -80, opacity: 0, scale: 0.9 },
      { x: 0, opacity: 1, scale: 1, duration: DUR_MED, ease: EASE_OUT },
      arcWrap,
      'top 85%'
    );

    createResettingReveal(
      infoPanel,
      { x: 80, opacity: 0, scale: 0.9 },
      { x: 0, opacity: 1, scale: 1, duration: DUR_MED, ease: EASE_OUT, delay: 0.12 },
      infoPanel,
      'top 85%'
    );

    /* individual info blocks stagger */
    const blocks = qsa('.contact-info-block', section);
    blocks.forEach((block, i) => {
      createResettingReveal(
        block,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: DUR_MED,
          ease: EASE_OUT,
          delay: 0.25 + i * 0.12,
        },
        block,
        'top 90%'
      );
    });

  }


  /* ══════════════════════════════════════════════════════
     FOOTER
  ══════════════════════════════════════════════════════ */
  function setupFooter(qs, qsa, isMobile) {

    const footer = qs('footer');
    if (!footer) return;

    const contactSection = qs('#contact');
    const brand = qs('.footer-brand', footer);
    const grid = qs('.footer-grid', footer);
    const bottom = qs('.footer-bottom', footer);
    const brandLogo = qs('.footer-brand-logo', footer);
    const brandName = qs('.footer-brand-name', footer);
    const brandSub = qs('.footer-brand-sub', footer);
    const aboutCol = qs('.footer-col-about', footer);
    const navCol = qs('.footer-col-nav', footer);
    const navLinks = qsa('.footer-nav-link', footer);
    const copy = qs('.footer-copy', footer);

    const liftTrigger = contactSection || footer;

    if (isMobile) {
      gsap.set(footer, {
        yPercent: 22,
        force3D: true
      });

      gsap.set([brand, grid, bottom, brandLogo, brandName, brandSub, aboutCol, navCol, copy], {
        y: 24,
        opacity: 0,
        force3D: true
      });

      gsap.set(navLinks, {
        y: 14,
        opacity: 0,
        force3D: true
      });

      const footerTL = gsap.timeline({
        defaults: {
          ease: 'none',
          overwrite: 'auto'
        },
        scrollTrigger: {
          trigger: liftTrigger,
          start: contactSection ? 'bottom bottom' : 'top bottom',
          end: contactSection ? 'bottom 55%' : 'top 55%',
          scrub: 0.35
        }
      });

      footerTL
        .to(footer, { yPercent: 0 }, 0)
        .to([brand, grid, bottom], { y: 0, opacity: 1, stagger: 0.08 }, 0.12)
        .to([brandLogo, brandName, brandSub, aboutCol, navCol, copy], { y: 0, opacity: 1, stagger: 0.04 }, 0.18)
        .to(navLinks, { y: 0, opacity: 1, stagger: 0.03 }, 0.24);

      return;
    }

    gsap.set(footer, {
      yPercent: 48,
      force3D: true
    });

    gsap.set([brand, grid, bottom], {
      y: 70,
      opacity: 0,
      force3D: true
    });

    gsap.set([brandLogo, brandName, brandSub, aboutCol, navCol, copy], {
      y: 24,
      opacity: 0,
      force3D: true
    });

    gsap.set(navLinks, {
      y: 18,
      opacity: 0,
      force3D: true
    });

    const footerTL = gsap.timeline({
      defaults: {
        ease: 'none',
        overwrite: 'auto'
      },
      scrollTrigger: {
        trigger: liftTrigger,
        start: contactSection ? 'bottom bottom' : 'top bottom',
        end: contactSection ? 'bottom 35%' : 'top 35%',
        scrub: 0.65
      }
    });

    footerTL
      .to(footer, {
        yPercent: 0
      }, 0)
      .to(brand, {
        y: 0,
        opacity: 1
      }, 0.08)
      .to(grid, {
        y: 0,
        opacity: 1
      }, 0.16)
      .to(bottom, {
        y: 0,
        opacity: 1
      }, 0.24)
      .to(brandLogo, {
        y: 0,
        opacity: 1
      }, 0.12)
      .to(brandName, {
        y: 0,
        opacity: 1
      }, 0.16)
      .to(brandSub, {
        y: 0,
        opacity: 1
      }, 0.2)
      .to(aboutCol, {
        y: 0,
        opacity: 1
      }, 0.2)
      .to(navCol, {
        y: 0,
        opacity: 1
      }, 0.24)
      .to(navLinks, {
        y: 0,
        opacity: 1,
        stagger: 0.04
      }, 0.28)
      .to(copy, {
        y: 0,
        opacity: 1
      }, 0.34);

  }


})(); // IIFE end
