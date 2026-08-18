require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Database and Models
const MongoDB = require('./database/mongodb');
const UserModel = require('./models/UserMongo');
const ItemModel = require('./models/ItemMongo');

// Middleware
const auth = require('./middleware/auth');
const validation = require('./middleware/validation');
const storage = require('./middleware/storage');

// Routes
const exploreRoutes = require('./routes/explore');
const itemRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');
const downloadRoutes = require('./routes/downloads');
const profileRoutes = require('./routes/profile');
const anythingllmProxyRoutes = require('./routes/anythingllm-proxy');

// Configuration
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Akili-hub';
const STORAGE_PATH = process.env.STORAGE_PATH || './storage/bundles';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Initialize Express
const app = express();

// Security & Performance Middleware
// Use helmet but with explicit CSP that allows inline scripts
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(compression());
app.use(morgan('combined'));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ?
    process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/v1/', limiter);

// Initialize Database and Models
const mongodb = new MongoDB(MONGODB_URI);
const userModel = new UserModel();
const itemModel = new ItemModel();

// Configure file upload
const uploadMiddleware = storage.configureStorage(STORAGE_PATH);

// Health Check
app.get('/health', (req, res) => {
    // Support both JSON and text responses
    const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');

    if (acceptsJson) {
        return res.json({
            status: 'ok',
            service: 'Akili Community Hub',
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });
    } else {
        return res.send('OK');
    }
});

// API Routes - Support both /v1 and Firebase paths
// Firebase Cloud Functions path compatibility
app.use('/anythingllm-hub/us-central1/external/v1/explore', exploreRoutes(itemModel));
app.use('/anythingllm-hub/us-central1/external/v1/auth', authRoutes(userModel, auth, validation));
app.use('/anythingllm-hub/us-central1/external/v1', itemRoutes(itemModel, userModel, auth, validation, {
    upload: uploadMiddleware,
    deleteFile: storage.deleteFile,
    generateDownloadUrl: storage.generateDownloadUrl
}, BASE_URL));

// Standard /v1 paths
app.use('/v1/explore', exploreRoutes(itemModel));
app.use('/v1/auth', authRoutes(userModel, auth, validation));
app.use('/v1', itemRoutes(itemModel, userModel, auth, validation, {
    upload: uploadMiddleware,
    deleteFile: storage.deleteFile,
    generateDownloadUrl: storage.generateDownloadUrl
}, BASE_URL));

// AnythingLLM proxy routes (for frontend direct calls)
app.use('/community-hub', anythingllmProxyRoutes(itemModel, userModel, auth, validation, {
    upload: uploadMiddleware,
    deleteFile: storage.deleteFile,
    generateDownloadUrl: storage.generateDownloadUrl
}, BASE_URL));

// HTML page routes (must come before API routes)
app.get('/me', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'me.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Other routes
app.use('/downloads', downloadRoutes(STORAGE_PATH));
// API profile routes
app.use('/api/me', profileRoutes(userModel, auth));
app.use('/api/settings', profileRoutes(userModel, auth));

// API Info endpoint (only for /api path)
app.get('/api', (req, res) => {
    res.json({
        name: 'Akili Community Hub API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            webUI: {
                login: 'GET /',
                profile: 'GET /me'
            },
            profile: 'GET /api/me',
            settings: 'GET /api/settings',
            explore: 'GET /v1/explore',
            auth: {
                register: 'POST /v1/auth/register',
                login: 'POST /v1/auth/login',
                me: 'GET /v1/auth/me',
                regenerateKey: 'POST /v1/auth/regenerate-key'
            },
            items: {
                list: 'GET /v1/items',
                get: 'GET /v1/:entityType/:entityId/pull',
                create: 'POST /v1/:itemType/create',
                uploadBundle: 'POST /v1/agent-skill/upload',
                update: 'PUT /v1/items/:itemId',
                delete: 'DELETE /v1/items/:itemId'
            },
            admin: {
                verify: 'POST /v1/admin/items/:itemId/verify'
            }
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Start Server
async function startServer() {
    try {
        // Connect to MongoDB
        await mongodb.connect();

        const server = app.listen(PORT, () => {
            console.log('╔════════════════════════════════════════════════════════╗');
            console.log('║                                                        ║');
            console.log('║      Akili Community Hub API Server              ║');
            console.log('║                                                        ║');
            console.log('╚════════════════════════════════════════════════════════╝');
            console.log('');
            console.log(`🚀 Server running on: ${BASE_URL}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🗄️  Database: MongoDB`);
            console.log(`📦 Storage: ${STORAGE_PATH}`);
            console.log('');
            console.log('Available endpoints:');
            console.log(`  Health Check: ${BASE_URL}/health`);
            console.log(`  API Docs:     ${BASE_URL}/`);
            console.log(`  Explore:      ${BASE_URL}/v1/explore`);
            console.log('');
            console.log('Press Ctrl+C to stop the server');
            console.log('');
        });

        // Graceful Shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully...');
            server.close(async () => {
                console.log('Server closed');
                await mongodb.disconnect();
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('\nSIGINT received, shutting down gracefully...');
            server.close(async () => {
                console.log('Server closed');
                await mongodb.disconnect();
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;