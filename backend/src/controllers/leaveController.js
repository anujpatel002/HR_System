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
    
    // Get leave types
    const leaveTypes = await prisma.leave_types.findMany({
      where: { isActive: true }
    });

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

    const balance = leaveTypes.map(lt => {
      const used = usedLeaves.find(ul => ul.type === lt.code)?._count?.id || 0;
      return {
        type: lt.name,
        code: lt.code,
        total: lt.defaultBalance,
        used,
        available: lt.defaultBalance - used
      };
    });

    success(res, balance, 'Leave balance retrieved successfully');
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

    const leave = await prisma.leaves.findUnique({ where: { id } });
    if (!leave) {
      return error(res, 'Leave not found', 404);
    }

    if (leave.status !== 'PENDING') {
      return error(res, 'Leave already processed', 400);
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

    // Log activity
    await logActivity(req.user.id, 'UPDATE', 'LEAVE', id, { status, leaveType: leave.type, applicant: updatedLeave.users.name });

    success(res, updatedLeave, `Leave ${status.toLowerCase()} successfully`);
  } catch (err) {
    error(res, 'Failed to update leave status', 500);
  }
};

module.exports = { applyLeave, getLeaves, getAllLeaves, updateLeaveStatus, getLeaveBalance, cancelLeave };