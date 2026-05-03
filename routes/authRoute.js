import express from "express";
import { getAllUsers, signIn, signUp } from "../controllers/authController.js";

const router = express.Router();

router.post("/signUpUser", signUp);
router.post("/signInUser", signIn);
router.get("/getAllUsers", getAllUsers);

export default router;
