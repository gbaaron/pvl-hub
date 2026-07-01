/**
 * PVLLaunch — smart cross-product launcher for the PVL network.
 *
 * The PVL ecosystem is three interconnected-but-separate products:
 *   - PVL Hub                (this site / app)
 *   - PVL Fantasy Card Game
 *   - PVL Manager Game
 *
 * Launch behaviour, by environment:
 *   - Desktop / web browser  -> open the game's website in a NEW screen (tab).
 *   - Mobile web browser     -> try to deep-link into the installed native
 *                               app; if it isn't installed, fall back to the
 *                               App/Play Store (or, until the app is published,
 *                               to the web version).
 *   - Inside the native PVL   -> hand off to the native layer via the
 *     Hub app                  `window.PVLNative` bridge, which does installed-
 *                               app detection + App Store routing natively.
 *
 * The native wrapper (Capacitor / WKWebView) injects `window.PVLNative`.
 * Until that app exists, everything degrades gracefully to web behaviour.
 */
(function (global) {
  'use strict';

  // Product registry. Fill in `scheme` / store URLs as each native app ships.
  // While a store URL is empty we treat the app as "not published yet" and
  // keep the user on the web instead of bouncing them to a dead link.
  var PRODUCTS = {
    manager: {
      name: 'PVL Manager Game',
      webUrl: 'https://pvl-management-game.netlify.app',
      scheme: 'pvlmanager://',   // TODO: confirm deep-link scheme when the app is built
      iosStoreUrl: '',           // TODO: App Store URL once published
      androidStoreUrl: ''        // TODO: Play Store URL once published
    },
    cards: {
      name: 'PVL Fantasy Card Game',
      webUrl: 'https://pvlcardgame.netlify.app',
      scheme: 'pvlcards://',
      iosStoreUrl: '',
      androidStoreUrl: ''
    },
    hub: {
      name: 'PVL Hub',
      webUrl: global.location ? global.location.origin : '',
      scheme: 'pvlhub://',
      iosStoreUrl: '',
      androidStoreUrl: ''
    }
  };

  function platform() {
    var ua = (global.navigator && global.navigator.userAgent) || '';
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'web';
  }

  function isNativeApp() {
    return !!(global.PVLNative ||
      (global.Capacitor &&
        typeof global.Capacitor.isNativePlatform === 'function' &&
        global.Capacitor.isNativePlatform()));
  }

  function notify(msg, type) {
    // Toast is a `const` global (lexical, not a window property).
    if (typeof Toast !== 'undefined' && typeof Toast.show === 'function') {
      Toast.show(msg, type || 'info');
    }
  }

  function openWeb(cfg) {
    var win = global.open(cfg.webUrl, '_blank', 'noopener');
    if (!win) global.location.href = cfg.webUrl; // popup blocked -> navigate instead
  }

  // Try to open the installed native app; fall back to store or web.
  function deepLinkWithFallback(cfg, plat) {
    var storeUrl = plat === 'ios' ? cfg.iosStoreUrl : cfg.androidStoreUrl;
    var hidden = false;
    var onVisibility = function () { if (global.document.hidden) hidden = true; };

    global.document.addEventListener('visibilitychange', onVisibility);

    var fallback = setTimeout(function () {
      global.document.removeEventListener('visibilitychange', onVisibility);
      if (hidden) return; // app opened -> page was backgrounded, stop here.
      if (storeUrl) {
        global.location.href = storeUrl;
      } else {
        // App not on the store yet — be honest and keep them on the web.
        notify(cfg.name + ' isn’t on the App Store yet — opening the web version.', 'info');
        openWeb(cfg);
      }
    }, 1200);

    try {
      global.location.href = cfg.scheme;
    } catch (e) {
      clearTimeout(fallback);
      global.document.removeEventListener('visibilitychange', onVisibility);
      openWeb(cfg);
    }
  }

  /**
   * Launch a sibling PVL product.
   * @param {string} productKey - 'manager' | 'cards' | 'hub'
   */
  function launch(productKey) {
    var cfg = PRODUCTS[productKey];
    if (!cfg) { console.warn('[PVLLaunch] unknown product:', productKey); return; }

    // 1) Inside the native PVL app — let native handle installed-app detection
    //    and App Store routing.
    if (isNativeApp() && global.PVLNative && typeof global.PVLNative.openProduct === 'function') {
      global.PVLNative.openProduct(productKey, cfg);
      return;
    }

    // 2) Mobile web — attempt the deep-link, fall back to store/web.
    var plat = platform();
    if ((plat === 'ios' || plat === 'android') && cfg.scheme) {
      deepLinkWithFallback(cfg, plat);
      return;
    }

    // 3) Desktop / default web — open the game in a new screen.
    openWeb(cfg);
  }

  global.PVLLaunch = {
    launch: launch,
    isNativeApp: isNativeApp,
    platform: platform,
    PRODUCTS: PRODUCTS
  };
})(window);
