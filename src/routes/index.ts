import { Router } from "express";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import inventoryRoutes from "./inventory.routes";
import leadsRoutes from "./leads.routes";
import newsletterRoutes from "./newsletter.routes";
import { inventoryController } from "../controllers/inventory.controller";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/inventory", inventoryRoutes);
router.get("/rating", inventoryController.rating);
router.use("/leads", leadsRoutes);
router.use("/newsletter", newsletterRoutes);

export default router;
