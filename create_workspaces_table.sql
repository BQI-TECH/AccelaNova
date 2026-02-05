-- Create workspaces table for Postgres
-- Run this SQL in your Postgres database
-- This matches the Prisma schema definition

CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vectorTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openAiTemp" DOUBLE PRECISION,
    "openAiHistory" INTEGER NOT NULL DEFAULT 20,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openAiPrompt" TEXT,
    "similarityThreshold" DOUBLE PRECISION DEFAULT 0.25,
    "chatProvider" TEXT,
    "chatModel" TEXT,
    "topN" INTEGER DEFAULT 4,
    "chatMode" TEXT DEFAULT 'chat',
    "pfpFilename" TEXT,
    "agentProvider" TEXT,
    "agentModel" TEXT,
    "queryRefusalResponse" TEXT,
    "vectorSearchMode" TEXT DEFAULT 'default',
    CONSTRAINT "workspaces_slug_key" UNIQUE ("slug")
);

-- Note: The slug column has a UNIQUE constraint which creates an index automatically

