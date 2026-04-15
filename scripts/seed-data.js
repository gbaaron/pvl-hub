/**
 * ============================================================================
 *  PVL Hub — Airtable Seed Data Script
 * ============================================================================
 *
 *  Populates the PVL Hub Airtable base with realistic fake data for
 *  development, demos, and dashboard testing.
 *
 *  USAGE:
 *    1. Set environment variables:
 *         export AIRTABLE_API_KEY="pat..."
 *         export AIRTABLE_BASE_ID="app..."
 *
 *    2. Run:
 *         node scripts/seed-data.js
 *
 *  REQUIREMENTS:
 *    - Node.js 18+ (uses native fetch)
 *    - A valid Airtable Personal Access Token with read/write scopes
 *    - An Airtable base with the tables already created (matching PVL Hub schema)
 *
 *  TABLES POPULATED (in order):
 *    USERS -> ARTICLES -> VIDEOS -> PODCAST_EPISODES -> MATCHES ->
 *    PREDICTION_QUESTIONS -> SHOP_ITEMS -> PREDICTIONS -> COMMENTS ->
 *    RATINGS -> USER_ACTIVITY -> CREDIT_TRANSACTIONS
 *
 *  NOTES:
 *    - Airtable REST API limits: max 10 records per POST, 5 requests/sec
 *    - The script batches records and adds delays to respect rate limits
 *    - Running this script multiple times will create DUPLICATE records
 *    - Total records created: ~3,300+
 *    - Estimated run time: 5-10 minutes depending on rate limits
 *
 * ============================================================================
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('ERROR: Missing required environment variables.');
  console.error('  export AIRTABLE_API_KEY="pat..."');
  console.error('  export AIRTABLE_BASE_ID="app..."');
  process.exit(1);
}

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
const HEADERS = {
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json'
};

// ============================================================================
//  HELPERS
// ============================================================================

/** Sleep for ms milliseconds */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pick a random element from an array */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick N random unique elements from an array */
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}

/** Random integer between min and max (inclusive) */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float between min and max with fixed decimals */
function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

/** Generate a random date between start and end */
function randomDate(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return new Date(startTime + Math.random() * (endTime - startTime));
}

/** Format a Date as YYYY-MM-DD */
function formatDate(d) {
  return d.toISOString().split('T')[0];
}

/** Format a Date as ISO string */
function formatISO(d) {
  return d.toISOString();
}

/** Generate a UUID-like id for internal cross-referencing */
function makeId() {
  return 'id_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Batch-create Airtable records (max 10 per request).
 * Returns an array of created record objects (with Airtable-assigned IDs).
 */
async function batchCreate(tableName, records) {
  const created = [];
  const batches = [];
  for (let i = 0; i < records.length; i += 10) {
    batches.push(records.slice(i, i + 10));
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const payload = {
      records: batch.map((fields) => {
        // Strip internal fields (prefixed with _)
        const clean = {};
        for (const [k, v] of Object.entries(fields)) {
          if (!k.startsWith('_')) clean[k] = v;
        }
        return { fields: clean };
      })
    };

    let retries = 0;
    const maxRetries = 5;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(`${BASE_URL}/${tableName}`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify(payload)
        });

        if (response.status === 429) {
          // Rate limited — wait and retry
          const waitTime = Math.pow(2, retries) * 1000 + randInt(500, 1500);
          console.log(`    Rate limited on ${tableName}. Waiting ${waitTime}ms...`);
          await sleep(waitTime);
          retries++;
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`    ERROR creating ${tableName} batch ${batchIndex + 1}/${batches.length}: ${response.status}`);
          console.error(`    ${errorBody}`);
          break;
        }

        const data = await response.json();
        created.push(...(data.records || []));
        break;
      } catch (err) {
        console.error(`    Network error on ${tableName}: ${err.message}`);
        retries++;
        await sleep(2000);
      }
    }

    // Delay between batches to respect Airtable's 5 req/sec limit
    if (batchIndex < batches.length - 1) {
      await sleep(250);
    }
  }

  return created;
}

