import { Router } from "express";
import * as quickBillController from "../controllers/quickBill.controller";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

// Protect all routes
router.use(protect);

// Only admin can access these routes
router.use(restrictTo("admin"));

router
  .route("/")
  .get(quickBillController.getAllQuickBills)
  .post(quickBillController.createQuickBill);

router
  .route("/:id")
  .get(quickBillController.getQuickBill)
  .put(quickBillController.updateQuickBill)
  .delete(quickBillController.deleteQuickBill);

export default router;
