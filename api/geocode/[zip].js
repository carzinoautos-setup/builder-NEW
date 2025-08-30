/**
 * Vercel Serverless Function for Geocoding API
 * Route: /api/geocode/[zip]
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
    const { zip } = req.query;

    if (!zip || zip.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ZIP code format'
      });
    }

    // Mock geocoding data - in production, you'd use a real geocoding service
    const mockGeocodingData = {
      "98498": { lat: 47.0379, lng: -122.9015, city: "Lakewood", state: "WA" },
      "98468": { lat: 47.0379, lng: -122.9015, city: "Lakewood", state: "WA" },
      "90210": { lat: 34.0901, lng: -118.4065, city: "Beverly Hills", state: "CA" },
      "10001": { lat: 40.7505, lng: -73.9934, city: "New York", state: "NY" },
      "60601": { lat: 41.8781, lng: -87.6298, city: "Chicago", state: "IL" },
      "75001": { lat: 32.9483, lng: -96.7299, city: "Addison", state: "TX" },
      "33101": { lat: 25.7617, lng: -80.1918, city: "Miami", state: "FL" },
      "85001": { lat: 33.4484, lng: -112.074, city: "Phoenix", state: "AZ" },
      "97201": { lat: 45.5152, lng: -122.6784, city: "Portland", state: "OR" },
      "02101": { lat: 42.3601, lng: -71.0589, city: "Boston", state: "MA" },
    };

    const result = mockGeocodingData[zip];

    if (result) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      // Return a generic location for unknown ZIP codes
      res.status(200).json({
        success: true,
        data: {
          lat: 39.8283,
          lng: -98.5795,
          city: "Geographic Center",
          state: "US"
        }
      });
    }

  } catch (error) {
    console.error('Geocoding API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
