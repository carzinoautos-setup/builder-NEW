import { RequestHandler } from "express";
import { VehicleService } from "../services/vehicleService.js";
import { MockVehicleService } from "../services/mockVehicleService.js";
import { PaginationParams, VehicleFilters } from "../types/vehicle.js";
import { ALLOWED_BODY_STYLES_SET } from "../config/allowedBodyStyles.js";

// Decide whether to use the real VehicleService (MySQL), a WordPress proxy, or MockVehicleService
const useMock = process.env.USE_MOCK === "true";
const hasDbEnv = !!(
  process.env.DB_HOST &&
  process.env.DB_NAME &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD
);
const hasWpApi = !!process.env.WP_API_BASE;

if (useMock) {
  console.log("🚀 USE_MOCK is true — using MockVehicleService");
}

// Prefer WP_API proxy when configured
if (hasWpApi && !useMock) {
  console.log(
    "🔁 WP_API_BASE detected �� proxying /api/vehicles to WordPress plugin API at:",
    process.env.WP_API_BASE,
  );
} else if (hasDbEnv && !useMock) {
  console.log(
    "✅ DB env vars present — attempting to use VehicleService (MySQL)",
  );
} else if (!hasWpApi && !hasDbEnv && !useMock) {
  console.log(
    "⚠️ No data backend configured (no WP_API_BASE and no DB_*). Falling back to MockVehicleService",
  );
}

let vehicleService: any = null;
try {
  if (!useMock && hasWpApi) {
    // WP proxy mode — routes will forward requests to WP API directly
    vehicleService = null;
  } else if (!useMock && hasDbEnv) {
    vehicleService = new VehicleService();
    console.log("✅ Using VehicleService (MySQL) for real data");
  } else {
    vehicleService = new MockVehicleService();
  }
} catch (err) {
  console.error(
    "Failed to initialize VehicleService, falling back to MockVehicleService:",
    err,
  );
  vehicleService = new MockVehicleService();
}

/**
 * GET /api/vehicles
 * Fetch paginated vehicles with optional filters
 */
// Helper to build WP API URL (do NOT append credentials to query string)
function buildWpUrl(base: string, path: string, qs: string) {
  const cleanBase = base.replace(/\/$/, "");
  return `${cleanBase}/${path}${qs ? `?${qs}` : ""}`;
}

