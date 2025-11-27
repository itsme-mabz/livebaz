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
            throw new Error("Password is not strong");
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
