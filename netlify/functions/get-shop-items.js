const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'SHOP_ITEMS';
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { category } = event.queryStringParameters || {};

    let filterByFormula = '';
    if (category) {
      filterByFormula = `{category}="${category}"`;
    }

    let allRecords = [];
    let offset = null;

    do {
      const params = new URLSearchParams();

      if (filterByFormula) {
        params.append('filterByFormula', filterByFormula);
      }
      if (offset) {
        params.append('offset', offset);
      }

      const response = await fetch(`${AIRTABLE_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`
        }
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      const records = data.records.map((record) => ({
        id: record.id,
        ...record.fields
      }));

      allRecords = allRecords.concat(records);
      offset = data.offset || null;
    } while (offset);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ items: allRecords })
    };
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch shop items', message: error.message })
    };
  }
};
