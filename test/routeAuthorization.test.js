import assert from "node:assert/strict";
import test from "node:test";
import authRoute from "../routes/authRoute.js";
import competitionRoute from "../routes/competitionRoute.js";
import discountCodeRoute from "../routes/discountCodeRoute.js";
import registrationRoute from "../routes/registrationRoute.js";
import teamLeaderRoute from "../routes/teamLeaderRoute.js";

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
      "multerMiddleware",
      "updateRegistration",
    ],
  );
});
