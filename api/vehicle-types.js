// Vercel serverless function for vehicle types
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
    // Mock vehicle types data
    const vehicleTypes = [
      { id: 1, name: 'Sedan', count: 25000 },
      { id: 2, name: 'SUV', count: 15000 },
      { id: 3, name: 'Truck', count: 8000 },
      { id: 4, name: 'Coupe', count: 3000 },
      { id: 5, name: 'Convertible', count: 1500 },
      { id: 6, name: 'Wagon', count: 1200 },
      { id: 7, name: 'Hatchback', count: 800 },
    ];

    res.status(200).json({
      success: true,
      data: vehicleTypes,
    });
  } catch (error) {
    console.error('Error in vehicle-types API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: [],
    });
  }
}
