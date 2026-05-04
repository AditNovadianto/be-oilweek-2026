import { db } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "../utils/uploadCloudinary.js";
import { getTeamById } from "../models/teamModel.js";
import { getAllMemberById } from "../models/memberModel.js";

const signToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign(
    {
      sub: user.id_team_leader,
      name_team_leader: user.name_team_leader,
      email_team_leader: user.email_team_leader,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15min",
      issuer: "my-app",
      audience: "my-app-users",
      algorithm: "HS256",
    },
  );
};

const sanitizeUser = (u) => ({
  id_team_leader: u.id_team_leader,
  name_team_leader: u.name_team_leader,
  major_team_leader: u.major_team_leader,
  email_team_leader: u.email_team_leader,
  phone_number_team_leader: u.phone_number_team_leader,
  student_id_card: u.student_id_card,
  twibbon: u.twibbon,
  following_instagram: u.following_instagram,
  following_linkedin: u.following_linkedin,
  following_tiktok: u.following_tiktok,
  instagram_story: u.instagram_story,
  repost_competition_instagram: u.repost_competition_instagram,
  id_platform: u.id_platform,
});

// --- SIGN UP ---
export const signUp = async (req, res) => {
  const {
    name_team_leader,
    major_team_leader,
    email_team_leader,
    password_team_leader,
    phone_number_team_leader,
    student_id_card,
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
    // 1) cek user sudah ada?
    const [existRows] = await db.query(
      "SELECT id_team_leader FROM team_leader WHERE email_team_leader = ? LIMIT 1",
      [email_team_leader],
    );

    if (existRows.length > 0) {
      return res.status(409).json({ error: "Team Leader already exists" });
    }

    // 2) hash password
    const hashed = await bcrypt.hash(password_team_leader, 10);

    // 3) Upload file ke Cloudinary
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

    // 4) insert user
    const [insertRes] = await db.query(
      "INSERT INTO team_leader (name_team_leader, major_team_leader, email_team_leader, password_team_leader, phone_number_team_leader, student_id_card, twibbon, following_instagram, following_linkedin, following_tiktok, instagram_story, repost_competition_instagram, id_platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name_team_leader,
        major_team_leader,
        email_team_leader,
        hashed,
        phone_number_team_leader,
        student_id_card,
        twibbonUrl,
        followingInstagramUrl,
        followingLinkedinUrl,
        followingTiktokUrl,
        instagramStoryUrl,
        repostCompetitionInstagramUrl,
        1,
      ],
    );

    // 4) ambil user baru
    const [newUserRows] = await db.query(
      "SELECT id_team_leader, name_team_leader, major_team_leader, email_team_leader, phone_number_team_leader, student_id_card, twibbon, following_instagram, following_linkedin, following_tiktok, instagram_story, repost_competition_instagram, id_platform FROM team_leader WHERE id_team_leader = ?",
      [insertRes.insertId],
    );

    const newUser = newUserRows[0];

    // 5) buat token
    const token = signToken(newUser);

    return res.status(201).json({ user: sanitizeUser(newUser), token });
  } catch (err) {
    console.error("signUp error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// --- SIGN IN ---
export const signIn = async (req, res) => {
  const { email_team_leader, password_team_leader } = req.body;

  try {
    // 1) ambil user
    const [rows] = await db.query(
      "SELECT id_team_leader, name_team_leader, major_team_leader, email_team_leader, password_team_leader, phone_number_team_leader, student_id_card, twibbon, following_instagram, following_linkedin, following_tiktok, instagram_story, repost_competition_instagram, id_platform FROM team_leader WHERE email_team_leader = ? LIMIT 1",
      [email_team_leader],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Team Leader not found" });
    }

    const user = rows[0];

    // 2) verifikasi password
    const ok = await bcrypt.compare(
      password_team_leader,
      user.password_team_leader,
    );

    if (!ok) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const team = await getTeamById(user.id_team_leader);

    const member = await getAllMemberById(team.id_team);

    // 3) buat token
    const token = signToken(user);

    return res.status(200).json({
      user: sanitizeUser(user),
      team: team ? team : [],
      member: member || [],
      token,
    });
  } catch (err) {
    console.error("signIn error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllTeamLeaders = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_team_leader, name_team_leader, major_team_leader, email_team_leader, phone_number_team_leader, student_id_card, twibbon, following_instagram, following_linkedin, following_tiktok, instagram_story, repost_competition_instagram, id_platform FROM team_leader",
    );

    return res.status(200).json({ teamLeaders: rows });
  } catch (err) {
    console.error("getAllTeamLeaders error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
