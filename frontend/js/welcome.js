/* ==========================================================
   FUNDSROOM ERP — Welcome Page Animations
   GSAP + ScrollTrigger Engine
   ========================================================== */

(function () {
  'use strict';

  // ---- DESIGN TOKENS (JS) ----
  const TIMING = {
    loadingDuration: 2500,
    heroStagger: 0.15,
    heroRevealDuration: 1.2,
    videoRevealDelay: 1.0,
    sectionRevealDuration: 0.8,
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ================================================
  // 1. LOADING SCREEN
  // ================================================
  function initLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    const barFill = document.getElementById('loading-bar-fill');
    const percentEl = document.getElementById('loading-percent');

    if (!screen || !barFill || !percentEl) return Promise.resolve();

    return new Promise((resolve) => {
      let progress = 0;
      const steps = [
        { target: 25, duration: 400 },
        { target: 55, duration: 500 },
        { target: 80, duration: 600 },
        { target: 100, duration: 400 },
      ];

      let stepIndex = 0;

      function animateStep() {
        if (stepIndex >= steps.length) {
          // Loading complete — fade out
          setTimeout(() => {
            screen.classList.add('hidden');
            document.body.style.overflow = '';
            setTimeout(resolve, 600);
          }, 300);
          return;
        }

        const step = steps[stepIndex];
        const startProgress = progress;
        const startTime = performance.now();

        function tick(now) {
          const elapsed = now - startTime;
          const t = Math.min(elapsed / step.duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          progress = startProgress + (step.target - startProgress) * eased;

          barFill.style.width = progress + '%';
          percentEl.textContent = Math.round(progress) + '%';

          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            stepIndex++;
            setTimeout(animateStep, 100);
          }
        }

        requestAnimationFrame(tick);
      }

      // Start after a brief pause
      document.body.style.overflow = 'hidden';
      setTimeout(animateStep, 400);
    });
  }


  // ================================================
  // 2. SCROLL PROGRESS BAR
  // ================================================
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = scrollPercent + '%';
    }, { passive: true });
  }


  // ================================================
  // 3. NAVIGATION SCROLL BEHAVIOR
  // ================================================
  function initNavigation() {
    const nav = document.getElementById('welcome-nav');
    const toggle = document.getElementById('nav-mobile-toggle');
    const links = document.getElementById('nav-links');

    if (!nav) return;

    // Scroll class
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });

    // Mobile toggle
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('mobile-open');
      });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('.welcome-nav a[href^="#"], .hero a[href^="#"], .final-cta a[href^="#"], .footer-links a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Close mobile menu
          if (links) links.classList.remove('mobile-open');
        }
      });
    });
  }


  // ================================================
  // 4. HERO SCROLL-TRIGGERED REVEAL
  // ================================================
  function initHeroReveal() {
    if (typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const eyebrow = document.getElementById('hero-eyebrow');
    const heading = document.getElementById('hero-heading');
    const description = document.getElementById('hero-description');
    const buttons = document.getElementById('hero-buttons');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const videoContainer = document.getElementById('hero-video-container');

    if (!heading) return;

    const lines = heading.querySelectorAll('.line');

    if (prefersReducedMotion) {
      // Simple fade for reduced motion
      [eyebrow, ...lines, description, buttons, scrollIndicator].forEach(el => {
        if (el) el.style.opacity = '1';
      });
      if (videoContainer) {
        videoContainer.style.opacity = '1';
        videoContainer.classList.add('revealed');
      }
      return;
    }

    // Create reveal timeline
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top 80%',
        end: 'top 20%',
        toggleActions: 'play none none none',
      },
    });

    // Eyebrow
    heroTl.fromTo(eyebrow,
      { opacity: 0, y: 30, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: TIMING.heroRevealDuration, ease: 'power3.out' }
    );

    // Heading lines
    lines.forEach((line, i) => {
      heroTl.fromTo(line,
        { opacity: 0, y: 40, scale: 0.98, filter: 'blur(8px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: TIMING.heroRevealDuration, ease: 'power3.out' },
        `-=${TIMING.heroRevealDuration - TIMING.heroStagger}`
      );
    });

    // Description
    heroTl.fromTo(description,
      { opacity: 0, y: 30, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: TIMING.heroRevealDuration * 0.8, ease: 'power3.out' },
      `-=${TIMING.heroRevealDuration - TIMING.heroStagger * 2}`
    );

    // Buttons
    heroTl.fromTo(buttons,
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: TIMING.heroRevealDuration * 0.7, ease: 'power3.out' },
      `-=${TIMING.heroRevealDuration - TIMING.heroStagger * 3}`
    );

    // Scroll Indicator
    heroTl.fromTo(scrollIndicator,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      `-=0.3`
    );

    // Video reveal (after hero text)
    if (videoContainer) {
      heroTl.to(videoContainer,
        { opacity: 1, duration: 1.5, ease: 'power2.inOut',
          onComplete: () => videoContainer.classList.add('revealed')
        },
        `-=${TIMING.videoRevealDelay}`
      );
    }

    // Hero parallax on further scroll
    gsap.to('.hero-content', {
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      y: -80,
      opacity: 0,
      ease: 'none',
    });

    // Video scale on scroll
    if (videoContainer) {
      gsap.to('#hero-video', {
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
        scale: 1.08,
        ease: 'none',
      });
    }

    // Scroll indicator fade on scroll
    if (scrollIndicator) {
      gsap.to(scrollIndicator, {
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '30% top',
          scrub: 1,
        },
        opacity: 0,
        ease: 'none',
      });
    }
  }


  // ================================================
  // 5. STATS COUNTER ANIMATION
  // ================================================
  function initStatsCounter() {
    if (typeof gsap === 'undefined') return;

    const statValues = document.querySelectorAll('.stat-value[data-target]');

    statValues.forEach(el => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const isDecimal = el.dataset.decimal === 'true';

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to({ val: 0 }, {
            val: target,
            duration: 2,
            ease: 'power2.out',
            onUpdate: function () {
              const current = this.targets()[0].val;
              if (isDecimal) {
                el.textContent = current.toFixed(1) + suffix;
              } else {
                el.textContent = Math.round(current).toLocaleString() + suffix;
              }
            },
          });
        },
      });
    });
  }


  // ================================================
  // 6. SECTION REVEAL ANIMATIONS
  // ================================================
  function initSectionReveals() {
    if (typeof gsap === 'undefined') return;

    // Fade-up reveal for section labels, headings, descriptions
    const revealElements = document.querySelectorAll(
      '.section-label, .section-heading, .section-description, .module-card, .role-card, .stat-card, .flow-step, .final-cta-heading, .final-cta-description, .final-cta-buttons'
    );

    revealElements.forEach((el, i) => {
      if (prefersReducedMotion) {
        el.style.opacity = '1';
        return;
      }

      gsap.fromTo(el,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: TIMING.sectionRevealDuration,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  }


  // ================================================
  // 7. BUSINESS FLOW SCROLL ACTIVATION
  // ================================================
  function initBusinessFlow() {
    if (typeof gsap === 'undefined') return;

    const flowSteps = document.querySelectorAll('.flow-step');
    const flowLineFill = document.getElementById('flow-line-fill');

    if (!flowSteps.length) return;

    flowSteps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 70%',
        onEnter: () => {
          step.classList.add('active');
          // Update flow line fill
          if (flowLineFill) {
            const percent = ((i + 1) / flowSteps.length) * 100;
            flowLineFill.style.height = percent + '%';
          }
        },
        onLeaveBack: () => {
          step.classList.remove('active');
          if (flowLineFill) {
            const percent = (i / flowSteps.length) * 100;
            flowLineFill.style.height = percent + '%';
          }
        },
      });
    });
  }


  // ================================================
  // 8. PRODUCT EXPERIENCE SCALE
  // ================================================
  function initProductExperience() {
    if (typeof gsap === 'undefined') return;

    const preview = document.getElementById('experience-preview');
    if (!preview) return;

    gsap.to(preview, {
      scrollTrigger: {
        trigger: preview,
        start: 'top 85%',
        end: 'top 30%',
        scrub: 1,
      },
      scale: 1,
      ease: 'power2.out',
    });
  }


  // ================================================
  // 9. MAGNETIC BUTTONS
  // ================================================
  function initMagneticButtons() {
    if (prefersReducedMotion) return;

    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }


  // ================================================
  // 10. VIDEO SOUND TOGGLE
  // ================================================
  function initVideoSound() {
    const video = document.getElementById('hero-video');
    const toggle = document.getElementById('video-sound-toggle');
    const soundOff = document.getElementById('sound-off-icon');
    const soundOn = document.getElementById('sound-on-icon');

    if (!video || !toggle) return;

    toggle.addEventListener('click', () => {
      if (video.muted) {
        video.muted = false;
        if (soundOff) soundOff.style.display = 'none';
        if (soundOn) soundOn.style.display = 'block';
      } else {
        video.muted = true;
        if (soundOff) soundOff.style.display = 'block';
        if (soundOn) soundOn.style.display = 'none';
      }
    });
  }


  // ================================================
  // INIT ALL
  // ================================================
  async function init() {
    // Wait for loading screen
    await initLoadingScreen();

    // Initialize everything else
    initScrollProgress();
    initNavigation();
    initHeroReveal();
    initStatsCounter();
    initSectionReveals();
    initBusinessFlow();
    initProductExperience();
    initMagneticButtons();
    initVideoSound();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
