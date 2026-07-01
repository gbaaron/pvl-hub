/* ========================================
   PVL HUB — Personalization (favorite teams & players)
   ----------------------------------------
   Stores a user's favorite teams and players and builds their personalized
   feed. Persists on the pvl_user object in localStorage (demo), best-effort
   syncs to the backend, and migrates the legacy single favorite_team /
   favorite_player fields so nothing is lost.
   ======================================== */
(function (global) {
  'use strict';

  var PENDING_KEY = 'pvl_pending_favs'; // set at registration, applied on first login

  // NOTE: PVLApi is declared `const` in api.js, which makes it a lexical
  // global (accessible by bare name) but NOT a property of window. So we must
  // reference it by name via typeof, never as global.PVLApi.
  function api() {
    return (typeof PVLApi !== 'undefined') ? PVLApi : null;
  }

  function getUser() {
    var a = api();
    return (a && a.getCurrentUser && a.getCurrentUser()) || null;
  }

  function saveUser(user) {
    localStorage.setItem('pvl_user', JSON.stringify(user));
  }

  function asArray(v) {
    if (Array.isArray(v)) return v.slice();
    if (typeof v === 'string' && v.trim()) return [v.trim()];
    return [];
  }

  // Merge legacy single fields + any pending onboarding picks into the arrays.
  function normalize(user) {
    if (!user) return user;
    var teams = asArray(user.favorite_teams);
    var players = asArray(user.favorite_players);

    if (!teams.length && user.favorite_team) teams = asArray(user.favorite_team);
    if (!players.length && user.favorite_player) players = asArray(user.favorite_player);

    // Apply onboarding picks captured before the account existed.
    try {
      var pending = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
      if (pending) {
        if (!teams.length && pending.teams) teams = asArray(pending.teams);
        if (!players.length && pending.players) players = asArray(pending.players);
        localStorage.removeItem(PENDING_KEY);
      }
    } catch (e) { /* ignore */ }

    user.favorite_teams = teams;
    user.favorite_players = players;
    return user;
  }

  var PVLFav = {
    /** Favorite team full names. */
    getTeams: function () {
      var user = getUser();
      if (!user) return [];
      normalize(user);
      return user.favorite_teams.slice();
    },

    /** Favorite player names. */
    getPlayers: function () {
      var user = getUser();
      if (!user) return [];
      normalize(user);
      return user.favorite_players.slice();
    },

    /** Resolve favorite teams to full team objects from PVLData. */
    getTeamObjects: function () {
      if (!global.PVLData) return [];
      return this.getTeams()
        .map(function (name) { return PVLData.teamByName(name); })
        .filter(Boolean);
    },

    setTeams: function (teams) { return this._save('favorite_teams', asArray(teams)); },
    setPlayers: function (players) { return this._save('favorite_players', asArray(players)); },

    toggleTeam: function (name) {
      var teams = this.getTeams();
      var i = teams.indexOf(name);
      if (i === -1) teams.push(name); else teams.splice(i, 1);
      return this.setTeams(teams);
    },

    togglePlayer: function (name) {
      var players = this.getPlayers();
      var i = players.indexOf(name);
      if (i === -1) players.push(name); else players.splice(i, 1);
      return this.setPlayers(players);
    },

    hasTeam: function (name) { return this.getTeams().indexOf(name) !== -1; },
    hasPlayer: function (name) { return this.getPlayers().indexOf(name) !== -1; },

    isPersonalized: function () {
      return this.getTeams().length > 0 || this.getPlayers().length > 0;
    },

    _save: function (field, value) {
      var user = getUser();
      if (!user) return false;
      normalize(user);

      var prev = asArray(user[field]);
      user[field] = value;
      // Keep legacy single fields in sync for backward compatibility.
      if (field === 'favorite_teams') user.favorite_team = value[0] || '';
      if (field === 'favorite_players') user.favorite_player = value[0] || '';
      saveUser(user);

      // Track follow/unfollow diffs — valuable personalization data for the league.
      if (typeof Tracking !== 'undefined') {
        var isTeam = field === 'favorite_teams';
        var track = isTeam ? Tracking.teamFollow : Tracking.playerFollow;
        if (track) {
          value.filter(function (v) { return prev.indexOf(v) === -1; })
            .forEach(function (v) { track(v, true); });
          prev.filter(function (v) { return value.indexOf(v) === -1; })
            .forEach(function (v) { track(v, false); });
        }
      }

      // Best-effort backend sync (won't block the UI).
      var a = api();
      if (a && a.updateUserProfile) {
        var payload = {};
        payload[field] = value;
        payload[field === 'favorite_teams' ? 'favorite_team' : 'favorite_player'] = value[0] || '';
        a.updateUserProfile(payload).catch(function () {});
      }
      return true;
    },

    /**
     * Save onboarding picks before an account exists (register flow).
     * Applied automatically on the user's first authenticated page load.
     */
    savePending: function (teams, players) {
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify({
          teams: asArray(teams),
          players: asArray(players)
        }));
      } catch (e) { /* ignore */ }
    },

    /**
     * Build the personalized feed: for each favorite team, the next upcoming
     * match (with tickets) plus recent write-ups. Sorted so imminent games
     * surface first. Returns [] when nothing is personalized.
     */
    buildFeed: function () {
      if (!global.PVLData) return [];
      var items = [];
      var teams = this.getTeamObjects();

      teams.forEach(function (team) {
        var match = PVLData.nextMatchForTeam(team.id);
        if (match) {
          var opponentId = match.home === team.id ? match.away : match.home;
          var opponent = PVLData.teamById(opponentId);
          items.push({
            type: 'match',
            team: team,
            opponent: opponent,
            isHome: match.home === team.id,
            date: match.date,
            venue: match.venue,
            ticketUrl: match.ticketUrl,
            sortKey: new Date(match.date).getTime()
          });
        }
        (PVLData.WRITEUPS[team.id] || []).forEach(function (w) {
          items.push({
            type: 'writeup',
            team: team,
            title: w.title,
            body: w.body,
            date: w.date,
            sortKey: new Date(w.date).getTime() + 5e12 // write-ups after imminent matches
          });
        });
      });

      // Matches first (soonest first), then write-ups (newest first).
      items.sort(function (a, b) {
        if (a.type !== b.type) return a.type === 'match' ? -1 : 1;
        return a.type === 'match' ? a.sortKey - b.sortKey : b.sortKey - a.sortKey;
      });
      return items;
    }
  };

  // Normalize the current user once on load so arrays always exist.
  document.addEventListener('DOMContentLoaded', function () {
    var user = getUser();
    if (user) { normalize(user); saveUser(user); }
  });

  global.PVLFav = PVLFav;
})(window);
