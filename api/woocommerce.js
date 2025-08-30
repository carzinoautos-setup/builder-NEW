// WooCommerce API endpoint for Vercel
import fetch from "node-fetch";

const WP_URL = "https://env-uploadbackup62225-czdev.kinsta.cloud";
const WC_KEY = "ck_bee05b9748c64d0e6415b8e0ce178507549c02ee";
const WC_SECRET = "cs_3808706bcbd0fd1f07f3751db65970edb8047226";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
    console.log("Fetching WooCommerce products...");

    // Build WooCommerce API URL with authentication
    const auth = Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
    const apiUrl = `${WP_URL}/wp-json/wc/v3/products?per_page=50&status=publish`;

    console.log("Making request to:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "User-Agent": "Carzino/1.0",
      },
      timeout: 30000,
    });

    console.log("WooCommerce response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WooCommerce API error:", errorText);
      throw new Error(
        `WooCommerce API returned ${response.status}: ${errorText}`,
      );
    }

    const products = await response.json();
    console.log("Successfully fetched", products.length, "products");

    // Transform WooCommerce products to vehicle format
    const vehicles = products.map((product) => {
      // Extract meta fields (these would be your ACF fields)
      const meta = product.meta_data || [];
      const getMeta = (key) => {
        const item = meta.find((m) => m.key === key);
        return item ? item.value : "";
      };

      return {
        id: product.id,
        title: product.name,
        price: parseFloat(product.price) || 0,
        make: getMeta("vehicle_make") || "Unknown",
        model: getMeta("vehicle_model") || "Unknown",
        year: parseInt(getMeta("vehicle_year")) || new Date().getFullYear(),
        mileage: getMeta("vehicle_mileage") || "0",
        transmission: getMeta("vehicle_transmission") || "Automatic",
        doors: getMeta("vehicle_doors") || "4",
        condition: getMeta("vehicle_condition") || "Used",
        dealer: getMeta("dealer_name") || "Carzino Autos",
        location: getMeta("dealer_location") || "Seattle, WA",
        images: product.images?.map((img) => img.src) || ["/placeholder.svg"],
        engine: getMeta("vehicle_engine"),
        fuel_type: getMeta("vehicle_fuel_type"),
        drivetrain: getMeta("vehicle_drivetrain"),
        exterior_color: getMeta("vehicle_exterior_color"),
        interior_color: getMeta("vehicle_interior_color"),
        vin: getMeta("vehicle_vin"),
        features: getMeta("vehicle_features")?.split(",") || [],
      };
    });

    res.status(200).json({
      success: true,
      data: vehicles,
      meta: {
        total: vehicles.length,
        page: 1,
        per_page: vehicles.length,
        total_pages: 1,
      },
    });
  } catch (error) {
    console.error("WooCommerce API Error:", error);

    // Return mock data as fallback so the site still works
    const mockVehicles = [
      {
        id: 1,
        title: "2023 Toyota Camry LE",
        price: 28500,
        make: "Toyota",
        model: "Camry",
        year: 2023,
        mileage: "15,000",
        transmission: "Automatic",
        doors: "4",
        condition: "Used",
        dealer: "Carzino Autos",
        location: "Seattle, WA",
        images: ["/placeholder.svg"],
      },
      {
        id: 2,
        title: "2022 Honda Civic LX",
        price: 24900,
        make: "Honda",
        model: "Civic",
        year: 2022,
        mileage: "22,000",
        transmission: "CVT",
        doors: "4",
        condition: "Used",
        dealer: "Carzino Autos",
        location: "Seattle, WA",
        images: ["/placeholder.svg"],
      },
    ];

    res.status(200).json({
      success: true,
      data: mockVehicles,
      meta: {
        total: mockVehicles.length,
        page: 1,
        per_page: mockVehicles.length,
        total_pages: 1,
        note: "Using fallback data - WooCommerce connection failed",
      },
    });
  }
}
