// Preload shim to alias certain modules that may be missing or problematic in the packaged desktop app.
// This file is loaded via NODE_OPTIONS=--require <bootstrap.js>
// It intercepts require() and maps known modules to lightweight fallbacks.
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const shimsDir = path.join(__dirname);

Module._load = function(request, parent, isMain) {
    try {
        // Bcrypt is a native module and often fails in Electron unless rebuilt.
        // We shim it to provide basic functionality (or no-op) if the real one fails.
        // Note: We only shim if loading the real one fails, but checking that here is hard.
        // So we force shim it for desktop environment safety.
        if (request === 'bcrypt') {
            return require(path.join(shimsDir, 'bcrypt-shim.js'));
        }

        // We previously shimmed many other modules (cors, body-parser, etc.)
        // but since we now bundle server/node_modules correctly, we should rely on the real packages.
        // Shimming body-parser specifically caused a circular dependency with express.

    } catch (_) {
        // If shim fails, fall through to original loader
    }
    return originalLoad.apply(this, arguments);
};