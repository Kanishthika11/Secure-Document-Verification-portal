const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[AUTH] No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('[AUTH] Token invalid or expired:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`[AUTH] Unauthorized access attempt. User role: ${req.user.role}`);
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
