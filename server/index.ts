import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.js";
import { getVehicles, getVehicleById, getFilterOptions, healthCheck } from "./routes/vehicles.js";
import { getSimpleVehicles, getSimpleVehicleById, getSimpleFilterOptions, simpleHealthCheck } from "./routes/simpleVehicles.js";
import { createDatabaseConnection, testDatabaseConnection } from "./db/connection.js";

export function createServer() {
  const app = express();

  // Initialize database connection
  try {
    createDatabaseConnection();
    console.log('🔌 Database connection pool initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
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

  // Vehicle API routes
  app.get("/api/vehicles", getVehicles);
  app.get("/api/vehicles/filters", getFilterOptions);
  app.get("/api/vehicles/:id", getVehicleById);

  // Example API routes (keep for backward compatibility)
  app.get("/api/demo", handleDemo);

  // Test database connection on startup
  testDatabaseConnection().catch(error => {
    console.error('⚠️  Database connection test failed during startup:', error);
  });

  return app;
}
