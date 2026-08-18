const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { EventLogs } = require("../../../models/eventLogs");
const { SystemSettings } = require("../../../models/systemSettings");
const { DocumentSyncQueue } = require("../../../models/documentSyncQueue");
const { DocumentSyncRun } = require("../../../models/documentSyncRun");
const { purgeDocument } = require("../../../utils/files/purgeDocument");
const { getVectorDbClass } = require("../../../utils/helpers");
const { exportChatsAsType } = require("../../../utils/helpers/chat/convertTo");
const { dumpENV, updateENV } = require("../../../utils/helpers/updateENV");
const { reqBody, safeJsonParse } = require("../../../utils/http");
const { validApiKey } = require("../../../utils/middleware/validApiKey");
const prisma = require("../../../utils/prisma");

function apiSystemEndpoints(app) {
    if (!app) return;

    app.get("/v1/system/env-dump", async(_, response) => {
        /*
#swagger.tags = ['System Settings']
#swagger.description = 'Dump all settings to file storage'
#swagger.responses[403] = {
 schema: {
   "$ref": "#/definitions/InvalidAPIKey"
 }
}
*/
        try {
            if (process.env.NODE_ENV !== "production")
                return response.sendStatus(200).end();
            dumpENV();
            response.sendStatus(200).end();
        } catch (e) {
            console.error(e.message, e);
            response.sendStatus(500).end();
        }
    });

    app.get("/v1/system", [validApiKey], async(_, response) => {
        /*
        #swagger.tags = ['System Settings']
        #swagger.description = 'Get all current system settings that are defined.'
        #swagger.responses[200] = {
          content: {
            "application/json": {
              schema: {
                type: 'object',
                example: {
                 "settings": {
                    "VectorDB": "pinecone",
                    "PineConeKey": true,
                    "PineConeIndex": "my-pinecone-index",
                    "LLMProvider": "azure",
                    "[KEY_NAME]": "KEY_VALUE",
                  }
                }
              }
            }
          }
        }
        #swagger.responses[403] = {
          schema: {
            "$ref": "#/definitions/InvalidAPIKey"
          }
        }
        */
        try {
            const settings = await SystemSettings.currentSettings();
            response.status(200).json({ settings });
        } catch (e) {
            console.error(e.message, e);
            response.sendStatus(500).end();
        }
    });

    app.get("/v1/system/vector-count", [validApiKey], async(_, response) => {
        /*
        #swagger.tags = ['System Settings']
        #swagger.description = 'Number of all vectors in connected vector database'
        #swagger.responses[200] = {
          content: {
            "application/json": {
              schema: {
                type: 'object',
                example: {
                 "vectorCount": 5450
                }
              }
            }
          }
        }
        #swagger.responses[403] = {
          schema: {
            "$ref": "#/definitions/InvalidAPIKey"
          }
        }
        */
        try {
            const VectorDb = getVectorDbClass();
            const vectorCount = await VectorDb.totalVectors();
            response.status(200).json({ vectorCount });
        } catch (e) {
            console.error(e.message, e);
            response.sendStatus(500).end();
        }
    });

    app.post(
        "/v1/system/update-env", [validApiKey],
        async(request, response) => {
            /*
            #swagger.tags = ['System Settings']
            #swagger.description = 'Update a system setting or preference.'
            #swagger.requestBody = {
              description: 'Key pair object that matches a valid setting and value. Get keys from GET /v1/system or refer to codebase.',
              required: true,
              content: {
                "application/json": {
                  example: {
                    VectorDB: "lancedb",
                    AnotherKey: "updatedValue"
                  }
                }
              }
            }
            #swagger.responses[200] = {
              content: {
                "application/json": {
                  schema: {
                    type: 'object',
                    example: {
                      newValues: {"[ENV_KEY]": 'Value'},
                      error: 'error goes here, otherwise null'
                    }
                  }
                }
              }
            }
            #swagger.responses[403] = {
              schema: {
                "$ref": "#/definitions/InvalidAPIKey"
              }
            }
            */
            try {
                const body = reqBody(request);
                const { newValues, error } = await updateENV(body);
                response.status(200).json({ newValues, error });
            } catch (e) {
                console.error(e.message, e);
                response.sendStatus(500).end();
            }
        }
    );

    app.get(
        "/v1/system/export-chats", [validApiKey],
        async(request, response) => {
            /*
#swagger.tags = ['System Settings']
#swagger.description = 'Export all of the chats from the system in a known format. Output depends on the type sent. Will be send with the correct header for the output.'
#swagger.parameters['type'] = {
in: 'query',
description: "Export format jsonl, json, csv, jsonAlpaca",
required: false,
type: 'string'
}
#swagger.responses[200] = {
content: {
  "application/json": {
    schema: {
      type: 'object',
      example: [
        {
          "role": "user",
          "content": "What is AnythinglLM?"
        },
        {
          "role": "assistant",
          "content": "Akili is a knowledge graph and vector database management system built using NodeJS express server. It provides an interface for handling all interactions, including vectorDB management and LLM (Language Model) interactions."
        },
      ]
    }
  }
}
}
#swagger.responses[403] = {
schema: {
  "$ref": "#/definitions/InvalidAPIKey"
}
}
*/
            try {
                const { type = "jsonl" } = request.query;
                const { contentType, data } = await exportChatsAsType(
                    type,
                    "workspace"
                );
                await EventLogs.logEvent("exported_chats", {
                    type,
                });
                response.setHeader("Content-Type", contentType);
                response.status(200).send(data);
            } catch (e) {
                console.error(e.message, e);
                response.sendStatus(500).end();
            }
        }
    );
    /**
     * Trigger Pinecone/vector DB retrain by marking watched document queues as stale
     * and optionally running the sync job immediately. Call from cron or GitHub webhook.
     */
    app.post(
        "/v1/system/retrain-vector-db", [validApiKey],
        async(request, response) => {
            /*
            #swagger.tags = ['System Settings']
            #swagger.description = 'Mark watched document queues as stale and optionally run sync job to refresh Pinecone/vector DB. Use source=github when triggered by GitHub repo updates.'
            #swagger.requestBody = {
              required: false,
              content: {
                "application/json": {
                  schema: {
                    type: 'object',
                    properties: {
                      source: { type: 'string', enum: ['github', 'all'], description: 'Limit to GitHub queues only or all watched sources. Default: all' },
                      runSyncNow: { type: 'boolean', description: 'If true, spawn sync job process immediately. Default: true' }
                    }
                  }
                }
              }
            }
            #swagger.responses[202] = { description: 'Retrain triggered' }
            #swagger.responses[403] = { schema: { "$ref": "#/definitions/InvalidAPIKey" } }
            */
            try {
                const body = reqBody(request) || {};
                const source = body.source === "github" ? "github" : "all";
                const runSyncNow = body.runSyncNow !== false;

                const where =
                    source === "github" ?
                    {
                        workspaceDoc: {
                            metadata: { contains: "github://" },
                        },
                    } :
                    {};

                const updated = await prisma.document_sync_queues.updateMany({
                    where,
                    data: { nextSyncAt: new Date() },
                });

                let syncSpawned = false;
                if (runSyncNow && updated.count > 0) {
                    const jobsRoot = path.resolve(__dirname, "../../../jobs");
                    const scriptPath = path.join(jobsRoot, "sync-watched-documents.js");
                    const child = spawn(process.execPath, [scriptPath], {
                        stdio: "ignore",
                        env: process.env,
                        cwd: path.resolve(__dirname, "../../.."),
                        detached: true,
                    });
                    child.unref();
                    syncSpawned = true;
                }

                response.status(202).json({
                    triggered: true,
                    queuesMarkedStale: updated.count,
                    syncJobSpawned: syncSpawned,
                    message: updated.count > 0 ?
                        `Marked ${updated.count} queue(s) for sync.${syncSpawned ? " Sync job started." : " Next scheduled sync will process them."}` :
                        "No matching watched document queues found. Enable Live Sync and add GitHub (or other) watched sources first.",
                });
            } catch (e) {
                console.error(e.message, e);
                response.status(500).json({ triggered: false, error: e.message });
            }
        }
    );

    /**
     * GitHub webhook: call this URL from repo Settings > Webhooks (Content type: application/json).
     * Set GITHUB_WEBHOOK_SECRET in env to the webhook secret. On push, marks GitHub document queues stale and runs sync.
     */
    app.post("/v1/system/retrain-vector-db/webhook/github", async(request, response) => {
        try {
            const secret = process.env.GITHUB_WEBHOOK_SECRET;
            if (secret) {
                const sig = request.header("x-hub-signature-256");
                const rawBody = typeof request.body === "string" ? request.body : JSON.stringify(request.body || {});
                if (!sig || !sig.startsWith("sha256=")) {
                    response.status(401).json({ error: "Missing or invalid x-hub-signature-256" });
                    return;
                }
                const hmac = crypto.createHmac("sha256", secret);
                hmac.update(rawBody);
                const expected = "sha256=" + hmac.digest("hex");
                if (
                    sig.length !== expected.length ||
                    !crypto.timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))
                ) {
                    response.status(401).json({ error: "Invalid webhook signature" });
                    return;
                }
            }

            const event = request.header("x-github-event");
            if (event !== "push") {
                response.status(200).json({ accepted: true, message: "Ignored (not a push event)" });
                return;
            }

            const where = {
                workspaceDoc: {
                    metadata: { contains: "github://" },
                },
            };
            const updated = await prisma.document_sync_queues.updateMany({
                where,
                data: { nextSyncAt: new Date() },
            });

            const jobsRoot = path.resolve(__dirname, "../../../jobs");
            const scriptPath = path.join(jobsRoot, "sync-watched-documents.js");
            if (updated.count > 0) {
                const child = spawn(process.execPath, [scriptPath], {
                    stdio: "ignore",
                    env: process.env,
                    cwd: path.resolve(__dirname, "../../.."),
                    detached: true,
                });
                child.unref();
            }

            response.status(202).json({
                accepted: true,
                queuesMarkedStale: updated.count,
                syncJobSpawned: updated.count > 0,
            });
        } catch (e) {
            console.error(e.message, e);
            response.status(500).json({ error: e.message });
        }
    });

    app.get(
        "/v1/system/retrain-vector-db/status", [validApiKey],
        async(_, response) => {
            /*
            #swagger.tags = ['System Settings']
            #swagger.description = 'Get last sync runs and queue counts for vector DB retrain status (e.g. for admin UI).'
            #swagger.responses[200] = { description: 'Status object with lastRuns and queue counts' }
            #swagger.responses[403] = { schema: { "$ref": "#/definitions/InvalidAPIKey" } }
            */
            try {
                const liveSyncEnabled =
                    (await DocumentSyncQueue.enabled()) === true;
                const queueCount = await DocumentSyncQueue.count({});
                const staleCount = (await DocumentSyncQueue.staleDocumentQueues())
                    .length;

                const lastRuns = await DocumentSyncRun.where({},
                    10, { createdAt: "desc" }, { queue: true }
                );

                response.status(200).json({
                    liveSyncEnabled,
                    queueCount,
                    staleCount,
                    lastRuns: lastRuns.map((r) => ({
                        id: r.id,
                        queueId: r.queueId,
                        status: r.status,
                        result: r.result ? safeJsonParse(r.result, null) : null,
                        createdAt: r.createdAt,
                    })),
                });
            } catch (e) {
                console.error(e.message, e);
                response.status(500).json({ error: e.message });
            }
        }
    );

    app.delete(
        "/v1/system/remove-documents", [validApiKey],
        async(request, response) => {
            /*
            #swagger.tags = ['System Settings']
            #swagger.description = 'Permanently remove documents from the system.'
            #swagger.requestBody = {
              description: 'Array of document names to be removed permanently.',
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: 'object',
                    properties: {
                      names: {
                        type: 'array',
                        items: {
                          type: 'string'
                        },
                        example: [
                          "custom-documents/file.txt-fc4beeeb-e436-454d-8bb4-e5b8979cb48f.json"
                        ]
                      }
                    }
                  }
                }
              }
            }
            #swagger.responses[200] = {
              description: 'Documents removed successfully.',
              content: {
                "application/json": {
                  schema: {
                    type: 'object',
                    example: {
                      success: true,
                      message: 'Documents removed successfully'
                    }
                  }
                }
              }
            }
            #swagger.responses[403] = {
              description: 'Forbidden',
              schema: {
                "$ref": "#/definitions/InvalidAPIKey"
              }
            }
            #swagger.responses[500] = {
              description: 'Internal Server Error'
            }
            */
            try {
                const { names } = reqBody(request);
                for await (const name of names) await purgeDocument(name);
                response
                    .status(200)
                    .json({ success: true, message: "Documents removed successfully" })
                    .end();
            } catch (e) {
                console.error(e.message, e);
                response.sendStatus(500).end();
            }
        }
    );
}

module.exports = { apiSystemEndpoints };