/** Log section header */
function logSection(name, count) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Seeding ${name} (${count} records)`);
  console.log(`${'='.repeat(60)}`);
}

// ============================================================================
//  CONSTANTS & REFERENCE DATA
// ============================================================================

const TEAMS = [
  'Creamline', 'Choco Mucho', 'PLDT', 'Cignal', 'Akari',
  'Chery Tiggo', 'Petro Gazz', 'Farm Fresh', 'NXLED',
  'Capital1', 'ZUS', 'Galeries Tower'
];

// Weighted team distribution — Creamline is the most popular
const TEAM_WEIGHTS = {
  'Creamline': 14, 'Choco Mucho': 6, 'PLDT': 5, 'Cignal': 4,
  'Akari': 3, 'Chery Tiggo': 4, 'Petro Gazz': 4, 'Farm Fresh': 3,
  'NXLED': 2, 'Capital1': 2, 'ZUS': 2, 'Galeries Tower': 1
};

function pickWeightedTeam() {
  const entries = Object.entries(TEAM_WEIGHTS);
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * totalWeight;
  for (const [team, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return team;
  }
  return entries[entries.length - 1][0];
}

const VENUES = ['PhilSports Arena', 'Mall of Asia Arena', 'FilOil EcoOil Centre'];

const TIERS = ['Free', 'Fan', 'Superfan', 'VIP'];

const ARTICLE_CATEGORIES = ['Game Recap', 'Analysis', 'Feature', 'News', 'Opinion'];
const VIDEO_TYPES = ['Highlight', 'Interview', 'Analysis', 'Behind the Scenes'];

const ACTIVITY_TYPES = [
  'Page View', 'Prediction', 'Comment', 'Rating',
  'Article Read', 'Video Watch', 'Podcast Listen', 'Shop Purchase',
  'Login', 'Card Game Play', 'Manager Game Play'
];

const CREDIT_SOURCES = [
  'Prediction Win', 'Daily Login', 'Comment', 'Rating',
  'Card Game', 'Manager Game', 'Purchase', 'Admin Grant'
];

// Date range: 3 months back from today
const NOW = new Date();
const THREE_MONTHS_AGO = new Date(NOW);
THREE_MONTHS_AGO.setMonth(THREE_MONTHS_AGO.getMonth() - 3);
const TWO_MONTHS_AGO = new Date(NOW);
TWO_MONTHS_AGO.setMonth(TWO_MONTHS_AGO.getMonth() - 2);
const ONE_MONTH_AGO = new Date(NOW);
ONE_MONTH_AGO.setMonth(ONE_MONTH_AGO.getMonth() - 1);

// Match days are Tues (2), Thurs (4), Sat (6)
function isMatchDay(date) {
  const day = date.getDay();
  return day === 2 || day === 4 || day === 6;
}

// ============================================================================
//  DATA GENERATORS
// ============================================================================

// --------------- USERS (50) -------------------------------------------------

function generateUsers() {
  const usernames = [
    'VolleyBoss_MNL', 'SpikerQueen', 'AceMaster_PH', 'SetterStar99', 'LiberoKing',
    'BlockParty_PH', 'DigItUp_Manila', 'NetNinja_PH', 'PVLFanatic', 'CreamlineFan01',
    'ChocoMuchoGirl', 'PLDTHero', 'CignalSpiker', 'AkariWarrior', 'PetroGazzFan',
    'ServeAndVolley', 'KillShot_PH', 'RallyPoint99', 'MatchPoint_MNL', 'BayanihanVolley',
    'TalisaySpiker', 'ManilaDigger', 'QuezCitySetter', 'DavaoAce', 'CebuSmasher',
    'PasigBlocker', 'TaguigVolley', 'MakatiNet', 'BGCSpikerFan', 'IloiloServe',
    'BacolodKill', 'PangasinanPH', 'BaguioSpike', 'ZamboangaSet', 'BoholVolley',
    'LagunaDig', 'CaviteBlock', 'BatangasAce', 'PampangaHit', 'TarlacNet',
    'VolleyVault_PH', 'SpikeNation', 'SetTheBar', 'AceOfSpades_MNL', 'DigDeep_PH',
    'BlockChain_Volley', 'NetGainsPH', 'CourtVision99', 'PowerSpike_MNL', 'VolleyPulse'
  ];

  // Tier distribution: ~34 Free, ~10 Fan, ~4 Superfan, ~2 VIP
  const tierAssignments = [
    ...Array(34).fill('Free'),
    ...Array(10).fill('Fan'),
    ...Array(4).fill('Superfan'),
    ...Array(2).fill('VIP')
  ];
  // Shuffle tier assignments
  tierAssignments.sort(() => 0.5 - Math.random());

  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com'];

  return usernames.map((username, i) => {
    const tier = tierAssignments[i];
    const emailBase = username.toLowerCase().replace(/_/g, '.').replace(/[0-9]+$/, '');
    const email = `${emailBase}${randInt(1, 99)}@${pick(domains)}`;

    // VIP and Superfan users tend to have more credits
    let credits;
    if (tier === 'VIP') credits = randInt(2500, 5000);
    else if (tier === 'Superfan') credits = randInt(1200, 3500);
    else if (tier === 'Fan') credits = randInt(400, 1800);
    else credits = randInt(50, 800);

    // Earlier users have earlier join dates — simulates organic growth
    // First 15 users joined in month 1, next 15 in month 2, last 20 in month 3
    let joinStart, joinEnd;
    if (i < 15) {
      joinStart = THREE_MONTHS_AGO;
      joinEnd = TWO_MONTHS_AGO;
    } else if (i < 30) {
      joinStart = TWO_MONTHS_AGO;
      joinEnd = ONE_MONTH_AGO;
    } else {
      joinStart = ONE_MONTH_AGO;
      joinEnd = NOW;
    }

    const joinDate = randomDate(joinStart, joinEnd);

    return {
      email,
      username,
      display_name: username.replace(/_/g, ' ').replace(/([0-9]+)/g, ' $1').trim(),
      password_hash: btoa(username.toLowerCase() + '_pvlhub_salt'),
      favorite_team: pickWeightedTeam(),
      tier,
      credits,
      date_joined: formatDate(joinDate),
      last_login: formatDate(randomDate(joinDate, NOW))
    };
  });
}

// --------------- ARTICLES (30) ----------------------------------------------

function generateArticles() {
  const articles = [
    // Game Recaps
    { title: 'Creamline Sweeps PLDT in Statement Opening Win', category: 'Game Recap', tier: 'Free' },
    { title: 'Choco Mucho Edges Cignal in Five-Set Thriller', category: 'Game Recap', tier: 'Free' },
    { title: 'Akari Stuns Petro Gazz Behind Rookie Performance', category: 'Game Recap', tier: 'Free' },
    { title: 'Farm Fresh Falls to Chery Tiggo in Straight Sets', category: 'Game Recap', tier: 'Free' },
    { title: 'PLDT Bounces Back With Convincing Win Over NXLED', category: 'Game Recap', tier: 'Free' },
    { title: 'Creamline Extends Win Streak to Nine Games', category: 'Game Recap', tier: 'Free' },

    // Analysis
    { title: 'Top 5 Setters to Watch This Conference', category: 'Analysis', tier: 'Free' },
    { title: 'Breaking Down Creamline\'s Unstoppable Quick Attack', category: 'Analysis', tier: 'Fan' },
    { title: 'The Numbers Behind Petro Gazz\'s Defensive Dominance', category: 'Analysis', tier: 'Fan' },
    { title: 'Statistical Deep Dive: First Round Efficiency Leaders', category: 'Analysis', tier: 'Superfan' },
    { title: 'Setter Distribution Heat Maps: Conference Midpoint', category: 'Analysis', tier: 'Superfan' },
    { title: 'Import vs Local Scoring: Who Carries the Load?', category: 'Analysis', tier: 'Fan' },

    // Features
    { title: 'Inside Choco Mucho\'s Championship-Winning Culture', category: 'Feature', tier: 'Free' },
    { title: 'The Rise of Filipino Volleyball: From Backyard to Big Stage', category: 'Feature', tier: 'Free' },
    { title: 'A Day in the Life of a PVL Team Manager', category: 'Feature', tier: 'Fan' },
    { title: 'From Province to Pro: How Small-Town Players Make It', category: 'Feature', tier: 'Free' },
    { title: 'The Coaches Shaping the Next Generation of PVL Stars', category: 'Feature', tier: 'Fan' },

    // News
    { title: 'PVL Announces Record TV Deal for 2026 Season', category: 'News', tier: 'Free' },
    { title: 'Three Teams Add Foreign Reinforcements for All-Filipino', category: 'News', tier: 'Free' },
    { title: 'PVL Draft 2026: Complete First Round Results', category: 'News', tier: 'Free' },
    { title: 'Galeries Tower Joins PVL as Expansion Franchise', category: 'News', tier: 'Free' },
    { title: 'PVL Awards Night: MVP Race Down to Three Candidates', category: 'News', tier: 'Free' },
    { title: 'Capital1 Signs Former National Team Libero', category: 'News', tier: 'Free' },

    // Opinions
    { title: 'Why the PVL\'s Import Rule Changes Everything', category: 'Opinion', tier: 'Free' },
    { title: 'Is Creamline\'s Dynasty Good for the League?', category: 'Opinion', tier: 'Free' },
    { title: 'The Case for Expanding to a 14-Team League', category: 'Opinion', tier: 'Fan' },
    { title: 'Prediction Markets Are Changing How Fans Watch Volleyball', category: 'Opinion', tier: 'Free' },
    { title: 'Why PVL Needs Better Referee Technology', category: 'Opinion', tier: 'Free' },
    { title: 'The Untapped Potential of PVL\'s Digital Fanbase', category: 'Opinion', tier: 'Free' },
    { title: 'Should the PVL Adopt a Salary Cap?', category: 'Opinion', tier: 'Fan' },
  ];

  return articles.map((article, i) => {
    // Spread articles over 3 months, more recent articles more frequent
    const daysAgo = Math.floor((articles.length - i) / articles.length * 90);
    const publishDate = new Date(NOW);
    publishDate.setDate(publishDate.getDate() - daysAgo - randInt(0, 5));

    const isFeatured = i < 6 || Math.random() < 0.15;

    return {
      title: article.title,
      category: article.category,
      author: pick([
        'Marco Santos', 'Lia Reyes', 'JP Cruz', 'Kath Mendoza',
        'Andrei Villanueva', 'Bea Gonzales', 'Ryan Tanaka'
      ]),
      excerpt: `A ${article.category.toLowerCase()} covering the latest developments in PVL volleyball. ${article.title}.`,
      url: `https://globallyballin.com/pvl/${article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      publish_date: formatDate(publishDate),
      is_featured: isFeatured,
      tier_required: article.tier,
      image_url: `https://placehold.co/800x450/1a1a2e/e94560?text=${encodeURIComponent(article.category)}`
    };
  });
}

