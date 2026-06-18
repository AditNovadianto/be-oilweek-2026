import StageSubmission from "../models/stageSubmissionModel.js";
import { uploadToCloudinary } from "../utils/uploadCloudinary.js";

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

    const submissionUrl = await uploadToCloudinary(req.file.buffer);

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
    if (req.file) {
      const submissionUrl = await uploadToCloudinary(req.file.buffer);

      req.body.submission_link = submissionUrl;
    }

    const updatedSubmission = await StageSubmission.findByIdAndUpdate(
      id,
      req.body,
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
