/* ============================================================
   SH TRANSPORT — Interacciones del sitio (v4 · fix autoavance)
   ------------------------------------------------------------
   - Header con sombra al hacer scroll
   - Menú móvil accesible
   - Reveal con IntersectionObserver + contadores
   - Resaltado de navegación activa
   - Año automático del footer
   - Hero con slideshow de fondo (auto-rotativo cada 3s)
   ============================================================ */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header con sombra al hacer scroll ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Menú móvil ---------- */
  const nav = document.getElementById('nav-principal');
  const navToggle = document.querySelector('.nav-toggle');

  const closeNav = () => {
    if (!nav || !nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('nav-open');
  };

  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('nav-open', isOpen);
    });

    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        navToggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) closeNav();
    });
  }

  /* ---------- Contadores animados ---------- */
  const animateCounter = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  /* ---------- Reveal al hacer scroll ---------- */
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('is-visible');

      const counter = entry.target.querySelector('[data-count]');
      if (counter && !counter.dataset.done) {
        counter.dataset.done = 'true';
        animateCounter(counter);
      }

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Navegación activa según sección visible ---------- */
  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.nav__link')];

  if (sections.length && navLinks.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(s => sectionObserver.observe(s));
  }

  /* ---------- Año del footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ════════════════════════════════════════════════════════════
     HERO SLIDESHOW DE FONDO
     ────────────────────────────────────────────────────────────
     · Autoavance SIEMPRE activo (cada data-duration ms del HTML).
     · Ya NO se bloquea con prefers-reduced-motion.
     · Los dots se generan solos según el número de slides.
     ════════════════════════════════════════════════════════════ */
  const heroSlideshow = document.querySelector('.hero__slideshow');
  const slides = document.querySelectorAll('.hero__slide');
  const dotsContainer = document.querySelector('.hero__dots');

  if (heroSlideshow && dotsContainer && slides.length > 1) {

    // Leer duración desde el HTML (data-duration="3000").
    // Fallback a 3000ms si el atributo no existe o es inválido.
    const SLIDE_DURATION = Number(heroSlideshow.dataset.duration) || 3000;

    let currentSlide = 0;
    let slideTimer = null;
    const dots = [];

    // Función que cambia de slide
    const goToSlide = (index) => {
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      currentSlide = index;
    };

    const nextSlide = () => {
      goToSlide((currentSlide + 1) % slides.length);
    };

    // Reinicia el temporizador (autoavance SIEMPRE)
    const resetTimer = () => {
      if (slideTimer) clearInterval(slideTimer);
      slideTimer = setInterval(nextSlide, SLIDE_DURATION);
    };

    // Generar dots dinámicamente
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero__dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ir a la imagen ${i + 1} de ${slides.length}`);
      dot.addEventListener('click', () => {
        goToSlide(i);
        resetTimer();
      });
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });

    // Estado inicial
    goToSlide(0);

    // Pausa al pasar el mouse (solo desktop)
    if (window.matchMedia('(hover: hover)').matches) {
      heroSlideshow.parentElement.addEventListener('mouseenter', () => {
        if (slideTimer) clearInterval(slideTimer);
      });
      heroSlideshow.parentElement.addEventListener('mouseleave', resetTimer);
    }

    // Pausa cuando la pestaña no está visible (ahorro de recursos)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (slideTimer) clearInterval(slideTimer);
      } else {
        resetTimer();
      }
    });

    // ⬇️ ARRANCAR EL AUTOAVANCE INMEDIATAMENTE AL CARGAR LA PÁGINA
    resetTimer();
  }

})();