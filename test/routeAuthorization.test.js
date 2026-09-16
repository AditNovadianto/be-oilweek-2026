import assert from "node:assert/strict";
import test from "node:test";
import authRoute from "../routes/authRoute.js";
import competitionRoute from "../routes/competitionRoute.js";
import discountCodeRoute from "../routes/discountCodeRoute.js";
import registrationRoute from "../routes/registrationRoute.js";
import teamLeaderRoute from "../routes/teamLeaderRoute.js";
import teamRoute from "../routes/teamRoute.js";
import memberRoute from "../routes/memberRoute.js";
import competitionStageRoute from "../routes/competitionStageRoute.js";
import stageSubmissionRoute from "../routes/stageSubmissionRoute.js";

const getHandlers = (router, method, path) => {
  const layer = router.stack.find(
    (item) => item.route?.path === path && item.route?.methods?.[method],
  );

  assert.ok(layer, `${method.toUpperCase()} ${path} route not found`);

  return layer.route.stack.map((item) => item.handle.name);
};

test("internal user creation requires a global admin", () => {
  assert.deepEqual(getHandlers(authRoute, "post", "/signUpUser"), [
    "verifyToken",
    "requireGlobalAdmin",
    "signUp",
  ]);
});

test("competition writes require a global admin", () => {
  assert.deepEqual(
    getHandlers(competitionRoute, "post", "/createCompetition"),
    ["verifyToken", "requireGlobalAdmin", "createCompetition"],
  );
  assert.deepEqual(
    getHandlers(competitionRoute, "delete", "/deleteCompetition/:id"),
    ["verifyToken", "requireGlobalAdmin", "deleteCompetition"],
  );
});

test("discount administration is separated from team-leader redemption", () => {
  assert.deepEqual(
    getHandlers(discountCodeRoute, "post", "/createDiscountCode"),
    ["verifyToken", "requireGlobalAdmin", "createDiscountCode"],
  );
  assert.deepEqual(
    getHandlers(discountCodeRoute, "post", "/redeemDiscountCode"),
    ["verifyToken", "requireTeamLeader", "redeemDiscountCode"],
  );
});

test("aggregate PII and payment updates require internal users", () => {
  assert.deepEqual(
    getHandlers(teamLeaderRoute, "get", "/getAllTeamLeaders"),
    ["verifyToken", "requireInternalUser", "getAllTeamLeaders"],
  );
  assert.deepEqual(
    getHandlers(registrationRoute, "put", "/updateRegistration/:id"),
    [
      "verifyToken",
      "requireInternalUser",
      "requireRegistrationParamAccess",
      "multerMiddleware",
      "updateRegistration",
    ],
  );
});

test("team and member lookups enforce resource ownership", () => {
  assert.deepEqual(
    getHandlers(teamRoute, "get", "/getTeamById/:id_team_leader"),
    ["verifyToken", "requireTeamLeaderParamAccess", "getTeamById"],
  );
  assert.deepEqual(
    getHandlers(memberRoute, "get", "/getAllMemberById/:id_team"),
    ["verifyToken", "requireTeamRouteParamAccess", "getAllMemberById"],
  );
  assert.deepEqual(getHandlers(memberRoute, "delete", "/deleteMember/:id"), [
    "verifyToken",
    "requireMemberParamAccess",
    "deleteMember",
  ]);
});

test("stage routes retain resource access gates", () => {
  assert.deepEqual(
    getHandlers(
      competitionStageRoute,
      "get",
      "/getStagesByIdCompetition/:id_competition",
    ),
    [
      "verifyToken",
      "requireCompetitionParamAccess",
      "getCompetitionStagesByIdCompetition",
    ],
  );
  assert.deepEqual(
    getHandlers(competitionStageRoute, "put", "/updateStage/:id"),
    [
      "verifyToken",
      "requireInternalUser",
      "requireStageParamAccess",
      "requireCompetitionBodyAccess",
      "updateCompetitionStage",
    ],
  );
});

test("submission access resolves both stage and team ownership", () => {
  assert.deepEqual(
    getHandlers(stageSubmissionRoute, "post", "/createStageSubmission"),
    [
      "verifyToken",
      "requireTeamLeader",
      "multerMiddleware",
      "requireStageBodyAccess",
      "requireTeamBodyAccess",
      "createStageSubmission",
    ],
  );
  assert.deepEqual(
    getHandlers(stageSubmissionRoute, "delete", "/deleteStageSubmission/:id"),
    ["verifyToken", "requireSubmissionParamAccess", "deleteStageSubmission"],
  );
});
