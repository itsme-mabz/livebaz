// routes/testRoutes.js
const express = require('express');
const router = express.Router();
const {
  publicTest,
  protectedTest,
  adminTest,
  getTestData
} = require('../controllers/testController');

const authMiddleware = require('../middleware/auth');


// Public routes (no authentication required)
router.get('/public', publicTest);
router.get('/data', getTestData);

// Protected routes (authentication required)
router.get('/protected', authMiddleware, protectedTest);

// Admin routes (authentication + admin privileges required)
router.get('/admin', authMiddleware,);

// Mixed access routes
router.get('/user-profile', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'User profile accessed successfully',
    data: {
      user: req.user,
      profile: {
        joined: req.user.created_at,
        lastLogin: new Date().toISOString()
      }
    }
  });
});

// Another admin route example
router.get('/admin-stats', authMiddleware,  (req, res) => {
  res.json({
    success: true,
    message: 'Admin statistics',
    data: {
      user: req.user,
      stats: {
        serverUptime: '99.9%',
        totalRequests: 10000,
        activeSessions: 150,
        systemHealth: 'excellent'
      }
    }
  });
});

module.exports = router;