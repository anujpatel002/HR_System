const Joi = require('joi');
const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');
const { logActivity } = require('../utils/activityLogger');

const applyLeaveSchema = Joi.object({
  type: Joi.string().valid('SICK', 'CASUAL', 'ANNUAL', 'MATERNITY', 'PATERNITY').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  reason: Joi.string().min(10).required()
});

const getLeaveBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId !== req.user.id && !['ADMIN', 'HR_OFFICER'].includes(req.user.role)) {
      return error(res, 'Access denied', 403);
    }

    const currentYear = new Date().getFullYear();
    
    // Default leave balances (since we don't have leave_types table)
    const defaultBalances = {
      SICK: 12,
      CASUAL: 12,
      ANNUAL: 21,
      MATERNITY: 90,
      PATERNITY: 15
    };

    // Get used leaves for current year
    const usedLeaves = await prisma.leaves.groupBy({
      by: ['type'],
      where: {
        userId,
        status: { in: ['APPROVED', 'PENDING'] },
        startDate: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31)
        }
      },
      _count: { id: true }
    });

    const balance = Object.entries(defaultBalances).map(([type, total]) => {
      const used = usedLeaves.find(ul => ul.type === type)?._count?.id || 0;
      return {
        type: type.toLowerCase(),
        code: type,
        total,
        used,
        available: total - used
      };
    });

    success(res, { balance }, 'Leave balance retrieved successfully');
  } catch (err) {
    console.error('Get leave balance error:', err);
    error(res, 'Failed to get leave balance', 500);
  }
};

const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    
    const leave = await prisma.leaves.findUnique({ where: { id } });
    if (!leave) {
      return error(res, 'Leave not found', 404);
    }

    if (leave.userId !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    if (leave.status !== 'PENDING') {
      return error(res, 'Only pending leaves can be cancelled', 400);
    }

    const cancelledLeave = await prisma.leaves.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    await logActivity(req.user.id, 'UPDATE', 'LEAVE', id, { action: 'cancelled' });

    success(res, cancelledLeave, 'Leave cancelled successfully');
  } catch (err) {
    error(res, 'Failed to cancel leave', 500);
  }
};

const applyLeave = async (req, res) => {
  try {
    const { error: validationError, value } = applyLeaveSchema.validate(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const userId = req.user.id;
    
    // Validate dates are not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (new Date(value.startDate) < today) {
      return error(res, 'Start date cannot be in the past', 400);
    }

    // Check for overlapping leaves
    const overlappingLeave = await prisma.leaves.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: value.endDate },
            endDate: { gte: value.startDate }
          }
        ]
      }
    });

    if (overlappingLeave) {
      return error(res, 'Leave dates overlap with existing leave', 400);
    }

    const leave = await prisma.leaves.create({
      data: {
        ...value,
        userId
      },
      include: {
        users: {
          select: { name: true, email: true }
        }
      }
    });

    // Log activity
    await logActivity(userId, 'CREATE', 'LEAVE', leave.id, { type: value.type, startDate: value.startDate, endDate: value.endDate });

    success(res, leave, 'Leave application submitted successfully', 201);
  } catch (err) {
    error(res, 'Failed to apply for leave', 500);
  }
};

const getLeaves = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    if (userId !== req.user.id && !['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(req.user.role)) {
      return error(res, 'Access denied', 403);
    }

    let whereClause = { userId };
    if (status) whereClause.status = status;
    if (startDate && endDate) {
      whereClause.startDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [leaves, total] = await Promise.all([
      prisma.leaves.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          users: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.leaves.count({ where: whereClause })
    ]);

    success(res, {
      leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Leaves retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get leaves', 500);
  }
};

const getAllLeaves = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    let whereClause = {};
    if (status) whereClause.status = status;
    if (startDate && endDate) {
      whereClause.startDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [leaves, total] = await Promise.all([
      prisma.leaves.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          users: {
            select: { name: true, email: true, department: true }
          }
        }
      }),
      prisma.leaves.count({ where: whereClause })
    ]);

    success(res, {
      leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'All leaves retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get leaves', 500);
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return error(res, 'Invalid status', 400);
    }

    const leave = await prisma.leaves.findUnique({ 
      where: { id },
      include: { users: true }
    });
    
    if (!leave) {
      return error(res, 'Leave not found', 404);
    }

    if (leave.status !== 'PENDING') {
      return error(res, 'Leave already processed', 400);
    }

    // MANAGER can only approve their team's leaves
    if (req.user.role === 'MANAGER') {
      if (leave.users.manager !== req.user.id) {
        return error(res, 'You can only approve leaves for your team members', 403);
      }
    }

    const updatedLeave = await prisma.leaves.update({
      where: { id },
      data: { status },
      include: {
        users: {
          select: { name: true, email: true }
        }
      }
    });

    // CRITICAL: Mark attendance as ABSENT for approved leaves
    if (status === 'APPROVED') {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        
        try {
          await prisma.attendance.upsert({
            where: {
              userId_date: {
                userId: leave.userId,
                date: dateStart
              }
            },
            update: { status: 'ABSENT' },
            create: {
              userId: leave.userId,
              date: dateStart,
              status: 'ABSENT'
            }
          });
        } catch (attendanceError) {
          console.error('Attendance update error:', attendanceError);
        }
      }
    }

    // Log activity
    await logActivity(req.user.id, 'UPDATE', 'LEAVE', id, { status, leaveType: leave.type, applicant: updatedLeave.users.name });

    success(res, updatedLeave, `Leave ${status.toLowerCase()} successfully`);
  } catch (err) {
    console.error('Update leave status error:', err);
    error(res, 'Failed to update leave status', 500);
  }
};

module.exports = { applyLeave, getLeaves, getAllLeaves, updateLeaveStatus, getLeaveBalance, cancelLeave };