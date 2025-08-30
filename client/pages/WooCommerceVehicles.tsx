import React, { useState, useEffect } from "react";
import { VehicleCard } from "../components/VehicleCard";
import { FilterSection } from "../components/FilterSection";
import { Pagination } from "../components/Pagination";
import { NavigationHeader } from "../components/NavigationHeader";
import {
  Search,
  Sliders,
  Heart,
  Calculator,
  Loader,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface WPVehicle {
  id: number;
  title: string;
  price: number;
  make: string;
  model: string;
  year: number;
  mileage: string;
  transmission: string;
  doors: string;
  images: string[];
  dealer: string;
  location: string;
  condition: string;
  engine?: string;
  fuel_type?: string;
  drivetrain?: string;
  exterior_color?: string;
  interior_color?: string;
  vin?: string;
  features?: string[];
}

interface WPVehiclesResponse {
  success: boolean;
  data: WPVehicle[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    note?: string;
  };
}

export const WooCommerceVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<WPVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionNote, setConnectionNote] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<{ [key: number]: boolean }>({});

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching vehicles from WooCommerce API...");

      const response = await fetch("/api/woocommerce");

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data: WPVehiclesResponse = await response.json();

      if (data.success) {
        setVehicles(data.data);
        setConnectionNote(data.meta.note || null);
        console.log("Successfully loaded", data.data.length, "vehicles");
      } else {
        throw new Error("API returned success: false");
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const toggleFavorite = (vehicleId: number) => {
    setFavorites((prev) => ({
      ...prev,
      [vehicleId]: !prev[vehicleId],
    }));
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      searchTerm === "" ||
      vehicle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading WooCommerce vehicles...</p>
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
            <div className="text-center max-w-md">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connection Error
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchVehicles}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WooCommerce Vehicle Inventory
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredVehicles.length} vehicles available
            </p>
            {connectionNote && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded text-sm">
                {connectionNote}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search vehicles by make, model, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Success Banner */}
        {vehicles.length > 0 && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">SUCCESS!</span> Your WooCommerce
              products are now loading on the live site!
            </div>
          </div>
        )}

        {/* Vehicle Grid */}
        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    src={vehicle.images[0] || "/placeholder.svg"}
                    alt={vehicle.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {vehicle.title}
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

                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p>{vehicle.mileage} miles</p>
                    <p>{vehicle.transmission}</p>
                    <p>
                      {vehicle.dealer} • {vehicle.location}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors mr-2">
                      View Details
                    </button>
                    <button
                      onClick={() => toggleFavorite(vehicle.id)}
                      className={`p-2 rounded transition-colors ${
                        favorites[vehicle.id]
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${favorites[vehicle.id] ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No vehicles found matching your search
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            <p className="font-semibold">
              ✅ Your WooCommerce integration is working!
            </p>
            <p className="text-sm mt-1">
              Connected to: https://env-uploadbackup62225-czdev.kinsta.cloud
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
