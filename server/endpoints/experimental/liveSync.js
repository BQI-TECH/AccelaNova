const path = require("path");
const { spawn } = require("child_process");
const { DocumentSyncQueue } = require("../../models/documentSyncQueue");
const { Document } = require("../../models/documents");
const { EventLogs } = require("../../models/eventLogs");
const { SystemSettings } = require("../../models/systemSettings");
const { Telemetry } = require("../../models/telemetry");
const { reqBody } = require("../../utils/http");
const {
    featureFlagEnabled,
} = require("../../utils/middleware/featureFlagEnabled");
const {
    flexUserRoleValid,
    ROLES,
} = require("../../utils/middleware/multiUserProtected");
const { validWorkspaceSlug } = require("../../utils/middleware/validWorkspace");
const { validatedRequest } = require("../../utils/middleware/validatedRequest");
const prisma = require("../../utils/prisma");

function liveSyncEndpoints(app) {
    if (!app) return;

    /** Any authenticated user can read Live Sync status (e.g. for Vector DB settings UI). */
    app.get(
        "/experimental/live-sync/status", [validatedRequest],
        async(_, response) => {
            try {
                const setting = await SystemSettings.get({ label: DocumentSyncQueue.featureKey });
                const enabled = (setting && setting.value === "enabled") || false;
                response.status(200).json({ enabled });
            } catch (e) {
                console.error(e);
                response.status(500).json({ enabled: false });
            }
        }
    );

    app.post(
        "/experimental/toggle-live-sync", [validatedRequest, flexUserRoleValid([ROLES.admin])],
        async(request, response) => {
            try {
                const { updatedStatus = false } = reqBody(request);
                const newStatus =
                    SystemSettings.validations.experimental_live_file_sync(updatedStatus);
                const setting = await SystemSettings.get({ label: "experimental_live_file_sync" });
                const currentStatus = (setting && setting.value) ? setting.value : "disabled";
                if (currentStatus === newStatus)
                    return response
                        .status(200)
                        .json({ liveSyncEnabled: newStatus === "enabled" });

                // Already validated earlier - so can hot update.
                await SystemSettings._updateSettings({
                    experimental_live_file_sync: newStatus,
                });
                if (newStatus === "enabled") {
                    await Telemetry.sendTelemetry("experimental_feature_enabled", {
                        feature: "live_file_sync",
                    });
                    await EventLogs.logEvent("experimental_feature_enabled", {
                        feature: "live_file_sync",
                    });
                    DocumentSyncQueue.bootWorkers();
                } else {
                    DocumentSyncQueue.killWorkers();
                }

                response.status(200).json({ liveSyncEnabled: newStatus === "enabled" });
            } catch (e) {
                console.error(e);
                response.status(500).end();
            }
        }
    );

    app.get(
        "/experimental/live-sync/queues", [
            validatedRequest,
            flexUserRoleValid([ROLES.admin]),
            featureFlagEnabled(DocumentSyncQueue.featureKey),
        ],
        async(_, response) => {
            const queues = await DocumentSyncQueue.where({},
                null, { createdAt: "asc" }, {
                    workspaceDoc: {
                        include: {
                            workspace: true,
                        },
                    },
                }
            );
            response.status(200).json({ queues });
        }
    );

    /** Trigger retrain now (mark queues stale + run sync job). Session auth for UI. */
    app.post(
        "/experimental/trigger-retrain", [
            validatedRequest,
            flexUserRoleValid([ROLES.admin]),
            featureFlagEnabled(DocumentSyncQueue.featureKey),
        ],
        async(request, response) => {
            try {
                const body = reqBody(request) || {};
                const source = body.source === "github" ? "github" : "all";
                const where =
                    source === "github" ? {
                        workspaceDoc: {
                            metadata: { contains: "github://" },
                        },
                    } : {};
                const updated = await prisma.document_sync_queues.updateMany({
                    where,
                    data: { nextSyncAt: new Date() },
                });
                let syncSpawned = false;
                if (updated.count > 0) {
                    const jobsRoot = path.resolve(__dirname, "../../jobs");
                    const scriptPath = path.join(jobsRoot, "sync-watched-documents.js");
                    const child = spawn(process.execPath, [scriptPath], {
                        stdio: "ignore",
                        env: process.env,
                        cwd: path.resolve(__dirname, "../.."),
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
                        `Marked ${updated.count} queue(s) for sync.${syncSpawned ? " Sync job started." : ""}` : "No watched document queues found. Add and watch GitHub or other sources first.",
                });
            } catch (e) {
                console.error(e);
                response.status(500).json({ triggered: false, error: e.message });
            }
        }
    );

    // Should be in workspace routes, but is here for now.
    app.post(
        "/workspace/:slug/update-watch-status", [
            validatedRequest,
            flexUserRoleValid([ROLES.admin, ROLES.manager]),
            validWorkspaceSlug,
            featureFlagEnabled(DocumentSyncQueue.featureKey),
        ],
        async(request, response) => {
            try {
                const { docPath, watchStatus = false } = reqBody(request);
                const workspace = response.locals.workspace;

                const document = await Document.get({
                    workspaceId: workspace.id,
                    docpath: docPath,
                });
                if (!document) return response.sendStatus(404).end();

                await DocumentSyncQueue.toggleWatchStatus(document, watchStatus);
                return response.status(200).end();
            } catch (error) {
                console.error("Error processing the watch status update:", error);
                return response.status(500).end();
            }
        }
    );
}

module.exports = { liveSyncEndpoints };