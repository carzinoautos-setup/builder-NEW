import React from "react";

interface VehicleTypeCardProps {
  type: string;
  count: number;
  vehicleImages: { [key: string]: string };
  isSelected: boolean;
  onToggle: (type: string) => void;
  // optional callback when an image is uploaded (not used in production)
  onImageUpload?: (type: string, file: File) => void;
}

export const VehicleTypeCard: React.FC<VehicleTypeCardProps> = ({
  type,
  count,
  vehicleImages,
  isSelected,
  onToggle,
  onImageUpload,
}) => {
  const [preview, setPreview] = React.useState<string | undefined>(
    vehicleImages[type],
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
        host.endsWith(".local")
    );
  }, []);

  React.useEffect(() => {
    setPreview(vehicleImages[type]);
  }, [vehicleImages, type]);

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

  const srcToShow = preview;

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

      <div
        className={`carzino-vehicle-type-name ${isSelected ? "text-red-600 font-semibold" : ""}`}
      >
        {type}
      </div>
      <div className="carzino-vehicle-type-count">({count})</div>
    </div>
  );
};
