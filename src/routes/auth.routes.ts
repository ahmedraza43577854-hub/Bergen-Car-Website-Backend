import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";
import { validate } from "../middleware/validate";
import { loginBodySchema } from "../validators/auth.validator";

const router = Router();

router.post("/login", validate(loginBodySchema), authController.login);
router.get("/me", requireAuth, authController.me);

export default router;
