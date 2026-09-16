import express from "express";
import {
  forgotPassword,
  getAllTeamLeaders,
  resetPassword,
  signIn,
  signUp,
  uploadProfileController,
} from "../controllers/teamLeaderController.js";
import multer from "multer";
import {
  requireInternalUser,
  requireTeamLeader,
  verifyToken,
} from "../middleware/auth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.post("/signUpTeamLeader", signUp);
router.post("/signInTeamLeader", signIn);
router.get(
  "/getAllTeamLeaders",
  verifyToken,
  requireInternalUser,
  getAllTeamLeaders,
);
router.put(
  "/team-leader/profile/upload",
  verifyToken,
  requireTeamLeader,
  upload.fields([
    { name: "twibbon", maxCount: 1 },
    { name: "following_instagram", maxCount: 1 },
    { name: "following_linkedin", maxCount: 1 },
    { name: "following_tiktok", maxCount: 1 },
    { name: "instagram_story", maxCount: 1 },
    { name: "repost_competition_instagram", maxCount: 1 },
  ]),
  uploadProfileController,
);
router.post("/team-leader/forgot-password", forgotPassword);
router.post("/team-leader/reset-password/:token", resetPassword);

export default router;
