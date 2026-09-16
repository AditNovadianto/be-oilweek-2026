import * as registrationModel from "../models/registrationModel.js";

// Create
export const createRegistration = async (req, res) => {
  const { category_registration, id_competition } = req.body;

  const id_team_leader = req.auth.actorId;

  const { payment_proof } = req.files;

  try {
    const eligibility = await registrationModel.getRegistrationEligibility(
      id_team_leader,
      id_competition,
    );

    if (!eligibility.hasTeam || eligibility.memberCount < 1) {
      return res.status(422).json({
        error: "Registration requires a team with at least one member",
      });
    }

    if (eligibility.hasRegistration) {
      return res.status(409).json({
        error: "Team leader is already registered for this competition",
      });
    }

    const registrationId = await registrationModel.createRegistration(
      category_registration,
      "ACTIVE",
      payment_proof,
      "PENDING",
      id_team_leader,
      id_competition,
    );

    res.status(201).json({
      message: "Registration created successfully",
      id: registrationId,
    });
  } catch (error) {
    console.error("Error creating registration:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Read
export const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await registrationModel.getAllRegistrations();

    res.status(200).json({ registrations });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRegistrationByIdTeamLeader = async (req, res) => {
  const { id_team_leader } = req.params;

  try {
    const registration =
      await registrationModel.getRegistrationByIdTeamLeader(id_team_leader);

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    res.status(200).json({ registration });
  } catch (error) {
    console.error("Error fetching registration by team leader ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update
export const updateRegistration = async (req, res) => {
  const { id } = req.params;

  const { category_registration, status_registration, payment_status } =
    req.body;

  const files = req.files || {};

  const payment_proof = files.payment_proof;

  try {
    const success = await registrationModel.updateRegistration(
      id,
      category_registration,
      status_registration,
      payment_proof,
      payment_status,
    );

    if (!success) {
      return res.status(404).json({ error: "Registration not found" });
    }

    return res.status(200).json({
      message: "Registration updated successfully",
      id,
      category_registration,
      status_registration,
      payment_status,
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete
export const deleteRegistration = async (req, res) => {
  const { id } = req.params;

  try {
    const success = await registrationModel.deleteRegistration(id);

    if (!success) {
      return res.status(404).json({ error: "Registration not found" });
    }

    return res
      .status(200)
      .json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
