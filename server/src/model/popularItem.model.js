const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const PopularItem = sequelize.define(
  "PopularItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    type: {
      type: DataTypes.ENUM('match', 'league'),
      allowNull: false,
      comment: 'Type of popular item: match or league'
    },

    item_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'API ID of the match or league'
    },

    item_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name of the match or league for display'
    },

    item_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional data about the item (teams, logos, etc.)'
    },

    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Higher priority items appear first'
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether this item should be displayed'
    },

    added_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'User ID of the admin who added this item'
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['is_active'] },
      { fields: ['priority'] }
    ]
  }
);

module.exports = PopularItem;
