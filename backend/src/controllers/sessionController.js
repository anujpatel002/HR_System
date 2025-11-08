const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');

const getActiveSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.user_sessions.findMany({
        where: { isActive: true },
        include: {
          users: {
            select: { name: true, email: true, role: true, department: true }
          }
        },
        orderBy: { loginTime: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.user_sessions.count({ where: { isActive: true } })
    ]);

    // Get attendance status for each user
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const sessionsWithAttendance = await Promise.all(
      sessions.map(async (session) => {
        const attendance = await prisma.attendance.findUnique({
          where: {
            userId_date: {
              userId: session.userId,
              date: todayStart
            }
          }
        });

        return {
          ...session,
          attendanceStatus: attendance ? 
            (attendance.checkOut ? 'CHECKED_OUT' : 'CHECKED_IN') : 'NOT_MARKED'
        };
      })
    );

    success(res, {
      sessions: sessionsWithAttendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Active sessions retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get sessions', 500);
  }
};

const terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.user_sessions.findUnique({
      where: { id: sessionId },
      include: { users: true }
    });

    if (!session) {
      return error(res, 'Session not found', 404);
    }

    await prisma.user_sessions.update({
      where: { id: sessionId },
      data: { 
        isActive: false,
        logoutTime: new Date()
      }
    });

    // Add user to blacklist to invalidate their JWT
    global.blacklistedUsers = global.blacklistedUsers || new Set();
    global.blacklistedUsers.add(session.userId);

    success(res, null, 'Session terminated successfully');
  } catch (err) {
    error(res, 'Failed to terminate session', 500);
  }
};

const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const activities = await prisma.activity_logs.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        users: {
          select: { name: true, email: true }
        }
      }
    });

    success(res, activities, 'User activities retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get user activities', 500);
  }
};

module.exports = { getActiveSessions, terminateSession, getUserActivity };