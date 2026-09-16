import assert from "node:assert/strict";
import test from "node:test";
import { db } from "../config/db.js";
import {
  forgotPassword as forgotUserPassword,
  signIn as signInUser,
} from "../controllers/authController.js";
import {
  forgotPassword as forgotTeamLeaderPassword,
  signIn as signInTeamLeader,
} from "../controllers/teamLeaderController.js";
import { transporter } from "../utils/mailer.js";

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

const callController = async (controller, body) => {
  const res = createResponse();
  await controller({ body }, res);
  return res;
};

test("unknown sign-in accounts keep their existing 404 behavior", async (t) => {
  const originalQuery = db.query;
  db.query = async () => [[]];
  t.after(() => {
    db.query = originalQuery;
  });

  const userResponse = await callController(signInUser, {
    email_user: "unknown@example.com",
    password_user: "Password123!",
  });
  const teamLeaderResponse = await callController(signInTeamLeader, {
    email_team_leader: "unknown@example.com",
    password_team_leader: "Password123!",
  });

  assert.equal(userResponse.statusCode, 404);
  assert.deepEqual(userResponse.body, { error: "User not found" });
  assert.equal(teamLeaderResponse.statusCode, 404);
  assert.deepEqual(teamLeaderResponse.body, {
    error: "Team Leader not found",
  });
});

test("forgot-password responses do not reveal account existence", async (t) => {
  const originalQuery = db.query;
  const originalSendMail = transporter.sendMail;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalFrontendUrl = process.env.FRONTEND_URL;

  process.env.JWT_SECRET = "test-secret";
  process.env.FRONTEND_URL = "http://localhost:5173";
  transporter.sendMail = async () => ({ accepted: ["known@example.com"] });

  t.after(() => {
    db.query = originalQuery;
    transporter.sendMail = originalSendMail;

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });

  db.query = async () => [[]];
  const unknownUser = await callController(forgotUserPassword, {
    email_user: "unknown@example.com",
  });
  const unknownTeamLeader = await callController(forgotTeamLeaderPassword, {
    email_team_leader: "unknown@example.com",
  });

  db.query = async (sql) => {
    if (sql.includes("FROM users")) {
      return [
        [
          {
            id_user: 1,
            name_user: "Known User",
            email_user: "known@example.com",
          },
        ],
      ];
    }

    return [
      [
        {
          id_team_leader: 1,
          name_team_leader: "Known Leader",
          email_team_leader: "known@example.com",
        },
      ],
    ];
  };

  const knownUser = await callController(forgotUserPassword, {
    email_user: "known@example.com",
  });
  const knownTeamLeader = await callController(forgotTeamLeaderPassword, {
    email_team_leader: "known@example.com",
  });

  assert.equal(unknownUser.statusCode, 200);
  assert.deepEqual(unknownUser.body, knownUser.body);
  assert.equal(unknownTeamLeader.statusCode, 200);
  assert.deepEqual(unknownTeamLeader.body, knownTeamLeader.body);
});
