const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/USERS`;

// Game integration env vars
const MANAGER_KEY = process.env.MANAGER_GAME_AIRTABLE_KEY;
const MANAGER_BASE = process.env.MANAGER_GAME_BASE_ID;
const MANAGER_TABLE = process.env.MANAGER_GAME_USERS_TABLE;
const CARD_IDENTITY_URL = process.env.CARD_GAME_IDENTITY_URL;
const CARD_KEY = process.env.CARD_GAME_AIRTABLE_KEY;
const CARD_BASE = process.env.CARD_GAME_BASE_ID;
const CARD_TABLE = process.env.CARD_GAME_USERS_TABLE;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function hashPassword(password) {
  return btoa(password + "_pvlhub_salt");
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Create matching account in Manager Game Airtable */
async function createManagerGameAccount(email, displayName, pin) {
  if (!MANAGER_KEY || !MANAGER_BASE || !MANAGER_TABLE) return;
  try {
    const res = await fetch(`https://api.airtable.com/v0/${MANAGER_BASE}/${MANAGER_TABLE}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${MANAGER_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        records: [{ fields: { Email: email, Pin: pin, DisplayName: displayName, CreatedAt: new Date().toISOString() } }],
      }),
    });
    if (!res.ok) console.error("Manager account sync failed:", await res.text());
    else console.log("Manager account created:", email);
  } catch (err) { console.error("Manager sync error:", err.message); }
}

/** Create Netlify Identity account for Card Game */
async function createCardGameIdentityAccount(email, password) {
  if (!CARD_IDENTITY_URL) return;
  try {
    const res = await fetch(`${CARD_IDENTITY_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, data: { full_name: email.split("@")[0] } }),
    });
    if (!res.ok) console.error("Card Identity signup failed:", await res.text());
    else console.log("Card Identity account created:", email);
  } catch (err) { console.error("Card Identity sync error:", err.message); }
}

/** Pre-create Airtable record in Card Game users table */
async function createCardGameAirtableRecord(email, username) {
  if (!CARD_KEY || !CARD_BASE || !CARD_TABLE) return;
  try {
    const res = await fetch(`https://api.airtable.com/v0/${CARD_BASE}/${CARD_TABLE}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CARD_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        records: [{ fields: { email, username, credits: 0, account_status: "active", created_at: new Date().toISOString().split("T")[0] } }],
      }),
    });
    if (!res.ok) console.error("Card Airtable sync failed:", await res.text());
    else console.log("Card Airtable record created:", email);
  } catch (err) { console.error("Card Airtable sync error:", err.message); }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ success: false, message: "Method not allowed" }) };
  }

  try {
    const { email, username, password, display_name, favorite_team, tier } = JSON.parse(event.body);

    if (!email || !username || !password || !display_name) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success: false, message: "Missing required fields: email, username, password, and display_name are required" }) };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success: false, message: "Invalid email format" }) };
    }
    if (password.length < 6) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success: false, message: "Password must be at least 6 characters" }) };
    }

    // Check if email already exists
    const filterFormula = encodeURIComponent(`{email} = '${email}'`);
    const checkRes = await fetch(`${AIRTABLE_URL}?filterByFormula=${filterFormula}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type": "application/json" },
    });

    if (!checkRes.ok) {
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, message: "Failed to check existing users" }) };
    }

    const existing = await checkRes.json();
    if (existing.records && existing.records.length > 0) {
      return { statusCode: 409, headers: CORS_HEADERS, body: JSON.stringify({ success: false, message: "An account with this email already exists" }) };
    }

    const password_hash = hashPassword(password);
    const game_pin = generatePin();
    const today = new Date().toISOString().split("T")[0];

    // Create PVL Hub user
    const createRes = await fetch(AIRTABLE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        records: [{ fields: { email, username, password_hash, display_name, favorite_team: favorite_team || "", tier: tier || "Free", credits: 100, date_joined: today, last_login: today, game_pin } }],
      }),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json();
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, message: "Failed to create user account", error: errorData }) };
    }

    // Fire-and-forget: create accounts in both games in parallel
    await Promise.allSettled([
      createManagerGameAccount(email, display_name, game_pin),
      createCardGameIdentityAccount(email, password),
      createCardGameAirtableRecord(email, username),
    ]);

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, message: "Registration successful", game_pin }),
    };
  } catch (error) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, message: "Internal server error", error: error.message }) };
  }
};
