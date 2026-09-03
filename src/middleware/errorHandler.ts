import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(err.fields ? { fields: err.fields } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.map(String).join(".") || "_root";
      if (!fields[key]) fields[key] = issue.message;
    }
    res.status(400).json({
      success: false,
      error: Object.values(fields).join(", ") || "Validation failed",
      code: "VALIDATION_ERROR",
      fields,
    });
    return;
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    console.error("Database error:", err);
    res.status(503).json({
      success: false,
      error: "Unable to save your request right now. Please try again shortly.",
      code: "DATABASE_UNAVAILABLE",
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: "Something went wrong. Please try again.",
    code: "INTERNAL_ERROR",
  });
}
