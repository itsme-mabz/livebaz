const ErrorHandler = require("../utils/Errorhandler");

exports.isAuthanciated = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return next(new ErrorHandler("Plase login to access this resource", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  req.user = user;

  next();
};
