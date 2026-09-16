import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessCompetition,
  canAccessResource,
  resolveMemberResource,
  resolveRegistrationResource,
  resolveTeamResource,
} from "../middleware/resourceAccess.js";

const globalAdmin = {
  actorType: "USER",
  actorId: 1,
  roleId: 1,
};

const petrosmartAdmin = {
  actorType: "USER",
  actorId: 8,
  roleId: 2,
};

const teamLeader = {
  actorType: "TEAM_LEADER",
  actorId: 2,
  roleId: null,
};

test("resource access allows internal users and enforces team ownership", () => {
  const resource = {
    ownerId: 2,
    competitionIds: [1, 3],
  };

  assert.equal(canAccessResource(globalAdmin, resource), true);
  assert.equal(canAccessResource(petrosmartAdmin, resource), true);
  assert.equal(canAccessResource(teamLeader, resource), true);
  assert.equal(canAccessResource(petrosmartAdmin, resource), true);
  assert.equal(
    canAccessResource({ ...teamLeader, actorId: 3 }, resource),
    false,
  );
});

test("team leaders need a registration for competition access", async () => {
  const allowed = await canAccessCompetition(
    teamLeader,
    1,
    async (sql, values) => {
      assert.match(sql, /FROM registration/);
      assert.deepEqual(values, [2, 1]);
      return [[{ id_registration: 9 }]];
    },
  );
  const denied = await canAccessCompetition(teamLeader, 2, async () => [[]]);

  assert.equal(allowed, true);
  assert.equal(denied, false);
});

test("competition admins retain access to every competition", async () => {
  let queryCalled = false;
  const allowed = await canAccessCompetition(
    petrosmartAdmin,
    6,
    async () => {
      queryCalled = true;
      return [[]];
    },
  );

  assert.equal(allowed, true);
  assert.equal(queryCalled, false);
});

test("team resources collect every registered competition", async () => {
  const resource = await resolveTeamResource(10, async (sql, values) => {
    assert.match(sql, /WHERE team\.id_team = \?/);
    assert.deepEqual(values, [10]);
    return [
      [
        { id_team_leader: 2, id_competition: 1 },
        { id_team_leader: 2, id_competition: 3 },
      ],
    ];
  });

  assert.deepEqual(resource, {
    ownerId: 2,
    competitionIds: [1, 3],
  });
});

test("member and registration resources preserve ownership", async () => {
  const member = await resolveMemberResource(7, async () => [
    [{ id_team_leader: 2, id_competition: 1 }],
  ]);
  const registration = await resolveRegistrationResource(4, async () => [
    [{ id_team_leader: 2, id_competition: 3 }],
  ]);

  assert.deepEqual(member, { ownerId: 2, competitionIds: [1] });
  assert.deepEqual(registration, { ownerId: 2, competitionIds: [3] });
});
