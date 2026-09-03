import { Router } from "express";
import { newsletterController } from "../controllers/newsletter.controller";
import { validate } from "../middleware/validate";
import { subscribeBodySchema } from "../validators/newsletter.validator";

const router = Router();

router.post("/", validate(subscribeBodySchema), newsletterController.subscribe);

export default router;
