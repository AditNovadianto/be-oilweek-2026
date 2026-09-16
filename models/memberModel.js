import { db } from "../config/db.js";
import { uploadToCloudinary } from "../utils/uploadCloudinary.js";

// Helper upload file opsional
const uploadIfExists = async (file) => {
  if (!file || !file[0]?.buffer) {
    return null;
  }

  return uploadToCloudinary(file[0].buffer);
};

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
    const [
      twibbonUrl,
      followingInstagramUrl,
      followingLinkedinUrl,
      followingTiktokUrl,
      instagramStoryUrl,
      repostCompetitionInstagramUrl,
    ] = await Promise.all([
      uploadIfExists(twibbon),
      uploadIfExists(following_instagram),

      // LinkedIn boleh tidak di-upload.
      uploadIfExists(following_linkedin),

      uploadIfExists(following_tiktok),
      uploadIfExists(instagram_story),
      uploadIfExists(repost_competition_instagram),
    ]);

    const [result] = await db.query(
      `INSERT INTO member (
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
        id_team
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name_member,
        phone_number_member,
        email_member,
        major_member,
        student_id_card,
        twibbonUrl,
        followingInstagramUrl,

        // Akan tersimpan null apabila tidak ada file LinkedIn.
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
    const [
      twibbonUrl,
      followingInstagramUrl,
      followingLinkedinUrl,
      followingTiktokUrl,
      instagramStoryUrl,
      repostCompetitionInstagramUrl,
    ] = await Promise.all([
      uploadIfExists(twibbon),
      uploadIfExists(following_instagram),

      // Tidak masalah jika tidak dikirim.
      uploadIfExists(following_linkedin),

      uploadIfExists(following_tiktok),
      uploadIfExists(instagram_story),
      uploadIfExists(repost_competition_instagram),
    ]);

    const fields = [];
    const values = [];

    if (name_member !== undefined && name_member !== null) {
      fields.push("name_member = ?");
      values.push(name_member);
    }

    if (phone_number_member !== undefined && phone_number_member !== null) {
      fields.push("phone_number_member = ?");
      values.push(phone_number_member);
    }

    if (email_member !== undefined && email_member !== null) {
      fields.push("email_member = ?");
      values.push(email_member);
    }

    if (major_member !== undefined && major_member !== null) {
      fields.push("major_member = ?");
      values.push(major_member);
    }

    if (student_id_card !== undefined && student_id_card !== null) {
      fields.push("student_id_card = ?");
      values.push(student_id_card);
    }

    if (id_team !== undefined && id_team !== null) {
      fields.push("id_team = ?");
      values.push(id_team);
    }

    if (twibbonUrl) {
      fields.push("twibbon = ?");
      values.push(twibbonUrl);
    }

    if (followingInstagramUrl) {
      fields.push("following_instagram = ?");
      values.push(followingInstagramUrl);
    }

    // Hanya diperbarui ketika file LinkedIn benar-benar dikirim.
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

    if (fields.length === 0) {
      throw new Error("No data to update");
    }

    const query = `
      UPDATE member
      SET ${fields.join(", ")}
      WHERE id_member = ?
    `;

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
