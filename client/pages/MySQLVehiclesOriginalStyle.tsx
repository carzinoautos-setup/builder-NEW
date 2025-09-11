import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Gauge,
  Settings,
  ChevronDown,
  X,
  Heart,
  Sliders,
  Check,
  MapPin,
  Loader,
  AlertTriangle,
} from "lucide-react";
import { VehicleCard } from "@/components/VehicleCard";
import { FilterSection } from "@/components/FilterSection";
import { VehicleTypeCard } from "@/components/VehicleTypeCard";
import { Pagination } from "@/components/Pagination";
import { NavigationHeader } from "@/components/NavigationHeader";
import Footer from "@/components/Footer";
import {
  VehicleRecord,
  VehiclesApiResponse,
  vehicleApi,
  getVehicleTitle,
  formatPrice,
  formatMileage,
} from "@/lib/vehicleApi";
import useFilters, { loadPersistedAppliedFilters } from "@/hooks/useFilters";
import { useIsMobile } from "@/hooks/use-mobile";

// Enhanced vehicle interface for display with all custom fields
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
  seller_account_number: string;
  // NEW: Additional custom fields from VehicleRecord
  year: number;
  make: string;
  model: string;
  trim: string;
  body_style: string;
  engine_cylinders: number;
  fuel_type: string;
  transmission_speed: string;
  drivetrain: string;
  exterior_color_generic: string;
  interior_color_generic: string;
  title_status: string;
  highway_mpg: number;
  condition: string;
  certified: boolean;
  rawPrice: number;
  rawMileage: number;
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

// URL utility functions
const parseFiltersFromURL = (pathname: string) => {
  // Check query params first (e.g. ?make=Toyota,Ford&model=Camry,Corolla)
  const qs = new URLSearchParams(window.location.search || "");
  const getArr = (key: string) => {
    const v = qs.get(key);
    if (!v) return undefined;
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const make = getArr("make");
  const model = getArr("model");
  const trim = getArr("trim");
  const condition = getArr("condition");
  const year = getArr("year");
  const bodyStyle = getArr("bodyStyle") || getArr("body_style");

  // If no query params, fall back to path segments (legacy)
  if (!make && !model && !trim && !condition && !year && !bodyStyle) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "cars-for-sale") segments.shift();
    return {
      make: segments[0] ? [segments[0]] : undefined,
      model: segments[1] ? [segments[1]] : undefined,
      trim: segments[2] ? [segments[2]] : undefined,
      condition: segments[3] ? [segments[3]] : undefined,
      year: segments[4] ? [segments[4]] : undefined,
      bodyStyle: segments[5] ? [segments[5]] : undefined,
    };
  }

  return { make, model, trim, condition, year, bodyStyle };
};

const generateURLFromFilters = (filters: {
  make?: string[];
  model?: string[];
  trim?: string[];
  condition?: string[];
  year?: string;
  bodyStyle?: string;
}) => {
  const segments = [];

  // Only include the first selected value for each filter in URL
  if (filters.make && filters.make.length > 0) {
    segments.push(filters.make[0].toLowerCase().replace(/\s+/g, "-"));
  }
  if (filters.model && filters.model.length > 0) {
    segments.push(filters.model[0].toLowerCase().replace(/\s+/g, "-"));
  }
  if (filters.trim && filters.trim.length > 0) {
    segments.push(filters.trim[0].toLowerCase().replace(/\s+/g, "-"));
  }
  if (filters.condition && filters.condition.length > 0) {
    segments.push(filters.condition[0].toLowerCase());
  }
  if (filters.year) {
    segments.push(filters.year);
  }
  if (filters.bodyStyle) {
    segments.push(filters.bodyStyle.toLowerCase().replace(/\s+/g, "-"));
  }

  return `/cars-for-sale/${segments.join("/")}/`;
};

