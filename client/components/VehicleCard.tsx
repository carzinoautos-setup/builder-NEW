import React from "react";
import { Gauge, Settings, ChevronDown, Heart, Check } from "lucide-react";

interface Vehicle {
  id: number;
  featured: boolean;
  viewed: boolean;
  images: string[];
  badges: string[];
  title: string;
  mileage: string;
  transmission: string;
  doors: string;
  doorIcon?: string; // Optional custom door icon URL
  mileageIcon?: string; // Optional custom mileage icon URL
  transmissionIcon?: string; // Optional custom transmission icon URL
  salePrice: string | null;
  payment: string | null;
  dealer: string;
  location: string;
  phone: string;
  seller_type: string;
  seller_account_number: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  favorites: { [key: number]: Vehicle };
  onToggleFavorite: (vehicle: Vehicle) => void;
  keeperMessage: number | null;
  termLength?: string;
  interestRate?: string;
  downPayment?: string;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  favorites,
  onToggleFavorite,
  keeperMessage,
  termLength = "60",
  interestRate = "5",
  downPayment = "2000",
}) => {
  const parseFormattedPrice = (priceStr?: string | null): number | null => {
    if (!priceStr) return null;
    const num = parseFloat(String(priceStr).replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return null;
    return num;
  };

  const hasValidSalePrice = (): boolean => {
    const n = parseFormattedPrice(vehicle.salePrice);
    return n !== null && n > 0;
  };

  const isFavorited = (vehicleId: number) => !!favorites[vehicleId];

  // Compute monthly payment using explicit numeric inputs. aprDecimal expects a decimal (e.g. 0.055 for 5.5%)
  const computeMonthlyFromNumbers = (
    priceNum: number,
    downNum: number,
    aprDecimal: number,
    termMonths: number,
  ) => {
    const principal = Math.max(0, priceNum - downNum);
    const months = termMonths && termMonths > 0 ? termMonths : 60;
    const monthlyRate = aprDecimal / 12; // aprDecimal already in decimal form

    if (principal <= 0 || months <= 0) return null;

    if (!monthlyRate || monthlyRate === 0) {
      return Math.round(principal / months);
    }

    const denom = 1 - Math.pow(1 + monthlyRate, -months);
    if (denom === 0) return Math.round(principal / months);
    const monthly = (principal * monthlyRate) / denom;
    return Math.round(monthly);
  };

  const getDisplayPayment = (): string => {
    // Prefer ACF-backed per-vehicle values when available, and respect user-entered down payment (prop `downPayment`).
    const salePriceNum = parseFormattedPrice(vehicle.salePrice) || null;
    const userDown = downPayment
      ? Number(String(downPayment).replace(/[^0-9.-]/g, ""))
      : 0;

    // Determine APR and term from vehicle ACF fields when present
    const vehAprRaw = Number((vehicle as any).interest_rate ?? NaN);
    const vehTerm = Number((vehicle as any).loan_term ?? NaN);

    // Normalize APR to decimal (if stored as percent like 5 => 0.05)
    let aprDecimal = NaN;
    if (!isNaN(vehAprRaw)) {
      aprDecimal = vehAprRaw > 1 ? vehAprRaw / 100 : vehAprRaw;
    }

    // If user provided a down payment value, recalculate instantly on client
    if (salePriceNum !== null && userDown !== null && !isNaN(userDown)) {
      const aprToUse = !isNaN(aprDecimal)
        ? aprDecimal
        : Number(interestRate) / 100;
      const termToUse =
        !isNaN(vehTerm) && vehTerm > 0 ? vehTerm : parseInt(termLength) || 60;
      const monthlyNum = computeMonthlyFromNumbers(
        salePriceNum,
        userDown,
        aprToUse,
        termToUse,
      );
      if (monthlyNum !== null && !isNaN(monthlyNum)) {
        return `$${monthlyNum.toLocaleString()}`;
      }
    }

    // Default case: prefer per-vehicle ACF payment_min as the display 'from $X/mo'
    const vehPaymentMin =
      (vehicle as any).payment_min ?? (vehicle as any).payments ?? null;
    if (
      vehPaymentMin !== null &&
      vehPaymentMin !== undefined &&
      Number(vehPaymentMin) > 0
    ) {
      return `from $${Math.round(Number(vehPaymentMin)).toLocaleString()}`;
    }

    // Fallback: use vehicle.payment string if provided
    if ((vehicle as any).payment) return (vehicle as any).payment;

    return "Call for Price";
  };

  const getMediumImage = (url?: string) => {
    if (!url)
      return (
        import.meta.env.VITE_PLACEHOLDER_IMAGE ||
        "/assets/fallback-image-450.webp" ||
        "/placeholder.svg"
      );

    try {
      const u = new URL(url);
      if (
        u.searchParams.has("w") ||
        u.searchParams.has("width") ||
        u.searchParams.has("h") ||
        u.searchParams.has("height")
      ) {
        if (u.searchParams.has("w")) u.searchParams.set("w", "450");
        if (u.searchParams.has("width")) u.searchParams.set("width", "450");
        if (u.searchParams.has("h")) u.searchParams.set("h", "300");
        if (u.searchParams.has("height")) u.searchParams.set("height", "300");
        return u.toString();
      }

      if (
        u.hostname.includes("images.unsplash.com") ||
        u.hostname.includes("cdn.")
      ) {
        const s =
          u.origin + u.pathname + `?w=450&h=300&fit=crop&auto=format&q=80`;
        return s;
      }

      const pathname = u.pathname;
      const lastDot = pathname.lastIndexOf(".");
      if (lastDot > 0) {
        const prefix = pathname.substring(0, lastDot);
        const ext = pathname.substring(lastDot);
        const sized = `${prefix}-450x300${ext}`;
        return u.origin + sized;
      }

      return url;
    } catch (e) {
      if (url.includes("?")) {
        return url + "&w=450&h=300";
      }
      const dot = url.lastIndexOf(".");
      if (dot > 0) {
        return url.substring(0, dot) + "-450x300" + url.substring(dot);
      }
      return url;
    }
  };

  const sanitize = (v: any) => {
    if (v === undefined || v === null) return "";
    const s = String(v).trim();
    if (/^unknown$/i.test(s)) return "";
    return s;
  };

  const citySellerRaw = sanitize(
    (vehicle as any).city_seller || (vehicle as any).city || "",
  );
  const stateSellerRaw = sanitize(
    (vehicle as any).state_seller || (vehicle as any).state || "",
  );
  const fallbackLocation = sanitize(vehicle.location || "");

  const [sellerInfo, setSellerInfo] = React.useState<any>(null);
  const [sellerFetchFailed, setSellerFetchFailed] = React.useState(false);
  const accountTypeField = sanitize(
    (vehicle as any).account_type_seller || (vehicle as any).seller_type || "",
  );

  React.useEffect(() => {
    let mounted = true;
    // Accept either naming convention for the account number
    const acct =
      (vehicle as any).seller_account_number ||
      (vehicle as any).account_number_seller ||
      (vehicle as any).account_number ||
      null;
    if (!acct) return;
    if (sellerFetchFailed) return; // avoid retrying repeatedly if it already failed

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      try {
        controller.abort();
      } catch (err) {
        /* ignore */
      }
    }, 5000);

    (async () => {
      try {
        const url = `${window.location.origin}/api/sellers/${encodeURIComponent(acct)}`;
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp) {
          setSellerFetchFailed(true);
          return;
        }
        if (!resp.ok) {
          // mark failed to avoid repeated retries and log the status
          setSellerFetchFailed(true);
          try {
            const text = await resp.text().catch(() => "");
            console.warn(`VehicleCard: seller fetch failed status=${resp.status} body=${text}`);
          } catch (e) {
            // ignore
          }
          return;
        }
        // If the request was aborted before json parsing, avoid parsing
        if (controller.signal.aborted) return;
        const json = await resp.json().catch(() => null);
        if (mounted && json && json.success && json.data) {
          setSellerInfo(json.data);
        }
      } catch (e: any) {
        // Ignore AbortError silently, log others and mark failure to avoid retry storm
        if (e && e.name === "AbortError") {
          // request was aborted (timeout or unmount) - no-op
        } else {
          console.warn("VehicleCard: seller fetch error:", e);
          setSellerFetchFailed(true);
        }
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      mounted = false;
      clearTimeout(timeout);
      try {
        if (!controller.signal.aborted) controller.abort();
      } catch (err) {
        /* ignore */
      }
    };
  }, [
    (vehicle as any).seller_account_number,
    (vehicle as any).account_number_seller,
    (vehicle as any).account_number,
    sellerFetchFailed,
  ]);

  // Determine displayed city/state preferring sellerInfo (sanitize 'Unknown')
  const displayedCity = sanitize(
    (sellerInfo && (sellerInfo.city || sellerInfo.city_seller)) ||
      citySellerRaw,
  );
  const displayedState = sanitize(
    (sellerInfo && (sellerInfo.state || sellerInfo.state_seller)) ||
      stateSellerRaw,
  );
  const locationDisplay =
    displayedCity || displayedState
      ? `${displayedCity}${displayedCity && displayedState ? ", " : ""}${displayedState}`
      : fallbackLocation || "";

  // Final account type to display: prefer sellerInfo, then vehicle custom field, then seller_type
  const accountTypeSeller = sanitize(
    (sellerInfo && (sellerInfo.accountType || sellerInfo.type || sellerInfo.account_type_seller)) ||
      accountTypeField ||
      (vehicle as any).seller_type ||
      "",
  );

  // Ensure the relationship key is exposed in an accessible but hidden element for Builder binding
  const acctNumberValue =
    (vehicle as any).seller_account_number ||
    (vehicle as any).account_number_seller ||
    (vehicle as any).account_number ||
    "";

  return (
    <div className="bg-white border border-gray-200 rounded-lg lg:rounded-xl overflow-hidden hover:shadow-lg transition-shadow vehicle-card flex flex-col h-full">
      <div className="relative">
        <img
          src={getMediumImage(vehicle.images ? vehicle.images[0] : "")}
          alt={vehicle.title}
          className="w-full object-cover"
          style={{ height: "200px" }}
        />
        {vehicle.featured && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full carzino-featured-badge font-medium">
            Featured!
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex gap-2 mb-2 items-center justify-between">
          <div className="flex gap-2 items-center">
            {vehicle.badges.map((badge, index) => (
              <span
                key={index}
                className="carzino-badge-label px-2 py-1 rounded font-medium"
                style={{
                  borderRadius: "7px",
                  backgroundColor: "#f9fafb",
                  color: "rgb(21, 41, 109)",
                }}
              >
                {badge}
              </span>
            ))}
            {vehicle.viewed && (
              <span
                className="carzino-badge-label px-2 py-1 rounded font-medium inline-flex items-center"
                style={{
                  borderRadius: "7px",
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  color: "rgb(21, 41, 109)",
                }}
              >
                Viewed{" "}
                <Check
                  className="w-3 h-3 ml-0.5"
                  style={{ color: "rgb(21, 41, 109)" }}
                />
              </span>
            )}
            <Heart
              className={`w-4 h-4 cursor-pointer transition-colors ml-1 ${
                isFavorited(vehicle.id)
                  ? "text-red-600 fill-red-600"
                  : "text-red-600 stroke-red-600 fill-white"
              }`}
              onClick={() => onToggleFavorite(vehicle)}
            />
            {keeperMessage === vehicle.id && (
              <span className="text-xs text-gray-600 ml-1 animate-pulse">
                That's a Keeper!
              </span>
            )}
          </div>
        </div>

        <h3 className="carzino-vehicle-title text-gray-900 mb-2 leading-tight overflow-hidden whitespace-nowrap text-ellipsis">
          {vehicle.title}
        </h3>

        <div className="flex items-center justify-start mb-3 pb-2 border-b border-gray-200 carzino-vehicle-details">
          <div className="flex items-center gap-1 mr-4">
            {vehicle.mileageIcon ? (
              <img
                src={vehicle.mileageIcon}
                alt="Mileage icon"
                className="w-4 h-4 object-contain"
              />
            ) : (
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F2b268dcc254a4017a2ef9d9e1c9b3acb?format=webp&width=800"
                alt="Speedometer"
                className="w-4 h-4 object-contain"
              />
            )}
            <span className="text-black font-medium">
              {vehicle.mileage} Mi.
            </span>
          </div>
          <div className="flex items-center gap-1 mr-4">
            {vehicle.transmissionIcon ? (
              <img
                src={vehicle.transmissionIcon}
                alt="Transmission icon"
                className="w-4 h-4 object-contain"
              />
            ) : (
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F209b197e983f494e94b04a7d87b79174?format=webp&width=800"
                alt="Car parts"
                className="w-4 h-4 object-contain"
              />
            )}
            <span className="text-black font-medium">
              {(() => {
                const t = (vehicle.transmission || "").toString().trim();
                if (!t) return "";
                if (/^auto(matic)?$/i.test(t)) return "Auto";
                return t;
              })()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 text-gray-600 flex items-center justify-center">
              {vehicle.doorIcon ? (
                <img
                  src={vehicle.doorIcon}
                  alt="Door icon"
                  className="w-4 h-4 object-contain"
                />
              ) : (
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Ff5793a859e2548bc9bc984fcae57131c?format=webp&width=800"
                  alt="Car door"
                  className="w-4 h-4 object-contain"
                />
              )}
            </div>
            <span className="text-black font-medium">
              {vehicle.doors.replace(/doors/g, "Doors")}
            </span>
          </div>
        </div>

        <div className="flex justify-center items-start gap-6 mb-1 flex-1">
          {hasValidSalePrice() ? (
            <>
              <div className="text-center">
                <div
                  className="carzino-price-label text-gray-500 mb-0"
                  style={{ fontSize: "12px" }}
                >
                  Sale Price
                </div>
                <div
                  className="carzino-price-value text-gray-900"
                  style={{ fontSize: "12px" }}
                >
                  {vehicle.salePrice}
                </div>
              </div>

              <>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                  <div
                    className="carzino-price-label text-gray-500 mb-0"
                    style={{ fontSize: "12px" }}
                  >
                    Payments
                  </div>
                  <div
                    className="carzino-price-value text-red-600"
                    style={{ fontSize: "12px" }}
                  >
                    {getDisplayPayment()}
                    <span className="text-xs text-black font-normal">/mo*</span>
                  </div>
                </div>
              </>
            </>
          ) : (
            <div className="text-center">
              <div
                className="carzino-price-label text-gray-500 mb-0"
                style={{ fontSize: "12px" }}
              >
                No Sale Price Listed
              </div>
              <div
                className="carzino-price-value text-gray-900"
                style={{ fontSize: "12px" }}
              >
                Call for Price
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="border-t border-gray-100 px-3 py-2 mt-auto"
        style={{ backgroundColor: "#f9fafb", fontSize: "12px" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Left: City, State (city_seller, state_seller) */}
            <input
              readOnly
              value={locationDisplay}
              title={locationDisplay}
              className="flex-1 min-w-0 bg-transparent rounded-md px-2 text-sm text-gray-900 truncate"
              style={{
                minWidth: 0,
                backgroundColor: "transparent",
                border: "none",
                fontSize: "12px",
                lineHeight: "12px",
                padding: "0 8px",
              }}
            />

            {/* Hidden relationship field (not shown to users) - kept for binding */}
            <input type="hidden" value={acctNumberValue} data-seller-account-hidden />
          </div>

          <div className="flex-shrink-0 text-right">
            <div
              className="text-gray-900"
              style={{
                fontSize: "12px",
                lineHeight: "12px",
                fontWeight: "400",
                color: "rgb(17, 24, 39)",
                minWidth: 80,
                textAlign: "right",
              }}
            >
              {accountTypeSeller || vehicle.seller_type}
            </div>
          </div>
        </div>

        {/* Full-width hidden binding row for account number (kept visually hidden but present for Builder bindings) */}
        <div className="sr-only mt-1" aria-hidden>
          <span data-account-number-hidden>{acctNumberValue}</span>
        </div>
      </div>
    </div>
  );
};

export function VehicleCardSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse ${className}`}
    >
      <div className="aspect-[4/3] bg-gray-200"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
        <div className="border-t pt-3">
          <div className="h-8 bg-gray-200 rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
