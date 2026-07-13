import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createStageSubmission,
  deleteStageSubmission,
  getStageSubmissionsByIdStage,
  getStageSubmissionsByIdTeam,
  updateStageSubmission,
} from "../controllers/stageSubmissionController.js";
import multer from "multer";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

router.post(
  "/createStageSubmission",
  verifyToken,
  upload.single("submission_link"),
  createStageSubmission,
);
router.get(
  "/getStageSubmissionsByIdStage/:id_stage",
  verifyToken,
  getStageSubmissionsByIdStage,
);
router.get(
  "/getStageSubmissionsByIdTeam/:id_team",
  verifyToken,
  getStageSubmissionsByIdTeam,
);
router.put(
  "/updateStageSubmission/:id",
  verifyToken,
  upload.single("submission_link"),
  updateStageSubmission,
);
router.delete("/deleteStageSubmission/:id", verifyToken, deleteStageSubmission);

export default router;
