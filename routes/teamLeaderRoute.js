import express from "express";
import {
  getAllTeamLeaders,
  signIn,
  signUp,
} from "../controllers/teamLeaderController.js";
import multer from "multer";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.post(
  "/signUpTeamLeader",
  upload.fields([
    { name: "twibbon", maxCount: 1 },
    { name: "following_instagram", maxCount: 1 },
    { name: "following_linkedin", maxCount: 1 },
    { name: "following_tiktok", maxCount: 1 },
    { name: "instagram_story", maxCount: 1 },
    { name: "repost_competition_instagram", maxCount: 1 },
  ]),
  signUp,
);
router.post("/signInTeamLeader", signIn);
router.get("/getAllTeamLeaders", verifyToken, getAllTeamLeaders);

export default router;
