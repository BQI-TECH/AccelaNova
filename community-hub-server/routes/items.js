const express = require('express');
const path = require('path');

/**
 * Item routes for the community hub
 */
function itemRoutes(itemModel, userModel, auth, validation, storage, baseUrl) {
    const router = express.Router();
    const upload = storage.upload;

    /**
     * GET /v1/:entityType/:entityId/pull
     * Fetch a specific item by type and ID
     */
    router.get('/:entityType/:entityId/pull', auth.optionalAuth(userModel), async (req, res) => {
        try {
            const { entityType, entityId } = req.params;

            // Find the item
            const item = itemModel.findById(entityId);

            if (!item) {
                return res.json({ url: null, item: null, error: 'Item not found' });
            }

            // Check if user has access
            if (item.visibility === 'private') {
                if (!req.user || req.user.id !== item.userId) {
                    return res.json({ url: null, item: null, error: 'Access denied' });
                }
            }

            // Record download if authenticated
            if (req.user) {
                itemModel.recordDownload(entityId, req.user.id);
            }

            // Generate download URL for bundle items
            let url = null;
            if (item.downloadUrl) {
                url = item.downloadUrl;
            } else if (item.bundlePath) {
                const filename = path.basename(item.bundlePath);
                url = `${baseUrl}/downloads/${filename}`;
            }

            res.json({ url, item, error: null });
        } catch (error) {
            console.error('Error fetching item:', error);
            res.json({ url: null, item: null, error: error.message });
        }
    });

    /**
     * GET /v1/items
     * Get user's items (requires authentication)
     */
    router.get('/items', auth.authenticateConnectionKey(userModel), async (req, res) => {
        try {
            const items = await itemModel.findByUser(req.user.id);

            res.json(items);
        } catch (error) {
            console.error('Error fetching user items:', error);
            res.status(500).json({
                error: error.message
            });
        }
    });

    /**
     * POST /v1/:itemType/create
     * Create a new item
     */
    router.post(
        '/:itemType/create',
        auth.authenticateConnectionKey(userModel),
        validation.validateItemCreation,
        async (req, res) => {
            try {
                const { itemType } = req.params;
                const data = req.body;

                // Create the item
                const item = await itemModel.create(req.user.id, {
                    itemType,
                    name: data.name,
                    description: data.description,
                    prompt: data.prompt,
                    command: data.command,
                    flow: data.flow, // Add support for agent-flow
                    tags: data.tags || [],
                    visibility: data.visibility || 'private',
                    metadata: data.metadata || {}
                });

                res.json({
                    success: true,
                    item: { id: item.id || item._id.toString() },
                    error: null
                });
            } catch (error) {
                console.error('Error creating item:', error);
                res.status(500).json({
                    success: false,
                    item: null,
                    error: error.message
                });
            }
        }
    );

    /**
     * POST /v1/agent-skill/upload
     * Upload a bundle for an agent skill
     */
    router.post(
        '/agent-skill/upload',
        auth.authenticateConnectionKey(userModel),
        upload.single('bundle'),
        async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                const { name, description, tags, visibility } = req.body;

                if (!name) {
                    return res.status(400).json({ error: 'Name is required' });
                }

                // Create the item with bundle
                const bundlePath = req.file.path;
                const downloadUrl = storage.generateDownloadUrl(req.file.filename, baseUrl);

                const item = itemModel.create(req.user.id, {
                    itemType: 'agent-skill',
                    name,
                    description,
                    tags: tags ? JSON.parse(tags) : [],
                    visibility: visibility || 'private',
                    bundlePath,
                    downloadUrl
                });

                res.json({
                    success: true,
                    item: { id: item.id },
                    error: null
                });
            } catch (error) {
                console.error('Error uploading bundle:', error);
                // Clean up uploaded file if there was an error
                if (req.file) {
                    storage.deleteFile(req.file.path);
                }
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }
    );

    /**
     * PUT /v1/items/:itemId
     * Update an item
     */
    router.put('/:itemId', auth.authenticateConnectionKey(userModel), async (req, res) => {
        try {
            const { itemId } = req.params;
            const updates = req.body;

            const success = itemModel.update(itemId, req.user.id, updates);

            if (!success) {
                return res.status(404).json({ error: 'Item not found or access denied' });
            }

            res.json({ success: true, error: null });
        } catch (error) {
            console.error('Error updating item:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * DELETE /v1/items/:itemId
     * Delete an item
     */
    router.delete('/:itemId', auth.authenticateConnectionKey(userModel), async (req, res) => {
        try {
            const { itemId } = req.params;

            // Get item to delete bundle file if exists
            const item = itemModel.findById(itemId);

            const success = itemModel.delete(itemId, req.user.id);

            if (!success) {
                return res.status(404).json({ error: 'Item not found or access denied' });
            }

            // Clean up bundle file
            if (item && item.bundlePath) {
                storage.deleteFile(item.bundlePath);
            }

            res.json({ success: true, error: null });
        } catch (error) {
            console.error('Error deleting item:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * POST /v1/admin/items/:itemId/verify
     * Mark item as verified (admin only)
     */
    router.post(
        '/admin/items/:itemId/verify',
        auth.authenticateConnectionKey(userModel),
        auth.requireAdmin,
        async (req, res) => {
            try {
                const { itemId } = req.params;
                const { verified } = req.body;

                itemModel.setVerified(itemId, verified !== false);

                res.json({ success: true, error: null });
            } catch (error) {
                console.error('Error verifying item:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    return router;
}

module.exports = itemRoutes;