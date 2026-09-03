function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function required(value: string | undefined, name: string): string {
  const trimmed = optional(value);
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

function parseList(value: string | undefined, fallback: string[]): string[] {
  const raw = optional(value);
  if (!raw) return fallback;
  const list = raw
    .split(/[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length > 0 ? list : fallback;
}

const DEFAULT_CORS = [
  "https://bergenmotors.com",
  "https://www.bergenmotors.com",
  "https://bergencarcompany.com",
  "https://www.bergencarcompany.com",
  "http://localhost:3000",
];

export const env = {
  port: parseInt(process.env.PORT ?? "4001", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  autosalesreviews: {
    apiUrl: (
      optional(process.env.AUTOSALESREVIEWS_API_URL) ??
      "https://dealer-review-and-inventory-platfor-gamma.vercel.app"
    ).replace(/\/+$/, ""),
    internalApiKey: required(process.env.INTERNAL_API_KEY, "INTERNAL_API_KEY"),
    dealerSlug:
      optional(process.env.AUTOSALESREVIEWS_DEALER_SLUG) ?? "bergen-car",
  },
  corsOrigins: parseList(process.env.CORS_ORIGIN, DEFAULT_CORS),
  email: {
    from:
      optional(process.env.EMAIL_FROM) ??
      "Bergen Motors <sphirepremium@gmail.com>",
    host: optional(process.env.EMAIL_HOST),
    port: parseInt(process.env.EMAIL_PORT ?? "587", 10),
    user: optional(process.env.EMAIL_USER),
    pass: optional(process.env.EMAIL_PASS),
    adminRecipients: parseList(process.env.ADMIN_EMAIL, [
      "zoyamuhammad8295@gmail.com",
      "bhaia9036@gmail.com",
    ]),
  },
  dashboard: {
    emails: parseList(
      process.env.DASHBOARD_EMAIL ?? process.env.ADMIN_EMAIL,
      ["admin@bergenmotors.com"]
    ).map((email) => email.toLowerCase()),
    password: required(process.env.DASHBOARD_PASSWORD, "DASHBOARD_PASSWORD"),
    secret: required(process.env.DASHBOARD_SECRET, "DASHBOARD_SECRET"),
  },
} as const;

export function isEmailConfigured(): boolean {
  return Boolean(env.email.host && env.email.user && env.email.pass);
}
