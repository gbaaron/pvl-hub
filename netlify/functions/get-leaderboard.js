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
    const period = event.queryStringParameters?.period || 'alltime';

    // Build filter for weekly period (last 7 days)
    let filterFormula = '';
    if (period === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];
      filterFormula = `&filterByFormula=${encodeURIComponent(`IS_AFTER({submitted_at}, "${dateStr}")`)}`;
    }

    // Fetch all predictions with pagination
    let allRecords = [];
    let offset = null;

    do {
      let url = `${AIRTABLE_URL}/PREDICTIONS?pageSize=100${filterFormula}`;
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
          body: JSON.stringify({ error: 'Failed to fetch predictions', details: errorData })
        };
      }

      const data = await response.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset || null;
    } while (offset);

    // Aggregate by user_id
    const userStats = {};

    for (const record of allRecords) {
      const fields = record.fields;
      const userId = fields.user_id;

      if (!userId) continue;

      if (!userStats[userId]) {
        userStats[userId] = {
          user_id: userId,
          username: fields.username || userId,
          total: 0,
          correct: 0
        };
      }

      userStats[userId].total += 1;
      if (fields.is_correct) {
        userStats[userId].correct += 1;
      }
    }

    // Calculate accuracy and sort
    const leaderboard = Object.values(userStats)
      .map((entry) => ({
        ...entry,
        accuracy: entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0
      }))
      .sort((a, b) => b.correct - a.correct)
      .slice(0, 50);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ leaderboard })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
