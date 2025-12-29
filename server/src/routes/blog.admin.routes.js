const express = require('express');
const {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogsAdmin,
  getBlogAnalytics
} = require('../controller/blog-controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../Auth-middleware/Admin-middleware');

const router = express.Router();

// Admin routes - require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/blogs', getAllBlogsAdmin);
router.get('/blogs/analytics', getBlogAnalytics);
router.post('/blogs', createBlog);
router.put('/blogs/:id', updateBlog);
router.delete('/blogs/:id', deleteBlog);

module.exports = router;