// --------------- VIDEOS (20) ------------------------------------------------

function generateVideos() {
  const videos = [
    { title: 'Exclusive: Alyssa Valdez Interview on Legacy', type: 'Interview', tier: 'Free' },
    { title: 'Top 10 Plays: Week 3', type: 'Highlight', tier: 'Free' },
    { title: 'Film Breakdown: Cignal\'s Block Defense', type: 'Analysis', tier: 'Fan' },
    { title: 'Post-Game: Creamline Celebrates Ninth Straight Win', type: 'Behind the Scenes', tier: 'Free' },
    { title: 'Top 10 Plays: Week 5 — Rally of the Season', type: 'Highlight', tier: 'Free' },
    { title: 'Coach Sherwin Meneses on Choco Mucho\'s System', type: 'Interview', tier: 'Free' },
    { title: 'Full Game Recap: Petro Gazz vs Akari (Set 5 Drama)', type: 'Highlight', tier: 'Free' },
    { title: 'Scouting Report: PLDT\'s New Import', type: 'Analysis', tier: 'Superfan' },
    { title: 'Top 10 Plays: Opening Weekend', type: 'Highlight', tier: 'Free' },
    { title: 'Locker Room Access: Farm Fresh After First PVL Win', type: 'Behind the Scenes', tier: 'Fan' },
    { title: 'Defensive Masterclass: How Petro Gazz Shut Down Creamline', type: 'Analysis', tier: 'Fan' },
    { title: 'Jia de Guzman: Setting Up the Future of Philippine Volleyball', type: 'Interview', tier: 'Free' },
    { title: 'Full Game Recap: Creamline vs Choco Mucho Finals Preview', type: 'Highlight', tier: 'Free' },
    { title: 'Top 10 Plays: Week 7 — Blocks Edition', type: 'Highlight', tier: 'Free' },
    { title: 'PVL Draft Night: Behind the Scenes With Team Scouts', type: 'Behind the Scenes', tier: 'Superfan' },
    { title: 'Hitting Angles Explained: Pro vs Amateur Comparison', type: 'Analysis', tier: 'Fan' },
    { title: 'Top 10 Saves: Conference Midpoint Edition', type: 'Highlight', tier: 'Free' },
    { title: 'Capital1\'s Journey: From Expansion Team to Contender', type: 'Interview', tier: 'Free' },
    { title: 'Film Study: How Akari\'s 6-2 Rotation Creates Mismatches', type: 'Analysis', tier: 'Superfan' },
    { title: 'Fan Cam: Best Crowd Moments of the Season', type: 'Behind the Scenes', tier: 'Free' },
  ];

  return videos.map((video, i) => {
    const daysAgo = Math.floor((videos.length - i) / videos.length * 90);
    const publishDate = new Date(NOW);
    publishDate.setDate(publishDate.getDate() - daysAgo - randInt(0, 4));

    const duration = `${randInt(3, 28)}:${String(randInt(0, 59)).padStart(2, '0')}`;

    return {
      title: video.title,
      type: video.type,
      publish_date: formatDate(publishDate),
      thumbnail_url: `https://placehold.co/1280x720/16213e/e94560?text=${encodeURIComponent(video.type)}`,
      youtube_url: `https://www.youtube.com/watch?v=${Math.random().toString(36).substring(2, 13)}`,
      tier_required: video.tier
    };
  });
}

