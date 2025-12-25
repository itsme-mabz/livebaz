const ErrorHandler = require("../utils/Errorhandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Log error for debugging
  console.error("Error:", err.message);
  if (process.env.NODE_ENV === "development") {
    console.error("Stack:", err.stack);
  }

  // Handle specific error types
  let error = { ...err };
  error.message = err.message;

  // Sequelize Validation Error
  if (err.name === "SequelizeValidationError") {
    const message = err.errors.map((e) => e.message).join(", ");
    error = new ErrorHandler(message, 400);
  }

  // Sequelize Unique Constraint Error
  if (err.name === "SequelizeUniqueConstraintError") {
    const message = "Duplicate field value entered";
    error = new ErrorHandler(message, 400);
  }

  // Sequelize Database Error
  if (err.name === "SequelizeDatabaseError") {
    const message = `Database error: ${err.message}`;
    error = new ErrorHandler(message, 400);
  }

  // JWT Error
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please login again";
    error = new ErrorHandler(message, 401);
  }

  // JWT Expired Error
  if (err.name === "TokenExpiredError") {
    const message = "Token expired. Please login again";
    error = new ErrorHandler(message, 401);
  }

  // MongoDB CastError
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    error = new ErrorHandler(message, 404);
  }

  // Send error response
  res.status(error.statusCode || err.statusCode).json({
    success: false,
    message: error.message || err.message,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
