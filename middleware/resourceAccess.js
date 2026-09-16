import { db } from "../config/db.js";
import CompetitionStage from "../models/competitionStageModel.js";
import CompetitionStageInfo from "../models/competitionStageInfoModel.js";
import StageSubmission from "../models/stageSubmissionModel.js";

export const isGlobalAdmin = (auth) => {
  return auth?.actorType === "USER" && Number(auth.roleId) === 1;
};

export const getCompetitionScope = (auth) => {
  return isGlobalAdmin(auth) ? null : auth?.competitionId;
};

export const canAccessResource = (auth, resource) => {
  if (isGlobalAdmin(auth)) {
    return true;
  }

  if (auth?.actorType === "TEAM_LEADER") {
    return Number(resource.ownerId) === Number(auth.actorId);
  }

  if (auth?.actorType === "USER") {
    return resource.competitionIds.some(
      (id) => Number(id) === Number(auth.competitionId),
    );
  }

  return false;
};

export const canAccessCompetition = async (
  auth,
  idCompetition,
  query = db.query.bind(db),
) => {
  if (isGlobalAdmin(auth)) {
    return true;
  }

  if (auth?.actorType === "USER") {
    return Number(auth.competitionId) === Number(idCompetition);
  }

  if (auth?.actorType === "TEAM_LEADER") {
    const [rows] = await query(
      `SELECT id_registration
       FROM registration
       WHERE id_team_leader = ? AND id_competition = ?
       LIMIT 1`,
      [auth.actorId, idCompetition],
    );

    return rows.length > 0;
  }

  return false;
};

const toResource = (rows) => {
  if (rows.length === 0) {
    return null;
  }

  return {
    ownerId: rows[0].id_team_leader,
    competitionIds: rows
      .map((row) => row.id_competition)
      .filter((id) => id !== null && id !== undefined),
  };
};

export const resolveTeamLeaderResource = async (
  idTeamLeader,
  query = db.query.bind(db),
) => {
  const [rows] = await query(
    `SELECT team_leader.id_team_leader, registration.id_competition
     FROM team_leader
     LEFT JOIN registration
       ON registration.id_team_leader = team_leader.id_team_leader
     WHERE team_leader.id_team_leader = ?`,
    [idTeamLeader],
  );

  return toResource(rows);
};

export const resolveTeamResource = async (
  idTeam,
  query = db.query.bind(db),
) => {
  const [rows] = await query(
    `SELECT team.id_team_leader, registration.id_competition
     FROM team
     LEFT JOIN registration
       ON registration.id_team_leader = team.id_team_leader
     WHERE team.id_team = ?`,
    [idTeam],
  );

  return toResource(rows);
};

export const resolveMemberResource = async (
  idMember,
  query = db.query.bind(db),
) => {
  const [rows] = await query(
    `SELECT team.id_team_leader, registration.id_competition
     FROM member
     INNER JOIN team ON team.id_team = member.id_team
     LEFT JOIN registration
       ON registration.id_team_leader = team.id_team_leader
     WHERE member.id_member = ?`,
    [idMember],
  );

  return toResource(rows);
};

export const resolveRegistrationResource = async (
  idRegistration,
  query = db.query.bind(db),
) => {
  const [rows] = await query(
    `SELECT id_team_leader, id_competition
     FROM registration
     WHERE id_registration = ?
     LIMIT 1`,
    [idRegistration],
  );

  return toResource(rows);
};

export const resolveStageCompetition = async (idStage) => {
  const stage = await CompetitionStage.findById(idStage).lean();
  return stage ? stage.id_competition : null;
};

export const resolveStageInfoCompetition = async (idStageInfo) => {
  const stageInfo = await CompetitionStageInfo.findById(idStageInfo).lean();

  if (!stageInfo) {
    return null;
  }

  return resolveStageCompetition(stageInfo.id_stage);
};

export const resolveSubmissionResource = async (idSubmission) => {
  const submission = await StageSubmission.findById(idSubmission).lean();

  if (!submission) {
    return null;
  }

  const [idCompetition, teamResource] = await Promise.all([
    resolveStageCompetition(submission.id_stage),
    resolveTeamResource(submission.id_team),
  ]);

  if (idCompetition === null || !teamResource) {
    return null;
  }

  return {
    ownerId: teamResource.ownerId,
    competitionIds: [idCompetition],
  };
};

const requireResourceAccess = async (req, res, next, id, resolver) => {
  if (isGlobalAdmin(req.auth)) {
    return next();
  }

  try {
    const resource = await resolver(id);

    if (!resource || !canAccessResource(req.auth, resource)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next(error);
  }
};

export function requireTeamLeaderParamAccess(req, res, next) {
  return requireResourceAccess(
    req,
    res,
    next,
    req.params.id_team_leader,
    resolveTeamLeaderResource,
  );
}

export function requireTeamParamAccess(req, res, next) {
  return requireResourceAccess(
    req,
    res,
    next,
    req.params.id,
    resolveTeamResource,
  );
}

export function requireTeamBodyAccess(req, res, next) {
  return requireResourceAccess(
    req,
    res,
    next,
    req.body.id_team,
    resolveTeamResource,
  );
}

export function requireTeamRouteParamAccess(req, res, next) {
  return requireResourceAccess(
    req,
    res,
    next,
    req.params.id_team,
    resolveTeamResource,
  );
}

export function requireMemberParamAccess(req, res, next) {
  return requireResourceAccess(
    req,
    res,
    next,
    req.params.id,
    resolveMemberResource,
  );
}

export function requireRegistrationParamAccess(req, res, next) {
  return requireResourceAccess(
    req,
    res,
    next,
    req.params.id,
    resolveRegistrationResource,
  );
}

const requireCompetitionAccess = async (
  req,
  res,
  next,
  idCompetition,
) => {
  try {
    if (!(await canAccessCompetition(req.auth, idCompetition))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next(error);
  }
};

export function requireCompetitionBodyAccess(req, res, next) {
  if (req.body.id_competition === undefined) {
    return next();
  }

  return requireCompetitionAccess(
    req,
    res,
    next,
    req.body.id_competition,
  );
}

export function requireCompetitionParamAccess(req, res, next) {
  return requireCompetitionAccess(
    req,
    res,
    next,
    req.params.id_competition,
  );
}

const requireStageAccess = async (req, res, next, idStage) => {
  try {
    const idCompetition = await resolveStageCompetition(idStage);

    if (
      idCompetition === null ||
      !(await canAccessCompetition(req.auth, idCompetition))
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next(error);
  }
};

export function requireStageParamAccess(req, res, next) {
  return requireStageAccess(req, res, next, req.params.id);
}

export function requireStageRouteParamAccess(req, res, next) {
  return requireStageAccess(req, res, next, req.params.id_stage);
}

export function requireStageBodyAccess(req, res, next) {
  if (req.body.id_stage === undefined) {
    return next();
  }

  return requireStageAccess(req, res, next, req.body.id_stage);
}

export async function requireStageInfoParamAccess(req, res, next) {
  try {
    const idCompetition = await resolveStageInfoCompetition(req.params.id);

    if (
      idCompetition === null ||
      !(await canAccessCompetition(req.auth, idCompetition))
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next(error);
  }
}

export function requireSubmissionParamAccess(req, res, next) {
  return requireResourceAccess(
    req,
    res,
    next,
    req.params.id,
    resolveSubmissionResource,
  );
}
