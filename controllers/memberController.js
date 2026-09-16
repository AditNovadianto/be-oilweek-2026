import * as memberModel from "../models/memberModel.js";

// Create
export const createMember = async (req, res) => {
  const {
    name_member,
    phone_number_member,
    email_member,
    major_member,
    student_id_card,
    id_team,
  } = req.body;

  const {
    twibbon,
    following_instagram,
    following_linkedin,
    following_tiktok,
    instagram_story,
    repost_competition_instagram,
  } = req.files;

  try {
    const memberId = await memberModel.createMember(
      name_member,
      phone_number_member,
      email_member,
      major_member,
      student_id_card,
      twibbon,
      following_instagram,
      following_linkedin,
      following_tiktok,
      instagram_story,
      repost_competition_instagram,
      id_team,
    );

    return res.status(201).json({
      message: "Member created successfully",
      id: memberId.id,
      name_member,
      phone_number_member,
      email_member,
      major_member,
      student_id_card,
      twibbon: memberId.twibbonUrl,
      following_instagram: memberId.followingInstagramUrl,
      following_linkedin: memberId.followingLinkedinUrl,
      following_tiktok: memberId.followingTiktokUrl,
      instagram_story: memberId.instagramStoryUrl,
      repost_competition_instagram: memberId.repostCompetitionInstagramUrl,
      id_team,
    });
  } catch (error) {
    console.error("Error creating member:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Read
export const getAllMembers = async (req, res) => {
  try {
    const members = await memberModel.getAllMembers();

    return res.status(200).json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllMemberById = async (req, res) => {
  const { id_team } = req.params;

  try {
    const members = await memberModel.getAllMemberById(id_team);

    return res.status(200).json({ members });
  } catch (error) {
    console.error("Error fetching members by team ID:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update
export const updateMember = async (req, res) => {
  const { id } = req.params;

  const {
    name_member,
    phone_number_member,
    email_member,
    major_member,
    student_id_card,
  } = req.body;

  const files = req.files || {};

  const {
    twibbon,
    following_instagram,
    following_linkedin,
    following_tiktok,
    instagram_story,
    repost_competition_instagram,
  } = files;

  try {
    const success = await memberModel.updateMember(
      id,
      name_member,
      phone_number_member,
      email_member,
      major_member,
      student_id_card,
      twibbon,
      following_instagram,
      following_linkedin,
      following_tiktok,
      instagram_story,
      repost_competition_instagram,
    );

    if (!success) {
      return res.status(404).json({ error: "Member not found" });
    }

    return res.status(200).json({
      message: "Member updated successfully",
      id,
      name_member,
      phone_number_member,
      email_member,
      major_member,
      student_id_card,
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete
export const deleteMember = async (req, res) => {
  const { id } = req.params;

  try {
    const success = await memberModel.deleteMember(id);

    if (!success) {
      return res.status(404).json({ error: "Member not found" });
    }

    return res.status(200).json({ message: "Member deleted successfully", id });
  } catch (error) {
    console.error("Error deleting member:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
