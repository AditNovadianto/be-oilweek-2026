import assert from "node:assert/strict";
import test from "node:test";
import { db } from "../config/db.js";
import { getAllMembers } from "../models/memberModel.js";
import {
  getAllRegistrations,
  getRegistrationEligibility,
} from "../models/registrationModel.js";
import { getAllTeams } from "../models/teamModel.js";

test("competition-scoped list queries bind the competition ID", async (t) => {
  const originalQuery = db.query;
  const calls = [];

  db.query = async (sql, values = []) => {
    calls.push({ sql, values });
    return [[]];
  };

  t.after(() => {
    db.query = originalQuery;
  });

  await getAllTeams(3);
  await getAllMembers(3);
  await getAllRegistrations(3);

  assert.equal(calls.length, 3);

  for (const call of calls) {
    assert.deepEqual(call.values, [3]);
    assert.match(call.sql, /id_competition = \?/);
  }
});

test("registration eligibility requires a team member and no duplicate", async (t) => {
  const originalQuery = db.query;
  let call = 0;

  db.query = async () => {
    call += 1;

    if (call === 1) {
      return [[{ id_team: 1, member_count: 2 }]];
    }

    return [[]];
  };

  t.after(() => {
    db.query = originalQuery;
  });

  const eligibility = await getRegistrationEligibility(2, 1);

  assert.deepEqual(eligibility, {
    hasTeam: true,
    memberCount: 2,
    hasRegistration: false,
  });
});
