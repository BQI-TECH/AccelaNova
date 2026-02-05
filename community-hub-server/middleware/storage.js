const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Configure file storage for bundle uploads
 */
function configureStorage(storagePath) {
    // Ensure storage directory exists
    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, storagePath);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
            cb(null, uniqueName);
        }
    });

    const fileFilter = (req, file, cb) => {
        // Only accept zip files for bundles
        const allowedTypes = ['.zip', '.tar.gz', '.tar'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .zip, .tar.gz, and .tar files are allowed'), false);
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: (process.env.MAX_BUNDLE_SIZE_MB || 50) * 1024 * 1024 // Default 50MB
        }
    });
}

/**
 * Delete file from storage
 */
function deleteFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Generate download URL for bundle
 */
function generateDownloadUrl(filename, baseUrl) {
    return `${baseUrl}/downloads/${filename}`;
}

module.exports = {
    configureStorage,
    deleteFile,
    generateDownloadUrl
};