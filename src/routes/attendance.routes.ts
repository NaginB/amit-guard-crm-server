import { Router } from "express";
import { AttendanceController } from "../controllers/attendance.controller";
import { protect } from "../middleware/auth";
import { guardProtect } from "../middleware/guardAuth";
import { validate } from "../middleware/validate";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  bulkUpdateAttendanceSchema,
  getAttendanceSchema,
  getAttendanceCalendarSchema,
  getAttendanceAnalyticsSchema,
  createAttendanceWithPhotoSchema,
} from "../validations/attendance.validation";

const router = Router();

// Photo-based attendance route - allows both admin and guard authentication
router.post(
  "/photo",
  guardProtect,
  validate(createAttendanceWithPhotoSchema),
  AttendanceController.createAttendanceWithPhoto
);

// Apply admin authentication middleware to rest of routes
router.use(protect);

// Attendance CRUD routes
router.post(
  "/",
  validate(createAttendanceSchema),
  AttendanceController.createAttendance
);

router.get(
  "/",
  validate(getAttendanceSchema),
  AttendanceController.getAttendance
);

router.get(
  "/analytics",
  validate(getAttendanceAnalyticsSchema),
  AttendanceController.getAttendanceAnalytics
);

router.get("/assignments", AttendanceController.getProjectAssignments);

router.get("/guard/:guardId", AttendanceController.getAttendanceByGuard);

router.get("/project/:projectId", AttendanceController.getAttendanceByProject);

router.get(
  "/calendar/:guardId/:siteId/monthly",
  AttendanceController.getMonthlyAttendanceCalendar
);

router.get(
  "/calendar/:guardId/:projectId",
  validate(getAttendanceCalendarSchema),
  AttendanceController.getAttendanceCalendar
);

router.get("/:id", AttendanceController.getAttendanceById);

router.put(
  "/:id",
  validate(updateAttendanceSchema),
  AttendanceController.updateAttendance
);

router.patch(
  "/bulk",
  validate(bulkUpdateAttendanceSchema),
  AttendanceController.bulkUpdateAttendance
);

router.delete("/:id", AttendanceController.deleteAttendance);

export default router;
