const Joi = require('joi');
const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');
const { logActivity } = require('../utils/activityLogger');

const markAttendanceSchema = Joi.object({
  type: Joi.string().valid('CHECK_IN', 'CHECK_OUT', 'checkin', 'checkout').required()
});

const markAttendance = async (req, res) => {
  try {
    const { error: validationError, value } = markAttendanceSchema.validate(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const { userId: targetUserId } = req.body;
    const userId = targetUserId || req.user.id;

    // Access control: Admin can mark for all, HR can mark for employees only
    if (targetUserId && targetUserId !== req.user.id) {
      if (req.user.role === 'HR_OFFICER') {
        const targetUser = await prisma.users.findUnique({ where: { id: targetUserId }, select: { role: true } });
        if (!targetUser || targetUser.role !== 'EMPLOYEE') {
          return error(res, 'HR can only mark attendance for employees', 403);
        }
      } else if (req.user.role !== 'ADMIN') {
        return error(res, 'Access denied', 403);
      }
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: todayStart,
          lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    const now = new Date();

    if (value.type === 'CHECK_IN' || value.type === 'checkin') {
      if (attendance && attendance.checkIn) {
        return error(res, 'Already checked in today', 400);
      }

      if (attendance) {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkIn: now,
            status: 'PRESENT'
          }
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            userId,
            date: todayStart,
            checkIn: now,
            status: 'PRESENT'
          }
        });
      }

      await logActivity(req.user.id, 'CREATE', 'ATTENDANCE', attendance.id, { type: 'CHECK_IN', time: now, forUser: userId });

      success(res, attendance, 'Checked in successfully');
    } else {
      if (!attendance || !attendance.checkIn) {
        return error(res, 'Must check in first', 400);
      }

      if (attendance.checkOut) {
        return error(res, 'Already checked out today', 400);
      }

      const totalHours = (now - attendance.checkIn) / (1000 * 60 * 60);

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: now,
          totalHours: Math.round(totalHours * 100) / 100
        }
      });

      await logActivity(req.user.id, 'UPDATE', 'ATTENDANCE', attendance.id, { type: 'CHECK_OUT', time: now, totalHours, forUser: userId });

      success(res, attendance, 'Checked out successfully');
    }
  } catch (err) {
    console.error('Attendance error:', err);
    error(res, 'Failed to mark attendance', 500);
  }
};

const getAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year, page = 1, limit = 31, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Access control: Admin can see all, HR can see employees only, users see their own
    if (userId !== req.user.id) {
      if (req.user.role === 'HR_OFFICER') {
        const targetUser = await prisma.users.findUnique({ where: { id: userId }, select: { role: true } });
        if (!targetUser || targetUser.role !== 'EMPLOYEE') {
          return error(res, 'HR can only view employee attendance', 403);
        }
      } else if (!['ADMIN', 'PAYROLL_OFFICER'].includes(req.user.role)) {
        return error(res, 'Access denied', 403);
      }
    }

    let whereClause = { userId };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      whereClause.date = { gte: start, lte: end };
    } else if (startDate && endDate) {
      whereClause.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    if (status) {
      whereClause.status = status;
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          users: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.attendance.count({ where: whereClause })
    ]);

    success(res, {
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Attendance retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get attendance', 500);
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const { userId: queryUserId } = req.query;
    const userId = queryUserId || req.user.id;

    // Access control: Admin can see all, HR can see employees only
    if (queryUserId && queryUserId !== req.user.id) {
      if (req.user.role === 'HR_OFFICER') {
        const targetUser = await prisma.users.findUnique({ where: { id: queryUserId }, select: { role: true } });
        if (!targetUser || targetUser.role !== 'EMPLOYEE') {
          return error(res, 'HR can only view employee attendance', 403);
        }
      } else if (!['ADMIN', 'PAYROLL_OFFICER'].includes(req.user.role)) {
        return error(res, 'Access denied', 403);
      }
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: todayStart,
          lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    success(res, attendance, 'Today\'s attendance retrieved successfully');
  } catch (err) {
    console.error('Get today attendance error:', err);
    error(res, 'Failed to get today\'s attendance', 500);
  }
};

const getAttendanceSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    // Access control: Admin can see all, HR can see employees only, users see their own
    if (userId !== req.user.id) {
      if (req.user.role === 'HR_OFFICER') {
        const targetUser = await prisma.users.findUnique({ where: { id: userId }, select: { role: true } });
        if (!targetUser || targetUser.role !== 'EMPLOYEE') {
          return error(res, 'HR can only view employee attendance', 403);
        }
      } else if (!['ADMIN', 'PAYROLL_OFFICER'].includes(req.user.role)) {
        return error(res, 'Access denied', 403);
      }
    }

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const summary = {
      totalDays: endDate.getDate(),
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
      totalHours: attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      month: targetMonth + 1,
      year: targetYear
    };

    success(res, summary, 'Attendance summary retrieved successfully');
  } catch (err) {
    console.error('Get attendance summary error:', err);
    error(res, 'Failed to get attendance summary', 500);
  }
};

const bulkMarkAttendance = async (req, res) => {
  try {
    const { userIds, type, date } = req.body;
    
    // Admin can mark for all, HR can mark for employees only
    if (req.user.role === 'HR_OFFICER') {
      const users = await prisma.users.findMany({ where: { id: { in: userIds } }, select: { role: true } });
      if (users.some(u => u.role !== 'EMPLOYEE')) {
        return error(res, 'HR can only mark attendance for employees', 403);
      }
    } else if (req.user.role !== 'ADMIN') {
      return error(res, 'Access denied', 403);
    }

    const targetDate = date ? new Date(date) : new Date();
    const dateStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const results = [];

    for (const userId of userIds) {
      let attendance = await prisma.attendance.findFirst({
        where: { userId, date: { gte: dateStart, lt: new Date(dateStart.getTime() + 24 * 60 * 60 * 1000) } }
      });

      if (type === 'checkin') {
        if (attendance) {
          attendance = await prisma.attendance.update({
            where: { id: attendance.id },
            data: { checkIn: new Date(), status: 'PRESENT' }
          });
        } else {
          attendance = await prisma.attendance.create({
            data: { userId, date: dateStart, checkIn: new Date(), status: 'PRESENT' }
          });
        }
      }
      results.push(attendance);
    }

    await logActivity(req.user.id, 'CREATE', 'ATTENDANCE', null, { type: 'bulk', count: userIds.length });
    success(res, results, `Bulk attendance marked for ${userIds.length} users`);
  } catch (err) {
    error(res, 'Failed to mark bulk attendance', 500);
  }
};

module.exports = { markAttendance, getAttendance, getTodayAttendance, getAttendanceSummary, bulkMarkAttendance };