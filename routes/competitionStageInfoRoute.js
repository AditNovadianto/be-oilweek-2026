import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createCompetitionStageInfo,
  deleteCompetitionStageInfo,
  getAllCompetitionStageInfos,
  getCompetitionStageInfoByStageId,
  updateCompetitionStageInfo,
} from "../controllers/competitionStageInfoController.js";

const router = express.Router();

router.post(
  "/createCompetitionStageInfo",
  verifyToken,
  createCompetitionStageInfo,
);
router.get(
  "/getAllCompetitionStageInfos",
  verifyToken,
  getAllCompetitionStageInfos,
);
router.get(
  "/getCompetitionStageInfoByStageId/:id_stage",
  verifyToken,
  getCompetitionStageInfoByStageId,
);
router.put(
  "/updateCompetitionStageInfo/:id",
  verifyToken,
  updateCompetitionStageInfo,
);
router.delete(
  "/deleteCompetitionStageInfo/:id",
  verifyToken,
  deleteCompetitionStageInfo,
);

export default router;
