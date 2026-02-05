const express = require('express');

/**
 * Profile/Settings routes for users
 */
function profileRoutes(userModel, auth) {
  const router = express.Router();
  /**
   * GET /me
   * Get current user profile (similar to /v1/auth/me but at root)
   */
  router.get('/', auth.optionalAuth(userModel), (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        user: null
      });
    }

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        isAdmin: req.user.isAdmin
      },
      error: null
    });
  });

  /**
   * GET /settings
   * Get user settings including connection key
   */
  router.get('/settings', auth.authenticateConnectionKey(userModel), async (req, res) => {
    try {
      const user = await userModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        connectionKey: user.connection_key,
        email: user.email,
        isAdmin: Boolean(user.is_admin)
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch settings'
      });
    }
  });

  return router;
}

module.exports = profileRoutes;