const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Download routes for bundle files
 */
function downloadRoutes(storagePath) {
    const router = express.Router();
    /**
     * GET /downloads/:filename
     * Download a bundle file
     */
    router.get('/:filename', (req, res) => {
        try {
            const { filename } = req.params;

            // Prevent directory traversal
            const safeName = path.basename(filename);
            const filePath = path.join(storagePath, safeName);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }

            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
            res.setHeader('Content-Type', 'application/zip');

            // Stream the file
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);

            fileStream.on('error', (error) => {
                console.error('File streaming error:', error);
                res.status(500).json({ error: 'Failed to download file' });
            });
        } catch (error) {
            console.error('Download error:', error);
            res.status(500).json({ error: 'Download failed' });
        }
    });

    return router;
}

module.exports = downloadRoutes;