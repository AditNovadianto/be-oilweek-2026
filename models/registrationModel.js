import { db } from "../config/db.js";
import { uploadToCloudinary } from "../utils/uploadCloudinary.js";

// Create
export async function createRegistration(
  category_registration,
  status_registration,
  payment_proof,
  payment_status,
  id_team_leader,
  id_competition,
) {
  try {
    const paymentProofUrl = await uploadToCloudinary(payment_proof[0].buffer);

    const [result] = await db.query(
      "INSERT INTO registration (category_registration, status_registration, payment_proof, payment_status, id_team_leader, id_competition) VALUES (?, ?, ?, ?, ?, ?)",
      [
        category_registration,
        status_registration,
        paymentProofUrl,
        payment_status,
        id_team_leader,
        id_competition,
      ],
    );

    return result.insertId;
  } catch (error) {
    console.error("Error creating registration:", error);
    throw error;
  }
}

// Read
export async function getAllRegistrations() {
  try {
    const [rows] = await db.query("SELECT * FROM registration");

    return rows;
  } catch (error) {
    console.error("Error fetching registrations:", error);
    throw error;
  }
}

export async function getRegistrationByIdTeamLeader(id_team_leader) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM registration WHERE id_team_leader = ?",
      [id_team_leader],
    );

    return rows;
  } catch (error) {
    console.error("Error fetching registration by team leader ID:", error);
    throw error;
  }
}

// Update
export async function updateRegistration(
  id,
  category_registration,
  status_registration,
  payment_proof,
  payment_status,
) {
  try {
    // Helper upload
    const uploadIfExists = async (file) => {
      return file ? await uploadToCloudinary(file[0].buffer) : null;
    };

    const paymentProofUrl = await uploadIfExists(payment_proof);

    const fields = [];
    const values = [];

    if (category_registration) {
      fields.push("category_registration = ?");
      values.push(category_registration);
    }

    if (status_registration) {
      fields.push("status_registration = ?");
      values.push(status_registration);
    }

    if (paymentProofUrl) {
      fields.push("payment_proof = ?");
      values.push(paymentProofUrl);
    }

    if (payment_status) {
      fields.push("payment_status = ?");
      values.push(payment_status);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const [result] = await db.query(
      "UPDATE registration SET " +
        fields.join(", ") +
        " WHERE id_registration = ?",
      [...values, id],
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error updating registration:", error);
    throw error;
  }
}

// Delete
export async function deleteRegistration(id) {
  try {
    const [result] = await db.query(
      "DELETE FROM registration WHERE id_registration = ?",
      [id],
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting registration:", error);
    throw error;
  }
}
