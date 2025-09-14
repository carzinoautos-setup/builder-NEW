import { RequestHandler } from "express";
import { executeQuery } from "../db/connection.js";

export const getSellerByAccount: RequestHandler = async (req, res) => {
  const account = req.params.account;
  if (!account)
    return res.status(400).json({ success: false, message: "Missing account" });
  try {
    const [rows] = (await executeQuery(
      `SELECT account_number as accountNumber, name, type as accountType, phone, email, city, state, zip, latitude, longitude FROM sellers WHERE account_number = ? LIMIT 1`,
      [account],
    )) as any;
    const result: any = (rows as any[])[0] || null;
    if (!result)
      return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error("/api/sellers/:account error", err && err.message ? err.message : err);
    // Return 503 for transient DB connectivity issues so frontend can retry gracefully
    if (err && (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET")) {
      return res.status(503).json({ success: false, message: "Database connection lost" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getSellersBatch: RequestHandler = async (req, res) => {
  try {
    const accounts: string[] = Array.isArray(req.body?.accounts)
      ? (req.body.accounts as string[])
      : [];
    if (!accounts || accounts.length === 0)
      return res.status(400).json({ success: false, message: "Missing accounts array" });

    // Normalize and dedupe
    const cleaned = Array.from(new Set(accounts.map((a) => String(a).trim()).filter(Boolean)));
    if (cleaned.length === 0)
      return res.json({ success: true, data: {} });

    // Build placeholders
    const placeholders = cleaned.map(() => "?").join(",");
    const sql = `SELECT account_number as accountNumber, name, type as accountType, phone, email, city, state, zip, latitude, longitude FROM sellers WHERE account_number IN (${placeholders})`;
    const [rows] = (await executeQuery(sql, cleaned)) as any;

    const map: Record<string, any> = {};
    for (const r of (rows as any[])) {
      if (r && r.accountNumber) map[String(r.accountNumber)] = r;
    }

    return res.json({ success: true, data: map });
  } catch (err: any) {
    console.error("/api/sellers/batch error", err && err.message ? err.message : err);
    if (err && (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET")) {
      return res.status(503).json({ success: false, message: "Database connection lost" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
