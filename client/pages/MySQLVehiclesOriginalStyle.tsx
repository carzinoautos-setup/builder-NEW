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

// Simple vehicle interface matching original demo
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
  const [vehicleImages, setVehicleImages] = useState<{ [key: string]: string }>({});

  // API state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<VehiclesApiResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20); // Fixed page size like original

  // Filter states - exactly like original
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
        pageSize: pageSize.toString(),
      });

      // Add filters
      if (appliedFilters.condition.length > 0) {
        params.append('condition', appliedFilters.condition.join(','));
      }
      if (appliedFilters.make.length > 0) {
        params.append('make', appliedFilters.make.join(','));
      }
      if (appliedFilters.driveType.length > 0) {
        params.append('driveType', appliedFilters.driveType.join(','));
      }
      if (appliedFilters.mileage) {
        params.append('mileage', appliedFilters.mileage);
      }
      if (appliedFilters.sellerType.length > 0) {
        params.append('sellerType', appliedFilters.sellerType.join(','));
      }
      if (appliedFilters.priceMin) {
        params.append('priceMin', appliedFilters.priceMin);
      }
      if (appliedFilters.priceMax) {
        params.append('priceMax', appliedFilters.priceMax);
      }
      if (appliedFilters.paymentMin) {
        params.append('paymentMin', appliedFilters.paymentMin);
      }
      if (appliedFilters.paymentMax) {
        params.append('paymentMax', appliedFilters.paymentMax);
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
        setError(data.message || 'Failed to fetch vehicles');
        setVehicles([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, appliedFilters]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("carzino_favorites") || "{}"
    );
    setFavorites(savedFavorites);
  }, []);

  // Fetch vehicles when dependencies change
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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
        (item: string) => item !== value
      ),
    }));
  };

  const clearAllFilters = () => {
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
    setCurrentPage(1);
  };

  const displayedVehicles = getDisplayedVehicles();
  const favoritesCount = Object.keys(favorites).length;

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            --carzino-vehicle-details: 14px;
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

        .mobile-filter-overlay {
          display: none;
        }

        @media (max-width: 1024px) {
          .mobile-filter-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 40;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
          }

          .mobile-filter-overlay.open {
            opacity: 1;
            visibility: visible;
          }

          .mobile-filter-sidebar {
            position: fixed;
            top: 0;
            left: -100%;
            height: 100%;
            width: 280px;
            background: white;
            z-index: 50;
            transition: left 0.3s ease;
            overflow-y: auto;
          }

          .mobile-filter-sidebar.open {
            left: 0;
          }
        }

        .view-switcher {
          background: #f3f4f6;
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
            {/* Applied Filters Display */}
            {(appliedFilters.condition.length > 0 ||
              appliedFilters.make.length > 0 ||
              appliedFilters.driveType.length > 0 ||
              appliedFilters.mileage ||
              appliedFilters.sellerType.length > 0 ||
              appliedFilters.priceMin ||
              appliedFilters.priceMax ||
              appliedFilters.paymentMin ||
              appliedFilters.paymentMax) && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs"
                  >
                    Clear All
                  </button>
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
              </div>
            )}

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
                      onChange={(e) => setPaymentMin(e.target.value)}
                      onBlur={(e) => {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          paymentMin: e.target.value,
                        }));
                      }}
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
                      onChange={(e) => setPaymentMax(e.target.value)}
                      onBlur={(e) => {
                        setAppliedFilters((prev) => ({
                          ...prev,
                          paymentMax: e.target.value,
                        }));
                      }}
                      className="carzino-search-input w-full pl-6 pr-8 py-1.5 border border-gray-300 rounded focus:outline-none"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                      /mo
                    </span>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Condition Filter */}
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
                  <span className="carzino-filter-count ml-1">(25,989)</span>
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
                  <span className="carzino-filter-count ml-1">(18,800)</span>
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
                  <span className="carzino-filter-count ml-1">(5,889)</span>
                </label>
              </div>
            </FilterSection>

            {/* Mileage Filter */}
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

            {/* Make Filter */}
            <FilterSection
              title="Make"
              isCollapsed={collapsedFilters.make}
              onToggle={() => toggleFilter("make")}
            >
              <div className="space-y-1">
                {['Audi', 'BMW', 'Chevrolet', 'Ford', 'Honda', 'Hyundai', 'Mercedes-Benz', 'Nissan'].map((make) => (
                  <label key={make} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
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
                    <span className="carzino-filter-count ml-1">({Math.floor(Math.random() * 1000) + 100})</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Drive Type Filter */}
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

            {/* Seller Type Filter */}
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
                  <span className="carzino-filter-count ml-1">(46,543)</span>
                </label>
                <label className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={appliedFilters.sellerType.includes("Private Seller")}
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
                  <span className="carzino-filter-count ml-1">(4,134)</span>
                </label>
              </div>
            </FilterSection>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header - exactly like original */}
          <div className="bg-white border-b px-4 py-4 lg:px-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search and Filter Controls */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 lg:w-64">
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    className="carzino-search-input w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-red-600"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <Sliders className="w-4 h-4" />
                  Filters
                </button>
              </div>

              {/* Distance Section */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="carzino-location-label block">Distance</label>
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    className="carzino-search-input w-20 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none"
                  />
                  <select className="carzino-dropdown-option px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none">
                    <option value="10">10 Miles</option>
                    <option value="25">25 Miles</option>
                    <option value="50">50 Miles</option>
                    <option value="100">100 Miles</option>
                    <option value="200">200 Miles</option>
                    <option value="500">500 Miles</option>
                    <option value="nationwide">Nationwide</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results and View Toggle */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                {loading ? 'Loading...' : error ? 'Error loading vehicles' : 
                  `All Vehicles - ${apiResponse?.meta.totalRecords.toLocaleString() || 0} Results`}
              </div>

              <div className="view-switcher">
                <button
                  className={viewMode === "all" ? "active" : ""}
                  onClick={() => setViewMode("all")}
                >
                  All Vehicles
                </button>
                <button
                  className={viewMode === "favorites" ? "active" : ""}
                  onClick={() => setViewMode("favorites")}
                >
                  <Heart className="w-4 h-4" />
                  Favorites ({favoritesCount})
                </button>
              </div>
            </div>
          </div>

          {/* Vehicle Grid */}
          <div className="flex-1 p-4 lg:p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-80"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

                {/* Pagination */}
                {apiResponse?.meta && (
                  <Pagination
                    currentPage={apiResponse.meta.currentPage}
                    totalPages={apiResponse.meta.totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
