const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Blog = require('./blog.model');

const BlogView = sequelize.define('BlogView', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  blog_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Blog,
      key: 'id'
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'blog_views',
  indexes: [
    { fields: ['blog_id'] },
    { fields: ['country'] }
  ]
});

module.exports = BlogView;
