import { RequestHandler } from "express";
import { VehicleService } from "../services/vehicleService.js";
import { MockVehicleService } from "../services/mockVehicleService.js";
import { PaginationParams, VehicleFilters } from "../types/vehicle.js";

// Decide whether to use the real VehicleService (MySQL), a WordPress proxy, or MockVehicleService
const useMock = process.env.USE_MOCK === "true";
const hasDbEnv = !!(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD);
const hasWpApi = !!process.env.WP_API_BASE;

if (useMock) {
  console.log("🚀 USE_MOCK is true — using MockVehicleService");
}

// Prefer WP_API proxy when configured
if (hasWpApi && !useMock) {
  console.log("🔁 WP_API_BASE detected — proxying /api/vehicles to WordPress plugin API at:", process.env.WP_API_BASE);
} else if (hasDbEnv && !useMock) {
  console.log("✅ DB env vars present — attempting to use VehicleService (MySQL)");
} else if (!hasWpApi && !hasDbEnv && !useMock) {
  console.log(
    "⚠️ No data backend configured (no WP_API_BASE and no DB_*). Falling back to MockVehicleService",
  );
}

let vehicleService: any = null;
try {
  if (!useMock && hasWpApi) {
    // WP proxy mode — routes will forward requests to WP API directly
    vehicleService = null;
  } else if (!useMock && hasDbEnv) {
    vehicleService = new VehicleService();
    console.log("✅ Using VehicleService (MySQL) for real data");
  } else {
    vehicleService = new MockVehicleService();
  }
} catch (err) {
  console.error("Failed to initialize VehicleService, falling back to MockVehicleService:", err);
  vehicleService = new MockVehicleService();
}

/**
 * GET /api/vehicles
 * Fetch paginated vehicles with optional filters
 */
// Helper to build WP API URL (do NOT append credentials to query string)
function buildWpUrl(base: string, path: string, qs: string) {
  const cleanBase = base.replace(/\/$/, "");
  return `${cleanBase}/${path}${qs ? `?${qs}` : ""}`;
}

export const getVehicles: RequestHandler = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(
      parseInt(req.query.pageSize as string) || 20,
      100,
    ); // Max 100 per page
    const sortBy = (req.query.sortBy as string) || "id";
    const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page number must be greater than 0",
      });
    }

    if (pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        success: false,
        message: "Page size must be between 1 and 100",
      });
    }

    const pagination: PaginationParams = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    // Parse filter parameters
    const filters: VehicleFilters = {};

    if (req.query.make) filters.make = req.query.make as string;
    if (req.query.model) filters.model = req.query.model as string;
    if (req.query.year) filters.year = parseInt(req.query.year as string);
    if (req.query.minPrice)
      filters.minPrice = parseFloat(req.query.minPrice as string);
    if (req.query.maxPrice)
      filters.maxPrice = parseFloat(req.query.maxPrice as string);
    if (req.query.condition) filters.condition = req.query.condition as string;
    if (req.query.maxMileage)
      filters.maxMileage = parseInt(req.query.maxMileage as string);
    if (req.query.fuelType) filters.fuelType = req.query.fuelType as string;
    if (req.query.transmission)
      filters.transmission = req.query.transmission as string;
    if (req.query.drivetrain)
      filters.drivetrain = req.query.drivetrain as string;
    if (req.query.bodyStyle) filters.bodyStyle = req.query.bodyStyle as string;
    if (req.query.certified !== undefined) {
      filters.certified = req.query.certified === "true";
    }
    if (req.query.sellerType)
      filters.sellerType = req.query.sellerType as string;

    // If WP API base is configured and not using mock, proxy the request directly to WordPress plugin API
    if (process.env.WP_API_BASE && process.env.USE_MOCK !== "true") {
      const wpBase = process.env.WP_API_BASE.replace(/\/$/, "");
      // Preserve original query string exactly as received (avoid modifying array/comma params)
      const rawQs = (req.originalUrl && req.originalUrl.split("?")[1]) || "";
      const url = `${wpBase}/vehicles${rawQs ? `?${rawQs}` : ""}`;

      // Build Authorization header using Basic auth if consumer key/secret are available
      const headers: Record<string, string> = {
        "Accept": "application/json",
      };
      if (process.env.WP_CONSUMER_KEY && process.env.WP_CONSUMER_SECRET) {
        const creds = `${process.env.WP_CONSUMER_KEY}:${process.env.WP_CONSUMER_SECRET}`;
        const encoded = Buffer.from(creds).toString("base64");
        headers["Authorization"] = `Basic ${encoded}`;
      }

      const wpResponse = await fetch(url, { method: "GET", headers });
      const body = await wpResponse.text();

      // Try to parse JSON, otherwise proxy raw
      try {
        const json = JSON.parse(body);
        return res.status(wpResponse.status).json(json);
      } catch (e) {
        return res.status(wpResponse.status).send(body);
      }
    }

    // Otherwise use the configured service (MySQL or Mock)
    const result = await vehicleService.getVehicles(filters, pagination);

    // Return response
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getVehicles route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
};

