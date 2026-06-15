import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  createRole,
  deleteRole,
  getAllRoles,
  updateRole,
} from "../controllers/roleController.js";

const router = express.Router();

router.post("/createRole", verifyToken, createRole);
router.get("/getAllRoles", getAllRoles);
router.put("/updateRole/:id", verifyToken, updateRole);
router.delete("/deleteRole/:id", verifyToken, deleteRole);

export default router;
