import { RequestHandler } from "express";
import { getDatabase } from "../db/connection.js";

export const getSellerByAccount: RequestHandler = async (req, res) => {
  const account = req.params.account;
  if (!account) return res.status(400).json({ success: false, message: "Missing account" });
  try {
    const db = getDatabase();
    const [rows] = await db.execute(
      `SELECT account_number as accountNumber, name, type as accountType, phone, email, city, state, zip, latitude, longitude FROM sellers WHERE account_number = ? LIMIT 1`,
      [account],
    );
    const result: any = (rows as any[])[0] || null;
    if (!result) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("/api/sellers/:account error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
