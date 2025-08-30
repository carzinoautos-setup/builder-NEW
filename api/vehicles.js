// Vercel serverless function for vehicles API
import { MockVehicleService } from "../server/services/mockVehicleService.js";

const vehicleService = new MockVehicleService();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
    const sortBy = req.query.sortBy || "id";
    const sortOrder = req.query.sortOrder || "DESC";

    const pagination = { page, pageSize, sortBy, sortOrder };

    // Parse filter parameters
    const filters = {};
    if (req.query.make) filters.make = req.query.make;
    if (req.query.model) filters.model = req.query.model;
    if (req.query.year) filters.year = parseInt(req.query.year);
    if (req.query.minPrice) filters.minPrice = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filters.maxPrice = parseFloat(req.query.maxPrice);
    if (req.query.condition) filters.condition = req.query.condition;
    if (req.query.maxMileage)
      filters.maxMileage = parseInt(req.query.maxMileage);
    if (req.query.fuelType) filters.fuelType = req.query.fuelType;
    if (req.query.transmission) filters.transmission = req.query.transmission;
    if (req.query.drivetrain) filters.drivetrain = req.query.drivetrain;
    if (req.query.bodyStyle) filters.bodyStyle = req.query.bodyStyle;
    if (req.query.certified !== undefined)
      filters.certified = req.query.certified === "true";
    if (req.query.sellerType) filters.sellerType = req.query.sellerType;

    // Fetch vehicles from service
    const result = await vehicleService.getVehicles(filters, pagination);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in vehicles API:", error);
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
}
