import mongoose from "mongoose";

const competitionStageSchema = new mongoose.Schema(
  {
    id_competition: {
      type: Number,
      ref: "Competition",
      required: true,
    },

    stage_name: {
      type: String,
      required: true,
      trim: true,
      // contoh: "Penyisihan", "Semifinal", "Final"
    },

    start_stage: {
      type: Date,
      required: true,
    },

    end_stage: {
      type: Date,
      required: true,
    },

    passed_teams: [
      {
        type: Number,
        ref: "Team",
      },
    ],

    status_stage: {
      type: String,
      enum: ["UPCOMING", "ONGOING", "FINISHED"],
      default: "UPCOMING",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("CompetitionStage", competitionStageSchema);
