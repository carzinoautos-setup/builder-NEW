/**
 * WooCommerce REST API Client
 * Direct integration with WooCommerce API using consumer keys
 * For Vercel deployment with environment variables
 */

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// WooCommerce API configuration from environment variables
const WC_CONFIG = {
  url: import.meta.env.VITE_WC_API_URL || "",
  consumerKey: import.meta.env.VITE_WC_CONSUMER_KEY || "",
  consumerSecret: import.meta.env.VITE_WC_CONSUMER_SECRET || "",
  version: "wc/v3",
  queryStringAuth: true, // Force Basic Authentication for HTTPS
};

// Validate required environment variables
const validateConfig = () => {
  const missing = [];
  if (!WC_CONFIG.url) missing.push("VITE_WC_API_URL");
  if (!WC_CONFIG.consumerKey) missing.push("VITE_WC_CONSUMER_KEY");
  if (!WC_CONFIG.consumerSecret) missing.push("VITE_WC_CONSUMER_SECRET");

  if (missing.length > 0) {
    console.error(
      "❌ Missing required WooCommerce environment variables:",
      missing.join(", "),
    );
    return false;
  }
  return true;
};

// Initialize WooCommerce API client
let wcApi: WooCommerceRestApi | null = null;

if (validateConfig()) {
  wcApi = new WooCommerceRestApi(WC_CONFIG);
  console.log("✅ WooCommerce API client initialized");
} else {
  console.warn(
    "⚠️ WooCommerce API client not initialized - missing environment variables",
  );
}

// Vehicle product interface for WooCommerce
export interface WCVehicle {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  status: string;
  featured: boolean;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  meta_data: Array<{
    key: string;
    value: any;
  }>;

  // Basic Information
  year?: number;
  make?: string;
  model?: string;
  trim?: string;

  // Technical Specs
  mileage?: number;
  transmission?: string;
  transmission_speed?: string;
  doors?: number;
  engine_cylinders?: number;
  fuel_type?: string;
  drivetrain?: string;
  body_style?: string;
  highway_mpg?: number;

  // Visual & Media
  exterior_color?: string;
  interior_color?: string;
  mileageIcon?: string;
  transmissionIcon?: string;
  doorIcon?: string;

  // Status & Condition
  condition?: string;
  certified?: boolean;
  title_status?: string;
  badges?: string[];

  // Pricing & Financing
  payment?: number;
  payments?: number;
  interest_rate?: number;
  down_payment?: number;
  loan_term?: number;

  // Seller Information
  dealer?: string;
  seller_type?: string;
  seller_account_number?: string;
  location?: string;
  phone?: string;

  // Location data
  latitude?: number;
  longitude?: number;
}

// API response interfaces
export interface WCProductsResponse {
  data: WCVehicle[];
  headers: Record<string, string>;
}

export interface VehicleFilters {
  page?: number;
  per_page?: number;
  search?: string;
  featured?: boolean;
  status?: string;
  min_price?: number;
  max_price?: number;
  // Meta query filters (for custom vehicle fields)
  make?: string;
  model?: string;
  year?: number;
  condition?: string;
  fuel_type?: string;
}

/**
 * WooCommerce Vehicle API Class
 */
export class WooCommerceVehicleAPI {
  private api: WooCommerceRestApi | null;

  constructor() {
    this.api = wcApi;
  }

  /**
   * Check if API is available
   */
  isAvailable(): boolean {
    return this.api !== null;
  }

  /**
   * Get all vehicle products from WooCommerce
   */
  async getVehicles(filters: VehicleFilters = {}): Promise<WCVehicle[]> {
    if (!this.api) {
      throw new Error(
        "WooCommerce API not initialized. Check environment variables.",
      );
    }

    try {
      const params = {
        per_page: filters.per_page || 20,
        page: filters.page || 1,
        status: filters.status || "publish",
        search: filters.search || "",
        featured: filters.featured,
        min_price: filters.min_price,
        max_price: filters.max_price,
      };

      // Remove undefined values
      Object.keys(params).forEach(
        (key) =>
          params[key as keyof typeof params] === undefined &&
          delete params[key as keyof typeof params],
      );

      const response = await this.api.get("products", params);
      const vehicles = response.data as WCVehicle[];

      // Transform meta_data into direct properties for easier access
      return vehicles.map((vehicle) => this.transformVehicleMetaData(vehicle));
    } catch (error) {
      console.error("Error fetching WooCommerce vehicles:", error);
      throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }
  }

  /**
   * Get single vehicle by ID
   */
  async getVehicle(id: number): Promise<WCVehicle | null> {
    if (!this.api) {
      throw new Error(
        "WooCommerce API not initialized. Check environment variables.",
      );
    }

    try {
      const response = await this.api.get(`products/${id}`);
      return this.transformVehicleMetaData(response.data as WCVehicle);
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      return null;
    }
  }

