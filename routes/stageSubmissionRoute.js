import express from "express";
import multer from "multer";
import os from "node:os";

import {
  requireInternalUser,
  requireTeamLeader,
  verifyToken,
} from "../middleware/auth.js";

import {
  createStageSubmission,
  deleteStageSubmission,
  getStageSubmissionsByIdStage,
  getStageSubmissionsByIdTeam,
  updateStageSubmission,
} from "../controllers/stageSubmissionController.js";

import {
  requireStageBodyAccess,
  requireStageRouteParamAccess,
  requireSubmissionParamAccess,
  requireTeamBodyAccess,
  requireTeamRouteParamAccess,
} from "../middleware/resourceAccess.js";

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, os.tmpdir());
    },

    filename: (req, file, cb) => {
      const extension = file.originalname
        .substring(file.originalname.lastIndexOf("."))
        .toLowerCase();

      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;

      cb(null, uniqueName);
    },
  }),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

router.post(
  "/createStageSubmission",
  verifyToken,
  requireTeamLeader,
  upload.single("submission_link"),
  requireStageBodyAccess,
  requireTeamBodyAccess,
  createStageSubmission,
);

router.get(
  "/getStageSubmissionsByIdStage/:id_stage",
  verifyToken,
  requireInternalUser,
  requireStageRouteParamAccess,
  getStageSubmissionsByIdStage,
);

router.get(
  "/getStageSubmissionsByIdTeam/:id_team",
  verifyToken,
  requireTeamRouteParamAccess,
  getStageSubmissionsByIdTeam,
);

router.put(
  "/updateStageSubmission/:id",
  verifyToken,
  requireSubmissionParamAccess,
  upload.single("submission_link"),
  updateStageSubmission,
);

router.delete(
  "/deleteStageSubmission/:id",
  verifyToken,
  requireSubmissionParamAccess,
  deleteStageSubmission,
);

export default router;
