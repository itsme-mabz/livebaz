// Admin middleware - verify user has admin privileges
const adminMiddleware = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is admin (handle both boolean and integer values)
    const isAdmin = req.user.is_admin === true || req.user.is_admin === 1;

    if (!isAdmin) {
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