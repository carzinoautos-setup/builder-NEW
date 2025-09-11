import { useCallback, useEffect, useState, useRef } from "react";
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
    ["vehicleType", "body_style"],
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
    // Engine and displacement mappings
    ["engineCylinders", "engine_cylinders"],
    ["displacementLiters", "displacement_liters"],
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

  // Internal refs for fetch tracing and visibility guard
  const FETCH_PERSIST_KEY = "carzino_applied_filters_v2";
  const latestFetchIdRef = useRef(0);
  const fetchCounterRef = useRef(0);
  const visibilityChangeAtRef = useRef(0);

  // Persist incoming appliedFilters into sessionStorage so other contexts (Builder preview)
  // can rehydrate them. We avoid overwriting if sessionStorage is not available.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        FETCH_PERSIST_KEY,
        JSON.stringify(appliedFilters || {}),
      );
    } catch (e) {
      // ignore quota errors
    }
  }, [appliedFilters]);

  // Expose a helper to load persisted filters (parent can call this during reducer init)
  // Note: we keep this as a named export below as loadPersistedAppliedFilters.

  // Visibilitychange listener to mark when tab became visible/hidden - used to guard automatic refetches
  useEffect(() => {
    const onVis = () => {
      visibilityChangeAtRef.current = Date.now();
      console.log(
        "[filters] visibilitychange ->",
        document.visibilityState,
        visibilityChangeAtRef.current,
      );
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const fetchFilters = useCallback(
    async (filters = appliedFilters, opts?: { force?: boolean }) => {
      // Guard: if the tab has just become visible, avoid auto-refetch race that may overwrite
      // currently visible state. Allow forced fetches (user-initiated) by opts.force.
      if (
        !opts?.force &&
        Date.now() - visibilityChangeAtRef.current < 3000 &&
        document.visibilityState === "visible"
      ) {
        console.log("[filters][fetch ignored due to recent visibility change]");
        return;
      }

      const localId = ++fetchCounterRef.current;
      latestFetchIdRef.current = localId;
      const startTs = Date.now();
      console.log(`[filters][start] id=${localId} ts=${startTs}`);

      const controller = new AbortController();
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

        // Fetch scoped filter options first (scoped to current appliedFilters)
        const scopedQs = buildFiltersQuery(filters || {});
        const scopedUrl = `/api/vehicles/filters${scopedQs ? `?${scopedQs}` : ""}`;
        console.log(
          "🔍 Fetching scoped filter options:",
          scopedUrl,
          `id=${localId}`,
        );
        const scopedRes = await fetchWithRetry(
          scopedUrl,
          { method: "GET", signal: controller.signal },
          2,
          15000,
        );
        if (!scopedRes.ok) throw new Error(`Filters error ${scopedRes.status}`);
        const scopedJson = await scopedRes.json();

        // Fetch unscoped make list (keep models/trims and other categories scoped).
        const unscopedFilters: any = { ...(filters || {}) };
        // Remove make/model/trim to obtain a complete list of makes (scoped by other filters)
        delete unscopedFilters.model;
        delete unscopedFilters.trim;
        const unscopedQs = buildFiltersQuery(unscopedFilters || {});
        const unscopedUrl = `/api/vehicles/filters${unscopedQs ? `?${unscopedQs}` : ""}`;
        console.log(
          "🔍 Fetching unscoped make list:",
          unscopedUrl,
          `id=${localId}`,
        );
        const unscopedRes = await fetchWithRetry(
          unscopedUrl,
          { method: "GET", signal: controller.signal },
          2,
          15000,
        );
        if (!unscopedRes.ok)
          throw new Error(`Filters error ${unscopedRes.status}`);
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

            const transSpeeds = pickArrayFromFilters(
              f,
              "transmission_speed",
              "transmissionSpeeds",
              "transmission_speed",
            );
            if (transSpeeds)
              normalized.transmission_speed = transSpeeds
                .map(mapItem)
                .filter(Boolean) as any;

            const doors = pickArrayFromFilters(f, "doors");
            if (doors)
              normalized.doors = doors.map(mapItem).filter(Boolean) as any;

            const highway = pickArrayFromFilters(
              f,
              "highway_mpg",
              "highwayMpg",
            );
            if (highway)
              normalized.highway_mpg = highway
                .map(mapItem)
                .filter(Boolean) as any;

            const titles = pickArrayFromFilters(
              f,
              "title_status",
              "titleStatus",
            );
            if (titles)
              normalized.title_status = titles
                .map(mapItem)
                .filter(Boolean) as any;

            const statuses = pickArrayFromFilters(f, "status");
            if (statuses)
              normalized.status = statuses.map(mapItem).filter(Boolean) as any;

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

        // Use scopedJson (full appliedFilters) as the authoritative source for scoped categories
        const scopedMap: FilterMap = parseJsonToMap(scopedJson);

        // Merge maps: use scopedMap (authoritative counts for current appliedFilters)
        // but preserve the make list from unscopedMap (so user still sees all make options)
        let finalMap: FilterMap = {
          ...scopedMap,
          ...(unscopedMap.make ? { make: unscopedMap.make } : {}),
          // Ensure transmission lists reflect scoped data when available
          ...(scopedMap.transmission
            ? { transmission: scopedMap.transmission }
            : {}),
          ...(scopedMap.transmission_speed
            ? { transmission_speed: scopedMap.transmission_speed }
            : {}),
        } as any;

        // Remove any 'Uncategorized' or empty labels from all filter arrays
        const sanitize = (map: FilterMap) => {
          const out: FilterMap = {};
          const blacklist = new Set([
            "harley-davidson",
            "harley davidson",
            "harley",
            "forest river",
            "fleetwood",
          ]);
          for (const [k, arr] of Object.entries(map)) {
            if (!Array.isArray(arr)) {
              (out as any)[k] = arr as any;
              continue;
            }
            (out as any)[k] = (arr as any[])
              .filter((it) => {
                const name =
                  (it && (it.name || it.value || it.label || it)) || "";
                const n = String(name).trim();
                if (n === "") return false;
                if (n.toLowerCase() === "uncategorized") return false;
                if (blacklist.has(n.toLowerCase())) return false;
                return true;
              })
              .map((it) => it);
          }
          return out;
        };

        finalMap = sanitize(finalMap);

        // Merge maps set immediately so UI isn't blocked by additional count work
        // Only commit if this fetch is still the latest
        if (localId !== latestFetchIdRef.current || controller.signal.aborted) {
          console.log(
            `[filters][ignore commit] id=${localId} (stale or aborted)`,
          );
          return;
        }

        setFilterOptions(finalMap);
        console.log(`[filters][commit] id=${localId} ts=${Date.now()}`);

        // For certain filter categories where WP counts may be unreliable (seller/dealer),
        // compute authoritative counts in the background (non-blocking) by querying /api/vehicles
        // for each option while preserving other applied filters (excluding the category being counted).
        // This runs asynchronously and will update filterOptions when completed.
        const backgroundCompute = async () => {
          try {
            const categoriesToCompute: { respKey: string; localKey: string }[] =
              [
                { respKey: "account_type_seller", localKey: "sellerType" },
                { respKey: "account_name_seller", localKey: "dealer" },
                { respKey: "state_seller", localKey: "state" },
                { respKey: "city_seller", localKey: "city" },
                // Ensure makes that only exist on uncategorized vehicles are removed
                { respKey: "make", localKey: "make" },
                // Ensure condition counts are authoritative
                { respKey: "condition", localKey: "condition" },
                // Compute authoritative counts for fuel type and related attributes so counts respect current filters
                { respKey: "fuel_type", localKey: "fuelType" },
                { respKey: "transmission", localKey: "transmission" },
                {
                  respKey: "transmission_speed",
                  localKey: "transmissionSpeed",
                },
                { respKey: "drivetrain", localKey: "driveType" },
                { respKey: "exterior_color", localKey: "exteriorColor" },
                { respKey: "interior_color", localKey: "interiorColor" },
                { respKey: "doors", localKey: "doors" },
              ];

            for (const cat of categoriesToCompute) {
              if (controller.signal.aborted) break;
              const items = (finalMap as any)[cat.respKey] as any[] | undefined;
              if (!items || items.length === 0) continue;

              // Avoid huge numbers of background requests — skip if list too large
              if (items.length > 60) {
                console.warn(
                  `Skipping authoritative counts for ${cat.respKey} (too many items: ${items.length})`,
                );
                continue;
              }

              // Small concurrency pool (reduced to limit parallel requests)
              const concurrency = 2;
              let idx = 0;

              const worker = async () => {
                while (idx < items.length) {
                  if (controller.signal.aborted) return;
                  const i = idx++;
                  const item = items[i];
                  try {
                    const filtersCopy: any = { ...(filters || {}) };
                    delete filtersCopy[cat.localKey];
                    filtersCopy[cat.localKey] = [item.name];
                    const qs = buildFiltersQuery(filtersCopy);
                    const url = `/api/vehicles${qs ? `?${qs}&page=1&per_page=1` : "?page=1&per_page=1"}`;
                    // Increase retries and timeout for background authoritative counts
                    const res = await fetchWithRetry(
                      url,
                      { method: "GET", signal: controller.signal },
                      2,
                      20000,
                    ).catch((err) => {
                      // Treat aborted/timeouts as non-fatal for counts
                      console.warn(
                        "Count fetch network error for",
                        url,
                        err && err.message ? err.message : err,
                      );
                      return null as any;
                    });
                    if (!res) {
                      (item as any).count = (item as any).count || 0;
                      continue;
                    }
                    if (!res.ok) {
                      console.warn("Count fetch failed for", url, res.status);
                      (item as any).count = (item as any).count || 0;
                      continue;
                    }
                    const json = await res.json();
                    const pagination = json.pagination || json.meta || {};
                    const total =
                      pagination.total ||
                      pagination.totalRecords ||
                      pagination.total_records ||
                      json.total ||
                      0;
                    (item as any).count = Number(total) || 0;
                  } catch (e) {
                    console.warn(
                      "Failed to compute count for",
                      cat.respKey,
                      item.name,
                      e,
                    );
                  }
                }
              };

              // Launch workers
              await Promise.all(
                Array.from({ length: concurrency }).map(() => worker()),
              );

              // After computing counts for this category, remove zero-count or blank options
              const cleaned = (items || []).filter((it: any) => {
                const name =
                  (it && (it.name || it.value || it.label || it)) || "";
                const count = Number((it && it.count) || 0);
                return (
                  String(name).trim() !== "" &&
                  String(name).trim().toLowerCase() !== "uncategorized" &&
                  count > 0
                );
              });

              // Only commit background updates if this fetch is still the latest and not aborted
              if (
                localId !== latestFetchIdRef.current ||
                controller.signal.aborted
              ) {
                console.log(`[filters][background ignored] id=${localId}`);
                return;
              }

              setFilterOptions((prev) => ({ ...prev, [cat.respKey]: cleaned }));
            }
          } catch (ex) {
            console.warn("Background authoritative counts failed:", ex);
          }
        };

        // Fire and forget (only run if we have items worth computing)
        const hasItems = Object.values(finalMap).some(
          (arr) => Array.isArray(arr) && arr.length > 0,
        );
        if (hasItems) {
          setTimeout(() => {
            backgroundCompute().catch((ex) =>
              console.warn("backgroundCompute uncaught:", ex),
            );
          }, 50);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to fetch filters");
        console.warn(
          `[filters][error] id=${localId} err=${err && err.message ? err.message : err}`,
        );
        // Do not wipe existing filterOptions on transient errors — keep last known good state
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    fetchFilters();
    // We intentionally do not include fetchFilters in deps to avoid double-calls; rely on appliedFilters changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // Prune invalid applied filters against current options
  const pruneInvalid = useCallback(
    (filters: Partial<AppliedFilters>) => {
      const keyMap: Record<string, string> = {
        make: "make",
        model: "model",
        trim: "trim",
        year: "year",
        bodyStyle: "body_style",
        vehicleType: "body_style",
        driveType: "drivetrain",
        transmission: "transmission",
        exteriorColor: "exterior_color",
        interiorColor: "interior_color",
        dealer: "account_name_seller",
        sellerType: "account_type_seller",
        fuelType: "fuel_type",
        condition: "condition",
        // Location keys
        state: "state_seller",
        city: "city_seller",
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

export function loadPersistedAppliedFilters() {
  try {
    const v = sessionStorage.getItem("carzino_applied_filters_v2");
    if (!v) return null;
    return JSON.parse(v) as Partial<AppliedFilters>;
  } catch (e) {
    return null;
  }
}
