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

// Helper to fetch all records from a table (handles pagination)
async function fetchAllRecords(tableName, params) {
  let allRecords = [];
  let offset = null;

  do {
    const queryParams = new URLSearchParams(params || {});
    if (offset) {
      queryParams.append('offset', offset);
    }

    const url = `${BASE_URL}/${tableName}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: airtableHeaders
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Failed to fetch ${tableName}:`, errorData);
      break;
    }

    const data = await response.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);

  return allRecords;
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
    const body = JSON.parse(event.body);
    const { password } = body;

    // Verify admin password
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, message: 'Invalid admin password' })
      };
    }

    // Fetch data from multiple tables in parallel
    const [usersRecords, predictionsRecords, activityRecords, creditRecords] = await Promise.all([
      fetchAllRecords('USERS'),
      fetchAllRecords('PREDICTIONS'),
      fetchAllRecords('USER_ACTIVITY'),
      fetchAllRecords('CREDIT_TRANSACTIONS')
    ]);

    // Total users count
    const total_users = usersRecords.length;

    // Tier distribution
    const tier_distribution = {};
    let credits_in_circulation = 0;
    usersRecords.forEach((record) => {
      const tier = record.fields.tier || 'free';
      tier_distribution[tier] = (tier_distribution[tier] || 0) + 1;
      credits_in_circulation += record.fields.credits || 0;
    });

    // Total predictions
    const total_predictions = predictionsRecords.length;

    // Recent activity counts (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent_activities = activityRecords.filter((record) => {
      const ts = record.fields.timestamp ? new Date(record.fields.timestamp).getTime() : 0;
      return ts > sevenDaysAgo;
    }).length;

    // Activity by type
    const activity_by_type = {};
    activityRecords.forEach((record) => {
      const type = record.fields.activity_type || 'unknown';
      activity_by_type[type] = (activity_by_type[type] || 0) + 1;
    });

    // Credit transaction totals
    let total_credits_earned = 0;
    let total_credits_spent = 0;
    creditRecords.forEach((record) => {
      const amount = record.fields.amount || 0;
      if (amount > 0) {
        total_credits_earned += amount;
      } else {
        total_credits_spent += Math.abs(amount);
      }
    });

    // Supplementary hardcoded data for demo charts
    const demo_chart_data = {
      monthly_signups: [
        { month: 'Jan', count: 12 },
        { month: 'Feb', count: 18 },
        { month: 'Mar', count: 25 },
        { month: 'Apr', count: 31 },
        { month: 'May', count: 28 },
        { month: 'Jun', count: 42 }
      ],
      top_content: [
        { title: 'PVL Season Preview', views: 1250 },
        { title: 'Player Rankings Update', views: 980 },
        { title: 'Match Highlights Recap', views: 875 },
        { title: 'Draft Analysis Deep Dive', views: 720 },
        { title: 'Weekly Predictions Roundup', views: 650 }
      ],
      engagement_metrics: {
        avg_session_duration: '4m 32s',
        pages_per_session: 3.8,
        bounce_rate: '32%',
        returning_users_pct: '58%'
      },
      popular_teams: [
        { team: 'Creamline', fans: 45 },
        { team: 'Petro Gazz', fans: 32 },
        { team: 'Chery Tiggo', fans: 28 },
        { team: 'PLDT', fans: 22 },
        { team: 'Cignal', fans: 18 },
        { team: 'F2 Logistics', fans: 15 }
      ]
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        dashboard: {
          total_users,
          tier_distribution,
          total_predictions,
          recent_activities,
          activity_by_type,
          credits_in_circulation,
          total_credits_earned,
          total_credits_spent,
          total_transactions: creditRecords.length,
          demo_chart_data
        }
      })
    };
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      })
    };
  }
};
