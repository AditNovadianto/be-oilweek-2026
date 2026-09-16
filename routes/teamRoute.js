import express from "express";
import {
  requireInternalUser,
  requireTeamLeader,
  verifyToken,
} from "../middleware/auth.js";
import {
  requireTeamLeaderParamAccess,
  requireTeamParamAccess,
} from "../middleware/resourceAccess.js";
import {
  createTeam,
  deleteTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
} from "../controllers/teamController.js";

const router = express.Router();

router.post("/createTeam", verifyToken, requireTeamLeader, createTeam);
router.get("/getAllTeams", verifyToken, requireInternalUser, getAllTeams);
router.get(
  "/getTeamById/:id_team_leader",
  verifyToken,
  requireTeamLeaderParamAccess,
  getTeamById,
);
router.put(
  "/updateTeam/:id",
  verifyToken,
  requireTeamParamAccess,
  updateTeam,
);
router.delete(
  "/deleteTeam/:id",
  verifyToken,
  requireTeamParamAccess,
  deleteTeam,
);

export default router;
