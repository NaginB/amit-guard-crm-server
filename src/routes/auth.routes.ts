import { Router } from "express";
import { loginHandler, getMeHandler } from "../controllers/auth.controller";
import { protect } from "../middleware/auth";
import { guardLoginHandler } from "../controllers/guardAuth.controller";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validations/admin.validation";
import { guardLoginSchema } from "../validations/guardLogin.validation";

const router = Router();

// Admin login
router.post("/login", validate(loginSchema), loginHandler);

// Get current admin user
router.get("/me", protect, getMeHandler);

// Guard login
router.post("/guard/login", validate(guardLoginSchema), guardLoginHandler);

export default router;
