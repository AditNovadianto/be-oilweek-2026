import mongoose from "mongoose";

const discountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      // contoh: "LOMBA20", "EARLYBIRD", "BENSCO50K"
    },

    discount_type: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      required: true,
      // PERCENTAGE = potongan dalam persen
      // FIXED = potongan nominal rupiah
    },

    discount_value: {
      type: Number,
      required: true,
      min: 0,
      // contoh:
      // 20 => diskon 20% jika PERCENTAGE
      // 50000 => diskon Rp50.000 jika FIXED
    },

    start_date: {
      type: Date,
      required: true,
    },

    end_date: {
      type: Date,
      required: true,
    },

    usage_limit: {
      type: Number,
      default: null,
      min: 1,
      // null = unlimited
      // contoh: kode hanya bisa diredeem maksimal 100 kali
    },

    used_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    redeemed_by: [
      {
        type: Number,
      },
    ],

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("DiscountCode", discountCodeSchema);
