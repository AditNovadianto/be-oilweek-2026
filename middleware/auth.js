import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

export const getActorType = (decoded) => {
  if (decoded.actor_type === "USER" || decoded.actor_type === "TEAM_LEADER") {
    return decoded.actor_type;
  }

  if (decoded.email_user) {
    return "USER";
  }

  if (decoded.email_team_leader) {
    return "TEAM_LEADER";
  }

  return null;
};

export const resolveActor = async (
  decoded,
  query = db.query.bind(db),
) => {
  const actorType = getActorType(decoded);

  if (actorType === "USER") {
    const [rows] = await query(
      `SELECT users.id_user, users.id_role, roles.name_role
       FROM users
       LEFT JOIN roles ON roles.id_role = users.id_role
       WHERE users.id_user = ?
       LIMIT 1`,
      [decoded.sub],
    );

    if (rows.length === 0) {
      return null;
    }

    return {
      actorType,
      actorId: rows[0].id_user,
      roleId: rows[0].id_role,
      roleName: rows[0].name_role,
    };
  }

  if (actorType === "TEAM_LEADER") {
    const [rows] = await query(
      `SELECT id_team_leader
       FROM team_leader
       WHERE id_team_leader = ?
       LIMIT 1`,
      [decoded.sub],
    );

    if (rows.length === 0) {
      return null;
    }

    return {
      actorType,
      actorId: rows[0].id_team_leader,
      roleId: null,
      roleName: null,
    };
  }

  return null;
};

export async function verifyToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "my-app",
      audience: "my-app-users",
      algorithms: ["HS256"],
    });

    const actor = await resolveActor(decoded);

    if (!actor) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Simpan payload ke request
    req.user = decoded;
    req.auth = actor;

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      return res.status(403).json({ error: "Invalid token" });
    }

    return next(err);
  }
}

export function requireInternalUser(req, res, next) {
  if (req.auth?.actorType !== "USER") {
    return res.status(403).json({ error: "Forbidden" });
  }

  return next();
}

export function requireGlobalAdmin(req, res, next) {
  if (req.auth?.actorType !== "USER" || Number(req.auth.roleId) !== 1) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return next();
}

export function requireTeamLeader(req, res, next) {
  if (req.auth?.actorType !== "TEAM_LEADER") {
    return res.status(403).json({ error: "Forbidden" });
  }

  return next();
}
