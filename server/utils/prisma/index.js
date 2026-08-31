const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

// npx prisma introspect
// npx prisma generate
// npx prisma migrate dev --name init -> ensures that db is in sync with schema
// npx prisma migrate reset -> resets the db

const logLevels = ["error", "info", "warn"]; // add "query" to debug query logs

/**
 * Resolve a SQLite file URI for this app.
 * Prefer an explicit DATABASE_URL; otherwise pick an existing DB under STORAGE_DIR
 * (or the default server/storage path) so desktop renames don't break installs.
 */
function resolveSqliteDatabaseUrl() {
  if (process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim()) {
    return String(process.env.DATABASE_URL).trim();
  }

  const storageDir = process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.resolve(__dirname, "../../storage");

  const candidates = ["akili.db", "anythingllm.db", "accelanova.db"];
  let dbFile = path.join(storageDir, candidates[0]);
  for (const name of candidates) {
    const candidate = path.join(storageDir, name);
    if (fs.existsSync(candidate)) {
      dbFile = candidate;
      break;
    }
  }

  // Prisma file URLs need forward slashes on Windows.
  return `file:${dbFile.replace(/\\/g, "/")}`;
}

const databaseUrl = resolveSqliteDatabaseUrl();
// schema.prisma uses env("DATABASE_URL") — keep process.env in sync even when
// we also pass datasources.url, so Prisma never throws "Environment variable not found".
process.env.DATABASE_URL = databaseUrl;
console.log(`[Prisma] Using database at: ${databaseUrl}`);

const prisma = new PrismaClient({
  log: logLevels,
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

module.exports = prisma;