// --------------- PODCAST EPISODES (15) --------------------------------------

function generatePodcastEpisodes() {
  const episodes = [
    { title: 'The Creamline Dynasty: Can Anyone Stop Them?', guest: 'Coach Tai Bundit', duration: '42:15' },
    { title: 'Rookie Report 2026: Top Picks and Sleepers', guest: 'Scout Ana Reyes', duration: '38:44' },
    { title: 'Inside the PVL Draft: Winners and Losers', guest: 'GM Podcast Panel', duration: '56:30' },
    { title: 'Import Watch: Who\'s Making the Biggest Impact?', guest: 'Analyst Rico Santos', duration: '34:22' },
    { title: 'The Setter\'s Table: Playmaking in the Modern PVL', guest: 'Jia de Guzman', duration: '45:10' },
    { title: 'Defense Wins Championships? A PVL Stats Breakdown', guest: 'Statistician Mark Lim', duration: '41:55' },
    { title: 'Building a Franchise: Galeries Tower\'s First Season', guest: 'Owner James Tan', duration: '52:08' },
    { title: 'Fan Culture: How Social Media Changed PVL', guest: 'Digital Strategist Bea Cruz', duration: '37:33' },
    { title: 'The Business of Volleyball: Sponsorships and TV Deals', guest: 'Sports Economist Dr. Luna', duration: '49:20' },
    { title: 'Conference Preview: Bold Predictions for the Second Round', guest: 'Panel Discussion', duration: '58:42' },
    { title: 'Coaching Corner: Adjustments That Win Matches', guest: 'Coach Oliver Almadro', duration: '44:18' },
    { title: 'Volleyball Analytics 101: Beyond the Box Score', guest: 'Data Scientist Mia Torres', duration: '40:05' },
    { title: 'Player Spotlight: Rising Stars Under 23', guest: 'Multiple Players', duration: '36:50' },
    { title: 'The Libero Episode: Most Underrated Position?', guest: 'Dawn Macandili', duration: '43:27' },
    { title: 'Season Awards Debate: MVP, ROY, and Best Import', guest: 'Full Panel', duration: '61:15' },
  ];

  return episodes.map((ep, i) => {
    const daysAgo = Math.floor((episodes.length - i) / episodes.length * 90);
    const publishDate = new Date(NOW);
    publishDate.setDate(publishDate.getDate() - daysAgo - randInt(0, 5));

    return {
      title: ep.title,
      description: `Episode ${i + 1} of the PVL Hub Podcast. ${ep.title} — featuring ${ep.guest}. Deep discussions on Philippine volleyball.`,
      guest: ep.guest,
      publish_date: formatDate(publishDate),
      duration: ep.duration,
      audio_url: `https://podcast.pvlhub.com/episodes/ep${String(i + 1).padStart(3, '0')}.mp3`,
      tier_required: i % 5 === 0 ? 'Fan' : 'Free',
      avg_rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1))
    };
  });
}

// --------------- MATCHES (10) -----------------------------------------------

function generateMatches() {
  // 6 Completed, 3 Upcoming, 1 Live
  const matchData = [
    // Completed matches (oldest first)
    { home: 'Creamline', away: 'PLDT', status: 'Completed', score_home: 3, score_away: 0, daysAgo: 75 },
    { home: 'Choco Mucho', away: 'Cignal', status: 'Completed', score_home: 3, score_away: 2, daysAgo: 68 },
    { home: 'Petro Gazz', away: 'Akari', status: 'Completed', score_home: 3, score_away: 1, daysAgo: 54 },
    { home: 'Creamline', away: 'Chery Tiggo', status: 'Completed', score_home: 3, score_away: 0, daysAgo: 40 },
    { home: 'Farm Fresh', away: 'NXLED', status: 'Completed', score_home: 3, score_away: 2, daysAgo: 26 },
    { home: 'Creamline', away: 'Choco Mucho', status: 'Completed', score_home: 3, score_away: 1, daysAgo: 12 },

    // Live match
    { home: 'Petro Gazz', away: 'PLDT', status: 'Live', score_home: 2, score_away: 1, daysAgo: 0 },

    // Upcoming matches
    { home: 'Creamline', away: 'Cignal', status: 'Upcoming', daysAgo: -3 },
    { home: 'Akari', away: 'Capital1', status: 'Upcoming', daysAgo: -7 },
    { home: 'Choco Mucho', away: 'Galeries Tower', status: 'Upcoming', daysAgo: -10 },
  ];

  return matchData.map((m, i) => {
    const matchDate = new Date(NOW);
    matchDate.setDate(matchDate.getDate() - m.daysAgo);
    // Snap to nearest match day schedule — set time to evening
    matchDate.setHours(18, 0, 0, 0);

    const fields = {
      team_a: m.home,
      team_b: m.away,
      match_date: formatDate(matchDate),
      venue: pick(VENUES),
      status: m.status,
      predictions_open: m.status === 'Upcoming'
    };

    if (m.status === 'Completed' || m.status === 'Live') {
      fields.score_a = m.score_home;
      fields.score_b = m.score_away;
    }

    // Store match index for reference by prediction questions
    fields._index = i;

    return fields;
  });
}

// --------------- PREDICTION QUESTIONS (5 per match = ~50) -------------------

