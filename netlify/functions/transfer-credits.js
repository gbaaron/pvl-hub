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
    const { amount, source, description } = body;

    if (amount === undefined || amount === null) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'amount is required' })
      };
    }

    if (typeof amount !== 'number') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'amount must be a number' })
      };
    }

    // Fetch current user record to get current credit balance
    const userResponse = await fetch(`${BASE_URL}/USERS/${user.id}`, {
      method: 'GET',
      headers: airtableHeaders
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      throw new Error(`Failed to fetch user: ${userResponse.status} - ${errorData}`);
    }

    const userRecord = await userResponse.json();
    const currentCredits = userRecord.fields.credits || 0;
    const newBalance = currentCredits + amount;

    // Prevent negative balance
    if (newBalance < 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Insufficient credits',
          current_balance: currentCredits,
          requested_amount: amount
        })
      };
    }

    // Update USERS credits field
    const updateResponse = await fetch(`${BASE_URL}/USERS/${user.id}`, {
      method: 'PATCH',
      headers: airtableHeaders,
      body: JSON.stringify({
        fields: { credits: newBalance }
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      throw new Error(`Failed to update credits: ${updateResponse.status} - ${errorData}`);
    }

    // Create record in CREDIT_TRANSACTIONS table
    const txResponse = await fetch(`${BASE_URL}/CREDIT_TRANSACTIONS`, {
      method: 'POST',
      headers: airtableHeaders,
      body: JSON.stringify({
        fields: {
          user_id: user.id,
          amount: amount,
          source: source || 'manual',
          description: description || '',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!txResponse.ok) {
      // Log but don't fail — the credits were already updated
      console.error('Failed to create transaction record:', await txResponse.text());
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        new_balance: newBalance
      })
    };
  } catch (error) {
    console.error('Error transferring credits:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to transfer credits',
        error: error.message
      })
    };
  }
};
