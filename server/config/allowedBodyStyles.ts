export const ALLOWED_BODY_STYLES = [
  "Sedan",
  "SUV",
  "Truck",
  "Coupe",
  "Hatchback",
  "Wagon",
  "Convertible",
  "Van",
];

export const ALLOWED_BODY_STYLES_SET = new Set(
  ALLOWED_BODY_STYLES.map((s) => s.toLowerCase()),
);

// Normalize various vendor/body names into base allowed categories.
export function normalizeBodyStyle(raw: string | null | undefined): string {
  if (!raw) return "";
  const s = String(raw).toLowerCase().trim();
  if (!s) return "";

  // Map common variants to base categories
  if (
    /\b(cab|crew|extended|regular|pickup|pickup truck|crew-cab|extended-cab)\b/.test(
      s,
    ) ||
    /truck/.test(s)
  ) {
    return "truck";
  }
  if (/\b(suv|crossover|crossover\/)\b/.test(s) || /suv/.test(s)) return "suv";
  if (/van/.test(s)) return "van";
  if (/sedan|saloon/.test(s)) return "sedan";
  if (/coupe/.test(s)) return "coupe";
  if (/hatchback/.test(s)) return "hatchback";
  if (/wagon/.test(s)) return "wagon";
  if (/convertible|cabriolet/.test(s)) return "convertible";

  // If it already matches an allowed style
  if (ALLOWED_BODY_STYLES_SET.has(s)) return s;

  // Default: return empty to indicate not allowed
  return "";
}
