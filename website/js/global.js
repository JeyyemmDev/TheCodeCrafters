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
window.__skipHomeIntro = sessionStorage.getItem("skipHomeIntro") === "1";
window.__homeScrollAnimationsReady = false;
let skippedHomeTargetApplied = false;
let skippedHomeLoadHandled = false;

function hideSkippedHomeIntroScreen() {
  const intro = document.querySelector(".intro-screen");

  if (intro) {
    intro.style.opacity = "0";
    intro.style.display = "none";
  }
}

function scrollToSkippedHomeTarget() {
  const target = window.location.hash ? document.querySelector(window.location.hash) : null;

  if (!target) {
    return;
  }

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  target.scrollIntoView({ behavior: "auto", block: "start" });
  root.style.scrollBehavior = previousScrollBehavior;
}

function resetSkippedHomeIntroToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function applySkippedHomeTarget() {
  if (skippedHomeTargetApplied) {
    return;
  }

  skippedHomeTargetApplied = true;
  scrollToSkippedHomeTarget();
  sessionStorage.removeItem("skipHomeIntro");

  if (skippedHomeLoadHandled) {
    window.__skipHomeIntro = false;
  }
}

function correctSkippedHomeTargetPosition() {
  const target = window.location.hash ? document.querySelector(window.location.hash) : null;

  if (!target) {
    return;
  }

  if (Math.abs(target.getBoundingClientRect().top) > 2) {
    scrollToSkippedHomeTarget();
  }
}

function settleSkippedHomeIntroState() {
  const homeSection = document.querySelector(".home");
  const isMobile = window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
  const pastHome = homeSection
    ? window.scrollY > Math.max(homeSection.offsetHeight * 0.3, 40)
    : false;
  const showHomeContent = isMobile || !pastHome;
  const showNav = isMobile || showHomeContent;

  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");
  const badge = document.querySelector(".badge");
  const headline = document.querySelector(".hero-headline");
  const headlineWrap = document.querySelector(".hero-headline-wrapper");
  const subWrapper = document.querySelector(".hero-sub-wrapper");
  const sliderEntrance = document.querySelector(".slider-entrance");
  const slider = document.querySelector(".slider");

  gsap.set(nav, {
    y: showNav ? 0 : -56,
    opacity: showNav ? 1 : 0
  });

  gsap.set(navToggle, {
    y: showNav ? 0 : -16,
    autoAlpha: showNav ? 1 : 0
  });

  gsap.set(badge, {
    y: showHomeContent ? 0 : -20,
    opacity: showHomeContent ? 1 : 0
  });

  gsap.set(headlineWrap, {
    y: showHomeContent ? 0 : -40,
    opacity: showHomeContent ? 1 : 0
  });

  gsap.set(headline, { opacity: 1 });

  gsap.set(subWrapper, {
    y: showHomeContent ? 0 : 20,
    opacity: showHomeContent ? 1 : 0
  });

  gsap.set(sliderEntrance, {
    y: 0,
    scale: showHomeContent ? 1 : 0.82,
    autoAlpha: showHomeContent ? 1 : 0
  });

  if (slider) {
    slider.classList.toggle("is-spinning", showHomeContent);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.__skipHomeIntro) {
    return;
  }

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  hideSkippedHomeIntroScreen();
  resetSkippedHomeIntroToTop();
  settleSkippedHomeIntroState();
});

window.addEventListener("home:scroll-animations-ready", () => {
  if (!window.__skipHomeIntro) {
    return;
  }

  requestAnimationFrame(applySkippedHomeTarget);
}, { once: true });

window.addEventListener("load", () => {
  const skipHomeIntro = window.__skipHomeIntro === true;

  if (skipHomeIntro) {
    skippedHomeLoadHandled = true;
    hideSkippedHomeIntroScreen();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (skippedHomeTargetApplied) {
          correctSkippedHomeTargetPosition();
          window.__skipHomeIntro = false;
        } else if (window.__homeScrollAnimationsReady) {
          applySkippedHomeTarget();
        }
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
