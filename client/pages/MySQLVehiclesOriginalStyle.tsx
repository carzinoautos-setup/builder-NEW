import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Gauge,
  Settings,
  ChevronDown,
  X,
  Heart,
  Sliders,
  Check,
} from "lucide-react";
import { VehicleCard } from "@/components/VehicleCard";
import { FilterSection } from "@/components/FilterSection";
import { VehicleTypeCard } from "@/components/VehicleTypeCard";
import { Pagination } from "@/components/Pagination";
import { NavigationHeader } from "@/components/NavigationHeader";

// Simple vehicle interface matching original demo exactly
interface Vehicle {
  id: number;
  featured: boolean;
  viewed: boolean;
  images: string[];
  badges: string[];
  title: string;
  mileage: string;
  transmission: string;
  doors: string;
  salePrice: string | null;
  payment: string | null;
  dealer: string;
  location: string;
  phone: string;
  seller_type: string;
}

// API types
interface PaginationMeta {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface VehiclesApiResponse {
  data: Vehicle[];
  meta: PaginationMeta;
  success: boolean;
  message?: string;
}

export default function MySQLVehiclesOriginalStyle() {
  // State management - exactly like original
  const [favorites, setFavorites] = useState<{ [key: number]: Vehicle }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");
  const [vehicleImages, setVehicleImages] = useState<{ [key: string]: string }>(
    {},
  );
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // API state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<VehiclesApiResponse | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = apiResponse?.meta.totalPages || 1;
  const totalResults = apiResponse?.meta.totalRecords || 0;
  const resultsPerPage = 20;

  // Filter states - exactly like original
  const [searchTerm, setSearchTerm] = useState("");

  // Location/Distance states
  const [zipCode, setZipCode] = useState("98498"); // Default ZIP
  const [radius, setRadius] = useState("200"); // Default radius in miles
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number; city?: string; state?: string} | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    condition: ["New"] as string[],
    make: ["Audi"] as string[],
    model: [] as string[],
    trim: [] as string[],
    vehicleType: [] as string[],
    driveType: [] as string[],
    mileage: "",
    exteriorColor: [] as string[],
    sellerType: [] as string[],
    priceMin: "",
    priceMax: "",
    paymentMin: "",
    paymentMax: "",
  });

  const [collapsedFilters, setCollapsedFilters] = useState({
    vehicleType: true,
    condition: false,
    mileage: false,
    make: false,
    model: false,
    trim: false,
    price: false,
    payment: false,
    driveType: false,
    transmissionSpeed: true,
    exteriorColor: true,
    interiorColor: true,
    sellerType: true,
    dealer: true,
    state: true,
    city: true,
  });

  // Price and payment filter states
  const [priceMin, setPriceMin] = useState("10000");
  const [priceMax, setPriceMax] = useState("100000");
  const [paymentMin, setPaymentMin] = useState("100");
  const [paymentMax, setPaymentMax] = useState("2000");
  const [termLength, setTermLength] = useState("60");
  const [interestRate, setInterestRate] = useState("5");
  const [downPayment, setDownPayment] = useState("2000");

  // Fetch vehicles from API
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: resultsPerPage.toString(),
      });

      // Add search term
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      // Add location/distance parameters
      if (userLocation && radius !== "nationwide") {
        params.append("lat", userLocation.lat.toString());
        params.append("lng", userLocation.lng.toString());
        params.append("radius", radius);
      }

      // Add filters
      if (appliedFilters.condition.length > 0) {
        params.append("condition", appliedFilters.condition.join(","));
      }
      if (appliedFilters.make.length > 0) {
        params.append("make", appliedFilters.make.join(","));
      }
      if (appliedFilters.model.length > 0) {
        params.append("model", appliedFilters.model.join(","));
      }
      if (appliedFilters.trim.length > 0) {
        params.append("trim", appliedFilters.trim.join(","));
      }
      if (appliedFilters.vehicleType.length > 0) {
        params.append("vehicleType", appliedFilters.vehicleType.join(","));
      }
      if (appliedFilters.driveType.length > 0) {
        params.append("driveType", appliedFilters.driveType.join(","));
      }
      if (appliedFilters.mileage) {
        params.append("mileage", appliedFilters.mileage);
      }
      if (appliedFilters.exteriorColor.length > 0) {
        params.append("exteriorColor", appliedFilters.exteriorColor.join(","));
      }
      if (appliedFilters.sellerType.length > 0) {
        params.append("sellerType", appliedFilters.sellerType.join(","));
      }
      if (appliedFilters.priceMin) {
        params.append("priceMin", appliedFilters.priceMin);
      }
      if (appliedFilters.priceMax) {
        params.append("priceMax", appliedFilters.priceMax);
      }
      if (appliedFilters.paymentMin) {
        params.append("paymentMin", appliedFilters.paymentMin);
      }
      if (appliedFilters.paymentMax) {
        params.append("paymentMax", appliedFilters.paymentMax);
      }

      const response = await fetch(`/api/simple-vehicles?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: VehiclesApiResponse = await response.json();

      if (data.success) {
        setVehicles(data.data);
        setApiResponse(data);
      } else {
        setError(data.message || "Failed to fetch vehicles");
        setVehicles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, appliedFilters, searchTerm, userLocation, radius]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("carzino_favorites") || "{}",
    );
    setFavorites(savedFavorites);
  }, []);

  // Fetch vehicles when dependencies change
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Geocode ZIP code when it changes (with debouncing)
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (zipCode && zipCode.length >= 5) {
        const location = await geocodeZip(zipCode);
        setUserLocation(location);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(debounceTimer);
  }, [zipCode]);

  // Geocode default ZIP on component mount
  useEffect(() => {
    const initializeLocation = async () => {
      const location = await geocodeZip("98498");
      setUserLocation(location);
    };

    initializeLocation();
  }, []);

  // Load vehicle type images
  useEffect(() => {
    const loadImages = async () => {
      const imageMapping = {
        Convertible:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F064c51214995430a9384ae9f1722bee9",
        Coupe:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F1d042ebb458842a8a468794ae563fcc6",
        Hatchback:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fb06dd82e2c564b7eb30b1d5fa14e0562",
        Sedan:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F0eccbe1eccb94b3b8eee4d8cfb611864",
        "SUV / Crossover":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fffc8b9d69ce743d080a0b5ba9a64e89a",
        Truck:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
        "Van / Minivan":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Ff0d0c6c20e02423dad8eefa6f0ef508a",
        Wagon:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F24bf3ece0537462bbd1edd12a2485c0a?format=webp",
      };

      const loadedImages: { [key: string]: string } = {};
      for (const [vehicleType, imageUrl] of Object.entries(imageMapping)) {
        loadedImages[vehicleType] = imageUrl;
      }
      setVehicleImages(loadedImages);
    };

    loadImages();
  }, []);

  // Helper functions - exactly like original
  const saveFavorites = (newFavorites: { [key: number]: Vehicle }) => {
    setFavorites(newFavorites);
    localStorage.setItem("carzino_favorites", JSON.stringify(newFavorites));
  };

  const toggleFavorite = (vehicle: Vehicle) => {
    const newFavorites = { ...favorites };
    const wasAlreadyFavorited = !!newFavorites[vehicle.id];

    if (wasAlreadyFavorited) {
      delete newFavorites[vehicle.id];
    } else {
      newFavorites[vehicle.id] = vehicle;
      setKeeperMessage(vehicle.id);
      setTimeout(() => setKeeperMessage(null), 2000);
    }
    saveFavorites(newFavorites);
  };

  const getDisplayedVehicles = () => {
    if (viewMode === "favorites") {
      return Object.values(favorites);
    }
    return vehicles;
  };

  const toggleFilter = (filterName: string) => {
    setCollapsedFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  const removeAppliedFilter = (category: string, value: string) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [category]: (prev[category as keyof typeof prev] as string[]).filter(
        (item: string) => item !== value,
      ),
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setAppliedFilters({
      condition: [],
      make: [],
      model: [],
      trim: [],
      vehicleType: [],
      driveType: [],
      mileage: "",
      exteriorColor: [],
      sellerType: [],
      priceMin: "",
      priceMax: "",
      paymentMin: "",
      paymentMax: "",
    });
    setPriceMin("10000");
    setPriceMax("100000");
    setPaymentMin("100");
    setPaymentMax("2000");
    setCurrentPage(1);
  };

  const displayedVehicles = getDisplayedVehicles();
  const favoritesCount = Object.keys(favorites).length;

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Apply payment filters handler
  const applyPaymentFilters = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      paymentMin: paymentMin,
      paymentMax: paymentMax,
    }));
    setCurrentPage(1); // Reset to first page when applying filters
  };

  // Geocoding function to convert ZIP to lat/lng
  const geocodeZip = async (zip: string): Promise<{lat: number; lng: number; city?: string; state?: string} | null> => {
    if (!zip || zip.length < 5) return null;

    try {
      setIsGeocodingLoading(true);

      // First try to call our API geocoding endpoint if available
      const response = await fetch(`/api/geocode/${zip}`);
      if (response.ok) {
        const data = await response.json();
        if (data.lat && data.lng) {
          return {
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lng),
            city: data.city,
            state: data.state
          };
        }
      }

      // Fallback to browser geolocation API or external service
      // For now, we'll use a simple ZIP to coordinate mapping for common ZIPs
      const zipCoordinates: { [key: string]: {lat: number; lng: number; city: string; state: string} } = {
        "98498": { lat: 47.0379, lng: -122.9015, city: "Lakewood", state: "WA" },
        "90210": { lat: 34.0901, lng: -118.4065, city: "Beverly Hills", state: "CA" },
        "10001": { lat: 40.7505, lng: -73.9934, city: "New York", state: "NY" },
        "60601": { lat: 41.8781, lng: -87.6298, city: "Chicago", state: "IL" },
        "75001": { lat: 32.9483, lng: -96.7299, city: "Addison", state: "TX" }
      };

      const coords = zipCoordinates[zip];
      if (coords) {
        return coords;
      }

      console.warn(`No coordinates found for ZIP: ${zip}`);
      return null;

    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  // Color data for filters
  const exteriorColors = [
    { name: "Black", color: "#000000", count: 8234 },
    { name: "White", color: "#FFFFFF", count: 7456 },
    { name: "Silver", color: "#C0C0C0", count: 6789 },
    { name: "Gray", color: "#808080", count: 5234 },
    { name: "Blue", color: "#0000FF", count: 4567 },
    { name: "Red", color: "#FF0000", count: 3456 },
  ];

  const interiorColors = [
    { name: "Black", color: "#000000", count: 12456 },
    { name: "Gray", color: "#808080", count: 8234 },
    { name: "Beige", color: "#F5F5DC", count: 6789 },
    { name: "Brown", color: "#8B4513", count: 4567 },
  ];

  // Color swatch component
  const ColorSwatch = ({
    color,
    name,
    count,
  }: {
    color: string;
    name: string;
    count: number;
  }) => (
    <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
      <input
        type="checkbox"
        className="mr-2"
        checked={appliedFilters.exteriorColor.includes(name)}
        onChange={(e) => {
          e.stopPropagation();
          if (e.target.checked) {
            setAppliedFilters((prev) => ({
              ...prev,
              exteriorColor: [...prev.exteriorColor, name],
            }));
          } else {
            removeAppliedFilter("exteriorColor", name);
          }
        }}
      />
      <div
        className="w-4 h-4 rounded border border-gray-300 mr-2"
        style={{ backgroundColor: color }}
      ></div>
      <span className="carzino-filter-option">{name}</span>
      <span className="carzino-filter-count ml-1">({count})</span>
    </label>
  );

  return (
    <div
      className="min-h-screen bg-white main-container"
      style={{ fontFamily: "Albert Sans, sans-serif" }}
    >
      <NavigationHeader />
      <style>{`
        :root {
          --carzino-featured-badge: 12px;
          --carzino-badge-label: 12px;
          --carzino-vehicle-title: 16px;
          --carzino-vehicle-details: 12px;
          --carzino-price-label: 12px;
          --carzino-price-value: 16px;
          --carzino-dealer-info: 10px;
          --carzino-image-counter: 12px;
          --carzino-filter-title: 16px;
          --carzino-filter-option: 14px;
          --carzino-filter-count: 14px;
          --carzino-search-input: 14px;
          --carzino-location-label: 14px;
          --carzino-dropdown-option: 14px;
          --carzino-vehicle-type-name: 12px;
          --carzino-vehicle-type-count: 11px;
          --carzino-show-more: 14px;
        }

        @media (max-width: 768px) {
          :root {
            --carzino-vehicle-title: 17px;
            --carzino-price-value: 17px;
            --carzino-dealer-info: 11px;
            --carzino-filter-title: 17px;
            --carzino-filter-option: 15px;
            --carzino-filter-count: 15px;
            --carzino-search-input: 15px;
            --carzino-location-label: 15px;
            --carzino-dropdown-option: 15px;
            --carzino-vehicle-type-name: 13px;
            --carzino-vehicle-type-count: 12px;
            --carzino-show-more: 15px;
          }
        }

        @media (max-width: 640px) {
          :root {
            --carzino-featured-badge: 14px;
            --carzino-badge-label: 14px;
            --carzino-vehicle-title: 18px;
            --carzino-vehicle-details: 13px;
            --carzino-price-label: 14px;
            --carzino-price-value: 18px;
            --carzino-dealer-info: 12px;
            --carzino-image-counter: 14px;
            --carzino-filter-title: 18px;
            --carzino-filter-option: 16px;
            --carzino-filter-count: 16px;
            --carzino-search-input: 16px;
            --carzino-location-label: 16px;
            --carzino-dropdown-option: 16px;
            --carzino-vehicle-type-name: 14px;
            --carzino-vehicle-type-count: 13px;
            --carzino-show-more: 16px;
          }
        }

        .carzino-featured-badge { font-size: var(--carzino-featured-badge) !important; font-weight: 500 !important; }
        .carzino-badge-label { font-size: var(--carzino-badge-label) !important; font-weight: 500 !important; }
        .carzino-vehicle-title { font-size: var(--carzino-vehicle-title) !important; font-weight: 600 !important; }
        .carzino-vehicle-details { font-size: var(--carzino-vehicle-details) !important; font-weight: 400 !important; }
        .carzino-price-label { font-size: var(--carzino-price-label) !important; font-weight: 400 !important; }
        .carzino-price-value { font-size: var(--carzino-price-value) !important; font-weight: 700 !important; }
        .carzino-dealer-info { font-size: 12px !important; font-weight: 500 !important; }
        .carzino-image-counter { font-size: var(--carzino-image-counter) !important; font-weight: 400 !important; }
        .carzino-filter-title { font-size: var(--carzino-filter-title) !important; font-weight: 600 !important; }
        .carzino-filter-option { font-size: var(--carzino-filter-option) !important; font-weight: 400 !important; }
        .carzino-filter-count { font-size: var(--carzino-filter-count) !important; font-weight: 400 !important; color: #6B7280 !important; }
        .carzino-search-input { font-size: var(--carzino-search-input) !important; font-weight: 400 !important; }
        .carzino-location-label { font-size: var(--carzino-location-label) !important; font-weight: 500 !important; }
        .carzino-dropdown-option { font-size: var(--carzino-dropdown-option) !important; font-weight: 400 !important; }
        .carzino-vehicle-type-name { font-size: var(--carzino-vehicle-type-name) !important; font-weight: 500 !important; }
        .carzino-vehicle-type-count { font-size: var(--carzino-vehicle-type-count) !important; font-weight: 400 !important; color: #6B7280 !important; }
        .carzino-show-more { font-size: var(--carzino-show-more) !important; font-weight: 500 !important; }

        input[type="checkbox"] {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid #d1d5db;
          border-radius: 3px;
          background-color: white;
          position: relative;
          cursor: pointer;
        }

        input[type="checkbox"]:hover {
          border-color: #6b7280;
          background-color: #f9fafb;
        }

        input[type="checkbox"]:checked {
          background-color: #dc2626;
          border-color: #dc2626;
        }

        input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          color: white;
          font-size: 12px;
          top: -2px;
          left: 2px;
        }

        @media (max-width: 639px) {
          .vehicle-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .main-container {
            padding: 0 !important;
          }

          .vehicle-card {
            border-radius: 8px !important;
            margin: 0 12px !important;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .vehicle-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
        }

        @media (min-width: 1024px) {
          .vehicle-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 24px !important;
          }

          .main-container {
            max-width: 1325px !important;
            margin: 0 auto !important;
          }
        }

        @media (max-width: 1023px) {
          .mobile-filter-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 35;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .mobile-filter-overlay.open {
            opacity: 1;
            visibility: visible;
          }

          .mobile-filter-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            bottom: 0;
            background: white;
            z-index: 40;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            width: 100% !important;
            max-width: 100% !important;
            overflow-y: auto !important;
            overflow-x: hidden;
            display: block !important;
            -webkit-overflow-scrolling: touch;
          }

          .mobile-filter-sidebar.open {
            transform: translateX(0);
          }

          .mobile-chevron {
            width: 22px !important;
            height: 22px !important;
          }
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        select:focus {
          outline: none;
          border-color: #dc2626;
        }

        .filter-tag {
          background-color: white;
          border: 1px solid #e5e7eb;
          color: #374151;
        }

        .filter-tag:hover .remove-x {
          color: #dc2626;
        }

        .view-switcher {
          display: inline-flex;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 2px;
        }

        .view-switcher button {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .view-switcher button.active {
          background: #dc2626;
          color: white;
        }

        .view-switcher button:not(.active) {
          background: transparent;
          color: #6b7280;
        }

        .view-switcher button:not(.active):hover {
          color: #374151;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row min-h-screen max-w-[1325px] mx-auto">
        <div
          className={`mobile-filter-overlay lg:hidden ${mobileFiltersOpen ? "open" : ""}`}
          onClick={() => setMobileFiltersOpen(false)}
        ></div>

        {/* Sidebar - exactly like original */}
        <div
          className={`bg-white border-r border-gray-200 mobile-filter-sidebar hidden lg:block ${mobileFiltersOpen ? "open" : ""}`}
          style={{ width: "280px" }}
        >
          <div className="lg:hidden flex justify-between items-center mb-4 pb-4 border-b px-4 pt-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            {/* Search Section - Mobile Only */}
            <div className="lg:hidden mb-4 pb-4 border-b border-gray-200">
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search Vehicles"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="carzino-search-input w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-red-600"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* Applied Filters in Mobile Filter Panel */}
              {(searchTerm.trim() ||
                appliedFilters.condition.length > 0 ||
                appliedFilters.make.length > 0 ||
                appliedFilters.model.length > 0 ||
                appliedFilters.trim.length > 0 ||
                appliedFilters.driveType.length > 0 ||
                appliedFilters.vehicleType.length > 0 ||
                appliedFilters.mileage ||
                appliedFilters.exteriorColor.length > 0 ||
                appliedFilters.sellerType.length > 0 ||
                appliedFilters.priceMin ||
                appliedFilters.priceMax ||
                appliedFilters.paymentMin ||
                appliedFilters.paymentMax) && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs"
                  >
                    Clear All
                  </button>
                  {searchTerm.trim() && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {appliedFilters.condition.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("condition", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.make.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("make", item)}
                        className="ml-1 text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Search Section */}
            <div className="hidden lg:block mb-4 pb-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Vehicles"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="carzino-search-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop Applied Filters */}
            {(searchTerm.trim() ||
              appliedFilters.condition.length > 0 ||
              appliedFilters.make.length > 0 ||
              appliedFilters.model.length > 0 ||
              appliedFilters.trim.length > 0 ||
              appliedFilters.driveType.length > 0 ||
              appliedFilters.vehicleType.length > 0 ||
              appliedFilters.mileage ||
              appliedFilters.exteriorColor.length > 0 ||
              appliedFilters.sellerType.length > 0 ||
              appliedFilters.priceMin ||
              appliedFilters.priceMax ||
              appliedFilters.paymentMin ||
              appliedFilters.paymentMax) && (
              <div className="hidden lg:block mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="carzino-filter-title">Applied Filters</h3>
                  <button
                    onClick={clearAllFilters}
                    className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-red-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchTerm.trim() && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {appliedFilters.condition.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("condition", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.make.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("make", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.model.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("model", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.trim.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("trim", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.vehicleType.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("vehicleType", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.driveType.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("driveType", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.exteriorColor.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item} Color
                      <button
                        onClick={() =>
                          removeAppliedFilter("exteriorColor", item)
                        }
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.sellerType.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs"
                    >
                      <Check className="w-3 h-3 text-red-600" />
                      {item}
                      <button
                        onClick={() => removeAppliedFilter("sellerType", item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {appliedFilters.mileage && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />
                      {appliedFilters.mileage === "100001"
                        ? "100k+ miles"
                        : `Under ${parseInt(appliedFilters.mileage).toLocaleString()} mi`}
                      <button
                        onClick={() =>
                          setAppliedFilters((prev) => ({
                            ...prev,
                            mileage: "",
                          }))
                        }
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(appliedFilters.priceMin || appliedFilters.priceMax) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />$
                      {appliedFilters.priceMin || "0"} - $
                      {appliedFilters.priceMax || "Any"}
                      <button
                        onClick={() => {
                          setAppliedFilters((prev) => ({
                            ...prev,
                            priceMin: "",
                            priceMax: "",
                          }));
                          setPriceMin("10000");
                          setPriceMax("100000");
                        }}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {(appliedFilters.paymentMin || appliedFilters.paymentMax) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs">
                      <Check className="w-3 h-3 text-red-600" />$
                      {appliedFilters.paymentMin || "0"}-$
                      {appliedFilters.paymentMax || "Any"}/mo
                      <button
                        onClick={() =>
                          setAppliedFilters((prev) => ({
                            ...prev,
                            paymentMin: "",
                            paymentMax: "",
                          }))
                        }
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Distance */}
            <div className="mb-4 pb-4 border border-gray-200 rounded-lg p-3">
              <label className="carzino-location-label block mb-2">
                Distance
              </label>
              <input
                type="text"
                placeholder="ZIP Code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="carzino-search-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              />
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="carzino-dropdown-option w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none mt-2"
              >
                <option value="10">10 Miles</option>
                <option value="25">25 Miles</option>
                <option value="50">50 Miles</option>
                <option value="100">100 Miles</option>
                <option value="200">200 Miles</option>
                <option value="500">500 Miles</option>
                <option value="nationwide">Nationwide</option>
              </select>
            </div>

            {/* Make Filter */}
            <FilterSection
              title="Make"
              isCollapsed={collapsedFilters.make}
              onToggle={() => toggleFilter("make")}
            >
              <div className="space-y-1">
                {[
                  "Audi",
                  "BMW",
                  "Chevrolet",
                  "Ford",
                  "Honda",
                  "Hyundai",
                  "Mercedes-Benz",
                  "Nissan",
                ].map((make) => (
                  <label
                    key={make}
                    className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={appliedFilters.make.includes(make)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setAppliedFilters((prev) => ({
                            ...prev,
                            make: [...prev.make, make],
                          }));
                        } else {
                          removeAppliedFilter("make", make);
                        }
                      }}
                    />
                    <span className="carzino-filter-option">{make}</span>
                    <span className="carzino-filter-count ml-1">
                      ({Math.floor(Math.random() * 1000) + 100})
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Model (Conditional) */}
            <FilterSection
              title="Model (Audi)"
              isCollapsed={collapsedFilters.model}
              onToggle={() => toggleFilter("model")}
            >
              <div className="space-y-1">
                {appliedFilters.make.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    Select a make first to see available models
                  </div>
                ) : (
                  ["A3", "A4", "A6", "Q5", "Q7", "Q8"].map((model) => (
                    <label
                      key={model}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.model.includes(model)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              model: [...prev.model, model],
                            }));
                          } else {
                            removeAppliedFilter("model", model);
                          }
                        }}
                      />
                      <span className="carzino-filter-option">{model}</span>
                      <span className="carzino-filter-count ml-1">
                        ({Math.floor(Math.random() * 100) + 10})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </FilterSection>

            {/* Trim (Conditional) */}
            <FilterSection
              title="Trim"
              isCollapsed={collapsedFilters.trim}
              onToggle={() => toggleFilter("trim")}
            >
              <div className="space-y-1">
                {appliedFilters.make.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    Select a make first to see available trims
                  </div>
                ) : (
                  ["Premium", "Premium Plus", "Prestige", "S Line"].map(
                    (trim) => (
                      <label
                        key={trim}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.trim.includes(trim)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                trim: [...prev.trim, trim],
                              }));
                            } else {
                              removeAppliedFilter("trim", trim);
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{trim}</span>
                        <span className="carzino-filter-count ml-1">
                          ({Math.floor(Math.random() * 50) + 5})
                        </span>
                      </label>
                    ),
                  )
                )}
              </div>
            </FilterSection>

            {/* Price Filter */}
            <FilterSection
              title="Price"
              isCollapsed={collapsedFilters.price}
              onToggle={() => toggleFilter("price")}
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="100"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      onBlur={(e) => {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          priceMin: e.target.value,
                        }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-search-input w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded focus:outline-none"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="100,000"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      onBlur={(e) => {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          priceMax: e.target.value,
                        }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-search-input w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Payment Filter */}
            <FilterSection
              title="Payment"
              isCollapsed={collapsedFilters.payment}
              onToggle={() => toggleFilter("payment")}
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="100"
                      value={paymentMin}
                      onChange={(e) => {
                        setPaymentMin(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-search-input w-full pl-6 pr-8 py-1.5 border border-gray-300 rounded focus:outline-none"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                      /mo
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="2,000"
                      value={paymentMax}
                      onChange={(e) => {
                        setPaymentMax(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-search-input w-full pl-6 pr-8 py-1.5 border border-gray-300 rounded focus:outline-none"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                      /mo
                    </span>
                  </div>
                </div>

                {/* Term Length and Interest Rate */}
                <div className="flex gap-2">
                  <select
                    value={termLength}
                    onChange={(e) => {
                      setTermLength(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="carzino-dropdown-option flex-1 px-2 py-1.5 border border-gray-300 rounded focus:outline-none bg-white"
                  >
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                    <option value="48">48 Months</option>
                    <option value="60">60 Months</option>
                    <option value="72">72 Months</option>
                    <option value="84">84 Months</option>
                  </select>
                  <select
                    value={interestRate}
                    onChange={(e) => {
                      setInterestRate(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="carzino-dropdown-option flex-1 px-2 py-1.5 border border-gray-300 rounded focus:outline-none bg-white"
                  >
                    <option value="0">0% APR</option>
                    <option value="3">3% APR</option>
                    <option value="4">4% APR</option>
                    <option value="5">5% APR</option>
                    <option value="6">6% APR</option>
                    <option value="7">7% APR</option>
                    <option value="8">8% APR</option>
                    <option value="9">9% APR</option>
                    <option value="10">10% APR</option>
                    <option value="12">12% APR</option>
                    <option value="16">16% APR</option>
                  </select>
                </div>

                {/* Down Payment */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Down Payment: $2,000"
                    value={`Down Payment: ${downPayment}`}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "");
                      setDownPayment(value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="carzino-search-input w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none text-gray-500"
                  />
                </div>

                {/* Apply Button */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      applyPaymentFilters();
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Apply Payment Filters
                  </button>
                </div>
              </div>
            </FilterSection>

            {/* Condition */}
            <FilterSection
              title="Condition"
              isCollapsed={collapsedFilters.condition}
              onToggle={() => toggleFilter("condition")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.condition.includes("New")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          condition: [...prev.condition, "New"],
                        }));
                      } else {
                        removeAppliedFilter("condition", "New");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">New</span>
                  <span className="carzino-filter-count ml-1">(125,989)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.condition.includes("Used")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          condition: [...prev.condition, "Used"],
                        }));
                      } else {
                        removeAppliedFilter("condition", "Used");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Used</span>
                  <span className="carzino-filter-count ml-1">(78,800)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.condition.includes("Certified")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          condition: [...prev.condition, "Certified"],
                        }));
                      } else {
                        removeAppliedFilter("condition", "Certified");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Certified</span>
                  <span className="carzino-filter-count ml-1">(9,889)</span>
                </label>
              </div>
            </FilterSection>

            {/* Mileage */}
            <FilterSection
              title="Mileage"
              isCollapsed={collapsedFilters.mileage}
              onToggle={() => toggleFilter("mileage")}
            >
              <div className="space-y-1">
                <select
                  className="carzino-dropdown-option w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none bg-white"
                  value={appliedFilters.mileage}
                  onChange={(e) =>
                    setAppliedFilters((prev) => ({
                      ...prev,
                      mileage: e.target.value,
                    }))
                  }
                >
                  <option value="">Any Mileage</option>
                  <option value="10000">10,000 or less</option>
                  <option value="20000">20,000 or less</option>
                  <option value="30000">30,000 or less</option>
                  <option value="40000">40,000 or less</option>
                  <option value="50000">50,000 or less</option>
                  <option value="60000">60,000 or less</option>
                  <option value="70000">70,000 or less</option>
                  <option value="80000">80,000 or less</option>
                  <option value="90000">90,000 or less</option>
                  <option value="100000">100,000 or less</option>
                  <option value="100001">100,000 or more</option>
                </select>
              </div>
            </FilterSection>

            {/* Search by Vehicle Type */}
            <FilterSection
              title="Search by Vehicle Type"
              isCollapsed={collapsedFilters.vehicleType}
              onToggle={() => toggleFilter("vehicleType")}
            >
              <div className="grid grid-cols-2 gap-2">
                {appliedFilters.make.length === 0 ? (
                  <div className="col-span-2 text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                    Select a make first to see available vehicle types
                  </div>
                ) : (
                  [
                    { name: "Sedan", count: 1698 },
                    { name: "SUV / Crossover", count: 3405 },
                    { name: "Truck", count: 2217 },
                    { name: "Coupe", count: 419 },
                  ].map((type, index) => (
                    <VehicleTypeCard
                      key={index}
                      type={type.name}
                      count={type.count}
                      vehicleImages={vehicleImages}
                      isSelected={appliedFilters.vehicleType.includes(
                        type.name,
                      )}
                      onToggle={() => {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          vehicleType: prev.vehicleType.includes(type.name)
                            ? prev.vehicleType.filter(
                                (item) => item !== type.name,
                              )
                            : [...prev.vehicleType, type.name],
                        }));
                      }}
                    />
                  ))
                )}
              </div>
            </FilterSection>

            {/* Drive Type */}
            <FilterSection
              title="Drive Type"
              isCollapsed={collapsedFilters.driveType}
              onToggle={() => toggleFilter("driveType")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.driveType.includes("AWD/4WD")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          driveType: [...prev.driveType, "AWD/4WD"],
                        }));
                      } else {
                        removeAppliedFilter("driveType", "AWD/4WD");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">AWD/4WD</span>
                  <span className="carzino-filter-count ml-1">(25,309)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.driveType.includes("FWD")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          driveType: [...prev.driveType, "FWD"],
                        }));
                      } else {
                        removeAppliedFilter("driveType", "FWD");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">FWD</span>
                  <span className="carzino-filter-count ml-1">(12,057)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.driveType.includes("RWD")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          driveType: [...prev.driveType, "RWD"],
                        }));
                      } else {
                        removeAppliedFilter("driveType", "RWD");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">RWD</span>
                  <span className="carzino-filter-count ml-1">(5,883)</span>
                </label>
              </div>
            </FilterSection>

            {/* Transmission Speed */}
            <FilterSection
              title="Transmission Speed"
              isCollapsed={collapsedFilters.transmissionSpeed}
              onToggle={() => toggleFilter("transmissionSpeed")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">
                    4-Speed Automatic
                  </span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">
                    6-Speed Automatic
                  </span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">
                    8-Speed Automatic
                  </span>
                </label>
              </div>
            </FilterSection>

            {/* Exterior Color */}
            <FilterSection
              title="Exterior Color"
              isCollapsed={collapsedFilters.exteriorColor}
              onToggle={() => toggleFilter("exteriorColor")}
            >
              <div className="space-y-1">
                {exteriorColors.map((color, index) => (
                  <ColorSwatch
                    key={index}
                    color={color.color}
                    name={color.name}
                    count={color.count}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Interior Color */}
            <FilterSection
              title="Interior Color"
              isCollapsed={collapsedFilters.interiorColor}
              onToggle={() => toggleFilter("interiorColor")}
            >
              <div className="space-y-1">
                {interiorColors.map((color, index) => (
                  <ColorSwatch
                    key={index}
                    color={color.color}
                    name={color.name}
                    count={color.count}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Seller Type */}
            <FilterSection
              title="Seller Type"
              isCollapsed={collapsedFilters.sellerType}
              onToggle={() => toggleFilter("sellerType")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.sellerType.includes("Dealer")}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          sellerType: [...prev.sellerType, "Dealer"],
                        }));
                      } else {
                        removeAppliedFilter("sellerType", "Dealer");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Dealer</span>
                  <span className="carzino-filter-count ml-1">(6,543)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.sellerType.includes(
                      "Private Seller",
                    )}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          sellerType: [...prev.sellerType, "Private Seller"],
                        }));
                      } else {
                        removeAppliedFilter("sellerType", "Private Seller");
                      }
                    }}
                  />
                  <span className="carzino-filter-option">Private Seller</span>
                  <span className="carzino-filter-count ml-1">(1,984)</span>
                </label>
              </div>
            </FilterSection>

            {/* Dealer */}
            <FilterSection
              title="Dealer"
              isCollapsed={collapsedFilters.dealer}
              onToggle={() => toggleFilter("dealer")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">
                    Bayside Auto Sales
                  </span>
                  <span className="carzino-filter-count ml-1">(234)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">ABC Car Sales</span>
                  <span className="carzino-filter-count ml-1">(156)</span>
                </label>
              </div>
            </FilterSection>

            {/* State */}
            <FilterSection
              title="State"
              isCollapsed={collapsedFilters.state}
              onToggle={() => toggleFilter("state")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">Washington</span>
                  <span className="carzino-filter-count ml-1">(12,456)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">Oregon</span>
                  <span className="carzino-filter-count ml-1">(8,234)</span>
                </label>
              </div>
            </FilterSection>

            {/* City */}
            <FilterSection
              title="City"
              isCollapsed={collapsedFilters.city}
              onToggle={() => toggleFilter("city")}
            >
              <div className="space-y-1">
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">Seattle</span>
                  <span className="carzino-filter-count ml-1">(4,567)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input type="checkbox" className="mr-2" />
                  <span className="carzino-filter-option">Portland</span>
                  <span className="carzino-filter-count ml-1">(3,234)</span>
                </label>
              </div>
            </FilterSection>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Complete Mobile Layout - matching original demo exactly */}
          <div className="lg:hidden">
            {/* Non-sticky title and search */}
            <div className="p-3 bg-white">
              <h1 className="text-lg font-semibold text-gray-900 mb-3">
                {viewMode === "favorites"
                  ? "My Favorites"
                  : "Vehicles for Sale"}
              </h1>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-600"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sticky wrapper - will stick throughout the entire scrollable area */}
            <div className={mobileFiltersOpen ? "" : "sticky top-0 z-50"}>
              {/* Applied Filters Pills */}
              {(appliedFilters.condition.length > 0 ||
                appliedFilters.make.length > 0 ||
                appliedFilters.model.length > 0 ||
                appliedFilters.trim.length > 0 ||
                appliedFilters.vehicleType.length > 0 ||
                appliedFilters.driveType.length > 0 ||
                appliedFilters.exteriorColor.length > 0 ||
                appliedFilters.mileage ||
                appliedFilters.priceMin ||
                appliedFilters.priceMax ||
                appliedFilters.paymentMin ||
                appliedFilters.paymentMax) && (
                <div className="px-3 pt-3 bg-white">
                  <div className="flex gap-2 overflow-x-auto pb-3">
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      Clear All
                    </button>
                    {appliedFilters.condition.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() => removeAppliedFilter("condition", item)}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.make.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() => removeAppliedFilter("make", item)}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.model.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() => removeAppliedFilter("model", item)}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.trim.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() => removeAppliedFilter("trim", item)}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.vehicleType.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() =>
                            removeAppliedFilter("vehicleType", item)
                          }
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.driveType.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() => removeAppliedFilter("driveType", item)}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.exteriorColor.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item} Color
                        <button
                          onClick={() =>
                            removeAppliedFilter("exteriorColor", item)
                          }
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.mileage && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                        <Check className="w-3 h-3 text-red-600" />
                        {appliedFilters.mileage === "100001"
                          ? "100k+ miles"
                          : `Under ${parseInt(appliedFilters.mileage).toLocaleString()} mi`}
                        <button
                          onClick={() =>
                            setAppliedFilters((prev) => ({
                              ...prev,
                              mileage: "",
                            }))
                          }
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {(appliedFilters.priceMin || appliedFilters.priceMax) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                        <Check className="w-3 h-3 text-red-600" />$
                        {appliedFilters.priceMin || "0"} - $
                        {appliedFilters.priceMax || "Any"}
                        <button
                          onClick={() => {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              priceMin: "",
                              priceMax: "",
                            }));
                            setPriceMin("10000");
                            setPriceMax("100000");
                          }}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {(appliedFilters.paymentMin ||
                      appliedFilters.paymentMax) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                        <Check className="w-3 h-3 text-red-600" />$
                        {appliedFilters.paymentMin || "0"}-$
                        {appliedFilters.paymentMax || "Any"}/mo
                        <button
                          onClick={() =>
                            setAppliedFilters((prev) => ({
                              ...prev,
                              paymentMin: "",
                              paymentMax: "",
                            }))
                          }
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Filter, Sort, Favorites Bar */}
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-gray-400 bg-white shadow-md">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <Sliders className="w-4 h-4" />
                  Filter
                  {appliedFilters.condition.length +
                    appliedFilters.make.length +
                    appliedFilters.model.length +
                    appliedFilters.trim.length +
                    appliedFilters.vehicleType.length +
                    appliedFilters.driveType.length +
                    appliedFilters.exteriorColor.length +
                    (appliedFilters.mileage ? 1 : 0) +
                    (appliedFilters.priceMin || appliedFilters.priceMax
                      ? 1
                      : 0) +
                    (appliedFilters.paymentMin || appliedFilters.paymentMax
                      ? 1
                      : 0) >
                    0 && (
                    <span className="bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {appliedFilters.condition.length +
                        appliedFilters.make.length +
                        appliedFilters.model.length +
                        appliedFilters.trim.length +
                        appliedFilters.vehicleType.length +
                        appliedFilters.driveType.length +
                        appliedFilters.exteriorColor.length +
                        (appliedFilters.mileage ? 1 : 0) +
                        (appliedFilters.priceMin || appliedFilters.priceMax
                          ? 1
                          : 0) +
                        (appliedFilters.paymentMin || appliedFilters.paymentMax
                          ? 1
                          : 0)}
                    </span>
                  )}
                </button>

                <div className="border-l border-gray-400 h-8"></div>

                <div className="relative">
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 4h12M2 8h8M2 12h4" />
                    </svg>
                    Sort
                  </button>
                  {sortDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] w-48">
                      <button
                        onClick={() => {
                          setSortBy("relevance");
                          setSortDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Relevance
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("price-low");
                          setSortDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Price: Low to High
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("price-high");
                          setSortDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Price: High to Low
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("year-new");
                          setSortDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Year: Newest
                      </button>
                      <button
                        onClick={() => {
                          setSortBy("mileage-low");
                          setSortDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Mileage: Lowest
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-l border-gray-400 h-8"></div>

                <button
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${viewMode === "favorites" ? "text-red-600" : ""}`}
                  onClick={() =>
                    setViewMode(viewMode === "favorites" ? "all" : "favorites")
                  }
                >
                  Favorites
                  <div className="relative">
                    <div
                      className={`w-12 h-6 rounded-full ${viewMode === "favorites" ? "bg-red-600" : "bg-gray-300"} transition-colors`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${viewMode === "favorites" ? "translate-x-6" : "translate-x-0.5"}`}
                      />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Results Count - NOT in sticky */}
            <div className="px-3 py-2 bg-gray-50 text-sm">
              <span className="font-medium">
                {viewMode === "favorites"
                  ? `${favoritesCount} Saved Vehicles`
                  : `${appliedFilters.condition.join(", ")}${appliedFilters.condition.length > 0 && appliedFilters.make.length > 0 ? ", " : ""}${appliedFilters.make.join(", ")}${appliedFilters.condition.length > 0 || appliedFilters.make.length > 0 ? " for sale" : "All Vehicles"} - ${totalResults.toLocaleString()} Results`}
              </span>
            </div>

            {/* Mobile Product Grid */}
            <div className="p-4 bg-white min-h-screen">
              {loading ? (
                <div className="text-center py-12">
                  <div className="text-lg">Loading vehicles...</div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600">Error: {error}</div>
                </div>
              ) : viewMode === "favorites" && favoritesCount === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start browsing vehicles and save your favorites by clicking
                    the heart icon.
                  </p>
                  <button
                    onClick={() => setViewMode("all")}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Browse Vehicles
                  </button>
                </div>
              ) : (
                <div>
                  <div className="vehicle-grid grid grid-cols-1 gap-4 mb-8">
                    {displayedVehicles.map((vehicle) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        keeperMessage={keeperMessage}
                      />
                    ))}
                  </div>

                  {viewMode === "all" && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalResults={totalResults}
                      resultsPerPage={resultsPerPage}
                      onPageChange={handlePageChange}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {viewMode === "favorites"
                    ? "My Favorites"
                    : "New and Used Vehicles for sale"}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {viewMode === "favorites"
                    ? `${favoritesCount} Vehicles`
                    : `${totalResults.toLocaleString()} Matches`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Desktop View Switcher - Only show when in favorites mode */}
                {viewMode === "favorites" ? (
                  <div className="view-switcher">
                    <button
                      className={viewMode === "all" ? "active" : ""}
                      onClick={() => setViewMode("all")}
                    >
                      All Results
                    </button>
                    <button
                      className={viewMode === "favorites" ? "active" : ""}
                      onClick={() => setViewMode("favorites")}
                    >
                      <Heart className="w-4 h-4" />
                      Saved ({favoritesCount})
                    </button>
                  </div>
                ) : (
                  <button
                    className="p-2 border border-gray-300 rounded hover:bg-gray-50 bg-white relative"
                    onClick={() => setViewMode("favorites")}
                  >
                    <Heart
                      className={`w-5 h-5 ${favoritesCount > 0 ? "text-red-600 fill-red-600" : "text-red-600"}`}
                    />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {favoritesCount}
                      </span>
                    )}
                  </button>
                )}

                <select className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="relevance">Sort by Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="year-new">Year: Newest First</option>
                  <option value="mileage-low">Mileage: Low to High</option>
                </select>

                <select className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="30">View: 30</option>
                  <option value="60">View: 60</option>
                  <option value="100">View: 100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Product Grid */}
          <div className="hidden md:block p-4 lg:p-4 bg-white min-h-screen">
            {viewMode === "favorites" && favoritesCount === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No favorites yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start browsing vehicles and save your favorites by clicking
                  the heart icon.
                </p>
                <button
                  onClick={() => setViewMode("all")}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Browse Vehicles
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-gray-200 animate-pulse rounded-lg h-80"
                  ></div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <div>
                <div className="vehicle-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {displayedVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      favorites={favorites}
                      onToggleFavorite={toggleFavorite}
                      keeperMessage={keeperMessage}
                    />
                  ))}
                </div>

                {viewMode === "all" && apiResponse?.meta && (
                  <Pagination
                    currentPage={apiResponse.meta.currentPage}
                    totalPages={apiResponse.meta.totalPages}
                    totalResults={apiResponse.meta.totalRecords}
                    resultsPerPage={apiResponse.meta.pageSize}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