/**
 * GET /api/vehicles/:id
 * Fetch a single vehicle by ID
 */
export const getVehicleById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const vehicle = await vehicleService.getVehicleById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Error in getVehicleById route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * GET /api/vehicles/filters
 * Get available filter options
 */
export const getFilterOptions: RequestHandler = async (req, res) => {
  try {
    // If WP API base configured and not using mock, proxy filter request
    if (process.env.WP_API_BASE && process.env.USE_MOCK !== "true") {
      const wpBase = process.env.WP_API_BASE.replace(/\/$/, "");
      const rawQs = (req.originalUrl && req.originalUrl.split("?")[1]) || "";
      const url = `${wpBase}/filters${rawQs ? `?${rawQs}` : ""}`;
      const headers: Record<string, string> = {
        "Accept": "application/json",
      };
      if (process.env.WP_CONSUMER_KEY && process.env.WP_CONSUMER_SECRET) {
        const creds = `${process.env.WP_CONSUMER_KEY}:${process.env.WP_CONSUMER_SECRET}`;
        const encoded = Buffer.from(creds).toString("base64");
        headers["Authorization"] = `Basic ${encoded}`;
      }
      const wpResponse = await fetch(url, { method: "GET", headers });
      const body = await wpResponse.text();
      // Log proxied response for debugging conditional filters (trim large output)
      try {
        console.log("[WP_PROXY_REQUEST] url:", url, "hasAuth:", !!headers["Authorization"]);
        const trimmed = body && body.length > 5000 ? body.substring(0, 5000) + "...(truncated)" : body;
        console.log("[WP_PROXY_RESPONSE] /filters -> status:", wpResponse.status, "body:", trimmed);
      } catch (e) {
        console.log("[WP_PROXY_RESPONSE] /filters -> (unable to log body)");
      }
      try {
        const json = JSON.parse(body);
        return res.status(wpResponse.status).json(json);
      } catch (e) {
        return res.status(wpResponse.status).send(body);
      }
    }

    const options = await vehicleService.getFilterOptions();

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("Error in getFilterOptions route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: {
        makes: [],
        models: [],
        conditions: [],
        fuelTypes: [],
        transmissions: [],
        drivetrains: [],
        bodyStyles: [],
        sellerTypes: [],
      },
    });
  }
};

/**
 * GET /api/vehicles/health
 * Service health check endpoint
 */
export const healthCheck: RequestHandler = async (req, res) => {
  try {
    // Test service connectivity
    const testResult = await vehicleService.getVehicles(
      {},
      { page: 1, pageSize: 1 },
    );

    res.status(200).json({
      success: true,
      message:
        "Mock service healthy - 50,000 sample vehicles ready for testing",
      timestamp: new Date().toISOString(),
      serviceConnected: testResult.success,
      usingMockData: true,
      totalRecords: testResult.meta?.totalRecords || 0,
      note: "Switch to VehicleService in routes/vehicles.ts when ready for real MySQL",
    });
  } catch (error) {
    console.error("Service health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Mock service connection failed",
      timestamp: new Date().toISOString(),
      serviceConnected: false,
      usingMockData: true,
    });
  }
};
