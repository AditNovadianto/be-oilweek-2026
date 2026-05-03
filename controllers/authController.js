import { db } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
