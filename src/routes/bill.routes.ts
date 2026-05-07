import { Router } from "express";
import { BillController } from "../controllers/bill.controller";
import { protect } from "../middleware/auth";

const router = Router();

// Get all bills for a project
// Apply authentication middleware
router.use(protect);

router.get("/project/:projectId", BillController.getBillsByProject);

// Generate bill for a project
router.post("/:projectId/generate", BillController.generateBill);

// Get bill by ID
router.get("/:billId", BillController.getBillById);

// Get all bills for a project
router.get("/project/:projectId", BillController.getBillsByProject);

// Update bill status
router.patch("/:billId/status", BillController.updateBillStatus);

// Update bill details
router.patch("/:billId", BillController.updateBillDetails);

// Delete bill
router.delete("/:billId", BillController.deleteBill);

// Send bill via email
router.post("/:billId/send-email", BillController.sendBillEmail);

export default router;
