import { useCallback, useEffect, useState } from "react";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

export type AppliedFilters = {
  condition: string[];
  make: string[];
  model: string[];
  trim: string[];
  year: string[];
  bodyStyle: string[];
  vehicleType?: string[];
  driveType: string[];
  transmission: string[];
  mileage: string | undefined;
  exteriorColor: string[];
  interiorColor: string[];
  sellerType: string[];
  dealer: string[];
  state?: string[];
  city?: string[];
  priceMin: string;
  priceMax: string;
  paymentMin: string;
  paymentMax: string;
  fuelType: string[];
  certified: string[];
  // Newly supported filters
  doors?: string[];
  transmissionSpeed?: string[];
  highwayMpg?: string[];
  titleStatus?: string[];
  status?: string[];
};

type FilterMap = Record<string, { name: string; count: number }[]>;

function getApiBaseUrl() {
  const wpUrl =
    import.meta.env.VITE_WP_URL ||
    "https://env-uploadbackup62225-czdev.kinsta.cloud";
  return wpUrl.replace(/\/$/, "");
}

export function buildFiltersQuery(paramsObj: Partial<AppliedFilters>) {
  const params = new URLSearchParams();

  const mapping: [keyof AppliedFilters, string][] = [
    ["make", "make"],
    ["model", "model"],
    ["trim", "trim"],
    ["year", "year"],
    ["bodyStyle", "body_style"],
    ["driveType", "drivetrain"],
    ["transmission", "transmission"],
    ["exteriorColor", "exterior_color"],
    ["interiorColor", "interior_color"],
    ["dealer", "account_name_seller"],
    ["sellerType", "account_type_seller"],
    ["fuelType", "fuel_type"],
    ["certified", "certified"],
    // New mappings
    ["doors", "doors"],
    ["transmissionSpeed", "transmission_speed"],
    ["highwayMpg", "highway_mpg"],
    ["titleStatus", "title_status"],
    ["status", "status"],
    // Location mappings
    ["state", "state_seller"],
    ["city", "city_seller"],
  ];

  for (const [localKey, apiKey] of mapping) {
    const val = (paramsObj as any)[localKey];
    if (!val) continue;
    if (Array.isArray(val) && val.length > 0)
      params.append(apiKey, val.join(","));
    else if (typeof val === "string" && val !== "") params.append(apiKey, val);
  }

  if ((paramsObj as any).priceMin)
    params.append("min_price", (paramsObj as any).priceMin);
  if ((paramsObj as any).priceMax)
    params.append("max_price", (paramsObj as any).priceMax);

  return params.toString();
}

