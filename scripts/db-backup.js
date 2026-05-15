import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run a backup.");
  process.exit(1);
}

const backupDir = process.env.BACKUP_DIR || path.resolve(process.cwd(), "../backups");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputFile =
  process.env.BACKUP_FILE || path.join(backupDir, `novaroom-${timestamp}.dump`);

fs.mkdirSync(path.dirname(outputFile), { recursive: true });

const args = [
  "--format=custom",
  "--no-owner",
  "--no-privileges",
  "--file",
  outputFile,
  databaseUrl,
];

const child = spawn("pg_dump", args, { stdio: "inherit" });

child.on("exit", (code) => {
  if (code === 0) {
    console.log(`Backup created: ${outputFile}`);
  }

  process.exit(code || 0);
});
