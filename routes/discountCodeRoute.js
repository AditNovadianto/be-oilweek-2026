import express from "express";
import {
  requireGlobalAdmin,
  requireTeamLeader,
  verifyToken,
} from "../middleware/auth.js";

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

router.post(
  "/createDiscountCode",
  verifyToken,
  requireGlobalAdmin,
  createDiscountCode,
);

router.get(
  "/getDiscountCodes",
  verifyToken,
  requireGlobalAdmin,
  getDiscountCodes,
);

router.get(
  "/getDiscountCodeById/:id",
  verifyToken,
  requireGlobalAdmin,
  getDiscountCodeById,
);

router.post(
  "/inquiryDiscountCode",
  verifyToken,
  requireTeamLeader,
  inquiryDiscountCode,
);

router.post(
  "/redeemDiscountCode",
  verifyToken,
  requireTeamLeader,
  redeemDiscountCode,
);

router.put(
  "/updateDiscountCode/:id",
  verifyToken,
  requireGlobalAdmin,
  updateDiscountCode,
);

router.delete(
  "/deleteDiscountCode/:id",
  verifyToken,
  requireGlobalAdmin,
  deleteDiscountCode,
);

export default router;
