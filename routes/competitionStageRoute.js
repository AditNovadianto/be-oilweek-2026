import express from "express";
import { requireInternalUser, verifyToken } from "../middleware/auth.js";
import {
  createCompetitionStage,
  deleteCompetitionStage,
  getCompetitionStagesByIdCompetition,
  updateCompetitionStage,
} from "../controllers/competitionStageController.js";
import {
  requireCompetitionBodyAccess,
  requireCompetitionParamAccess,
  requireStageParamAccess,
} from "../middleware/resourceAccess.js";

const router = express.Router();

router.post(
  "/createStage",
  verifyToken,
  requireInternalUser,
  requireCompetitionBodyAccess,
  createCompetitionStage,
);
router.get(
  "/getStagesByIdCompetition/:id_competition",
  verifyToken,
  requireCompetitionParamAccess,
  getCompetitionStagesByIdCompetition,
);
router.put(
  "/updateStage/:id",
  verifyToken,
  requireInternalUser,
  requireStageParamAccess,
  requireCompetitionBodyAccess,
  updateCompetitionStage,
);
router.delete(
  "/deleteStage/:id",
  verifyToken,
  requireInternalUser,
  requireStageParamAccess,
  deleteCompetitionStage,
);

export default router;
