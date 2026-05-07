import { Router } from "express";
import { WeeklyOffController } from "../controllers/weeklyOff.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  upsertWeeklyOffSchema,
  getWeeklyOffSchema,
  updateWeeklyOffSchema,
  deleteWeeklyOffSchema,
} from "../validations/weeklyOff.validation";

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Weekly off configuration routes
router.post(
  "/",
  validate(upsertWeeklyOffSchema),
  WeeklyOffController.upsertWeeklyOff
);
router.get(
  "/:guardId/:projectId",
  validate(getWeeklyOffSchema),
  WeeklyOffController.getWeeklyOff
);
router.put(
  "/:guardId/:projectId",
  validate(updateWeeklyOffSchema),
  WeeklyOffController.updateWeeklyOff
);
router.delete(
  "/:guardId/:projectId",
  validate(deleteWeeklyOffSchema),
  WeeklyOffController.deleteWeeklyOff
);

export default router;

