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
    let skippedIntroReadyDispatched = false;

    /* Give the intro timeline a moment to finish before we
       register ScrollTriggers (intro is ~3.5 s total).       */
    const INIT_DELAY = 4000; // ms — matches master TL duration

    const hasHome = !!document.querySelector('.home');
    const resolvedInitDelay = hasHome && !window.__skipHomeIntro ? INIT_DELAY : 0;

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
        refreshScrollTriggersFromTop();

        if (window.__skipHomeIntro && !skippedIntroReadyDispatched) {
          skippedIntroReadyDispatched = true;
          window.__homeScrollAnimationsReady = true;
          window.dispatchEvent(new CustomEvent('home:scroll-animations-ready'));
        }
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

        refreshScrollTriggersFromTop();
      }, 160);
    }

    function refreshScrollTriggersFromTop() {
      if (!window.ScrollTrigger) return;

      const savedX = window.scrollX;
      const savedY = window.scrollY;
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;

      root.style.scrollBehavior = 'auto';

      if (savedX || savedY) {
        window.scrollTo(0, 0);
      }

      ScrollTrigger.refresh();

      if (savedX || savedY) {
        window.scrollTo(savedX, savedY);
        ScrollTrigger.update();
      }

      root.style.scrollBehavior = previousScrollBehavior;
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
    ScrollTrigger.config({ autoRefreshEvents: 'DOMContentLoaded' });
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

    const HOME_EXIT_PERCENT = 0.3;

    function getHomeExitOffset() {
      return Math.max(homeSection.offsetHeight * HOME_EXIT_PERCENT, 40);
    }

    function isPastHomeThreshold(scrollValue = window.scrollY) {
      return scrollValue > getHomeExitOffset();
    }

    function setHomeExitedState() {
      gsap.set(nav, { y: -56, opacity: 0 });
      gsap.set(badge, { y: -20, opacity: 0 });
      gsap.set(headlineWrap, { y: -40, opacity: 0 });
      gsap.set(subWrapper, { y: 20, opacity: 0 });
      gsap.set(sliderEl, { y: 0, scale: 0.82, autoAlpha: 0 });
      gsap.set(headline, { opacity: 1 });

      const sliderSpinner = qs('.slider');
      if (sliderSpinner) sliderSpinner.classList.remove('is-spinning');
    }

    function setHomeVisibleState() {
      gsap.set(nav, { y: 0, opacity: 1 });
      gsap.set(badge, { y: 0, opacity: 1 });
      gsap.set(headlineWrap, { y: 0, opacity: 1 });
      gsap.set(subWrapper, { y: 0, opacity: 1 });
      gsap.set(sliderEl, { y: 0, scale: 1, autoAlpha: 1 });
      gsap.set(headline, { opacity: 1 });

      const sliderSpinner = qs('.slider');
      if (sliderSpinner) sliderSpinner.classList.add('is-spinning');
    }

    /* Track whether the home elements are currently visible */
    let homeVisible = !isPastHomeThreshold();
    if (homeVisible && window.__skipHomeIntro) {
      setHomeVisibleState();
    } else if (!homeVisible) {
      setHomeExitedState();
    }
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
    ScrollTrigger.create({
      trigger: homeSection,
      start: 'top top',
      end: 'max',
      onUpdate(self) {
        const pastThreshold = isPastHomeThreshold(self.scroll());

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
