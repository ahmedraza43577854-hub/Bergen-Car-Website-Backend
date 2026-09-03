import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { dashboardService } from "../services/dashboard.service";

export class DashboardController {
  stats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await dashboardService.stats();
    res.json(stats);
  });

  inquiries = asyncHandler(async (req: Request, res: Response) => {
    const result = await dashboardService.list(req.validatedQuery!);
    res.json(result);
  });

  exportCsv = asyncHandler(async (req: Request, res: Response) => {
    const csv = await dashboardService.exportCsv(req.validatedQuery!);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bergen-inquiries-${stamp}.csv"`
    );
    res.send(csv);
  });

  exportPdf = asyncHandler(async (req: Request, res: Response) => {
    const pdf = await dashboardService.exportPdf(req.validatedQuery!);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bergen-inquiries-${stamp}.pdf"`
    );
    res.send(pdf);
  });
}

export const dashboardController = new DashboardController();