  /**
   * Transform WooCommerce meta_data array into direct properties
   * Based on your actual ACF field mapping from WORDPRESS-FIELD-MAPPING.md
   */
  private transformVehicleMetaData(vehicle: WCVehicle): WCVehicle {
    const transformed = { ...vehicle };

    // Map meta_data to direct properties based on your actual ACF field names
    vehicle.meta_data?.forEach((meta) => {
      switch (meta.key) {
        // Basic Information
        case "year":
          transformed.year = parseInt(meta.value);
          break;
        case "make":
          transformed.make = meta.value;
          break;
        case "model":
          transformed.model = meta.value;
          break;
        case "trim":
          transformed.trim = meta.value;
          break;

        // Technical Specs
        case "mileage":
          transformed.mileage = parseInt(meta.value);
          break;
        case "transmission":
          transformed.transmission = meta.value;
          break;
        case "transmission_speed":
          transformed.transmission_speed = meta.value;
          break;
        case "doors":
          transformed.doors = parseInt(meta.value);
          break;
        case "engine_cylinders":
          transformed.engine_cylinders = parseInt(meta.value);
          break;
        case "fuel_type":
          transformed.fuel_type = meta.value;
          break;
        case "drivetrain":
          transformed.drivetrain = meta.value;
          break;
        case "body_style":
          transformed.body_style = meta.value;
          break;
        case "highway_mpg":
          transformed.highway_mpg = parseInt(meta.value);
          break;

        // Visual & Media
        case "exterior_color_generic":
          transformed.exterior_color = meta.value;
          break;
        case "interior_color_generic":
          transformed.interior_color = meta.value;
          break;
        case "_vehicle_mileage_icon":
          transformed.mileageIcon = meta.value;
          break;
        case "_vehicle_transmission_icon":
          transformed.transmissionIcon = meta.value;
          break;
        case "_vehicle_door_icon":
          transformed.doorIcon = meta.value;
          break;

        // Status & Condition
        case "condition":
          transformed.condition = meta.value;
          break;
        case "certified":
          transformed.certified = meta.value === "yes" || meta.value === true;
          break;
        case "title_status":
          transformed.title_status = meta.value;
          break;
        case "is_featured":
          transformed.featured = meta.value === "yes" || meta.value === true;
          break;
        case "_vehicle_badges":
          transformed.badges = Array.isArray(meta.value) ? meta.value : [];
          break;

        // Pricing & Financing
        case "_price":
          transformed.price = meta.value;
          break;
        case "_sale_price":
          transformed.sale_price = meta.value;
          break;
        case "_vehicle_payment":
          transformed.payment = parseFloat(meta.value);
          break;
        case "_vehicle_calculated_payment":
          transformed.payments = parseFloat(meta.value);
          break;
        case "_vehicle_interest_rate":
          transformed.interest_rate = parseFloat(meta.value);
          break;
        case "_vehicle_down_payment":
          transformed.down_payment = parseFloat(meta.value);
          break;
        case "_vehicle_loan_term":
          transformed.loan_term = parseInt(meta.value);
          break;

        // Seller Information
        case "_vehicle_dealer":
          transformed.dealer = meta.value;
          break;
        case "_vehicle_seller_type":
          transformed.seller_type = meta.value;
          break;
        case "_vehicle_seller_account":
          transformed.seller_account_number = meta.value;
          break;
        case "_vehicle_location":
          transformed.location = meta.value;
          break;
        case "_vehicle_phone":
          transformed.phone = meta.value;
          break;

        // Location data
        case "car_location_latitude":
          transformed.latitude = parseFloat(meta.value);
          break;
        case "car_location_longitude":
          transformed.longitude = parseFloat(meta.value);
          break;
      }
    });

    return transformed;
  }

  /**
   * Get vehicles filtered by specific criteria
   */
  async getVehiclesByMake(
    make: string,
    page: number = 1,
  ): Promise<WCVehicle[]> {
    const vehicles = await this.getVehicles({ page, per_page: 50 });
    return vehicles.filter(
      (vehicle) => vehicle.make?.toLowerCase() === make.toLowerCase(),
    );
  }

  /**
   * Search vehicles by keyword
   */
  async searchVehicles(query: string, page: number = 1): Promise<WCVehicle[]> {
    return this.getVehicles({ search: query, page });
  }
}

// Export singleton instance
export const wooCommerceAPI = new WooCommerceVehicleAPI();

// Helper functions for vehicle data transformation
export const formatVehiclePrice = (price: string | number): string => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(numPrice);
};

export const formatVehicleMileage = (mileage: number): string => {
  return `${mileage?.toLocaleString()} mi`;
};

export const getVehicleTitle = (vehicle: WCVehicle): string => {
  if (vehicle.year && vehicle.make && vehicle.model) {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  }
  return vehicle.name;
};
