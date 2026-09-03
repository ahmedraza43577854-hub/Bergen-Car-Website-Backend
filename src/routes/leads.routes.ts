import { Router } from "express";
import { leadsController } from "../controllers/leads.controller";
import { validate } from "../middleware/validate";
import { createLeadBodySchema } from "../validators/leads.validator";

const router = Router();

router.post("/", validate(createLeadBodySchema), leadsController.create);

export default router;
