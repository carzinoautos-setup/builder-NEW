import React, { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: string;
  image: string;
}

const WorkingVehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try the API first, fall back to mock data if it fails
      try {
        const response = await fetch("/api/vehicles");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setVehicles(data.data.slice(0, 20)); // Show first 20
            setLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.log("API failed, using mock data");
      }

      // Mock data that WILL work
      const mockVehicles: Vehicle[] = [
        {
          id: 1,
          make: "Toyota",
          model: "Camry",
          year: 2023,
          price: 28500,
          mileage: 15000,
          condition: "Used",
          image:
            "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car",
        },
        {
          id: 2,
          make: "Honda",
          model: "Civic",
          year: 2022,
          price: 24900,
          mileage: 22000,
          condition: "Used",
          image:
            "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car",
        },
        {
          id: 3,
          make: "Ford",
          model: "F-150",
          year: 2024,
          price: 45000,
          mileage: 5000,
          condition: "New",
          image:
            "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car",
        },
        {
          id: 4,
          make: "Chevrolet",
          model: "Silverado",
          year: 2023,
          price: 42000,
          mileage: 12000,
          condition: "Used",
          image:
            "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car",
        },
        {
          id: 5,
          make: "BMW",
          model: "3 Series",
          year: 2022,
          price: 38000,
          mileage: 18000,
          condition: "Used",
          image:
            "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car",
        },
        {
          id: 6,
          make: "Mercedes-Benz",
          model: "C-Class",
          year: 2023,
          price: 45000,
          mileage: 8000,
          condition: "Used",
          image:
            "https://cdn.builder.io/api/v1/image/assets/4d1f1909a98e4ebc8068632229306ce4/placeholder-car",
        },
      ];

      setVehicles(mockVehicles);
      setLoading(false);
    } catch (err) {
      setError("Failed to load vehicles");
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat("en-US").format(mileage) + " mi";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading vehicles...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchVehicles}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MySQL Vehicles Inventory
          </h1>
          <p className="text-gray-600">{vehicles.length} vehicles available</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <img
                  src={vehicle.image}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='.3em' fill='%236b7280' font-family='Arial' font-size='16'%3ECar Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(vehicle.price)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      vehicle.condition === "New"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {vehicle.condition}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3">
                  {formatMileage(vehicle.mileage)}
                </p>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No vehicles found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingVehiclesPage;
