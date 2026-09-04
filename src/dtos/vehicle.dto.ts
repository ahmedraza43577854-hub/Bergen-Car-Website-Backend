export const BODY_STYLES = [
  "SUV",
  "Sedan",
  "Truck",
  "Coupe",
  "Hatchback",
  "Minivan",
  "Cargo Van",
  "Passenger Van",
  "Wagon",
  "Convertible",
] as const;

export type BodyStyle = (typeof BODY_STYLES)[number];

export const DRIVETRAINS = ["AWD", "FWD", "RWD", "4WD"] as const;
export type Drivetrain = (typeof DRIVETRAINS)[number];

export const FUELS = ["Gasoline", "Hybrid", "Electric"] as const;
export type Fuel = (typeof FUELS)[number];

export const VEHICLE_TAGS = [
  "Certified",
  "New Arrival",
  "Price Drop",
  "Low Miles",
] as const;
export type VehicleTag = (typeof VEHICLE_TAGS)[number];

/** Shape returned to the Bergen frontend from inventory.service. */
export type InventoryVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  bodyStyle: BodyStyle;
  drivetrain: Drivetrain;
  transmission: string;
  fuel: Fuel;
  exteriorColor: string;
  mpg: string;
  image: string;
  photos: string[];
  tag?: VehicleTag;
  commercial: boolean;
  formerPolice: boolean;
  luxury: boolean;
  handicapAccessible: boolean;
  /** VIN as reported by AutoSalesReviews. Empty string if upstream omitted it. */
  vin: string;
};

export const LUXURY_MAKES = new Set([
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Lexus",
  "Acura",
  "Infiniti",
  "Cadillac",
  "Lincoln",
  "Genesis",
  "Land Rover",
  "Porsche",
  "Volvo",
]);

export type UpstreamVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  price?: number | null;
  mileage?: number | null;
  bodyStyle?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  exteriorColor?: string | null;
  mpg?: string | null;
  photos?: string[] | null;
  vin?: string | null;
};
