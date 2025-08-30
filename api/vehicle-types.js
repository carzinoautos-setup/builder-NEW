/**
 * Vercel Serverless Function for Vehicle Types API
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const vehicleTypes = [
      { name: "Sedan", count: 16980 },
      { name: "SUV / Crossover", count: 13405 },
      { name: "Truck", count: 8217 },
      { name: "Coupe", count: 4190 },
      { name: "Convertible", count: 1250 },
      { name: "Hatchback", count: 3420 },
      { name: "Van / Minivan", count: 2980 },
      { name: "Wagon", count: 1560 },
    ];

    res.status(200).json({
      success: true,
      data: vehicleTypes,
    });
  } catch (error) {
    console.error("Vehicle Types API Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
}
