const express = require('express');
const {
  getAllBlogs,
  getBlogBySlug,
  getTrendingBlogs,
  getRelatedBlogs,
  getCategories,
  getComments,
  postComment,
  deleteComment
} = require('../controller/blog-controller');
const isAuthenticated = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/blogs', getAllBlogs);
router.get('/blogs/trending', getTrendingBlogs);
router.get('/blogs/categories', getCategories);
router.get('/blogs/:slug', getBlogBySlug);
router.get('/blogs/:slug/related', getRelatedBlogs);

// Comment routes
router.get('/blogs/:blogId/comments', getComments);
router.post('/blogs/:blogId/comments', isAuthenticated, postComment);
router.delete('/blogs/:blogId/comments/:commentId', isAuthenticated, deleteComment);

module.exports = router;
