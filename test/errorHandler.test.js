import assert from "node:assert/strict";
import test from "node:test";
import multer from "multer";
import { errorHandler } from "../middleware/errorHandler.js";

const createResponse = () => {
  return {
    headersSent: false,
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

test("file-size errors return JSON without a stack trace", () => {
  const err = new multer.MulterError("LIMIT_FILE_SIZE", "payment_proof");
  const res = createResponse();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 413);
  assert.deepEqual(res.body, {
    error: "File exceeds the allowed size",
    code: "LIMIT_FILE_SIZE",
  });
  assert.equal(JSON.stringify(res.body).includes("stack"), false);
  assert.equal(JSON.stringify(res.body).includes("/app/"), false);
});

test("unexpected multipart fields return a generic JSON error", () => {
  const err = new multer.MulterError(
    "LIMIT_UNEXPECTED_FILE",
    "attacker-controlled-field",
  );
  const res = createResponse();

  errorHandler(err, {}, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error: "Invalid multipart request",
    code: "LIMIT_UNEXPECTED_FILE",
  });
  assert.equal(JSON.stringify(res.body).includes(err.field), false);
});
