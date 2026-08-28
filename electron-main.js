const { app, BrowserWindow, Menu, shell, session, ipcMain, dialog } = require('electron');
const net = require('net');
const path = require('path');
const { existsSync, readFileSync, mkdirSync, copyFileSync, writeFileSync, cpSync } = require('fs');
const { createServer } = require('http');
const { spawn, exec, fork } = require('child_process');
const http = require('http');

// Helper function to parse .env file and extract DATABASE_URL
function parseEnvFile(envPath) {
    if (!existsSync(envPath)) return null;

    try {
        const content = readFileSync(envPath, 'utf8');
        const lines = content.split('\n');

        for (const line of lines) {
            // Skip comments and empty lines
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // Match DATABASE_URL=value or DATABASE_URL="value" or DATABASE_URL='value'
            const match = trimmed.match(/^DATABASE_URL\s*=\s*(?:["']?)([^"'\n]+)(?:["']?)$/);
            if (match) {
                return match[1].trim();
            }
        }
    } catch (err) {
        console.error('Error parsing .env file:', err);
    }

    return null;
}

// Keep a global reference of the window object
let mainWindow;
let staticServer;
let backendProcess;
let collectorProcess;
let backendPort = 3101; // Preferred desktop backend port
let collectorPort = 8891; // Preferred desktop collector port
let serverStartedInline = false; // Fallback flag when spawning node fails

function findFreePort(preferred) {
    return new Promise((resolve) => {
        const tester = net.createServer();
        tester.once('error', (err) => {
            if (err && err.code === 'EADDRINUSE') {
                console.log(`Port ${preferred} is in use, finding alternative...`);
                const tmp = net.createServer();
                tmp.listen(0, '127.0.0.1', () => {
                    const port = tmp.address().port;
                    tmp.close(() => {
                        console.log(`Using alternative port ${port} instead of ${preferred}`);
                        resolve(port);
                    });
                });
            } else {
                resolve(preferred);
            }
        });
        tester.listen(preferred, '127.0.0.1', () => {
            const port = tester.address().port;
            tester.close(() => {
                console.log(`Port ${port} is available`);
                resolve(port);
            });
        });
    });
}

// Kill any process using a specific port (Windows)
function killProcessOnPort(port) {
    return new Promise((resolve) => {
        if (process.platform !== 'win32') {
            // On non-Windows, we'd use lsof or similar
            resolve();
            return;
        }

        // Use netstat to find the process using the port
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
            if (error || !stdout) {
                // No process found or error - port is free
                resolve();
                return;
            }

            // Parse the output to find PID
            const lines = stdout.trim().split('\n');
            const pids = new Set();
            lines.forEach(line => {
                const match = line.match(/\s+(\d+)\s*$/);
                if (match) {
                    pids.add(match[1]);
                }
            });

            if (pids.size === 0) {
                resolve();
                return;
            }

            console.log(`Found ${pids.size} process(es) using port ${port}, attempting to kill...`);
            let killed = 0;
            pids.forEach(pid => {
                exec(`taskkill /PID ${pid} /F`, (killError) => {
                    if (!killError) {
                        killed++;
                        console.log(`Killed process ${pid} on port ${port}`);
                    }
                    if (killed === pids.size) {
                        // Wait a bit for the port to be released
                        setTimeout(resolve, 1000);
                    }
                });
            });

            // Timeout after 3 seconds
            setTimeout(() => {
                if (killed < pids.size) {
                    console.warn(`Only killed ${killed} of ${pids.size} processes on port ${port}`);
                }
                resolve();
            }, 3000);
        });
    });
}

// Copy empty storage scaffolding and default assets from the packaged template.
function seedDesktopStorageFromTemplate(storageDir, templateDbPath) {
    const templateRoot = path.dirname(templateDbPath);
    const templateDirs = [
        'documents',
        'vector-cache',
        'lancedb',
        'tmp',
        'direct-uploads',
        'comkey',
        'plugins',
        'assets',
        'hotdir',
    ];

    for (const dirName of templateDirs) {
        const src = path.join(templateRoot, dirName);
        const dest = path.join(storageDir, dirName);
        if (!existsSync(src)) continue;

        try {
            if (!existsSync(dest)) {
                cpSync(src, dest, { recursive: true });
            }
        } catch (err) {
            console.warn(`⚠️  Could not seed ${dirName} from desktop template:`, err.message);
        }
    }
}

