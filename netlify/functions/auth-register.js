const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/USERS`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function hashPassword(password) {
  return btoa(password + "_pvlhub_salt");
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
    const { email, username, password, display_name, favorite_team, tier } =
      JSON.parse(event.body);

    // Validate required fields
    if (!email || !username || !password || !display_name) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message:
            "Missing required fields: email, username, password, and display_name are required",
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: "Invalid email format",
        }),
      };
    }

    // Validate password length
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: "Password must be at least 6 characters",
        }),
      };
    }

    // Check if email already exists in USERS table
    const filterFormula = encodeURIComponent(`{email} = '${email}'`);
    const checkResponse = await fetch(
      `${AIRTABLE_URL}?filterByFormula=${filterFormula}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: "Failed to check existing users",
          error: errorData,
        }),
      };
    }

    const existingUsers = await checkResponse.json();

    if (existingUsers.records && existingUsers.records.length > 0) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: "An account with this email already exists",
        }),
      };
    }

    // Hash the password
    const password_hash = hashPassword(password);

    // Get today's date in ISO format
    const today = new Date().toISOString().split("T")[0];

    // Create new user record in Airtable
    const createResponse = await fetch(AIRTABLE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              email: email,
              username: username,
              password_hash: password_hash,
              display_name: display_name,
              favorite_team: favorite_team || "",
              tier: tier || "Free",
              credits: 100,
              date_joined: today,
              last_login: today,
            },
          },
        ],
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: "Failed to create user account",
          error: errorData,
        }),
      };
    }

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: "Registration successful",
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