function generatePredictionQuestions(matches) {
  const questions = [];

  const questionTemplates = [
    {
      q: (home, away) => `Who will win: ${home} vs ${away}?`,
      options: (home, away) => JSON.stringify([home, away]),
      getCorrect: (home, away, scoreH, scoreA) => scoreH > scoreA ? home : away
    },
    {
      q: (home, away) => `How many sets will ${home} vs ${away} go?`,
      options: () => JSON.stringify(['3 sets', '4 sets', '5 sets']),
      getCorrect: (home, away, scoreH, scoreA) => {
        const total = scoreH + scoreA;
        return `${total} sets`;
      }
    },
    {
      q: (home, away) => `Which team will score the first point?`,
      options: (home, away) => JSON.stringify([home, away]),
      getCorrect: (home, away) => pick([home, away])
    },
    {
      q: (home, away) => `Will there be a set that goes to deuce (over 25 points)?`,
      options: () => JSON.stringify(['Yes', 'No']),
      getCorrect: () => pick(['Yes', 'No'])
    },
    {
      q: (home, away) => `Which team will have more service aces?`,
      options: (home, away) => JSON.stringify([home, away, 'Equal']),
      getCorrect: (home, away) => pick([home, away, 'Equal'])
    }
  ];

  const questionTypes = ['Match Outcome', 'Set Score', 'Match Outcome', 'Match Outcome', 'Player Stat'];

  matches.forEach((match, matchIdx) => {
    questionTemplates.forEach((template, qi) => {
      const home = match.team_a;
      const away = match.team_b;

      const record = {
        match_id: String(matchIdx + 1),
        question_text: template.q(home, away),
        question_type: questionTypes[qi] || 'Match Outcome',
        options: template.options(home, away),
        points_value: qi === 0 ? 10 : qi === 1 ? 15 : 5
      };

      // Fill in correct_answer for completed matches
      if (match.status === 'Completed') {
        record.correct_answer = template.getCorrect(
          home, away, match.score_a || 0, match.score_b || 0
        );
      }

      // Store question_order for internal use
      record._question_order = qi + 1;

      questions.push(record);
    });
  });

  return questions;
}

// --------------- SHOP ITEMS (20) --------------------------------------------

function generateShopItems() {
  return [
    // Apparel
    { name: 'PVL Hub Official Jersey - Home', category: 'Apparel', description: 'Official PVL Hub branded home jersey. Premium dri-fit material.', credits_price: 500, price: 1299, image_url: 'https://placehold.co/400x400/1a1a2e/e94560?text=Jersey+Home', in_stock: true },
    { name: 'PVL Hub Official Jersey - Away', category: 'Apparel', description: 'Official PVL Hub branded away jersey. Premium dri-fit material.', credits_price: 500, price: 1299, image_url: 'https://placehold.co/400x400/1a1a2e/16c79a?text=Jersey+Away', in_stock: true },
    { name: 'Creamline Fan Tee', category: 'Apparel', description: 'Cool Smashers supporter cotton tee in pink and white.', credits_price: 300, price: 799, image_url: 'https://placehold.co/400x400/ff69b4/ffffff?text=Creamline+Tee', in_stock: true },
    { name: 'PVL Hub Hoodie - Black', category: 'Apparel', description: 'Cozy black hoodie with embroidered PVL Hub logo.', credits_price: 700, price: 1899, image_url: 'https://placehold.co/400x400/111111/e94560?text=Hoodie', in_stock: true },
    { name: 'Volleyball Training Shorts', category: 'Apparel', description: 'Lightweight training shorts with PVL Hub branding.', credits_price: 250, price: 699, image_url: 'https://placehold.co/400x400/1a1a2e/ffffff?text=Shorts', in_stock: true },

    // Accessories
    { name: 'PVL Hub Snapback Cap', category: 'Accessories', description: 'Adjustable snapback cap with 3D embroidered logo.', credits_price: 200, price: 599, image_url: 'https://placehold.co/400x400/1a1a2e/e94560?text=Cap', in_stock: true },
    { name: 'Volleyball Keychain - Gold', category: 'Accessories', description: 'Premium gold-plated mini volleyball keychain.', credits_price: 75, price: 199, image_url: 'https://placehold.co/400x400/ffd700/1a1a2e?text=Keychain', in_stock: true },
    { name: 'PVL Hub Lanyard', category: 'Accessories', description: 'Nylon lanyard with breakaway clip. Perfect for arena visits.', credits_price: 50, price: 149, image_url: 'https://placehold.co/400x400/e94560/ffffff?text=Lanyard', in_stock: true },
    { name: 'Team Sticker Pack (12 Teams)', category: 'Accessories', description: 'Waterproof vinyl stickers of all 12 PVL teams.', credits_price: 100, price: 299, image_url: 'https://placehold.co/400x400/16c79a/1a1a2e?text=Stickers', in_stock: true },
    { name: 'Volleyball Water Bottle - 750ml', category: 'Accessories', description: 'Insulated stainless steel water bottle with PVL Hub logo.', credits_price: 175, price: 499, image_url: 'https://placehold.co/400x400/0f3460/ffffff?text=Bottle', in_stock: true },

    // Digital
    { name: 'PVL Hub Premium Avatar Pack', category: 'Digital', description: '20 exclusive volleyball-themed profile avatars.', credits_price: 150, price: 0, image_url: 'https://placehold.co/400x400/9b59b6/ffffff?text=Avatars', in_stock: true },
    { name: 'Prediction Boost Token (x3)', category: 'Digital', description: 'Triple your prediction points for the next 3 matches.', credits_price: 300, price: 0, image_url: 'https://placehold.co/400x400/e94560/ffffff?text=Boost+x3', in_stock: true },
    { name: 'Custom Username Color', category: 'Digital', description: 'Stand out in comments with a custom colored username.', credits_price: 200, price: 0, image_url: 'https://placehold.co/400x400/e67e22/ffffff?text=Color', in_stock: true },
    { name: 'Digital Match Program - Conference Finals', category: 'Digital', description: 'Exclusive digital program with stats, matchups, and analysis.', credits_price: 100, price: 199, image_url: 'https://placehold.co/400x400/2c3e50/e94560?text=Program', in_stock: true },
    { name: 'VIP Badge Flair', category: 'Digital', description: 'Show off your VIP status with exclusive profile badge.', credits_price: 500, price: 0, image_url: 'https://placehold.co/400x400/ffd700/1a1a2e?text=VIP+Badge', in_stock: true },

    // Collectibles
    { name: 'PVL 2026 Trading Card Starter Pack', category: 'Collectibles', description: '10 random player cards including 1 guaranteed rare.', credits_price: 250, price: 699, image_url: 'https://placehold.co/400x400/8e44ad/ffffff?text=Card+Pack', in_stock: true },
    { name: 'Signed Volleyball - Creamline', category: 'Collectibles', description: 'Official Mikasa ball with printed team signatures.', credits_price: 2000, price: 4999, image_url: 'https://placehold.co/400x400/ff69b4/ffffff?text=Signed+Ball', in_stock: true },
    { name: 'Mini Trophy Replica - Conference Champion', category: 'Collectibles', description: '6-inch replica of the PVL Conference Championship trophy.', credits_price: 400, price: 999, image_url: 'https://placehold.co/400x400/ffd700/1a1a2e?text=Trophy', in_stock: true },
    { name: 'Limited Edition Pin Set - All Teams', category: 'Collectibles', description: 'Enamel pin set featuring all 12 PVL team logos.', credits_price: 350, price: 899, image_url: 'https://placehold.co/400x400/e94560/ffffff?text=Pins', in_stock: true },
    { name: 'Player Bobblehead - Mystery Box', category: 'Collectibles', description: 'Random PVL star player bobblehead. Collect all 12!', credits_price: 450, price: 1199, image_url: 'https://placehold.co/400x400/3498db/ffffff?text=Bobblehead', in_stock: true },
  ];
}

