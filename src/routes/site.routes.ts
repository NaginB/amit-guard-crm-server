import { Router } from "express";
import {
  createSite,
  getAllSites,
  getActiveSites,
  getSiteById,
  updateSite,
  deleteSite,
  searchSites,
  filterSitesByType,
  filterSitesByCity,
} from "../controllers/site.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createSiteValidation,
  updateSiteValidation,
} from "../validations/site.validation";

const router = Router();

// All site routes require authentication
router.use(protect);

// CRUD routes for sites
router.post("/", validate(createSiteValidation), createSite);

router.get("/", getAllSites);

router.get("/active", getActiveSites);

router.get("/search", searchSites);

router.get("/filter/type", filterSitesByType);

router.get("/filter/city", filterSitesByCity);

router.get("/:id", getSiteById);

router.put("/:id", validate(updateSiteValidation), updateSite);

router.delete("/:id", deleteSite);

export default router;
