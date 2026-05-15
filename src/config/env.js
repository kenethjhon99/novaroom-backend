import dotenv from "dotenv";

dotenv.config();

const required = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Variable de entorno obligatoria faltante: ${key}`);
  }

  return value;
};

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const corsOrigin = process.env.CORS_ORIGIN || (isProduction ? "" : "*");
const payloadLimit = process.env.PAYLOAD_LIMIT || "10mb";
const databaseUrl = process.env.DATABASE_URL || "";

const numberFromEnv = (key, fallback) => {
  const value = process.env[key];
  const parsed = value ? Number(value) : fallback;

  if (!Number.isFinite(parsed)) {
    throw new Error(`Variable de entorno numerica invalida: ${key}`);
  }

  return parsed;
};

if (isProduction && !corsOrigin) {
  throw new Error("CORS_ORIGIN es obligatorio en produccion");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 3000),

  db: {
    connectionString: databaseUrl || null,
    host: databaseUrl ? process.env.DB_HOST || "" : required("DB_HOST"),
    port: Number(process.env.DB_PORT || 5432),
    database: databaseUrl ? process.env.DB_NAME || "" : required("DB_NAME"),
    user: databaseUrl ? process.env.DB_USER || "" : required("DB_USER"),
    password: databaseUrl ? process.env.DB_PASSWORD || "" : required("DB_PASSWORD"),
    ssl: process.env.DB_SSL === "true",
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  corsOrigin,
  payloadLimit,
  rateLimit: {
    windowMs: numberFromEnv("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
    max: numberFromEnv("RATE_LIMIT_MAX", 300),
  },
};
