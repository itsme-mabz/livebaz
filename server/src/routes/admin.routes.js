const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin-controller');
const isAuthenticated = require('../middleware/auth.middleware');
const adminMiddleware = require('../Auth-middleware/Admin-middleware');

// All routes require authentication and admin privileges
router.use(isAuthenticated);
router.use(adminMiddleware);

// Popular items management
router.get('/popular-items', adminController.getPopularItems);
router.post('/popular-items', adminController.addPopularItem);
router.put('/popular-items/:id', adminController.updatePopularItem);
router.delete('/popular-items/:id', adminController.removePopularItem);

// Search endpoints for admin panel
router.get('/search/matches', adminController.searchMatches);
router.get('/search/leagues', adminController.searchLeagues);

module.exports = router;
