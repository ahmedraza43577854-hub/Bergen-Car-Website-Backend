import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { newsletterService } from "../services/newsletter.service";

export class NewsletterController {
  subscribe = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.validatedBody!;
    const result = await newsletterService.subscribe(email);
    res.status(201).json(result);
  });
}

export const newsletterController = new NewsletterController();
