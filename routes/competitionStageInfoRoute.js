import express from "express";
import { requireInternalUser, verifyToken } from "../middleware/auth.js";
import {
  createCompetitionStageInfo,
  deleteCompetitionStageInfo,
  getAllCompetitionStageInfos,
  getCompetitionStageInfoByStageId,
  updateCompetitionStageInfo,
} from "../controllers/competitionStageInfoController.js";
import {
  requireStageBodyAccess,
  requireStageInfoParamAccess,
  requireStageRouteParamAccess,
} from "../middleware/resourceAccess.js";

const router = express.Router();

router.post(
  "/createCompetitionStageInfo",
  verifyToken,
  requireInternalUser,
  requireStageBodyAccess,
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
  requireStageRouteParamAccess,
  getCompetitionStageInfoByStageId,
);
router.put(
  "/updateCompetitionStageInfo/:id",
  verifyToken,
  requireStageInfoParamAccess,
  requireStageBodyAccess,
  updateCompetitionStageInfo,
);
router.delete(
  "/deleteCompetitionStageInfo/:id",
  verifyToken,
  requireInternalUser,
  requireStageInfoParamAccess,
  deleteCompetitionStageInfo,
);

export default router;
