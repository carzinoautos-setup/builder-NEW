import { RequestHandler } from "express";
import { locationService } from "../services/locationService.js";

/**
 * GET /api/geocode/:zip
 * Convert ZIP code to coordinates
 */
export const geocodeZip: RequestHandler = async (req, res) => {
  try {
    const zip = req.params.zip;

    // Validate ZIP code format
    if (!zip || !/^\d{5}(-\d{4})?$/.test(zip)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ZIP code format. Use 5 digits (e.g., 98498) or 9 digits (e.g., 98498-1234)",
      });
    }

    // Get coordinates from location service
    const result = await locationService.geocodeZip(zip.substring(0, 5)); // Use only 5-digit ZIP

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "ZIP code not found or could not be geocoded",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in geocodeZip route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while geocoding ZIP code",
    });
  }
};

/**
 * POST /api/geocode/batch
 * Geocode multiple ZIP codes at once
 */
export const geocodeBatch: RequestHandler = async (req, res) => {
  try {
    const { zips } = req.body;

    if (!Array.isArray(zips) || zips.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must contain 'zips' array with at least one ZIP code",
      });
    }

    if (zips.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 ZIP codes allowed per batch request",
      });
    }

    const results = [];
    
    for (const zip of zips) {
      if (!/^\d{5}(-\d{4})?$/.test(zip)) {
        results.push({
          zip,
          success: false,
          error: "Invalid ZIP code format",
        });
        continue;
      }

      try {
        const result = await locationService.geocodeZip(zip.substring(0, 5));
        results.push({
          zip,
          success: !!result,
          data: result,
        });
      } catch (error) {
        results.push({
          zip,
          success: false,
          error: "Geocoding failed",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error in geocodeBatch route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while batch geocoding",
    });
  }
};

/**
 * GET /api/geocode/health
 * Geocoding service health check
 */
export const geocodingHealthCheck: RequestHandler = async (req, res) => {
  try {
    // Test with a known ZIP code
    const testResult = await locationService.geocodeZip("98498");

    res.status(200).json({
      success: true,
      message: "Geocoding service healthy",
      timestamp: new Date().toISOString(),
      testZip: "98498",
      testResult: testResult,
    });
  } catch (error) {
    console.error("Geocoding service health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Geocoding service health check failed",
      timestamp: new Date().toISOString(),
    });
  }
};
