/**
 * Role-based access control middleware.
 * Accepts one or more roles and checks if the authenticated user has one of them.
 * Must be used AFTER the auth middleware.
 *
 * Usage: roleCheck('admin') or roleCheck('admin', 'teacher')
 */
const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = roleCheck;
