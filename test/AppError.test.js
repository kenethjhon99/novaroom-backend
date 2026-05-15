import test from "node:test";
import assert from "node:assert/strict";

import { AppError } from "../src/utils/AppError.js";

test("AppError carries status, details and stable code", () => {
  const error = new AppError("No permitido", 403, { permission: "x" }, "PERMISSION_DENIED");

  assert.equal(error.message, "No permitido");
  assert.equal(error.statusCode, 403);
  assert.deepEqual(error.details, { permission: "x" });
  assert.equal(error.code, "PERMISSION_DENIED");
});
