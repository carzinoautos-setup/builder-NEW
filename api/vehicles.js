// Working vehicles API that will definitely work
const mockVehicles = [
  {
    id: 1,
    make: "Toyota",
    model: "Camry",
    year: 2023,
    price: 28500,
    mileage: 15000,
    condition: "Used",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  },
  {
    id: 2,
    make: "Honda",
    model: "Civic",
    year: 2022,
    price: 24900,
    mileage: 22000,
    condition: "Used",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  },
  {
    id: 3,
    make: "Ford",
    model: "F-150",
    year: 2024,
    price: 45000,
    mileage: 5000,
    condition: "New",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  },
  {
    id: 4,
    make: "Chevrolet",
    model: "Silverado",
    year: 2023,
    price: 42000,
    mileage: 12000,
    condition: "Used",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  },
  {
    id: 5,
    make: "BMW",
    model: "3 Series",
    year: 2022,
    price: 38000,
    mileage: 18000,
    condition: "Used",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  },
  {
    id: 6,
    make: "Mercedes-Benz",
    model: "C-Class",
    year: 2023,
    price: 45000,
    mileage: 8000,
    condition: "Used",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  },
  {
    id: 7,
    make: "Audi",
    model: "A4",
    year: 2023,
    price: 42000,
    mileage: 10000,
    condition: "Used",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  },
  {
    id: 8,
    make: "Tesla",
    model: "Model 3",
    year: 2024,
    price: 39000,
    mileage: 2000,
    condition: "New",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  },
  {
    id: 9,
    make: "Lexus",
    model: "RX 350",
    year: 2023,
    price: 52000,
    mileage: 8500,
    condition: "Used",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  },
  {
    id: 10,
    make: "Nissan",
    model: "Altima",
    year: 2022,
    price: 22000,
    mileage: 25000,
    condition: "Used",
    image: "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car"
  }
];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Return working data immediately
    res.status(200).json({
      success: true,
      data: mockVehicles,
      meta: {
        totalRecords: mockVehicles.length,
        totalPages: 1,
        currentPage: 1,
        pageSize: mockVehicles.length,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  } catch (error) {
    console.error('Error in vehicles API:', error);
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
      },
    });
  }
}
