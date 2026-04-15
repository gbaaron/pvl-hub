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
    const { match_id, predictions } = JSON.parse(event.body);

    if (!match_id || !predictions || !Array.isArray(predictions) || predictions.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'match_id and predictions array are required' })
      };
    }

    // Create prediction records in PREDICTIONS table
    const predictionRecords = predictions.map((p) => ({
      fields: {
        match_id: match_id,
        user_id: user.user_id,
        question_id: p.question_id,
        selected_answer: p.selected_answer,
        submitted_at: new Date().toISOString()
      }
    }));

    // Airtable allows up to 10 records per request, batch if needed
    const batches = [];
    for (let i = 0; i < predictionRecords.length; i += 10) {
      batches.push(predictionRecords.slice(i, i + 10));
    }

    for (const batch of batches) {
      const response = await fetch(`${AIRTABLE_URL}/PREDICTIONS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records: batch })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          statusCode: response.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to submit predictions', details: errorData })
        };
      }
    }

    // Log activity in USER_ACTIVITY table
    await fetch(`${AIRTABLE_URL}/USER_ACTIVITY`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: [{
          fields: {
            user_id: user.user_id,
            activity_type: 'prediction_submitted',
            reference_id: match_id,
            details: `Submitted ${predictions.length} prediction(s) for match ${match_id}`,
            created_at: new Date().toISOString()
          }
        }]
      })
    });

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
