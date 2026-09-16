import { db } from "../config/db.js";

// Create
export async function createCompetition(name, status) {
  try {
    const [result] = await db.query(
      "INSERT INTO competition (name_competition, status_competition, id_platform) VALUES (?, ?, ?)",
      [name, status, 1],
    );

    return result.insertId;
  } catch (error) {
    console.error("Error creating competition:", error);
    throw error;
  }
}

// Read
export async function getAllCompetitions(idCompetition = null) {
  try {
    const [rows] =
      idCompetition === null
        ? await db.query("SELECT * FROM competition")
        : await db.query(
            "SELECT * FROM competition WHERE id_competition = ?",
            [idCompetition],
          );

    return rows;
  } catch (error) {
    console.error("Error fetching competition:", error);
    throw error;
  }
}

// Update
export async function updateCompetition(id, name, status) {
  try {
    const [result] = await db.query(
      "UPDATE competition SET name_competition = ?, status_competition = ? WHERE id_competition = ?",
      [name, status, id],
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error updating competition:", error);
    throw error;
  }
}

// Delete
export async function deleteCompetition(id) {
  try {
    const [result] = await db.query(
      "DELETE FROM competition WHERE id_competition = ?",
      [id],
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting competition:", error);
    throw error;
  }
}
