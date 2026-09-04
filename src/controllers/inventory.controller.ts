import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { inventoryService } from "../services/inventory.service";

export class InventoryController {
  list = asyncHandler(async (_req: Request, res: Response) => {
    const data = await inventoryService.getInventory();
    res.json({ data });
  });

  rating = asyncHandler(async (_req: Request, res: Response) => {
    const data = await inventoryService.getRating();
    res.json({ data });
  });
}

export const inventoryController = new InventoryController();
