import express from "express";
import { verifyToken } from "../middleware/auth.js";
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
  upload.fields([{ name: "payment_proof", maxCount: 1 }]),
  createRegistration,
);
router.get("/getAllRegistrations", verifyToken, getAllRegistrations);
router.get(
  "/getRegistrationByIdTeamLeader/:id_team_leader",
  verifyToken,
  getRegistrationByIdTeamLeader,
);
router.put(
  "/updateRegistration/:id",
  verifyToken,
  upload.fields([{ name: "payment_proof", maxCount: 1 }]),
  updateRegistration,
);
router.delete("/deleteRegistration/:id", verifyToken, deleteRegistration);

export default router;
