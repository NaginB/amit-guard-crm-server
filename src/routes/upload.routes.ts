import { Router } from "express";
import { protect } from "../middleware/auth";
import {
  uploadSingleHandler,
  deleteUploadHandler,
} from "../controllers/upload.controller";

const router = Router();
router.use(protect);

router.post("/single", uploadSingleHandler);
router.post("/delete", deleteUploadHandler);

export default router;
