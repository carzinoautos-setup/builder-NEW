import mysql from "mysql2/promise";

// Database configuration interface
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
}

// Create connection pool for better performance
let pool: mysql.Pool | null = null;

export function createDatabaseConnection(): mysql.Pool {
  if (pool) {
    return pool;
  }

  const config: any = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "wordpress",
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
    queueLimit: 0,
    acquireTimeout: 60000,
    connectTimeout: 10000,
  } as DatabaseConfig & Record<string, any>;

  try {
    pool = mysql.createPool(config);
    console.log("✅ Database connection pool created successfully");

    return pool;
  } catch (error) {
    console.error("❌ Failed to create database connection pool:", error);
    throw error;
  }
}

// Get database connection
export function getDatabase(): mysql.Pool {
  if (!pool) {
    return createDatabaseConnection();
  }
  return pool;
}

/**
 * Execute a query with a single retry on recoverable connection errors.
 * This helps handle transient PROTOCOL_CONNECTION_LOST errors from the MySQL server
 * by recreating the pool and retrying once.
 */
export async function executeQuery(sql: string, params: any[] = []) {
  try {
    const db = getDatabase();
    return await db.execute(sql, params);
  } catch (err: any) {
    // If connection lost, recreate pool and retry once
    const transientCodes = ["PROTOCOL_CONNECTION_LOST", "ECONNRESET", "ETIMEDOUT"];
    const code = err && (err.code || err.errno || "");
    if (transientCodes.includes(String(code))) {
      console.warn(
        "Database transient error detected (attempting to recreate pool and retry):",
        code,
      );
      try {
        // Close existing pool if present
        if (pool) {
          try {
            await pool.end();
          } catch (e) {
            /* ignore */
          }
          pool = null;
        }
      } catch (e) {
        /* ignore */
      }

      // Recreate pool and retry once
      try {
        const newDb = createDatabaseConnection();
        return await newDb.execute(sql, params);
      } catch (retryErr) {
        console.error("Database retry failed:", retryErr);
        throw retryErr;
      }
    }

    // Non-transient error - rethrow
    throw err;
  }
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const db = getDatabase();
    const [rows] = await db.execute("SELECT 1 as test");
    console.log("✅ Database connection test successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    return false;
  }
}

// Close database connection (for cleanup)
export async function closeDatabaseConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✅ Database connection pool closed");
  }
}
