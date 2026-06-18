import mongoose from "mongoose";

const stageSubmissionSchema = new mongoose.Schema(
  {
    id_stage: {
      type: String,
      ref: "CompetitionStage",
      required: true,
    },

    id_team: {
      type: Number,
      ref: "Team",
      required: true,
    },

    submission_title: {
      type: String,
      required: true,
      trim: true,
    },

    submission_link: {
      type: String,
      required: true,
      trim: true,
    },

    submission_note: {
      type: String,
      default: "",
    },

    submitted_at: {
      type: Date,
      default: Date.now,
    },

    submission_status: {
      type: String,
      enum: ["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "SUBMITTED",
    },

    score: {
      type: Number,
      default: null,
    },

    feedback: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("StageSubmission", stageSubmissionSchema);
