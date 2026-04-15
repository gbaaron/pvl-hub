const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

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
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const user = verifyToken(event);
  if (!user) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized. Invalid or expired token.' })
    };
  }

  try {
    const { content_type, content_id, rating, review_text } = JSON.parse(event.body);

    if (!content_type || !content_id || rating === undefined || rating === null) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'content_type, content_id, and rating are required' })
      };
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'rating must be a number between 1 and 5' })
      };
    }

    // Check if user already rated this content
    const filterFormula = encodeURIComponent(
      `AND({content_type} = "${content_type}", {content_id} = "${content_id}", {user_id} = "${user.user_id}")`
    );

    const existingResponse = await fetch(
      `${AIRTABLE_URL}/RATINGS?filterByFormula=${filterFormula}&maxRecords=1`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!existingResponse.ok) {
      const errorData = await existingResponse.json();
      return {
        statusCode: existingResponse.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to check existing rating', details: errorData })
      };
    }

    const existingData = await existingResponse.json();

    const ratingFields = {
      content_type: content_type,
      content_id: content_id,
      user_id: user.user_id,
      rating: rating,
      updated_at: new Date().toISOString()
    };

    if (review_text !== undefined && review_text !== null) {
      ratingFields.review_text = review_text.trim();
    }

    let response;

    if (existingData.records.length > 0) {
      // Update existing rating
      const recordId = existingData.records[0].id;
      response = await fetch(`${AIRTABLE_URL}/RATINGS/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: ratingFields })
      });
    } else {
      // Create new rating
      ratingFields.created_at = new Date().toISOString();
      response = await fetch(`${AIRTABLE_URL}/RATINGS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{ fields: ratingFields }]
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to save rating', details: errorData })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
