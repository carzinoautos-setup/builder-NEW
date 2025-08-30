/**
 * Vercel Serverless Function for Vehicles API
 * Compatible with existing MySQL Vehicles page
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const search = req.query.search || '';

    // For now, return mock data that matches your UI
    // In production, this would connect to your WooCommerce API
    const mockVehicles = generateMockVehicles(page, pageSize, search);

    // Calculate pagination
    const totalRecords = 50000; // Mock total
    const totalPages = Math.ceil(totalRecords / pageSize);

    const response = {
      success: true,
      data: mockVehicles,
      meta: {
        totalRecords,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      data: [],
      meta: {
        totalRecords: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    });
  }
}

function generateMockVehicles(page, pageSize, search) {
  const vehicles = [];
  const makes = ['Ford', 'Chevrolet', 'Toyota', 'Honda', 'BMW', 'Audi', 'Mercedes-Benz', 'Nissan'];
  const models = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback'];
  const conditions = ['New', 'Used'];
  const drivetrains = ['4WD', 'AWD', 'FWD', 'RWD'];

  for (let i = 0; i < pageSize; i++) {
    const id = (page - 1) * pageSize + i + 1;
    const make = makes[Math.floor(Math.random() * makes.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const year = 2020 + Math.floor(Math.random() * 5);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const drivetrain = drivetrains[Math.floor(Math.random() * drivetrains.length)];
    const mileage = Math.floor(Math.random() * 50000);
    const price = 25000 + Math.floor(Math.random() * 50000);

    vehicles.push({
      id,
      year,
      make,
      model,
      trim: 'Base',
      body_style: model,
      condition,
      mileage,
      transmission: 'Automatic',
      doors: 4,
      engine_cylinders: 4,
      fuel_type: 'Gasoline',
      transmission_speed: 'Automatic',
      drivetrain,
      exterior_color_generic: 'White',
      interior_color_generic: 'Black',
      title_status: 'Clean',
      highway_mpg: 25,
      certified: Math.random() > 0.7,
      price,
      payments: Math.round(price / 60),
      seller_type: 'Dealer',
      seller_account_number: `D-${id}`,
      images: [
        `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop&auto=format&q=80`,
        `https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=450&h=300&fit=crop&auto=format&q=80`,
      ]
    });
  }

  // Filter by search if provided
  if (search) {
    return vehicles.filter(vehicle => 
      vehicle.make.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.year.toString().includes(search)
    );
  }

  return vehicles;
}
