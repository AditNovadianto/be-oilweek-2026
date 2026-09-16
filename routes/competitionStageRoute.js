import express from "express";
import { requireInternalUser, verifyToken } from "../middleware/auth.js";
import {
  createCompetitionStage,
  deleteCompetitionStage,
  getCompetitionStagesByIdCompetition,
  updateCompetitionStage,
} from "../controllers/competitionStageController.js";

const router = express.Router();

router.post(
  "/createStage",
  verifyToken,
  requireInternalUser,
  createCompetitionStage,
);
router.get(
  "/getStagesByIdCompetition/:id_competition",
  verifyToken,
  getCompetitionStagesByIdCompetition,
);
router.put(
  "/updateStage/:id",
  verifyToken,
  requireInternalUser,
  updateCompetitionStage,
);
router.delete(
  "/deleteStage/:id",
  verifyToken,
  requireInternalUser,
  deleteCompetitionStage,
);

export default router;
