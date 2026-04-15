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

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Try to get user from token, but don't fail if no token (anonymous tracking)
    const user = verifyToken(event);

    const body = JSON.parse(event.body);
    const { activity_type, content_id, metadata } = body;

    if (!activity_type) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'activity_type is required' })
      };
    }

    // Build the record fields
    const fields = {
      activity_type: activity_type,
      timestamp: new Date().toISOString()
    };

    if (user && user.id) {
      fields.user_id = user.id;
    }
    if (content_id) {
      fields.content_id = content_id;
    }
    if (metadata) {
      fields.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
    }

    // Fire-and-forget style: respond immediately, but still await the create
    // so we catch errors in the current invocation
    const response = await fetch(`${BASE_URL}/USER_ACTIVITY`, {
      method: 'POST',
      headers: airtableHeaders,
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      // Log the error but still return success for fire-and-forget behavior
      const errorData = await response.text();
      console.error('Failed to track activity:', errorData);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error tracking activity:', error);
    // Still return success for fire-and-forget — don't block the client
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true })
    };
  }
};
