import { db } from "../config/db.js";
import { uploadToCloudinary } from "../utils/uploadCloudinary.js";

// Create
export async function createMember(
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
) {
  try {
    const twibbonUrl = await uploadToCloudinary(twibbon[0].buffer);
    const followingInstagramUrl = await uploadToCloudinary(
      following_instagram[0].buffer,
    );
    const followingLinkedinUrl = await uploadToCloudinary(
      following_linkedin[0].buffer,
    );
    const followingTiktokUrl = await uploadToCloudinary(
      following_tiktok[0].buffer,
    );
    const instagramStoryUrl = await uploadToCloudinary(
      instagram_story[0].buffer,
    );
    const repostCompetitionInstagramUrl = await uploadToCloudinary(
      repost_competition_instagram[0].buffer,
    );

    const [result] = await db.query(
      "INSERT INTO member (name_member, phone_number_member, email_member, major_member, student_id_card, twibbon, following_instagram, following_linkedin, following_tiktok, instagram_story, repost_competition_instagram, id_team) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name_member,
        phone_number_member,
        email_member,
        major_member,
        student_id_card,
        twibbonUrl,
        followingInstagramUrl,
        followingLinkedinUrl,
        followingTiktokUrl,
        instagramStoryUrl,
        repostCompetitionInstagramUrl,
        id_team,
      ],
    );

    return {
      id: result.insertId,
      twibbonUrl,
      followingInstagramUrl,
      followingLinkedinUrl,
      followingTiktokUrl,
      instagramStoryUrl,
      repostCompetitionInstagramUrl,
    };
  } catch (error) {
    console.error("Error creating member:", error);
    throw error;
  }
}

// Read
export async function getAllMembers() {
  try {
    const [rows] = await db.query("SELECT * FROM member");

    return rows;
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
}

export async function getAllMemberById(id_team) {
  try {
    const [rows] = await db.query("SELECT * FROM member WHERE id_team = ?", [
      id_team,
    ]);

    return rows;
  } catch (error) {
    console.error("Error fetching members by team ID:", error);
    throw error;
  }
}

// Update
export async function updateMember(
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
  id_team,
) {
  try {
    // Helper upload
    const uploadIfExists = async (file) => {
      return file ? await uploadToCloudinary(file[0].buffer) : null;
    };

    // Upload jika ada file baru
    const twibbonUrl = await uploadIfExists(twibbon);
    const followingInstagramUrl = await uploadIfExists(following_instagram);
    const followingLinkedinUrl = await uploadIfExists(following_linkedin);
    const followingTiktokUrl = await uploadIfExists(following_tiktok);
    const instagramStoryUrl = await uploadIfExists(instagram_story);
    const repostCompetitionInstagramUrl = await uploadIfExists(
      repost_competition_instagram,
    );

    // Dynamic field
    const fields = [];
    const values = [];

    // Field wajib (non-file)
    if (name_member) {
      fields.push("name_member = ?");
      values.push(name_member);
    }

    if (phone_number_member) {
      fields.push("phone_number_member = ?");
      values.push(phone_number_member);
    }

    if (email_member) {
      fields.push("email_member = ?");
      values.push(email_member);
    }

    if (major_member) {
      fields.push("major_member = ?");
      values.push(major_member);
    }

    if (student_id_card) {
      fields.push("student_id_card = ?");
      values.push(student_id_card);
    }

    // Field file (hanya kalau upload baru)
    if (twibbonUrl) {
      fields.push("twibbon = ?");
      values.push(twibbonUrl);
    }

    if (followingInstagramUrl) {
      fields.push("following_instagram = ?");
      values.push(followingInstagramUrl);
    }

    if (followingLinkedinUrl) {
      fields.push("following_linkedin = ?");
      values.push(followingLinkedinUrl);
    }

    if (followingTiktokUrl) {
      fields.push("following_tiktok = ?");
      values.push(followingTiktokUrl);
    }

    if (instagramStoryUrl) {
      fields.push("instagram_story = ?");
      values.push(instagramStoryUrl);
    }

    if (repostCompetitionInstagramUrl) {
      fields.push("repost_competition_instagram = ?");
      values.push(repostCompetitionInstagramUrl);
    }

    // Kalau tidak ada yang diupdate
    if (fields.length === 0) {
      throw new Error("No data to update");
    }

    // Final query
    const query = `UPDATE member SET ${fields.join(", ")} WHERE id_member = ?`;
    values.push(id);

    const [result] = await db.query(query, values);

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error updating member:", error);
    throw error;
  }
}

// Delete
export async function deleteMember(id) {
  try {
    const [result] = await db.query("DELETE FROM member WHERE id_member = ?", [
      id,
    ]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting member:", error);
    throw error;
  }
}
