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

export const ALLOWED_BODY_STYLES_SET = new Set(ALLOWED_BODY_STYLES.map((s) => s.toLowerCase()));
