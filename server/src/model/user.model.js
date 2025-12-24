const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    Name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isAlphanumeric: { msg: "Username must be alphanumeric" } },
    },

    Email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: { msg: "Invalid email address" } },
    },

    Password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isStrongPassword(value) {
          if (!validator.isStrongPassword(value)) {
            throw new Error("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
          }
        },
      },
    },

    confirmPassword: {
      type: DataTypes.VIRTUAL, // Not stored in DB
      validate: {
        confirmMatch(value) {
          if (value !== this.Password) {
            throw new Error("Password confirmation does not match password");
          }
        },
      },
    },

    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  { timestamps: true }
);

// ===============================
// PASSWORD HASHING HOOKS
// ===============================
User.beforeCreate(async (user) => {
  if (user.Password) {
    user.Password = await bcrypt.hash(user.Password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed("Password")) {
    user.Password = await bcrypt.hash(user.Password, 10);
  }
});

// ===============================
// INSTANCE METHODS
// ===============================
User.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.Password);
};

User.prototype.getJWTToken = function () {
  return jwt.sign({ id: this.id, Email: this.Email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

module.exports = User;
