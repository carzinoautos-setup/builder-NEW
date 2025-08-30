/**
 * WooCommerce Vehicles API Route
 * Serves vehicle data from WooCommerce in MySQL-compatible format
 */

import express from "express";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const router = express.Router();

// WooCommerce API configuration from environment variables
const WC_CONFIG = {
  url: process.env.VITE_WC_API_URL || "",
  consumerKey: process.env.VITE_WC_CONSUMER_KEY || "",
  consumerSecret: process.env.VITE_WC_CONSUMER_SECRET || "",
  version: "wc/v3",
  queryStringAuth: true,
};

// Initialize WooCommerce API client
let wcApi: WooCommerceRestApi | null = null;

const validateWooCommerceConfig = () => {
  const missing = [];
  if (!WC_CONFIG.url) missing.push("VITE_WC_API_URL");
  if (!WC_CONFIG.consumerKey) missing.push("VITE_WC_CONSUMER_KEY");
  if (!WC_CONFIG.consumerSecret) missing.push("VITE_WC_CONSUMER_SECRET");

  if (missing.length > 0) {
    console.error(
      "❌ Missing WooCommerce environment variables:",
      missing.join(", "),
    );
    return false;
  }
  return true;
};

if (validateWooCommerceConfig()) {
  wcApi = new WooCommerceRestApi(WC_CONFIG);
  console.log("✅ WooCommerce API initialized for vehicles route");
}

/**
 * Transform WooCommerce product to MySQL vehicle format
 */
function transformWooCommerceToVehicle(product: any): any {
  // Extract vehicle data from WooCommerce product meta fields
  const meta = product.meta_data || [];
  const getMetaValue = (key: string) => {
    const metaItem = meta.find((item: any) => item.key === key);
    return metaItem ? metaItem.value : "";
  };

  return {
    id: product.id,
    title: product.name,
    year: parseInt(getMetaValue("vehicle_year")) || new Date().getFullYear(),
    make: getMetaValue("vehicle_make") || "Unknown",
    model: getMetaValue("vehicle_model") || "Unknown",
    trim: getMetaValue("vehicle_trim") || "",
    body_style: getMetaValue("vehicle_body_style") || "Sedan",
    condition: product.status === "publish" ? "Used" : "New",
    mileage: parseInt(getMetaValue("vehicle_mileage")) || 0,
    transmission: getMetaValue("vehicle_transmission") || "Automatic",
    doors: parseInt(getMetaValue("vehicle_doors")) || 4,
    engine_cylinders: parseInt(getMetaValue("vehicle_engine_cylinders")) || 4,
    fuel_type: getMetaValue("vehicle_fuel_type") || "Gasoline",
    transmission_speed:
      getMetaValue("vehicle_transmission_speed") || "Automatic",
    drivetrain: getMetaValue("vehicle_drivetrain") || "FWD",
    exterior_color_generic: getMetaValue("vehicle_exterior_color") || "White",
    interior_color_generic: getMetaValue("vehicle_interior_color") || "Black",
    title_status: getMetaValue("vehicle_title_status") || "Clean",
    highway_mpg: parseInt(getMetaValue("vehicle_highway_mpg")) || 25,
    certified: getMetaValue("vehicle_certified") === "yes",
    price: parseFloat(product.price) || 0,
    payments: Math.round((parseFloat(product.price) || 0) / 60), // Rough payment estimate
    seller_type: "Dealer",
    seller_account_number: "WC-" + product.id,
    images: product.images?.map((img: any) => img.src) || [],
  };
}

/**
 * GET /api/woocommerce/vehicles
 * Fetch vehicles from WooCommerce with MySQL-compatible response format
 */
router.get("/vehicles", async (req, res) => {
  try {
    if (!wcApi) {
      return res.status(500).json({
        success: false,
        message:
          "WooCommerce API not configured. Please set environment variables.",
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

    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = (req.query.search as string) || "";

    // Build WooCommerce API query
    const wcQuery: any = {
      page,
      per_page: pageSize,
      status: "publish",
      category: "vehicles", // Assumes you have a vehicles category
    };

    // Add search if provided
    if (search) {
      wcQuery.search = search;
    }

    // Add filters from query parameters
    if (req.query.make) {
      wcQuery.meta_key = "vehicle_make";
      wcQuery.meta_value = req.query.make;
    }

    console.log("🔍 Fetching vehicles from WooCommerce:", wcQuery);

    // Fetch products from WooCommerce
    const response = await wcApi.get("products", wcQuery);
    const products = response.data;

    // Transform to MySQL vehicle format
    const vehicles = products.map(transformWooCommerceToVehicle);

    // Get total count for pagination (WooCommerce provides this in headers)
    const totalRecords = parseInt(response.headers["x-wp-total"] || "0");
    const totalPages = parseInt(response.headers["x-wp-totalpages"] || "1");

    // Build MySQL-compatible response
    const apiResponse = {
      success: true,
      data: vehicles,
      meta: {
        totalRecords,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    console.log(
      `✅ Returned ${vehicles.length} vehicles from WooCommerce (page ${page}/${totalPages})`,
    );
    res.json(apiResponse);
  } catch (error) {
    console.error("❌ WooCommerce API error:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch vehicles from WooCommerce",
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
});

/**
 * GET /api/woocommerce/dealers
 * Get dealer information (can be static or from WooCommerce)
 */
router.get("/dealers", async (req, res) => {
  // For now, return static dealer data
  // You can extend this to fetch from WooCommerce if needed
  res.json({
    success: true,
    data: [
      { name: "Kinsta Auto Group", count: 1234 },
      { name: "Premium Motors", count: 856 },
      { name: "Elite Car Sales", count: 672 },
    ],
  });
});

/**
 * GET /api/woocommerce/vehicle-types
 * Get vehicle types from WooCommerce
 */
router.get("/vehicle-types", async (req, res) => {
  // Return static vehicle types for now
  // You can extend this to fetch from WooCommerce product categories
  res.json({
    success: true,
    data: [
      { name: "Sedan", count: 1698 },
      { name: "SUV", count: 3405 },
      { name: "Truck", count: 2217 },
      { name: "Coupe", count: 419 },
      { name: "Convertible", count: 125 },
      { name: "Hatchback", count: 342 },
      { name: "Van / Minivan", count: 298 },
      { name: "Wagon", count: 156 },
    ],
  });
});

export default router;
