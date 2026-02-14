(() => {
  'use strict';

  // ===== Config global WhatsApp =====
  const HOGGA_WA_NUMBER = '56951809138'; // único lugar a cambiar
  const buildWa = (text) =>
    `https://wa.me/${HOGGA_WA_NUMBER}?text=${encodeURIComponent(text)}`;

  // ===== Utilidades pequeñas =====
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const prefersMotion = () =>
    !window.matchMedia || window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

  // ===== Lazy loading defensivo =====
  function setupLazyImages() {
    $$('img:not([loading])').forEach(img => (img.loading = 'lazy'));
  }

  // ===== Animación del chat demo =====
  function animateChatDemo() {
    const bubbles = $$('.chat-demo .bubble');
    if (!bubbles.length || !prefersMotion()) return;

    bubbles.forEach((b, i) => {
      b.style.opacity = '0';
      b.style.transform = 'translateY(8px)';
      // Forzar repaint para que el transition se aplique correctamente
      // eslint-disable-next-line no-unused-expressions
      b.offsetHeight;
      setTimeout(() => {
        b.style.transition = 'opacity .5s ease, transform .5s ease';
        b.style.opacity = '1';
        b.style.transform = 'translateY(0)';
      }, 600 + i * 500);
    });

    // Si existe una burbuja "typing", quítala suave tras 2.6s
    const typing = $('.chat-demo .bubble.typing');
    if (typing) {
      setTimeout(() => {
        typing.style.transition = 'opacity .3s ease';
        typing.style.opacity = '0';
        setTimeout(() => typing.remove(), 320);
      }, 2600);
    }
  }

  // ===== Formulario: envío con fallback =====
  function setupLeadForm() {
    const form = document.forms['lead-form'];
    if (!form) return;

    // Configura TU endpoint real (Formspree / Worker / Supabase Edge)
    const FORM_ENDPOINT = ''; // ej: 'https://formspree.io/f/xxxxxxx'
    const WHATSAPP_FALLBACK = buildWa('Hola Hogga, necesito un dato');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

      const data = new FormData(form);

      // AbortController para evitar colgarse
      const ac = new AbortController();
      const timeout = setTimeout(() => ac.abort(), 10000); // 10s

      try {
        if (!FORM_ENDPOINT) throw new Error('No endpoint configured');

        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          body: data,
          signal: ac.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Bad status: ${res.status}`);

        // Éxito UX
        if (btn) btn.textContent = '¡Listo!';
        form.reset();

        // Restore botón luego de un respiro
        setTimeout(() => {
          if (btn) { btn.disabled = false; btn.textContent = originalText || 'Enviar'; }
        }, 1000);

      } catch (err) {
        clearTimeout(timeout);
        console.error('Form submit error:', err);

        // Fallback amable a WhatsApp
        alert('No se pudo enviar. Te redirijo a WhatsApp para ayudarte al tiro.');
        window.open(WHATSAPP_FALLBACK, '_blank', 'noopener');

        if (btn) { btn.disabled = false; btn.textContent = originalText || 'Enviar'; }
      }
    });
  }

  // ===== Año dinámico en footer (si existe #y) =====
  function setupFooterYear() {
    const y = document.getElementById('y'); // o $('#y') si tu $ es seguro
    if (y) y.textContent = new Date().getFullYear();
  }

  // 1) por si el footer ya está (home o cache rápido)
  setupFooterYear();

  // 2) por si el footer llega después (partial)
  if (window.__hoggaFooterReady) {
    setupFooterYear();
  } else {
    document.addEventListener('hogga:footer-ready', setupFooterYear, { once: true });
  }

  // ===== Email link seguro (evita scrapers) =====
  function setupEmailLink() {
    const el = document.getElementById('contact-email');
    if (!el) return;
    const user = 'hablemos'; const domain = 'hogga.cl';
    const subj = 'Quiero sumarme a Hogga';
    const body = `Hola Hogga,%0D%0A%0D%0AQuiero sumarme como proveedor / dejar una recomendación.%0D%0A` +
      `Nombre:%0D%0ACiudad:%0D%0ACategoría:%0D%0AWhatsApp:%0D%0A%0D%0AGracias.`;
    el.href = `mailto:${user}@${domain}?subject=${encodeURIComponent(subj)}&body=${body}`;
    el.setAttribute('aria-label', 'Enviar email a Hogga');
  }

  // (opcional) abre WhatsApp al pedir "formulario" por ahora
  function setupFormAlt() {
    const alt = document.getElementById('form-alt');
    if (!alt) return;
    alt.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(
        'https://wa.me/56951759158?text=Hola%20Hogga%2C%20prefiero%20enviar%20mis%20datos%20por%20formulario.%20%C2%BFMe%20lo%20pueden%20compartir%3F',
        '_blank', 'noopener'
      );
    });
  }


  // ===== Nav activo (mejora UX) =====
  function setupActiveNav() {
    const links = $$('header nav a[href^="#"]');
    const sections = links
      .map(a => document.getElementById(a.getAttribute('href').slice(1)))
      .filter(Boolean);

    if (!sections.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = $(`header nav a[href="#${id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(l => {
            l.classList.remove('active');
            l.removeAttribute('aria-current');
          });
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0.01 });

    sections.forEach(s => io.observe(s));
  }

  // ===== Prefill de ciudad en categorías (con persistencia) =====
  function setupCategoryPrefill() {
    // Preferencia persistida
    const LS_KEY = 'hogga_city';
    const defaultCity = 'Puerto Varas';
    let ciudadPreferida = localStorage.getItem(LS_KEY) || defaultCity;

    // 1) Preparar templates de href en las cards
    const cards = $$('.grid.cats .cat, .grid .cat'); // por si olvidamos .cats
    cards.forEach(card => {
      const href = card.getAttribute('href');
      if (href && !card.dataset.hrefTemplate) {
        card.dataset.hrefTemplate = href;
      }
    });

    // 2) Función para actualizar todos los href desde el template
    const applyCityToLinks = (city) => {
      const encodedCity = encodeURIComponent(city);
      cards.forEach(card => {
        const tpl = card.dataset.hrefTemplate || card.getAttribute('href') || '';
        // Reemplaza ambos formatos: [tu%20ciudad] y %5Btu%20ciudad%5D
        const updated = tpl
          .replace(/\[tu%20ciudad\]/gi, encodedCity)
          .replace(/\%5Btu%20ciudad\%5D/gi, encodedCity);
        card.setAttribute('href', updated);
      });
    };

    // 3) Marcar chip activo y escuchar clicks en chips
    const chips = $$('.chips .chip');
    const setActiveChip = (city) => {
      chips.forEach(chip => {
        const isActive = chip.textContent.trim().toLowerCase() === city.toLowerCase();
        chip.classList.toggle('active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
      });
    };

    chips.forEach(chip => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.addEventListener('click', () => {
        ciudadPreferida = chip.textContent.trim();
        localStorage.setItem(LS_KEY, ciudadPreferida);
        setActiveChip(ciudadPreferida);
        applyCityToLinks(ciudadPreferida);
      });
      chip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          chip.click();
        }
      });
    });

    // 4) Inicializar estado
    setActiveChip(ciudadPreferida);
    applyCityToLinks(ciudadPreferida);
  }

  // ===== Normaliza enlaces de WhatsApp a un solo número =====
  //    function normalizeWhatsAppLinks() {
  //      // 1) Hero / Footer / CTA sueltos
  //      $$('a[href*="wa.me"]').forEach(a => {
  //        try {
  //          const url = new URL(a.href, location.origin);
  //          const textParam = url.searchParams.get('text') || 'Hola Hogga, necesito un dato';
  //          a.href = buildWa(textParam);
  //        } catch (_) {
  //          // si falla parseo de URL, no romper
  //        }
  //      });
  //  
  // 2) JSON-LD (si alguna vez se hace dinámico, actualizar ahí también)
  //    }

  // ===== Counters (count-up on view) =====
  function setupCounters() {
    const els = document.querySelectorAll('.stat-num[data-target]');
    if (!els.length) return;

    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fmt = new Intl.NumberFormat('es-CL');

    const setFinal = el => {
      const end = Number(el.dataset.target || 0);
      const suffix = el.dataset.suffix || '';
      el.textContent = fmt.format(end) + suffix;
    };

    const animate = el => {
      const end = Number(el.dataset.target || 0);
      const suffix = el.dataset.suffix || '';
      const dur = 1200; // ms
      let startTime;

      const step = t => {
        if (!startTime) startTime = t;
        const p = Math.min((t - startTime) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const val = Math.round(end * eased);
        el.textContent = fmt.format(val) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (prefersReduced) {
      els.forEach(setFinal);
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          obs.unobserve(entry.target); // una sola vez
        }
      });
    }, { threshold: 0.4 });

    els.forEach(el => io.observe(el));
  }


  // ===== Mobile menu (hamburger) =====
  function setupMobileNav() {
    const btn = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!btn || !nav) return;

    let scrollY = 0;

    const open = () => {
      scrollY = window.scrollY || 0;

      // clase en html + body
      document.documentElement.classList.add('nav-open');
      document.body.classList.add('nav-open');

      // lock real (evita “scroll raro” en iOS)
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Cerrar menú');
    };

    const close = () => {
      // sacar clase
      document.documentElement.classList.remove('nav-open');
      document.body.classList.remove('nav-open');

      // restore scroll
      const y = Math.abs(parseInt(document.body.style.top || '0', 10)) || scrollY;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, y);

      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir menú');
    };

    const toggle = () => {
      if (document.body.classList.contains('nav-open')) close(); else open();
    };

    btn.addEventListener('click', toggle);

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // Cerrar al hacer click en un enlace del menú
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

    // Cerrar al cambiar a desktop (evita quedar "pegado")
    const mq = window.matchMedia('(min-width: 760px)');
    mq.addEventListener?.('change', () => close());

    // Cerrar al tocar fuera del header (sin “abrir y cerrar” por el mismo click)
    document.addEventListener('click', (e) => {
      if (!document.body.classList.contains('nav-open')) return;
      if (btn.contains(e.target)) return; // <- clave

      const header = document.querySelector('.main-header');
      if (header && !header.contains(e.target)) close();
    }, { capture: true });

  }




  // ===== Init =====
  document.addEventListener('DOMContentLoaded', () => {
    setupLazyImages();
    animateChatDemo();
    setupLeadForm();
    // normalizeWhatsAppLinks();
    setupFooterYear();
    setupActiveNav();
    setupCategoryPrefill();
    setupCounters(); // métricas animadas
    setupMobileNav();
    setupEmailLink();
    setupFormAlt();
  });
})();