// Development mode check
const isDev = process.env.NODE_ENV === 'development';

// Helper function to get content type based on file extension
function getContentType(ext) {
    const types = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject'
    };
    return types[ext] || 'application/octet-stream';
}

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        title: 'Akili',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true, // Enable web security for production
            allowRunningInsecureContent: false,
            preload: path.join(__dirname, 'electron-preload.js'),
        },
        icon: path.join(__dirname, 'frontend/public/app-icon.png'),
        titleBarStyle: 'default',
        show: false // Don't show until ready
    });

    mainWindow.webContents.session.on('will-download', (_event, item) => {
        if (!item.getSavePath()) {
            item.setSavePath(path.join(app.getPath('downloads'), item.getFilename()));
        }
    });

    // Load the app - use HTTP server for proper asset loading
    console.log('Starting static server and loading app...');
    const distPath = path.join(__dirname, 'frontend/dist');

    if (existsSync(distPath)) {
        // Start a simple HTTP server to serve static files
        staticServer = createServer((req, res) => {
            const urlPath = req.url.split('?')[0] || '/';
            console.log('Request:', urlPath);

            // Handle root path
            if (urlPath === '/') {
                const indexPath = path.join(distPath, '_index.html');
                if (existsSync(indexPath)) {
                    let htmlContent = readFileSync(indexPath, 'utf8');
                    // Inject API base URL script and disable service worker before the app loads
                    const apiBaseScript = `<script>
                        window.__ELECTRON_API_BASE__ = 'http://localhost:${backendPort}/api';
                        // Disable service worker registration in Electron
                        if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                                for(let registration of registrations) {
                                    registration.unregister().catch(function() {});
                                }
                            }).catch(function() {});
                            // Override register to prevent new registrations (silently)
                            navigator.serviceWorker.register = function() {
                                return Promise.reject(new Error('Service workers disabled in Electron'));
                            };
                            // Also catch any existing registration attempts
                            window.addEventListener('error', function(e) {
                                if (e.message && e.message.includes('Service workers disabled')) {
                                    e.preventDefault();
                                    return false;
                                }
                            }, true);
                        }
                    </script>`;
                    // Insert before the closing </head> tag, or at the beginning of <head> if no closing tag
                    if (htmlContent.includes('</head>')) {
                        htmlContent = htmlContent.replace('</head>', `${apiBaseScript}\n</head>`);
                    } else if (htmlContent.includes('<head>')) {
                        htmlContent = htmlContent.replace('<head>', `<head>\n${apiBaseScript}`);
                    } else {
                        // If no head tag, prepend to body or beginning of file
                        htmlContent = apiBaseScript + '\n' + htmlContent;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(htmlContent);
                } else {
                    res.writeHead(404);
                    res.end('Not Found');
                }
                return;
            }

            // Try to serve the requested file directly
            let filePath = path.join(distPath, urlPath);

            // In desktop app, neutralize PWA service worker to avoid caching/routing issues
            if (urlPath === '/sw.js' || urlPath === '/service-worker.js') {
                res.writeHead(200, {
                    'Content-Type': 'application/javascript',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
                res.end(
                    '// Service worker disabled in Electron desktop app\n' +
                    'self.addEventListener("install", (e) => {\n' +
                    '  e.waitUntil(self.skipWaiting());\n' +
                    '});\n' +
                    'self.addEventListener("activate", (e) => {\n' +
                    '  e.waitUntil(\n' +
                    '    Promise.all([\n' +
                    '      self.registration.unregister(),\n' +
                    '      self.clients.claim()\n' +
                    '    ])\n' +
                    '  );\n' +
                    '});\n'
                );
                return;
            }

            // Rewrite deep-linked workspace requests first
            const workspacePrefix = '/workspace/';
            if (urlPath.startsWith(workspacePrefix)) {
                const rest = urlPath.slice(workspacePrefix.length); // e.g., 'assets/foo.js' or 'bqitech/t/index.js'
                // Nested assets: /workspace/**/assets/* => /assets/*
                const assetsSlashIndex = rest.indexOf('/assets/');
                if (assetsSlashIndex !== -1) {
                    const assetRel = rest.substring(assetsSlashIndex + 1); // drop leading '/'
                    filePath = path.join(distPath, assetRel);
                } else if (rest.includes('/static/js/bundle.js')) {
                    filePath = path.join(distPath, 'index.js');
                } else if (rest.includes('/static/css/main.css')) {
                    filePath = path.join(distPath, 'index.css');
                } else if (rest.endsWith('/index.js') || rest === 'index.js') {
                    filePath = path.join(distPath, 'index.js');
                } else if (rest.endsWith('/index.css') || rest === 'index.css') {
                    filePath = path.join(distPath, 'index.css');
                } else if (rest.startsWith('assets/')) {
                    filePath = path.join(distPath, rest);
                } else if (/\.[a-z0-9]+$/i.test(rest)) {
                    // Any other file with an extension under /workspace/** maps to the root file name
                    filePath = path.join(distPath, path.basename(rest));
                }
            }

            // Rewrite SPA entry assets to root for non-workspace deep links
            if (urlPath.endsWith('/index.js') || urlPath === '/index.js') {
                filePath = path.join(distPath, 'index.js');
            }
            if (urlPath.endsWith('/index.css') || urlPath === '/index.css') {
                filePath = path.join(distPath, 'index.css');
            }
            // Back-compat for legacy paths referenced by service worker
            if (urlPath === '/static/js/bundle.js') {
                filePath = path.join(distPath, 'index.js');
            }
            if (urlPath === '/static/css/main.css') {
                filePath = path.join(distPath, 'index.css');
            }

            // Security check - ensure file is within dist directory
            if (!filePath.startsWith(distPath)) {
                console.log('Security violation:', filePath);
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

            // Check if file exists
            if (existsSync(filePath)) {
                const ext = path.extname(filePath);
                const contentType = getContentType(ext);
                console.log('Serving file:', filePath, 'Content-Type:', contentType);

                res.writeHead(200, { 'Content-Type': contentType });
                res.end(readFileSync(filePath));
            } else {
                console.log('File not found, serving index for SPA routing:', filePath);
                // For SPA routing, serve index.html for any non-existent file
                const indexPath = path.join(distPath, '_index.html');
                if (existsSync(indexPath)) {
                    let htmlContent = readFileSync(indexPath, 'utf8');
                    // Inject API base URL script and disable service worker before the app loads
                    const apiBaseScript = `<script>
                        window.__ELECTRON_API_BASE__ = 'http://localhost:${backendPort}/api';
                        // Disable service worker registration in Electron
                        if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                                for(let registration of registrations) {
                                    registration.unregister().catch(function() {});
                                }
                            }).catch(function() {});
                            // Override register to prevent new registrations (silently)
                            navigator.serviceWorker.register = function() {
                                return Promise.reject(new Error('Service workers disabled in Electron'));
                            };
                            // Also catch any existing registration attempts
                            window.addEventListener('error', function(e) {
                                if (e.message && e.message.includes('Service workers disabled')) {
                                    e.preventDefault();
                                    return false;
                                }
                            }, true);
                        }
                    </script>`;
                    // Insert before the closing </head> tag, or at the beginning of <head> if no closing tag
                    if (htmlContent.includes('</head>')) {
                        htmlContent = htmlContent.replace('</head>', `${apiBaseScript}\n</head>`);
                    } else if (htmlContent.includes('<head>')) {
                        htmlContent = htmlContent.replace('<head>', `<head>\n${apiBaseScript}`);
                    } else {
                        // If no head tag, prepend to body or beginning of file
                        htmlContent = apiBaseScript + '\n' + htmlContent;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(htmlContent);
                } else {
                    res.writeHead(404);
                    res.end('Not Found');
                }
            }
        });

        // Start server on a random port
        staticServer.listen(0, 'localhost', () => {
            const port = staticServer.address().port;
            const url = `http://localhost:${port}`;
            console.log('Serving app at:', url);
            console.log('Backend API at:', `http://localhost:${backendPort}/api`);

            // Redirect all requests targeting the web app backend (3001) to the desktop backend port.
            // Also redirect API requests from the static server port to the backend port.
            // Also handles websocket schemes used by the app.
            const urlsToIntercept = [
                'http://localhost:3001/*',
                'https://localhost:3001/*',
                `http://localhost:${port}/api/*`,
                `https://localhost:${port}/api/*`,
                'ws://localhost:3001/*',
                'wss://localhost:3001/*',
                `ws://localhost:${port}/*`,
                `wss://localhost:${port}/*`
            ];
            mainWindow.webContents.session.webRequest.onBeforeRequest({ urls: urlsToIntercept }, (details, callback) => {
                try {
                    let redirectURL = details.url;
                    // Redirect port 3001 to backend port
                    if (redirectURL.includes('://localhost:3001')) {
                        redirectURL = redirectURL.replace('://localhost:3001', `://localhost:${backendPort}`);
                    }
                    // Redirect API requests from static server port to backend port
                    else if (redirectURL.includes(`://localhost:${port}/api`)) {
                        redirectURL = redirectURL.replace(`://localhost:${port}/api`, `://localhost:${backendPort}/api`);
                    }
                    // Redirect websocket requests from static server port
                    else if (redirectURL.includes(`://localhost:${port}`) && (redirectURL.startsWith('ws://') || redirectURL.startsWith('wss://'))) {
                        redirectURL = redirectURL.replace(`://localhost:${port}`, `://localhost:${backendPort}`);
                    }
                    callback({ redirectURL });
                } catch (_) {
                    callback({});
                }
            });
            mainWindow.loadURL(url);
        });
    } else {
        console.error('Production build not found. Please run "yarn prod:frontend" first.');
        mainWindow.loadURL('data:text/html,<h1>Production build not found</h1><p>Please run "yarn prod:frontend" first.</p>');
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle page load events
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('App loaded successfully');
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open dev tools only in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

// Run migrations using Prisma CLI
async function runMigrations(databaseUrl, timeoutMs = 20000) {
    console.log('Running DB migrations...');
    if (!databaseUrl) {
        console.warn('⚠️  No DATABASE_URL provided. Skipping migrations.');
        return;
    }
    return new Promise((resolve) => {
        // Construct path to Prisma CLI (in unpacked node_modules)
        // app.asar.unpacked/server/node_modules/prisma/build/index.js
        let prismaCliPath;
        if (process.env.NODE_ENV === 'development') {
            // Dev mode: try common local paths
            const possiblePaths = [
                path.join(__dirname, 'server', 'node_modules', 'prisma', 'build', 'index.js'),
                path.join(process.cwd(), 'server', 'node_modules', 'prisma', 'build', 'index.js')
            ];
            prismaCliPath = possiblePaths.find(p => existsSync(p));
        } else {
            // Production: it is in app.asar.unpacked
            // __dirname is typically inside app.asar, so we need to step out to unpacked
            // resources/app.asar -> resources/app.asar.unpacked
            const unpackedRoot = __dirname.replace('app.asar', 'app.asar.unpacked');
            prismaCliPath = path.join(unpackedRoot, 'server', 'node_modules', 'prisma', 'build', 'index.js');
        }

        if (!prismaCliPath || !existsSync(prismaCliPath)) {
            console.warn(`⚠️ Prisma CLI not found at ${prismaCliPath}. Skipping migrations.`);
            // If we can't find CLI, we assume the template DB is good enough or we can't migrate.
            // Resolving to allow app to proceed.
            resolve();
            return;
        }

        const schemaPath = path.join(__dirname, 'server', 'prisma', 'schema.prisma');
        // Normalize database URL for Prisma CLI – this build uses SQLite only.
        // Ensure we always pass a proper `file:` URI to Prisma.
        const normalizedDbUrl = databaseUrl.startsWith('file:') ?
            databaseUrl :
            `file:${databaseUrl.replace(/\\/g, '/')}`;

        console.log(`Using Prisma CLI: ${prismaCliPath}`);
        console.log(`Using Schema: ${schemaPath}`);
        console.log(`Target DB: ${normalizedDbUrl.startsWith('file:') ? normalizedDbUrl : '[external database]'}`);

        let settled = false;
        const settle = (msg) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (msg) console.log(msg);
            resolve();
        };

        const proc = fork(prismaCliPath, ['migrate', 'deploy', '--schema', schemaPath], {
            env: {
                ...process.env,
                DATABASE_URL: normalizedDbUrl,
                PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: '1'
            },
            stdio: 'pipe'
        });

        proc.stdout.on('data', (data) => console.log(`[Prisma] ${data}`.toString().trim()));
        proc.stderr.on('data', (data) => console.error(`[Prisma Error] ${data}`.toString().trim()));

        proc.on('close', (code) => {
            if (code === 0) return settle('✓ Migrations applied successfully.');
            console.error(`❌ Migration process exited with code ${code}`);
            // Continue startup even if this exits non-zero – schema might already be up-to-date
            settle();
        });

        proc.on('error', (err) => {
            console.error('❌ Failed to spawn prisma migration process:', err);
            settle();
        });

        // Safety: avoid hanging forever if Prisma never exits (Windows can sometimes stall)
        const timer = setTimeout(() => {
            console.warn(`⚠️  Migration step timed out after ${timeoutMs}ms. Continuing startup.`);
            try { proc.kill('SIGINT'); } catch (_) {}
            settle();
        }, timeoutMs);
        if (typeof timer.unref === 'function') timer.unref();
    });
}

// Server management functions
async function startServer() {
    // Get server path first so we can read .env files
    const serverPath = path.join(__dirname, 'server');

    // Try to kill any existing processes on the preferred ports
    console.log('Checking for existing processes on ports...');
    await killProcessOnPort(backendPort);
    await killProcessOnPort(collectorPort);

    // Resolve available ports to avoid EADDRINUSE
    // For desktop hardcoded mode, keep backendPort fixed (3101) to avoid env/coordination.
    // Still allow collector to float.
    // backendPort = await findFreePort(backendPort);
    collectorPort = await findFreePort(collectorPort);

    // Desktop app database configuration
    // Default to a local SQLite database stored in the user's writable app data directory.
    let databaseUrl = null;
    const usingExternalDatabase = false; // flip to true only if you explicitly wire an external Postgres DB

    // Ensure a private storage directory for the desktop app
    const userDataPath = app.getPath('userData');
    const storageDir = path.join(userDataPath, 'storage');

    if (!existsSync(storageDir)) {
        try {
            mkdirSync(storageDir, { recursive: true });
        } catch (err) {
            console.error('Failed to create storage directory:', err);
        }
    }

    if (!usingExternalDatabase) {
        // Ensure the SQLite database exists. If not, copy the pre-migrated template from resources.
        // In production (ASAR), the template should be in resources/app.asar/server/storage/akili.db
        const dbName = 'akili.db';
        const targetDbPath = path.join(storageDir, dbName);

        if (!existsSync(targetDbPath)) {
            console.log(`Database not found at ${targetDbPath}. Initializing from template...`);
            try {
                // Packaged builds ship a fresh template under desktop-template/ (no local dev data).
                const templateCandidates = [
                    path.join(__dirname, 'server', 'storage', 'desktop-template', dbName),
                    path.join(__dirname, 'server', 'storage', dbName),
                ];
                const templateDbPath = templateCandidates.find((candidate) => existsSync(candidate));
                if (templateDbPath) {
                    copyFileSync(templateDbPath, targetDbPath);
                    console.log(`✓ Database initialized successfully from ${templateDbPath}`);
                    seedDesktopStorageFromTemplate(storageDir, templateDbPath);
                } else {
                    console.warn(`⚠️ Template database not found. Database will be created empty and may need migration.`);
                }
            } catch (err) {
                console.error('❌ Failed to initialize database:', err);
            }
        } else {
            console.log(`✓ Database found at ${targetDbPath}`);
        }
        databaseUrl = `file:${targetDbPath.replace(/\\/g, '/')}`;
        console.log(`✓ Using local SQLite database for Electron app at ${databaseUrl}`);
    } else {
        console.log('Using external database from DATABASE_URL');
    }

    // Attempt to run migrations to ensure DB is up to date
    await runMigrations(databaseUrl);

    console.log('Starting backend server...');
    const indexPath = path.join(serverPath, 'index.js');

    // Verify server directory and index.js exist
    if (!existsSync(serverPath)) {
        throw new Error(`Server directory not found: ${serverPath}`);
    }
    if (!existsSync(indexPath)) {
        throw new Error(`Server index.js not found: ${indexPath}`);
    }

    console.log(`Backend path: ${serverPath}`);
    console.log(`Backend index: ${indexPath}`);
    console.log(`Backend port: ${backendPort}`);

    // Check if .env file exists, if not, check for .env.example
    const envPath = path.join(serverPath, '.env');
    const envExamplePath = path.join(serverPath, '.env.example');
    if (!existsSync(envPath)) {
        if (existsSync(envExamplePath)) {
            console.warn('⚠️  server/.env not found, but .env.example exists. Backend may fail to start.');
            console.warn('   Consider copying .env.example to .env and configuring it.');
        } else {
            console.warn('⚠️  server/.env not found. Backend may fail to start.');
        }
    } else {
        console.log('✓ server/.env file found');
    }

    // Prepare environment variables
    const backendEnv = {
        ...process.env,
        NODE_ENV: 'production',
        SERVER_PORT: String(backendPort),
        COLLECTOR_HOST: '127.0.0.1',
        COLLECTOR_PORT: String(collectorPort),
        STORAGE_DIR: storageDir,
        DESKTOP_APP: 'true',
        DATABASE_URL: databaseUrl // Ensure valid connection string
    };
    // Preload desktop shims for missing modules in packaged runtime
    try {
        const shimBootstrapPath = path.join(__dirname, 'desktop-shims', 'bootstrap.js');
        // Avoid quotes to ensure Node parses correctly; path has no spaces under app.asar
        backendEnv.NODE_OPTIONS = `${backendEnv.NODE_OPTIONS ? backendEnv.NODE_OPTIONS + ' ' : ''}--require ${shimBootstrapPath}`;
    } catch (_) { /* noop */ }

    console.log('Starting backend (inline) ...');
    try {
        // Mirror env into current process for inline start
        // IMPORTANT: Set DATABASE_URL FIRST before any other env vars
        // This ensures Prisma sees it before it tries to override with SQLite
        process.env.DATABASE_URL = backendEnv.DATABASE_URL;
        process.env.NODE_ENV = backendEnv.NODE_ENV;
        process.env.SERVER_PORT = backendEnv.SERVER_PORT;
        process.env.COLLECTOR_HOST = backendEnv.COLLECTOR_HOST;
        process.env.COLLECTOR_PORT = backendEnv.COLLECTOR_PORT;
        process.env.STORAGE_DIR = backendEnv.STORAGE_DIR;
        process.env.DESKTOP_APP = 'true';

        // Ensure shims loaded
        const shimBootstrapPath = path.join(__dirname, 'desktop-shims', 'bootstrap.js');
        require(shimBootstrapPath);

        const serverIndex = path.join(serverPath, 'index.js');
        // With root package.json not being "type": "module", we can just require() directly.
        require(serverIndex);

        serverStartedInline = true;
        console.log('✓ Backend (inline) started');
    } catch (e) {
        console.error('❌ Inline backend start failed:', e);
        throw e;
    }

    // Start the collector service (document processor) on isolated port and storage
    const spawnCollector = async() => {
        console.log('Starting collector (inline) ...');
        try {
            // Use the same writable storage directory as the backend (userData/storage)
            const collectorStorageDir = storageDir;
            // Ensure collector storage directory exists
            if (!existsSync(collectorStorageDir)) {
                try {
                    mkdirSync(collectorStorageDir, { recursive: true });
                    console.log(`✓ Created collector storage directory: ${collectorStorageDir}`);
                } catch (err) {
                    console.error('❌ Failed to create collector storage directory:', err);
                }
            }

            // Mirror env for collector inline start
            // IMPORTANT: Set COLLECTOR_PORT FIRST before requiring collector
            process.env.COLLECTOR_PORT = String(collectorPort);
            process.env.NODE_ENV = 'production';
            process.env.STORAGE_DIR = collectorStorageDir;
            process.env.DESKTOP_APP = 'true';
            // Pass DATABASE_URL to collector in case it needs database access
            // (Currently collector doesn't use DB directly, but backend does)
            if (databaseUrl) {
                process.env.DATABASE_URL = databaseUrl;
            }

            // Ensure shims loaded
            const shimBootstrapPath = path.join(__dirname, 'desktop-shims', 'bootstrap.js');
            try {
                require(shimBootstrapPath);
            } catch (err) {
                console.warn('⚠️  Could not load desktop shims for collector:', err.message);
            }

            const collectorDir = path.join(__dirname, 'collector');
            const collectorIndex = path.join(collectorDir, 'index.js');

            if (!existsSync(collectorIndex)) {
                throw new Error(`Collector index.js not found at ${collectorIndex}`);
            }

            // Start the collector as a forked Node process for isolation and reliable logging
            collectorProcess = fork(collectorIndex, [], {
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    COLLECTOR_PORT: String(collectorPort),
                    STORAGE_DIR: collectorStorageDir,
                    DESKTOP_APP: 'true'
                },
                stdio: 'pipe'
            });

            // Guard against missing stdio streams in certain environments.
            if (collectorProcess.stdout && typeof collectorProcess.stdout.on === 'function') {
                collectorProcess.stdout.on('data', (data) => {
                    console.log(`[collector] ${data}`.toString().trim());
                });
            }
            if (collectorProcess.stderr && typeof collectorProcess.stderr.on === 'function') {
                collectorProcess.stderr.on('data', (data) => {
                    console.error(`[collector:error] ${data}`.toString().trim());
                });
            }
            collectorProcess.on('exit', (code, signal) => console.warn(`Collector process exited with code ${code} and signal ${signal}`));

            // Wait a moment for the collector to start listening
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Verify collector is running by making a health check request
            try {
                const healthCheck = http.get(`http://127.0.0.1:${collectorPort}/accepts`, (res) => {
                    if (res.statusCode === 200) {
                        console.log(`✓ Collector started and responding on port ${collectorPort}`);
                    } else {
                        console.warn(`⚠️  Collector responded with status ${res.statusCode}`);
                    }
                });
                healthCheck.on('error', (err) => {
                    console.warn(`⚠️  Collector health check failed: ${err.message}`);
                    console.warn('   Collector may still be starting or may have failed to start');
                });
                healthCheck.setTimeout(2000, () => {
                    healthCheck.destroy();
                    console.warn('⚠️  Collector health check timed out');
                });
            } catch (err) {
                console.warn(`⚠️  Could not verify collector startup: ${err.message}`);
            }

        } catch (e) {
            console.error('❌ Inline collector start failed:', e);
            console.error('Collector error stack:', e.stack);
            // Don't throw - allow app to continue even if collector fails
            // The backend will handle collector unavailability gracefully
        }
    };

    await spawnCollector();

    // Wait for backend to be ready by checking /ping endpoint
    try {
        await waitForBackend(backendPort);
        console.log(`Backend is ready on port ${backendPort}`);
    } catch (err) {
        // Fallback: if inline start technically "succeeded" (didn't throw) but server isn't responding,
        // it implies logic error or async startup issue.
        // Since we already started inline above, if it fails health check, we can't really "restart" it inline easily 
        // without clearing cache, which is complex.
        // We just log error.
        console.error('Backend did not respond even after inline start:', err);
        throw err;
    }
}

// Wait for backend server to be ready
function waitForBackend(port, maxAttempts = 60, delay = 1000) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkBackend = () => {
            attempts++;

            // Check if backend process is still running (skip if started inline)
            if (!serverStartedInline && (!backendProcess || backendProcess.killed)) {
                reject(new Error('Backend process is not running'));
                return;
            }

            const req = http.get(`http://localhost:${port}/api/ping`, (res) => {
                if (res.statusCode === 200) {
                    console.log('✓ Backend health check passed - server is ready');
                    resolve();
                } else {
                    if (attempts < maxAttempts) {
                        if (attempts % 5 === 0) {
                            console.log(`Waiting for backend... (attempt ${attempts}/${maxAttempts})`);
                        }
                        setTimeout(checkBackend, delay);
                    } else {
                        reject(new Error(`Backend returned status ${res.statusCode} after ${maxAttempts} attempts`));
                    }
                }
            });
            req.on('error', (err) => {
                if (attempts < maxAttempts) {
                    if (attempts % 5 === 0) {
                        console.log(`Backend not ready yet (attempt ${attempts}/${maxAttempts}), retrying...`);
                    }
                    setTimeout(checkBackend, delay);
                } else {
                    console.error(`\n❌ Backend failed to start after ${maxAttempts} attempts (${maxAttempts} seconds)`);
                    console.error(`Error: ${err.message}`);
                    console.error('\nTroubleshooting steps:');
                    console.error('1. Check if backend process is running (look for "Backend:" messages above)');
                    console.error('2. Check for "Backend Error:" messages above');
                    console.error('3. Verify server dependencies: cd server && yarn install');
                    console.error('4. Check if server/.env file exists');
                    console.error('5. Try manually starting backend: cd server && node index.js');
                    reject(err);
                }
            });
            req.setTimeout(3000, () => {
                req.destroy();
                if (attempts < maxAttempts) {
                    setTimeout(checkBackend, delay);
                } else {
                    reject(new Error('Backend health check timeout - server did not respond'));
                }
            });
        };
        // Start checking after a short delay to give backend time to start
        console.log(`Waiting for backend to be ready on port ${port}...`);
        setTimeout(checkBackend, 3000);
    });
}

function stopServer() {
    if (staticServer) {
        staticServer.close();
        staticServer = null;
    }

    if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
    }

    if (collectorProcess) {
        collectorProcess.kill();
        collectorProcess = null;
    }
}

