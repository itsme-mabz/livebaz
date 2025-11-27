const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  // Convert COOKIE_EXPIRE to number
  const cookieExpireDays = Number(process.env.COOKIE_EXPIRE) || 7; // default 7 days

  // Cookie options
  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // optional: only https in production
    sameSite: "Strict", // optional for security
  };

  // Send token in cookie and JSON response
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
};

module.exports = sendToken;
