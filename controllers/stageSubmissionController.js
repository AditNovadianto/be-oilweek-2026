import StageSubmission from "../models/stageSubmissionModel.js";
import { uploadToCloudinary } from "../utils/uploadCloudinary.js";
import path from "path";

// Create
export const createStageSubmission = async (req, res) => {
  const { id_stage, id_team, submission_title } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Submission file is required",
      });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();

    const originalName = path.basename(req.file.originalname, extension);

    const safeFileName = originalName
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-");

    const submissionUrl = await uploadToCloudinary(req.file.buffer, {
      folder: "oilweek2026/stage-submissions",
      resourceType: "raw",
      publicId: `${Date.now()}-${safeFileName}${extension}`,
    });

    const stageSubmission = new StageSubmission({
      id_stage,
      id_team,
      submission_title,
      submission_link: submissionUrl,
    });

    const savedSubmission = await stageSubmission.save();

    res.status(201).json({
      success: true,
      message: "Stage submission created successfully",
      data: savedSubmission,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Read
export const getStageSubmissionsByIdStage = async (req, res) => {
  const { id_stage } = req.params;

  try {
    const submissions = await StageSubmission.find({ id_stage });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStageSubmissionsByIdTeam = async (req, res) => {
  const { id_team } = req.params;

  try {
    const submissions = await StageSubmission.find({ id_team });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update
export const updateStageSubmission = async (req, res) => {
  const { id } = req.params;

  try {
    const updates = {};

    if (req.auth.actorType === "TEAM_LEADER") {
      if (
        req.body.submission_status !== undefined ||
        req.body.status_submission !== undefined ||
        req.body.submission_note !== undefined ||
        req.body.score !== undefined ||
        req.body.feedback !== undefined
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      if (req.body.submission_title !== undefined) {
        updates.submission_title = req.body.submission_title;
      }

      if (!req.file && req.body.submission_link !== undefined) {
        updates.submission_link = req.body.submission_link;
      }
    } else {
      if (
        req.file ||
        req.body.id_stage !== undefined ||
        req.body.id_team !== undefined ||
        req.body.submission_title !== undefined ||
        req.body.submission_link !== undefined
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      const submissionStatus =
        req.body.submission_status ?? req.body.status_submission;

      if (submissionStatus !== undefined) {
        updates.submission_status = submissionStatus;
      }

      if (req.body.submission_note !== undefined) {
        updates.submission_note = req.body.submission_note;
      }

      if (req.body.score !== undefined) {
        updates.score = req.body.score;
      }

      if (req.body.feedback !== undefined) {
        updates.feedback = req.body.feedback;
      }
    }

    if (req.file) {
      const extension = path.extname(req.file.originalname).toLowerCase();

      const originalName = path.basename(req.file.originalname, extension);

      const safeFileName = originalName
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-");

      const submissionUrl = await uploadToCloudinary(req.file.buffer, {
        folder: "oilweek2026/stage-submissions",
        resourceType: "raw",
        publicId: `${Date.now()}-${safeFileName}${extension}`,
      });

      updates.submission_link = submissionUrl;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const updatedSubmission = await StageSubmission.findByIdAndUpdate(
      id,
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedSubmission) {
      return res.status(404).json({
        success: false,
        message: "Stage submission not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedSubmission,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete
export const deleteStageSubmission = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSubmission = await StageSubmission.findByIdAndDelete(id);

    if (!deletedSubmission) {
      return res.status(404).json({
        success: false,
        message: "Stage submission not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stage submission deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
