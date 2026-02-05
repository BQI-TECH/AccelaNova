const express = require('express');

/**
 * GET /v1/explore
 * Fetch public items from the community hub
 */
function exploreRoutes(itemModel) {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const exploreItems = await itemModel.findAllPublic(limit);

            res.json(exploreItems);
        } catch (error) {
            console.error('Error fetching explore items:', error);
            res.status(500).json({
                agentSkills: { items: [], hasMore: false, totalCount: 0 },
                systemPrompts: { items: [], hasMore: false, totalCount: 0 },
                slashCommands: { items: [], hasMore: false, totalCount: 0 },
                agentFlows: { items: [], hasMore: false, totalCount: 0 },
                error: error.message
            });
        }
    });

    return router;
}

module.exports = exploreRoutes;