// --------------- PREDICTIONS (~200) -----------------------------------------

function generatePredictions(userIds, questions, matches) {
  const predictions = [];

  // Build a lookup: match index -> match status
  const matchStatusMap = {};
  matches.forEach((m, i) => {
    matchStatusMap[String(i + 1)] = m.status;
  });

  // Build lookup: match_id -> questions
  const matchQuestionsMap = {};
  questions.forEach((q) => {
    if (!matchQuestionsMap[q.match_id]) matchQuestionsMap[q.match_id] = [];
    matchQuestionsMap[q.match_id].push(q);
  });

  // For each completed and live match, generate predictions from random users
  const matchIds = Object.keys(matchQuestionsMap);

  for (const matchId of matchIds) {
    const matchStatus = matchStatusMap[matchId];
    const matchQuestions = matchQuestionsMap[matchId];

    // More users predict as platform grows — earlier matches fewer predictions
    const matchIndex = matchIds.indexOf(matchId);
    const userCount = Math.min(
      userIds.length,
      Math.floor(8 + (matchIndex / matchIds.length) * 35)
    );

    const predictingUsers = pickN(userIds, userCount);

    for (const userId of predictingUsers) {
      // Each user answers 2-5 questions per match
      const answeredQuestions = pickN(matchQuestions, randInt(2, 5));

      for (const question of answeredQuestions) {
        const options = JSON.parse(question.options);
        const selectedAnswer = pick(options);

        const isCorrect =
          matchStatus === 'Completed' && question.correct_answer
            ? selectedAnswer === question.correct_answer
            : undefined;

        const submittedAt = new Date(NOW);
        // Submit predictions 0-2 days before the match date
        const daysBeforeMatch = randInt(0, 2);
        submittedAt.setDate(submittedAt.getDate() - daysBeforeMatch - (matchIndex * 8));

        const record = {
          match_id: matchId,
          user_id: userId,
          question_id: `${matchId}_q${question._question_order || 1}`,
          selected_answer: selectedAnswer,
          submitted_at: formatDate(submittedAt)
        };

        if (isCorrect !== undefined) {
          record.is_correct = isCorrect;
        }

        predictions.push(record);
      }
    }
  }

  return predictions;
}

// --------------- COMMENTS (~300) --------------------------------------------

function generateComments(userIds, usernames, articleIds, videoIds, podcastIds, matchIds) {
  const comments = [];

  const matchCommentTexts = [
    'LFG Creamline!!! Sweep incoming!', 'Choco Mucho in 4, mark my words.',
    'This match is going to be a thriller!', 'Defense wins championships, Petro Gazz got this.',
    'Ang galing ng libero today!', 'That rally was insane! Best match I\'ve seen all year.',
    'The import is really making a difference for this team.', 'Setter is distributing well, keeping everyone involved.',
    'Crowd energy at PhilSports is unmatched.', 'Can\'t believe that comeback! Never count them out.',
    'MVP performance right there.', 'The block timing has been perfect this set.',
    'Sana magkaroon ng rematch!', 'GG! Well-deserved win.',
    'Both teams played their hearts out. Respect.', 'This is why I love PVL!',
    'The quick attack was unstoppable today.', 'Substitution changed the momentum completely.',
    'LETS GOOO! That ace to close the set!', 'Heartbreaker for the losing team, but great match.',
    'Prediction game had me on the edge of my seat!', 'Called it! My predictions were spot on today.',
    'The atmosphere in MOA Arena is electric right now.', 'First time watching live. So much better in person!',
  ];

  const articleCommentTexts = [
    'Great analysis! Really insightful breakdown.', 'I disagree with the take on imports, but well-written.',
    'Been waiting for someone to write about this topic.', 'This is exactly why I subscribe to PVL Hub.',
    'The stats really tell the story. Excellent piece.', 'Creamline coverage is always top-notch here.',
    'Can you do a follow-up on the rookie class?', 'Shared this with my volleyball group chat!',
    'The feature on small-town players was inspiring.', 'Finally, some good PVL journalism!',
    'Numbers don\'t lie. Great data-driven article.', 'This opinion piece is spot on.',
    'Love the in-depth reporting. Keep it up!', 'Would love to see more tactical breakdowns like this.',
  ];

  const videoCommentTexts = [
    'The production quality keeps getting better!', 'That slow-mo replay was amazing.',
    'More film breakdowns please!', 'This interview was so genuine. Love the player access.',
    'Top 10 plays never gets old.', 'The behind the scenes content is what sets PVL Hub apart.',
    'Can we get a longer version of this?', 'Best volleyball content on the internet!',
    'Watched this three times already. So good.', 'The camera angles are incredible.',
  ];

  const podcastCommentTexts = [
    'Best volleyball podcast in the Philippines!', 'The guest really dropped some knowledge today.',
    'I listen to this on my commute. Makes the MRT bearable!', 'More episodes please!',
    'The hot takes segment is my favorite part.', 'Great discussion on the imports this week.',
    'Would love to hear from more coaches on the pod.', 'Audio quality has really improved.',
    'The panel debates are always entertaining.', 'Started playing volleyball because of this podcast.',
  ];

  // Helper to create a batch of comments for a content type
  function addComments(contentType, contentIds, textOptions, count) {
    for (let i = 0; i < count; i++) {
      const userIndex = randInt(0, userIds.length - 1);
      const createdAt = randomDate(THREE_MONTHS_AGO, NOW);

      comments.push({
        content_type: contentType,
        content_id: String(contentIds[randInt(0, contentIds.length - 1)]),
        user_id: userIds[userIndex],
        comment_text: pick(textOptions),
        created_at: formatDate(createdAt),
        likes: randInt(0, 25)
      });
    }
  }

  // More comments on matches (predictions drive engagement)
  addComments('Match', matchIds, matchCommentTexts, 140);
  addComments('Article', articleIds, articleCommentTexts, 80);
  addComments('Video', videoIds, videoCommentTexts, 50);
  addComments('Podcast', podcastIds, podcastCommentTexts, 30);

  return comments;
}

