// middleware/admin.js
const adminMiddleware = (req, res, next) => {
  try {
    // Check if user is authenticated and has admin privileges
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // User is admin, proceed to next middleware/route
    next();

  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin verification'
    });
  }
};

module.exports = adminMiddleware;