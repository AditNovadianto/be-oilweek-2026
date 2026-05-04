import { db } from "../config/db.js";

// Create
export async function createTeam(
  team_name,
  institution,
  international_team,
  id_team_leader,
) {
  try {
    const [result] = await db.query(
      "INSERT INTO team (team_name, institution, international_team, id_team_leader) VALUES (?, ?, ?, ?)",
      [team_name, institution, international_team, id_team_leader],
    );

    return result.insertId;
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
}

// Read
export async function getAllTeams() {
  try {
    const [rows] = await db.query("SELECT * FROM team");

    return rows;
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw error;
  }
}

export async function getTeamById(id_team_leader) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM team WHERE id_team_leader = ?",
      [id_team_leader],
    );

    return rows[0];
  } catch (error) {
    console.error("Error fetching team by ID:", error);
    throw error;
  }
}

// Update
export async function updateTeam(
  id,
  team_name,
  institution,
  international_team,
) {
  try {
    const [result] = await db.query(
      "UPDATE team SET team_name = ?, institution = ?, international_team = ? WHERE id_team = ?",
      [team_name, institution, international_team, id],
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error updating team:", error);
    throw error;
  }
}

// Delete
export async function deleteTeam(id) {
  try {
    const [result] = await db.query("DELETE FROM team WHERE id_team = ?", [id]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting team:", error);
    throw error;
  }
}
