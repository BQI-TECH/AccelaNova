const express = require('express');

/**
 * Authentication routes
 */
function authRoutes(userModel, auth, validation) {
    const router = express.Router();
    /**
     * POST /v1/auth/register
     * Register a new user
     */
    router.post('/register', validation.validateUserRegistration, async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await userModel.create(email, password, false);

            res.status(201).json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    connectionKey: user.connectionKey
                },
                error: null
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /v1/auth/login
     * Login and get connection key
     */
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            const user = await userModel.findByEmail(email);
            
            console.log('Login attempt for:', email);
            console.log('User found:', user ? 'Yes' : 'No');
            console.log('User object:', JSON.stringify(user, null, 2));

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            console.log('Password hash exists:', !!user.password_hash);
            console.log('Password provided:', !!password);
            
            const validPassword = await userModel.verifyPassword(password, user.password_hash);

            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    connectionKey: user.connection_key,
                    isAdmin: Boolean(user.is_admin)
                },
                error: null
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed'
            });
        }
    });

    /**
     * GET /v1/auth/me
     * Get current user info
     */
    router.get('/me', auth.authenticateConnectionKey(userModel), (req, res) => {
        res.json({
            success: true,
            user: req.user,
            error: null
        });
    });

    /**
     * POST /v1/auth/regenerate-key
     * Regenerate connection key
     */
    router.post('/regenerate-key', auth.authenticateConnectionKey(userModel), async (req, res) => {
        try {
            const newKey = userModel.regenerateConnectionKey(req.user.id);

            res.json({
                success: true,
                connectionKey: newKey,
                error: null
            });
        } catch (error) {
            console.error('Key regeneration error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to regenerate connection key'
            });
        }
    });

    return router;
}

module.exports = authRoutes;