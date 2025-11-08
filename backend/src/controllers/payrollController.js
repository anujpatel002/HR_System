const Joi = require('joi');
const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');
const { calculatePayroll, getWorkingDaysInMonth } = require('../utils/payrollUtils');
const { logActivity } = require('../utils/activityLogger');

const generatePayrollSchema = Joi.object({
  month: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
  year: Joi.number().integer().min(2020).max(2030).required(),
  userIds: Joi.array().items(Joi.string()).optional()
});

const generatePayroll = async (req, res) => {
  try {
    const { error: validationError, value } = generatePayrollSchema.validate(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const { month, year, userIds } = value;

    // Get users to process payroll for
    let whereClause = { basicSalary: { not: null } };
    if (userIds && userIds.length > 0) {
      whereClause.id = { in: userIds };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        basicSalary: true
      }
    });

    if (users.length === 0) {
      return error(res, 'No users found with basic salary set', 400);
    }

    const payrollResults = [];

    for (const user of users) {
      // Check if payroll already exists
      const existingPayroll = await prisma.payroll.findUnique({
        where: {
          userId_month_year: {
            userId: user.id,
            month,
            year
          }
        }
      });

      if (existingPayroll) {
        continue; // Skip if already processed
      }

      // Calculate unpaid leave days
      const startDate = new Date(year, parseInt(month) - 1, 1);
      const endDate = new Date(year, parseInt(month), 0);

      const approvedLeaves = await prisma.leave.findMany({
        where: {
          userId: user.id,
          status: 'APPROVED',
          startDate: { lte: endDate },
          endDate: { gte: startDate }
        }
      });

      let unpaidLeaveDays = 0;
      approvedLeaves.forEach(leave => {
        const leaveStart = new Date(Math.max(leave.startDate, startDate));
        const leaveEnd = new Date(Math.min(leave.endDate, endDate));
        const days = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
        unpaidLeaveDays += days;
      });

      // Calculate payroll
      const payrollData = calculatePayroll(user.basicSalary, unpaidLeaveDays);

      // Create payroll record
      const payroll = await prisma.payroll.create({
        data: {
          userId: user.id,
          month,
          year,
          basicSalary: user.basicSalary,
          ...payrollData
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      payrollResults.push(payroll);
    }

    // Log activity
    await logActivity(req.user.id, 'CREATE', 'PAYROLL', null, { month, year, employeeCount: payrollResults.length });

    success(res, payrollResults, `Payroll generated for ${payrollResults.length} employees`, 201);
  } catch (err) {
    error(res, 'Failed to generate payroll', 500);
  }
};

const getPayroll = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check access permissions
    if (userId !== req.user.id && !['ADMIN', 'PAYROLL_OFFICER'].includes(req.user.role)) {
      return error(res, 'Access denied', 403);
    }

    let whereClause = { userId };
    if (month && year) {
      whereClause.month = month;
      whereClause.year = parseInt(year);
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where: whereClause,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: { name: true, email: true, department: true }
          }
        }
      }),
      prisma.payroll.count({ where: whereClause })
    ]);

    success(res, {
      payrolls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Payroll retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get payroll', 500);
  }
};

const getAllPayrolls = async (req, res) => {
  try {
    const { month, year, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let whereClause = {};
    if (month && year) {
      whereClause.month = month;
      whereClause.year = parseInt(year);
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where: whereClause,
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: { name: true, email: true, department: true }
          }
        }
      }),
      prisma.payroll.count({ where: whereClause })
    ]);

    success(res, {
      payrolls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'All payrolls retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get payrolls', 500);
  }
};

const getPayrollStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const currentYear = currentDate.getFullYear();

    // Get all payroll stats
    const payrollStats = await prisma.payroll.aggregate({
      _sum: {
        gross: true,
        netPay: true,
        pf: true,
        tax: true,
        deductions: true
      },
      _count: true
    });

    // Get total employees
    const totalEmployees = await prisma.user.count({
      where: { role: 'EMPLOYEE' }
    });

    success(res, {
      totalEmployees,
      processedPayrolls: payrollStats._count,
      totalGross: payrollStats._sum.gross || 0,
      totalNet: payrollStats._sum.netPay || 0,
      totalDeductions: payrollStats._sum.deductions || 0
    }, 'Payroll stats retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get payroll stats', 500);
  }
};

module.exports = { generatePayroll, getPayroll, getAllPayrolls, getPayrollStats };