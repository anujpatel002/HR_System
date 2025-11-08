const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');

const getActivities = async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = type ? { action: type } : {};

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.activityLog.count({ where });

    success(res, { activities, total, page: parseInt(page), limit: parseInt(limit) }, 'Activities retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get activities', 500);
  }
};

module.exports = { getActivities };