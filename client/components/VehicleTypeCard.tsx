import React from "react";

interface VehicleTypeCardProps {
  type: string;
  count: number;
  vehicleImages: { [key: string]: string };
  isSelected: boolean;
  onToggle: (type: string) => void;
  // optional image override (exposed to Builder editor)
  image?: string;
  // optional callback when an image is uploaded (not used in production)
  onImageUpload?: (type: string, file: File) => void;
}

export const VehicleTypeCard: React.FC<VehicleTypeCardProps> = ({
  type,
  count,
  vehicleImages,
  isSelected,
  onToggle,
  image,
  onImageUpload,
}) => {
  const [preview, setPreview] = React.useState<string | undefined>(
    image || vehicleImages[type],
  );
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Detect design/editor mode using several heuristics. This keeps upload UI hidden in production.
  const isDesignMode = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const w = window as any;
    const search = window.location.search || "";
    const host = window.location.hostname || "";
    return Boolean(
      w.__BUILDER_EDIT_MODE__ ||
        w.__builder ||
        w.Builder?.isEditing ||
        search.includes("builder") ||
        search.includes("edit") ||
        host.includes("localhost") ||
        host.endsWith(".local"),
    );
  }, []);

  React.useEffect(() => {
    // Prefer explicit image prop (from Builder editor) over vehicleImages mapping
    setPreview(image || vehicleImages[type]);
  }, [vehicleImages, type, image]);

  // Clean up object URLs when preview changes from an object URL
  React.useEffect(() => {
    return () => {
      // no-op on unmount, object URLs are revoked when replaced
    };
  }, []);

  const handleFile = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (onImageUpload) onImageUpload(type, file);
  };

  // Provide small set of default images (CDN) for common vehicle types
  const defaultImages: { [key: string]: string } = {
    sedan:
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F0eccbe1eccb94b3b8eee4d8cfb611864",
    "crossover-suv":
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F98d1869674c64e419bf7ca7da66e25b8",
    "crew-cab":
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F87eaf3866c0e482c912cb9c0ca83d44a",
    "van-minivan":
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Ff0d0c6c20e02423dad8eefa6f0ef508a",
    convertible:
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F064c51214995430a9384ae9f1722bee9",
    wagon:
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F24bf3ece0537462bbd1edd12a2485c0a",
    coupe:
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F1d042ebb458842a8a468794ae563fcc6",
    "regular-cab-truck":
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2F30f147c94e904a5ba1b1ce7ce9ebd89b",
    hatchback:
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fb06dd82e2c564b7eb30b1d5fa14e0562",
    "extended-cab":
      "https://cdn.builder.io/api/v1/image/assets%2F4d1f1909a98e4ebc8068632229306ce4%2Fa24133306df2416881f9ea266e4f65c1",
  };

  const normalized = (s?: string) =>
    (s || "")
      .toLowerCase()
      .replace(/[\s\/]+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  const srcToShow =
    preview ||
    vehicleImages[type] ||
    vehicleImages[normalized(type)] ||
    defaultImages[normalized(type)] ||
    defaultImages[normalized(type.split("/")[0])] ||
    undefined;

  return (
    <div
      className={`text-center p-2 rounded group transition-all ${
        isSelected
          ? "border-2 border-red-600"
          : "hover:bg-gray-50 border-2 border-transparent"
      }`}
    >
      <div
        onClick={() => onToggle(type)}
        className="relative rounded-lg p-3 mb-2 h-14 flex items-center justify-center transition-colors bg-gray-100 group-hover:bg-gray-200"
      >
        {srcToShow ? (
          <img
            src={srcToShow}
            alt={`${type} vehicle type`}
            className="max-w-full max-h-full object-contain rounded-lg overflow-hidden"
            style={{ width: "auto", height: "35px" }}
          />
        ) : (
          <div className="text-gray-400 text-xs">{type}</div>
        )}

        {isDesignMode && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="absolute right-1 top-1 hidden group-hover:block bg-white/90 rounded p-1 border border-gray-200 text-xs"
              aria-label={`Upload image for ${type}`}
            >
              Upload
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const f = e.target.files && e.target.files[0];
                if (f) handleFile(f);
                e.currentTarget.value = "";
              }}
            />
          </>
        )}
      </div>

      {/* Format label for display (e.g., "crossover-suv" -> "Crossover/SUV") */}
      <div
        className={`carzino-vehicle-type-name ${isSelected ? "text-red-600 font-semibold" : ""}`}
      >
        <p>
          {(type || "")
            .split("/")
            .map((part) =>
              part
                .split(/[-_\s]+/)
                .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
                .join(" "),
            )
            .join("/")}
        </p>
      </div>
      <div className="carzino-vehicle-type-count">({count})</div>
    </div>
  );
};
