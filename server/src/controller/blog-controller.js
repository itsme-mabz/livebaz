const Blog = require("../model/blog.model");
const User = require("../model/user.model");
const AsyncHandler = require("express-async-handler");
const ErrorHandler = require("../utils/Errorhandler");

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

  const blogData = {
    title,
    slug,
    content,
    excerpt,
    category: category || 'General',
    author_id: userId,
    author_name: userName,
    featured_image,
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
