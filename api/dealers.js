/**
 * Vercel Serverless Function for Dealers API
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dealers = [
      { name: "Bayside Auto Sales", count: 2340 },
      { name: "Premium Auto Group", count: 1856 },
      { name: "Elite Car Sales", count: 1672 },
      { name: "Metro Motors", count: 1434 },
      { name: "Luxury Auto Gallery", count: 1289 },
      { name: "City Auto Center", count: 1156 },
      { name: "Northwest Auto", count: 978 },
      { name: "Coastal Cars", count: 834 },
    ];

    res.status(200).json({
      success: true,
      data: dealers
    });

  } catch (error) {
    console.error('Dealers API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: []
    });
  }
}
