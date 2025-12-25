const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user.model');

const Blog = sequelize.define('Blog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'General'
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  author_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  featured_image: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata like teams, competition, match_id, etc.'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'For sorting/ordering featured posts'
  }
}, {
  timestamps: true,
  tableName: 'blogs',
  indexes: [
    {
      fields: ['slug']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_published']
    },
    {
      fields: ['published_at']
    }
  ]
});

// Association with User
Blog.belongsTo(User, {
  foreignKey: 'author_id',
  as: 'author'
});

module.exports = Blog;
