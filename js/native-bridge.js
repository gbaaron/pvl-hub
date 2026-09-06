/* ========================================
   PVL HUB — Native Bridge

   Loaded first on every page. In a browser it is very nearly a no-op.
   Inside the Capacitor shell it does three jobs:

     1. Repoints the API at the live Netlify origin. The app bundle is 100%
        local files (App Store Guideline 4.2 — a wrapper that only loads a
        website gets rejected), so a relative "/.netlify/functions/..." would
        resolve against the app's own origin and fail. Rather than touch every
        call site, we wrap window.fetch once and rewrite root-relative API
        paths on the way out. Only data leaves the device.

     2. Wraps the native plugins the hub actually uses — haptics, status bar,
        keyboard, splash, local notifications — behind calls that degrade
        silently on the web.

     3. Hooks the two places where the hub already tells the user something
        happened (Toast, PVLApi writes) so those moments get a real tap on the
        wrist instead of only a rectangle sliding in from the right.

   Every method here must be safe to call in a plain browser tab.
   ======================================== */

(function () {
  var isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  /* CHANGE ME if the Netlify site name changes — the native build has no
     other way to find the functions. */
  var LIVE_ORIGIN = 'https://pvl-hub.netlify.app';

  /* Root-relative paths that must be sent to the live origin when running
     inside the app. Everything else (local html/css/js/images) stays local. */
  function isApiPath(p) {
    return p.indexOf('/.netlify/') === 0 || p.indexOf('/api/') === 0;
  }

  function plugin(name) {
    return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name]) || null;
  }

  /* ── 1. fetch shim ──────────────────────────────────────────────────────
     Installed immediately, before any hub code runs, so no early call can
     slip past it. */
  if (isNative && typeof window.fetch === 'function') {
    var nativeFetch = window.fetch.bind(window);

    window.fetch = function (input, init) {
      try {
        if (typeof input === 'string' && isApiPath(input)) {
          input = LIVE_ORIGIN + input;
        } else if (input && typeof Request !== 'undefined' && input instanceof Request) {
          // A Request carries an already-absolute .url; rebuild it only if it
          // resolved against the app's own origin.
          var m = (input.url || '').match(/^[a-z]+:\/\/[^/]+(\/.*)$/i);
          if (m && isApiPath(m[1])) input = new Request(LIVE_ORIGIN + m[1], input);
        } else if (input && typeof URL !== 'undefined' && input instanceof URL) {
          if (isApiPath(input.pathname)) input = LIVE_ORIGIN + input.pathname + input.search;
        }
      } catch (e) { /* fall through with the original input */ }
      return nativeFetch(input, init);
    };
  }

  var NativeBridge = {
    isNative: isNative,
    API_BASE: isNative ? LIVE_ORIGIN : '',

    /* Haptics — locking in a prediction, earning credits, a card landing.
       The moments worth a tap on the wrist. */
    tap: function (style) {
      var H = plugin('Haptics');
      if (!H) return;
      try { H.impact({ style: style || 'MEDIUM' }); } catch (e) {}
    },
    buzz: function (type) {
      var H = plugin('Haptics');
      if (!H) return;
      try { H.notification({ type: type || 'SUCCESS' }); } catch (e) {}
    },

    /* Local notification — "your predictions score tonight", "packs reset".
       On-device only; APNs push is the next piece of work. */
    notify: async function (title, body, atDate) {
      var LN = plugin('LocalNotifications');
      if (!LN) return false;
      try {
        var perm = await LN.checkPermissions();
        if (perm.display !== 'granted') {
          perm = await LN.requestPermissions();
          if (perm.display !== 'granted') return false;
        }
        await LN.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 100000),
            title: title,
            body: body,
            schedule: atDate ? { at: new Date(atDate) } : undefined,
          }],
        });
        return true;
      } catch (e) { return false; }
    },

    hideSplash: async function () {
      var S = plugin('SplashScreen');
      if (!S) return;
      try { await S.hide(); } catch (e) {}
    },

    /* ── Hooks into code that already exists ───────────────────────────────
       The hub already announces its own successes. Rather than edit a dozen
       call sites, wrap the two chokepoints once. */
    _hookToast: function () {
      if (!window.Toast || window.Toast.__nativeHooked) return;
      var show = window.Toast.show.bind(window.Toast);
      window.Toast.show = function (message, type, duration) {
        NativeBridge.buzz(type === 'error' ? 'ERROR' : type === 'success' || type === 'credits' ? 'SUCCESS' : 'WARNING');
        return show(message, type, duration);
      };
      window.Toast.__nativeHooked = true;
    },

    _hookApi: function () {
      if (!window.PVLApi || window.PVLApi.__nativeHooked) return;

      /* Locking in predictions is the one moment in the hub with a deadline
         attached, so it is the one that earns a reminder. */
      var submit = window.PVLApi.submitPrediction.bind(window.PVLApi);
      window.PVLApi.submitPrediction = async function (predictions) {
        var result = await submit(predictions);
        NativeBridge.buzz('SUCCESS');
        var at = new Date(Date.now() + 6 * 60 * 60 * 1000);
        NativeBridge.notify('Your picks are locked in', 'Match results are landing — see how your predictions scored.', at);
        return result;
      };

      window.PVLApi.__nativeHooked = true;
    },

    /* A tap on anything that behaves like a button. Delegated once, so new
       DOM added later is covered without re-binding. */
    _wireHaptics: function () {
      document.addEventListener('click', function (e) {
        var t = e.target && e.target.closest && e.target.closest(
          'button, .btn, .nav-auth-btn, .nav-avatar, .nav-toggle, a.card, .card-link, .tab, .filter-btn'
        );
        if (t) NativeBridge.tap('LIGHT');
      }, true);
    },

    /* Top-level links to somewhere else on the internet belong in Safari, not
       trapped in the app's own webview with no way back. Same-origin links and
       iframes (the embedded card + manager games) are left alone. */
    _wireExternalLinks: function () {
      document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest && e.target.closest('a[href^="http"]');
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (href.indexOf(LIVE_ORIGIN) === 0) return;
        e.preventDefault();
        window.open(href, '_system');
      });
    },

    init: function () {
      if (!isNative) return;
      document.documentElement.classList.add('is-native');

      var SB = plugin('StatusBar');
      if (SB) { try { SB.setStyle({ style: 'DARK' }); } catch (e) {} }

      var KB = plugin('Keyboard');
      if (KB) {
        try {
          KB.addListener('keyboardWillShow', function () { document.body.classList.add('kb-open'); });
          KB.addListener('keyboardWillHide', function () { document.body.classList.remove('kb-open'); });
        } catch (e) {}
      }

      /* Gesture-back at the root should not kill the app. */
      var A = plugin('App');
      if (A) {
        try {
          A.addListener('backButton', function (e) {
            if (e.canGoBack) window.history.back();
            else A.exitApp();
          });
        } catch (e) {}
      }

      this._hookToast();
      this._hookApi();
      this._wireHaptics();
      this._wireExternalLinks();

      /* Give the page a beat to paint before the splash lifts. */
      var self = this;
      setTimeout(function () { self.hideSplash(); }, 500);
    },
  };

  window.NativeBridge = NativeBridge;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { NativeBridge.init(); });
  } else {
    NativeBridge.init();
  }
})();
