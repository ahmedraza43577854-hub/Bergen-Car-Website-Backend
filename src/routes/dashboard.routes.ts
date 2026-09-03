import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/requireAuth";
import { validate } from "../middleware/validate";
import { dashboardFilterQuerySchema, dashboardInquiriesQuerySchema } from "../validators/dashboard.validator";

const router = Router();

router.use(requireAuth);
router.get("/stats", dashboardController.stats);
router.get(
  "/export",
  validate(dashboardFilterQuerySchema, "query"),
  dashboardController.exportCsv
);
router.get(
  "/export/pdf",
  validate(dashboardFilterQuerySchema, "query"),
  dashboardController.exportPdf
);
router.get(
  "/inquiries",
  validate(dashboardInquiriesQuerySchema, "query"),
  dashboardController.inquiries
);

export default router;
