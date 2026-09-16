import express from "express";
import {
  createCompetition,
  deleteCompetition,
  getAllCompetitions,
  updateCompetition,
} from "../controllers/competitionController.js";
import { requireGlobalAdmin, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/createCompetition",
  verifyToken,
  requireGlobalAdmin,
  createCompetition,
);
router.get("/getAllCompetitions", verifyToken, getAllCompetitions);
router.put(
  "/updateCompetition/:id",
  verifyToken,
  requireGlobalAdmin,
  updateCompetition,
);
router.delete(
  "/deleteCompetition/:id",
  verifyToken,
  requireGlobalAdmin,
  deleteCompetition,
);

export default router;
