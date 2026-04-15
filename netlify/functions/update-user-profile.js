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
    // Verify authentication
    const user = verifyToken(event);
    if (!user) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'Unauthorized - invalid or expired token' })
      };
    }

    const body = JSON.parse(event.body);
    const { display_name, bio, favorite_team, favorite_player, profile_banner_color, avatar_url } = body;

    // Build fields object with only provided values
    const fieldsToUpdate = {};
    if (display_name !== undefined) fieldsToUpdate.display_name = display_name;
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    if (favorite_team !== undefined) fieldsToUpdate.favorite_team = favorite_team;
    if (favorite_player !== undefined) fieldsToUpdate.favorite_player = favorite_player;
    if (profile_banner_color !== undefined) fieldsToUpdate.profile_banner_color = profile_banner_color;
    if (avatar_url !== undefined) fieldsToUpdate.avatar_url = avatar_url;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'No fields to update' })
      };
    }

    // Update USERS record matching the token's user ID
    const response = await fetch(`${BASE_URL}/USERS/${user.id}`, {
      method: 'PATCH',
      headers: airtableHeaders,
      body: JSON.stringify({ fields: fieldsToUpdate })
    });

    if (!response.ok) {
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
          display_name: fields.display_name || null,
          bio: fields.bio || null,
          favorite_team: fields.favorite_team || null,
          favorite_player: fields.favorite_player || null,
          profile_banner_color: fields.profile_banner_color || null,
          avatar_url: fields.avatar_url || null
        }
      })
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to update user profile',
        error: error.message
      })
    };
  }
};
