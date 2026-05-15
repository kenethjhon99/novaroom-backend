import { spawn } from "node:child_process";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;
const backupFile = process.env.BACKUP_FILE || process.argv[2];

if (!databaseUrl) {
  console.error("DATABASE_URL is required to restore a backup.");
  process.exit(1);
}

if (!backupFile) {
  console.error("BACKUP_FILE or first argument is required.");
  process.exit(1);
}

const resolvedBackup = path.resolve(backupFile);
const args = [
  "--clean",
  "--if-exists",
  "--no-owner",
  "--no-privileges",
  "--dbname",
  databaseUrl,
  resolvedBackup,
];

const child = spawn("pg_restore", args, { stdio: "inherit" });

child.on("exit", (code) => {
  process.exit(code || 0);
});
