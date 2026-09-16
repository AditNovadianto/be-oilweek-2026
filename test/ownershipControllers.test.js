import assert from "node:assert/strict";
import test from "node:test";
import { db } from "../config/db.js";
import { redeemDiscountCode } from "../controllers/discountCodeController.js";
import { updateStageSubmission } from "../controllers/stageSubmissionController.js";
import { filterPickupInformation } from "../controllers/competitionStageInfoController.js";

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

test("discount redemption derives the team leader from authentication", async (t) => {
  const originalQuery = db.query;
  let queryValues = null;

  db.query = async (sql, values) => {
    assert.match(sql, /FROM registration/);
    queryValues = values;
    return [[]];
  };

  t.after(() => {
    db.query = originalQuery;
  });

  const res = createResponse();
  await redeemDiscountCode(
    {
      auth: { actorId: 2 },
      body: {
        code: "TEST",
        id_team_leader: 999,
        id_registration: 4,
        transaction_amount: 100000,
      },
    },
    res,
  );

  assert.deepEqual(queryValues, [4, 2]);
  assert.equal(res.statusCode, 403);
});

test("team leaders cannot set submission review fields", async () => {
  const res = createResponse();

  await updateStageSubmission(
    {
      auth: { actorType: "TEAM_LEADER" },
      params: { id: "507f1f77bcf86cd799439011" },
      body: { submission_status: "APPROVED" },
      file: null,
    },
    res,
  );

  assert.equal(res.statusCode, 403);
});

test("competition admins cannot replace team submission content", async () => {
  const res = createResponse();

  await updateStageSubmission(
    {
      auth: { actorType: "USER", competitionId: 1 },
      params: { id: "507f1f77bcf86cd799439011" },
      body: { submission_title: "Replaced" },
      file: null,
    },
    res,
  );

  assert.equal(res.statusCode, 403);
});

test("team leaders only receive their own pickup information", () => {
  const filtered = filterPickupInformation(
    {
      id_stage: "stage-1",
      team_pickup_information: [
        { team_id: "1", location_name: "Other Team" },
        { team_id: "2", location_name: "Own Team" },
      ],
    },
    2,
  );

  assert.deepEqual(filtered.team_pickup_information, [
    { team_id: "2", location_name: "Own Team" },
  ]);
});
