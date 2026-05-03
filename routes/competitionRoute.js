import express from "express";
import {
  createCompetition,
  deleteCompetition,
  getAllCompetitions,
  updateCompetition,
} from "../controllers/competitionController.js";

const router = express.Router();

router.post("/createCompetition", createCompetition);
router.get("/getAllCompetitions", getAllCompetitions);
router.put("/updateCompetition/:id", updateCompetition);
router.delete("/deleteCompetition/:id", deleteCompetition);

export default router;
