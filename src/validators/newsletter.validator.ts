import { z } from "zod";

export const subscribeBodySchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("A valid email is required")
    .max(254, "Email is too long"),
});

export type SubscribeBody = z.infer<typeof subscribeBodySchema>;
