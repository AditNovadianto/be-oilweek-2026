import express from "express";
import {
  forgotPassword,
  getAllUsers,
  resetPassword,
  signIn,
  signUp,
} from "../controllers/authController.js";
import {
  requireGlobalAdmin,
  verifyToken,
} from "../middleware/auth.js";

const router = express.Router();

router.post("/signUpUser", verifyToken, requireGlobalAdmin, signUp);
router.post("/signInUser", signIn);
router.get("/getAllUsers", verifyToken, requireGlobalAdmin, getAllUsers);
router.post("/user/forgot-password", forgotPassword);
router.post("/user/reset-password/:token", resetPassword);

export default router;
