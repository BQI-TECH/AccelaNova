#!/usr/bin/env node

/**
 * Call Akili retrain-vector-db API. Use from cron, GitHub Actions, or manually.
 *
 * Env:
 *   ACCELANOVA_URL - e.g. https://your-app.onrender.com (no trailing slash)
 *   API_KEY       - Akili API key (Bearer)
 *
 * Optional body (default: github + runSyncNow):
 *   source: 'github' | 'all'
 *   runSyncNow: boolean
 *
 * Usage:
 *   node scripts/trigger-retrain.js
 *   source=all node scripts/trigger-retrain.js
 */

const baseUrl = process.env.ACCELANOVA_URL || "http://localhost:3001";
const apiKey = process.env.API_KEY || process.env.ACCELANOVA_API_KEY;
const source = process.env.source || "github";
const runSyncNow = process.env.runSyncNow !== "false";

if (!apiKey) {
    console.error("Set API_KEY or ACCELANOVA_API_KEY");
    process.exit(1);
}

const url = `${baseUrl.replace(/\/$/, "")}/api/v1/system/retrain-vector-db`;

fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ source, runSyncNow }),
    })
    .then((res) => {
        if (!res.ok) {
            return res.text().then((t) => {
                throw new Error(`HTTP ${res.status}: ${t}`);
            });
        }
        return res.json();
    })
    .then((data) => {
        console.log(JSON.stringify(data, null, 2));
    })
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });