/* ========================================
   PVL HUB — Native bridge (Capacitor)
   ----------------------------------------
   Implements window.PVLNative when the site is running inside the native
   PVL Hub app (Capacitor). On the plain web this is a no-op — the launcher
   and notification center already handle web behaviour themselves.

   Provides:
     - PVLNative.openProduct(key, cfg): deep-link into a sibling app
       (Card Game / Manager Game), falling back to the App Store, then web.
     - PVLNative.registerPush(): request push permission + register with APNs.
   Also listens for incoming deep links and push notifications.
   ======================================== */
(function (global) {
  'use strict';

  function isNative() {
    return !!(global.Capacitor &&
      typeof global.Capacitor.isNativePlatform === 'function' &&
      global.Capacitor.isNativePlatform());
  }

  // Plain web browser — leave PVLNative undefined so the web fallbacks run.
  if (!isNative()) return;

  var Plugins = global.Capacitor.Plugins || {};
  var App = Plugins.App;
  var Push = Plugins.PushNotifications;

  function openUrl(url) {
    if (App && App.openUrl) return App.openUrl({ url: url });
    global.location.href = url;
    return Promise.resolve({ completed: true });
  }

  global.PVLNative = {
    /**
     * Open a sibling PVL product from inside the native app:
     * try its deep-link scheme, fall back to the App Store, then the web.
     */
    openProduct: function (key, cfg) {
      var store = cfg.iosStoreUrl || '';
      var web = cfg.webUrl || '';

      function fallback() {
        if (store) { openUrl(store); }
        else if (web) { openUrl(web); }
      }

      if (cfg.scheme && App && App.openUrl) {
        openUrl(cfg.scheme).then(function (res) {
          if (!res || res.completed === false) fallback();
        }).catch(fallback);
      } else {
        fallback();
      }
    },

    /** Request push permission and register for notifications. */
    registerPush: function () {
      if (!Push) return;
      Push.requestPermissions().then(function (perm) {
        if (perm && perm.receive === 'granted') Push.register();
      });
    }
  };

  // Handle deep links opening the Hub app (e.g. pvlhub://feed).
  if (App && App.addListener) {
    App.addListener('appUrlOpen', function (data) {
      try {
        var u = new URL(data.url);
        var target = (u.host || '') + (u.pathname || '');
        // Map known routes to pages; extend as deep links are added.
        if (/feed/.test(target)) global.location.href = 'myfeed.html';
        else if (/manager/.test(target)) global.location.href = 'manager.html';
        else if (/cards/.test(target)) global.location.href = 'cards.html';
      } catch (e) { /* ignore malformed urls */ }
    });
  }

  // Push notification lifecycle.
  if (Push && Push.addListener) {
    Push.addListener('registration', function (token) {
      // TODO: POST token.value to the backend so it can target this device.
      console.log('[PVLNative] push token', token && token.value);
    });
    Push.addListener('pushNotificationReceived', function (n) {
      // Toast is a `const` global (lexical, not a window property).
      if (typeof Toast !== 'undefined' && Toast.show) Toast.show((n.title || 'PVL Hub') + ': ' + (n.body || ''), 'info');
    });
    Push.addListener('pushNotificationActionPerformed', function (action) {
      var data = (action && action.notification && action.notification.data) || {};
      if (data.page) global.location.href = data.page;
      else global.location.href = 'myfeed.html';
    });
  }
})(window);
