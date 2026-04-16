const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/USERS`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function hashPassword(password) {
  return btoa(password + "_pvlhub_salt");
}

function generateToken(userId, email) {
  const payload = {
    id: userId,
    email: email,
    exp: Date.now() + 86400000, // 24 hours from now
  };
  return btoa(JSON.stringify(payload)) + "." + btoa(JWT_SECRET);
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: "Method not allowed" }),
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    // Validate required fields
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: "Email and password are required",
        }),
      };
    }

    // Look up user by email in USERS table
    const filterFormula = encodeURIComponent(`{email} = '${email}'`);
    const lookupResponse = await fetch(
      `${AIRTABLE_URL}?filterByFormula=${filterFormula}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!lookupResponse.ok) {
      const errorData = await lookupResponse.json();
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: "Failed to look up user",
          error: errorData,
        }),
      };
    }

    const userData = await lookupResponse.json();

    if (!userData.records || userData.records.length === 0) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: "Invalid email or password",
        }),
      };
    }

    const userRecord = userData.records[0];
    const fields = userRecord.fields;

    // Compare password hash
    const passwordHash = hashPassword(password);

    if (passwordHash !== fields.password_hash) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: "Invalid email or password",
        }),
      };
    }

    // Generate token
    const token = generateToken(userRecord.id, fields.email);

    // Update last_login in USERS table
    const updateResponse = await fetch(`${AIRTABLE_URL}/${userRecord.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          last_login: new Date().toISOString().split("T")[0],
        },
      }),
    });

    if (!updateResponse.ok) {
      // Log the error but don't fail the login
      console.warn("Failed to update last_login for user:", userRecord.id);
    }

    // Return success with token and user data
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        token: token,
        user: {
          id: userRecord.id,
          email: fields.email,
          username: fields.username,
          display_name: fields.display_name,
          tier: fields.tier,
          credits: fields.credits,
          favorite_team: fields.favorite_team,
          avatar_url: fields.avatar_url || null,
          game_pin: fields.game_pin || null,
          is_admin: fields.is_admin === true,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};
