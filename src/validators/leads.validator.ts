import { z } from "zod";

export const LEAD_TYPES = [
  "contact",
  "location-contact",
  "sell",
  "trade",
  "financing",
  "service",
  "test-drive",
] as const;

export type LeadType = (typeof LEAD_TYPES)[number];

const optionalText = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

const nameField = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(2, "Name is required")
  .max(120, "Name is too long");

const contactFields = {
  name: nameField,
  email: optionalText,
  phone: optionalText,
};

function addEmailOrPhoneIssue(
  data: { email?: string; phone?: string },
  ctx: z.RefinementCtx
) {
  const email = data.email?.trim() ?? "";
  const phoneDigits = (data.phone ?? "").replace(/\D/g, "");
  const emailOk = email.length > 0 && z.string().email().safeParse(email).success;
  const phoneOk = phoneDigits.length >= 10;

  if (emailOk || phoneOk) {
    if (email.length > 0 && !emailOk && !phoneOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A valid email is required",
        path: ["email"],
      });
    }
    if ((data.phone ?? "").trim().length > 0 && !phoneOk && !emailOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A valid phone number is required",
        path: ["phone"],
      });
    }
    return;
  }

  if (email.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A valid email is required",
      path: ["email"],
    });
  }
  if ((data.phone ?? "").trim().length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A valid phone number is required",
      path: ["phone"],
    });
  }
  if (email.length === 0 && (data.phone ?? "").trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email or phone is required",
      path: ["email"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email or phone is required",
      path: ["phone"],
    });
  }
}

const requiredText = (message: string) =>
  z
    .string({ required_error: message })
    .trim()
    .min(1, message)
    .max(200, message);

const contactSchema = z.object({
  type: z.literal("contact"),
  ...contactFields,
  message: optionalText,
  topic: optionalText,
});

const locationContactSchema = z.object({
  type: z.literal("location-contact"),
  ...contactFields,
  message: optionalText,
});

const vehicleLeadFields = {
  year: requiredText("Year is required"),
  make: requiredText("Make is required"),
  model: requiredText("Model is required"),
  mileage: requiredText("Mileage is required"),
  condition: requiredText("Condition is required"),
  trim: optionalText,
  vin: optionalText,
  zip: optionalText,
};

const sellSchema = z.object({
  type: z.literal("sell"),
  ...contactFields,
  ...vehicleLeadFields,
});

const tradeSchema = z.object({
  type: z.literal("trade"),
  ...contactFields,
  ...vehicleLeadFields,
});

const financingSchema = z.object({
  type: z.literal("financing"),
  ...contactFields,
  employment: requiredText("Employment status is required"),
  income: requiredText("Income is required"),
  housing: requiredText("Housing status is required"),
  credit: requiredText("Credit range is required"),
});

const appointmentFields = {
  date: requiredText("Date is required"),
  time: requiredText("Time is required"),
};

const serviceSchema = z.object({
  type: z.literal("service"),
  ...contactFields,
  ...appointmentFields,
  year: optionalText,
  make: optionalText,
  model: optionalText,
  details: optionalText,
});

const testDriveSchema = z.object({
  type: z.literal("test-drive"),
  ...contactFields,
  ...appointmentFields,
  notes: optionalText,
  vehicleId: optionalText,
  vehicleYear: optionalText,
  vehicleMake: optionalText,
  vehicleModel: optionalText,
  vehicleTrim: optionalText,
});

export const createLeadBodySchema = z
  .discriminatedUnion("type", [
    contactSchema,
    locationContactSchema,
    sellSchema,
    tradeSchema,
    financingSchema,
    serviceSchema,
    testDriveSchema,
  ])
  .superRefine(addEmailOrPhoneIssue);

export type CreateLeadBody = z.infer<typeof createLeadBodySchema>;
