(function () {
  window.goToweb = function () {
    sessionStorage.setItem('skipHomeIntro', '1');
    window.location.href = '../../index.html#activities';
  };

  if (!window.gsap) {
    document.querySelectorAll('.hero-prompt, .block-content, .hero-scroll-hint').forEach((el) => {
      el.style.opacity = '1';
    });
    return;
  }

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const backBtn = document.getElementById('backBtn') || document.querySelector('.back-btn-wrapper');
  const heroPrompt = document.querySelector('.hero-prompt');
  const heroTitle = document.querySelector('.hero-title');
  const heroSub = document.querySelector('.hero-sub');
  const heroScrollHint = document.querySelector('.hero-scroll-hint');

  if (backBtn) {
    gsap.fromTo(backBtn, { opacity: 0, x: -30 }, {
      opacity: 1,
      x: 0,
      duration: 0.7,
      ease: 'power3.out',
      delay: 0.2
    });
  }

  gsap.set('.hero-title', { opacity: 1 });
  gsap.set('.hero-sub', { opacity: 1 });
  gsap.set('.block-content', { opacity: 0 });
  gsap.set('.block-revealer', { scaleX: 0, transformOrigin: 'left center' });

  function runBlockReveal() {
    const blockWords = document.querySelectorAll('.block-reveal');

    gsap.set('.block-content', { opacity: 0 });
    gsap.set('.block-revealer', { scaleX: 0, transformOrigin: 'left center' });

    blockWords.forEach((word, i) => {
      const blockContent = word.querySelector('.block-content');
      const blockRevealer = word.querySelector('.block-revealer');
      if (!blockContent || !blockRevealer) return;

      gsap.timeline({
        delay: 0.3 + (i * 0.35),
        defaults: { ease: 'power4.inOut' }
      })
        .to(blockRevealer, { scaleX: 1, duration: 0.55 })
        .to(blockContent, { opacity: 1, duration: 0.01 })
        .set(blockRevealer, { transformOrigin: 'right center' })
        .to(blockRevealer, { scaleX: 0, duration: 0.6 });
    });
  }

  gsap.set(heroPrompt, { opacity: 0, y: 20 });
  if (heroScrollHint) {
    gsap.set(heroScrollHint, { opacity: 0 });
  }

  const heroIntro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  if (heroPrompt) {
    heroIntro.to(heroPrompt, { opacity: 1, y: 0, duration: 0.7, delay: 0.3 });
  }
  if (heroScrollHint) {
    heroIntro.to(heroScrollHint, { opacity: 1, duration: 0.5 }, '+=1.8');
  }

  runBlockReveal();

  if (window.ScrollTrigger && document.querySelector('.hero')) {
    let heroExited = false;

    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      onLeave: () => {
        heroExited = true;
        gsap.to([heroPrompt, heroScrollHint].filter(Boolean), {
          y: -50,
          opacity: 0,
          duration: 0.5,
          ease: 'power3.in',
          stagger: 0.06
        });
        gsap.to([heroTitle, heroSub].filter(Boolean), {
          y: -50,
          duration: 0.5,
          ease: 'power3.in',
          stagger: 0.06
        });
        gsap.to('.block-content', {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in'
        });
      },
      onEnterBack: () => {
        if (!heroExited) return;
        heroExited = false;

        gsap.set([heroPrompt, heroScrollHint].filter(Boolean), { y: -50, opacity: 0 });
        gsap.set([heroTitle, heroSub].filter(Boolean), { y: -50 });
        gsap.set('.block-content', { opacity: 0 });

        gsap.to([heroPrompt, heroScrollHint].filter(Boolean), {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.1,
          delay: 0.1
        });
        gsap.to([heroTitle, heroSub].filter(Boolean), {
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.1,
          delay: 0.1
        });

        setTimeout(runBlockReveal, 150);
      }
    });
  }

  const spineFill = document.getElementById('spineFill');
  const timelineWrapper = document.querySelector('.timeline-wrapper');
  if (window.ScrollTrigger && spineFill && timelineWrapper) {
    ScrollTrigger.create({
      trigger: timelineWrapper,
      start: 'top 80%',
      end: 'bottom 20%',
      onUpdate: (self) => {
        spineFill.style.height = (self.progress * 100) + '%';
      }
    });
  }

  function initCardAnimations() {
    if (!window.ScrollTrigger) return;

    ScrollTrigger.getAll().filter((st) => st.vars && st.vars._card).forEach((st) => st.kill());
    const mobile = window.innerWidth <= 768;

    document.querySelectorAll('.timeline-item').forEach((item, i) => {
      const card = item.querySelector('.event-card');
      const dot = item.querySelector('.dot');
      if (!card || !dot) return;

      dot.classList.remove('active');

      gsap.set(card, { opacity: 0, y: 35, x: mobile ? 0 : (i % 2 === 0 ? -45 : 45) });
      gsap.set(dot, { scale: 0 });

      const tl = gsap.timeline({ paused: true })
        .to(dot, { scale: 1, duration: 0.35, ease: 'back.out(2.5)' })
        .to(card, { opacity: 1, y: 0, x: 0, duration: 0.6, ease: 'power3.out' }, '-=0.1');

      function resetItem() {
        tl.pause(0);
        dot.classList.remove('active');
        gsap.set(card, { opacity: 0, y: 35, x: mobile ? 0 : (i % 2 === 0 ? -45 : 45) });
        gsap.set(dot, { scale: 0 });
      }

      ScrollTrigger.create({
        trigger: item,
        start: 'top bottom',
        end: 'bottom top',
        _card: true,
        onEnter: () => { resetItem(); tl.play(0); dot.classList.add('active'); },
        onEnterBack: () => { resetItem(); tl.play(0); dot.classList.add('active'); },
        onLeave: () => resetItem(),
        onLeaveBack: () => resetItem()
      });
    });
  }

  initCardAnimations();

  if (window.ScrollTrigger && document.querySelector('.section-header')) {
    gsap.from('.section-header', {
      scrollTrigger: { trigger: '.section-header', start: 'top 80%', toggleActions: 'play none none reset' },
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power2.out'
    });
  }

  if (window.ScrollTrigger && document.querySelector('.timeline-end')) {
    gsap.from('.timeline-end', {
      scrollTrigger: { trigger: '.timeline-end', start: 'top 85%', toggleActions: 'play none none reset' },
      opacity: 0,
      y: 20,
      duration: 0.7,
      ease: 'power2.out'
    });
  }

  const typedEl = document.getElementById('typedText') || document.querySelector('[data-typed-text]');
  if (typedEl) {
    const text = typedEl.dataset.typedText || 'show workshops --logs';
    const typeSpeed = 80;
    const deleteSpeed = 40;
    const pauseAfterType = 1800;
    const pauseAfterDelete = 500;
    let i = 0;
    let deleting = false;

    function tick() {
      if (!deleting) {
        typedEl.textContent = text.slice(0, i + 1);
        i++;
        if (i === text.length) {
          setTimeout(() => { deleting = true; tick(); }, pauseAfterType);
          return;
        }
        setTimeout(tick, typeSpeed);
        return;
      }

      typedEl.textContent = text.slice(0, i - 1);
      i--;
      if (i === 0) {
        setTimeout(() => { deleting = false; tick(); }, pauseAfterDelete);
        return;
      }
      setTimeout(tick, deleteSpeed);
    }

    tick();
  }

  window.imgFail = function (wrapId) {
    const wrap = document.getElementById(wrapId);
    if (wrap) wrap.classList.add('img-failed');
  };

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initCardAnimations();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, 200);
  });
})();
