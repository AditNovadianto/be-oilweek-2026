import express from "express";
import { requireGlobalAdmin, verifyToken } from "../middleware/auth.js";
import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  updateRole,
} from "../controllers/roleController.js";

const router = express.Router();

router.post("/createRole", verifyToken, requireGlobalAdmin, createRole);
router.get("/getAllRoles", getAllRoles);
router.get("/getRoleById/:id_role", getRoleById);
router.put("/updateRole/:id", verifyToken, requireGlobalAdmin, updateRole);
router.delete("/deleteRole/:id", verifyToken, requireGlobalAdmin, deleteRole);

export default router;
