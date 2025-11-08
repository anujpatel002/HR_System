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

const applyLeave = async (req, res) => {
  try {
    const { error: validationError, value } = applyLeaveSchema.validate(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const userId = req.user.id;

    // Check for overlapping leaves
    const overlappingLeave = await prisma.leave.findFirst({
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

    const leave = await prisma.leave.create({
      data: {
        ...value,
        userId
      },
      include: {
        user: {
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
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check access permissions
    if (userId !== req.user.id && !['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(req.user.role)) {
      return error(res, 'Access denied', 403);
    }

    let whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.leave.count({ where: whereClause })
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
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: { name: true, email: true, department: true }
          }
        }
      }),
      prisma.leave.count({ where: whereClause })
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

    const leave = await prisma.leave.findUnique({ where: { id } });
    if (!leave) {
      return error(res, 'Leave not found', 404);
    }

    if (leave.status !== 'PENDING') {
      return error(res, 'Leave already processed', 400);
    }

    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // Log activity
    await logActivity(req.user.id, 'UPDATE', 'LEAVE', id, { status, leaveType: leave.type, applicant: updatedLeave.user.name });

    success(res, updatedLeave, `Leave ${status.toLowerCase()} successfully`);
  } catch (err) {
    error(res, 'Failed to update leave status', 500);
  }
};

module.exports = { applyLeave, getLeaves, getAllLeaves, updateLeaveStatus };