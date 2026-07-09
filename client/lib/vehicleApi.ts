// Frontend types for API responses
export interface VehicleRecord {
  id: number;
  year: number;
  make: string;
  model: string;
  trim: string;
  body_style: string;
  engine_cylinders: number;
  fuel_type: string;
  transmission: string;
  transmission_speed: string;
  drivetrain: string;
  exterior_color_generic: string;
  interior_color_generic: string;
  doors: number;
  price: number;
  mileage: number;
  title_status: string;
  highway_mpg: number;
  condition: string;
  certified: boolean;
  seller_account_number: string;
  seller_type: string;
  interest_rate: number;
  down_payment: number;
  loan_term: number;
  payments: number;
}

export interface PaginationMeta {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface VehiclesApiResponse {
  data: VehicleRecord[];
  meta: PaginationMeta;
  success: boolean;
  message?: string;
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  maxMileage?: number;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  bodyStyle?: string;
  certified?: boolean;
  sellerType?: string;
}

export interface FilterOptions {
  makes: string[];
  models: string[];
  conditions: string[];
  fuelTypes: string[];
  transmissions: string[];
  drivetrains: string[];
  bodyStyles: string[];
  sellerTypes: string[];
}
import { fetchWithRetry } from "./fetchWithRetry";

// If project doesn't provide a VITE_API_URL, keep base empty so relative paths are used
const DEFAULT_BASE = (import.meta as any)?.env?.VITE_API_URL || "";

class VehicleApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = DEFAULT_BASE;
  }

  private buildUrl(path: string) {
    // Ensure leading slash
    if (!path.startsWith("/")) path = `/${path}`;
    return `${this.baseUrl}${path}`;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    retries = 2,
    timeout = 15000,
  ): Promise<T> {
    const url = this.buildUrl(path);
    try {
      const res = await fetchWithRetry(url, init, retries, timeout);

      // fetchWithRetry returns a graceful response-like object on final failure
      if (!res || (res as any).ok === false) {
        const text =
          res && typeof res.text === "function"
            ? await (res as any).text()
            : "";
        const message = text || (res as any).statusText || "Network error";
        throw new Error(`Request failed: ${message}`);
      }

      const data = await (res as any).json();
      return data as T;
    } catch (err) {
      console.error(
        "vehicleApi.request error",
        path,
        err && (err as any).message ? (err as any).message : err,
      );
      throw err;
    }
  }

  async getVehicles(
    page = 1,
    pageSize = 20,
    filters: VehicleFilters = {},
    sortBy = "id",
    sortOrder: "ASC" | "DESC" = "DESC",
  ): Promise<VehiclesApiResponse> {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortOrder,
    });

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "")
        params.append(k, String(v));
    });

    // Prefer calling the WordPress API directly (VITE_WP_URL) when available
    // because the local proxy/dev server may be down. Do NOT fall back to demo/mock data.
    try {
      const env = (import.meta as any)?.env || {};
      const wpBaseRaw = env.VITE_WP_URL || "";
      const wpBase = String(wpBaseRaw).replace(/\/$/, "");
      if (wpBase) {
        const wpUrl = `${wpBase}/wp-json/custom/v1/vehicles?${params.toString()}`;
        try {
          const res = await fetchWithRetry(wpUrl, {}, 2, 15000);
          if (res && (res as any).ok !== false) {
            const data = await (res as any).json();
            // If the WP API returned a top-level array or an object matching our expected shape, return it
            return data as VehiclesApiResponse;
          }
          console.warn("vehicleApi: direct WP fetch returned non-ok, falling back to local /api/vehicles", res && (res as any).statusText);
        } catch (wpFetchErr) {
          console.warn("vehicleApi: direct WP fetch failed, falling back to local /api/vehicles", wpFetchErr && wpFetchErr.message ? wpFetchErr.message : wpFetchErr);
        }
      }
    } catch (e) {
      // swallow env read errors and continue to local proxy
      console.warn("vehicleApi: error while attempting direct WP fetch", e && (e as any).message ? (e as any).message : e);
    }

    // Last-resort: use configured base (likely relative /api/vehicles) which may be a local proxy
    return this.request<VehiclesApiResponse>(`/api/vehicles?${params.toString()}`);
  }

  async getVehicleById(id: number) {
    return this.request(`/api/vehicles/${id}`);
  }

  async getFilterOptions(): Promise<
    { success: boolean; data: FilterOptions } | any
  > {
    return this.request(`/api/vehicles/filters`);
  }

  async healthCheck() {
    return this.request(`/api/health`, {}, 1, 5000);
  }
}

export const vehicleApi = new VehicleApiClient();

// Utility helpers preserved for backward compatibility
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat("en-US").format(mileage);
}

export function getVehicleTitle(vehicle: VehicleRecord): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`.trim();
}

export function getVehicleImageUrl(vehicle: VehicleRecord): string {
  const featured =
    (vehicle as any).featured_image || (vehicle as any).featuredImage;
  if (featured) return String(featured);
  const images = (vehicle as any).images;
  if (images && Array.isArray(images) && images.length > 0) {
    const first =
      typeof images[0] === "string"
        ? images[0]
        : images[0].src || images[0].url;
    if (first) return String(first);
  }
  return (
    (import.meta as any)?.env?.VITE_PLACEHOLDER_IMAGE ||
    "/assets/fallback-image-450.webp" ||
    "/placeholder.svg"
  );
}
