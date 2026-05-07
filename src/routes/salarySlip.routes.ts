import { Router } from "express";
import { SalarySlipController } from "../controllers/salarySlip.controller";
import { protect } from "../middleware/auth";

const router = Router();

// Apply authentication middleware
router.use(protect);

// Generate salary slip
router.get(
  "/:guardId/:siteId",
  SalarySlipController.generateSalarySlip
);

export default router;

