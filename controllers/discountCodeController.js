import DiscountCode from "../models/discountCodeModel.js";

// ======================================================
// HELPER
// ======================================================

const calculateDiscount = (discountCode, transactionAmount) => {
  let discountAmount = 0;

  if (discountCode.discount_type === "PERCENTAGE") {
    discountAmount = (transactionAmount * discountCode.discount_value) / 100;
  } else if (discountCode.discount_type === "FIXED") {
    discountAmount = discountCode.discount_value;
  }

  // Discount tidak boleh melebihi harga transaksi
  discountAmount = Math.min(discountAmount, transactionAmount);

  const finalAmount = Math.max(transactionAmount - discountAmount, 0);

  return {
    discountAmount,
    finalAmount,
  };
};

const validateDiscountAvailability = (discountCode, now) => {
  if (!discountCode.is_active) {
    return "Discount code is inactive";
  }

  if (now < discountCode.start_date) {
    return "Discount code is not active yet";
  }

  if (now > discountCode.end_date) {
    return "Discount code has expired";
  }

  if (
    discountCode.usage_limit !== null &&
    discountCode.used_count >= discountCode.usage_limit
  ) {
    return "Discount code usage limit has been reached";
  }

  return null;
};

// ======================================================
// CREATE
// ======================================================

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
    if (
      !code ||
      !discount_type ||
      discount_value === undefined ||
      !start_date ||
      !end_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code, discount type, discount value, start date, and end date are required",
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date or end date",
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date must be earlier than end date",
      });
    }

    const numericDiscountValue = Number(discount_value);

    if (Number.isNaN(numericDiscountValue) || numericDiscountValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount value",
      });
    }

    if (discount_type === "PERCENTAGE" && numericDiscountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be greater than 100",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const existingCode = await DiscountCode.findOne({
      code: normalizedCode,
    });

    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: "Discount code already exists",
      });
    }

    const discountCode = new DiscountCode({
      code: normalizedCode,
      discount_type,
      discount_value: numericDiscountValue,
      start_date: startDate,
      end_date: endDate,
      usage_limit:
        usage_limit === null || usage_limit === undefined || usage_limit === ""
          ? null
          : Number(usage_limit),
      is_active: is_active === undefined ? true : is_active,
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

// ======================================================
// READ ALL
// ======================================================

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

// ======================================================
// READ BY ID
// ======================================================

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

// ======================================================
// INQUIRY DISCOUNT
// Preview only - TIDAK melakukan redeem
// ======================================================

export const inquiryDiscountCode = async (req, res) => {
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

    const teamLeaderId = Number(id_team_leader);

    if (Number.isNaN(teamLeaderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team leader ID",
      });
    }

    const amount = Number(transaction_amount);

    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction amount",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const discountCode = await DiscountCode.findOne({
      code: normalizedCode,
    });

    if (!discountCode) {
      return res.status(404).json({
        success: false,
        message: "Discount code not found",
      });
    }

    const now = new Date();

    const availabilityError = validateDiscountAvailability(discountCode, now);

    if (availabilityError) {
      return res.status(400).json({
        success: false,
        message: availabilityError,
      });
    }

    /*
      Jika satu Team Leader hanya boleh menggunakan
      discount code yang sama satu kali.
    */
    const alreadyRedeemed = discountCode.redeemed_by.some(
      (redeem) => Number(redeem.id_team_leader) === teamLeaderId,
    );

    if (alreadyRedeemed) {
      return res.status(409).json({
        success: false,
        message:
          "This discount code has already been redeemed by this team leader",
      });
    }

    const { discountAmount, finalAmount } = calculateDiscount(
      discountCode,
      amount,
    );

    /*
      PENTING:
      Tidak ada save()
      Tidak ada used_count + 1
      Tidak ada redeemed_by.push()

      Endpoint ini hanya preview.
    */

    return res.status(200).json({
      success: true,
      message: "Discount code is valid",
      data: {
        discount_code: discountCode.code,

        discount_type: discountCode.discount_type,

        discount_value: discountCode.discount_value,

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

// ======================================================
// FINAL REDEEM
// Dipanggil SETELAH registration berhasil dibuat
// ======================================================

export const redeemDiscountCode = async (req, res) => {
  const { code, id_team_leader, id_registration, transaction_amount } =
    req.body;

  try {
    if (
      !code ||
      id_team_leader === undefined ||
      id_registration === undefined ||
      transaction_amount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code, team leader ID, registration ID, and transaction amount are required",
      });
    }

    const teamLeaderId = Number(id_team_leader);

    const registrationId = Number(id_registration);

    const amount = Number(transaction_amount);

    if (Number.isNaN(teamLeaderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team leader ID",
      });
    }

    if (Number.isNaN(registrationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration ID",
      });
    }

    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction amount",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const now = new Date();

    const discountCode = await DiscountCode.findOne({
      code: normalizedCode,
    });

    if (!discountCode) {
      return res.status(404).json({
        success: false,
        message: "Discount code not found",
      });
    }

    const availabilityError = validateDiscountAvailability(discountCode, now);

    if (availabilityError) {
      return res.status(400).json({
        success: false,
        message: availabilityError,
      });
    }

    const alreadyRedeemed = discountCode.redeemed_by.some(
      (redeem) => Number(redeem.id_team_leader) === teamLeaderId,
    );

    if (alreadyRedeemed) {
      return res.status(409).json({
        success: false,
        message:
          "This discount code has already been redeemed by this team leader",
      });
    }

    const { discountAmount, finalAmount } = calculateDiscount(
      discountCode,
      amount,
    );

    /*
      Atomic filter.

      Kita cek kembali seluruh kondisi pada saat update,
      supaya aman jika ada beberapa request masuk
      bersamaan.
    */
    const usageFilter = {
      _id: discountCode._id,

      is_active: true,

      start_date: {
        $lte: now,
      },

      end_date: {
        $gte: now,
      },

      /*
        Karena redeemed_by sekarang array object,
        pengecekannya menggunakan dot notation.
      */
      "redeemed_by.id_team_leader": {
        $ne: teamLeaderId,
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
        $push: {
          redeemed_by: {
            id_team_leader: teamLeaderId,
            id_registration: registrationId,
            transaction_amount: amount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            redeemed_at: new Date(),
          },
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!redeemedDiscountCode) {
      return res.status(409).json({
        success: false,
        message:
          "Discount code could not be redeemed. It may already be used, expired, inactive, or the usage limit has been reached",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Discount code redeemed successfully",
      data: {
        discount_code: redeemedDiscountCode.code,

        discount_type: redeemedDiscountCode.discount_type,

        discount_value: redeemedDiscountCode.discount_value,

        id_team_leader: teamLeaderId,

        id_registration: registrationId,

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

// ======================================================
// UPDATE
// ======================================================

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

    const parsedStartDate = new Date(startDate);

    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date or end date",
      });
    }

    if (parsedStartDate >= parsedEndDate) {
      return res.status(400).json({
        success: false,
        message: "Start date must be earlier than end date",
      });
    }

    const discountType =
      req.body.discount_type ?? existingDiscountCode.discount_type;

    const discountValue = Number(
      req.body.discount_value ?? existingDiscountCode.discount_value,
    );

    if (Number.isNaN(discountValue) || discountValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount value",
      });
    }

    if (discountType === "PERCENTAGE" && discountValue > 100) {
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

// ======================================================
// DELETE
// ======================================================

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
