// /js/consent-banner.js
(function () {
  const BAR_ID = 'cookie-bar';

  function ensureBarExists() {
    let bar = document.getElementById(BAR_ID);
    if (bar) return bar;

    // Crea el banner si no existe en el HTML
    bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.setAttribute('aria-label', 'Preferencias de privacidad');

    // Estilos inline (igual a tu versión actual)
    bar.style.position = 'fixed';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.bottom = '0';
    bar.style.display = 'none';
    bar.style.zIndex = '9999';
    bar.style.background = '#0f172a';
    bar.style.color = '#fff';
    bar.style.font = '14px/1.4 system-ui';
    bar.style.webkitFontSmoothing = 'antialiased';

    // Contenido HTML
    bar.innerHTML = `
      <div style="max-width:1100px;margin:0 auto;padding:14px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between">
        <div style="max-width:760px">
          Usamos cookies para métricas y mejoras del sitio. Puedes aceptar todo o continuar solo con lo esencial.
          <a href="/politica-privacidad/" style="color:#a5b4fc;text-decoration:underline">Más info</a>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="btn-essential" style="background:#374151;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer">Solo esenciales</button>
          <button id="btn-reject" style="background:#6b7280;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer">Rechazar</button>
          <button id="btn-accept" style="background:#16a34a;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer">Aceptar todo</button>
        </div>
      </div>
    `;

    document.body.appendChild(bar);
    return bar;
  }

  function showBar() {
    if (!window.__hoggaConsentChosen) {
      const bar = ensureBarExists();
      bar.style.display = 'block';
    }
  }

  function hideBar() {
    const bar = document.getElementById(BAR_ID);
    if (bar) bar.style.display = 'none';
  }

  function applyAndSave(choice, values) {
    try {
      localStorage.setItem(
        'hogga_consent_pref',
        JSON.stringify({ choice, values, ts: Date.now() })
      );
    } catch (e) {}

    // gtag existe porque consent.js define stub temprano
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', values);
    }

    window.__hoggaConsentChosen = true;
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
    // Si ya eligió antes, no mostramos nada
    if (window.__hoggaConsentChosen) return;

    const bar = ensureBarExists();
    const btnAccept = document.getElementById('btn-accept');
    const btnEssential = document.getElementById('btn-essential');
    const btnReject = document.getElementById('btn-reject');

    // Seguridad: si algo raro pasó, no rompemos
    if (!bar || !btnAccept || !btnEssential || !btnReject) return;

    btnAccept.addEventListener('click', () =>
      applyAndSave('accept_all', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted'
      })
    );

    btnEssential.addEventListener('click', essentials);
    btnReject.addEventListener('click', essentials);

    showBar();
  });
})();
