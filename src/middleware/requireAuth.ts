import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/AppError";
import { verifyDashboardToken } from "../lib/token";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    next(new UnauthorizedError("Please sign in to view inquiries."));
    return;
  }

  try {
    req.dashboardEmail = verifyDashboardToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