ipcMain.handle('save-text-file', async (event, { defaultFilename, content }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
        defaultPath: defaultFilename || 'download.txt',
        filters: [{ name: 'All Files', extensions: ['*'] }],
    });
    if (canceled || !filePath) return { ok: false, canceled: true };
    writeFileSync(filePath, content, 'utf8');
    return { ok: true, filePath };
});

// App event handlers
app.whenReady().then(async() => {
    try {
        await startServer();
        // Backend is now ready, create window
        createWindow();
    } catch (error) {
        console.error('Failed to start server:', error);
        console.error('Error stack:', error.stack);
        // Still create window to show error
        createWindow();
        // Show error message in window after it loads
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                const errorMsg = String(error && error.message ? error.message : error)
                    .replace(/\\/g, "\\\\") // escape backslashes in Windows paths
                    .replace(/'/g, "\\'")
                    .replace(/\n/g, '\\n');
                mainWindow.webContents.executeJavaScript(`
                    document.body.innerHTML = '<div style="padding: 40px; font-family: Arial, sans-serif; text-align: center; max-width: 600px; margin: 50px auto;"><h1 style="color: #dc2626;">Failed to Start Backend Server</h1><p style="color: #dc2626; font-size: 16px; margin: 20px 0;">' + '${errorMsg}' + '</p><p style="color: #666; margin-top: 30px;">Please check the Electron console/terminal for detailed error messages.</p><p style="color: #666; margin-top: 20px; font-size: 14px;">Common solutions:</p><ul style="text-align: left; display: inline-block; color: #666;"><li>Close all other Electron/Node processes</li><li>Check if ports 3101 and 8891 are available</li><li>Verify server dependencies are installed (run: cd server && yarn install)</li><li>Check server/.env file exists</li></ul></div>';
                `);
            }
        }, 1000);
    }

    // macOS specific: re-create window when dock icon is clicked
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    stopServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Cleanup on app quit
app.on('before-quit', () => {
    stopServer();
});

// Handle app termination
process.on('SIGTERM', () => {
    stopServer();
    app.quit();
});

process.on('SIGINT', () => {
    stopServer();
    app.quit();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

// Create application menu
const template = [{
        label: 'File',
        submenu: [{
                label: 'New Workspace',
                accelerator: 'CmdOrCtrl+N',
                click: () => {
                    mainWindow.webContents.send('menu-new-workspace');
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                click: () => {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' }
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'close' }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);