import { Router } from "express";
import {
  createGuardHandler,
  getAllGuardsHandler,
  getGuardHandler,
  updateGuardHandler,
  deleteGuardHandler,
} from "../controllers/guard.controller";
import { validate } from "../middleware/validate";
import {
  createGuardSchema,
  updateGuardSchema,
  getGuardSchema,
  deleteGuardSchema,
} from "../validations/guard.validation";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

router.post("/", validate(createGuardSchema), createGuardHandler);
router.get("/", getAllGuardsHandler);
router.get("/:guardId", validate(getGuardSchema), getGuardHandler);
router.patch("/:guardId", validate(updateGuardSchema), updateGuardHandler);
router.delete("/:guardId", validate(deleteGuardSchema), deleteGuardHandler);

export default router;
