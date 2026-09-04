import {
  BODY_STYLES,
  LUXURY_MAKES,
  type BodyStyle,
  type Drivetrain,
  type Fuel,
  type InventoryVehicle,
  type UpstreamVehicle,
} from "../dtos/vehicle.dto";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=70";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function mapBodyStyle(raw: string | null | undefined): BodyStyle {
  const n = normalize(raw ?? "");
  if (!n) return "Sedan";

  for (const style of BODY_STYLES) {
    if (n === normalize(style)) return style;
  }

  if (n.includes("cargo") && n.includes("van")) return "Cargo Van";
  if (n.includes("passenger") && n.includes("van")) return "Passenger Van";
  if (n.includes("minivan")) return "Minivan";
  if (n.includes("sport utility") || n.includes("crossover") || n.includes("suv")) {
    return "SUV";
  }
  if (n.includes("pickup") || n.includes("pick up") || n.includes("truck")) {
    return "Truck";
  }
  if (n.includes("convertible") || n.includes("cabriolet") || n.includes("roadster")) {
    return "Convertible";
  }
  if (n.includes("hatch")) return "Hatchback";
  if (n.includes("wagon") || n.includes("estate")) return "Wagon";
  if (n.includes("coupe") || n.includes("coupé")) return "Coupe";
  if (n.includes("van")) return "Cargo Van";
  if (n.includes("sedan") || n.includes("saloon")) return "Sedan";
  return "Sedan";
}

function mapDrivetrain(raw: string | null | undefined): Drivetrain {
  const n = normalize(raw ?? "");
  if (!n) return "FWD";
  if (/\b4x4\b/.test(n) || n.includes("four wheel") || n.includes("4wd")) return "4WD";
  if (
    n.includes("all wheel") ||
    n.includes("awd") ||
    n.includes("quattro") ||
    n.includes("4matic") ||
    n.includes("xdrive") ||
    n.includes("sh-awd")
  ) {
    return "AWD";
  }
  if (n.includes("rear wheel") || n.includes("rwd")) return "RWD";
  if (n.includes("front wheel") || n.includes("fwd")) return "FWD";
  return "FWD";
}

function mapFuel(raw: string | null | undefined): Fuel {
  const n = normalize(raw ?? "");
  if (!n) return "Gasoline";
  if (n.includes("electric") || n.includes("ev") || n.includes("bess") || n === "bev") {
    return "Electric";
  }
  if (n.includes("hybrid") || n.includes("phev") || n.includes("plugin")) {
    return "Hybrid";
  }
  return "Gasoline";
}

function containsPhrase(haystack: string, phrase: string): boolean {
  return haystack.includes(normalize(phrase));
}

export function isLuxuryMake(make: string): boolean {
  return LUXURY_MAKES.has(make.trim());
}

export function isFormerPolice(model: string, trim: string): boolean {
  const haystack = normalize(`${model} ${trim}`);
  return (
    containsPhrase(haystack, "police interceptor") ||
    containsPhrase(haystack, "police pursuit") ||
    /\bppv\b/.test(haystack) ||
    /\bpolice\b/.test(haystack)
  );
}

export function isHandicapAccessible(model: string, trim: string): boolean {
  const haystack = normalize(`${model} ${trim}`);
  return (
    containsPhrase(haystack, "wheelchair") ||
    containsPhrase(haystack, "handicap") ||
    containsPhrase(haystack, "braun") ||
    containsPhrase(haystack, "mobility") ||
    containsPhrase(haystack, "side entry") ||
    containsPhrase(haystack, "rear entry")
  );
}

export function isCommercial(
  bodyStyle: BodyStyle,
  model: string,
  trim: string
): boolean {
  if (bodyStyle === "Cargo Van") return true;
  const haystack = normalize(`${model} ${trim}`);
  return containsPhrase(haystack, "cargo");
}

export function mapUpstreamVehicle(raw: UpstreamVehicle): InventoryVehicle {
  const trim = (raw.trim ?? "").trim();
  const model = (raw.model ?? "").trim();
  const bodyStyle = mapBodyStyle(raw.bodyStyle);
  const photos = (raw.photos ?? []).filter((url) => typeof url === "string" && url.trim());

  return {
    id: raw.id,
    year: raw.year,
    make: (raw.make ?? "").trim(),
    model,
    trim,
    price: Number(raw.price ?? 0),
    mileage: Number(raw.mileage ?? 0),
    bodyStyle,
    drivetrain: mapDrivetrain(raw.drivetrain),
    transmission: (raw.transmission ?? "Automatic").trim() || "Automatic",
    fuel: mapFuel(raw.fuelType),
    exteriorColor: (raw.exteriorColor ?? "").trim(),
    mpg: (raw.mpg ?? "").trim(),
    image: photos[0] ?? PLACEHOLDER_IMAGE,
    photos,
    commercial: isCommercial(bodyStyle, model, trim),
    formerPolice: isFormerPolice(model, trim),
    luxury: isLuxuryMake(raw.make ?? ""),
    handicapAccessible: isHandicapAccessible(model, trim),
    vin: (raw.vin ?? "").trim(),
  };
}
