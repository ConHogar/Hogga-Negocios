// /js/consent.js
(function () {
  // Asegura dataLayer + gtag (por si algún template se equivoca)
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

  // 1) Default global: CL/LatAm (como lo tienes hoy)
  gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  // 2) Override EEA/UK/CH/NO/IS/LI: todo denied por defecto
  gtag('consent', 'default', {
    region: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','CH','GB'],
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  // 3) Aplica preferencia guardada ANTES de GTM
  try {
    if (new URLSearchParams(location.search).get('consent') === 'reset') {
      localStorage.removeItem('hogga_consent_pref');
    }

    const prefRaw = localStorage.getItem('hogga_consent_pref');
    if (prefRaw) {
      const pref = JSON.parse(prefRaw);
      if (pref && pref.values) {
        gtag('consent', 'update', pref.values);
        window.__hoggaConsentChosen = true;
      }
    }
  } catch (e) {
    // silencio a propósito
  }
})();
