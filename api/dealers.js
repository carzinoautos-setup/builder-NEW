// Vercel serverless function for dealers
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
    // Mock dealers data
    const dealers = [
      {
        id: 1,
        name: "Premier Auto Group",
        location: "Seattle, WA",
        vehicleCount: 120,
      },
      {
        id: 2,
        name: "Pacific Motors",
        location: "Portland, OR",
        vehicleCount: 95,
      },
      {
        id: 3,
        name: "Northwest Auto Sales",
        location: "Vancouver, WA",
        vehicleCount: 78,
      },
      {
        id: 4,
        name: "Cascade Automotive",
        location: "Tacoma, WA",
        vehicleCount: 156,
      },
      {
        id: 5,
        name: "Columbia River Auto",
        location: "Spokane, WA",
        vehicleCount: 89,
      },
    ];

    res.status(200).json({
      success: true,
      data: dealers,
    });
  } catch (error) {
    console.error("Error in dealers API:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
}