// --------------- RATINGS (~150) ---------------------------------------------

function generateRatings(userIds, articleIds, videoIds, podcastIds) {
  const ratings = [];

  function addRatings(contentType, contentIds, count) {
    // Track user+content combos to avoid duplicates
    const seen = new Set();

    for (let i = 0; i < count; i++) {
      const userId = pick(userIds);
      const contentId = pick(contentIds);
      const key = `${userId}_${contentId}`;

      if (seen.has(key)) continue;
      seen.add(key);

      // Skew ratings toward 3-5 (most fans are positive)
      const ratingWeights = [1, 1, 3, 5, 4]; // 1-star thru 5-star
      const totalWeight = ratingWeights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      let rating = 1;
      for (let r = 0; r < ratingWeights.length; r++) {
        rand -= ratingWeights[r];
        if (rand <= 0) {
          rating = r + 1;
          break;
        }
      }

      const createdAt = randomDate(THREE_MONTHS_AGO, NOW);

      ratings.push({
        content_type: contentType,
        content_id: String(contentId),
        user_id: userId,
        rating,
        created_at: formatDate(createdAt)
      });
    }
  }

  addRatings('Podcast', podcastIds, 50);
  addRatings('Video', videoIds, 55);
  addRatings('Article', articleIds, 55);

  return ratings;
}

// --------------- USER ACTIVITY (~2000) --------------------------------------

function generateUserActivity(userIds) {
  const activities = [];

  // Generate activities spread across 3 months
  // More activity on match days (Tue, Thu, Sat)
  // Growing engagement: more activity in recent weeks

  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(THREE_MONTHS_AGO);
    date.setDate(date.getDate() + dayOffset);

    // Growth factor: activities increase over time (1x -> 3x)
    const growthFactor = 1 + (dayOffset / 90) * 2;

    // Base activities per day: 5-10, multiplied by growth
    let dailyCount = Math.floor(randInt(5, 10) * growthFactor);

    // Match day boost: 2x-3x more activity
    if (isMatchDay(date)) {
      dailyCount = Math.floor(dailyCount * randFloat(2.0, 3.0));
    }

    for (let i = 0; i < dailyCount; i++) {
      const activityDate = new Date(date);
      activityDate.setHours(randInt(6, 23), randInt(0, 59), randInt(0, 59));

      // Weight activity types — prediction_submitted should be most common on match days
      let activityType;
      if (isMatchDay(date) && Math.random() < 0.35) {
        activityType = pick(['Prediction', 'Page View', 'Prediction']);
      } else {
        activityType = pick(ACTIVITY_TYPES);
      }

      activities.push({
        user_id: pick(userIds),
        activity_type: activityType,
        timestamp: formatDate(activityDate),
        metadata: JSON.stringify({ source: 'seed_data', day_of_week: date.getDay() })
      });
    }
  }

  return activities;
}

// --------------- CREDIT TRANSACTIONS (~500) ---------------------------------

function generateCreditTransactions(userIds) {
  const transactions = [];

  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(THREE_MONTHS_AGO);
    date.setDate(date.getDate() + dayOffset);

    // Growth: more transactions over time
    const growthFactor = 1 + (dayOffset / 90) * 1.5;
    let dailyCount = Math.floor(randInt(2, 5) * growthFactor);

    if (isMatchDay(date)) {
      dailyCount = Math.floor(dailyCount * 1.8);
    }

    for (let i = 0; i < dailyCount; i++) {
      const txDate = new Date(date);
      txDate.setHours(randInt(6, 23), randInt(0, 59), randInt(0, 59));

      const source = pick(CREDIT_SOURCES);

      // Determine amount based on source
      let amount;
      let description;

      switch (source) {
        case 'Prediction Win':
          amount = pick([5, 10, 15, 20, 25, 50]);
          description = 'Correct prediction reward';
          break;
        case 'Daily Login':
          amount = pick([5, 10]);
          description = 'Daily login bonus';
          break;
        case 'Comment':
          amount = pick([2, 3, 5]);
          description = 'Comment reward';
          break;
        case 'Rating':
          amount = pick([2, 3]);
          description = 'Rating reward';
          break;
        case 'Card Game':
          amount = pick([-10, -25, -50, 15, 30, 75]);
          description = amount > 0 ? 'Card game winnings' : 'Card game entry fee';
          break;
        case 'Manager Game':
          amount = pick([-20, -50, 10, 25, 50, 100]);
          description = amount > 0 ? 'Manager game reward' : 'Manager game entry';
          break;
        case 'Purchase':
          amount = -pick([50, 75, 100, 150, 200, 250, 300, 500]);
          description = 'Shop purchase';
          break;
        case 'Admin Grant':
          amount = pick([50, 100, 200, 500]);
          description = 'Admin credit grant — event bonus';
          break;
        default:
          amount = pick([5, 10, 15]);
          description = 'Miscellaneous credit';
      }

      transactions.push({
        user_id: pick(userIds),
        amount,
        source,
        description,
        timestamp: formatDate(txDate)
      });
    }
  }

  return transactions;
}


