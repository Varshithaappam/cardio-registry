const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token missing or unauthorized.' 
    });
  }

  const secret = process.env.JWT_SECRET || 'cardio_registry_secret_key_2026';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token.' 
      });
    }

    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
      role: decoded.role,
      username: decoded.username
    };

    next();
  });
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized access.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};