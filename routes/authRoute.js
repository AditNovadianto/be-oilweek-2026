import express from "express";
import {
  forgotPassword,
  getAllUsers,
  resetPassword,
  signIn,
  signUp,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/signUpUser", signUp);
router.post("/signInUser", signIn);
router.get("/getAllUsers", verifyToken, getAllUsers);
router.post("/user/forgot-password", forgotPassword);
router.post("/user/reset-password/:token", resetPassword);

export default router;
