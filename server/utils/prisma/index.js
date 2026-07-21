const { PrismaClient } = require("@prisma/client");

// npx prisma introspect
// npx prisma generate
// npx prisma migrate dev --name init -> ensures that db is in sync with schema
// npx prisma migrate reset -> resets the db

const logLevels = ["error", "info", "warn"]; // add "query" to debug query logs

let prisma;

// Desktop / local check and database path override to ensure writable location.
// We standardize on SQLite for this build, so DATABASE_URL is treated as a `file:` URI.
if (process.env.DESKTOP_APP === 'true' && process.env.STORAGE_DIR) {
  const path = require('path');
  // Ensure forward slashes for file URL even on Windows
  const storageDir = process.env.STORAGE_DIR.replace(/\\/g, '/');
  const dbUrl = `file:${storageDir}/anythingllm.db`;
  
  console.log(`[Prisma] Running in Desktop mode. Using database at: ${dbUrl}`);
  
  prisma = new PrismaClient({
    log: logLevels,
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });
} else {
  // Fallback for non-desktop/server environments: still allow DATABASE_URL to
  // control the datasource, but this project expects SQLite by default.
  prisma = new PrismaClient({
    log: logLevels,
  });
}

module.exports = prisma;
