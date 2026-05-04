import { db } from "../config/db.js";

// Create
export async function createRole(name_role) {
  try {
    const [result] = await db.query(
      "INSERT INTO roles (name_role) VALUES (?)",
      [name_role],
    );

    return result.insertId;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
}

// Read
export async function getAllRoles() {
  try {
    const [rows] = await db.query("SELECT * FROM roles");

    return rows;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
}

// Update
export async function updateRole(id, name_role) {
  try {
    const [result] = await db.query(
      "UPDATE roles SET name_role = ? WHERE id_role = ?",
      [name_role, id],
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
}

// Delete
export async function deleteRole(id) {
  try {
    const [result] = await db.query("DELETE FROM roles WHERE id_role = ?", [
      id,
    ]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
}
