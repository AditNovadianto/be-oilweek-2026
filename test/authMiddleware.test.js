import assert from "node:assert/strict";
import test from "node:test";
import {
  getActorType,
  requireGlobalAdmin,
  requireInternalUser,
  requireTeamLeader,
  resolveActor,
  resolveCompetitionScope,
} from "../middleware/auth.js";

const createResponse = () => {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
};

const runMiddleware = (middleware, auth) => {
  const req = { auth };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  return { res, nextCalled };
};

test("legacy JWT claim shapes resolve to the correct actor type", () => {
  assert.equal(getActorType({ email_user: "admin@example.com" }), "USER");
  assert.equal(
    getActorType({ email_team_leader: "leader@example.com" }),
    "TEAM_LEADER",
  );
  assert.equal(getActorType({ actor_type: "USER" }), "USER");
  assert.equal(getActorType({ sub: 1 }), null);
});

test("resolveActor loads an internal user's current database role", async () => {
  const queries = [];
  const query = async (sql, values) => {
    queries.push({ sql, values });

    if (sql.includes("FROM competition")) {
      return [[{ id_competition: 1 }]];
    }

    return [
      [
        {
          id_user: 8,
          id_role: 2,
          name_role: "ADMIN PETROSMART",
        },
      ],
    ];
  };

  const actor = await resolveActor(
    { sub: 8, email_user: "admin@example.com" },
    query,
  );

  assert.deepEqual(actor, {
    actorType: "USER",
    actorId: 8,
    roleId: 2,
    roleName: "ADMIN PETROSMART",
    competitionId: 1,
  });
  assert.deepEqual(queries[0].values, [8]);
  assert.match(queries[0].sql, /LEFT JOIN roles/);
  assert.doesNotMatch(queries[0].sql, /roles\.id_competition/);
  assert.deepEqual(queries[1].values, ["%PETROSMART%"]);
});

test("competition scope resolves from existing role and competition data", async () => {
  const scope = await resolveCompetitionScope(
    3,
    "ADMIN PAPER & POSTER",
    async (sql, values) => {
      assert.match(sql, /FROM competition/);
      assert.deepEqual(values, ["%PAPER%POSTER%"]);
      return [[{ id_competition: 2 }]];
    },
  );

  assert.equal(scope, 2);
});

test("competition scope fails closed for changed roles or ambiguous data", async () => {
  let queryCalled = false;
  const changedRole = await resolveCompetitionScope(
    2,
    "ADMIN OTHER",
    async () => {
      queryCalled = true;
      return [[]];
    },
  );
  const ambiguousCompetition = await resolveCompetitionScope(
    2,
    "ADMIN PETROSMART",
    async () => [
      [{ id_competition: 1 }, { id_competition: 8 }],
    ],
  );

  assert.equal(changedRole, null);
  assert.equal(queryCalled, false);
  assert.equal(ambiguousCompetition, null);
});

test("resolveActor loads team leaders without an admin role", async () => {
  const actor = await resolveActor(
    { sub: 2, actor_type: "TEAM_LEADER" },
    async () => [[{ id_team_leader: 2 }]],
  );

  assert.deepEqual(actor, {
    actorType: "TEAM_LEADER",
    actorId: 2,
    roleId: null,
    roleName: null,
    competitionId: null,
  });
});

test("requireGlobalAdmin allows only role 1 internal users", () => {
  const allowed = runMiddleware(requireGlobalAdmin, {
    actorType: "USER",
    roleId: 1,
  });
  const competitionAdmin = runMiddleware(requireGlobalAdmin, {
    actorType: "USER",
    roleId: 2,
  });
  const teamLeader = runMiddleware(requireGlobalAdmin, {
    actorType: "TEAM_LEADER",
    roleId: null,
  });

  assert.equal(allowed.nextCalled, true);
  assert.equal(competitionAdmin.res.statusCode, 403);
  assert.deepEqual(competitionAdmin.res.body, { error: "Forbidden" });
  assert.equal(teamLeader.res.statusCode, 403);
});

test("requireInternalUser rejects team leaders", () => {
  const internalUser = runMiddleware(requireInternalUser, {
    actorType: "USER",
    roleId: 2,
    competitionId: 1,
  });
  const teamLeader = runMiddleware(requireInternalUser, {
    actorType: "TEAM_LEADER",
  });

  assert.equal(internalUser.nextCalled, true);
  assert.equal(teamLeader.res.statusCode, 403);
});

test("requireInternalUser rejects competition admins without a scope", () => {
  const result = runMiddleware(requireInternalUser, {
    actorType: "USER",
    roleId: 2,
    competitionId: null,
  });

  assert.equal(result.res.statusCode, 403);
  assert.equal(result.nextCalled, false);
});

test("requireTeamLeader rejects internal users", () => {
  const teamLeader = runMiddleware(requireTeamLeader, {
    actorType: "TEAM_LEADER",
  });
  const internalUser = runMiddleware(requireTeamLeader, {
    actorType: "USER",
  });

  assert.equal(teamLeader.nextCalled, true);
  assert.equal(internalUser.res.statusCode, 403);
});
