const prisma = require('../config/db');

const logActivity = async (userId, action, targetType, targetId = null, details = null) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        details
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = { logActivity };