export default function useFilters(appliedFilters: Partial<AppliedFilters>) {
  const [filterOptions, setFilterOptions] = useState<FilterMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = useCallback(
    async (filters = appliedFilters) => {
      try {
        setLoading(true);
        setError(null);

        const mapItem = (it: any) => {
          if (it == null) return null;
          if (typeof it === "string" || typeof it === "number")
            return { name: String(it), count: 0 };
          if (typeof it === "object")
            return {
              name: String(it.name ?? it.value ?? it.label ?? it),
              count: typeof it.count === "number" ? it.count : 0,
            };
          return null;
        };

        const pickArrayFromFilters = (f: any, ...keys: string[]) => {
          for (const k of keys) {
            const v = f[k];
            if (Array.isArray(v)) return v;
          }
          return undefined;
        };

        // Fetch unscoped (global) filter options to ensure Make list remains complete
        const unscopedFilters: any = { ...(filters || {}) };
        delete unscopedFilters.make;
        delete unscopedFilters.model;
        delete unscopedFilters.trim;
        const unscopedQs = buildFiltersQuery(unscopedFilters || {});
        const unscopedUrl = `/api/vehicles/filters${unscopedQs ? `?${unscopedQs}` : ""}`;
        console.log("🔍 Fetching unscoped filter options:", unscopedUrl);
        const unscopedRes = await fetchWithRetry(unscopedUrl, { method: "GET" }, 1, 8000);
        if (!unscopedRes.ok) throw new Error(`Filters error ${unscopedRes.status}`);
        const unscopedJson = await unscopedRes.json();

        // Parse helper to convert WP plugin json.filters or json.data into a FilterMap
        const parseJsonToMap = (json: any): FilterMap => {
          const normalized: FilterMap = {};

          if (json && json.success && json.filters) {
            const f = json.filters as Record<string, any>;

            const makes = pickArrayFromFilters(f, "makes", "make");
            if (makes)
              normalized.make = makes.map(mapItem).filter(Boolean) as any;

            const models = pickArrayFromFilters(f, "models", "model");
            if (models)
              normalized.model = models.map(mapItem).filter(Boolean) as any;

            const trims = pickArrayFromFilters(f, "trims", "trim");
            if (trims)
              normalized.trim = trims.map(mapItem).filter(Boolean) as any;

            const years = pickArrayFromFilters(f, "years", "year");
            if (years)
              normalized.year = years.map(mapItem).filter(Boolean) as any;

            const bodyStyles = pickArrayFromFilters(
              f,
              "body_style",
              "body_styles",
              "bodyStyles",
            );
            if (bodyStyles)
              normalized.body_style = bodyStyles
                .map(mapItem)
                .filter(Boolean) as any;

            const drivetrains = pickArrayFromFilters(
              f,
              "drivetrain",
              "drivetrains",
            );
            if (drivetrains)
              normalized.drivetrain = drivetrains
                .map(mapItem)
                .filter(Boolean) as any;

            const fuels = pickArrayFromFilters(
              f,
              "fuel_type",
              "fuelTypes",
              "fuel_types",
            );
            if (fuels)
              normalized.fuel_type = fuels.map(mapItem).filter(Boolean) as any;

            const transmissions = pickArrayFromFilters(
              f,
              "transmission",
              "transmissions",
            );
            if (transmissions)
              normalized.transmission = transmissions
                .map(mapItem)
                .filter(Boolean) as any;

            // Transmission speed (e.g., 4,6,8)
            const transSpeeds = pickArrayFromFilters(
              f,
              "transmission_speed",
              "transmissionSpeeds",
              "transmission_speed"
            );
            if (transSpeeds)
              normalized.transmission_speed = transSpeeds
                .map(mapItem)
                .filter(Boolean) as any;

            // Doors
            const doors = pickArrayFromFilters(f, "doors");
            if (doors)
              normalized.doors = doors.map(mapItem).filter(Boolean) as any;

            // Highway MPG
            const highway = pickArrayFromFilters(f, "highway_mpg", "highwayMpg");
            if (highway)
              normalized.highway_mpg = highway.map(mapItem).filter(Boolean) as any;

            // Title status
            const titles = pickArrayFromFilters(f, "title_status", "titleStatus");
            if (titles) normalized.title_status = titles.map(mapItem).filter(Boolean) as any;

            // Generic status
            const statuses = pickArrayFromFilters(f, "status");
            if (statuses) normalized.status = statuses.map(mapItem).filter(Boolean) as any;

            const exterior = pickArrayFromFilters(
              f,
              "exterior_color",
              "exterior_colors",
              "exteriorColor",
            );
            if (exterior)
              normalized.exterior_color = exterior
                .map(mapItem)
                .filter(Boolean) as any;

            const interior = pickArrayFromFilters(
              f,
              "interior_color",
              "interior_colors",
              "interiorColor",
            );
            if (interior)
              normalized.interior_color = interior
                .map(mapItem)
                .filter(Boolean) as any;

            const accountNames = pickArrayFromFilters(
              f,
              "account_name_seller",
              "dealer",
              "account_names_seller",
            );
            if (accountNames)
              normalized.account_name_seller = accountNames
                .map(mapItem)
                .filter(Boolean) as any;

            const accountTypes = pickArrayFromFilters(
              f,
              "account_type_seller",
              "seller_types",
              "account_types_seller",
              "sellerType",
            );
            if (accountTypes)
              normalized.account_type_seller = accountTypes
                .map(mapItem)
                .filter(Boolean) as any;

            const conditions = pickArrayFromFilters(
              f,
              "condition",
              "conditions",
            );
            if (conditions)
              normalized.condition = conditions
                .map(mapItem)
                .filter(Boolean) as any;

            const certified = pickArrayFromFilters(
              f,
              "certified",
              "is_certified",
            );
            if (certified)
              normalized.certified = certified
                .map(mapItem)
                .filter(Boolean) as any;

            const cities = pickArrayFromFilters(
              f,
              "city_seller",
              "cities",
              "city",
            );
            if (cities)
              normalized.city_seller = cities
                .map(mapItem)
                .filter(Boolean) as any;

            const states = pickArrayFromFilters(
              f,
              "state_seller",
              "states",
              "state",
            );
            if (states)
              normalized.state_seller = states
                .map(mapItem)
                .filter(Boolean) as any;

            return normalized;
          }

          if (json && json.success && json.data) {
            const map: FilterMap = {};
            if (Array.isArray(json.data.makes))
              map.make = json.data.makes.map((n: string) => ({
                name: n,
                count: 0,
              }));
            if (Array.isArray(json.data.models))
              map.model = json.data.models.map((n: string) => ({
                name: n,
                count: 0,
              }));
            if (Array.isArray(json.data.trims))
              map.trim = json.data.trims.map((n: string) => ({
                name: n,
                count: 0,
              }));
            if (Array.isArray(json.data.years))
              map.year = json.data.years.map((n: string) => ({
                name: String(n),
                count: 0,
              }));
            if (Array.isArray(json.data.conditions))
              map.condition = json.data.conditions.map((n: string) => ({
                name: n,
                count: 0,
              }));
            if (Array.isArray(json.data.fuelTypes))
              map.fuel_type = json.data.fuelTypes.map((n: string) => ({
                name: n,
                count: 0,
              }));
            if (Array.isArray(json.data.transmissions))
              map.transmission = json.data.transmissions.map((n: string) => ({
                name: n,
                count: 0,
              }));
            if (Array.isArray(json.data.drivetrains))
              map.drivetrain = json.data.drivetrains.map((n: string) => ({
                name: n,
                count: 0,
              }));
            if (Array.isArray(json.data.bodyStyles))
              map.body_style = json.data.bodyStyles.map((n: string) => ({
                name: n,
                count: 0,
              }));
            if (Array.isArray(json.data.sellerTypes))
              map.account_type_seller = json.data.sellerTypes.map(
                (n: string) => ({ name: n, count: 0 }),
              );
            return map;
          }

          return {};
        };

        const unscopedMap = parseJsonToMap(unscopedJson);

        // If we have selected makes, fetch scoped filters (models/trims) for those makes
        let scopedMap: FilterMap = {};
        if (
          filters &&
          Array.isArray((filters as any).make) &&
          (filters as any).make.length > 0
        ) {
          const scopedQs = buildFiltersQuery({ make: (filters as any).make });
          const scopedUrl = `/api/vehicles/filters${scopedQs ? `?${scopedQs}` : ""}`;
          console.log("🔍 Fetching scoped filter options for selected makes:", scopedUrl);
          const scopedRes = await fetchWithRetry(scopedUrl, { method: "GET" }, 1, 8000);
          if (!scopedRes.ok) throw new Error(`Filters error ${scopedRes.status}`);
          const scopedJson = await scopedRes.json();
          scopedMap = parseJsonToMap(scopedJson);
        }

        // Merge maps: use global makes from unscopedMap, and use scoped models/trims when available
        let finalMap: FilterMap = {
          ...unscopedMap,
          ...(scopedMap.model ? { model: scopedMap.model } : {}),
          ...(scopedMap.trim ? { trim: scopedMap.trim } : {}),
        } as any;

        // Merge maps set immediately so UI isn't blocked by additional count work
        setFilterOptions(finalMap);

        // For certain filter categories where WP counts may be unreliable (seller/dealer),
        // compute authoritative counts in the background (non-blocking) by querying /api/vehicles
        // for each option while preserving other applied filters (excluding the category being counted).
        // This runs asynchronously and will update filterOptions when completed.
        const backgroundCompute = async () => {
          try {
            const categoriesToCompute: { respKey: string; localKey: string }[] = [
              { respKey: "account_type_seller", localKey: "sellerType" },
              { respKey: "account_name_seller", localKey: "dealer" },
            ];

            for (const cat of categoriesToCompute) {
              const items = (finalMap as any)[cat.respKey] as any[] | undefined;
              if (!items || items.length === 0) continue;

              // Avoid huge numbers of background requests — skip if list too large
              if (items.length > 60) {
                console.warn(`Skipping authoritative counts for ${cat.respKey} (too many items: ${items.length})`);
                continue;
              }

              // Small concurrency pool
              const concurrency = 4;
              let idx = 0;

              const worker = async () => {
                while (idx < items.length) {
                  const i = idx++;
                  const item = items[i];
                  try {
                    const filtersCopy: any = { ...(filters || {}) };
                    delete filtersCopy[cat.localKey];
                    filtersCopy[cat.localKey] = [item.name];
                    const qs = buildFiltersQuery(filtersCopy);
                    const url = `/api/vehicles${qs ? `?${qs}&page=1&per_page=1` : "?page=1&per_page=1"}`;
                    const res = await fetchWithRetry(url, { method: "GET" });
                    if (!res.ok) {
                      console.warn("Count fetch failed for", url, res.status);
                      (item as any).count = (item as any).count || 0;
                      continue;
                    }
                    const json = await res.json();
                    const pagination = json.pagination || json.meta || {};
                    const total = pagination.total || pagination.totalRecords || pagination.total_records || json.total || 0;
                    (item as any).count = Number(total) || 0;
                  } catch (e) {
                    console.warn("Failed to compute count for", cat.respKey, item.name, e);
                  }
                }
              };

              // Launch workers
              await Promise.all(Array.from({ length: concurrency }).map(() => worker()));

              // After computing counts for this category, merge into filterOptions state
              setFilterOptions((prev) => ({ ...prev, [cat.respKey]: items }));
            }
          } catch (ex) {
            console.warn("Background authoritative counts failed:", ex);
          }
        };

        // Fire and forget
        setTimeout(() => {
          backgroundCompute();
        }, 50);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch filters");
        setFilterOptions({});
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // Prune invalid applied filters against current options
  const pruneInvalid = useCallback(
    (filters: Partial<AppliedFilters>) => {
      const keyMap: Record<string, string> = {
        make: "make",
        model: "model",
        trim: "trim",
        year: "year",
        bodyStyle: "body_style",
        driveType: "drivetrain",
        transmission: "transmission",
        exteriorColor: "exterior_color",
        interiorColor: "interior_color",
        dealer: "account_name_seller",
        sellerType: "account_type_seller",
        fuelType: "fuel_type",
      };

      let pruned = { ...(filters as any) } as Partial<AppliedFilters>;
      let changed = false;

      for (const [localKey, respKey] of Object.entries(keyMap)) {
        const available = (filterOptions[respKey] || []).map((v) => v.name);
        const current = (filters as any)[localKey];
        if (Array.isArray(current) && current.length > 0) {
          const filtered = current.filter((v: string) => available.includes(v));
          if (JSON.stringify(filtered) !== JSON.stringify(current)) {
            (pruned as any)[localKey] = filtered;
            changed = true;
          }
        }
      }

      return { pruned, changed };
    },
    [filterOptions],
  );

  return {
    filterOptions,
    filtersLoading: loading,
    filtersError: error,
    refetch: fetchFilters,
    pruneInvalid,
  };
}
