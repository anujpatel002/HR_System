const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');

const getActiveSessions = async (req, res) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { name: true, email: true, role: true, department: true }
        }
      },
      orderBy: { loginTime: 'desc' }
    });

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

    success(res, sessionsWithAttendance, 'Active sessions retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get sessions', 500);
  }
};

const terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session) {
      return error(res, 'Session not found', 404);
    }

    await prisma.userSession.update({
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

    const activities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        user: {
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