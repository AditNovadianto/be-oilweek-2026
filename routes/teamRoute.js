import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createTeam,
  deleteTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
} from "../controllers/teamController.js";

const router = express.Router();

router.post("/createTeam", verifyToken, createTeam);
router.get("/getAllTeams", verifyToken, getAllTeams);
router.get("/getTeamById/:id_team_leader", verifyToken, getTeamById);
router.put("/updateTeam/:id", verifyToken, updateTeam);
router.delete("/deleteTeam/:id", verifyToken, deleteTeam);

export default router;
