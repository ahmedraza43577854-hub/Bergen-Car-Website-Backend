import { z } from "zod";

export const loginBodySchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("A valid email is required")
    .max(254, "Email is too long"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .max(200, "Password is too long"),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
