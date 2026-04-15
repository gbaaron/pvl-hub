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
    const sortParam = encodeURIComponent('created_at');

    // Fetch comments with pagination
    let allRecords = [];
    let offset = null;

    do {
      let url = `${AIRTABLE_URL}/COMMENTS?filterByFormula=${filterFormula}&sort%5B0%5D%5Bfield%5D=${sortParam}&sort%5B0%5D%5Bdirection%5D=desc`;
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
          body: JSON.stringify({ error: 'Failed to fetch comments', details: errorData })
        };
      }

      const data = await response.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset || null;
    } while (offset);

    // Collect unique user_ids for username lookup
    const userIds = [...new Set(allRecords.map((r) => r.fields.user_id).filter(Boolean))];

    // Fetch usernames from USERS table
    const userMap = {};
    if (userIds.length > 0) {
      // Batch user lookups (Airtable filterByFormula with OR)
      const userBatches = [];
      for (let i = 0; i < userIds.length; i += 20) {
        userBatches.push(userIds.slice(i, i + 20));
      }

      for (const batch of userBatches) {
        const orConditions = batch.map((id) => `{user_id} = "${id}"`).join(', ');
        const userFilter = encodeURIComponent(`OR(${orConditions})`);

        const userResponse = await fetch(`${AIRTABLE_URL}/USERS?filterByFormula=${userFilter}`, {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          for (const record of userData.records) {
            userMap[record.fields.user_id] = record.fields.username || record.fields.user_id;
          }
        }
      }
    }

    // Map comments with usernames
    const comments = allRecords.map((record) => ({
      id: record.id,
      content_type: record.fields.content_type,
      content_id: record.fields.content_id,
      user_id: record.fields.user_id,
      username: record.fields.username || userMap[record.fields.user_id] || record.fields.user_id,
      comment_text: record.fields.comment_text,
      created_at: record.fields.created_at
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ comments })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