// ============================================================================
//  MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n');
  console.log('  =============================================');
  console.log('    PVL Hub — Airtable Seed Data Script');
  console.log('  =============================================');
  console.log(`  Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`  Started: ${new Date().toLocaleString()}`);
  console.log('');

  const startTime = Date.now();

  // ---- 1. USERS ----
  const usersData = generateUsers();
  logSection('USERS', usersData.length);
  const createdUsers = await batchCreate('USERS', usersData);
  const userAirtableIds = createdUsers.map((r) => r.id);
  const usernames = createdUsers.map((r) => r.fields.username);
  console.log(`  Created ${createdUsers.length} users.`);
  await sleep(500);

  // ---- 2. ARTICLES ----
  const articlesData = generateArticles();
  logSection('ARTICLES', articlesData.length);
  const createdArticles = await batchCreate('ARTICLES', articlesData);
  const articleIds = createdArticles.map((r) => r.id);
  console.log(`  Created ${createdArticles.length} articles.`);
  await sleep(500);

  // ---- 3. VIDEOS ----
  const videosData = generateVideos();
  logSection('VIDEOS', videosData.length);
  const createdVideos = await batchCreate('VIDEOS', videosData);
  const videoIds = createdVideos.map((r) => r.id);
  console.log(`  Created ${createdVideos.length} videos.`);
  await sleep(500);

  // ---- 4. PODCAST_EPISODES ----
  const podcastsData = generatePodcastEpisodes();
  logSection('PODCAST_EPISODES', podcastsData.length);
  const createdPodcasts = await batchCreate('PODCAST_EPISODES', podcastsData);
  const podcastIds = createdPodcasts.map((r) => r.id);
  console.log(`  Created ${createdPodcasts.length} podcast episodes.`);
  await sleep(500);

  // ---- 5. MATCHES ----
  const matchesData = generateMatches();
  logSection('MATCHES', matchesData.length);
  const createdMatches = await batchCreate('MATCHES', matchesData);
  const matchIds = createdMatches.map((r) => r.id);
  console.log(`  Created ${createdMatches.length} matches.`);
  await sleep(500);

  // ---- 6. PREDICTION_QUESTIONS ----
  const questionsData = generatePredictionQuestions(matchesData);
  logSection('PREDICTION_QUESTIONS', questionsData.length);
  const createdQuestions = await batchCreate('PREDICTION_QUESTIONS', questionsData);
  console.log(`  Created ${createdQuestions.length} prediction questions.`);
  await sleep(500);

  // ---- 7. SHOP_ITEMS ----
  const shopData = generateShopItems();
  logSection('SHOP_ITEMS', shopData.length);
  const createdShop = await batchCreate('SHOP_ITEMS', shopData);
  console.log(`  Created ${createdShop.length} shop items.`);
  await sleep(500);

  // ---- 8. PREDICTIONS ----
  // Use the raw question data (which has match_id, options, correct_answer) for generation
  const predictionsData = generatePredictions(userAirtableIds, questionsData, matchesData);
  logSection('PREDICTIONS', predictionsData.length);
  const createdPredictions = await batchCreate('PREDICTIONS', predictionsData);
  console.log(`  Created ${createdPredictions.length} predictions.`);
  await sleep(500);

  // ---- 9. COMMENTS ----
  const commentsData = generateComments(
    userAirtableIds, usernames,
    articleIds, videoIds, podcastIds,
    matchIds
  );
  logSection('COMMENTS', commentsData.length);
  const createdComments = await batchCreate('COMMENTS', commentsData);
  console.log(`  Created ${createdComments.length} comments.`);
  await sleep(500);

  // ---- 10. RATINGS ----
  const ratingsData = generateRatings(userAirtableIds, articleIds, videoIds, podcastIds);
  logSection('RATINGS', ratingsData.length);
  const createdRatings = await batchCreate('RATINGS', ratingsData);
  console.log(`  Created ${createdRatings.length} ratings.`);
  await sleep(500);

  // ---- 11. USER_ACTIVITY ----
  const activityData = generateUserActivity(userAirtableIds);
  logSection('USER_ACTIVITY', activityData.length);
  const createdActivity = await batchCreate('USER_ACTIVITY', activityData);
  console.log(`  Created ${createdActivity.length} activity records.`);
  await sleep(500);

  // ---- 12. CREDIT_TRANSACTIONS ----
  const creditTxData = generateCreditTransactions(userAirtableIds);
  logSection('CREDIT_TRANSACTIONS', creditTxData.length);
  const createdCredits = await batchCreate('CREDIT_TRANSACTIONS', creditTxData);
  console.log(`  Created ${createdCredits.length} credit transactions.`);

  // ---- SUMMARY ----
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n');
  console.log('  =============================================');
  console.log('    SEED DATA COMPLETE');
  console.log('  =============================================');
  console.log(`  Users:                ${createdUsers.length}`);
  console.log(`  Articles:             ${createdArticles.length}`);
  console.log(`  Videos:               ${createdVideos.length}`);
  console.log(`  Podcast Episodes:     ${createdPodcasts.length}`);
  console.log(`  Matches:              ${createdMatches.length}`);
  console.log(`  Prediction Questions: ${createdQuestions.length}`);
  console.log(`  Shop Items:           ${createdShop.length}`);
  console.log(`  Predictions:          ${createdPredictions.length}`);
  console.log(`  Comments:             ${createdComments.length}`);
  console.log(`  Ratings:              ${createdRatings.length}`);
  console.log(`  User Activity:        ${createdActivity.length}`);
  console.log(`  Credit Transactions:  ${createdCredits.length}`);
  console.log('  ---------------------------------------------');
  const totalRecords =
    createdUsers.length + createdArticles.length + createdVideos.length +
    createdPodcasts.length + createdMatches.length + createdQuestions.length +
    createdShop.length + createdPredictions.length + createdComments.length +
    createdRatings.length + createdActivity.length + createdCredits.length;
  console.log(`  TOTAL RECORDS:        ${totalRecords}`);
  console.log(`  Time elapsed:         ${elapsed}s`);
  console.log('  =============================================\n');
}

main().catch((err) => {
  console.error('\nFATAL ERROR:', err);
  process.exit(1);
});
