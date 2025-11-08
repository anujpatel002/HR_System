const Joi = require('joi');
const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');
const { logActivity } = require('../utils/activityLogger');

const markAttendanceSchema = Joi.object({
  type: Joi.string().valid('checkin', 'checkout').required()
});

const markAttendance = async (req, res) => {
  try {
    const { error: validationError, value } = markAttendanceSchema.validate(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const userId = req.user.id;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStart
        }
      }
    });

    const now = new Date();

    if (value.type === 'checkin') {
      if (attendance && attendance.checkIn) {
        return error(res, 'Already checked in today', 400);
      }

      attendance = await prisma.attendance.upsert({
        where: {
          userId_date: {
            userId,
            date: todayStart
          }
        },
        update: {
          checkIn: now,
          status: 'PRESENT'
        },
        create: {
          userId,
          date: todayStart,
          checkIn: now,
          status: 'PRESENT'
        }
      });

      // Log activity
      await logActivity(userId, 'CREATE', 'ATTENDANCE', attendance.id, { type: 'checkin', time: now });

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

      // Log activity
      await logActivity(userId, 'UPDATE', 'ATTENDANCE', attendance.id, { type: 'checkout', time: now, totalHours });

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
    const { month, year, page = 1, limit = 31 } = req.query;
    const skip = (page - 1) * limit;

    if (userId !== req.user.id && !['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(req.user.role)) {
      return error(res, 'Access denied', 403);
    }

    let whereClause = { userId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
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
    const userId = req.user.id;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStart
        }
      }
    });

    success(res, attendance, 'Today\'s attendance retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get today\'s attendance', 500);
  }
};

module.exports = { markAttendance, getAttendance, getTodayAttendance };