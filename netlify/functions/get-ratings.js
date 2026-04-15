const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const contentType = event.queryStringParameters?.content_type;
    const contentId = event.queryStringParameters?.content_id;

    if (!contentType || !contentId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'content_type and content_id query parameters are required' })
      };
    }

    const filterFormula = encodeURIComponent(
      `AND({content_type} = "${contentType}", {content_id} = "${contentId}")`
    );

    // Fetch all ratings with pagination
    let allRecords = [];
    let offset = null;

    do {
      let url = `${AIRTABLE_URL}/RATINGS?filterByFormula=${filterFormula}`;
      if (offset) {
        url += `&offset=${offset}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          statusCode: response.status,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to fetch ratings', details: errorData })
        };
      }

      const data = await response.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset || null;
    } while (offset);

    // Map ratings
    const ratings = allRecords.map((record) => ({
      id: record.id,
      user_id: record.fields.user_id,
      rating: record.fields.rating,
      review_text: record.fields.review_text || null,
      created_at: record.fields.created_at,
      updated_at: record.fields.updated_at || null
    }));

    // Calculate average
    const count = ratings.length;
    let average = 0;
    if (count > 0) {
      const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
      average = Math.round((sum / count) * 10) / 10;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ratings, average, count })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