export const getVehicles: RequestHandler = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(
      parseInt(req.query.pageSize as string) || 20,
      100,
    ); // Max 100 per page
    const sortBy = (req.query.sortBy as string) || "id";
    const sortOrder = (req.query.sortOrder as "ASC" | "DESC") || "DESC";

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page number must be greater than 0",
      });
    }

    if (pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        success: false,
        message: "Page size must be between 1 and 100",
      });
    }

    const pagination: PaginationParams = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    // Parse filter parameters
    const filters: VehicleFilters = {};

    if (req.query.make) filters.make = req.query.make as string;
    if (req.query.model) filters.model = req.query.model as string;
    if (req.query.year) filters.year = parseInt(req.query.year as string);
    if (req.query.minPrice)
      filters.minPrice = parseFloat(req.query.minPrice as string);
    if (req.query.maxPrice)
      filters.maxPrice = parseFloat(req.query.maxPrice as string);
    if (req.query.condition) filters.condition = req.query.condition as string;
    if (req.query.maxMileage)
      filters.maxMileage = parseInt(req.query.maxMileage as string);
    if (req.query.fuelType) filters.fuelType = req.query.fuelType as string;
    if (req.query.transmission)
      filters.transmission = req.query.transmission as string;
    if (req.query.drivetrain)
      filters.drivetrain = req.query.drivetrain as string;
    if (req.query.bodyStyle) filters.bodyStyle = req.query.bodyStyle as string;
    if (req.query.certified !== undefined) {
      filters.certified = req.query.certified === "true";
    }
    if (req.query.sellerType)
      filters.sellerType = req.query.sellerType as string;
    if (req.query.payment_min)
      filters.paymentMin = Number(req.query.payment_min as string);
    if (req.query.payment_max)
      filters.paymentMax = Number(req.query.payment_max as string);
    if (req.query.down_payment)
      (filters as any).downPayment = Number(req.query.down_payment as string);

    // If WP API base is configured and not using mock, proxy the request directly to WordPress plugin API
    if (process.env.WP_API_BASE && process.env.USE_MOCK !== "true") {
      const wpBase = process.env.WP_API_BASE.replace(/\/$/, "");
      // Preserve original query string but if UI requested a 'sort', fetch a larger page so we can sort globally
      const rawQs = (req.originalUrl && req.originalUrl.split("?")[1]) || "";
      const incomingParams = new URLSearchParams(rawQs);
      const uiSort = String(incomingParams.get("sort") || "").trim();

      // If a UI sort is requested, request a large per_page so we can sort across many items and paginate server-side
      if (uiSort) {
        incomingParams.set("per_page", "1000");
        incomingParams.set("page", "1");
      }

      const url = `${wpBase}/vehicles${incomingParams.toString() ? `?${incomingParams.toString()}` : ""}`;

      // Build Authorization header using Basic auth if consumer key/secret are available
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (process.env.WP_CONSUMER_KEY && process.env.WP_CONSUMER_SECRET) {
        const creds = `${process.env.WP_CONSUMER_KEY}:${process.env.WP_CONSUMER_SECRET}`;
        const encoded = Buffer.from(creds).toString("base64");
        headers["Authorization"] = `Basic ${encoded}`;
      }

      let wpResponse;
      let body;
      try {
        wpResponse = await fetch(url, { method: "GET", headers });
        body = await wpResponse.text();
      } catch (fetchErr) {
        console.error(
          "[WP_PROXY_ERROR] Failed to fetch from WP API:",
          url,
          fetchErr,
        );
        return res.status(502).json({
          success: false,
          message: "Bad gateway: WordPress API unreachable",
        });
      }

      // Log proxied response for debugging (trim large output)
      try {
        console.log(
          "[WP_PROXY_REQUEST] url:",
          url,
          "hasAuth:",
          !!headers["Authorization"],
        );
        const trimmed =
          body && body.length > 5000
            ? body.substring(0, 5000) + "...(truncated)"
            : body;
        console.log(
          "[WP_PROXY_RESPONSE] /vehicles -> status:",
          wpResponse.status,
          "body:",
          trimmed,
        );
      } catch (e) {
        console.log("[WP_PROXY_RESPONSE] /vehicles -> (unable to log body)");
      }

      // Try to parse JSON, otherwise proxy raw
      try {
        const json = JSON.parse(body);

        // If UI sort was requested, we will sort and paginate server-side after fetching an expanded set
        const requestedSort = uiSort;

        // Remove vehicles explicitly marked as 'uncategorized' to avoid showing them in results/filters
        if (Array.isArray(json.data)) {
          const before = json.data.length;
          // Remove items whose body style is explicitly set to 'uncategorized', empty/null, or not in allowed list
          json.data = json.data.filter((item: any) => {
            try {
              const body =
                (item.acf &&
                  (item.acf.body_style ||
                    item.acf.bodyClass ||
                    item.acf.body_class)) ||
                item.body_style ||
                item.bodyClass ||
                item.body_class ||
                "";
              const trimmed = String(body).trim();
              if (!trimmed) return false; // exclude empty body types
              if (trimmed.toLowerCase() === "uncategorized") return false;
              // enforce allowed list using normalization
              const { normalizeBodyStyle } = await import(
                "../config/allowedBodyStyles.js"
              );
              const normalized = normalizeBodyStyle(trimmed);
              if (!normalized) return false;
              return true;
            } catch (e) {
              return false; // be conservative and exclude if unsure
            }
          });
          const removed = before - json.data.length;
          // Keep existing pagination if present
          const pagination = json.pagination || json.meta || {};
          if (pagination && typeof pagination.total === "number") {
            json.pagination = pagination;
            json.meta = pagination;
          }

          // If payment filters were present in the incoming params but WP did not filter correctly,
          // perform server-side filtering on the proxied data as a fallback.
          const qPaymentMin = incomingParams.get("payment_min");
          const qPaymentMax = incomingParams.get("payment_max");
          const qDownPayment = incomingParams.get("down_payment");
          if (
            (qPaymentMin && qPaymentMin.trim() !== "") ||
            (qPaymentMax && qPaymentMax.trim() !== "")
          ) {
            try {
              const minN = qPaymentMin ? Number(qPaymentMin) : null;
              const maxN = qPaymentMax ? Number(qPaymentMax) : null;
              const downN = qDownPayment ? Number(qDownPayment) : null;

              const beforeCount = (json.data || []).length;

              json.data = (json.data || []).filter((item: any) => {
                const acf = item.acf || {};

                // If vehicle provides precomputed ACF payment_min/payment_max, prefer those values for filtering
                // Parse vehicle ACF payment_min/payment_max more strictly (treat empty/non-numeric as missing)
                const rawVehPaymentMin = acf.payment_min ?? null;
                const rawVehPaymentMax = acf.payment_max ?? null;
                const vehiclePaymentMin =
                  rawVehPaymentMin !== null &&
                  rawVehPaymentMin !== undefined &&
                  String(rawVehPaymentMin).trim() !== "" &&
                  !Number.isNaN(Number(rawVehPaymentMin))
                    ? Number(rawVehPaymentMin)
                    : null;
                const vehiclePaymentMax =
                  rawVehPaymentMax !== null &&
                  rawVehPaymentMax !== undefined &&
                  String(rawVehPaymentMax).trim() !== "" &&
                  !Number.isNaN(Number(rawVehPaymentMax))
                    ? Number(rawVehPaymentMax)
                    : null;

                // If vehicle provides at least one of payment_min/payment_max, use those bounds when available
                if (vehiclePaymentMin !== null || vehiclePaymentMax !== null) {
                  if (minN !== null && !Number.isNaN(minN)) {
                    if (vehiclePaymentMax !== null) {
                      // ensure vehicle's max payment is >= filter min
                      if (vehiclePaymentMax < minN) return false;
                    } else if (vehiclePaymentMin !== null) {
                      if (vehiclePaymentMin < minN) return false;
                    }
                  }
                  if (maxN !== null && !Number.isNaN(maxN)) {
                    if (vehiclePaymentMin !== null) {
                      if (vehiclePaymentMin > maxN) return false;
                    } else if (vehiclePaymentMax !== null) {
                      if (vehiclePaymentMax > maxN) return false;
                    }
                  }
                  return true;
                }

                // Fallback: compute monthly payment from price/interest/term/down_payment
                const price = Number(acf.price ?? item.price ?? 0) || 0;
                const interest = Number(acf.interest_rate ?? 0) || 0;
                const term = Number(acf.loan_term ?? 60) || 60;
                const down =
                  downN !== null && !Number.isNaN(downN)
                    ? downN
                    : Number(acf.down_payment ?? 0) || 0;

                // guard against zero or invalid term
                const effectiveTerm = term && term > 0 ? term : 60;

                let monthly = 0;
                if (interest === 0) {
                  monthly = (price - down) / effectiveTerm;
                } else {
                  const monthlyRate = interest / 100 / 12;
                  const principal = price - down;
                  const denom = 1 - Math.pow(1 + monthlyRate, -effectiveTerm);
                  monthly =
                    denom === 0
                      ? principal / effectiveTerm
                      : (principal * monthlyRate) / denom;
                }

                if (minN !== null && !Number.isNaN(minN) && monthly < minN)
                  return false;
                if (maxN !== null && !Number.isNaN(maxN) && monthly > maxN)
                  return false;
                return true;
              });

              const afterCount = (json.data || []).length;
              try {
                // Attempt to compute IDs removed by the fallback filter for easier debugging
                const beforeIds = (Array.isArray(json.data) ? json.data : [])
                  .slice(0, beforeCount)
                  .map((it: any) => it && it.id)
                  .filter(Boolean);
                const afterIdsSet = new Set(
                  (json.data || [])
                    .map((it: any) => it && it.id)
                    .filter(Boolean),
                );
                const removedIds = beforeIds.filter(
                  (id: any) => !afterIdsSet.has(id),
                );
                console.log(
                  `[WP_PROXY_FILTER] Payment filter applied. before=${beforeCount} after=${afterCount} removedSampleCount=${Math.min(removedIds.length, 5)} removedSampleIds=${removedIds.slice(0, 5).join(",")} params={payment_min:${qPaymentMin},payment_max:${qPaymentMax},down_payment:${qDownPayment}}`,
                );
              } catch (e) {
                console.log(
                  `[WP_PROXY_FILTER] Payment filter applied. before=${beforeCount} after=${afterCount} params={payment_min:${qPaymentMin},payment_max:${qPaymentMax},down_payment:${qDownPayment}}`,
                );
              }
            } catch (filterErr) {
              console.warn(
                "Failed to apply fallback payment filtering on proxied WP response:",
                filterErr,
              );
            }
          }

          // Recompute filter lists from remaining data so filters match visible vehicles
          try {
            const computeCounts = (
              arr: any[],
              keyPath: string[],
            ): Map<string, number> => {
              const m = new Map();
              for (const item of arr) {
                let cur: any = item;
                for (const p of keyPath) {
                  if (!cur) break;
                  cur =
                    cur[p] ??
                    cur[p.replace(/_(.)/g, (s, c) => c.toUpperCase())];
                }
                const v =
                  cur ||
                  (item && item.acf && item.acf[keyPath[keyPath.length - 1]]) ||
                  "";
                const name =
                  typeof v === "string" || typeof v === "number"
                    ? String(v).trim()
                    : "";
                if (!name) continue;
                const lower = name.toLowerCase();
                if (lower === "uncategorized") continue;
                // Normalize to base allowed style using helper
                const { normalizeBodyStyle } = await import(
                  "../config/allowedBodyStyles.js"
                );
                const baseStyle = normalizeBodyStyle(lower);
                if (!baseStyle) continue;
                m.set(name, (m.get(name) || 0) + 1);
              }
              return m;
            };

            const makesMap = computeCounts(json.data, ["acf", "make"]);
            const modelsMap = computeCounts(json.data, ["acf", "model"]);
            const fuelMap = computeCounts(json.data, ["acf", "fuel_type"]);
            const bodyMap = computeCounts(json.data, ["acf", "body_style"]);
            const sellerTypeMap = computeCounts(json.data, [
              "acf",
              "account_type_seller",
            ]);
            const dealerMap = computeCounts(json.data, [
              "acf",
              "account_name_seller",
            ]);
            const statesMap = computeCounts(json.data, ["acf", "state_seller"]);
            const citiesMap = computeCounts(json.data, ["acf", "city_seller"]);

            const toArray = (m: Map<string, number>) =>
              Array.from(m.entries())
                .map(([name, count]) => ({ name, count }))
                .sort(
                  (a, b) => b.count - a.count || a.name.localeCompare(b.name),
                );

            json.filters = json.filters || {};
            // Prefer keys used by WP plugin; set multiple possible keys
            json.filters.makes = toArray(makesMap);
            json.filters.make = toArray(makesMap);
            json.filters.models = toArray(modelsMap);
            json.filters.model = toArray(modelsMap);
            json.filters.fuel_type = toArray(fuelMap);
            // Ensure body_style filter array only contains allowed values
            // Ensure body_style filter array only contains allowed values (after normalization)
            const { normalizeBodyStyle } = await import(
              "../config/allowedBodyStyles.js"
            );
            json.filters.body_style = toArray(bodyMap).filter((it) => {
              try {
                const n = normalizeBodyStyle(
                  String(it.name || "").toLowerCase(),
                );
                return Boolean(n);
              } catch (e) {
                return false;
              }
            });
            json.filters.account_type_seller = toArray(sellerTypeMap);
            json.filters.account_name_seller = toArray(dealerMap);
            json.filters.state_seller = toArray(statesMap);
            json.filters.city_seller = toArray(citiesMap);
          } catch (e) {
            console.warn("Failed to recompute filters from proxied data:", e);
          }
        }

        // Also filter out 'Uncategorized' from any remaining filter lists when present
        if (json.filters && typeof json.filters === "object") {
          for (const key of Object.keys(json.filters)) {
            const arr = (json.filters as any)[key];
            if (Array.isArray(arr)) {
              (json.filters as any)[key] = arr.filter((it: any) => {
                const name =
                  (it && (it.name || it.value || it.label || it)) || "";
                return (
                  String(name).trim().toLowerCase() !== "uncategorized" &&
                  String(name).trim() !== ""
                );
              });
            }
          }
        }

        // Apply UI-driven sorting server-side when proxying to WP: helps ensure sorting by custom fields works
        try {
          const uiSort = String(req.query.sort || "").trim();
          if (uiSort && Array.isArray(json.data) && json.data.length > 0) {
            const getNumeric = (item: any, candidates: string[]) => {
              for (const c of candidates) {
                const parts = c.split(".");
                let cur: any = item;
                for (const p of parts) {
                  if (!cur) break;
                  cur =
                    cur[p] ??
                    cur[p.replace(/_(.)/g, (s, ch) => ch.toUpperCase())];
                }
                if (cur !== undefined && cur !== null) {
                  const s = String(cur);
                  const n = parseFloat(s.replace(/[^0-9.-]+/g, ""));
                  if (!isNaN(n)) return n;
                }
              }
              return null;
            };

            const sortMap: Record<
              string,
              { keyCandidates: string[]; dir: number }
            > = {
              "price-low": {
                keyCandidates: [
                  "acf.price",
                  "price",
                  "sale_price",
                  "meta.price",
                ],
                dir: 1,
              },
              "price-high": {
                keyCandidates: [
                  "acf.price",
                  "price",
                  "sale_price",
                  "meta.price",
                ],
                dir: -1,
              },
              "miles-low": {
                keyCandidates: ["acf.mileage", "mileage", "meta.mileage"],
                dir: 1,
              },
              "miles-high": {
                keyCandidates: ["acf.mileage", "mileage", "meta.mileage"],
                dir: -1,
              },
              "mileage-low": {
                keyCandidates: ["acf.mileage", "mileage", "meta.mileage"],
                dir: 1,
              },
              "mileage-high": {
                keyCandidates: ["acf.mileage", "mileage", "meta.mileage"],
                dir: -1,
              },
              "year-newest": {
                keyCandidates: ["acf.year", "year", "meta.year"],
                dir: -1,
              },
              "year-oldest": {
                keyCandidates: ["acf.year", "year", "meta.year"],
                dir: 1,
              },
            };

            const mapping = sortMap[uiSort];
            if (mapping) {
              json.data.sort((a: any, b: any) => {
                const va = getNumeric(a, mapping.keyCandidates);
                const vb = getNumeric(b, mapping.keyCandidates);
                if (va === null && vb === null) return 0;
                if (va === null) return 1 * mapping.dir;
                if (vb === null) return -1 * mapping.dir;
                return (va - vb) * mapping.dir;
              });

              // After sorting a large set, paginate server-side according to original requested page & per_page
              try {
                const origPage = parseInt(String(req.query.page || "1")) || 1;
                const origPer =
                  parseInt(
                    String(req.query.per_page || req.query.pageSize || "20"),
                  ) || 20;
                // De-prioritize vehicles whose featured image contains certain IDs so they appear at the end of the inventory
                try {
                  const DEPRIORITIZE_IMAGE_IDS = [
                    "LV5x8RKpVwpp1bPX8k4SBfiOIYDC3Kxx",
                    "YdH6kOh8emmtaBz4fxpfj8luFKX6kS8A",
                  ];

                  const reorderDeprioritized = (arr: any[]) => {
                    const normal: any[] = [];
                    const deprio: any[] = [];
                    for (const item of arr) {
                      try {
                        const imgs = Array.isArray(item.images)
                          ? item.images
                          : [];
                        const featured =
                          item.featured_image ||
                          (item.acf && item.acf.featured_image) ||
                          item.featuredImage ||
                          "";

                        const hasDeprioritized =
                          imgs.some((img: any) =>
                            DEPRIORITIZE_IMAGE_IDS.some((id) =>
                              String(img).includes(id),
                            ),
                          ) ||
                          DEPRIORITIZE_IMAGE_IDS.some((id) =>
                            String(featured).includes(id),
                          );

                        if (hasDeprioritized) deprio.push(item);
                        else normal.push(item);
                      } catch (e) {
                        normal.push(item);
                      }
                    }
                    return [...normal, ...deprio];
                  };

                  if (Array.isArray(json.data) && json.data.length > 0) {
                    json.data = reorderDeprioritized(json.data);
                  }
                } catch (e) {
                  // ignore reorder errors
                }

                const total = json.data.length;
                const totalPages = Math.max(1, Math.ceil(total / origPer));
                const start = (origPage - 1) * origPer;
                const end = start + origPer;
                const sliced = json.data.slice(start, end);
                json.data = sliced;
                const pagination = {
                  total,
                  page: origPage,
                  per_page: origPer,
                  total_pages: totalPages,
                };
                json.pagination = pagination;
                json.meta = pagination;
              } catch (e) {
                // ignore pagination errors
              }
            }
          }
        } catch (err) {
          console.warn(
            "Failed to apply server-side sort on proxied data:",
            err,
          );
        }

        return res.status(wpResponse.status).json(json);
      } catch (e) {
        return res.status(wpResponse.status).send(body);
      }
    }

    // Otherwise use the configured service (MySQL or Mock)
    const result = await vehicleService.getVehicles(filters, pagination);

    // Server-side de-prioritization: move vehicles with specific featured image identifiers to the end
    try {
      const DEPRIORITIZE_IMAGE_IDS = [
        "LV5x8RKpVwpp1bPX8k4SBfiOIYDC3Kxx",
        "YdH6kOh8emmtaBz4fxpfj8luFKX6kS8A",
      ];

      const reorderDeprioritized = (arr: any[]) => {
        const normal: any[] = [];
        const deprio: any[] = [];
        for (const item of arr) {
          try {
            const imgs = Array.isArray(item.images) ? item.images : [];
            const featured =
              item.featured_image ||
              (item.acf && item.acf.featured_image) ||
              item.featuredImage ||
              "";
            const hasDeprioritized =
              imgs.some((img: any) =>
                DEPRIORITIZE_IMAGE_IDS.some((id) => String(img).includes(id)),
              ) ||
              DEPRIORITIZE_IMAGE_IDS.some((id) =>
                String(featured).includes(id),
              );

            if (hasDeprioritized) deprio.push(item);
            else normal.push(item);
          } catch (e) {
            normal.push(item);
          }
        }
        return [...normal, ...deprio];
      };

      if (result && Array.isArray(result.data)) {
        // First remove items explicitly marked as 'uncategorized' or with empty body types
        try {
          result.data = result.data.filter((item: any) => {
            try {
              const body =
                (item.acf &&
                  (item.acf.body_style ||
                    item.acf.bodyClass ||
                    item.acf.body_class)) ||
                item.body_style ||
                item.bodyClass ||
                item.body_class ||
                "";
              const trimmed = String(body).trim();
              if (!trimmed) return false; // exclude empty body types
              return trimmed.toLowerCase() !== "uncategorized";
            } catch (e) {
              return false;
            }
          });
        } catch (e) {
          /* ignore */
        }

        // Then reorder deprioritized images
        result.data = reorderDeprioritized(result.data);
      }
    } catch (e) {
      // ignore
    }

    // Debug: log IDs returned and pagination to help trace disappearing items
    try {
      const ids = Array.isArray(result.data)
        ? result.data
            .map((v: any) =>
              v && (v.id || v.ID || v.post_id)
                ? v.id || v.ID || v.post_id
                : null,
            )
            .filter(Boolean)
        : [];
      console.log(
        `[SERVER] /api/vehicles -> returned ${ids.length} items page=${page} pageSize=${pageSize} ids_sample=${ids.slice(0, 10).join(",")}`,
      );
    } catch (e) {
      console.log(
        "[SERVER] /api/vehicles -> unable to log ids",
        e && e.message ? e.message : e,
      );
    }

    // Return response
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getVehicles route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: [],
      meta: {
        totalRecords: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  }
};

