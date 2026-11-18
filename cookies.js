/* =====================================================================
   Café Tramuntana · Aviso de cookies + Google Analytics 4
   ---------------------------------------------------------------------
   1. Pega aquí tu ID de medición de Google Analytics (empieza por "G-").
      Mientras siga siendo G-XXXXXXXXXX, Analytics no se carga.
   2. Este archivo debe estar en la misma carpeta que index.html,
      carta.html y legal.html.
   ===================================================================== */
var GA_ID = 'G-XXXXXXXXXX';

(function () {
  var KEY = 'tramuntana-consent';
  var VALID_DAYS = 365;          /* La elección se vuelve a pedir pasado un año */
  var gaLoaded = false;

  /* ---------- Guardar y leer la elección ---------- */
  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      if (!v || !v.date) return null;
      if (Date.now() - v.date > VALID_DAYS * 864e5) return null;
      return v;
    } catch (e) { return null; }
  }
  function save(analytics) {
    try { localStorage.setItem(KEY, JSON.stringify({ analytics: analytics, date: Date.now() })); } catch (e) {}
  }

  /* ---------- Google Analytics: solo se carga si el usuario acepta ---------- */
  function loadGA() {
    if (gaLoaded || !/^G-[A-Z0-9]+$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
    });
    gtag('js', new Date());
    gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  /* Borra las cookies de Analytics si el usuario retira el consentimiento */
  function clearGA() {
    var host = location.hostname, parts = host.split('.'), domains = ['', host];
    for (var i = 0; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid') {
        domains.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
    if (window.gtag) gtag('consent', 'update', { analytics_storage: 'denied' });
  }

  /* ---------- Banner ---------- */
  var css =
    '.ck{position:fixed;left:50%;bottom:max(1rem,env(safe-area-inset-bottom));transform:translate(-50%,20px);opacity:0;z-index:100;' +
    'width:min(560px,calc(100% - 2rem));background:#2B1D14;color:#F3EBDD;border:1px solid #2B1D14;border-radius:10px;' +
    'box-shadow:0 14px 40px rgba(43,29,20,.35);padding:1.25rem 1.3rem;font-family:"Instrument Sans",system-ui,sans-serif;font-size:.9rem;line-height:1.55;' +
    'transition:opacity .4s ease,transform .4s ease}' +
    '.ck.show{opacity:1;transform:translate(-50%,0)}' +
    '.ck h2{font-family:"Cormorant Garamond",Georgia,serif;font-size:1.45rem;font-weight:700;margin:0 0 .35rem}' +
    '.ck p{color:#C9B9A4;margin:0 0 1rem;max-width:none}' +
    '.ck p a{color:#F5C451}' +
    '.ck-actions{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}' +
    '.ck button{font:inherit;font-weight:600;cursor:pointer;padding:.8rem 1rem;border-radius:6px;border:1.5px solid #F5C451;transition:background .25s,color .25s,box-shadow .25s}' +
    '.ck .ck-yes{background:#F5C451;color:#2B1D14}' +
    '.ck .ck-no{background:#F5C451;color:#2B1D14}' +
    '.ck button:hover{box-shadow:0 0 18px rgba(255,176,46,.55)}' +
    '.ck button:focus-visible{outline:2px solid #F5C451;outline-offset:3px}' +
    '@media (prefers-reduced-motion:reduce){.ck{transition:none}}';

  var banner;
  function build() {
    if (banner) return banner;
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    banner = document.createElement('div');
    banner.className = 'ck';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'ck-title');
    banner.setAttribute('aria-describedby', 'ck-text');
    banner.innerHTML =
      '<h2 id="ck-title">Cookies</h2>' +
      '<p id="ck-text">Usamos cookies de Google Analytics para saber cuántas personas visitan la web y qué páginas consultan. ' +
      'Solo se activan si las aceptas. Puedes cambiar tu elección cuando quieras desde «Configurar cookies», en el pie de página. ' +
      '<a href="legal.html#cookies">Más información</a></p>' +
      '<div class="ck-actions">' +
      '<button type="button" class="ck-no">Rechazar</button>' +
      '<button type="button" class="ck-yes">Aceptar</button>' +
      '</div>';
    document.body.appendChild(banner);
    banner.querySelector('.ck-yes').addEventListener('click', function () { choose(true); });
    banner.querySelector('.ck-no').addEventListener('click', function () { choose(false); });
    return banner;
  }

  function show() {
    var b = build();
    b.hidden = false;
    requestAnimationFrame(function () { b.classList.add('show'); });
    b.querySelector('.ck-yes').focus({ preventScroll: true });
  }
  function hide() {
    if (!banner) return;
    banner.classList.remove('show');
    setTimeout(function () { banner.hidden = true; }, 400);
  }
  function choose(analytics) {
    var before = read();
    save(analytics);
    hide();
    if (analytics) loadGA();
    else {
      clearGA();
      /* Si Analytics ya estaba funcionando, recargar garantiza que se detenga */
      if (before && before.analytics && gaLoaded) location.reload();
    }
  }

  /* API pública: cualquier enlace con data-cookie-settings abre el banner */
  window.tramuntanaCookies = { open: show };

  function init() {
    var c = read();
    if (c === null) show();
    else if (c.analytics) loadGA();
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (t) { e.preventDefault(); show(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
