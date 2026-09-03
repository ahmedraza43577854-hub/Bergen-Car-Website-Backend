import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { authService } from "../services/auth.service";

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = authService.login(req.validatedBody!);
    res.json(result);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    res.json({ email: req.dashboardEmail });
  });
}

export const authController = new AuthController();
