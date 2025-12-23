const express = require('express');
const {
  getAllBlogs,
  getBlogBySlug,
  getTrendingBlogs,
  getRelatedBlogs,
  getCategories
} = require('../controller/blog-controller');

const router = express.Router();

// Public routes
router.get('/blogs', getAllBlogs);
router.get('/blogs/trending', getTrendingBlogs);
router.get('/blogs/categories', getCategories);
router.get('/blogs/:slug', getBlogBySlug);
router.get('/blogs/:slug/related', getRelatedBlogs);

module.exports = router;
