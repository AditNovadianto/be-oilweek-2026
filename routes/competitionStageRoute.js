import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createCompetitionStage,
  deleteCompetitionStage,
  getCompetitionStagesByIdCompetition,
  updateCompetitionStage,
} from "../controllers/competitionStageController.js";

const router = express.Router();

router.post("/createStage", verifyToken, createCompetitionStage);
router.get(
  "/getStagesByIdCompetition/:id_competition",
  verifyToken,
  getCompetitionStagesByIdCompetition,
);
router.put("/updateStage/:id", verifyToken, updateCompetitionStage);
router.delete("/deleteStage/:id", verifyToken, deleteCompetitionStage);

export default router;
