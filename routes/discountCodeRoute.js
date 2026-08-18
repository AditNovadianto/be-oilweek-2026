import express from "express";
import { verifyToken } from "../middleware/auth.js";

import {
  createDiscountCode,
  deleteDiscountCode,
  getDiscountCodeById,
  getDiscountCodes,
  inquiryDiscountCode,
  redeemDiscountCode,
  updateDiscountCode,
} from "../controllers/discountCodeController.js";

const router = express.Router();

router.post("/createDiscountCode", verifyToken, createDiscountCode);

router.get("/getDiscountCodes", verifyToken, getDiscountCodes);

router.get("/getDiscountCodeById/:id", verifyToken, getDiscountCodeById);

router.post("/inquiryDiscountCode", verifyToken, inquiryDiscountCode);

router.post("/redeemDiscountCode", verifyToken, redeemDiscountCode);

router.put("/updateDiscountCode/:id", verifyToken, updateDiscountCode);

router.delete("/deleteDiscountCode/:id", verifyToken, deleteDiscountCode);

export default router;
