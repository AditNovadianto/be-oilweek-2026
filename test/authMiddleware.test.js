import assert from "node:assert/strict";
import test from "node:test";
import {
  getActorType,
  requireGlobalAdmin,
  requireInternalUser,
  requireTeamLeader,
  resolveActor,
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
  });
  assert.deepEqual(queries[0].values, [8]);
  assert.match(queries[0].sql, /LEFT JOIN roles/);
  assert.equal(queries.length, 1);
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
  });
  const teamLeader = runMiddleware(requireInternalUser, {
    actorType: "TEAM_LEADER",
  });

  assert.equal(internalUser.nextCalled, true);
  assert.equal(teamLeader.res.statusCode, 403);
});

test("requireInternalUser allows competition admins without a scope", () => {
  const result = runMiddleware(requireInternalUser, {
    actorType: "USER",
    roleId: 2,
  });

  assert.equal(result.res.statusCode, null);
  assert.equal(result.nextCalled, true);
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
