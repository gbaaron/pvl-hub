const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
const airtableHeaders = {
  Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json'
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

function verifyToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const [payload] = token.split('.');
    const data = JSON.parse(atob(payload));
    if (data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Verify authentication
    const user = verifyToken(event);
    if (!user) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'Unauthorized - invalid or expired token' })
      };
    }

    // Fetch user's credit balance from USERS table
    const userResponse = await fetch(`${BASE_URL}/USERS/${user.id}`, {
      method: 'GET',
      headers: airtableHeaders
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      throw new Error(`Failed to fetch user: ${userResponse.status} - ${errorData}`);
    }

    const userRecord = await userResponse.json();
    const credits = userRecord.fields.credits || 0;

    // Fetch recent CREDIT_TRANSACTIONS for this user (last 20)
    const filterFormula = encodeURIComponent(`{user_id} = '${user.id}'`);
    const params = new URLSearchParams();
    params.append('filterByFormula', `{user_id} = '${user.id}'`);
    params.append('sort[0][field]', 'timestamp');
    params.append('sort[0][direction]', 'desc');
    params.append('maxRecords', '20');

    const txResponse = await fetch(`${BASE_URL}/CREDIT_TRANSACTIONS?${params.toString()}`, {
      method: 'GET',
      headers: airtableHeaders
    });

    let transactions = [];
    if (txResponse.ok) {
      const txData = await txResponse.json();
      transactions = txData.records.map((record) => ({
        id: record.id,
        amount: record.fields.amount || 0,
        source: record.fields.source || null,
        description: record.fields.description || null,
        timestamp: record.fields.timestamp || null
      }));
    } else {
      console.error('Failed to fetch transactions:', await txResponse.text());
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        credits: credits,
        transactions: transactions
      })
    };
  } catch (error) {
    console.error('Error fetching credits:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to fetch credits',
        error: error.message
      })
    };
  }
};
