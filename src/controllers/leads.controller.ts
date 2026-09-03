import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { leadsService } from "../services/leads.service";

export class LeadsController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const result = await leadsService.submit(req.validatedBody!);
    res.status(201).json(result);
  });
}

export const leadsController = new LeadsController();
