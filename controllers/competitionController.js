import * as competitionModel from "../models/competitionModel.js";
import { getCompetitionScope } from "../middleware/resourceAccess.js";

// Create
export const createCompetition = async (req, res) => {
  const { name, status } = req.body;

  try {
    const competitionId = await competitionModel.createCompetition(
      name,
      status,
    );

    return res
      .status(201)
      .json({
        message: "Competition created successfully",
        id: competitionId,
        name,
        status,
      });
  } catch (error) {
    console.error("Error creating competition:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Read
export const getAllCompetitions = async (req, res) => {
  try {
    const scope =
      req.auth.actorType === "TEAM_LEADER"
        ? null
        : getCompetitionScope(req.auth);
    const competitions = await competitionModel.getAllCompetitions(scope);

    return res.status(200).json({ competitions });
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update
export const updateCompetition = async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;

  try {
    const success = await competitionModel.updateCompetition(id, name, status);

    if (!success) {
      return res.status(404).json({ error: "Competition not found" });
    }

    return res
      .status(200)
      .json({ message: "Competition updated successfully", id, name, status });
  } catch (error) {
    console.error("Error updating competition:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete
export const deleteCompetition = async (req, res) => {
  const { id } = req.params;

  try {
    const success = await competitionModel.deleteCompetition(id);

    if (!success) {
      return res.status(404).json({ error: "Competition not found" });
    }

    return res
      .status(200)
      .json({ message: "Competition deleted successfully" });
  } catch (error) {
    console.error("Error deleting competition:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
