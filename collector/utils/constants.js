const path = require("path");
const fs = require("fs");

// In desktop builds, the collector must use a writable hotdir under STORAGE_DIR.
// In non-desktop/dev, keep using the repo's ./collector/hotdir.
const WATCH_DIRECTORY = process.env.STORAGE_DIR ?
    path.resolve(process.env.STORAGE_DIR, "hotdir") :
    path.resolve(__dirname, "../hotdir");

try {
    fs.mkdirSync(WATCH_DIRECTORY, { recursive: true });
} catch (_) {
    // ignore - will error later if truly unwritable
}

const ACCEPTED_MIMES = {
    "text/plain": [".txt", ".md", ".org", ".adoc", ".rst"],
    "text/html": [".html"],

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
    ],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
        ".pptx",
    ],

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
    ],

    "application/vnd.oasis.opendocument.text": [".odt"],
    "application/vnd.oasis.opendocument.presentation": [".odp"],

    "application/pdf": [".pdf"],
    "application/mbox": [".mbox"],

    "audio/wav": [".wav"],
    "audio/mpeg": [".mp3"],

    "video/mp4": [".mp4"],
    "video/mpeg": [".mpeg"],
    "application/epub+zip": [".epub"],
    "image/png": [".png"],
    "image/jpeg": [".jpg"],
    "image/jpg": [".jpg"],
};

const SUPPORTED_FILETYPE_CONVERTERS = {
    ".txt": "./convert/asTxt.js",
    ".md": "./convert/asTxt.js",
    ".org": "./convert/asTxt.js",
    ".adoc": "./convert/asTxt.js",
    ".rst": "./convert/asTxt.js",

    ".html": "./convert/asTxt.js",
    ".pdf": "./convert/asPDF/index.js",

    ".docx": "./convert/asDocx.js",
    ".pptx": "./convert/asOfficeMime.js",

    ".odt": "./convert/asOfficeMime.js",
    ".odp": "./convert/asOfficeMime.js",

    ".xlsx": "./convert/asXlsx.js",

    ".mbox": "./convert/asMbox.js",

    ".epub": "./convert/asEPub.js",

    ".mp3": "./convert/asAudio.js",
    ".wav": "./convert/asAudio.js",
    ".mp4": "./convert/asAudio.js",
    ".mpeg": "./convert/asAudio.js",

    ".png": "./convert/asImage.js",
    ".jpg": "./convert/asImage.js",
    ".jpeg": "./convert/asImage.js",
};

module.exports = {
    SUPPORTED_FILETYPE_CONVERTERS,
    WATCH_DIRECTORY,
    ACCEPTED_MIMES,
};