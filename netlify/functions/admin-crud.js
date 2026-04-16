/* ========================================
   PVL HUB — Admin CRUD Serverless Function
   Single generic endpoint that handles all
   admin-editable Airtable tables.
   ======================================== */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Whitelist of tables an admin is allowed to modify via this endpoint.
const ALLOWED_TABLES = [
  'ARTICLES',
  'VIDEOS',
  'PODCAST_EPISODES',
  'MATCHES',
  'PREDICTION_QUESTIONS',
  'USERS'
];

/**
 * Parse and validate the JWT-like token produced by auth-login.
 * Token format: base64(JSON payload) + "." + base64(JWT_SECRET)
 * Returns the decoded payload or null if invalid/expired.
 */
function verifyToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const [payload] = token.split('.');
    const data = JSON.parse(atob(payload));
    if (!data || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Look up the user in Airtable USERS and return the raw record,
 * so we can check is_admin on the server (never trust the client).
 */
async function fetchUserRecord(userId) {
  const response = await fetch(`${AIRTABLE_URL}/USERS/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) return null;
  return response.json();
}

/**
 * Fetch every record in a table, handling pagination.
 */
async function fetchAllRecords(table) {
  let allRecords = [];
  let offset = null;

  do {
    const params = new URLSearchParams();
    if (offset) params.append('offset', offset);

    const response = await fetch(`${AIRTABLE_URL}/${table}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Airtable GET ${table} failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const mapped = (data.records || []).map((r) => ({ id: r.id, ...r.fields }));
    allRecords = allRecords.concat(mapped);
    offset = data.offset || null;
  } while (offset);

  return allRecords;
}

async function createRecord(table, fields) {
  const response = await fetch(`${AIRTABLE_URL}/${table}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: [{ fields }] })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Airtable POST ${table} failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const rec = data.records[0];
  return { id: rec.id, ...rec.fields };
}

async function updateRecord(table, id, fields) {
  const response = await fetch(`${AIRTABLE_URL}/${table}/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Airtable PATCH ${table}/${id} failed: ${response.status} ${errText}`);
  }

  const rec = await response.json();
  return { id: rec.id, ...rec.fields };
}

async function deleteRecord(table, id) {
  const response = await fetch(`${AIRTABLE_URL}/${table}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Airtable DELETE ${table}/${id} failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return { id: data.id, deleted: data.deleted === true };
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  // --- CORS preflight ---
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // --- Auth: verify token ---
  const tokenData = verifyToken(event);
  if (!tokenData || !tokenData.id) {
    return respond(401, { success: false, error: 'Unauthorized. Invalid or expired token.' });
  }

  // --- Auth: verify admin flag from Airtable (source of truth) ---
  let userRecord;
  try {
    userRecord = await fetchUserRecord(tokenData.id);
  } catch (err) {
    return respond(500, { success: false, error: 'Failed to verify admin status.' });
  }

  if (!userRecord || !userRecord.fields || userRecord.fields.is_admin !== true) {
    return respond(403, { success: false, error: 'Forbidden. Admin privileges required.' });
  }

  try {
    const method = event.httpMethod;
    const qs = event.queryStringParameters || {};
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        body = {};
      }
    }

    // Table is either in query string (GET/DELETE) or body (POST/PATCH)
    const table = qs.table || body.table;

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return respond(400, {
        success: false,
        error: `Invalid or missing 'table'. Allowed: ${ALLOWED_TABLES.join(', ')}`
      });
    }

    // -------------------------------------------------
    // GET: list all records in the table
    // -------------------------------------------------
    if (method === 'GET') {
      const records = await fetchAllRecords(table);
      return respond(200, { success: true, records });
    }

    // -------------------------------------------------
    // POST: create a new record
    // -------------------------------------------------
    if (method === 'POST') {
      const fields = body.fields || {};
      if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
        return respond(400, { success: false, error: "'fields' object is required." });
      }
      const record = await createRecord(table, fields);
      return respond(200, { success: true, record });
    }

    // -------------------------------------------------
    // PATCH: update an existing record
    // -------------------------------------------------
    if (method === 'PATCH') {
      const id = body.id || qs.id;
      const fields = body.fields || {};
      if (!id) {
        return respond(400, { success: false, error: "'id' is required." });
      }
      if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
        return respond(400, { success: false, error: "'fields' object is required." });
      }
      const record = await updateRecord(table, id, fields);
      return respond(200, { success: true, record });
    }

    // -------------------------------------------------
    // DELETE: remove a record
    // -------------------------------------------------
    if (method === 'DELETE') {
      const id = qs.id || body.id;
      if (!id) {
        return respond(400, { success: false, error: "'id' is required." });
      }
      const result = await deleteRecord(table, id);
      return respond(200, { success: true, ...result });
    }

    return respond(405, { success: false, error: `Method ${method} not allowed.` });
  } catch (error) {
    console.error('admin-crud error:', error);
    return respond(500, {
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
