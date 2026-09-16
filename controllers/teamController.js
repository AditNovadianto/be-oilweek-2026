import * as teamModel from "../models/teamModel.js";

// Create
export const createTeam = async (req, res) => {
  const { team_name, institution, international_team } = req.body;
  const id_team_leader = req.auth.actorId;

  try {
    const existingTeam = await teamModel.getTeamById(id_team_leader);

    if (existingTeam) {
      return res.status(409).json({ error: "Team already exists" });
    }

    const teamId = await teamModel.createTeam(
      team_name,
      institution,
      international_team,
      id_team_leader,
    );

    return res.status(201).json({
      message: "Team created successfully",
      id: teamId,
      team_name,
      institution,
      international_team,
      id_team_leader,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Read
export const getAllTeams = async (req, res) => {
  try {
    const teams = await teamModel.getAllTeams();

    return res.status(200).json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getTeamById = async (req, res) => {
  const { id_team_leader } = req.params;

  try {
    const team = await teamModel.getTeamById(id_team_leader);

    if (!team) {
      return res.status(202).json({ error: "Team not found" });
    }

    return res.status(200).json({ team });
  } catch (error) {
    console.error("Error fetching team by ID:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update
export const updateTeam = async (req, res) => {
  const { id } = req.params;
  const { team_name, institution, international_team } = req.body;

  try {
    const success = await teamModel.updateTeam(
      id,
      team_name,
      institution,
      international_team,
    );

    if (!success) {
      return res.status(404).json({ error: "Team not found" });
    }

    return res.status(200).json({
      message: "Team updated successfully",
      id,
      team_name,
      institution,
      international_team,
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete
export const deleteTeam = async (req, res) => {
  const { id } = req.params;

  try {
    const success = await teamModel.deleteTeam(id);

    if (!success) {
      return res.status(404).json({ error: "Team not found" });
    }

    return res.status(200).json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
