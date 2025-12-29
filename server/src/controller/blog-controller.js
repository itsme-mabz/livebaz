const Blog = require("../model/blog.model");
const User = require("../model/user.model");
const Comment = require("../model/comment.model");
const BlogView = require("../model/blog-view.model");
const AsyncHandler = require("express-async-handler");
const ErrorHandler = require("../utils/Errorhandler");
const { uploadToCloudinary } = require("../utils/cloudinary");
const axios = require('axios');

// Get all published blogs (public)
exports.getAllBlogs = AsyncHandler(async (req, res, next) => {
  const { category, tag, page = 1, limit = 10, search } = req.query;

  const whereClause = { is_published: true };

  if (category) {
    whereClause.category = category;
  }

  if (tag) {
    whereClause.tags = {
      [require('sequelize').Op.contains]: [tag]
    };
  }

  if (search) {
    whereClause[require('sequelize').Op.or] = [
      { title: { [require('sequelize').Op.like]: `%${search}%` } },
      { excerpt: { [require('sequelize').Op.like]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Blog.findAndCountAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'Name', 'Email']
    }],
    order: [
      ['priority', 'DESC'],
      ['published_at', 'DESC']
    ],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.status(200).json({
    success: true,
    message: "Blogs fetched successfully",
    count: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: rows
  });
});

// Get single blog by slug (public)
exports.getBlogBySlug = AsyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({
    where: { slug, is_published: true },
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'Name', 'Email']
    }]
  });

  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  // Increment view count
  blog.view_count += 1;
  await blog.save();

  // Track view with country
  let ip = req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress;
  
  // Clean IPv6 localhost to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  
  let country = 'Unknown';
  
  // Skip geolocation for localhost
  if (ip !== '127.0.0.1' && ip !== 'localhost') {
    try {
      const geoResponse = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 3000 });
      if (geoResponse.data && geoResponse.data.status === 'success') {
        country = geoResponse.data.country;
      }
    } catch (error) {
      console.log('Geo lookup failed for IP', ip, ':', error.message);
    }
  } else {
    country = 'Localhost';
  }

  await BlogView.create({
    blog_id: blog.id,
    country,
    ip_address: ip
  });

  res.status(200).json({
    success: true,
    message: "Blog fetched successfully",
    data: blog
  });
});

// Get trending/popular blogs (public)
exports.getTrendingBlogs = AsyncHandler(async (req, res, next) => {
  const { limit = 5 } = req.query;

  const blogs = await Blog.findAll({
    where: { is_published: true },
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'Name', 'Email']
    }],
    order: [
      ['view_count', 'DESC'],
      ['published_at', 'DESC']
    ],
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    message: "Trending blogs fetched successfully",
    count: blogs.length,
    data: blogs
  });
});

// Get related blogs (public)
exports.getRelatedBlogs = AsyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const { limit = 3 } = req.query;

  // First get the current blog
  const currentBlog = await Blog.findOne({
    where: { slug, is_published: true }
  });

  if (!currentBlog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  // Find blogs with same category or tags
  const relatedBlogs = await Blog.findAll({
    where: {
      is_published: true,
      id: { [require('sequelize').Op.ne]: currentBlog.id },
      [require('sequelize').Op.or]: [
        { category: currentBlog.category },
        ...(currentBlog.tags && currentBlog.tags.length > 0 ? [{
          tags: {
            [require('sequelize').Op.overlap]: currentBlog.tags
          }
        }] : [])
      ]
    },
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'Name', 'Email']
    }],
    order: [
      ['published_at', 'DESC']
    ],
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    message: "Related blogs fetched successfully",
    count: relatedBlogs.length,
    data: relatedBlogs
  });
});

// Admin: Create new blog
exports.createBlog = AsyncHandler(async (req, res, next) => {
  const {
    title,
    slug,
    content,
    excerpt,
    category,
    featured_image,
    tags,
    metadata,
    is_published,
    priority
  } = req.body;

  const userId = req.user.id;
  const userName = req.user.Name;

  if (!title || !slug || !content) {
    return next(new ErrorHandler("Title, slug, and content are required", 400));
  }

  // Check if slug already exists
  const existingBlog = await Blog.findOne({ where: { slug } });
  if (existingBlog) {
    return next(new ErrorHandler("Blog with this slug already exists", 400));
  }

  let imageUrl = featured_image;
  if (featured_image && featured_image.startsWith("data:image/")) {
    try {
      imageUrl = await uploadToCloudinary(featured_image, "blogs");
    } catch (error) {
      return next(new ErrorHandler("Error uploading image to Cloudinary", 500));
    }
  }

  const blogData = {
    title,
    slug,
    content,
    excerpt,
    category: category || 'General',
    author_id: userId,
    author_name: userName,
    featured_image: imageUrl,
    tags: tags || [],
    metadata: metadata || {},
    is_published: is_published || false,
    priority: priority || 0,
    published_at: is_published ? new Date() : null
  };

  const blog = await Blog.create(blogData);

  res.status(201).json({
    success: true,
    message: "Blog created successfully",
    data: blog
  });
});

