const AsyncHandler = require("express-async-handler");
const User = require("../model/user.model");
const sendToken = require("../utils/SendToken");
const ErrorHandler = require("../utils/Errorhandler");

module.exports.Register = AsyncHandler(async (req, res, next) => {
  const { Name, Email, Password, confirmpassword } = req.body;

  // 1️⃣ Check required fields
  if (!Name || !Email || !Password) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  // 2️⃣ Check if user already exists
  const existingUser = await User.findOne({ where: { Email } });
  if (existingUser) {
    return next(new ErrorHandler("User already exists", 400));
  }

  // 4️⃣ Create new user (Sequelize auto-hashes password if set in model hooks)
  const user = await User.create({
    Name,
    Email,
    Password,
    confirmpassword,
  });

  // 5️⃣ Send JWT token response
  sendToken(user, 201, res);
});


module.exports.Login = AsyncHandler(async (req, res, next) => {
  // First we get the data from user coming from forntant
  // then chek all filed are have or not
  // other check the user are availale in data base or not
  // firther move in comparing password
  // atlast the user login succesfully
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    return next(new ErrorHandler("All Field are Required ", 400));
  }

  const user = await User.findOne({ where: { Email } });
  if (!user) {
    return next(new ErrorHandler("Invalid email or Password email", 401));
  }

  const iscomparepassword = await user.comparePassword(Password);
  if (!iscomparepassword) {
    return next(new ErrorHandler("Invalid email and Password"));
  }

  sendToken(user, 200, res);
});

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Update user profile
    const result = await pool.query(
      "UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, created_at, updated_at",
      [name, userId]
    );

    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
