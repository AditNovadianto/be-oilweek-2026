import { db } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { transporter } from "../utils/mailer.js";

const signToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign(
    {
      sub: user.id_user,
      name_user: user.name_user,
      email_user: user.email_user,
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
  id_user: u.id_user,
  name_user: u.name_user,
  email_user: u.email_user,
  id_platform: u.id_platform,
  id_role: u.id_role,
});

// --- SIGN UP ---
export const signUp = async (req, res) => {
  const { name_user, email_user, password_user, id_role } = req.body;

  try {
    // 1) cek user sudah ada?
    const [existRows] = await db.query(
      "SELECT id_user FROM users WHERE email_user = ? LIMIT 1",
      [email_user],
    );

    if (existRows.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    // 2) hash password
    const hashed = await bcrypt.hash(password_user, 10);

    // 3) insert user
    const [insertRes] = await db.query(
      "INSERT INTO users (name_user, email_user, password_user, id_platform, id_role) VALUES (?, ?, ?, ?, ?)",
      [name_user, email_user, hashed, 1, id_role],
    );

    // 4) ambil user baru
    const [newUserRows] = await db.query(
      "SELECT id_user, name_user, email_user, id_role FROM users WHERE id_user = ?",
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
  const { email_user, password_user } = req.body;

  try {
    // 1) ambil user
    const [rows] = await db.query(
      "SELECT id_user, name_user, email_user, password_user, id_role FROM users WHERE email_user = ? LIMIT 1",
      [email_user],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    // 2) verifikasi password
    const ok = await bcrypt.compare(password_user, user.password_user);

    if (!ok) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // 3) buat token
    const token = signToken(user);

    return res.status(200).json({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error("signIn error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_user, name_user, email_user, id_role FROM users",
    );

    return res.status(200).json({ users: rows });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
  const { email_user } = req.body;

  if (!email_user) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const [rows] = await db.query(
      `SELECT id_user, name_user, email_user 
       FROM users 
       WHERE email_user = ? 
       LIMIT 1`,
      [email_user],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    const resetToken = jwt.sign(
      {
        id_user: user.id_user,
        email_user: user.email_user,
        type: "password-reset-user",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
        issuer: "my-app",
        audience: "my-app-users",
        algorithm: "HS256",
      },
    );

    const resetUrl = `${process.env.FRONTEND_URL}/user/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"OilWeek 2026" <${process.env.EMAIL_USER}>`,
      to: user.email_user,
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
                Hi <strong>${user.name_user}</strong>,
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
    console.error("forgotPassword user error:", err);
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

    if (decoded.type !== "password-reset-user") {
      return res.status(400).json({
        error: "Invalid token type",
      });
    }

    const [rows] = await db.query(
      `SELECT id_user 
       FROM users 
       WHERE id_user = ? 
       LIMIT 1`,
      [decoded.id_user],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
      `UPDATE users 
       SET password_user = ? 
       WHERE id_user = ?`,
      [hashedPassword, decoded.id_user],
    );

    return res.status(200).json({
      message: "Password has been reset successfully",
    });
  } catch (err) {
    console.error("resetPassword user error:", err);

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
