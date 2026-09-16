import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

const competitionAdminRoles = new Map([
  [2, { name: "ADMIN PETROSMART", pattern: "%PETROSMART%" }],
  [3, { name: "ADMIN PAPER & POSTER", pattern: "%PAPER%POSTER%" }],
  [4, { name: "ADMIN BUSINESS CASE", pattern: "%BUSINESS%CASE%" }],
  [5, { name: "ADMIN MUD INNOVATION", pattern: "%MUD%INNOVATION%" }],
  [6, { name: "ADMIN WELL STIMULATION", pattern: "%WELL%STIMULATION%" }],
  [7, { name: "ADMIN CASE STUDY", pattern: "%CASE%STUDY%" }],
]);

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

export const resolveCompetitionScope = async (
  roleId,
  roleName,
  query = db.query.bind(db),
) => {
  const role = competitionAdminRoles.get(Number(roleId));

  if (role?.name !== String(roleName).trim().toUpperCase()) {
    return null;
  }

  const [rows] = await query(
    `SELECT id_competition
     FROM competition
     WHERE UPPER(name_competition) LIKE ?
     ORDER BY id_competition`,
    [role.pattern],
  );

  return rows.length === 1 ? rows[0].id_competition : null;
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

    const competitionId = await resolveCompetitionScope(
      rows[0].id_role,
      rows[0].name_role,
      query,
    );

    return {
      actorType,
      actorId: rows[0].id_user,
      roleId: rows[0].id_role,
      roleName: rows[0].name_role,
      competitionId,
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
      competitionId: null,
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
  const isGlobalAdmin = Number(req.auth?.roleId) === 1;
  const hasCompetitionScope = req.auth?.competitionId != null;

  if (
    req.auth?.actorType !== "USER" ||
    (!isGlobalAdmin && !hasCompetitionScope)
  ) {
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
