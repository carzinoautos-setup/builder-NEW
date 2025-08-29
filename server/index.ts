import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.js";
import {
  getVehicles,
  getVehicleById,
  getFilterOptions,
  healthCheck,
} from "./routes/vehicles.js";
import {
  getSimpleVehicles,
  getSimpleVehicleById,
  getSimpleFilterOptions,
  simpleHealthCheck,
} from "./routes/simpleVehicles.js";
import {
  geocodeZip,
  geocodeBatch,
  geocodingHealthCheck,
  getCacheStats,
  clearGeocodingCache,
} from "./routes/geocoding.js";
import {
  createDatabaseConnection,
  testDatabaseConnection,
} from "./db/connection.js";
import {
  calculatePayment,
  calculateBulkPayments,
  calculateAffordablePrice,
  getCacheStats,
  clearCache,
} from "./routes/payments.js";
import { WordPressSync } from "./scripts/syncWordPressUpdates.js";

export function createServer() {
  const app = express();

  // Initialize database connection
  try {
    createDatabaseConnection();
    console.log("🔌 Database connection pool initialized");
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/health", healthCheck);

  // Vehicle API routes (complex schema)
  app.get("/api/vehicles", getVehicles);
  app.get("/api/vehicles/filters", getFilterOptions);
  app.get("/api/vehicles/:id", getVehicleById);

  // Simple Vehicle API routes (original demo format)
  app.get("/api/simple-vehicles", getSimpleVehicles);
  app.get("/api/simple-vehicles/filters", getSimpleFilterOptions);
  app.get("/api/simple-vehicles/:id", getSimpleVehicleById);
  app.get("/api/simple-health", simpleHealthCheck);

  // Payment calculation routes
  app.post("/api/payments/calculate", calculatePayment);
  app.post("/api/payments/bulk", calculateBulkPayments);
  app.post("/api/payments/affordable-price", calculateAffordablePrice);
  app.get("/api/payments/cache-stats", getCacheStats);
  app.delete("/api/payments/cache", clearCache);

  // Geocoding API routes
  app.get("/api/geocode/health", geocodingHealthCheck);
  app.get("/api/geocode/cache/stats", getCacheStats);
  app.delete("/api/geocode/cache", clearGeocodingCache);
  app.get("/api/geocode/:zip", geocodeZip);
  app.post("/api/geocode/batch", geocodeBatch);

  // Example API routes (keep for backward compatibility)
  app.get("/api/demo", handleDemo);

  // Test database connection on startup
  testDatabaseConnection().catch((error) => {
    console.error("⚠️  Database connection test failed during startup:", error);
  });

  // Initialize WordPress sync system
  setupWordPressSync();

  return app;
}

/**
 * Set up automated WordPress synchronization
 * Runs initial sync check and sets up periodic sync
 */
async function setupWordPressSync() {
  try {
    console.log("🔄 Initializing WordPress sync system...");

    const sync = new WordPressSync();

    // Run initial sync check (only if needed)
    setTimeout(async () => {
      try {
        console.log("🔍 Running initial WordPress sync check...");
        await sync.runSync();
        console.log("✅ Initial WordPress sync completed");
      } catch (error) {
        console.error("⚠️  Initial WordPress sync failed (this is normal if WordPress isn't connected):", error.message);
      }
    }, 5000); // Wait 5 seconds after server start

    // Set up automatic sync every hour
    setInterval(async () => {
      try {
        console.log("🔄 Running scheduled WordPress sync...");
        const startTime = Date.now();
        await sync.runSync();
        const duration = Date.now() - startTime;
        console.log(`✅ Scheduled WordPress sync completed in ${duration}ms`);
      } catch (error) {
        console.error("❌ Scheduled WordPress sync failed:", error.message);
      }
    }, 60 * 60 * 1000); // Every 60 minutes

    console.log("✅ WordPress sync system initialized - will sync every hour");
  } catch (error) {
    console.error("❌ Failed to initialize WordPress sync system:", error);
  }
}
