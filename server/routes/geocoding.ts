import { RequestHandler } from "express";

// Basic ZIP code to coordinate mapping (expandable)
const ZIP_COORDINATES: { [key: string]: {lat: number; lng: number; city: string; state: string} } = {
  "98498": { lat: 47.0379, lng: -122.9015, city: "Lakewood", state: "WA" },
  "90210": { lat: 34.0901, lng: -118.4065, city: "Beverly Hills", state: "CA" },
  "10001": { lat: 40.7505, lng: -73.9934, city: "New York", state: "NY" },
  "60601": { lat: 41.8781, lng: -87.6298, city: "Chicago", state: "IL" },
  "75001": { lat: 32.9483, lng: -96.7299, city: "Addison", state: "TX" },
  "33101": { lat: 25.7617, lng: -80.1918, city: "Miami", state: "FL" },
  "77001": { lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX" },
  "85001": { lat: 33.4484, lng: -112.0740, city: "Phoenix", state: "AZ" },
  "80201": { lat: 39.7392, lng: -104.9903, city: "Denver", state: "CO" },
  "97201": { lat: 45.5152, lng: -122.6784, city: "Portland", state: "OR" },
  "30301": { lat: 33.7490, lng: -84.3880, city: "Atlanta", state: "GA" },
  "02101": { lat: 42.3601, lng: -71.0589, city: "Boston", state: "MA" },
  "19101": { lat: 39.9526, lng: -75.1652, city: "Philadelphia", state: "PA" },
  "63101": { lat: 38.6270, lng: -90.1994, city: "St. Louis", state: "MO" },
  "55401": { lat: 44.9778, lng: -93.2650, city: "Minneapolis", state: "MN" },
};

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

    // Use only 5-digit ZIP
    const zipCode = zip.substring(0, 5);
    const result = ZIP_COORDINATES[zipCode];

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `ZIP code ${zipCode} not found. Supported ZIPs: ${Object.keys(ZIP_COORDINATES).join(', ')}`,
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

      const zipCode = zip.substring(0, 5);
      const result = ZIP_COORDINATES[zipCode];

      results.push({
        zip,
        success: !!result,
        data: result,
        error: result ? undefined : "ZIP code not found",
      });
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
    const testResult = ZIP_COORDINATES["98498"];

    res.status(200).json({
      success: true,
      message: "Geocoding service healthy",
      timestamp: new Date().toISOString(),
      testZip: "98498",
      testResult: testResult,
      availableZips: Object.keys(ZIP_COORDINATES).length,
      supportedZips: Object.keys(ZIP_COORDINATES).slice(0, 5), // Show first 5
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
