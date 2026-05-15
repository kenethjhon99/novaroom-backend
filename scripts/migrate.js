import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { env } from "../src/config/env.js";

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "../db/migrations");
const args = new Set(process.argv.slice(2));

const checksum = (content) => crypto.createHash("sha256").update(content).digest("hex");

const getMigrationFiles = async () => {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();
};

const createClient = () => {
  const config = env.db.connectionString
    ? {
        connectionString: env.db.connectionString,
      }
    : {
        host: env.db.host,
        port: env.db.port,
        database: env.db.database,
        user: env.db.user,
        password: env.db.password,
      };

  if (env.db.ssl) {
    config.ssl = { rejectUnauthorized: false };
  }

  return new Client(config);
};

const ensureSchemaMigrations = async (client) => {
  await client.query("CREATE SCHEMA IF NOT EXISTS public;");
  await client.query("SET search_path TO public;");

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
};

const getAppliedMigrations = async (client) => {
  const result = await client.query(
    "SELECT filename, checksum, applied_at FROM schema_migrations ORDER BY filename"
  );

  return new Map(result.rows.map((row) => [row.filename, row]));
};

const printDryRun = async () => {
  const files = await getMigrationFiles();

  console.log("Migraciones encontradas:");
  for (const file of files) {
    console.log(`- ${file}`);
  }
};

const printStatus = async () => {
  const files = await getMigrationFiles();
  const client = createClient();

  await client.connect();

  try {
    await ensureSchemaMigrations(client);
    const applied = await getAppliedMigrations(client);

    console.log("Estado de migraciones:");
    for (const file of files) {
      const row = applied.get(file);
      console.log(`${row ? "APPLIED" : "PENDING"} ${file}${row ? ` (${row.applied_at.toISOString()})` : ""}`);
    }
  } finally {
    await client.end();
  }
};

const runMigrations = async () => {
  const files = await getMigrationFiles();
  const client = createClient();

  await client.connect();

  try {
    await ensureSchemaMigrations(client);
    const applied = await getAppliedMigrations(client);

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(fullPath, "utf8");
      const fileChecksum = checksum(sql);
      const existing = applied.get(file);

      if (existing) {
        if (existing.checksum !== fileChecksum) {
          throw new Error(`La migracion aplicada cambio de checksum: ${file}`);
        }

        console.log(`SKIP ${file}`);
        continue;
      }

      console.log(`APPLY ${file}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)",
          [file, fileChecksum]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Migraciones completadas.");
  } finally {
    await client.end();
  }
};

if (args.has("--dry-run")) {
  await printDryRun();
} else if (args.has("--status")) {
  await printStatus();
} else {
  await runMigrations();
}
