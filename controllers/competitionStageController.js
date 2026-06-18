import CompetitionStage from "../models/competitionStageModel.js";

// Create
export const createCompetitionStage = async (req, res) => {
  const { id_competition, stage_name, start_stage, end_stage } = req.body;

  try {
    const competitionStage = new CompetitionStage({
      id_competition,
      stage_name,
      start_stage,
      end_stage,
    });

    const savedStage = await competitionStage.save();

    res.status(201).json({
      success: true,
      data: savedStage,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Read
export const getCompetitionStagesByIdCompetition = async (req, res) => {
  const { id_competition } = req.params;

  try {
    const stages = await CompetitionStage.find({ id_competition }).sort({
      start_stage: 1,
    });

    res.status(200).json({
      success: true,
      data: stages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update
export const updateCompetitionStage = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedStage = await CompetitionStage.findByIdAndUpdate(
      id,
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedStage) {
      return res.status(404).json({
        success: false,
        message: "Competition stage not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedStage,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete
export const deleteCompetitionStage = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedStage = await CompetitionStage.findByIdAndDelete(id);

    if (!deletedStage) {
      return res.status(404).json({
        success: false,
        message: "Competition stage not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Competition stage deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
