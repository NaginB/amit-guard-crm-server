import { Router } from "express";
import { loginHandler } from "../controllers/auth.controller";
import { guardLoginHandler } from "../controllers/guardAuth.controller";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validations/admin.validation";
import { guardLoginSchema } from "../validations/guardLogin.validation";

const router = Router();

// Admin login
router.post("/login", validate(loginSchema), loginHandler);

// Guard login
router.post("/guard/login", validate(guardLoginSchema), guardLoginHandler);

export default router;
