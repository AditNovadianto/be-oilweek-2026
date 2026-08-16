import DiscountCode from "../models/discountCodeModel.js";

// Create
export const createDiscountCode = async (req, res) => {
  const {
    code,
    discount_type,
    discount_value,
    start_date,
    end_date,
    usage_limit,
    is_active,
  } = req.body;

  try {
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: "Start date must be earlier than end date",
      });
    }

    if (discount_type === "PERCENTAGE" && discount_value > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be greater than 100",
      });
    }

    const existingCode = await DiscountCode.findOne({
      code: code.trim().toUpperCase(),
    });

    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: "Discount code already exists",
      });
    }

    const discountCode = new DiscountCode({
      code,
      discount_type,
      discount_value,
      start_date,
      end_date,
      usage_limit,
      is_active,
    });

    const savedDiscountCode = await discountCode.save();

    return res.status(201).json({
      success: true,
      message: "Discount code created successfully",
      data: savedDiscountCode,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Read All
export const getDiscountCodes = async (req, res) => {
  try {
    const discountCodes = await DiscountCode.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: discountCodes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Read By ID
export const getDiscountCodeById = async (req, res) => {
  const { id } = req.params;

  try {
    const discountCode = await DiscountCode.findById(id);

    if (!discountCode) {
      return res.status(404).json({
        success: false,
        message: "Discount code not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: discountCode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Redeem
export const redeemDiscountCode = async (req, res) => {
  const { code, id_team_leader, transaction_amount } = req.body;

  try {
    if (
      !code ||
      id_team_leader === undefined ||
      transaction_amount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Code, team leader ID, and transaction amount are required",
      });
    }

    const amount = Number(transaction_amount);

    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction amount",
      });
    }

    const now = new Date();

    const discountCode = await DiscountCode.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!discountCode) {
      return res.status(404).json({
        success: false,
        message: "Discount code not found",
      });
    }

    if (!discountCode.is_active) {
      return res.status(400).json({
        success: false,
        message: "Discount code is inactive",
      });
    }

    if (now < discountCode.start_date) {
      return res.status(400).json({
        success: false,
        message: "Discount code is not active yet",
      });
    }

    if (now > discountCode.end_date) {
      return res.status(400).json({
        success: false,
        message: "Discount code has expired",
      });
    }

    if (discountCode.redeemed_by.includes(Number(id_team_leader))) {
      return res.status(409).json({
        success: false,
        message:
          "This discount code has already been redeemed by this team leader",
      });
    }

    if (
      discountCode.usage_limit !== null &&
      discountCode.used_count >= discountCode.usage_limit
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount code usage limit has been reached",
      });
    }

    let discountAmount = 0;

    if (discountCode.discount_type === "PERCENTAGE") {
      discountAmount = (amount * discountCode.discount_value) / 100;
    } else if (discountCode.discount_type === "FIXED") {
      discountAmount = discountCode.discount_value;
    }

    discountAmount = Math.min(discountAmount, amount);

    const finalAmount = Math.max(amount - discountAmount, 0);

    /*
      Atomic increment.

      Kita cek lagi usage_limit pada saat update supaya dua request
      yang masuk bersamaan tidak melewati batas penggunaan.
    */
    const usageFilter = {
      _id: discountCode._id,
      is_active: true,

      redeemed_by: {
        $ne: Number(id_team_leader),
      },

      start_date: {
        $lte: now,
      },

      end_date: {
        $gte: now,
      },

      $or: [
        {
          usage_limit: null,
        },
        {
          $expr: {
            $lt: ["$used_count", "$usage_limit"],
          },
        },
      ],
    };

    const redeemedDiscountCode = await DiscountCode.findOneAndUpdate(
      usageFilter,
      {
        $inc: {
          used_count: 1,
        },
        $addToSet: {
          redeemed_by: Number(id_team_leader),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!redeemedDiscountCode) {
      return res.status(400).json({
        success: false,
        message:
          "Discount code could not be redeemed or usage limit has been reached",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Discount code redeemed successfully",
      data: {
        discount_code: redeemedDiscountCode.code,
        discount_type: redeemedDiscountCode.discount_type,
        discount_value: redeemedDiscountCode.discount_value,
        transaction_amount: amount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update
export const updateDiscountCode = async (req, res) => {
  const { id } = req.params;

  try {
    const existingDiscountCode = await DiscountCode.findById(id);

    if (!existingDiscountCode) {
      return res.status(404).json({
        success: false,
        message: "Discount code not found",
      });
    }

    if (req.body.code) {
      req.body.code = req.body.code.trim().toUpperCase();

      const duplicateCode = await DiscountCode.findOne({
        code: req.body.code,
        _id: {
          $ne: id,
        },
      });

      if (duplicateCode) {
        return res.status(409).json({
          success: false,
          message: "Discount code already exists",
        });
      }
    }

    const startDate = req.body.start_date ?? existingDiscountCode.start_date;

    const endDate = req.body.end_date ?? existingDiscountCode.end_date;

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date must be earlier than end date",
      });
    }

    const discountType =
      req.body.discount_type ?? existingDiscountCode.discount_type;

    const discountValue =
      req.body.discount_value ?? existingDiscountCode.discount_value;

    if (discountType === "PERCENTAGE" && Number(discountValue) > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be greater than 100",
      });
    }

    const updatedDiscountCode = await DiscountCode.findByIdAndUpdate(
      id,
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Discount code updated successfully",
      data: updatedDiscountCode,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete
export const deleteDiscountCode = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDiscountCode = await DiscountCode.findByIdAndDelete(id);

    if (!deletedDiscountCode) {
      return res.status(404).json({
        success: false,
        message: "Discount code not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Discount code deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