// =======================
//  HOGGA CONSENT BANNER
// =======================
(function () {
  function showBar() {
    if (!window.__hoggaConsentChosen) {
      const bar = document.getElementById('cookie-bar');
      if (bar) bar.style.display = 'block';
    }
  }
  function hideBar() {
    const bar = document.getElementById('cookie-bar');
    if (bar) bar.style.display = 'none';
  }
  function applyAndSave(choice, values) {
    try {
      localStorage.setItem('hogga_consent_pref', JSON.stringify({ choice, values, ts: Date.now() }));
    } catch (e) { }
    if (typeof gtag === 'function') gtag('consent', 'update', values);
    hideBar();
  }
  function essentials() {
    applyAndSave('essentials_only', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const btnAccept = document.getElementById('btn-accept');
    const btnEssential = document.getElementById('btn-essential');
    const btnReject = document.getElementById('btn-reject');
    if (!btnAccept || !btnEssential || !btnReject) return;

    btnAccept.addEventListener('click', () => applyAndSave('accept_all', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    }));
    btnEssential.addEventListener('click', essentials);
    btnReject.addEventListener('click', essentials);

    if (!window.__hoggaConsentChosen) showBar();
  });
})();


function setupReviewsMarquee() {
  const marquee = document.querySelector('.reviews-marquee');
  const track = marquee?.querySelector('.reviews-track');
  const firstSet = track?.querySelector('.reviews-set');
  if (!marquee || !track || !firstSet) return;

  const update = () => {
    // ancho exacto del set A (incluye contenido real ya renderizado)
    const distance = firstSet.getBoundingClientRect().width;
    track.style.setProperty('--marquee-distance', `${distance}px`);
  };

  update();
  window.addEventListener('resize', update, { passive: true });

  // si hay fuentes web que cargan después, vuelve a medir
  document.fonts?.ready?.then(update).catch(() => { });
}

document.addEventListener('DOMContentLoaded', setupReviewsMarquee);
