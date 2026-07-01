/* ========================================
   PVL HUB — Notification Center
   ----------------------------------------
   Generates favorite-team notifications (game reminders, ticket nudges),
   tracks read state, and injects a bell + dropdown into the nav. Built so it
   maps directly onto native push once the app ships: inside the native
   wrapper it registers for push via window.PVLNative and can render pushes
   pushed in from the OS.
   ======================================== */
(function (global) {
  'use strict';

  var READ_KEY = 'pvl_notifs_read';   // array of dismissed/seen notification ids
  var PUSH_KEY = 'pvl_push_optin';    // whether the user opted into push

  // PVLApi / Toast are `const` globals (lexical, not window properties) —
  // reach them by bare name via typeof, never as global.PVLApi.
  function api() { return (typeof PVLApi !== 'undefined') ? PVLApi : null; }
  function isLoggedIn() { var a = api(); return !!(a && a.isLoggedIn && a.isLoggedIn()); }
  function toast(msg, type) { if (typeof Toast !== 'undefined' && Toast.show) Toast.show(msg, type || 'info'); }

  function readSet() {
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); }
    catch (e) { return new Set(); }
  }
  function persistRead(set) {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set)));
  }

  function fmtCountdown(dateStr) {
    var ms = new Date(dateStr) - new Date();
    if (ms <= 0) return 'now';
    var days = Math.floor(ms / 86400000);
    var hours = Math.floor((ms % 86400000) / 3600000);
    if (days >= 1) return 'in ' + days + ' day' + (days > 1 ? 's' : '');
    if (hours >= 1) return 'in ' + hours + ' hr' + (hours > 1 ? 's' : '');
    return 'soon';
  }

  var PVLNotify = {
    /**
     * Build the current notification list from the user's favorite teams'
     * upcoming matches. Each notification has a stable id so read-state sticks.
     */
    build: function () {
      if (!global.PVLFav || !global.PVLData) return [];
      var read = readSet();
      var list = [];

      PVLFav.getTeamObjects().forEach(function (team) {
        var match = PVLData.nextMatchForTeam(team.id);
        if (!match) return;
        var oppId = match.home === team.id ? match.away : match.home;
        var opp = PVLData.teamById(oppId);
        var id = 'match:' + team.id + ':' + match.date;
        list.push({
          id: id,
          teamId: team.id,
          color: team.color,
          icon: '🏐',
          title: team.short + ' play ' + fmtCountdown(match.date),
          body: 'vs ' + (opp ? opp.short : 'TBD') + ' • ' + match.venue + '. Tune in — or grab tickets and go!',
          date: match.date,
          ticketUrl: match.ticketUrl,
          read: read.has(id)
        });
      });

      list.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
      return list;
    },

    unreadCount: function () {
      return this.build().filter(function (n) { return !n.read; }).length;
    },

    markAllRead: function () {
      var set = readSet();
      this.build().forEach(function (n) { set.add(n.id); });
      persistRead(set);
      this.refreshBadge();
    },

    markRead: function (id) {
      var set = readSet();
      set.add(id);
      persistRead(set);
      this.refreshBadge();
    },

    // ---- Native push bridge (no-op on web) ----
    isNativeApp: function () {
      return !!(global.PVLNative ||
        (global.Capacitor && typeof global.Capacitor.isNativePlatform === 'function' && global.Capacitor.isNativePlatform()));
    },

    /** Ask the native layer to register for push and store opt-in. */
    enablePush: function () {
      localStorage.setItem(PUSH_KEY, '1');
      if (this.isNativeApp() && global.PVLNative && typeof global.PVLNative.registerPush === 'function') {
        try { global.PVLNative.registerPush(); } catch (e) { /* ignore */ }
      }
    },

    pushEnabled: function () { return localStorage.getItem(PUSH_KEY) === '1'; },

    // ---- UI ----
    refreshBadge: function () {
      var badge = document.getElementById('notif-badge');
      if (!badge) return;
      var n = this.unreadCount();
      badge.textContent = n > 9 ? '9+' : String(n);
      badge.style.display = n > 0 ? '' : 'none';
    },

    renderPanel: function () {
      var listEl = document.getElementById('notif-list');
      if (!listEl) return;
      var notifs = this.build();

      if (!isLoggedIn()) {
        listEl.innerHTML = '<div class="notif-empty">Log in to get alerts for your favorite teams.</div>';
        return;
      }
      if (!notifs.length) {
        listEl.innerHTML = '<div class="notif-empty">No alerts yet. Pick your favorite teams on ' +
          '<a href="myfeed.html">My Feed</a> to get game reminders.</div>';
        return;
      }

      listEl.innerHTML = notifs.map(function (n) {
        return '<div class="notif-item' + (n.read ? '' : ' unread') + '" data-id="' + n.id + '">' +
          '<span class="notif-dot" style="background:' + n.color + '"></span>' +
          '<div class="notif-body">' +
            '<div class="notif-title">' + n.icon + ' ' + n.title + '</div>' +
            '<div class="notif-text">' + n.body + '</div>' +
            '<a class="notif-cta" href="' + n.ticketUrl + '" target="_blank" rel="noopener">Get Tickets →</a>' +
          '</div></div>';
      }).join('');

      // Mark an item read when its ticket link is clicked.
      Array.prototype.forEach.call(listEl.querySelectorAll('.notif-item'), function (el) {
        el.addEventListener('click', function () {
          PVLNotify.markRead(el.dataset.id);
          el.classList.remove('unread');
        });
      });
    },

    /** Inject the bell + dropdown into the nav's right-hand section. */
    injectBell: function () {
      var navRight = document.querySelector('.nav-right');
      if (!navRight || document.getElementById('notif-bell')) return;

      var wrap = document.createElement('div');
      wrap.className = 'notif-wrap';
      wrap.innerHTML =
        '<button class="notif-bell" id="notif-bell" title="Notifications" aria-label="Notifications">' +
          '🔔<span class="notif-badge" id="notif-badge" style="display:none">0</span>' +
        '</button>' +
        '<div class="notif-panel" id="notif-panel">' +
          '<div class="notif-panel-head">' +
            '<strong>Notifications</strong>' +
            '<button class="notif-readall" id="notif-readall">Mark all read</button>' +
          '</div>' +
          '<div class="notif-list" id="notif-list"></div>' +
          '<div class="notif-panel-foot">' +
            '<label class="notif-push"><input type="checkbox" id="notif-push-toggle"> ' +
            'Push alerts for my teams</label>' +
          '</div>' +
        '</div>';

      // Insert before the theme toggle if present, else append.
      var themeToggle = navRight.querySelector('#theme-toggle');
      if (themeToggle) navRight.insertBefore(wrap, themeToggle);
      else navRight.appendChild(wrap);

      var bell = wrap.querySelector('#notif-bell');
      var panel = wrap.querySelector('#notif-panel');

      bell.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = panel.classList.toggle('open');
        if (open) PVLNotify.renderPanel();
      });
      document.addEventListener('click', function (e) {
        if (!wrap.contains(e.target)) panel.classList.remove('open');
      });

      wrap.querySelector('#notif-readall').addEventListener('click', function (e) {
        e.stopPropagation();
        PVLNotify.markAllRead();
        PVLNotify.renderPanel();
      });

      var pushToggle = wrap.querySelector('#notif-push-toggle');
      pushToggle.checked = this.pushEnabled();
      pushToggle.addEventListener('change', function () {
        if (pushToggle.checked) {
          PVLNotify.enablePush();
          toast(PVLNotify.isNativeApp()
            ? 'Push notifications enabled for your teams!'
            : 'Saved! You\'ll get push alerts once you install the PVL Hub app.', 'success');
        } else {
          localStorage.removeItem(PUSH_KEY);
        }
      });

      this.refreshBadge();
    },

    init: function () {
      // Only show the bell to logged-in users.
      if (!isLoggedIn()) return;
      this.injectBell();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    // Run after auth.js has set up the nav.
    setTimeout(function () { PVLNotify.init(); }, 0);
  });

  global.PVLNotify = PVLNotify;
})(window);
