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
    const { user_id } = event.queryStringParameters || {};

    if (!user_id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'user_id is required' })
      };
    }

    // Fetch user from USERS table by record ID
    const response = await fetch(`${BASE_URL}/USERS/${user_id}`, {
      method: 'GET',
      headers: airtableHeaders
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'User not found' })
        };
      }
      const errorData = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
    }

    const record = await response.json();
    const fields = record.fields;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        user: {
          id: record.id,
          email: fields.email || null,
          username: fields.username || null,
          display_name: fields.display_name || null,
          bio: fields.bio || null,
          favorite_team: fields.favorite_team || null,
          favorite_player: fields.favorite_player || null,
          tier: fields.tier || 'free',
          credits: fields.credits || 0,
          avatar_url: fields.avatar_url || null,
          profile_banner_color: fields.profile_banner_color || null,
          date_joined: fields.date_joined || null
        }
      })
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to fetch user profile',
        error: error.message
      })
    };
  }
};
