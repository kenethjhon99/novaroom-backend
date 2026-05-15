import { createHash, randomBytes } from "crypto";

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export const createApiKey = () => {
  const secret = randomBytes(32).toString("base64url");
  const key = `nr_live_${secret}`;

  return {
    key,
    hash: sha256(key),
    prefix: key.slice(0, 16),
  };
};
