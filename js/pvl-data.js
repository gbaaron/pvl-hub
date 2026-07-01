/* ========================================
   PVL HUB — Canonical PVL Data (demo)
   ----------------------------------------
   Single source of truth for teams, rosters, the match schedule, and
   team write-ups used by personalization, the My Feed page, and the
   notification center. This is illustrative DEMO data for the proof of
   concept — swap for live Airtable / a real schedule feed later.
   ======================================== */
(function (global) {
  'use strict';

  var CLOUD = 'https://res.cloudinary.com/djngpyv15/image/upload/';

  // The 12 PVL teams. `logo` is null where we don't have artwork yet
  // (the UI falls back to the team abbreviation).
  var TEAMS = [
    { id: 'creamline', name: 'Creamline Cool Smashers', short: 'Creamline', abbr: 'CRE', color: '#ed1f24',
      logo: CLOUD + 'v1776369727/creamline_x3ooit.png',
      players: ['Alyssa Valdez', 'Tots Carlos', 'Jia De Guzman', 'Jema Galanza', 'Kyla Atienza', 'Bea de Leon'] },
    { id: 'chocomucho', name: 'Choco Mucho Flying Titans', short: 'Choco Mucho', abbr: 'CHO', color: '#6a2c91',
      logo: CLOUD + 'v1776369734/choco_o0dgvs.png',
      players: ['Sisi Rondina', 'Kat Tolentino', 'Maddie Madayag', 'Isa Molde', 'Deanna Wong'] },
    { id: 'pldt', name: 'PLDT High Speed Hitters', short: 'PLDT', abbr: 'PLD', color: '#045397',
      logo: CLOUD + 'v1776369727/PLDT-highspeed-logo_ifvs7z.png',
      players: ['Savi Davison', 'Mika Reyes', 'Dell Palomata', 'Rhona Rosario'] },
    { id: 'cignal', name: 'Cignal HD Spikers', short: 'Cignal', abbr: 'CIG', color: '#0b3d91',
      logo: CLOUD + 'v1776369727/Cignal_Super_Spikers_fw6lgj.png',
      players: ['Vanie Gandler', 'Ces Molina', 'Roselle Baliton', 'Gel Cayuna'] },
    { id: 'akari', name: 'Akari Chargers', short: 'Akari', abbr: 'AKA', color: '#f6b816',
      logo: CLOUD + 'v1776369735/web-akari_v20tkw.png',
      players: ['Faith Nisperos', 'Dindin Santiago-Manabat', 'Fifi Sharma', 'Trisha Tubu'] },
    { id: 'cherytiggo', name: 'Chery Tiggo Crossovers', short: 'Chery Tiggo', abbr: 'CHE', color: '#e4002b',
      logo: null,
      players: ['Mylene Paat', 'EJ Laure', 'Buding Duremdes', 'Jaja Maraguinot'] },
    { id: 'petrogazz', name: 'Petro Gazz Angels', short: 'Petro Gazz', abbr: 'PET', color: '#e6007e',
      logo: null,
      players: ['Grethcel Soltones', 'Brooke Van Sickle', 'Marian Buitre', 'Djanel Cheng'] },
    { id: 'farmfresh', name: 'Farm Fresh Foxies', short: 'Farm Fresh', abbr: 'FAR', color: '#00a651',
      logo: CLOUD + 'v1776369728/FarmFresh_200x200_cpqrbs.png',
      players: ['Kim Kianna Dy', 'Mar-Jana Phillips', 'Ivy Lacsina', 'Roma Doromal'] },
    { id: 'nxled', name: 'NXLED Chameleons', short: 'NXLED', abbr: 'NXL', color: '#7ac143',
      logo: CLOUD + 'v1776369728/NXC_nkfrug.png',
      players: ['Vira Guillema', 'Jonna Perdido', 'Chelsea Dungo'] },
    { id: 'capital1', name: 'Capital1 Solar Spikers', short: 'Capital1', abbr: 'CAP', color: '#f7941d',
      logo: CLOUD + 'v1776369728/Capital1SolarSpikers_Logo_HiRes_8Rays_osvrmh.png',
      players: ['Angelica Cayuna', 'Trisha Genesis', 'Camilla Lamina'] },
    { id: 'zus', name: 'ZUS Coffee Thunderbelles', short: 'ZUS Coffee', abbr: 'ZUS', color: '#4b2e2b',
      logo: CLOUD + 'v1776369727/0-02-06-0a67ed46d08fbcfa407da78ef2dff105c4258304deab09077148b6eedb98a651_9d271377f0f6eba6_x0clj4.png',
      players: ['Aby Maraño', 'Bang Pineda', 'Kamille Cal'] },
    { id: 'galeries', name: 'Galeries Tower Highrisers', short: 'Galeries Tower', abbr: 'GTH', color: '#8e44ad',
      logo: CLOUD + 'v1776369728/GTH_rur7sc.png',
      players: ['Fille Cainglet-Cayetano', 'Necole Ebuen', 'Alina Bicar'] }
  ];

  var TEAM_BY_ID = {};
  var TEAM_BY_NAME = {};
  TEAMS.forEach(function (t) { TEAM_BY_ID[t.id] = t; TEAM_BY_NAME[t.name] = t; });

  // Upcoming match schedule (demo). Dates are ISO strings; the feed shows the
  // soonest upcoming match for each favorite team. `ticketUrl` links out to a
  // ticketing partner (placeholder for the POC).
  var SCHEDULE = [
    { home: 'creamline',  away: 'chocomucho', date: '2026-07-04T18:00:00+08:00', venue: 'PhilSports Arena, Pasig', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'pldt',       away: 'cignal',     date: '2026-07-04T15:30:00+08:00', venue: 'PhilSports Arena, Pasig', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'akari',      away: 'petrogazz',  date: '2026-07-05T16:00:00+08:00', venue: 'Ynares Center, Antipolo', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'cherytiggo', away: 'farmfresh',  date: '2026-07-05T18:30:00+08:00', venue: 'Ynares Center, Antipolo', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'capital1',   away: 'nxled',      date: '2026-07-06T16:00:00+08:00', venue: 'Filoil EcoOil Centre, San Juan', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'zus',        away: 'galeries',   date: '2026-07-06T18:30:00+08:00', venue: 'Filoil EcoOil Centre, San Juan', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'chocomucho', away: 'pldt',       date: '2026-07-09T18:00:00+08:00', venue: 'PhilSports Arena, Pasig', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'creamline',  away: 'akari',      date: '2026-07-11T18:00:00+08:00', venue: 'SM Mall of Asia Arena, Pasay', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'petrogazz',  away: 'cignal',     date: '2026-07-12T16:00:00+08:00', venue: 'SM Mall of Asia Arena, Pasay', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'farmfresh',  away: 'zus',        date: '2026-07-12T18:30:00+08:00', venue: 'PhilSports Arena, Pasig', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'nxled',      away: 'cherytiggo', date: '2026-07-13T16:00:00+08:00', venue: 'Ynares Center, Antipolo', ticketUrl: 'https://www.ticketmaster.com/' },
    { home: 'galeries',   away: 'capital1',   date: '2026-07-13T18:30:00+08:00', venue: 'Ynares Center, Antipolo', ticketUrl: 'https://www.ticketmaster.com/' }
  ];

  // Short editorial write-ups per team (demo). Keyed by team id.
  var WRITEUPS = {
    creamline: [
      { title: 'The Dynasty Marches On', date: '2026-06-29', body: 'Creamline enters the week atop the standings, with Alyssa Valdez and Tots Carlos combining for 40+ points a night. The Cool Smashers look every bit the favorites again.' }
    ],
    chocomucho: [
      { title: 'Flying Titans Find Their Rhythm', date: '2026-06-28', body: 'Sisi Rondina has been electric off the bench and Deanna Wong is orchestrating one of the league\'s most balanced attacks. Choco Mucho is peaking at the right time.' }
    ],
    pldt: [
      { title: 'High Speed Hitters Retool', date: '2026-06-27', body: 'A mid-season roster shake-up is paying dividends. Savi Davison anchors the offense while the defense has quietly become one of the stingiest in the conference.' }
    ],
    cignal: [
      { title: 'Cignal\'s Block Defense Is Elite', date: '2026-06-26', body: 'The HD Spikers are turning matches at the net. Their read-blocking scheme has frustrated even the league\'s top hitters over the last three outings.' }
    ],
    akari: [
      { title: 'Chargers Ride Nisperos', date: '2026-06-27', body: 'Faith Nisperos continues her breakout campaign, and Dindin Santiago-Manabat brings championship poise. Akari is a dangerous out for anyone in the bracket.' }
    ],
    cherytiggo: [
      { title: 'Crossovers Chasing Consistency', date: '2026-06-25', body: 'When Mylene Paat and EJ Laure are firing together, Chery Tiggo can hang with anyone. The question all season has been stringing full matches together.' }
    ],
    petrogazz: [
      { title: 'Angels Lean On Van Sickle', date: '2026-06-28', body: 'Brooke Van Sickle\'s all-around game has Petro Gazz trending up. Grethcel Soltones remains the emotional heartbeat of a gritty, defense-first squad.' }
    ],
    farmfresh: [
      { title: 'Foxies Are This Season\'s Surprise', date: '2026-06-26', body: 'Nobody expected Farm Fresh to be this feisty. Kim Kianna Dy is playing the best volleyball of her career and the young core is buying in.' }
    ],
    nxled: [
      { title: 'Chameleons Building Something', date: '2026-06-24', body: 'Rebuilding years are rarely pretty, but Vira Guillema gives NXLED a foundation. Every match is a measuring stick for a program on the rise.' }
    ],
    capital1: [
      { title: 'Solar Spikers Flash Upside', date: '2026-06-25', body: 'Capital1 has stolen a set or two from contenders this conference. The talent is there — turning flashes into full-match wins is the next step.' }
    ],
    zus: [
      { title: 'Thunderbelles Bring Veteran Grit', date: '2026-06-27', body: 'Aby Maraño\'s leadership sets the tone for ZUS Coffee. The Thunderbelles play a physical, disciplined brand of volleyball that wears opponents down.' }
    ],
    galeries: [
      { title: 'Highrisers Aim To Climb', date: '2026-06-24', body: 'Galeries Tower is hunting statement wins. Fille Cainglet-Cayetano provides steady scoring as the Highrisers look to crack the middle of the standings.' }
    ]
  };

  function teamById(id) { return TEAM_BY_ID[id] || null; }
  function teamByName(name) { return TEAM_BY_NAME[name] || null; }

  // Return the soonest upcoming match for a team id (or null if none left).
  function nextMatchForTeam(teamId, fromDate) {
    var now = fromDate ? new Date(fromDate) : new Date();
    var upcoming = SCHEDULE
      .filter(function (m) { return (m.home === teamId || m.away === teamId) && new Date(m.date) >= now; })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    return upcoming.length ? upcoming[0] : null;
  }

  global.PVLData = {
    TEAMS: TEAMS,
    SCHEDULE: SCHEDULE,
    WRITEUPS: WRITEUPS,
    teamById: teamById,
    teamByName: teamByName,
    nextMatchForTeam: nextMatchForTeam,
    allPlayers: function () {
      var out = [];
      TEAMS.forEach(function (t) {
        t.players.forEach(function (p) { out.push({ name: p, team: t }); });
      });
      return out;
    }
  };
})(window);
