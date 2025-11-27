class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;

    // Prevents prototype pollution attacks
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorHandler;
