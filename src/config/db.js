import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

const dbConfig = env.db.connectionString
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
  dbConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(dbConfig);

export const query = async (text, params = []) => {
  return pool.query(text, params);
};

export const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
