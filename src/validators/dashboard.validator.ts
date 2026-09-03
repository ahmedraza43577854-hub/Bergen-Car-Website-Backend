import { z } from "zod";
import { LEAD_TYPES } from "./leads.validator";

export const DASHBOARD_FORM_FILTERS = ["all", ...LEAD_TYPES, "newsletter"] as const;
export type DashboardFormFilter = (typeof DASHBOARD_FORM_FILTERS)[number];

const optionalDate = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value).trim();
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional());

export const dashboardFilterQuerySchema = z.object({
  type: z.enum(DASHBOARD_FORM_FILTERS).optional().default("all"),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined)),
  from: optionalDate,
  to: optionalDate,
});

export const dashboardInquiriesQuerySchema = dashboardFilterQuerySchema.extend({
  page: z.preprocess(
    (value) => (value === undefined || value === "" ? 1 : Number(value)),
    z.number().int().min(1)
  ),
  limit: z.preprocess(
    (value) => (value === undefined || value === "" ? 25 : Number(value)),
    z.number().int().min(1).max(100)
  ),
});

export type DashboardFilterQuery = z.infer<typeof dashboardFilterQuerySchema>;
export type DashboardInquiriesQuery = z.infer<typeof dashboardInquiriesQuerySchema>;
