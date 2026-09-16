import express from "express";
import {
  requireInternalUser,
  requireTeamLeader,
  verifyToken,
} from "../middleware/auth.js";
import {
  createStageSubmission,
  deleteStageSubmission,
  getStageSubmissionsByIdStage,
  getStageSubmissionsByIdTeam,
  updateStageSubmission,
} from "../controllers/stageSubmissionController.js";
import multer from "multer";
import {
  requireStageBodyAccess,
  requireStageRouteParamAccess,
  requireSubmissionParamAccess,
  requireTeamBodyAccess,
  requireTeamRouteParamAccess,
} from "../middleware/resourceAccess.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

router.post(
  "/createStageSubmission",
  verifyToken,
  requireTeamLeader,
  upload.single("submission_link"),
  requireStageBodyAccess,
  requireTeamBodyAccess,
  createStageSubmission,
);
router.get(
  "/getStageSubmissionsByIdStage/:id_stage",
  verifyToken,
  requireInternalUser,
  requireStageRouteParamAccess,
  getStageSubmissionsByIdStage,
);
router.get(
  "/getStageSubmissionsByIdTeam/:id_team",
  verifyToken,
  requireTeamRouteParamAccess,
  getStageSubmissionsByIdTeam,
);
router.put(
  "/updateStageSubmission/:id",
  verifyToken,
  requireSubmissionParamAccess,
  upload.single("submission_link"),
  updateStageSubmission,
);
router.delete(
  "/deleteStageSubmission/:id",
  verifyToken,
  requireSubmissionParamAccess,
  deleteStageSubmission,
);

export default router;
