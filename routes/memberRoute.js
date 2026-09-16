import express from "express";
import { requireInternalUser, verifyToken } from "../middleware/auth.js";
import {
  createMember,
  deleteMember,
  getAllMemberById,
  getAllMembers,
  updateMember,
} from "../controllers/memberController.js";
import multer from "multer";
import {
  requireMemberParamAccess,
  requireTeamBodyAccess,
  requireTeamRouteParamAccess,
} from "../middleware/resourceAccess.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.post(
  "/createMember",
  verifyToken,
  upload.fields([
    { name: "twibbon", maxCount: 1 },
    { name: "following_instagram", maxCount: 1 },
    { name: "following_linkedin", maxCount: 1 },
    { name: "following_tiktok", maxCount: 1 },
    { name: "instagram_story", maxCount: 1 },
    { name: "repost_competition_instagram", maxCount: 1 },
  ]),
  requireTeamBodyAccess,
  createMember,
);
router.get("/getAllMembers", verifyToken, requireInternalUser, getAllMembers);
router.get(
  "/getAllMemberById/:id_team",
  verifyToken,
  requireTeamRouteParamAccess,
  getAllMemberById,
);
router.put(
  "/updateMember/:id",
  verifyToken,
  requireMemberParamAccess,
  upload.fields([
    { name: "twibbon", maxCount: 1 },
    { name: "following_instagram", maxCount: 1 },
    { name: "following_linkedin", maxCount: 1 },
    { name: "following_tiktok", maxCount: 1 },
    { name: "instagram_story", maxCount: 1 },
    { name: "repost_competition_instagram", maxCount: 1 },
  ]),
  updateMember,
);
router.delete(
  "/deleteMember/:id",
  verifyToken,
  requireMemberParamAccess,
  deleteMember,
);

export default router;
