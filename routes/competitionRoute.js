import express from "express";
import {
  createCompetition,
  deleteCompetition,
  getAllCompetitions,
  updateCompetition,
} from "../controllers/competitionController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/createCompetition", verifyToken, createCompetition);
router.get("/getAllCompetitions", verifyToken, getAllCompetitions);
router.put("/updateCompetition/:id", verifyToken, updateCompetition);
router.delete("/deleteCompetition/:id", verifyToken, deleteCompetition);

export default router;
