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
    const { user_id, limit } = event.queryStringParameters || {};

    if (!user_id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'user_id is required' })
      };
    }

    const recordLimit = Math.min(parseInt(limit, 10) || 20, 100);

    // Fetch from USER_ACTIVITY table filtered by user_id, sorted by timestamp descending
    const params = new URLSearchParams();
    params.append('filterByFormula', `{user_id} = '${user_id}'`);
    params.append('sort[0][field]', 'timestamp');
    params.append('sort[0][direction]', 'desc');
    params.append('maxRecords', String(recordLimit));

    const response = await fetch(`${BASE_URL}/USER_ACTIVITY?${params.toString()}`, {
      method: 'GET',
      headers: airtableHeaders
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    const activities = data.records.map((record) => ({
      id: record.id,
      activity_type: record.fields.activity_type || null,
      content_id: record.fields.content_id || null,
      metadata: record.fields.metadata ? (() => {
        try { return JSON.parse(record.fields.metadata); } catch { return record.fields.metadata; }
      })() : null,
      timestamp: record.fields.timestamp || null
    }));

    // For total count, we need a separate request without maxRecords limit
    // Use a lightweight approach: fetch just record IDs
    const countParams = new URLSearchParams();
    countParams.append('filterByFormula', `{user_id} = '${user_id}'`);
    countParams.append('fields[]', 'user_id'); // Minimal field to reduce payload

    let total = activities.length;

    const countResponse = await fetch(`${BASE_URL}/USER_ACTIVITY?${countParams.toString()}`, {
      method: 'GET',
      headers: airtableHeaders
    });

    if (countResponse.ok) {
      const countData = await countResponse.json();
      // Count all records across pages
      total = countData.records.length;
      // If there's pagination, we need to follow offsets
      let countOffset = countData.offset;
      while (countOffset) {
        const nextParams = new URLSearchParams(countParams);
        nextParams.append('offset', countOffset);
        const nextResponse = await fetch(`${BASE_URL}/USER_ACTIVITY?${nextParams.toString()}`, {
          method: 'GET',
          headers: airtableHeaders
        });
        if (nextResponse.ok) {
          const nextData = await nextResponse.json();
          total += nextData.records.length;
          countOffset = nextData.offset;
        } else {
          break;
        }
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        activities: activities,
        total: total
      })
    };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to fetch user activity',
        error: error.message
      })
    };
  }
};
