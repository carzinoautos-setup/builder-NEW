// Vercel serverless function for geocoding by zip code
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { zip } = req.query;

    if (!zip || !/^\d{5}$/.test(zip)) {
      return res.status(400).json({
        success: false,
        message: 'Valid 5-digit zip code required',
      });
    }

    // Mock geocoding data (replace with real service later)
    const mockData = {
      '98101': { lat: 47.6062, lng: -122.3321, city: 'Seattle', state: 'WA' },
      '97201': { lat: 45.5152, lng: -122.6784, city: 'Portland', state: 'OR' },
      '98032': { lat: 47.3073, lng: -122.1426, city: 'Kent', state: 'WA' },
      '98052': { lat: 47.6740, lng: -122.1215, city: 'Redmond', state: 'WA' },
    };

    const location = mockData[zip] || {
      lat: 47.6062,
      lng: -122.3321,
      city: 'Unknown',
      state: 'WA'
    };

    res.status(200).json({
      success: true,
      data: {
        zipCode: zip,
        latitude: location.lat,
        longitude: location.lng,
        city: location.city,
        state: location.state,
      },
    });
  } catch (error) {
    console.error('Error in geocoding API:', error);
    res.status(500).json({
      success: false,
      message: 'Geocoding service error',
    });
  }
}
