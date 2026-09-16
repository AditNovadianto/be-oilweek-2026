import express from "express";
import {
  requireInternalUser,
  requireTeamLeader,
  verifyToken,
} from "../middleware/auth.js";
import multer from "multer";
import {
  createRegistration,
  deleteRegistration,
  getAllRegistrations,
  getRegistrationByIdTeamLeader,
  updateRegistration,
} from "../controllers/registrationController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.post(
  "/createRegistration",
  verifyToken,
  requireTeamLeader,
  upload.fields([{ name: "payment_proof", maxCount: 1 }]),
  createRegistration,
);
router.get(
  "/getAllRegistrations",
  verifyToken,
  requireInternalUser,
  getAllRegistrations,
);
router.get(
  "/getRegistrationByIdTeamLeader/:id_team_leader",
  verifyToken,
  getRegistrationByIdTeamLeader,
);
router.put(
  "/updateRegistration/:id",
  verifyToken,
  requireInternalUser,
  upload.fields([{ name: "payment_proof", maxCount: 1 }]),
  updateRegistration,
);
router.delete(
  "/deleteRegistration/:id",
  verifyToken,
  requireInternalUser,
  deleteRegistration,
);

export default router;