const normalizeFilterValue = (value: string) => {
  // Convert URL-safe values back to display values
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Normalize transmission speed values for consistent display
const normalizeTransmission = (value: string) => {
  if (!value) return "";
  const str = value.trim();
  // Auto/CVT
  if (/cvt/i.test(str)) return "Auto/CVT";
  // Manual
  if (/manual/i.test(str)) {
    const match = str.match(/(\d+)\s*[-]?\s*speed/i);
    return match ? `${match[1]}-Speed Manual` : "Manual";
  }
  // Automatic
  if (/automatic/i.test(str)) {
    const match = str.match(/(\d+)\s*[-]?\s*speed/i);
    return match ? `${match[1]}-Speed Automatic` : "Automatic";
  }
  // Fallback
  return str;
};

// Transform VehicleRecord from API to Vehicle for display
const transformVehicleRecord = (record: VehicleRecord): Vehicle => {
  // Generate vehicle title from components
  const title = getVehicleTitle(record);

  // Choose images from API: prefer featured_image, then images array; fall back to placeholder
  const vehicleImages = [] as string[];
  const featured =
    (record as any).featured_image ||
    (record as any).featuredImage ||
    (record as any).acf?.featured_image;
  if (featured) {
    vehicleImages.push(featured);
  } else if (
    (record as any).images &&
    Array.isArray((record as any).images) &&
    (record as any).images.length > 0
  ) {
    // images may be array of urls or objects
    const imgs = (record as any).images;
    const first =
      typeof imgs[0] === "string" ? imgs[0] : imgs[0].src || imgs[0].url;
    if (first) vehicleImages.push(first);
  }
  // Do not add external fallback images here. Leave images empty so UI can decide how to render a local placeholder.
  // vehicleImages may be empty if no images provided by the API.

  // Generate badges based on vehicle characteristics - matching original demo
  const badges = [];

  // Add condition badge (New/Used)
  if (record.condition === "New") {
    badges.push("New");
  } else {
    badges.push("Used");
  }

  // Add drivetrain badge (4WD/AWD/FWD/RWD)
  if (record.drivetrain) {
    badges.push(record.drivetrain);
  } else {
    // Generate random drivetrain for demo consistency
    const drivetrains = ["4WD", "AWD", "FWD", "RWD"];
    badges.push(drivetrains[Math.floor(Math.random() * drivetrains.length)]);
  }

  // Optional: Add certified badge if applicable
  if (record.certified) {
    badges.push("Certified");
  }

  // Prefer real dealer and location from record when available
  const dealerName =
    (record as any).dealer ||
    (record as any).seller_account_number ||
    "Premium Auto Group";
  const location =
    (record as any).location ||
    `${(record as any).city_seller || "Unknown"}, ${(record as any).state_seller || ""}`;

  return {
    id: record.id,
    featured: Math.random() > 0.9, // 10% chance of being featured
    viewed: Math.random() > 0.8, // 20% chance of being viewed
    images: vehicleImages,
    badges,
    title,
    mileage: formatMileage(record.mileage),
    transmission: record.transmission,
    doors: `${record.doors} doors`,
    salePrice: formatPrice(record.price),
    payment: `$${record.payments}`, // Use the payments field from VehicleRecord
    dealer: dealerName,
    location,
    phone: "(555) 123-4567", // Placeholder
    seller_type: record.seller_type,
    seller_account_number: record.seller_account_number,
    // NEW: Include all custom fields from VehicleRecord
    year: record.year,
    make: record.make,
    model: record.model,
    trim: record.trim,
    body_style: record.body_style,
    engine_cylinders: record.engine_cylinders,
    fuel_type: record.fuel_type,
    transmission_speed: record.transmission_speed,
    drivetrain: record.drivetrain,
    exterior_color_generic: record.exterior_color_generic,
    interior_color_generic: record.interior_color_generic,
    title_status: record.title_status,
    highway_mpg: record.highway_mpg,
    condition: record.condition,
    certified: record.certified,
    rawPrice: record.price,
    rawMileage: record.mileage,
  };
};

export default function MySQLVehiclesOriginalStyle() {
  // React Router hooks
  const location = useLocation();
  const navigate = useNavigate();

  // State management - exactly like original
  const [favorites, setFavorites] = useState<{ [key: number]: Vehicle }>({});
  const [keeperMessage, setKeeperMessage] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");
  const [vehicleImages, setVehicleImages] = useState<{ [key: string]: string }>(
    {},
  );

  // Persisted custom vehicle type images in localStorage key
  const VEHICLE_IMAGES_KEY = "carzino_vehicle_type_images";

  // Handler to upload and persist an image for a vehicle type
  const handleVehicleTypeImageUpload = async (type: string, file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setVehicleImages((prev) => {
          const next = { ...prev, [type]: result };
          try {
            localStorage.setItem(VEHICLE_IMAGES_KEY, JSON.stringify(next));
          } catch (e) {
            /* ignore */
          }
          return next;
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to read vehicle image", err);
    }
  };
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // API state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure vehicles without price are moved to the end when sorting by price
  useEffect(() => {
    if (!vehicles || vehicles.length === 0) return;
    if (sortBy !== "price-low" && sortBy !== "price-high") return;

    const needsReorder = (arr: Vehicle[]) => {
      // If any item with missing/zero price appears before an item with valid price, we need to reorder
      let seenInvalid = false;
      for (const v of arr) {
        const p = (v as any).rawPrice;
        const valid = p !== undefined && p !== null && Number(p) !== 0;
        if (!valid) {
          seenInvalid = true;
        } else if (seenInvalid && valid) {
          // we saw an invalid earlier and now a valid, so reorder needed
          return true;
        }
      }
      return false;
    };

    if (!needsReorder(vehicles)) return;

    setVehicles((prev) => {
      const comp = (
        a: number | undefined | null,
        b: number | undefined | null,
      ) => {
        const aValid = a !== undefined && a !== null && Number(a) !== 0;
        const bValid = b !== undefined && b !== null && Number(b) !== 0;
        if (aValid && bValid)
          return sortBy === "price-low"
            ? Number(a) - Number(b)
            : Number(b) - Number(a);
        if (aValid && !bValid) return -1;
        if (!aValid && bValid) return 1;
        return 0;
      };
      return prev
        .slice()
        .sort((x, y) => comp((x as any).rawPrice, (y as any).rawPrice));
    });
  }, [sortBy, vehicles]);
  const [apiResponse, setApiResponse] = useState<VehiclesApiResponse | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = apiResponse?.meta?.totalPages || 1;
  const totalResults = apiResponse?.meta?.totalRecords || 0;
  const resultsPerPage = 27;

  // Filter states - exactly like original
  const [searchTerm, setSearchTerm] = useState("");

  // Unified search state for URL generation
  const [unifiedSearch, setUnifiedSearch] = useState("");

  // Location/Distance states
  const [zipCode, setZipCode] = useState(""); // No default ZIP
  const [radius, setRadius] = useState("200"); // Default radius in miles

  // Dealers state
  const [availableDealers, setAvailableDealers] = useState<
    { name: string; count: number }[]
  >([]);

  // Vehicle types state
  const [vehicleTypes, setVehicleTypes] = useState<
    { name: string; slug?: string; count: number }[]
  >([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Applied location filters (separate from current input values)
  const [appliedLocation, setAppliedLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null>(null);
  const [appliedRadius, setAppliedRadius] = useState("200");

  const [appliedFilters, setAppliedFilters] = useState({
    condition: [] as string[],
    make: [] as string[],
    model: [] as string[],
    trim: [] as string[],
    year: [] as string[],
    bodyStyle: [] as string[],
    vehicleType: [] as string[],
    driveType: [] as string[],
    transmission: [] as string[],
    mileage: "",
    exteriorColor: [] as string[],
    sellerType: [] as string[],
    dealer: [] as string[],
    priceMin: "",
    priceMax: "",
    paymentMin: "",
    paymentMax: "",
    // NEW: Additional custom field filters
    fuelType: [] as string[],
    certified: [] as string[],
    // Newly added filters from API
    doors: [] as string[],
    transmissionSpeed: [] as string[],
    highwayMpg: [] as string[],
    titleStatus: [] as string[],
    status: [] as string[],
  });

  // Rehydrate appliedFilters from sessionStorage when available (one-time). This helps Builder.io preview
  // and other contexts where we expect persisted state to be restored.
  useEffect(() => {
    try {
      const persisted = loadPersistedAppliedFilters();
      if (!persisted) return;
      // detect if current appliedFilters look empty (no user selections)
      const hasPersisted = Object.values(persisted as any).some((v: any) =>
        Array.isArray(v) ? v.length > 0 : Boolean(v),
      );
      const currentHasAny = Object.values(appliedFilters as any).some(
        (v: any) => (Array.isArray(v) ? v.length > 0 : Boolean(v)),
      );
      if (hasPersisted && !currentHasAny) {
        setAppliedFilters((prev) => ({
          ...(prev as any),
          ...(persisted as any),
        }));
        console.log("[filters] Rehydrated appliedFilters from sessionStorage");
      }
    } catch (e) {
      /* ignore */
    }
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [collapsedFilters, setCollapsedFilters] = useState({
    vehicleType: false,
    condition: true,
    mileage: true,
    make: false,
    model: true,
    trim: true,
    year: true,
    price: false,
    payment: true,
    driveType: true,
    transmission: true,
    transmissionSpeed: true,
    exteriorColor: true,
    interiorColor: true,
    sellerType: true,
    dealer: true,
    state: true,
    // new collapsible filters
    doors: true,
    highwayMpg: true,
    titleStatus: true,
    status: true,
    city: true,
    // NEW: Additional custom field filters
    fuelType: true,
    certified: true,
  });

  // Mobile detection (used to collapse certain filters on small screens)
  const isMobile = useIsMobile();

  const hasAppliedFilters =
    (appliedLocation && appliedRadius !== "nationwide") ||
    appliedFilters.condition.length > 0 ||
    appliedFilters.make.length > 0 ||
    appliedFilters.model.length > 0 ||
    appliedFilters.trim.length > 0 ||
    appliedFilters.year.length > 0 ||
    appliedFilters.bodyStyle.length > 0 ||
    appliedFilters.vehicleType.length > 0 ||
    appliedFilters.driveType.length > 0 ||
    appliedFilters.exteriorColor.length > 0 ||
    appliedFilters.sellerType.length > 0 ||
    Boolean(appliedFilters.mileage) ||
    Boolean(appliedFilters.priceMin) ||
    Boolean(appliedFilters.priceMax) ||
    Boolean(appliedFilters.paymentMin) ||
    Boolean(appliedFilters.paymentMax) ||
    (searchTerm && searchTerm.trim().length > 0) ||
    (unifiedSearch &&
      unifiedSearch.trim().length > 0 &&
      appliedFilters.make.length === 0 &&
      appliedFilters.model.length === 0 &&
      appliedFilters.trim.length === 0);

  // Price and payment filter states
  const [priceMin, setPriceMin] = useState("1000");
  const [priceMax, setPriceMax] = useState("50000");
  const [paymentMin, setPaymentMin] = useState("100");
  const [paymentMax, setPaymentMax] = useState("2000");
  const [termLength, setTermLength] = useState("60");
  const [interestRate, setInterestRate] = useState("5");
  const [downPayment, setDownPayment] = useState("2000");
  const [isEditingDownPayment, setIsEditingDownPayment] = useState(false);
  const [prevDownPayment, setPrevDownPayment] = useState<string | null>(null);

  const formatCurrency = (val: string | number) => {
    const n = Number(String(val).replace(/[^0-9.-]/g, "")) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);
  };

  // Year range filter state (From / To)
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  // Load filter options from WordPress and keep them in sync with appliedFilters
  const { filterOptions, filtersLoading, filtersError, refetch, pruneInvalid } =
    useFilters(appliedFilters);

  // UI: show more state for Make/Model/Trim lists
  const [showMoreMakes, setShowMoreMakes] = useState(false);
  const [showMoreModels, setShowMoreModels] = useState(false);
  const [showMoreTrims, setShowMoreTrims] = useState(false);
  // UI: show more for transmission speeds
  const [showMoreTransmission, setShowMoreTransmission] = useState(false);
  // UI: fuel type show more and default selection
  const [showMoreFuel, setShowMoreFuel] = useState(false);

  // Highway MPG slider state (min/max)
  const [highwayMpgMin, setHighwayMpgMin] = useState<number | null>(null);
  const [highwayMpgMax, setHighwayMpgMax] = useState<number | null>(null);

  // Helper to compute displayed items with 'Show More' and ensure selected items are visible
  const getDisplayed = (
    all: any[] | undefined,
    selected: string[],
    showMore: boolean,
    limit = 8,
  ) => {
    if (!all) return [];
    const items = all.map((it) => (typeof it === "string" ? { name: it } : it));
    if (showMore) return items;
    const selectedSet = new Set(selected || []);
    const selectedItems = items.filter((it) => selectedSet.has(it.name));
    const rest = items.filter((it) => !selectedSet.has(it.name));
    const remaining = Math.max(0, limit - selectedItems.length);
    return [...selectedItems, ...rest.slice(0, remaining)];
  };

  const allMakes = filterOptions?.make || [];
  const displayedMakes = getDisplayed(
    allMakes,
    appliedFilters.make,
    showMoreMakes,
    8,
  );

  // Fuel type: sort with Gasoline first, compute displayed list with Show More
  const fuelOptionsRaw = filterOptions?.fuel_type || [];
  const fuelOptionsSorted = [...fuelOptionsRaw].sort((a: any, b: any) => {
    const an = String(a.name || "").toLowerCase();
    const bn = String(b.name || "").toLowerCase();
    if (an === "gasoline" && bn !== "gasoline") return -1;
    if (bn === "gasoline" && an !== "gasoline") return 1;
    // Keep 'other' last
    if (an === "other" && bn !== "other") return 1;
    if (bn === "other" && an !== "other") return -1;
    // secondary sort by count desc then name
    const ac = Number(a.count || 0);
    const bc = Number(b.count || 0);
    if (ac !== bc) return bc - ac;
    return an.localeCompare(bn);
  });
  // Ensure 'Other' appears at the end if present
  const fuelOptions = (() => {
    const idx = fuelOptionsSorted.findIndex(
      (f: any) => String(f.name || "").toLowerCase() === "other",
    );
    if (idx > -1) {
      const arr = [...fuelOptionsSorted];
      const [other] = arr.splice(idx, 1);
      arr.push(other);
      return arr;
    }
    return fuelOptionsSorted;
  })();

  const displayedFuels = getDisplayed(
    fuelOptions,
    appliedFilters.fuelType,
    showMoreFuel,
    8,
  );

  // When filterOptions update, prune any applied filters that are no longer valid
  useEffect(() => {
    if (!filterOptions) return;
    const { pruned, changed } = pruneInvalid(appliedFilters as any);
    if (changed) {
      // If the user has a unified search term that matches a filter (e.g., 'Ford'),
      // avoid pruning that specific filter value even if filterOptions haven't yet stabilized.
      const prunedSelective: any = { ...pruned };
      try {
        const q = (searchTerm || unifiedSearch || "")
          .toString()
          .trim()
          .toLowerCase();
        if (q) {
          // Preserve make/model/trim if they match the search term
          if (
            Array.isArray(appliedFilters.make) &&
            appliedFilters.make.length > 0 &&
            (!prunedSelective.make || prunedSelective.make.length === 0)
          ) {
            const m = appliedFilters.make[0].toString().toLowerCase();
            if (q.includes(m) || m.includes(q))
              prunedSelective.make = appliedFilters.make;
          }
          if (
            Array.isArray(appliedFilters.model) &&
            appliedFilters.model.length > 0 &&
            (!prunedSelective.model || prunedSelective.model.length === 0)
          ) {
            const mo = appliedFilters.model[0].toString().toLowerCase();
            if (q.includes(mo) || mo.includes(q))
              prunedSelective.model = appliedFilters.model;
          }
          if (
            Array.isArray(appliedFilters.trim) &&
            appliedFilters.trim.length > 0 &&
            (!prunedSelective.trim || prunedSelective.trim.length === 0)
          ) {
            const tr = appliedFilters.trim[0].toString().toLowerCase();
            if (q.includes(tr) || tr.includes(q))
              prunedSelective.trim = appliedFilters.trim;
          }
        }
      } catch (e) {
        // ignore comparison errors
      }

      // Merge pruned values into existing state to preserve any missing keys
      const newFilters = {
        ...(appliedFilters as any),
        ...(prunedSelective as any),
      };
      setAppliedFilters(newFilters);
      updateURLFromFilters(newFilters);
    }
  }, [filterOptions, searchTerm, unifiedSearch]);

  // Ensure Gasoline is selected by default when fuel options first load and no selection exists
  useEffect(() => {
    const fuels = filterOptions?.fuel_type || [];
    if (fuels.length === 0) return;
    if (appliedFilters.fuelType && appliedFilters.fuelType.length > 0) return;
    const hasGas = fuels.some(
      (f: any) => String(f.name).toLowerCase() === "gasoline",
    );
    if (hasGas) {
      const newFilters = {
        ...appliedFilters,
        fuelType: ["Gasoline"],
      } as typeof appliedFilters;
      setAppliedFilters(newFilters);
      updateURLFromFilters(newFilters);
      setCurrentPage(1);
    }
  }, [filterOptions?.fuel_type]);

  // When mobile filter panel opens, ensure Vehicle Type section is collapsed by default
  useEffect(() => {
    if (mobileFiltersOpen && isMobile) {
      setCollapsedFilters((prev) => ({ ...prev, vehicleType: true }));
    }
    // Do not automatically expand when panel closes; let user state persist
  }, [mobileFiltersOpen, isMobile]);

  // Initialize highway MPG slider defaults when filter options change
  useEffect(() => {
    if (
      filterOptions &&
      filterOptions.highway_mpg &&
      filterOptions.highway_mpg.length > 0
    ) {
      const nums = (filterOptions.highway_mpg || [])
        .map((o: any) => Number(o.name))
        .filter(Boolean);
      if (nums.length > 0) {
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        if (highwayMpgMin === null) setHighwayMpgMin(min);
        if (highwayMpgMax === null) setHighwayMpgMax(max);
      }
    }
  }, [filterOptions?.highway_mpg]);

  // Get the API base URL - point to WordPress site (Vite env)
  const getApiBaseUrl = () => {
    const wpUrl =
      import.meta.env.VITE_WP_URL ||
      "https://env-uploadbackup62225-czdev.kinsta.cloud";
    return wpUrl.replace(/\/$/, "");
  };

  // Get models for a specific make
  const getModelsForMake = (make: string): string[] => {
    const modelsByMake: { [key: string]: string[] } = {
      Audi: ["A3", "A4", "A6", "Q5", "Q7", "Q8"],
      BMW: ["3 Series", "5 Series", "X3", "X5", "X7"],
      Chevrolet: [
        "Silverado",
        "Equinox",
        "Malibu",
        "Traverse",
        "Camaro",
        "Tahoe",
      ],
      Ford: ["F-150", "Escape", "Explorer", "Mustang", "Edge", "Expedition"],
      Honda: ["Civic", "Accord", "CR-V", "Pilot", "HR-V"],
      Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade"],
      "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "S-Class"],
      Nissan: ["Altima", "Sentra", "Rogue", "Pathfinder", "Murano"],
    };

    return modelsByMake[make] || [];
  };

  // Fetch vehicles from API
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters (map to WordPress plugin expectations)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: resultsPerPage.toString(),
      });

      // Add search term -- but DO NOT send free-text search when explicit make/model/trim are present
      const hasExplicitFilter =
        appliedFilters.make.length > 0 ||
        appliedFilters.model.length > 0 ||
        appliedFilters.trim.length > 0;
      if (searchTerm.trim() && !hasExplicitFilter) {
        params.append("search", searchTerm.trim());
      }

      // Add sorting parameter (plugin expects 'sort'). Also add sortBy/sortOrder for internal API.
      if (sortBy !== "relevance") {
        params.append("sort", sortBy);

        // Map UI sort keys to API sortBy and sortOrder
        const mapping: Record<
          string,
          { field?: string; order?: "ASC" | "DESC" }
        > = {
          "price-low": { field: "price", order: "ASC" },
          "price-high": { field: "price", order: "DESC" },
          "miles-low": { field: "mileage", order: "ASC" },
          "miles-high": { field: "mileage", order: "DESC" },
          "year-newest": { field: "year", order: "DESC" },
          "year-oldest": { field: "year", order: "ASC" },
          "distance-closest": { field: "id", order: "ASC" }, // fallback; WP plugin handles actual distance
        };

        const mapped = mapping[sortBy];
        if (mapped && mapped.field) {
          // Do not append sortBy/sortOrder when using the WordPress plugin proxy (VITE_WP_URL set)
          if (!import.meta.env.VITE_WP_URL) {
            params.append("sortBy", mapped.field);
            params.append("sortOrder", mapped.order || "DESC");
          }
        }
      }

      // Add location/distance parameters
      if (appliedLocation && appliedRadius !== "nationwide") {
        params.append("lat", appliedLocation.lat.toString());
        params.append("lng", appliedLocation.lng.toString());
        params.append("radius", appliedRadius);
      }

      // Add filters (use ACF meta keys expected by the plugin)
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
        // plugin uses 'body_style' meta key
        params.append("body_style", appliedFilters.vehicleType.join(","));
      }
      if (appliedFilters.driveType.length > 0) {
        // map to 'drivetrain'
        params.append("drivetrain", appliedFilters.driveType.join(","));
      }
      if (appliedFilters.transmission.length > 0) {
        params.append("transmission", appliedFilters.transmission.join(","));
      }
      if (appliedFilters.mileage) {
        const m = appliedFilters.mileage;
        if (m.includes("-")) {
          const parts = m
            .split("-")
            .map((s) => s.replace(/\D/g, ""))
            .map(Number);
          const [min, max] = parts;
          if (!isNaN(min)) params.append("min_mileage", String(min));
          if (!isNaN(max)) params.append("max_mileage", String(max));
        } else if (m.endsWith("+")) {
          const n = parseInt(m.replace(/\D/g, ""), 10);
          if (!isNaN(n)) params.append("min_mileage", String(n));
        } else {
          // numeric max
          params.append("max_mileage", m.replace(/\D/g, ""));
        }
      }
      if (appliedFilters.exteriorColor.length > 0) {
        params.append("exterior_color", appliedFilters.exteriorColor.join(","));
      }
      if (appliedFilters.sellerType.length > 0) {
        params.append(
          "account_type_seller",
          appliedFilters.sellerType.join(","),
        );
      }
      if (appliedFilters.dealer.length > 0) {
        params.append("account_name_seller", appliedFilters.dealer.join(","));
      }
      // State & City filters (map to seller meta keys)
      if (
        (appliedFilters as any).state &&
        (appliedFilters as any).state.length > 0
      ) {
        params.append("state_seller", (appliedFilters as any).state.join(","));
      }
      if (
        (appliedFilters as any).city &&
        (appliedFilters as any).city.length > 0
      ) {
        params.append("city_seller", (appliedFilters as any).city.join(","));
      }

      if (appliedFilters.priceMin) {
        params.append("min_price", appliedFilters.priceMin);
      }
      if (appliedFilters.priceMax) {
        params.append("max_price", appliedFilters.priceMax);
      }
      if (appliedFilters.paymentMin) {
        params.append("payment_min", appliedFilters.paymentMin);
      }
      if (appliedFilters.paymentMax) {
        params.append("payment_max", appliedFilters.paymentMax);
      }
      // NEW: Additional custom field filters
      if (appliedFilters.fuelType.length > 0) {
        params.append("fuel_type", appliedFilters.fuelType.join(","));
      }
      if (appliedFilters.certified.length > 0) {
        params.append(
          "certified",
          appliedFilters.certified.includes("Certified") ? "true" : "false",
        );
      }

      // Newly added filters from WP ACF/plugin
      if (
        (appliedFilters as any).doors &&
        (appliedFilters as any).doors.length > 0
      ) {
        params.append("doors", (appliedFilters as any).doors.join(","));
      }
      if (
        (appliedFilters as any).transmissionSpeed &&
        (appliedFilters as any).transmissionSpeed.length > 0
      ) {
        params.append(
          "transmission_speed",
          (appliedFilters as any).transmissionSpeed.join(","),
        );
      }
      if (
        (appliedFilters as any).highwayMpg &&
        (appliedFilters as any).highwayMpg.length > 0
      ) {
        const h = (appliedFilters as any).highwayMpg;
        if (h.length === 2) {
          // support range: highway_mpg_min and highway_mpg_max
          params.append("highway_mpg_min", String(h[0]));
          params.append("highway_mpg_max", String(h[1]));
        } else {
          params.append(
            "highway_mpg",
            (appliedFilters as any).highwayMpg.join(","),
          );
        }
      }
      if (
        (appliedFilters as any).titleStatus &&
        (appliedFilters as any).titleStatus.length > 0
      ) {
        params.append(
          "title_status",
          (appliedFilters as any).titleStatus.join(","),
        );
      }
      if (
        (appliedFilters as any).status &&
        (appliedFilters as any).status.length > 0
      ) {
        params.append("status", (appliedFilters as any).status.join(","));
      }

      const apiUrl = `/api/vehicles?${params.toString()}`;
      console.log("Fetching vehicles from:", apiUrl);

      // Use fetchWithRetry to avoid noisy failures for transient network issues
      const { fetchWithRetry } = await await import("@/lib/fetchWithRetry");

      // Use fewer retries and a shorter timeout for main vehicle fetch to improve UX
      const response = await fetchWithRetry(
        apiUrl,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
        1,
        8000,
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Support both internal API and WordPress plugin shapes
        let records: any[] = data.data || [];

        // If WordPress plugin (acf nested), map to VehicleRecord shape
        const isWP = records.length > 0 && records[0].acf;

        const mappedRecords = records.map((r: any) => {
          if (!isWP) return r; // already VehicleRecord-like

          const acf = r.acf || {};
          return {
            id: r.id,
            year: Number(acf.year) || new Date().getFullYear(),
            make: acf.make || "",
            model: acf.model || "",
            trim: acf.trim || "",
            body_style: acf.body_style || acf.bodyStyle || "",
            engine_cylinders: Number(acf.engine_cylinders) || 0,
            fuel_type: acf.fuel_type || "",
            transmission: acf.transmission || "",
            transmission_speed: acf.transmission_speed || "",
            drivetrain: acf.drivetrain || "",
            exterior_color_generic: acf.exterior_color || "",
            interior_color_generic: acf.interior_color || "",
            doors: parseInt(acf.doors) || 4,
            price: Number(acf.price) || 0,
            mileage: Number(acf.mileage) || 0,
            title_status: acf.title_status || "",
            highway_mpg: Number(acf.highway_mpg) || 0,
            condition: acf.condition || "",
            certified:
              acf.certified === true ||
              acf.certified === "1" ||
              acf.is_certified === true,
            seller_account_number:
              acf.account_number_seller || acf.account_number || "",
            seller_type: acf.account_type_seller || acf.account_type || "",
            dealer: acf.account_name_seller || r.dealer || "",
            city_seller: acf.city_seller || r.city_seller || "",
            state_seller: acf.state_seller || r.state_seller || "",
            interest_rate: Number(acf.interest_rate) || 0,
            down_payment: Number(acf.down_payment) || 0,
            loan_term: Number(acf.loan_term) || 0,
            payments: Number(acf.payment) || 0,
            featured_image:
              r.featured_image || acf.featured_image || r.featuredImage || null,
          } as any;
        });

        // Remove any 'Uncategorized' body styles before transforming
        const filteredRecords = mappedRecords.filter((r: any) => {
          const body = (r.body_style || r.bodyType || "").toString().trim();
          return body !== "" && body.toLowerCase() !== "uncategorized";
        });

        // Transform VehicleRecord[] to Vehicle[] for display
        const transformedVehicles = filteredRecords.map(transformVehicleRecord);
        // If sorting by price, ensure vehicles without a price are placed at the end
        const reorderForPrice = (arr: Vehicle[]) => {
          if (sortBy !== "price-low" && sortBy !== "price-high") return arr;
          // Determine comparator for numeric prices
          const comp = (
            a: number | undefined | null,
            b: number | undefined | null,
          ) => {
            const aValid = a !== undefined && a !== null && Number(a) !== 0;
            const bValid = b !== undefined && b !== null && Number(b) !== 0;
            if (aValid && bValid)
              return sortBy === "price-low"
                ? Number(a) - Number(b)
                : Number(b) - Number(a);
            if (aValid && !bValid) return -1;
            if (!aValid && bValid) return 1;
            return 0; // both invalid -> keep original order
          };
          // Stable sort while preserving relative order for equal values
          return arr
            .slice()
            .sort((x, y) => comp((x as any).rawPrice, (y as any).rawPrice));
        };
        setVehicles(reorderForPrice(transformedVehicles));

        // Build meta compatible with VehiclesApiResponse
        const pagination = data.pagination || data.meta || {};
        const page = pagination.page || pagination.currentPage || currentPage;
        const perPage =
          pagination.per_page || pagination.pageSize || resultsPerPage;
        const total = pagination.total || pagination.totalRecords || 0;
        const totalPages =
          pagination.total_pages ||
          pagination.totalPages ||
          Math.ceil(total / perPage || 1);

        const compatibleMeta = {
          totalRecords: total,
          totalPages,
          currentPage: page,
          pageSize: perPage,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        };

        const compatibleResponse: VehiclesApiResponse = {
          success: true,
          data: transformedVehicles,
          meta: compatibleMeta,
          message: data.message,
        };

        setApiResponse(compatibleResponse);
        console.log(
          "✅ Successfully loaded and transformed",
          transformedVehicles.length,
          "vehicles",
        );
      } else {
        throw new Error(data.message || "API returned error");
      }
    } catch (err) {
      console.error("❌ Vehicle fetch error:", err);

      // Try fallback to simplified mock API if available
      try {
        const fallbackUrl = apiUrl.replace(
          "/api/vehicles",
          "/api/simple-vehicles",
        );
        console.log("🔁 Attempting fallback fetch to:", fallbackUrl);
        const { fetchWithRetry } = await await import("@/lib/fetchWithRetry");
        const fallbackRes = await fetchWithRetry(fallbackUrl, {
          method: "GET",
        });
        if (fallbackRes.ok) {
          const fallbackJson = await fallbackRes.json();
          if (fallbackJson.success && Array.isArray(fallbackJson.data)) {
            // Map to VehicleRecord-like shape where possible
            let mapped = fallbackJson.data.map((r: any) => ({
              id: r.id,
              year: r.year || 2020,
              make: r.make || "",
              model: r.model || "",
              trim: r.trim || "",
              body_style: r.body_type || r.body_style || "",
              engine_cylinders: r.engine_cylinders || 0,
              fuel_type: r.fuel_type || "",
              transmission: r.transmission || "",
              transmission_speed: r.transmission_speed || "",
              drivetrain: r.drivetrain || "",
              exterior_color_generic: r.exterior_color || "",
              interior_color_generic: r.interior_color || "",
              doors: r.doors || 4,
              price: r.price || 0,
              mileage: r.mileage || 0,
              title_status: r.title || "",
              highway_mpg: r.highway_mpg || 0,
              condition: r.condition || "",
              certified: r.certified || false,
              seller_account_number: r.seller_account_number || "",
              seller_type: r.seller_type || "",
              dealer: r.dealer || "",
              city_seller: r.city_seller || "",
              state_seller: r.state_seller || "",
              payments: r.payments || 0,
              featured_image: r.featured_image || null,
            }));

            // Filter out uncategorized
            mapped = mapped.filter((r: any) => {
              const body = (r.body_style || "").toString().trim();
              return body !== "" && body.toLowerCase() !== "uncategorized";
            });

            const transformedVehicles = mapped.map(transformVehicleRecord);
            const reorderForPrice = (arr: Vehicle[]) => {
              if (sortBy !== "price-low" && sortBy !== "price-high") return arr;
              const comp = (
                a: number | undefined | null,
                b: number | undefined | null,
              ) => {
                const aValid = a !== undefined && a !== null && Number(a) !== 0;
                const bValid = b !== undefined && b !== null && Number(b) !== 0;
                if (aValid && bValid)
                  return sortBy === "price-low"
                    ? Number(a) - Number(b)
                    : Number(b) - Number(a);
                if (aValid && !bValid) return -1;
                if (!aValid && bValid) return 1;
                return 0;
              };
              return arr
                .slice()
                .sort((x, y) => comp((x as any).rawPrice, (y as any).rawPrice));
            };
            setVehicles(reorderForPrice(transformedVehicles));
            setApiResponse({
              success: true,
              data: transformedVehicles,
              meta: {
                totalRecords:
                  fallbackJson.meta?.total ||
                  fallbackJson.meta?.totalRecords ||
                  transformedVehicles.length,
                totalPages:
                  fallbackJson.meta?.total_pages ||
                  Math.ceil(
                    (fallbackJson.meta?.total || transformedVehicles.length) /
                      resultsPerPage,
                  ),
                currentPage: fallbackJson.meta?.page || 1,
                pageSize: resultsPerPage,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            });
            setLoading(false);
            return;
          }
        }
      } catch (fallbackErr) {
        console.warn("Fallback fetch failed:", fallbackErr);
      }

      // Provide specific error messages based on error type
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setError(
          "Unable to connect to vehicle database. Please refresh the page or try again later.",
        );
      } else if ((err as any).name === "AbortError") {
        setError(
          "Request timed out. Please check your internet connection and try again.",
        );
      } else if (
        err instanceof Error &&
        err.message.includes("API error: 404")
      ) {
        setError(
          "Vehicle database service is temporarily unavailable. Please try again later.",
        );
      } else if (
        err instanceof Error &&
        err.message.includes("API error: 500")
      ) {
        setError("Server error occurred. Please try again in a few moments.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading vehicles.",
        );
      }

      // Set empty vehicles array
      setVehicles([]);
      setApiResponse({
        success: false,
        data: [],
        message: "No vehicles available",
        pagination: {
          page: 1,
          pageSize: resultsPerPage,
          total: 0,
          totalPages: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    appliedFilters,
    searchTerm,
    appliedLocation,
    appliedRadius,
    sortBy,
  ]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(
      localStorage.getItem("carzino_favorites") || "{}",
    );
    setFavorites(savedFavorites);
  }, []);

  // Initialize filters from URL
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(location.pathname);

    // Only update if we're on the cars-for-sale route and have filters
    if (
      location.pathname.startsWith("/cars-for-sale") &&
      (urlFilters.make ||
        urlFilters.model ||
        urlFilters.trim ||
        urlFilters.condition ||
        urlFilters.year ||
        urlFilters.bodyStyle)
    ) {
      setAppliedFilters((prev) => ({
        ...prev,
        make: Array.isArray(urlFilters.make)
          ? urlFilters.make.map((v) => normalizeFilterValue(v))
          : [],
        model: Array.isArray(urlFilters.model)
          ? urlFilters.model.map((v) => normalizeFilterValue(v))
          : [],
        trim: Array.isArray(urlFilters.trim)
          ? urlFilters.trim.map((v) => normalizeFilterValue(v))
          : [],
        condition: Array.isArray(urlFilters.condition)
          ? urlFilters.condition.map((v) => normalizeFilterValue(v))
          : [],
        year: Array.isArray(urlFilters.year) ? urlFilters.year : [],
        bodyStyle: Array.isArray(urlFilters.bodyStyle)
          ? urlFilters.bodyStyle.map((v) => normalizeFilterValue(v))
          : [],
      }));
    }
  }, [location.pathname]);

  // Function to update URL when filters change
  const updateURLFromFilters = useCallback(
    (newFilters: typeof appliedFilters) => {
      // Only generate URL for main filter categories (not price, payment, etc.)
      const urlFilters = {
        make: newFilters.make,
        model: newFilters.model,
        trim: newFilters.trim,
        condition: newFilters.condition,
        year: newFilters.year.length > 0 ? newFilters.year[0] : undefined,
        bodyStyle:
          newFilters.bodyStyle.length > 0 ? newFilters.bodyStyle[0] : undefined,
      };

      const newURL = generateURLFromFilters(urlFilters);

      // Do not navigate for make/model/trim changes — URLs only support single values and
      // navigating on selection prevents multi-select UX. Keep URL navigation for other filters.
      const hasMakeModelTrim =
        (urlFilters.make && urlFilters.make.length > 0) ||
        (urlFilters.model && urlFilters.model.length > 0) ||
        (urlFilters.trim && urlFilters.trim.length > 0);

      if (!hasMakeModelTrim) {
        // Only navigate if we're changing the URL structure for non make/model/trim filters
        if (
          location.pathname !== newURL &&
          (urlFilters.condition?.length ||
            urlFilters.year ||
            urlFilters.bodyStyle?.length)
        ) {
          navigate(newURL, { replace: true });
        }
      }
    },
    [navigate, location.pathname],
  );

  // Fetch vehicles when dependencies change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchVehicles();
    }, 200);
    return () => clearTimeout(t);
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

  // No automatic location initialization - users must enter their own ZIP code

  // Load vehicle type images
  useEffect(() => {
    const loadImages = async () => {
      const imageMapping = {
        // Common title-cased keys
        Convertible:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F064c51214995430a9384ae9f1722bee9",
        Coupe:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F1d042ebb458842a8a468794ae563fcc6",
        Hatchback:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fb06dd82e2c564b7eb30b1d5fa14e0562",
        Sedan:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F87eaf3866c0e482c912cb9c0ca83d44a",
        "Crossover/SUV":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fffc8b9d69ce743d080a0b5ba9a64e89a",
        Trucks:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
        "Regular Cab":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
        "Extended Cab":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
        "Crew Cab":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
        "Van / Minivan":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Ff0d0c6c20e02423dad8eefa6f0ef508a",
        Wagon:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F24bf3ece0537462bbd1edd12a2485c0a?format=webp",

        // Additional keys that Builder/editor may use (normalized/lowercase/hyphenated)
        "crossover-suv":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F98d1869674c64e419bf7ca7da66e25b8",
        "crew-cab":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F87eaf3866c0e482c912cb9c0ca83d44a",
        "van-minivan":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Ff0d0c6c20e02423dad8eefa6f0ef508a",
        convertible:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F064c51214995430a9384ae9f1722bee9",
        wagon:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F24bf3ece0537462bbd1edd12a2485c0a?format=webp",
        coupe:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F1d042ebb458842a8a468794ae563fcc6",
        "regular-cab-truck":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F30f147c94e904a5ba1b1ce7ce9ebd89b",
        hatchback:
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fb06dd82e2c564b7eb30b1d5fa14e0562",
        "extended-cab":
          "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
      };

      const loadedImages: { [key: string]: string } = {};
      for (const [vehicleType, imageUrl] of Object.entries(imageMapping)) {
        loadedImages[vehicleType] = imageUrl;
      }

      // Do NOT merge saved local overrides here — prefer the canonical mapping from editor/CDN.
      setVehicleImages(loadedImages);

      // Remove any persisted overrides so runtime shows the mapping you edited in Design
      try {
        localStorage.removeItem(VEHICLE_IMAGES_KEY);
      } catch (e) {
        /* ignore */
      }
    };

    loadImages();
  }, []);

  // Attempt to read VehicleTypeCard image overrides from Builder.io model so Design edits show in interactive mode
  React.useEffect(() => {
    // lazy import builder to avoid errors when no key is present
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { builder, BUILDER_MODELS } = require("@/lib/builder");
      if (!builder || !BUILDER_MODELS) return;

      const fetchBuilderContent = async () => {
        try {
          const modelName = BUILDER_MODELS.VEHICLE_INVENTORY;
          const content = await builder
            .get(modelName, { url: "/mysql-vehicles" })
            .toPromise();
          if (!content) return;

          const foundImages: { [key: string]: string } = {};

          const walk = (node: any) => {
            if (!node) return;
            if (Array.isArray(node)) return node.forEach(walk);
            if (typeof node !== "object") return;

            // Common builder component markers
            const compName = (
              node.component ||
              node.name ||
              node.type ||
              ""
            ).toString();
            if (compName && /vehicletypecard/i.test(compName)) {
              // Try to extract type and image inputs
              const inputs = node.inputs || node.data || node.props || node;
              const typeVal =
                inputs &&
                (inputs.type || inputs.name || inputs.title || inputs.label);
              const imageVal =
                inputs &&
                (inputs.image ||
                  inputs.src ||
                  (inputs.imageUrl && inputs.imageUrl[0]) ||
                  (inputs.image && inputs.image.src));
              if (typeVal && imageVal && typeof imageVal === "string") {
                foundImages[typeVal] = imageVal;
              }
            }

            // Direct property patterns
            if (node.type && node.image && typeof node.image === "string") {
              foundImages[node.type] = node.image;
            }

            Object.values(node).forEach(walk);
          };

          walk(content);

          if (Object.keys(foundImages).length > 0) {
            setVehicleImages((prev) => ({ ...prev, ...foundImages }));
            console.log(
              "���� Merged Builder VehicleTypeCard images into runtime mapping",
              foundImages,
            );
            // Clear persisted local overrides so Builder/editor images take effect immediately
            try {
              localStorage.removeItem(VEHICLE_IMAGES_KEY);
              console.log(
                "🧹 Cleared persisted vehicle images from localStorage to prioritize Builder images",
              );
            } catch (e) {
              /* ignore */
            }
          }
        } catch (err) {
          // ignore - builder may not be configured in this environment
          // console.warn("Builder image sync failed:", err);
        }
      };

      fetchBuilderContent();
    } catch (e) {
      // require failed or builder not available
    }
  }, []);

  // Load available dealers from normalized filterOptions (prefer WP ACF data)
  useEffect(() => {
    if (filterOptions && Array.isArray(filterOptions.account_name_seller)) {
      setAvailableDealers(
        filterOptions.account_name_seller.map((v: any) => ({
          name: v.name,
          count: v.count,
        })),
      );
    } else {
      setAvailableDealers([]);
    }
  }, [filterOptions]);

  // Load available vehicle types from normalized filterOptions (prefer WP ACF data)
  useEffect(() => {
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[\s\/]+/g, "-")
        .replace(/[^a-z0-9\-]/g, "");

    if (filterOptions && Array.isArray(filterOptions.body_style)) {
      setVehicleTypes(
        filterOptions.body_style.map((v: any) => ({
          name: v.name,
          slug: normalize(String(v.name || "")),
          count: v.count,
        })),
      );
    } else {
      setVehicleTypes([]);
    }
  }, [filterOptions]);

  // No longer auto-fill missing vehicle types into localStorage — runtime mapping is controlled by imageMapping and Builder/editor overrides.
  React.useEffect(() => {
    // keep vehicleImages unchanged here; mapping is set from loadImages()
  }, [vehicleTypes]);

  // Helper functions for price formatting
  const formatPrice = (value: string): string => {
    // Remove non-numeric characters except decimal points
    const numericValue = value.replace(/[^\d]/g, "");
    if (!numericValue) return "";
    // Add commas for thousands
    return parseInt(numericValue).toLocaleString();
  };

  const unformatPrice = (value: string): string => {
    // Remove commas and return clean number string
    return value.replace(/,/g, "");
  };

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
    const newFilters = {
      ...appliedFilters,
      [category]: (
        appliedFilters[category as keyof typeof appliedFilters] as string[]
      ).filter((item: string) => item !== value),
    };
    setAppliedFilters(newFilters);

    // Update URL if main filter categories changed
    if (
      [
        "make",
        "model",
        "trim",
        "condition",
        "year",
        "bodyStyle",
        "transmission",
      ].includes(category)
    ) {
      updateURLFromFilters(newFilters);
    }
  };

  const removeTransmissionDisplay = (label: string) => {
    setAppliedFilters((prev) => {
      const next = {
        ...prev,
        transmissionSpeed: prev.transmissionSpeed.filter(
          (v) => normalizeTransmission(v) !== label,
        ),
      };
      // Update URL when transmissionSpeed changes
      updateURLFromFilters(next);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setUnifiedSearch("");
    setZipCode(""); // Reset ZIP code
    setRadius("200"); // Reset to default radius
    setAppliedLocation(null);
    setAppliedRadius("200");
    setAppliedFilters({
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],
      bodyStyle: [],
      vehicleType: [],
      driveType: [],
      transmission: [],
      mileage: "",
      exteriorColor: [],
      sellerType: [],
      dealer: [],
      priceMin: "",
      priceMax: "",
      paymentMin: "",
      paymentMax: "",
      // NEW: Additional custom field filters
      fuelType: [],
      certified: [],
      // Newly added/advanced filters
      doors: [],
      transmissionSpeed: [],
      highwayMpg: [],
      titleStatus: [],
      status: [],
    });
    setPriceMin("1000");
    setPriceMax("50000");
    setPaymentMin("100");
    setPaymentMax("2000");
    // Reset year range selects
    setYearFrom("");
    setYearTo("");
    setCurrentPage(1);

    // Reset URL to base cars-for-sale path
    if (location.pathname.startsWith("/cars-for-sale")) {
      navigate("/cars-for-sale/", { replace: true });
    }
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

  // Apply location filters handler
  const applyLocationFilters = () => {
    setAppliedLocation(userLocation);
    setAppliedRadius(radius);
    setCurrentPage(1); // Reset to first page when applying filters
  };

  // Parse unified search query and extract vehicle attributes
  const parseUnifiedSearch = (query: string) => {
    const words = query.toLowerCase().trim().split(/\s+/);
    const filters: any = {};

    // Known makes (you can expand this list)
    const makes = [
      "toyota",
      "honda",
      "ford",
      "chevrolet",
      "nissan",
      "bmw",
      "audi",
      "mercedes",
      "lexus",
      "infiniti",
      "acura",
      "cadillac",
      "buick",
      "gmc",
      "jeep",
      "ram",
      "dodge",
      "chrysler",
      "hyundai",
      "kia",
      "subaru",
      "mazda",
      "mitsubishi",
      "volvo",
      "land rover",
      "jaguar",
      "porsche",
      "ferrari",
      "lamborghini",
      "maserati",
      "bentley",
      "rolls-royce",
      "tesla",
      "lucid",
      "rivian",
    ];

    // Known conditions
    const conditions = ["new", "used", "certified"];

    // Known body styles
    const bodyStyles = [
      "sedan",
      "suv",
      "coupe",
      "convertible",
      "hatchback",
      "truck",
      "wagon",
      "van",
    ];

    // Extract year (4-digit number)
    const yearMatch = query.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      filters.year = [yearMatch[0]];
    }

    // Extract make
    const foundMake = words.find((word) => makes.includes(word));
    if (foundMake) {
      filters.make = [foundMake.charAt(0).toUpperCase() + foundMake.slice(1)];
    }

    // Extract condition
    const foundCondition = words.find((word) => conditions.includes(word));
    if (foundCondition) {
      filters.condition = [
        foundCondition.charAt(0).toUpperCase() + foundCondition.slice(1),
      ];
    }

    // Extract body style
    const foundBodyStyle = words.find((word) => bodyStyles.includes(word));
    if (foundBodyStyle) {
      filters.bodyStyle = [
        foundBodyStyle.charAt(0).toUpperCase() + foundBodyStyle.slice(1),
      ];
    }

    // For model and trim, try to identify them by position or common patterns
    // This is a simplified approach - you might want to add more sophisticated logic
    if (foundMake) {
      const makeIndex = words.indexOf(foundMake.toLowerCase());
      if (makeIndex >= 0 && makeIndex + 1 < words.length) {
        const nextWord = words[makeIndex + 1];
        // If next word is not a condition, year, or body style, it's likely a model
        if (
          !conditions.includes(nextWord) &&
          !bodyStyles.includes(nextWord) &&
          !/^\d{4}$/.test(nextWord)
        ) {
          filters.model = [
            nextWord.charAt(0).toUpperCase() + nextWord.slice(1),
          ];

          // Check for trim after model
          if (makeIndex + 2 < words.length) {
            const trimWord = words[makeIndex + 2];
            if (
              !conditions.includes(trimWord) &&
              !bodyStyles.includes(trimWord) &&
              !/^\d{4}$/.test(trimWord)
            ) {
              filters.trim = [trimWord.toUpperCase()]; // Trims are often uppercase (SE, EX, etc.)
            }
          }
        }
      }
    }

    return filters;
  };

  // Handle unified search submission
  const handleUnifiedSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const q = unifiedSearch.trim();
    if (!q) return;

    // Parse the unified search query
    const parsedFilters = parseUnifiedSearch(q);

    // Generate URL and navigate
    const searchURL = generateURLFromFilters({
      make: parsedFilters.make,
      model: parsedFilters.model,
      trim: parsedFilters.trim,
      condition: parsedFilters.condition,
      year: parsedFilters.year?.[0],
      bodyStyle: parsedFilters.bodyStyle?.[0],
    });

    // Clear any previously applied filters first (but we'll restore the unified search below)
    clearAllFilters();

    // Apply only the parsed filters from the unified search (everything else cleared)
    setAppliedFilters({
      condition: parsedFilters.condition || [],
      make: parsedFilters.make || [],
      model: parsedFilters.model || [],
      trim: parsedFilters.trim || [],
      year: parsedFilters.year || [],
      bodyStyle: parsedFilters.bodyStyle || [],
      vehicleType: [],
      driveType: [],
      transmission: [],
      mileage: "",
      exteriorColor: [],
      sellerType: [],
      dealer: [],
      priceMin: "",
      priceMax: "",
      paymentMin: "",
      paymentMax: "",
      fuelType: [],
      certified: [],
      doors: [],
      transmissionSpeed: [],
      highwayMpg: [],
      titleStatus: [],
      status: [],
    });

    // Restore unified search input (clearAllFilters cleared it)
    setUnifiedSearch(q);

    // Only set searchTerm (used as free-text 'search' param) if the parser did not extract explicit filters
    const hasExplicit =
      (parsedFilters.make && parsedFilters.make.length > 0) ||
      (parsedFilters.model && parsedFilters.model.length > 0) ||
      (parsedFilters.trim && parsedFilters.trim.length > 0) ||
      (parsedFilters.condition && parsedFilters.condition.length > 0) ||
      (parsedFilters.year && parsedFilters.year.length > 0) ||
      (parsedFilters.bodyStyle && parsedFilters.bodyStyle.length > 0);
    if (hasExplicit) {
      // Clear any free-text search to avoid combining search + explicit filters which may return empty from WP
      setSearchTerm("");
    } else {
      setSearchTerm(q);
    }

    // Navigate to the generated URL
    navigate(searchURL);

    // Close mobile filter panel (if open)
    try {
      setMobileFiltersOpen(false);
    } catch (err) {
      // ignore if state not available in this scope
    }
  };

  // Geocoding function to convert ZIP to lat/lng using optimized backend
  const geocodeZip = async (
    zip: string,
  ): Promise<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  } | null> => {
    if (!zip || zip.length < 5) return null;

    try {
      setIsGeocodingLoading(true);

      // Call our geocoding API with proper error handling
      const apiUrl = `${getApiBaseUrl()}/api/geocode/${zip}`;
      console.log("🔍 Geocoding ZIP:", zip, "using:", apiUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log(
            `✅ Geocoded ${zip} to ${result.data.city}, ${result.data.state}`,
          );
          return {
            lat: result.data.lat,
            lng: result.data.lng,
            city: result.data.city,
            state: result.data.state,
          };
        } else {
          console.warn(`❌ Geocoding failed for ${zip}: ${result.message}`);
        }
      } else if (response.status === 404) {
        try {
          const errorResult = await response.json();
          console.warn(`❌ ZIP ${zip} not found: ${errorResult.message}`);
        } catch {
          console.warn(`❌ ZIP ${zip} not found`);
        }
      } else {
        console.error(
          `��� Geocoding API error: ${response.status} ${response.statusText}`,
        );
      }

      return null;
    } catch (error) {
      console.error("❌ Geocoding network error:", error);

      // Always use fallback for any network error
      if (
        error instanceof TypeError &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError"))
      ) {
        console.log("���� Using fallback coordinates due to network error");
        const zipCoordinates: {
          [key: string]: {
            lat: number;
            lng: number;
            city: string;
            state: string;
          };
        } = {
          "98498": {
            lat: 47.0379,
            lng: -122.9015,
            city: "Lakewood",
            state: "WA",
          },
          "98468": {
            lat: 47.0379,
            lng: -122.9015,
            city: "Lakewood",
            state: "WA",
          },
          "90210": {
            lat: 34.0901,
            lng: -118.4065,
            city: "Beverly Hills",
            state: "CA",
          },
          "10001": {
            lat: 40.7505,
            lng: -73.9934,
            city: "New York",
            state: "NY",
          },
          "60601": {
            lat: 41.8781,
            lng: -87.6298,
            city: "Chicago",
            state: "IL",
          },
          "75001": {
            lat: 32.9483,
            lng: -96.7299,
            city: "Addison",
            state: "TX",
          },
          "33101": { lat: 25.7617, lng: -80.1918, city: "Miami", state: "FL" },
          "85001": {
            lat: 33.4484,
            lng: -112.074,
            city: "Phoenix",
            state: "AZ",
          },
          "97201": {
            lat: 45.5152,
            lng: -122.6784,
            city: "Portland",
            state: "OR",
          },
          "02101": { lat: 42.3601, lng: -71.0589, city: "Boston", state: "MA" },
        };

        const coords = zipCoordinates[zip];
        if (coords) {
          console.warn(`🆘 Using fallback coordinates for ZIP: ${zip}`);
          return coords;
        }

        // If ZIP not in our fallback list, use a default location
        console.warn(`Using default coordinates for unknown ZIP: ${zip}`);
        return {
          lat: 39.8283,
          lng: -98.5795,
          city: "Geographic Center",
          state: "US",
        };
      }

      return null;
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  // Color data for filters - derived from WP /filters (fallback palette for unknown colors)
  const colorPalette: Record<string, string> = {
    Black: "#000000",
    White: "#FFFFFF",
    Silver: "#C0C0C0",
    Gray: "#808080",
    Blue: "#0000FF",
    Red: "#FF0000",
    Beige: "#F5F5DC",
    Brown: "#8B4513",
    Tan: "#D2B48C",
    Gold: "#D4AF37",
    Green: "#008000",
  };

  const exteriorColors = useMemo(() => {
    const list = (filterOptions.exterior_color || []) as any[];
    return list.map((c) => ({
      name: c.name,
      color: colorPalette[c.name] || "#D1D5DB",
      count: c.count || 0,
    }));
  }, [filterOptions.exterior_color]);

  const interiorColors = useMemo(() => {
    const list = (filterOptions.interior_color || []) as any[];
    return list.map((c) => ({
      name: c.name,
      color: colorPalette[c.name] || "#E5E7EB",
      count: c.count || 0,
    }));
  }, [filterOptions.interior_color]);

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
          content: '\u2713';
          position: absolute;
          color: white;
          font-size: 12px;
          top: 0;
          left: 3px;
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
            z-index: 231;
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
            z-index: 232;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh;
            max-height: 100vh;
            overflow-y: auto !important;
            overflow-x: hidden;
            display: block !important;
            -webkit-overflow-scrolling: touch;
          }

          .mobile-filter-sidebar.open {
            transform: translateX(0);
          }

          /* Hide mobile filters when header mobile menu is open */
          .header-menu-open .mobile-filter-overlay,
          .header-menu-open .mobile-filter-sidebar,
          .header-menu-open .mobile-filter-bar,
          .header-menu-open .mobile-pills {
            display: none !important;
            visibility: hidden !important;
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

      <div className="flex flex-col lg:flex-row min-h-screen max-w-[1325px] mx-auto pb-40">
        <div
          className={`mobile-filter-overlay lg:hidden ${mobileFiltersOpen ? "open" : ""}`}
          onClick={() => setMobileFiltersOpen(false)}
        ></div>

        {/* Sidebar - exactly like original */}
        <div
          className={`bg-white border-r border-gray-200 mobile-filter-sidebar hidden lg:block ${mobileFiltersOpen ? "open" : ""}`}
          style={{ width: "280px" }}
        >
          <div className="hidden">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Filter - top sticky action bar (Cancel/Apply moved here) */}
          <div className="lg:hidden sticky top-0 z-[140] bg-white border-b border-gray-200 px-4 pt-4 pb-3 lg:pt-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileFiltersOpen(false);
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="p-4 pt-5 lg:pt-6">
            {/* Mobile Filter Action Buttons (moved to top) */}
            <div className="hidden">
              <div className="flex gap-3 px-0">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileFiltersOpen(false);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
            {/* Search Section - Mobile Only */}
            <div className="lg:hidden mb-4">
              <form onSubmit={handleUnifiedSearchSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Cars For Sale"
                    value={unifiedSearch}
                    onChange={(e) => setUnifiedSearch(e.target.value)}
                    className="carzino-search-input w-full pl-4 pr-14 py-2.5 border border-gray-300 rounded-[10px] sm:rounded-full overflow-hidden focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Mobile Applied Filters */}
            <div className="lg:hidden mb-4">
              {(appliedLocation && appliedRadius !== "nationwide") ||
              appliedFilters.condition.length > 0 ||
              appliedFilters.make.length > 0 ||
              appliedFilters.model.length > 0 ||
              appliedFilters.trim.length > 0 ||
              appliedFilters.year.length > 0 ||
              appliedFilters.bodyStyle.length > 0 ||
              appliedFilters.vehicleType.length > 0 ||
              appliedFilters.driveType.length > 0 ||
              appliedFilters.exteriorColor.length > 0 ||
              appliedFilters.sellerType.length > 0 ||
              appliedFilters.mileage ||
              appliedFilters.priceMin ||
              appliedFilters.priceMax ||
              appliedFilters.paymentMin ||
              appliedFilters.paymentMax ||
              // Show the raw search query when present (only when it won't duplicate make/model/trim chips)
              (searchTerm && searchTerm.trim().length > 0) ||
              (unifiedSearch &&
                unifiedSearch.trim().length > 0 &&
                appliedFilters.make.length === 0 &&
                appliedFilters.model.length === 0 &&
                appliedFilters.trim.length === 0) ? (
                <>
                  <div className="pt-2 flex items-center justify-between mb-2">
                    <h3 className="carzino-filter-title">Applied Filters</h3>
                    <button
                      onClick={clearAllFilters}
                      className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-red-700"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Show free-text search or unified search when appropriate */}
                    {(searchTerm && searchTerm.trim().length > 0) ||
                    (unifiedSearch &&
                      unifiedSearch.trim().length > 0 &&
                      appliedFilters.make.length === 0 &&
                      appliedFilters.model.length === 0 &&
                      appliedFilters.trim.length === 0) ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                        onClick={() => {
                          // Clear only the free-text query when clicked
                          setSearchTerm("");
                          setUnifiedSearch("");
                        }}
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {searchTerm && searchTerm.trim().length > 0
                          ? searchTerm
                          : unifiedSearch}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchTerm("");
                            setUnifiedSearch("");
                          }}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    ) : null}

                    {appliedLocation && appliedRadius !== "nationwide" && (
                      <span
                        onClick={() => {
                          setAppliedLocation(null);
                          setAppliedRadius("200");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        <MapPin className="w-3 h-3" />
                        {appliedRadius} miles
                        <button
                          onClick={() => {
                            setAppliedLocation(null);
                            setAppliedRadius("200");
                          }}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {appliedFilters.condition.map((item) => (
                      <span
                        key={item}
                        onClick={() => removeAppliedFilter("condition", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                        onClick={() => removeAppliedFilter("make", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                        onClick={() => removeAppliedFilter("model", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                  </div>
                </>
              ) : null}
            </div>

            {/* Desktop Search Section */}
            <div className="hidden lg:block mb-4 pb-4 bg-white">
              <form onSubmit={handleUnifiedSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Cars For Sale"
                    value={unifiedSearch}
                    onChange={(e) => setUnifiedSearch(e.target.value)}
                    className="carzino-search-input w-full px-3 py-2 pr-14 border border-gray-300 rounded-md focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 p-1"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Desktop Applied Filters */}
            {true && (
              <div
                className={`hidden lg:block mb-4 pb-4 border-b border-gray-200 bg-white ${hasAppliedFilters ? "sticky top-16 z-40" : ""}`}
              >
                <div className="rounded-lg border border-gray-300 bg-white p-3">
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
                    {/* Show free-text search or unified search when appropriate */}
                    {(searchTerm && searchTerm.trim().length > 0) ||
                    (unifiedSearch &&
                      unifiedSearch.trim().length > 0 &&
                      appliedFilters.make.length === 0 &&
                      appliedFilters.model.length === 0 &&
                      appliedFilters.trim.length === 0) ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                        onClick={() => {
                          setSearchTerm("");
                          setUnifiedSearch("");
                        }}
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {searchTerm && searchTerm.trim().length > 0
                          ? searchTerm
                          : unifiedSearch}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchTerm("");
                            setUnifiedSearch("");
                          }}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    ) : null}

                    {appliedLocation && appliedRadius !== "nationwide" && (
                      <span
                        onClick={() => {
                          setAppliedLocation(null);
                          setAppliedRadius("200");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        <MapPin className="w-3 h-3" />
                        {appliedRadius} miles
                        <button
                          onClick={() => {
                            setAppliedLocation(null);
                            setAppliedRadius("200");
                          }}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {appliedFilters.condition.map((item) => (
                      <span
                        key={item}
                        onClick={() => removeAppliedFilter("condition", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                        onClick={() => removeAppliedFilter("make", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                        onClick={() => removeAppliedFilter("model", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                        onClick={() => removeAppliedFilter("trim", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                    {appliedFilters.year.map((item) => (
                      <span
                        key={item}
                        onClick={() => removeAppliedFilter("year", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() => removeAppliedFilter("year", item)}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.bodyStyle.map((item) => (
                      <span
                        key={item}
                        onClick={() => removeAppliedFilter("bodyStyle", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() => removeAppliedFilter("bodyStyle", item)}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(() => {
                      const CAR_CHILD_SLUGS = [
                        "sedan",
                        "coupe",
                        "hatchback",
                        "wagon",
                        "convertible",
                        "crossover-suv",
                        "van-minivan",
                      ];
                      const TRUCK_CHILD_SLUGS = [
                        "crew-cab",
                        "extended-cab",
                        "regular-cab-truck",
                      ];
                      const selected = new Set(
                        appliedFilters.vehicleType || [],
                      );

                      const carAll = CAR_CHILD_SLUGS.every((s) =>
                        selected.has(s),
                      );
                      const truckAll = TRUCK_CHILD_SLUGS.every((s) =>
                        selected.has(s),
                      );

                      const chips: string[] = [];
                      if (carAll) chips.push("car");
                      else
                        CAR_CHILD_SLUGS.forEach(
                          (s) => selected.has(s) && chips.push(s),
                        );
                      if (truckAll) chips.push("truck");
                      else
                        TRUCK_CHILD_SLUGS.forEach(
                          (s) => selected.has(s) && chips.push(s),
                        );

                      // include any other selected slugs not in the above lists
                      for (const s of Array.from(selected)) {
                        if (
                          !CAR_CHILD_SLUGS.includes(s) &&
                          !TRUCK_CHILD_SLUGS.includes(s) &&
                          s !== "car" &&
                          s !== "truck"
                        ) {
                          chips.push(s);
                        }
                      }

                      return chips.map((item) => (
                        <span
                          key={item}
                          onClick={() => {
                            // remove chip: if parent, remove all children; otherwise remove single child
                            setAppliedFilters((prev) => {
                              const nextSet = new Set(prev.vehicleType || []);
                              if (item === "car") {
                                CAR_CHILD_SLUGS.forEach((s) =>
                                  nextSet.delete(s),
                                );
                              } else if (item === "truck") {
                                TRUCK_CHILD_SLUGS.forEach((s) =>
                                  nextSet.delete(s),
                                );
                              } else {
                                nextSet.delete(item);
                              }
                              const next = {
                                ...prev,
                                vehicleType: Array.from(nextSet),
                              };
                              updateURLFromFilters(next);
                              return next;
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                        >
                          <Check className="w-3 h-3 text-red-600" />
                          {item === "car"
                            ? "All Cars"
                            : item === "truck"
                              ? "All Trucks"
                              : normalizeFilterValue(item)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAppliedFilters((prev) => {
                                const nextSet = new Set(prev.vehicleType || []);
                                if (item === "car") {
                                  CAR_CHILD_SLUGS.forEach((s) =>
                                    nextSet.delete(s),
                                  );
                                } else if (item === "truck") {
                                  TRUCK_CHILD_SLUGS.forEach((s) =>
                                    nextSet.delete(s),
                                  );
                                } else {
                                  nextSet.delete(item);
                                }
                                const next = {
                                  ...prev,
                                  vehicleType: Array.from(nextSet),
                                };
                                updateURLFromFilters(next);
                                return next;
                              });
                            }}
                            className="ml-1 text-white hover:text-gray-300"
                          >
                            ×
                          </button>
                        </span>
                      ));
                    })()}
                    {appliedFilters.driveType.map((item) => (
                      <span
                        key={item}
                        onClick={() => removeAppliedFilter("driveType", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                    {(() => {
                      const unique = Array.from(
                        new Set(
                          appliedFilters.transmissionSpeed.map((v) =>
                            normalizeTransmission(v),
                          ),
                        ),
                      );
                      return unique.map((label) => (
                        <span
                          key={label}
                          onClick={() => {
                            setAppliedFilters((prev) => {
                              const next = {
                                ...prev,
                                transmissionSpeed:
                                  prev.transmissionSpeed.filter(
                                    (v) => normalizeTransmission(v) !== label,
                                  ),
                              };
                              updateURLFromFilters(next);
                              return next;
                            });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                        >
                          <Check className="w-3 h-3 text-red-600" />
                          {label}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAppliedFilters((prev) => {
                                const next = {
                                  ...prev,
                                  transmissionSpeed:
                                    prev.transmissionSpeed.filter(
                                      (v) => normalizeTransmission(v) !== label,
                                    ),
                                };
                                updateURLFromFilters(next);
                                return next;
                              });
                            }}
                            className="ml-1 text-white hover:text-gray-300"
                          >
                            ×
                          </button>
                        </span>
                      ));
                    })()}
                    {appliedFilters.exteriorColor.map((item) => (
                      <span
                        key={item}
                        onClick={() =>
                          removeAppliedFilter("exteriorColor", item)
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
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
                        onClick={() => removeAppliedFilter("sellerType", item)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() =>
                            removeAppliedFilter("sellerType", item)
                          }
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.mileage && (
                      <span
                        onClick={() =>
                          setAppliedFilters((prev) => ({
                            ...prev,
                            mileage: "",
                          }))
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {(() => {
                          const m = appliedFilters.mileage;
                          if (!m) return null;
                          if (m.includes("-")) {
                            const [min, max] = m.split("-");
                            return `${Number(min).toLocaleString()}–${Number(max).toLocaleString()} Miles`;
                          }
                          if (m.endsWith("+")) {
                            return `${m.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}+ Miles`;
                          }
                          return `Under ${Number(m).toLocaleString()} Miles`;
                        })()}
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
                      <span
                        onClick={() => {
                          setAppliedFilters((prev) => ({
                            ...prev,
                            priceMin: "",
                            priceMax: "",
                          }));
                          setPriceMin("1000");
                          setPriceMax("50000");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                      >
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
                            setPriceMin("1000");
                            setPriceMax("50000");
                          }}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {(appliedFilters.paymentMin ||
                      appliedFilters.paymentMax) && (
                      <span
                        onClick={() =>
                          setAppliedFilters((prev) => ({
                            ...prev,
                            paymentMin: "",
                            paymentMax: "",
                          }))
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rounded-full text-xs cursor-pointer hover:bg-gray-800"
                      >
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
              </div>
            )}

            {/* Distance */}
            <div className="mb-4 pb-4 border border-gray-200 rounded-lg p-3">
              <label className="carzino-location-label block mb-2">
                Distance
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter Zip Code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className={`carzino-search-input w-full px-3 py-2 border rounded-md h-10 focus:outline-none ${
                        zipCode.trim() === ""
                          ? "border-red-500 focus:border-red-600"
                          : "border-gray-300 focus:border-red-600"
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <select
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-dropdown-option w-full px-3 py-2 border border-gray-300 rounded-md h-10 focus:outline-none appearance-none"
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
                </div>
              </div>

              {/* Location Status */}
              {isGeocodingLoading && (
                <div className="mt-2 text-sm text-gray-500 italic flex items-center gap-1">
                  <Loader className="w-4 h-4 animate-spin" />
                  Looking up location for ZIP {zipCode}...
                </div>
              )}

              {userLocation && !isGeocodingLoading && (
                <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-red-600" />
                  {userLocation.city && userLocation.state
                    ? `${userLocation.city}, ${userLocation.state}`
                    : `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                  {userLocation.city === "Geographic Center" && (
                    <span className="text-yellow-600 ml-1">(Offline mode)</span>
                  )}
                </div>
              )}

              {!userLocation &&
                !isGeocodingLoading &&
                zipCode &&
                zipCode.length >= 5 && (
                  <div className="mt-2 text-sm text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Location service unavailable. Radius filtering disabled.
                  </div>
                )}

              {/* Apply Location Filters Button */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={applyLocationFilters}
                  disabled={!userLocation || isGeocodingLoading}
                  className={`w-full text-white py-2 px-4 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                    zipCode && zipCode.trim() !== ""
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-black hover:bg-gray-800"
                  }`}
                >
                  Apply Location Filter
                </button>
              </div>
            </div>

            {/* Make Filter (conditional) */}
            {((filterOptions &&
              filterOptions.make &&
              filterOptions.make.length > 0) ||
              appliedFilters.make.length > 0) && (
              <FilterSection
                title="Make"
                isCollapsed={collapsedFilters.make}
                onToggle={() => toggleFilter("make")}
              >
                <div className="space-y-1">
                  {displayedMakes.map((m: any) => {
                    const id = `make-${m.name.replace(/[^a-z0-9]/gi, "_")}`;
                    return (
                      <div
                        key={m.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          id={id}
                          type="checkbox"
                          className="mr-2"
                          onClick={(e) => e.stopPropagation()}
                          checked={appliedFilters.make.includes(m.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const checked = (e.target as HTMLInputElement)
                              .checked;
                            setAppliedFilters((prev) => {
                              const current = prev.make || [];
                              const next = new Set(current);
                              if (checked) next.add(m.name);
                              else next.delete(m.name);
                              const newFilters = {
                                ...prev,
                                make: Array.from(next),
                              } as any;
                              setCollapsedFilters((cprev) => ({
                                ...cprev,
                                make: false,
                              }));
                              updateURLFromFilters(newFilters);
                              return newFilters;
                            });
                          }}
                        />
                        <label
                          htmlFor={id}
                          className="flex-1 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="carzino-filter-option">
                            {m.name}
                          </span>
                        </label>
                        <span className="carzino-filter-count ml-1">
                          ({m.count || 0})
                        </span>
                      </div>
                    );
                  })}

                  {allMakes.length > 8 && (
                    <div className="pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMoreMakes(!showMoreMakes);
                        }}
                        className="text-red-600 text-sm font-medium"
                      >
                        {showMoreMakes ? "Show Less" : "Show More"}
                      </button>
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Model (Conditional & depends on Make) */}
            {(appliedFilters.make.length > 0 ||
              (filterOptions &&
                filterOptions.model &&
                filterOptions.model.length > 0) ||
              appliedFilters.model.length > 0) && (
              <FilterSection
                title="Model"
                isCollapsed={collapsedFilters.model}
                onToggle={() => toggleFilter("model")}
              >
                <div className="space-y-1">
                  {appliedFilters.make.length ===
                  0 ? null : filterOptions.model && // Use filter options returned by WP /filters endpoint when available
                    filterOptions.model.length > 0 ? (
                    (() => {
                      const displayedModels = getDisplayed(
                        filterOptions.model,
                        appliedFilters.model,
                        showMoreModels,
                        8,
                      );
                      return (
                        <>
                          {displayedModels.map((m: any) => {
                            const name = typeof m === "string" ? m : m.name;
                            const count =
                              typeof m === "string" ? undefined : m.count;
                            const id = `model-${name.replace(/[^a-z0-9]/gi, "_")}`;
                            return (
                              <div
                                key={name}
                                className="flex items-center hover:bg-gray-50 p-1 rounded"
                              >
                                <input
                                  id={id}
                                  type="checkbox"
                                  className="mr-2"
                                  onClick={(e) => e.stopPropagation()}
                                  checked={appliedFilters.model.includes(name)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const checked = (
                                      e.target as HTMLInputElement
                                    ).checked;
                                    setAppliedFilters((prev) => {
                                      const current = prev.model || [];
                                      const next = new Set(current);
                                      if (checked) next.add(name);
                                      else next.delete(name);
                                      const newFilters = {
                                        ...prev,
                                        model: Array.from(next),
                                      } as any;
                                      setCollapsedFilters((cprev) => ({
                                        ...cprev,
                                        model: false,
                                      }));
                                      updateURLFromFilters(newFilters);
                                      return newFilters;
                                    });
                                  }}
                                />
                                <label
                                  htmlFor={id}
                                  className="flex-1 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="carzino-filter-option">
                                    {name}
                                  </span>
                                </label>
                                <span className="carzino-filter-count ml-1">
                                  {count ? `(${count})` : ""}
                                </span>
                              </div>
                            );
                          })}

                          {filterOptions.model.length > 8 && (
                            <div className="pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMoreModels(!showMoreModels);
                                }}
                                className="text-red-600 text-sm font-medium"
                              >
                                {showMoreModels ? "Show Less" : "Show More"}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No models available for the selected make(s).
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Trim (Conditional & depends on Make) */}
            {(appliedFilters.make.length > 0 ||
              (filterOptions &&
                filterOptions.trim &&
                filterOptions.trim.length > 0) ||
              appliedFilters.trim.length > 0) && (
              <FilterSection
                title="Trim"
                isCollapsed={collapsedFilters.trim}
                onToggle={() => toggleFilter("trim")}
              >
                <div className="space-y-1">
                  {appliedFilters.make.length ===
                  0 ? null : filterOptions.trim &&
                    filterOptions.trim.length > 0 ? (
                    (() => {
                      const displayedTrims = getDisplayed(
                        filterOptions.trim,
                        appliedFilters.trim,
                        showMoreTrims,
                        8,
                      );
                      return (
                        <>
                          {displayedTrims.map((t: any) => {
                            const name = typeof t === "string" ? t : t.name;
                            const count =
                              typeof t === "string" ? undefined : t.count;
                            const id = `trim-${name.replace(/[^a-z0-9]/gi, "_")}`;
                            return (
                              <div
                                key={name}
                                className="flex items-center hover:bg-gray-50 p-1 rounded"
                              >
                                <input
                                  id={id}
                                  type="checkbox"
                                  className="mr-2"
                                  onClick={(e) => e.stopPropagation()}
                                  checked={appliedFilters.trim.includes(name)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const checked = (
                                      e.target as HTMLInputElement
                                    ).checked;
                                    setAppliedFilters((prev) => {
                                      const current = prev.trim || [];
                                      const next = new Set(current);
                                      if (checked) next.add(name);
                                      else next.delete(name);
                                      const newFilters = {
                                        ...prev,
                                        trim: Array.from(next),
                                      } as any;
                                      setCollapsedFilters((cprev) => ({
                                        ...cprev,
                                        trim: false,
                                      }));
                                      updateURLFromFilters(newFilters);
                                      return newFilters;
                                    });
                                  }}
                                />
                                <label
                                  htmlFor={id}
                                  className="flex-1 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="carzino-filter-option">
                                    {name}
                                  </span>
                                </label>
                                <span className="carzino-filter-count ml-1">
                                  {count ? `(${count})` : ""}
                                </span>
                              </div>
                            );
                          })}

                          {filterOptions.trim.length > 8 && (
                            <div className="pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMoreTrims(!showMoreTrims);
                                }}
                                className="text-red-600 text-sm font-medium"
                              >
                                {showMoreTrims ? "Show Less" : "Show More"}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No trims available for the selected make(s).
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Year Filter */}
            {(appliedFilters.year.length > 0 ||
              (filterOptions &&
                filterOptions.year &&
                filterOptions.year.length > 0)) && (
              <FilterSection
                title="Year"
                isCollapsed={collapsedFilters.year || false}
                onToggle={() => toggleFilter("year")}
              >
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm carzino-location-label mb-1">
                      From
                    </label>
                    <select
                      value={yearFrom}
                      onChange={(e) => {
                        const val = e.target.value;
                        setYearFrom(val);
                        const years = [val, yearTo].filter(Boolean);
                        const newFilters = { ...appliedFilters, year: years };
                        setAppliedFilters(newFilters);
                        updateURLFromFilters(newFilters);
                        setCurrentPage(1);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-dropdown-option w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none bg-white"
                    >
                      <option value="">Any</option>
                      {(filterOptions.year && filterOptions.year.length > 0
                        ? filterOptions.year
                        : Array.from({ length: 10 }, (_, i) =>
                            String(new Date().getFullYear() - i),
                          )
                      ).map((y: any) => {
                        const name =
                          typeof y === "string" || typeof y === "number"
                            ? String(y)
                            : y.name;
                        return (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm carzino-location-label mb-1">
                      To
                    </label>
                    <select
                      value={yearTo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setYearTo(val);
                        const years = [yearFrom, val].filter(Boolean);
                        const newFilters = { ...appliedFilters, year: years };
                        setAppliedFilters(newFilters);
                        updateURLFromFilters(newFilters);
                        setCurrentPage(1);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="carzino-dropdown-option w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none bg-white"
                    >
                      <option value="">Any</option>
                      {(filterOptions.year && filterOptions.year.length > 0
                        ? filterOptions.year
                        : Array.from({ length: 10 }, (_, i) =>
                            String(new Date().getFullYear() - i),
                          )
                      ).map((y: any) => {
                        const name =
                          typeof y === "string" || typeof y === "number"
                            ? String(y)
                            : y.name;
                        return (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </FilterSection>
            )}

            {/* Price Filter */}
            {((appliedFilters.priceMin && appliedFilters.priceMin.length > 0) ||
              (appliedFilters.priceMax && appliedFilters.priceMax.length > 0) ||
              vehicles.length > 0) && (
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
                        placeholder="1,000"
                        value={formatPrice(priceMin)}
                        onChange={(e) => {
                          const unformattedValue = unformatPrice(
                            e.target.value,
                          );
                          setPriceMin(unformattedValue);
                        }}
                        onBlur={(e) => {
                          const unformattedValue = unformatPrice(
                            e.target.value,
                          );
                          setAppliedFilters((prev) => ({
                            ...prev,
                            priceMin: unformattedValue,
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
                        placeholder="50,000"
                        value={formatPrice(priceMax)}
                        onChange={(e) => {
                          const unformattedValue = unformatPrice(
                            e.target.value,
                          );
                          setPriceMax(unformattedValue);
                        }}
                        onBlur={(e) => {
                          const unformattedValue = unformatPrice(
                            e.target.value,
                          );
                          setAppliedFilters((prev) => ({
                            ...prev,
                            priceMax: unformattedValue,
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="carzino-search-input w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </FilterSection>
            )}

            {/* Payment Filter */}
            {((appliedFilters.paymentMin &&
              appliedFilters.paymentMin.length > 0) ||
              (appliedFilters.paymentMax &&
                appliedFilters.paymentMax.length > 0) ||
              vehicles.length > 0) && (
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
                      placeholder={`Down Payment: ${formatCurrency(downPayment)}`}
                      value={
                        isEditingDownPayment
                          ? downPayment
                          : `Down Payment: ${formatCurrency(downPayment)}`
                      }
                      onFocus={(e) => {
                        e.stopPropagation();
                        setPrevDownPayment(downPayment);
                        setDownPayment("");
                        setIsEditingDownPayment(true);
                      }}
                      onBlur={(e) => {
                        e.stopPropagation();
                        setIsEditingDownPayment(false);
                        // restore previous if left empty
                        if (!downPayment && prevDownPayment !== null) {
                          setDownPayment(prevDownPayment);
                        }
                      }}
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
            )}

            {/* Condition */}
            {((appliedFilters.condition &&
              appliedFilters.condition.length > 0) ||
              (filterOptions &&
                filterOptions.condition &&
                filterOptions.condition.length > 0)) && (
              <FilterSection
                title="Condition"
                isCollapsed={collapsedFilters.condition}
                onToggle={() => toggleFilter("condition")}
              >
                <div className="space-y-1">
                  {filterOptions.condition &&
                  filterOptions.condition.length > 0 ? (
                    filterOptions.condition.map((c: any) => (
                      <label
                        key={c.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.condition.includes(c.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if ((e.target as HTMLInputElement).checked) {
                              const newFilters = {
                                ...appliedFilters,
                                condition: [
                                  ...appliedFilters.condition,
                                  c.name,
                                ],
                              };
                              setAppliedFilters(newFilters);
                              updateURLFromFilters(newFilters);
                            } else {
                              removeAppliedFilter("condition", c.name);
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{c.name}</span>
                        <span className="carzino-filter-count ml-1">
                          ({c.count ?? 0})
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No conditions available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Certified */}
            {((appliedFilters.certified &&
              appliedFilters.certified.length > 0) ||
              (appliedFilters.condition &&
                (appliedFilters.condition.includes("Used") ||
                  appliedFilters.condition.includes("used")) &&
                filterOptions &&
                filterOptions.certified &&
                filterOptions.certified.length > 0)) && (
              <FilterSection
                title="Certified"
                isCollapsed={collapsedFilters.certified}
                onToggle={() => toggleFilter("certified")}
              >
                <div className="space-y-1">
                  {filterOptions.certified &&
                  filterOptions.certified.length > 0 ? (
                    filterOptions.certified.map((c: any) => (
                      <label
                        key={c.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.certified.includes(c.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if ((e.target as HTMLInputElement).checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                certified: [...prev.certified, c.name],
                              }));
                            } else {
                              removeAppliedFilter("certified", c.name);
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{c.name}</span>
                        <span className="carzino-filter-count ml-1">
                          ({c.count ?? 0})
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No certification options available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Mileage */}
            {((appliedFilters.mileage && appliedFilters.mileage.length > 0) ||
              (appliedFilters.condition &&
                (appliedFilters.condition.includes("Used") ||
                  appliedFilters.condition.includes("used")))) && (
              <FilterSection
                title="Mileage"
                isCollapsed={collapsedFilters.mileage}
                onToggle={() => toggleFilter("mileage")}
              >
                <div className="space-y-1">
                  <select
                    className="carzino-dropdown-option w-full px-3 py-2.5 border border-gray-300 rounded-md h-10 focus:outline-none bg-white appearance-none"
                    value={appliedFilters.mileage}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setAppliedFilters((prev) => ({
                        ...prev,
                        mileage: e.target.value,
                      }))
                    }
                  >
                    <option value="">All Miles (default)</option>
                    <option value="25000">Under 25,000 Miles</option>
                    <option value="25000-50000">25,000–50,000 Miles</option>
                    <option value="50000-75000">50,000–75,000 Miles</option>
                    <option value="75000-100000">75,000–100,000 Miles</option>
                    <option value="100000-150000">100,000–150,000 Miles</option>
                    <option value="150000+">150,000+ Miles</option>
                  </select>
                </div>
              </FilterSection>
            )}

            {/* Search by Vehicle Type */}
            {((vehicleTypes && vehicleTypes.length > 0) ||
              (appliedFilters.vehicleType &&
                appliedFilters.vehicleType.length > 0)) && (
              <FilterSection
                title="Search by Vehicle Type"
                isCollapsed={collapsedFilters.vehicleType}
                onToggle={() => toggleFilter("vehicleType")}
              >
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    // Build parents and children as before
                    const isTruck = (slug: string) => {
                      if (!slug) return false;
                      return /truck|pickup|cab|van/.test(slug);
                    };

                    const parents: Record<
                      string,
                      {
                        label: string;
                        count: number;
                        children: {
                          name: string;
                          slug: string;
                          count: number;
                        }[];
                      }
                    > = {
                      car: { label: "All Cars", count: 0, children: [] },
                      truck: { label: "All Trucks", count: 0, children: [] },
                    };

                    for (const t of vehicleTypes) {
                      const slug =
                        (t as any).slug ||
                        String(t.name || "")
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-");
                      if (!slug || slug === "uncategorized") continue;
                      const target = isTruck(slug)
                        ? parents.truck
                        : parents.car;
                      target.children.push({
                        name: t.name,
                        slug,
                        count: t.count,
                      });
                      target.count += Number(t.count || 0);
                    }

                    const hasAny =
                      parents.car.children.length > 0 ||
                      parents.truck.children.length > 0;

                    if (!hasAny) {
                      return (
                        <div className="text-gray-500 text-sm p-2 col-span-2 text-center">
                          Loading vehicle types...
                        </div>
                      );
                    }

                    // Image-based grid: parents as large cards, children shown as smaller image cards
                    return (
                      <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {(["car", "truck"] as const).map((parentKey) => {
                            const parent = parents[parentKey];
                            const allSelected =
                              parent.children.length > 0 &&
                              parent.children.every((c) =>
                                appliedFilters.vehicleType.includes(c.slug),
                              );

                            return (
                              <div key={parentKey} className="p-1">
                                <VehicleTypeCard
                                  type={parent.label}
                                  count={parent.count}
                                  vehicleImages={vehicleImages}
                                  isSelected={allSelected}
                                  onToggle={() => {
                                    const childSlugs = parent.children.map(
                                      (c) => c.slug,
                                    );
                                    setAppliedFilters((prev) => {
                                      const current = new Set(
                                        prev.vehicleType || [],
                                      );
                                      const allSel = childSlugs.every((s) =>
                                        current.has(s),
                                      );
                                      if (allSel)
                                        childSlugs.forEach((s) =>
                                          current.delete(s),
                                        );
                                      else
                                        childSlugs.forEach((s) =>
                                          current.add(s),
                                        );
                                      const next = {
                                        ...prev,
                                        vehicleType: Array.from(current),
                                      };
                                      updateURLFromFilters(next);
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {parents.car.children
                            .concat(parents.truck.children)
                            .map((child) => (
                              <div key={child.slug} className="p-1">
                                <VehicleTypeCard
                                  type={child.name}
                                  count={child.count}
                                  vehicleImages={vehicleImages}
                                  isSelected={appliedFilters.vehicleType.includes(
                                    child.slug,
                                  )}
                                  onToggle={() => {
                                    setAppliedFilters((prev) => {
                                      const current = new Set(
                                        prev.vehicleType || [],
                                      );
                                      if (current.has(child.slug))
                                        current.delete(child.slug);
                                      else current.add(child.slug);
                                      const next = {
                                        ...prev,
                                        vehicleType: Array.from(current),
                                      };
                                      updateURLFromFilters(next);
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </FilterSection>
            )}

            {/* Drive Type */}
            {((filterOptions &&
              filterOptions.drivetrain &&
              filterOptions.drivetrain.length > 0) ||
              (appliedFilters.driveType &&
                appliedFilters.driveType.length > 0)) && (
              <FilterSection
                title="Drive Type"
                isCollapsed={collapsedFilters.driveType}
                onToggle={() => toggleFilter("driveType")}
              >
                <div className="space-y-1">
                  {filterOptions.drivetrain &&
                  filterOptions.drivetrain.length > 0 ? (
                    (() => {
                      // Normalize and group drivetrain raw values into display groups
                      const groups = new Map<
                        string,
                        { names: string[]; count: number }
                      >();
                      const rawList = filterOptions.drivetrain || [];

                      const getDisplay = (raw: string) => {
                        const r = String(raw || "").trim();
                        const lower = r.toLowerCase();
                        if (
                          lower === "front wheel drive" ||
                          lower === "front-wheel drive" ||
                          lower === "fwd"
                        )
                          return "FWD";
                        if (
                          r.includes("4MATIC") ||
                          r.includes("4MATIC®") ||
                          lower.includes("4matic") ||
                          lower.includes("4matic®")
                        )
                          return "AWD/4WD";
                        if (lower === "other" || lower === "other/unknown")
                          return "Other";
                        return r;
                      };

                      for (const d of rawList) {
                        const raw = String(d.name || "").trim();
                        if (!raw) continue;
                        const display = getDisplay(raw);
                        const key = display;
                        const entry = groups.get(key) || {
                          names: [],
                          count: 0,
                        };
                        if (!entry.names.includes(raw)) entry.names.push(raw);
                        entry.count += Number(d.count || 0);
                        groups.set(key, entry);
                      }

                      // Build ordered array: keep 'Other' at the end
                      const ordered = Array.from(groups.entries()).map(
                        ([display, val]) => ({
                          display,
                          names: val.names,
                          count: val.count,
                        }),
                      );
                      ordered.sort(
                        (a, b) =>
                          b.count - a.count ||
                          a.display.localeCompare(b.display),
                      );
                      const otherIdx = ordered.findIndex(
                        (o) => o.display === "Other",
                      );
                      if (otherIdx > -1) {
                        const [other] = ordered.splice(otherIdx, 1);
                        ordered.push(other);
                      }

                      return (
                        <>
                          {ordered.map((g) => {
                            const isChecked = g.names.some((n) =>
                              appliedFilters.driveType.includes(n),
                            );
                            return (
                              <label
                                key={g.display}
                                className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="mr-2"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (
                                      (e.target as HTMLInputElement).checked
                                    ) {
                                      // add all underlying raw names to appliedFilters
                                      setAppliedFilters((prev) => ({
                                        ...prev,
                                        driveType: Array.from(
                                          new Set([
                                            ...prev.driveType,
                                            ...g.names,
                                          ]),
                                        ),
                                      }));
                                    } else {
                                      // remove all underlying names
                                      setAppliedFilters((prev) => ({
                                        ...prev,
                                        driveType: prev.driveType.filter(
                                          (v) => !g.names.includes(v),
                                        ),
                                      }));
                                    }
                                  }}
                                />
                                <span className="carzino-filter-option">
                                  {g.display}
                                </span>
                                <span className="carzino-filter-count ml-1">
                                  ({g.count ?? 0})
                                </span>
                              </label>
                            );
                          })}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No drive types available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Transmission */}
            {(appliedFilters.transmission.length > 0 ||
              (filterOptions &&
                filterOptions.transmission &&
                filterOptions.transmission.length > 0)) && (
              <FilterSection
                title="Transmission"
                isCollapsed={collapsedFilters.transmission}
                onToggle={() => toggleFilter("transmission")}
              >
                <div className="space-y-1">
                  {filterOptions.transmission &&
                  filterOptions.transmission.length > 0 ? (
                    filterOptions.transmission.map((t: any) => (
                      <label
                        key={t.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.transmission.includes(t.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if ((e.target as HTMLInputElement).checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                transmission: [...prev.transmission, t.name],
                              }));
                            } else {
                              removeAppliedFilter("transmission", t.name);
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{t.name}</span>
                        <span className="carzino-filter-count ml-1">
                          ({t.count ?? 0})
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No transmissions available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Transmission Speed */}
            {(appliedFilters.transmissionSpeed.length > 0 ||
              (filterOptions &&
                filterOptions.transmission_speed &&
                filterOptions.transmission_speed.length > 0)) && (
              <FilterSection
                title="Transmission Speed"
                isCollapsed={collapsedFilters.transmissionSpeed}
                onToggle={() => toggleFilter("transmissionSpeed")}
              >
                <div className="space-y-1">
                  {filterOptions.transmission_speed &&
                  filterOptions.transmission_speed.length > 0 ? (
                    (() => {
                      const displayed = getDisplayed(
                        filterOptions.transmission_speed,
                        appliedFilters.transmissionSpeed,
                        showMoreTransmission,
                        8,
                      );

                      // Deduplicate displayed options by normalized label
                      const normalizedDisplayed = (() => {
                        const seen = new Set<string>();
                        const out: any[] = [];
                        for (const it of displayed) {
                          const disp = normalizeTransmission(it.name);
                          if (!seen.has(disp)) {
                            seen.add(disp);
                            out.push({ ...it, displayName: disp });
                          }
                        }
                        return out;
                      })();

                      return (
                        <>
                          {normalizedDisplayed.map((t: any) => (
                            <label
                              key={t.name}
                              className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="mr-2"
                                checked={appliedFilters.transmissionSpeed.some(
                                  (v) =>
                                    normalizeTransmission(v) ===
                                    (t.displayName || t.name),
                                )}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const label = t.displayName || t.name;
                                  const checked = (e.target as HTMLInputElement)
                                    .checked;
                                  setAppliedFilters((prev) => {
                                    // remove any existing values that normalize to this label
                                    const filtered =
                                      prev.transmissionSpeed.filter(
                                        (v) =>
                                          normalizeTransmission(v) !== label,
                                      );
                                    const nextArr = checked
                                      ? [...filtered, t.name]
                                      : filtered;
                                    const next = {
                                      ...prev,
                                      transmissionSpeed: nextArr,
                                    };
                                    updateURLFromFilters(next);
                                    return next;
                                  });
                                }}
                              />
                              <span className="carzino-filter-option">
                                {t.displayName || t.name}
                              </span>
                              <span className="carzino-filter-count ml-1">
                                ({t.count ?? 0})
                              </span>
                            </label>
                          ))}

                          {filterOptions.transmission_speed.length > 8 && (
                            <div className="pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMoreTransmission(
                                    !showMoreTransmission,
                                  );
                                }}
                                className="text-red-600 text-sm font-medium"
                              >
                                {showMoreTransmission
                                  ? "Show Less"
                                  : "Show More"}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No transmission speeds available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Doors */}
            {((filterOptions &&
              filterOptions.doors &&
              filterOptions.doors.length > 0) ||
              (appliedFilters.doors && appliedFilters.doors.length > 0)) && (
              <FilterSection
                title="Doors"
                isCollapsed={collapsedFilters.doors}
                onToggle={() => toggleFilter("doors")}
              >
                <div className="space-y-1">
                  {filterOptions.doors && filterOptions.doors.length > 0 ? (
                    filterOptions.doors.map((d: any) => (
                      <label
                        key={d.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.doors.includes(d.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if ((e.target as HTMLInputElement).checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                doors: [...prev.doors, d.name],
                              }));
                            } else {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                doors: prev.doors.filter((v) => v !== d.name),
                              }));
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{d.name}</span>
                        <span className="carzino-filter-count ml-1">
                          ({d.count ?? 0})
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No door options available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* NEW: Fuel Type */}
            {((fuelOptions && fuelOptions.length > 0) ||
              (appliedFilters.fuelType &&
                appliedFilters.fuelType.length > 0)) && (
              <FilterSection
                title="Fuel Type"
                isCollapsed={collapsedFilters.fuelType}
                onToggle={() => toggleFilter("fuelType")}
              >
                <div className="space-y-1">
                  {fuelOptions && fuelOptions.length > 0 ? (
                    <>
                      {displayedFuels.map((f: any) => (
                        <label
                          key={f.name}
                          className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={appliedFilters.fuelType.includes(f.name)}
                            onChange={(e) => {
                              e.stopPropagation();
                              if ((e.target as HTMLInputElement).checked) {
                                setAppliedFilters((prev) => ({
                                  ...prev,
                                  fuelType: [...prev.fuelType, f.name],
                                }));
                              } else {
                                removeAppliedFilter("fuelType", f.name);
                              }
                            }}
                          />
                          <span className="carzino-filter-option">
                            {f.name}
                          </span>
                          <span className="carzino-filter-count ml-1">
                            ({f.count ?? 0})
                          </span>
                        </label>
                      ))}

                      {fuelOptions.length > 8 && (
                        <div className="p-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMoreFuel((v) => !v);
                            }}
                            className="text-sm text-blue-600 hover:underline px-2 py-1 rounded"
                          >
                            {showMoreFuel
                              ? "Show Less"
                              : `Show More (${fuelOptions.length - 8})`}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No fuel types available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* NEW: Fuel Economy (moved under Fuel Type) */}
            {((appliedFilters.fuelType && appliedFilters.fuelType.length > 0) ||
              (appliedFilters.highwayMpg &&
                (appliedFilters.highwayMpg as any).length > 0) ||
              (filterOptions &&
                filterOptions.highway_mpg &&
                filterOptions.highway_mpg.length > 0)) && (
              <FilterSection
                title="Fuel Economy"
                isCollapsed={collapsedFilters.highwayMpg}
                onToggle={() => toggleFilter("highwayMpg")}
              >
                <div className="space-y-1">
                  {(() => {
                    const options = [
                      { key: "any", label: "Any", min: 0 },
                      { key: "10", label: "10+ MPG", min: 10 },
                      { key: "15", label: "15+ MPG", min: 15 },
                      { key: "20", label: "20+ MPG", min: 20 },
                      { key: "30", label: "30+ MPG", min: 30 },
                      { key: "40", label: "40+ MPG", min: 40 },
                      { key: "50", label: "50+ MPG", min: 50 },
                    ];

                    // compute counts by summing available highway_mpg buckets >= min
                    const buckets = (filterOptions.highway_mpg || [])
                      .map((b: any) => ({
                        n: Number(b.name),
                        count: Number(b.count || 0),
                      }))
                      .filter((b: any) => !Number.isNaN(b.n));

                    const getCount = (min: number) => {
                      if (min <= 0)
                        return buckets.reduce(
                          (s: number, b: any) => s + b.count,
                          0,
                        );
                      return buckets
                        .filter((b: any) => b.n >= min)
                        .reduce((s: number, b: any) => s + b.count, 0);
                    };

                    return options.map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={
                            opt.key === "any"
                              ? (appliedFilters.highwayMpg || []).length === 0
                              : (appliedFilters.highwayMpg || []).includes(
                                  String(opt.min),
                                )
                          }
                          onChange={(e) => {
                            e.stopPropagation();
                            if (opt.key === "any") {
                              // clear selection
                              const newFilters = {
                                ...appliedFilters,
                                highwayMpg: [],
                              } as any;
                              setAppliedFilters(newFilters);
                              updateURLFromFilters(newFilters);
                              setCurrentPage(1);
                              return;
                            }

                            if ((e.target as HTMLInputElement).checked) {
                              const newFilters = {
                                ...(appliedFilters as any),
                                highwayMpg: [
                                  ...(appliedFilters.highwayMpg || []).filter(
                                    (v: string) => v !== "",
                                  ),
                                  String(opt.min),
                                ],
                              } as any;
                              setAppliedFilters(newFilters);
                              updateURLFromFilters(newFilters);
                              setCurrentPage(1);
                            } else {
                              const newFilters = {
                                ...(appliedFilters as any),
                                highwayMpg: (
                                  appliedFilters.highwayMpg || []
                                ).filter((v: string) => v !== String(opt.min)),
                              } as any;
                              setAppliedFilters(newFilters);
                              updateURLFromFilters(newFilters);
                              setCurrentPage(1);
                            }
                          }}
                        />
                        <span className="carzino-filter-option">
                          {opt.label}
                        </span>
                        <span className="carzino-filter-count ml-1">
                          ({getCount(opt.min)})
                        </span>
                      </label>
                    ));
                  })()}
                </div>
              </FilterSection>
            )}

            {/* Exterior Color */}
            {((exteriorColors && exteriorColors.length > 0) ||
              (appliedFilters.exteriorColor &&
                appliedFilters.exteriorColor.length > 0)) && (
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
            )}

            {/* Interior Color */}
            {((interiorColors && interiorColors.length > 0) ||
              (appliedFilters.exteriorColor &&
                appliedFilters.exteriorColor.length > 0)) && (
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
            )}

            {/* Seller Type */}
            {((filterOptions &&
              filterOptions.account_type_seller &&
              filterOptions.account_type_seller.length > 0) ||
              (appliedFilters.sellerType &&
                appliedFilters.sellerType.length > 0)) && (
              <FilterSection
                title="Seller Type"
                isCollapsed={collapsedFilters.sellerType}
                onToggle={() => toggleFilter("sellerType")}
              >
                <div className="space-y-1">
                  {filterOptions.account_type_seller &&
                  filterOptions.account_type_seller.length > 0 ? (
                    filterOptions.account_type_seller.map((s: any) => (
                      <label
                        key={s.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.sellerType.includes(s.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if ((e.target as HTMLInputElement).checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                sellerType: [...prev.sellerType, s.name],
                              }));
                            } else {
                              removeAppliedFilter("sellerType", s.name);
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{s.name}</span>
                        <span className="carzino-filter-count ml-1">
                          ({s.count ?? 0})
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm p-2">
                      Loading seller types...
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Dealer */}
            {((availableDealers && availableDealers.length > 0) ||
              (appliedFilters.dealer && appliedFilters.dealer.length > 0)) && (
              <FilterSection
                title="Dealer"
                isCollapsed={collapsedFilters.dealer}
                onToggle={() => toggleFilter("dealer")}
              >
                <div className="space-y-1">
                  {availableDealers.map((dealer, index) => (
                    <label
                      key={index}
                      className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={appliedFilters.dealer.includes(dealer.name)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              dealer: [...prev.dealer, dealer.name],
                            }));
                          } else {
                            setAppliedFilters((prev) => ({
                              ...prev,
                              dealer: prev.dealer.filter(
                                (item) => item !== dealer.name,
                              ),
                            }));
                          }
                        }}
                      />
                      <span className="carzino-filter-option">
                        {dealer.name}
                      </span>
                      <span className="carzino-filter-count ml-1">
                        ({dealer.count})
                      </span>
                    </label>
                  ))}
                  {availableDealers.length === 0 && (
                    <div className="text-gray-500 text-sm p-2">
                      Loading dealers...
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* State */}
            {((filterOptions &&
              filterOptions.state_seller &&
              filterOptions.state_seller.length > 0) ||
              ((appliedFilters as any).state &&
                (appliedFilters as any).state.length > 0)) && (
              <FilterSection
                title="State"
                isCollapsed={collapsedFilters.state}
                onToggle={() => toggleFilter("state")}
              >
                <div className="space-y-1">
                  {filterOptions.state_seller &&
                  filterOptions.state_seller.length > 0 ? (
                    filterOptions.state_seller.map((s: any) => (
                      <label
                        key={s.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={(
                            (appliedFilters as any).state || []
                          ).includes(s.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if ((e.target as HTMLInputElement).checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                /* @ts-ignore */ state: [
                                  ...((prev as any).state || []),
                                  s.name,
                                ],
                              }));
                            } else {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                /* @ts-ignore */ state: (
                                  (prev as any).state || []
                                ).filter((v: string) => v !== s.name),
                              }));
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{s.name}</span>
                        <span className="carzino-filter-count ml-1">
                          ({s.count ?? 0})
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No states available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* City */}
            {((filterOptions &&
              filterOptions.city_seller &&
              filterOptions.city_seller.length > 0) ||
              ((appliedFilters as any).city &&
                (appliedFilters as any).city.length > 0)) && (
              <FilterSection
                title="City"
                isCollapsed={collapsedFilters.city}
                onToggle={() => toggleFilter("city")}
              >
                <div className="space-y-1">
                  {filterOptions.city_seller &&
                  filterOptions.city_seller.length > 0 ? (
                    filterOptions.city_seller.map((c: any) => (
                      <label
                        key={c.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={(
                            (appliedFilters as any).city || []
                          ).includes(c.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if ((e.target as HTMLInputElement).checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                /* @ts-ignore */ city: [
                                  ...((prev as any).city || []),
                                  c.name,
                                ],
                              }));
                            } else {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                /* @ts-ignore */ city: (
                                  (prev as any).city || []
                                ).filter((v: string) => v !== c.name),
                              }));
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{c.name}</span>
                        <span className="carzino-filter-count ml-1">
                          ({c.count ?? 0})
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No cities available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}

            {/* Title Status (moved to bottom) */}
            {((filterOptions &&
              filterOptions.title_status &&
              filterOptions.title_status.length > 0) ||
              (appliedFilters.titleStatus &&
                appliedFilters.titleStatus.length > 0)) && (
              <FilterSection
                title="Title Status"
                isCollapsed={collapsedFilters.titleStatus}
                onToggle={() => toggleFilter("titleStatus")}
              >
                <div className="space-y-1">
                  {filterOptions.title_status &&
                  filterOptions.title_status.length > 0 ? (
                    filterOptions.title_status.map((t: any) => (
                      <label
                        key={t.name}
                        className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={appliedFilters.titleStatus.includes(t.name)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if ((e.target as HTMLInputElement).checked) {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                titleStatus: [...prev.titleStatus, t.name],
                              }));
                            } else {
                              setAppliedFilters((prev) => ({
                                ...prev,
                                titleStatus: prev.titleStatus.filter(
                                  (v) => v !== t.name,
                                ),
                              }));
                            }
                          }}
                        />
                        <span className="carzino-filter-option">{t.name}</span>
                        <span className="carzino-filter-count ml-1">
                          ({t.count ?? 0})
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
                      No title status options available.
                    </div>
                  )}
                </div>
              </FilterSection>
            )}
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

            {/* Applied Filters Pills - Outside sticky container, always visible */}
            {!mobileFiltersOpen &&
              ((appliedLocation && appliedRadius !== "nationwide") ||
                appliedFilters.condition.length > 0 ||
                appliedFilters.make.length > 0 ||
                appliedFilters.model.length > 0 ||
                appliedFilters.trim.length > 0 ||
                appliedFilters.year.length > 0 ||
                appliedFilters.bodyStyle.length > 0 ||
                appliedFilters.vehicleType.length > 0 ||
                appliedFilters.driveType.length > 0 ||
                appliedFilters.exteriorColor.length > 0 ||
                appliedFilters.sellerType.length > 0 ||
                appliedFilters.mileage ||
                appliedFilters.priceMin ||
                appliedFilters.priceMax ||
                appliedFilters.paymentMin ||
                appliedFilters.paymentMax ||
                // Show free-text search or unified search when appropriate
                (searchTerm && searchTerm.trim().length > 0) ||
                (unifiedSearch &&
                  unifiedSearch.trim().length > 0 &&
                  appliedFilters.make.length === 0 &&
                  appliedFilters.model.length === 0 &&
                  appliedFilters.trim.length === 0)) && (
                <div className="hidden lg:block px-3 pt-3 bg-white">
                  <div className="flex gap-2 overflow-x-auto pb-3">
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      Clear All
                    </button>
                    {/* Show search pill when free-text or unified search should be visible */}
                    {(searchTerm && searchTerm.trim().length > 0) ||
                    (unifiedSearch &&
                      unifiedSearch.trim().length > 0 &&
                      appliedFilters.make.length === 0 &&
                      appliedFilters.model.length === 0 &&
                      appliedFilters.trim.length === 0) ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                        <Check className="w-3 h-3 text-red-600" />
                        {searchTerm && searchTerm.trim().length > 0
                          ? searchTerm
                          : unifiedSearch}
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setUnifiedSearch("");
                          }}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ) : null}
                    {appliedLocation && appliedRadius !== "nationwide" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                        <Check className="w-3 h-3 text-red-600" />
                        <MapPin className="w-3 h-3" />
                        {appliedRadius} miles
                        <button
                          onClick={() => {
                            setAppliedLocation(null);
                            setAppliedRadius("200");
                          }}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    )}
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
                    {appliedFilters.year.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() => removeAppliedFilter("year", item)}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {appliedFilters.bodyStyle.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() => removeAppliedFilter("bodyStyle", item)}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(() => {
                      // Render vehicleType chips compressing into parent labels when all children selected
                      const CAR_CHILD_SLUGS = [
                        "sedan",
                        "coupe",
                        "hatchback",
                        "wagon",
                        "convertible",
                        "crossover-suv",
                        "van-minivan",
                      ];
                      const TRUCK_CHILD_SLUGS = [
                        "crew-cab",
                        "extended-cab",
                        "regular-cab-truck",
                      ];

                      const selected = new Set(
                        appliedFilters.vehicleType || [],
                      );

                      const carAll = CAR_CHILD_SLUGS.every((s) =>
                        selected.has(s),
                      );
                      const truckAll = TRUCK_CHILD_SLUGS.every((s) =>
                        selected.has(s),
                      );

                      const chips: string[] = [];

                      if (carAll) chips.push("car");
                      else
                        CAR_CHILD_SLUGS.forEach(
                          (s) => selected.has(s) && chips.push(s),
                        );

                      if (truckAll) chips.push("truck");
                      else
                        TRUCK_CHILD_SLUGS.forEach(
                          (s) => selected.has(s) && chips.push(s),
                        );

                      // include any other selected slugs not in the above lists
                      for (const s of Array.from(selected)) {
                        if (
                          !CAR_CHILD_SLUGS.includes(s) &&
                          !TRUCK_CHILD_SLUGS.includes(s) &&
                          s !== "car" &&
                          s !== "truck"
                        ) {
                          chips.push(s);
                        }
                      }

                      return chips.map((item) => (
                        <span
                          key={item}
                          onClick={() => {
                            // remove chip: if parent, remove all children; otherwise remove single child
                            setAppliedFilters((prev) => {
                              const nextSet = new Set(prev.vehicleType || []);
                              if (item === "car") {
                                CAR_CHILD_SLUGS.forEach((s) =>
                                  nextSet.delete(s),
                                );
                              } else if (item === "truck") {
                                TRUCK_CHILD_SLUGS.forEach((s) =>
                                  nextSet.delete(s),
                                );
                              } else {
                                nextSet.delete(item);
                              }
                              const next = {
                                ...prev,
                                vehicleType: Array.from(nextSet),
                              };
                              updateURLFromFilters(next);
                              return next;
                            });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                        >
                          <Check className="w-3 h-3 text-red-600" />
                          {item === "car"
                            ? "All Cars"
                            : item === "truck"
                              ? "All Trucks"
                              : normalizeFilterValue(item)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // same remove logic
                              setAppliedFilters((prev) => {
                                const nextSet = new Set(prev.vehicleType || []);
                                if (item === "car") {
                                  CAR_CHILD_SLUGS.forEach((s) =>
                                    nextSet.delete(s),
                                  );
                                } else if (item === "truck") {
                                  TRUCK_CHILD_SLUGS.forEach((s) =>
                                    nextSet.delete(s),
                                  );
                                } else {
                                  nextSet.delete(item);
                                }
                                const next = {
                                  ...prev,
                                  vehicleType: Array.from(nextSet),
                                };
                                updateURLFromFilters(next);
                                return next;
                              });
                            }}
                            className="ml-1 text-white"
                          >
                            ×
                          </button>
                        </span>
                      ));
                    })()}
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
                    {(() => {
                      const unique = Array.from(
                        new Set(
                          appliedFilters.transmissionSpeed.map((v) =>
                            normalizeTransmission(v),
                          ),
                        ),
                      );
                      return unique.map((label) => (
                        <span
                          key={label}
                          onClick={() => {
                            setAppliedFilters((prev) => {
                              const next = {
                                ...prev,
                                transmissionSpeed:
                                  prev.transmissionSpeed.filter(
                                    (v) => normalizeTransmission(v) !== label,
                                  ),
                              };
                              updateURLFromFilters(next);
                              return next;
                            });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                        >
                          <Check className="w-3 h-3 text-red-600" />
                          {label}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAppliedFilters((prev) => {
                                const next = {
                                  ...prev,
                                  transmissionSpeed:
                                    prev.transmissionSpeed.filter(
                                      (v) => normalizeTransmission(v) !== label,
                                    ),
                                };
                                updateURLFromFilters(next);
                                return next;
                              });
                            }}
                            className="ml-1 text-white hover:text-gray-300"
                          >
                            ×
                          </button>
                        </span>
                      ));
                    })()}
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
                          ����
                        </button>
                      </span>
                    ))}
                    {appliedFilters.sellerType.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                      >
                        <Check className="w-3 h-3 text-red-600" />
                        {item}
                        <button
                          onClick={() =>
                            removeAppliedFilter("sellerType", item)
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
                        {(() => {
                          const m = appliedFilters.mileage;
                          if (!m) return null;
                          if (m.includes("-")) {
                            const [min, max] = m.split("-");
                            return `${Number(min).toLocaleString()}–${Number(max).toLocaleString()} Miles`;
                          }
                          if (m.endsWith("+")) {
                            return `${m.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}+ Miles`;
                          }
                          return `Under ${Number(m).toLocaleString()} Miles`;
                        })()}
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
                            setPriceMin("1000");
                            setPriceMax("50000");
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

            {/* Sticky wrapper - will stick throughout the entire scrollable area */}
            {!mobileFiltersOpen && (
              <div className="sticky top-0 z-50">
                {/* Mobile applied pills - combined in sticky bar */}
                {((appliedLocation && appliedRadius !== "nationwide") ||
                  appliedFilters.condition.length > 0 ||
                  appliedFilters.make.length > 0 ||
                  appliedFilters.model.length > 0 ||
                  appliedFilters.trim.length > 0 ||
                  appliedFilters.year.length > 0 ||
                  appliedFilters.bodyStyle.length > 0 ||
                  appliedFilters.vehicleType.length > 0 ||
                  appliedFilters.driveType.length > 0 ||
                  appliedFilters.exteriorColor.length > 0 ||
                  appliedFilters.sellerType.length > 0 ||
                  appliedFilters.mileage ||
                  appliedFilters.priceMin ||
                  appliedFilters.priceMax ||
                  appliedFilters.paymentMin ||
                  appliedFilters.paymentMax ||
                  (searchTerm && searchTerm.trim().length > 0) ||
                  (unifiedSearch &&
                    unifiedSearch.trim().length > 0 &&
                    appliedFilters.make.length === 0 &&
                    appliedFilters.model.length === 0 &&
                    appliedFilters.trim.length === 0)) && (
                  <div className="lg:hidden px-3 py-2 overflow-x-auto bg-white flex gap-2 items-center mobile-pills">
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs whitespace-nowrap flex-shrink-0"
                    >
                      Clear All
                    </button>
                    {(searchTerm && searchTerm.trim().length > 0) ||
                    (unifiedSearch &&
                      unifiedSearch.trim().length > 0 &&
                      appliedFilters.make.length === 0 &&
                      appliedFilters.model.length === 0 &&
                      appliedFilters.trim.length === 0) ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                        <Check className="w-3 h-3 text-red-600" />
                        {searchTerm && searchTerm.trim().length > 0
                          ? searchTerm
                          : unifiedSearch}
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setUnifiedSearch("");
                          }}
                          className="ml-1 text-white"
                        >
                          ��
                        </button>
                      </span>
                    ) : null}
                    {appliedLocation && appliedRadius !== "nationwide" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded-full text-xs whitespace-nowrap flex-shrink-0">
                        <Check className="w-3 h-3 text-red-600" />
                        <MapPin className="w-3 h-3" />
                        {appliedRadius} miles
                        <button
                          onClick={() => {
                            setAppliedLocation(null);
                            setAppliedRadius("200");
                          }}
                          className="ml-1 text-white"
                        >
                          ×
                        </button>
                      </span>
                    )}
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
                  </div>
                )}
                {/* Filter, Sort, Favorites Bar */}
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-gray-400 bg-white shadow-md mobile-filter-bar">
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
                          (appliedFilters.paymentMin ||
                          appliedFilters.paymentMax
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
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] w-56">
                        <button
                          onClick={() => {
                            setSortBy("relevance");
                            setSortDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "relevance" ? "bg-red-50 text-red-600" : ""}`}
                        >
                          Relevance
                        </button>
                        <button
                          onClick={() => {
                            setSortBy("price-low");
                            setSortDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "price-low" ? "bg-red-50 text-red-600" : ""}`}
                        >
                          Price: Low to High
                        </button>
                        <button
                          onClick={() => {
                            setSortBy("price-high");
                            setSortDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "price-high" ? "bg-red-50 text-red-600" : ""}`}
                        >
                          Price: High to Low
                        </button>
                        <button
                          onClick={() => {
                            setSortBy("miles-low");
                            setSortDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "miles-low" ? "bg-red-50 text-red-600" : ""}`}
                        >
                          Miles: Low to High
                        </button>
                        <button
                          onClick={() => {
                            setSortBy("miles-high");
                            setSortDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "miles-high" ? "bg-red-50 text-red-600" : ""}`}
                        >
                          Miles: High to Low
                        </button>
                        <button
                          onClick={() => {
                            setSortBy("year-newest");
                            setSortDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "year-newest" ? "bg-red-50 text-red-600" : ""}`}
                        >
                          Year: Newest to Oldest
                        </button>
                        <button
                          onClick={() => {
                            setSortBy("year-oldest");
                            setSortDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "year-oldest" ? "bg-red-50 text-red-600" : ""}`}
                        >
                          Year: Oldest to Newest
                        </button>
                        <button
                          onClick={() => {
                            setSortBy("distance-closest");
                            setSortDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === "distance-closest" ? "bg-red-50 text-red-600" : ""}`}
                        >
                          Distance: Closest to Me
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border-l border-gray-400 h-8"></div>

                  <button
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${viewMode === "favorites" ? "text-red-600" : ""}`}
                    onClick={() =>
                      setViewMode(
                        viewMode === "favorites" ? "all" : "favorites",
                      )
                    }
                  >
                    Favorites
                    <div className="relative">
                      <div
                        className={`w-12 h-6 rounded-full ${viewMode === "favorites" ? "bg-red-600" : "bg-gray-300"} transition-colors`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                            viewMode === "favorites"
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          } ${
                            viewMode === "favorites"
                              ? "bg-white"
                              : favoritesCount > 0
                                ? "bg-red-600 md:bg-white"
                                : "bg-white"
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Connection Status & Results Count - NOT in sticky */}
            <div className="px-3 py-2 bg-gray-50 text-sm">
              {error && error.includes("Unable to connect") && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded mb-2 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Connection issues detected. Some features may be limited.
                </div>
              )}
              <span className="font-medium">
                {viewMode === "favorites"
                  ? `${favoritesCount} Saved Vehicles`
                  : `${appliedFilters.condition.join(", ")}${appliedFilters.condition.length > 0 && appliedFilters.make.length > 0 ? ", " : ""}${appliedFilters.make.join(", ")}${appliedFilters.condition.length > 0 || appliedFilters.make.length > 0 ? " for sale" : "All Vehicles"} - ${totalResults.toLocaleString()} Results`}
              </span>
            </div>

            {/* Mobile Product Grid */}
            <div className="p-4 bg-white pt-4 lg:pt-28">
              {loading && vehicles.length === 0 ? (
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
                        termLength={termLength}
                        interestRate={interestRate}
                        downPayment={downPayment}
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
                    : `${totalResults.toLocaleString()} Matches${appliedLocation && (appliedLocation.city || appliedLocation.state) ? ` by ${appliedLocation.city || ""}${appliedLocation.city && appliedLocation.state ? ", " : ""}${appliedLocation.state || ""}` : ""}`}
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

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none bg-white"
                >
                  <option value="relevance">Sort</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="miles-low">Miles: Low to High</option>
                  <option value="miles-high">Miles: High to Low</option>
                  <option value="year-newest">Year: Newest to Oldest</option>
                  <option value="year-oldest">Year: Oldest to Newest</option>
                  <option value="distance-closest">
                    Distance: Closest to Me
                  </option>
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
          <div className="hidden md:block p-4 lg:p-4 bg-white">
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
            ) : loading && vehicles.length === 0 ? (
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
                      termLength={termLength}
                      interestRate={interestRate}
                      downPayment={downPayment}
                    />
                  ))}
                </div>

                {viewMode === "all" && apiResponse?.meta && (
                  <Pagination
                    currentPage={apiResponse?.meta?.currentPage || 1}
                    totalPages={apiResponse?.meta?.totalPages || 1}
                    totalResults={apiResponse?.meta?.totalRecords || 0}
                    resultsPerPage={apiResponse.meta.pageSize}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
