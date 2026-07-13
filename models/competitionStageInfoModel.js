import mongoose from "mongoose";

const whatsappGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const teamPickupInformationSchema = new mongoose.Schema(
  {
    team_id: {
      type: String,
      required: true,
      trim: true,
    },

    location_name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    maps_url: {
      type: String,
      trim: true,
      default: "",
    },

    pickup_time: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "PICKED_UP", "CANCELLED"],
      default: "PENDING",
    },
  },
  {
    _id: false,
  },
);

const venueInformationSchema = new mongoose.Schema(
  {
    venue_name: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    maps_url: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const competitionStageInfoSchema = new mongoose.Schema(
  {
    id_stage: {
      type: String,
      required: [true, "id_stage wajib diisi"],
      unique: true,
      index: true,
      trim: true,
    },

    whatsapp_group: {
      type: whatsappGroupSchema,
      default: undefined,
    },

    accepts_pickup: {
      type: Boolean,
      default: false,
    },

    team_pickup_information: {
      type: [teamPickupInformationSchema],
      default: [],
    },

    venue_information: {
      type: venueInformationSchema,
      default: undefined,
    },

    additional_notes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "competitionstageinfos",
  },
);

competitionStageInfoSchema.pre("validate", function () {
  const teamPickupInformation = this.team_pickup_information || [];

  if (!this.accepts_pickup && teamPickupInformation.length > 0) {
    throw new Error(
      "Data penjemputan team tidak dapat diisi karena accepts_pickup bernilai false",
    );
  }

  const teamIds = teamPickupInformation.map((pickup) =>
    String(pickup.team_id).trim(),
  );

  const uniqueTeamIds = new Set(teamIds);

  if (teamIds.length !== uniqueTeamIds.size) {
    throw new Error(
      "Satu team hanya boleh memiliki satu informasi penjemputan pada stage yang sama",
    );
  }
});

export default mongoose.model(
  "CompetitionStageInfo",
  competitionStageInfoSchema,
);