/**
 * GET /api/vehicles/:id
 * Fetch a single vehicle by ID
 */
export const getVehicleById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID",
      });
    }

    const vehicle = await vehicleService.getVehicleById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Error in getVehicleById route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * GET /api/vehicles/filters
 * Get available filter options
 */
export const getFilterOptions: RequestHandler = async (req, res) => {
  try {
    // If WP API base configured and not using mock, proxy filter request
    if (process.env.WP_API_BASE && process.env.USE_MOCK !== "true") {
      const wpBase = process.env.WP_API_BASE.replace(/\/$/, "");
      const rawQs = (req.originalUrl && req.originalUrl.split("?")[1]) || "";
      const url = `${wpBase}/filters${rawQs ? `?${rawQs}` : ""}`;
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (process.env.WP_CONSUMER_KEY && process.env.WP_CONSUMER_SECRET) {
        const creds = `${process.env.WP_CONSUMER_KEY}:${process.env.WP_CONSUMER_SECRET}`;
        const encoded = Buffer.from(creds).toString("base64");
        headers["Authorization"] = `Basic ${encoded}`;
      }
      const wpResponse = await fetch(url, { method: "GET", headers });
      const body = await wpResponse.text();
      // Log proxied response for debugging conditional filters (trim large output)
      try {
        console.log(
          "[WP_PROXY_REQUEST] url:",
          url,
          "hasAuth:",
          !!headers["Authorization"],
        );
        const trimmed =
          body && body.length > 5000
            ? body.substring(0, 5000) + "...(truncated)"
            : body;
        console.log(
          "[WP_PROXY_RESPONSE] /filters -> status:",
          wpResponse.status,
          "body:",
          trimmed,
        );
      } catch (e) {
        console.log("[WP_PROXY_RESPONSE] /filters -> (unable to log body)");
      }
      try {
        const json = JSON.parse(body);

        // If data array present, recompute filters from data to ensure consistency
        if (Array.isArray(json.data)) {
          try {
            const computeCounts = (
              arr: any[],
              keyPath: string[],
            ): Map<string, number> => {
              const m = new Map();
              for (const item of arr) {
                let cur: any = item;
                for (const p of keyPath) {
                  if (!cur) break;
                  cur =
                    cur[p] ??
                    cur[p.replace(/_(.)/g, (s, c) => c.toUpperCase())];
                }
                const v =
                  cur ||
                  (item && item.acf && item.acf[keyPath[keyPath.length - 1]]) ||
                  "";
                const name =
                  typeof v === "string" || typeof v === "number"
                    ? String(v).trim()
                    : "";
                if (!name) continue;
                const lower = name.toLowerCase();
                if (lower === "uncategorized") continue;
                // Normalize to base allowed style using helper
                const { normalizeBodyStyle } = await import(
                  "../config/allowedBodyStyles.js"
                );
                const baseStyle = normalizeBodyStyle(lower);
                if (!baseStyle) continue;
                m.set(name, (m.get(name) || 0) + 1);
              }
              return m;
            };

            const makesMap = computeCounts(json.data, ["acf", "make"]);
            const modelsMap = computeCounts(json.data, ["acf", "model"]);
            const fuelMap = computeCounts(json.data, ["acf", "fuel_type"]);
            const bodyMap = computeCounts(json.data, ["acf", "body_style"]);
            const sellerTypeMap = computeCounts(json.data, [
              "acf",
              "account_type_seller",
            ]);
            const dealerMap = computeCounts(json.data, [
              "acf",
              "account_name_seller",
            ]);

            const toArray = (m: Map<string, number>) =>
              Array.from(m.entries())
                .map(([name, count]) => ({ name, count }))
                .sort(
                  (a, b) => b.count - a.count || a.name.localeCompare(b.name),
                );

            json.filters = json.filters || {};
            json.filters.makes = toArray(makesMap);
            json.filters.make = toArray(makesMap);
            json.filters.models = toArray(modelsMap);
            json.filters.model = toArray(modelsMap);
            json.filters.fuel_type = toArray(fuelMap);
            json.filters.body_style = toArray(bodyMap);
            json.filters.account_type_seller = toArray(sellerTypeMap);
            json.filters.account_name_seller = toArray(dealerMap);

            // Remove known non-car manufacturers if present (blacklist)
            try {
              const blacklist = new Set([
                "harley-davidson",
                "harley davidson",
                "harley",
                "forest river",
                "fleetwood",
              ]);
              const filterKey = (arr: any[]) =>
                arr.filter((it: any) => {
                  const name =
                    (it && (it.name || it.value || it.label || it)) || "";
                  return !blacklist.has(String(name).toLowerCase());
                });
              json.filters.makes = filterKey(json.filters.makes || []);
              json.filters.make = filterKey(json.filters.make || []);
            } catch (e) {
              // ignore
            }
          } catch (e) {
            console.warn("Failed to recompute /filters from proxied data:", e);
          }
        }

        // Remove 'Uncategorized' entries from returned filter lists
        if (json && json.filters && typeof json.filters === "object") {
          for (const key of Object.keys(json.filters)) {
            const arr = json.filters[key];
            if (Array.isArray(arr)) {
              json.filters[key] = arr.filter((it: any) => {
                const name =
                  (it && (it.name || it.value || it.label || it)) || "";
                return (
                  String(name).trim().toLowerCase() !== "uncategorized" &&
                  String(name).trim() !== ""
                );
              });
            }
          }
        }

        return res.status(wpResponse.status).json(json);
      } catch (e) {
        return res.status(wpResponse.status).send(body);
      }
    }

    const options = await vehicleService.getFilterOptions();

    // Debug: log sizes of filter option arrays to help trace missing filters
    try {
      const counts: Record<string, number> = {};
      if (options && typeof options === "object") {
        for (const k of Object.keys(options)) {
          const v = (options as any)[k];
          counts[k] = Array.isArray(v) ? v.length : 0;
        }
      }
      console.log(
        `[SERVER] /api/vehicles/filters -> option counts: ${JSON.stringify(counts)}`,
      );
    } catch (e) {
      console.log(
        "[SERVER] /api/vehicles/filters -> unable to log option counts",
        e && e.message ? e.message : e,
      );
    }

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("Error in getFilterOptions route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: {
        makes: [],
        models: [],
        conditions: [],
        fuelTypes: [],
        transmissions: [],
        drivetrains: [],
        bodyStyles: [],
        sellerTypes: [],
      },
    });
  }
};

/**
 * GET /api/vehicles/health
 * Service health check endpoint
 */
export const healthCheck: RequestHandler = async (req, res) => {
  try {
    // Test service connectivity
    const testResult = await vehicleService.getVehicles(
      {},
      { page: 1, pageSize: 1 },
    );

    res.status(200).json({
      success: true,
      message:
        "Mock service healthy - 50,000 sample vehicles ready for testing",
      timestamp: new Date().toISOString(),
      serviceConnected: testResult.success,
      usingMockData: true,
      totalRecords: testResult.meta?.totalRecords || 0,
      note: "Switch to VehicleService in routes/vehicles.ts when ready for real MySQL",
    });
  } catch (error) {
    console.error("Service health check failed:", error);
    res.status(500).json({
      success: false,
      message: "Mock service connection failed",
      timestamp: new Date().toISOString(),
      serviceConnected: false,
      usingMockData: true,
    });
  }
};
