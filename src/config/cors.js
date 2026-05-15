import { env } from "./env.js";

const values = env.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const wildcardToRegExp = (value) => {
  const escaped = value
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`);
};

const wildcardOrigins = values
  .filter((origin) => origin.includes("*") && origin !== "*")
  .map(wildcardToRegExp);

const exactOrigins = new Set(values.filter((origin) => !origin.includes("*")));
const allowAll = values.includes("*");

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowAll) return true;
  if (exactOrigins.has(origin)) return true;

  return wildcardOrigins.some((pattern) => pattern.test(origin));
};

export const corsOriginDelegate = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error("CORS_ORIGIN_FORBIDDEN"));
};
