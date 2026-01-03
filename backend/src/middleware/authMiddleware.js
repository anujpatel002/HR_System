const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const prisma = require('../config/db');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        company: true,
        companyId: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // Check if user session was terminated by admin
    if (global.blacklistedUsers && global.blacklistedUsers.has(user.id)) {
      global.blacklistedUsers.delete(user.id); // Remove from blacklist after logout
      return res.status(401).json({ error: 'Session terminated by administrator.' });
    }

    // Update last activity for active sessions
    try {
      await prisma.user_sessions.updateMany({
        where: { 
          userId: user.id,
          isActive: true
        },
        data: { lastActivity: new Date() }
      });
    } catch (err) {
      // Ignore session update errors
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Export as named and default for compatibility
module.exports = verifyToken;
module.exports.verifyToken = verifyToken;