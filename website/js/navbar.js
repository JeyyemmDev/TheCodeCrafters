(function initNavbarModule() {
  const BREAKPOINT = 900;

  const state = {
    initialized: false,
    open: false,
    nav: null,
    toggle: null,
    menu: null,
    links: [],
    line1: null,
    line2: null,
    iconTL: null,
    menuTL: null,
    revealTimer: null,
    introObserver: null,
    resizeObserver: null,
    cleanup: []
  };

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }
  }

  function getNavigationType() {
    const entries = window.performance && performance.getEntriesByType
      ? performance.getEntriesByType('navigation')
      : [];

    if (entries.length && entries[0].type) {
      return entries[0].type;
    }

    if (window.performance && performance.navigation) {
      return performance.navigation.type === 2 ? 'back_forward' : '';
    }

    return '';
  }

  function isMobileViewport() {
    return window.innerWidth <= BREAKPOINT;
  }

  function killNavbarTweens() {
    if (state.iconTL) {
      state.iconTL.kill();
      state.iconTL = null;
    }

    if (state.menuTL) {
      state.menuTL.kill();
      state.menuTL = null;
    }

    if (window.gsap) {
      gsap.killTweensOf([state.nav, state.toggle, state.menu, state.line1, state.line2, ...state.links].filter(Boolean));
    }
  }

  function clearMobileRevealWatch() {
    if (state.revealTimer) {
      clearTimeout(state.revealTimer);
      state.revealTimer = null;
    }

    if (state.introObserver) {
      state.introObserver.disconnect();
      state.introObserver = null;
    }
  }

  function introIsVisible() {
    const intro = document.querySelector('.intro-screen');

    if (!intro) {
      return false;
    }

    const style = window.getComputedStyle(intro);
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.01;
  }

  function setClosedIconState() {
    gsap.set([state.line1, state.line2], {
      rotation: 0,
      y: 0,
      backgroundColor: '#1a1a1a'
    });
  }

  function setClosedMenuState() {
    state.open = false;
    state.menu.classList.remove('active');
    state.toggle.setAttribute('aria-expanded', 'false');
    state.menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    gsap.set(state.menu, {
      clipPath: 'inset(0 0 100% 0)',
      pointerEvents: 'none',
      opacity: 0
    });

    gsap.set(state.links, { opacity: 0, x: -60 });
    setClosedIconState();
  }

  function syncFixedMobileControls() {
    if (!isMobileViewport()) {
      return;
    }

    gsap.set(state.nav, { y: 0, opacity: 1 });
    gsap.set(state.toggle, {
      y: 0,
      x: 0,
      autoAlpha: 1,
      clearProps: 'transform'
    });
  }

  function revealMobileControlsWhenReady() {
    if (!isMobileViewport()) {
      clearMobileRevealWatch();
      return;
    }

    clearMobileRevealWatch();

    const reveal = () => {
      clearMobileRevealWatch();
      syncFixedMobileControls();
      scrollNav();
    };

    const revealAfterIntro = () => {
      if (window.__skipHomeIntro) {
        reveal();
        return;
      }

      clearMobileRevealWatch();
      state.revealTimer = setTimeout(reveal, 2000);
    };

    if (!introIsVisible()) {
      reveal();
      return;
    }

    const intro = document.querySelector('.intro-screen');
    state.introObserver = new MutationObserver(() => {
      if (!introIsVisible()) {
        revealAfterIntro();
      }
    });

    state.introObserver.observe(intro, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    state.revealTimer = setTimeout(reveal, 6500);
  }

  function resetAfterHistoryRestore() {
    if (!state.initialized) {
      initNavbar();

      if (!state.initialized) {
        return;
      }
    }

    if (!isMobileViewport()) {
      scrollNav();

      if (window.ScrollTrigger) {
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }

      return;
    }

    killNavbarTweens();
    setClosedMenuState();
    revealMobileControlsWhenReady();
    scrollNav();

    if (window.ScrollTrigger) {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }

  function scrollNav() {
    if (!state.nav) {
      return;
    }

    state.nav.classList.toggle('scrolled', window.scrollY > 10);
  }

  function openNav() {
    killNavbarTweens();
    state.open = true;
    state.menu.classList.add('active');
    state.toggle.setAttribute('aria-expanded', 'true');
    state.menu.setAttribute('aria-hidden', 'false');

    gsap.set(state.menu, { pointerEvents: 'auto', opacity: 1 });

    state.iconTL = gsap.timeline()
      .to(state.line1, { y: 5, rotation: 42, backgroundColor: '#fff', duration: 0.38, ease: 'expo.out' }, 0)
      .to(state.line2, { y: -5, rotation: -42, backgroundColor: '#fff', duration: 0.38, ease: 'expo.out' }, 0);

    state.menuTL = gsap.timeline();
    state.menuTL.to(state.nav, { opacity: 0, duration: 0.15 });
    state.menuTL.fromTo(state.menu,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 0.65, ease: 'expo.inOut' }
    );
    state.menuTL.fromTo(state.links,
      { opacity: 0, x: -70 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.09, ease: 'expo.out' },
      '-=0.35'
    );
  }

  function closeNav(instant = false) {
    killNavbarTweens();
    state.open = false;
    state.toggle.setAttribute('aria-expanded', 'false');
    state.menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    state.iconTL = gsap.timeline()
      .to(state.line1, { y: 0, rotation: 0, backgroundColor: '#1a1a1a', duration: instant ? 0 : 0.38 }, 0)
      .to(state.line2, { y: 0, rotation: 0, backgroundColor: '#1a1a1a', duration: instant ? 0 : 0.38 }, 0);

    if (instant) {
      setClosedMenuState();
      gsap.set(state.nav, { opacity: 1 });
      syncFixedMobileControls();
      return;
    }

    state.menuTL = gsap.timeline({
      onComplete: () => {
        state.menu.classList.remove('active');
        gsap.set(state.menu, { pointerEvents: 'none', opacity: 0 });
      }
    });

    state.menuTL.to(state.links, { opacity: 0, x: -40, duration: 0.22, stagger: 0.04 });
    state.menuTL.to(state.menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.55, ease: 'expo.inOut' });
    state.menuTL.to(state.nav, { opacity: 1, duration: 0.25 });
  }

  function addListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    state.cleanup.push(() => target.removeEventListener(type, handler, options));
  }

  function cleanupListeners() {
    state.cleanup.forEach(cleanup => cleanup());
    state.cleanup = [];

    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
      state.resizeObserver = null;
    }

    clearMobileRevealWatch();
  }

  function initNavbar() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.mobile-menu');
    const links = [...document.querySelectorAll('.mobile-link')];
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');

    if (!nav || !toggle || !menu || !line1 || !line2) {
      return;
    }

    if (state.initialized && state.toggle === toggle) {
      return;
    }

    cleanupListeners();
    killNavbarTweens();

    state.initialized = true;
    state.open = false;
    state.nav = nav;
    state.toggle = toggle;
    state.menu = menu;
    state.links = links;
    state.line1 = line1;
    state.line2 = line2;

    toggle.setAttribute('aria-controls', menu.id || 'mobileMenu');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');

    gsap.set(nav, { y: -80, opacity: 0 });
    gsap.set(toggle, { y: -16, autoAlpha: 0 });
    setClosedMenuState();
    revealMobileControlsWhenReady();

    addListener(window, 'scroll', scrollNav, { passive: true });
    addListener(toggle, 'click', () => state.open ? closeNav() : openNav());
    links.forEach(link => addListener(link, 'click', () => closeNav()));
    addListener(document, 'keydown', event => {
      if (event.key === 'Escape' && state.open) {
        closeNav();
      }
    });

    state.resizeObserver = new ResizeObserver(() => {
      if (window.innerWidth > BREAKPOINT && state.open) {
        closeNav(true);
      }
    });
    state.resizeObserver.observe(document.body);

    scrollNav();
  }

  ready(initNavbar);

  window.addEventListener('pageshow', event => {
    if (isMobileViewport()) {
      requestAnimationFrame(resetAfterHistoryRestore);
      return;
    }

    if (event.persisted || getNavigationType() === 'back_forward') {
      resetAfterHistoryRestore();
    }
  });

  window.addEventListener('pagehide', () => {
    if (state.initialized && state.open) {
      closeNav(true);
    }
  });
})();
