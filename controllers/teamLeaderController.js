import { db } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "../utils/uploadCloudinary.js";
import { getTeamById } from "../models/teamModel.js";
import { getAllMemberById } from "../models/memberModel.js";
import { transporter } from "../utils/mailer.js";

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

  if (!req.files) {
    return res.status(400).json({ error: "Semua file wajib diupload" });
  }

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
    const [
      twibbonUrl,
      followingInstagramUrl,
      followingLinkedinUrl,
      followingTiktokUrl,
      instagramStoryUrl,
      repostCompetitionInstagramUrl,
    ] = await Promise.all([
      uploadToCloudinary(twibbon[0].buffer),
      uploadToCloudinary(following_instagram[0].buffer),
      uploadToCloudinary(following_linkedin[0].buffer),
      uploadToCloudinary(following_tiktok[0].buffer),
      uploadToCloudinary(instagram_story[0].buffer),
      uploadToCloudinary(repost_competition_instagram[0].buffer),
    ]);

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

    const member = team ? await getAllMemberById(team.id_team) : [];

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

// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
  const { email_team_leader } = req.body;

  if (!email_team_leader) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const [rows] = await db.query(
      `SELECT id_team_leader, name_team_leader, email_team_leader 
       FROM team_leader 
       WHERE email_team_leader = ? 
       LIMIT 1`,
      [email_team_leader],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Team Leader not found" });
    }

    const user = rows[0];

    const resetToken = jwt.sign(
      {
        id_team_leader: user.id_team_leader,
        email_team_leader: user.email_team_leader,
        type: "password-reset",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
        issuer: "my-app",
        audience: "my-app-users",
        algorithm: "HS256",
      },
    );

    const resetUrl = `${process.env.FRONTEND_URL}/team-leader/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"OilWeek 2026" <${process.env.EMAIL_USER}>`,
      to: user.email_team_leader,
      subject: "Reset Password OilWeek 2026",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
            
            <div style="background: linear-gradient(135deg, #091025, #032155); padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                Reset Password
              </h1>
            </div>

            <div style="padding: 30px; color: #1f2937;">
              <p style="font-size: 16px;">
                Hi <strong>${user.name_team_leader}</strong>,
              </p>

              <p style="font-size: 15px; line-height: 1.7;">
                Kami menerima permintaan untuk mengatur ulang password akun OilWeek 2026 kamu.
              </p>

              <p style="font-size: 15px; line-height: 1.7;">
                Silakan klik tombol di bawah ini untuk membuat password baru.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a 
                  href="${resetUrl}"
                  style="display: inline-block; background: linear-gradient(135deg, #032155, #0ea5e9); color: #ffffff; text-decoration: none; padding: 14px 26px; border-radius: 10px; font-weight: bold;"
                >
                  Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; line-height: 1.7;">
                Link ini hanya berlaku selama <strong>15 menit</strong>. Jika kamu tidak meminta reset password, abaikan email ini.
              </p>

              <p style="font-size: 14px; color: #6b7280; word-break: break-all;">
                Jika tombol tidak bisa diklik, salin link berikut:
                <br />
                ${resetUrl}
              </p>
            </div>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      message: "Reset password link has been sent to your email",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// --- RESET PASSWORD ---
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({
      error: "Token and new password are required",
    });
  }

  if (new_password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "my-app",
      audience: "my-app-users",
      algorithms: ["HS256"],
    });

    if (decoded.type !== "password-reset") {
      return res.status(400).json({
        error: "Invalid token type",
      });
    }

    const [rows] = await db.query(
      `SELECT id_team_leader 
       FROM team_leader 
       WHERE id_team_leader = ? 
       LIMIT 1`,
      [decoded.id_team_leader],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Team Leader not found",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
      `UPDATE team_leader 
       SET password_team_leader = ? 
       WHERE id_team_leader = ?`,
      [hashedPassword, decoded.id_team_leader],
    );

    return res.status(200).json({
      message: "Password has been reset successfully",
    });
  } catch (err) {
    console.error("resetPassword error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(400).json({
        error: "Reset password link has expired",
      });
    }

    return res.status(400).json({
      error: "Invalid reset password token",
    });
  }
};
