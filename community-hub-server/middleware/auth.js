const jwt = require('jsonwebtoken');

/**
 * Authenticate user by connection key (Bearer token)
 */
function authenticateConnectionKey(userModel) {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const connectionKey = authHeader.substring(7); // Remove 'Bearer '

        try {
            const user = await userModel.findByConnectionKey(connectionKey);

            if (!user) {
                return res.status(401).json({ error: 'Invalid connection key' });
            }

            req.user = {
                id: user._id ? user._id.toString() : user.id,
                email: user.email,
                isAdmin: Boolean(user.is_admin)
            };

            next();
        } catch (error) {
            console.error('Authentication error:', error);
            return res.status(500).json({ error: 'Authentication failed' });
        }
    };
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
function optionalAuth(userModel) {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const connectionKey = authHeader.substring(7);

        try {
            const user = await userModel.findByConnectionKey(connectionKey);

            if (user) {
                req.user = {
                    id: user._id ? user._id.toString() : user.id,
                    email: user.email,
                    isAdmin: Boolean(user.is_admin)
                };
            } else {
                req.user = null;
            }

            next();
        } catch (error) {
            console.error('Optional auth error:', error);
            req.user = null;
            next();
        }
    };
}

/**
 * Require admin privileges
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin privileges required' });
    }

    next();
}

/**
 * Generate JWT token for session management (optional)
 */
function generateJWT(userId, secret, expiresIn = '7d') {
    return jwt.sign({ userId }, secret, { expiresIn });
}

/**
 * Verify JWT token
 */
function verifyJWT(token, secret) {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        return null;
    }
}

module.exports = {
    authenticateConnectionKey,
    optionalAuth,
    requireAdmin,
    generateJWT,
    verifyJWT
};