// Admin: Update blog
exports.updateBlog = AsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const blog = await Blog.findByPk(id);

  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  // If publishing for first time, set published_at
  if (updateData.is_published && !blog.is_published) {
    updateData.published_at = new Date();
  }

  // Handle image upload if it's base64
  if (updateData.featured_image && updateData.featured_image.startsWith("data:image/")) {
    try {
      updateData.featured_image = await uploadToCloudinary(updateData.featured_image, "blogs");
    } catch (error) {
      return next(new ErrorHandler("Error uploading image to Cloudinary", 500));
    }
  }

  await blog.update(updateData);

  res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    data: blog
  });
});

// Admin: Delete blog
exports.deleteBlog = AsyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findByPk(id);

  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  await blog.destroy();

  res.status(200).json({
    success: true,
    message: "Blog deleted successfully"
  });
});

// Admin: Get all blogs (including unpublished)
exports.getAllBlogsAdmin = AsyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;

  const whereClause = {};

  if (status === 'published') {
    whereClause.is_published = true;
  } else if (status === 'draft') {
    whereClause.is_published = false;
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Blog.findAndCountAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'Name', 'Email']
    }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.status(200).json({
    success: true,
    message: "Blogs fetched successfully",
    count: count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: rows
  });
});

// Get blog categories (public)
exports.getCategories = AsyncHandler(async (req, res, next) => {
  const categories = await Blog.findAll({
    where: { is_published: true },
    attributes: [
      'category',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['category'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']]
  });

  res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    data: categories
  });
});

// Get comments for a blog (public)
exports.getComments = AsyncHandler(async (req, res, next) => {
  const { blogId } = req.params;

  const blog = await Blog.findByPk(blogId);
  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  const comments = await Comment.findAll({
    where: { blog_id: blogId },
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    success: true,
    message: "Comments fetched successfully",
    count: comments.length,
    data: comments
  });
});

// Post a comment (authenticated)
exports.postComment = AsyncHandler(async (req, res, next) => {
  const { blogId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return next(new ErrorHandler("Comment content is required", 400));
  }

  const blog = await Blog.findByPk(blogId);
  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }

  const comment = await Comment.create({
    blog_id: blogId,
    user_id: req.user.id,
    user_name: req.user.Name,
    content: content.trim()
  });

  res.status(201).json({
    success: true,
    message: "Comment posted successfully",
    data: comment
  });
});

// Delete a comment (authenticated - only owner or admin)
exports.deleteComment = AsyncHandler(async (req, res, next) => {
  const { blogId, commentId } = req.params;

  const comment = await Comment.findOne({
    where: {
      id: commentId,
      blog_id: blogId
    }
  });

  if (!comment) {
    return next(new ErrorHandler("Comment not found", 404));
  }

  // Check if user is the comment owner or admin
  if (comment.user_id !== req.user.id && !req.user.is_admin) {
    return next(new ErrorHandler("You don't have permission to delete this comment", 403));
  }

  await comment.destroy();

  res.status(200).json({
    success: true,
    message: "Comment deleted successfully"
  });
});

// Admin: Get blog analytics
exports.getBlogAnalytics = AsyncHandler(async (req, res, next) => {
  const { sequelize } = require('../config/db');
  const { Op } = require('sequelize');
  
  // Total views
  const totalViews = await BlogView.count();
  
  // Today's views
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayViews = await BlogView.count({
    where: {
      createdAt: {
        [Op.gte]: today
      }
    }
  });
  
  // Views by country
  const viewsByCountry = await BlogView.findAll({
    attributes: [
      'country',
      [sequelize.fn('COUNT', sequelize.col('id')), 'views']
    ],
    group: ['country'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
  });

  res.status(200).json({
    success: true,
    message: "Analytics fetched successfully",
    data: {
      totalViews,
      todayViews,
      viewsByCountry
    }
  });
});
