import { RequestHandler } from "express";
import { executeQuery } from "../db/connection.js";

// Simple in-memory cache for seller lookups to reduce DB pressure in preview mode
const SELLER_CACHE_TTL_MS = Number(
  process.env.SELLER_CACHE_TTL_MS || 60 * 1000,
); // default 60s
const sellerCache: Map<string, { data: any; ts: number }> = new Map();

export const getSellerByAccount: RequestHandler = async (req, res) => {
  const account = req.params.account;
  if (!account)
    return res.status(400).json({ success: false, message: "Missing account" });
  try {
    // Check cache first
    const cached = sellerCache.get(account);
    if (cached && Date.now() - cached.ts < SELLER_CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data });
    }

    const [rows] = (await executeQuery(
      `SELECT account_number as accountNumber, name, type as accountType, phone, email, city, state, zip, latitude, longitude FROM sellers WHERE account_number = ? LIMIT 1`,
      [account],
    )) as any;
    const result: any = (rows as any[])[0] || null;
    if (!result)
      return res.status(404).json({ success: false, message: "Not found" });

    // Update cache
    try {
      sellerCache.set(account, { data: result, ts: Date.now() });
    } catch (e) {
      // ignore cache errors
    }

    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error(
      "/api/sellers/:account error",
      err && err.message ? err.message : err,
    );
    // For transient DB connectivity issues, return an empty success response instead of 5xx
    // so the frontend can render without blowing up (batch lookups can be empty).
    if (
      err &&
      (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET")
    ) {
      return res.json({
        success: true,
        data: null,
        message: "Database connection lost - returning empty seller",
      });
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
      return res
        .status(400)
        .json({ success: false, message: "Missing accounts array" });

    // Normalize and dedupe
    const cleaned = Array.from(
      new Set(accounts.map((a) => String(a).trim()).filter(Boolean)),
    );
    if (cleaned.length === 0) return res.json({ success: true, data: {} });

    // Build placeholders
    // For batch, first satisfy from cache where possible
    const map: Record<string, any> = {};
    const toQuery: string[] = [];
    for (const acct of cleaned) {
      const cached = sellerCache.get(acct);
      if (cached && Date.now() - cached.ts < SELLER_CACHE_TTL_MS) {
        map[acct] = cached.data;
      } else {
        toQuery.push(acct);
      }
    }

    if (toQuery.length > 0) {
      const placeholders = toQuery.map(() => "?").join(",");
      const sql = `SELECT account_number as accountNumber, name, type as accountType, phone, email, city, state, zip, latitude, longitude FROM sellers WHERE account_number IN (${placeholders})`;
      const [rows] = (await executeQuery(sql, toQuery)) as any;
      for (const r of rows as any[]) {
        if (r && r.accountNumber) {
          map[String(r.accountNumber)] = r;
          try {
            sellerCache.set(String(r.accountNumber), {
              data: r,
              ts: Date.now(),
            });
          } catch (e) {
            /* ignore */
          }
        }
      }
    }

    return res.json({ success: true, data: map });
  } catch (err: any) {
    console.error(
      "/api/sellers/batch error",
      err && err.message ? err.message : err,
    );
    // For transient DB connectivity issues, return an empty map so frontend can continue
    if (
      err &&
      (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET")
    ) {
      return res.json({
        success: true,
        data: {},
        message: "Database connection lost - returning empty sellers map",
      });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
