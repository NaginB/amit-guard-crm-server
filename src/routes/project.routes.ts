import { Router } from "express";
import {
  createProjectHandler,
  getAllProjectsHandler,
  getProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  getProjectsByGuardHandler,
  getProjectsBySiteHandler,
  getProjectStatsHandler,
  getGuardsByProject,
} from "../controllers/project.controller";
import { validate } from "../middleware/validate";
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectSchema,
  deleteProjectSchema,
  getAllProjectsSchema,
  getProjectsByGuardSchema,
  getProjectsBySiteSchema,
} from "../validations/project.validation";
import { protect } from "../middleware/auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Project CRUD routes
router.post("/", validate(createProjectSchema), createProjectHandler);
router.get("/", validate(getAllProjectsSchema), getAllProjectsHandler);
router.get("/stats", getProjectStatsHandler);
router.get("/:projectId", validate(getProjectSchema), getProjectHandler);
router.patch(
  "/:projectId",
  validate(updateProjectSchema),
  updateProjectHandler
);
router.delete(
  "/:projectId",
  validate(deleteProjectSchema),
  deleteProjectHandler
);

// Project relationship routes
router.get(
  "/guard/:guardId",
  validate(getProjectsByGuardSchema),
  getProjectsByGuardHandler
);
router.get(
  "/site/:siteId",
  validate(getProjectsBySiteSchema),
  getProjectsBySiteHandler
);

// Get guards by project
router.get(
  "/:projectId/guards",
  validate(getProjectSchema),
  getGuardsByProject
);

export default router;
