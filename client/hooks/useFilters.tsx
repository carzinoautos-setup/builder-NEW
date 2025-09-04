import { useCallback, useEffect, useState } from "react";

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
  priceMin: string;
  priceMax: string;
  paymentMin: string;
  paymentMax: string;
  fuelType: string[];
  certified: string[];
};

type FilterMap = Record<string, { name: string; count: number }[]>;

function getApiBaseUrl() {
  const wpUrl = import.meta.env.VITE_WP_URL || "https://env-uploadbackup62225-czdev.kinsta.cloud";
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
  ];

  for (const [localKey, apiKey] of mapping) {
    const val = (paramsObj as any)[localKey];
    if (!val) continue;
    if (Array.isArray(val) && val.length > 0) params.append(apiKey, val.join(","));
    else if (typeof val === "string" && val !== "") params.append(apiKey, val);
  }

  if ((paramsObj as any).priceMin) params.append("min_price", (paramsObj as any).priceMin);
  if ((paramsObj as any).priceMax) params.append("max_price", (paramsObj as any).priceMax);

  return params.toString();
}

export default function useFilters(appliedFilters: Partial<AppliedFilters>) {
  const [filterOptions, setFilterOptions] = useState<FilterMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = useCallback(async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      const qs = buildFiltersQuery(filters || {});
      // Use local API proxy to avoid CORS and rely on server-side mock service when available
      const url = `/api/vehicles/filters${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Filters error ${res.status}`);
      const json = await res.json();

      // Support both WordPress plugin shape (json.filters) and local server shape (json.data)
      if (json && json.success) {
        if (json.filters) {
          setFilterOptions(json.filters);
        } else if (json.data) {
          // Normalize server filter data into the expected map shape
          const map: FilterMap = {};

          if (Array.isArray(json.data.makes))
            map.make = json.data.makes.map((n: string) => ({ name: n, count: 0 }));
          if (Array.isArray(json.data.models))
            map.model = json.data.models.map((n: string) => ({ name: n, count: 0 }));
          if (Array.isArray(json.data.trims))
            map.trim = json.data.trims.map((n: string) => ({ name: n, count: 0 }));
          if (Array.isArray(json.data.years))
            map.year = json.data.years.map((n: string) => ({ name: String(n), count: 0 }));
          if (Array.isArray(json.data.conditions))
            map.condition = json.data.conditions.map((n: string) => ({ name: n, count: 0 }));
          if (Array.isArray(json.data.fuelTypes))
            map.fuel_type = json.data.fuelTypes.map((n: string) => ({ name: n, count: 0 }));
          if (Array.isArray(json.data.transmissions))
            map.transmission = json.data.transmissions.map((n: string) => ({ name: n, count: 0 }));
          if (Array.isArray(json.data.drivetrains))
            map.drivetrain = json.data.drivetrains.map((n: string) => ({ name: n, count: 0 }));
          if (Array.isArray(json.data.bodyStyles))
            map.body_style = json.data.bodyStyles.map((n: string) => ({ name: n, count: 0 }));
          if (Array.isArray(json.data.sellerTypes))
            map.account_type_seller = json.data.sellerTypes.map((n: string) => ({ name: n, count: 0 }));

          setFilterOptions(map);
        } else {
          setFilterOptions({});
        }
      } else {
        setFilterOptions({});
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch filters");
      setFilterOptions({});
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // Prune invalid applied filters against current options
  const pruneInvalid = useCallback((filters: Partial<AppliedFilters>) => {
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
  }, [filterOptions]);

  return {
    filterOptions,
    filtersLoading: loading,
    filtersError: error,
    refetch: fetchFilters,
    pruneInvalid,
  };
}
