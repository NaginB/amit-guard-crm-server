import { Router } from "express";
import {
  createInventory,
  getAllInventories,
  getActiveInventories,
  getInventoryById,
  updateInventory,
  deleteInventory,
  syncInventoryQuantities,
  checkInventoryAssignment,
} from "../controllers/inventory.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createInventoryValidation,
  updateInventoryValidation,
} from "../validations/inventory.validation";

const router = Router();

// All inventory routes require authentication
router.use(protect);

// CRUD routes for inventories
router.post("/", validate(createInventoryValidation), createInventory);

router.get("/", getAllInventories);

router.get("/active", getActiveInventories);

router.get("/:id", getInventoryById);

router.put("/:id", validate(updateInventoryValidation), updateInventory);

router.delete("/:id", deleteInventory);

// Sync inventory quantities with guard assignments
router.post("/sync", syncInventoryQuantities);

// Check if inventory is assigned to guards
router.get("/:id/assignment", checkInventoryAssignment);

export default router;
