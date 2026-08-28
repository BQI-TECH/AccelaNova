const express = require('express');

/**
 * Akili Proxy routes - These mirror the endpoints that Akili backend provides
 * These are used when the frontend calls the hub directly through the backend
 */
function anythingllmProxyRoutes(itemModel, userModel, auth, validation, storage, baseUrl) {
    const router = express.Router();
    /**
     * POST /community-hub/item
     * Get item by import ID
     */
    router.post('/item', validation.validateImportId, async (req, res) => {
        try {
            const { entityId } = req.parsedImportId;
            const item = itemModel.findById(entityId);

            if (!item) {
                return res.json({ success: false, item: null, error: 'Item not found' });
            }

            res.json({ success: true, item, error: null });
        } catch (error) {
            console.error('Error fetching item:', error);
            res.status(500).json({ success: false, item: null, error: error.message });
        }
    });

    /**
     * POST /community-hub/apply
     * Apply an item (for system prompts and slash commands)
     */
    router.post('/apply', validation.validateImportId, async (req, res) => {
        try {
            const { entityId } = req.parsedImportId;
            const item = itemModel.findById(entityId);

            if (!item) {
                return res.status(404).json({ success: false, error: 'Item not found' });
            }

            // Just return success - the actual application happens on Akili side
            res.json({ success: true, item, error: null });
        } catch (error) {
            console.error('Error applying item:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * POST /community-hub/import
     * Import a bundle item
     */
    router.post('/import', validation.validateImportId, async (req, res) => {
        try {
            const { entityId } = req.parsedImportId;
            const item = itemModel.findById(entityId);

            if (!item) {
                return res.status(404).json({ error: 'Item not found' });
            }

            if (!item.downloadUrl) {
                return res.status(400).json({ error: 'Item has no downloadable bundle' });
            }

            res.json({ success: true, item, url: item.downloadUrl, error: null });
        } catch (error) {
            console.error('Error importing item:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /community-hub/settings
     * Get hub settings
     */
    router.get('/settings', auth.optionalAuth(userModel), async (req, res) => {
        if (!req.user) {
            return res.json({ success: true, connectionKey: null });
        }

        const user = await userModel.findById(req.user.id);
        res.json({
            success: true,
            connectionKey: user ? user.connection_key : null
        });
    });

    /**
     * POST /community-hub/settings
     * Update hub settings
     */
    router.post('/settings', async (req, res) => {
        try {
            const { connectionKey } = req.body;

            if (!connectionKey) {
                return res.status(400).json({ success: false, error: 'Connection key required' });
            }

            // Verify the connection key exists
            const user = await userModel.findByConnectionKey(connectionKey);

            if (!user) {
                return res.status(401).json({ success: false, error: 'Invalid connection key' });
            }

            res.json({ success: true, error: null });
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * GET /community-hub/explore
     * Browse public items
     */
    router.get('/explore', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const exploreItems = itemModel.findAllPublic(limit);

            res.json({ success: true, result: exploreItems });
        } catch (error) {
            console.error('Error fetching explore items:', error);
            res.status(500).json({
                success: false,
                result: null,
                error: error.message
            });
        }
    });

    /**
     * GET /community-hub/items
     * Get user's items
     */
    router.get('/items', auth.authenticateConnectionKey(userModel), async (req, res) => {
        try {
            const items = itemModel.findByUser(req.user.id);

            res.json({
                success: true,
                createdByMe: items,
                teamItems: []
            });
        } catch (error) {
            console.error('Error fetching user items:', error);
            res.json({
                success: false,
                createdByMe: {},
                teamItems: [],
                error: error.message
            });
        }
    });

    /**
     * POST /community-hub/:itemType/create
     * Create new items
     */
    router.post(
        '/:itemType/create',
        auth.authenticateConnectionKey(userModel),
        validation.validateItemCreation,
        async (req, res) => {
            try {
                const { itemType } = req.params;
                const data = req.body;

                const item = itemModel.create(req.user.id, {
                    itemType,
                    name: data.name,
                    description: data.description,
                    prompt: data.prompt,
                    command: data.command,
                    tags: data.tags || [],
                    visibility: data.visibility || 'private',
                    metadata: data.metadata || {}
                });

                res.json({
                    success: true,
                    item: { id: item.id },
                    error: null
                });
            } catch (error) {
                console.error('Error creating item:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }
    );

    return router;
}

module.exports = anythingllmProxyRoutes;