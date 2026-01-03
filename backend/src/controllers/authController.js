const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const prisma = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { success, error } = require('../utils/responseHandler');
const { logActivity } = require('../utils/activityLogger');
const { generateEmployeeId } = require('../utils/employeeIdGenerator');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGER').default('EMPLOYEE'),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
  basicSalary: Joi.number().positive().optional(),
  managerId: Joi.string().allow('', null).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const register = async (req, res) => {
  try {
    const { error: validationError, value } = registerSchema.validate(req.body);
    if (validationError) {
      console.error('Registration validation error:', validationError.details[0].message);
      return error(res, validationError.details[0].message, 400);
    }

    const existingUser = await prisma.users.findUnique({
      where: { email: value.email }
    });

    if (existingUser) {
      return error(res, 'User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(value.password, 12);
    
    // Generate unique employee ID
    const employeeId = await generateEmployeeId(value.name);
    
    // Auto-assign department manager if department is provided
    let assignedManager = value.managerId;
    if (value.department && !assignedManager && value.role === 'EMPLOYEE') {
      try {
        const departmentManager = await prisma.users.findFirst({
          where: {
            department: value.department,
            role: { in: ['MANAGER', 'HR_OFFICER', 'ADMIN'] }
          },
          orderBy: [
            { role: 'asc' }, // ADMIN first, then HR_OFFICER, then MANAGER
            { createdAt: 'asc' } // Oldest first if multiple
          ]
        });
        
        if (departmentManager) {
          assignedManager = departmentManager.id;
        }
      } catch (managerError) {
        console.error('Manager assignment error:', managerError);
        // Continue without manager assignment
      }
    }
    
    // Extract employee-specific fields
    const { managerId, ...userData } = value;
    
    const user = await prisma.users.create({
      data: {
        ...userData,
        password: hashedPassword,
        employeeId,
        manager: assignedManager
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        employeeId: true,
        manager: true
      }
    });

    // Create employee record with manager relationship (optional)
    if (assignedManager) {
      try {
        await prisma.employees.create({
          data: {
            userId: user.id,
            manager: assignedManager
          }
        });
      } catch (employeeError) {
        console.error('Employee record creation error:', employeeError);
        // Continue without employee record
      }
    }

    success(res, user, 'User registered successfully', 201);
  } catch (err) {
    console.error('Registration error:', err);
    error(res, `Registration failed: ${err.message}`, 500);
  }
};

const login = async (req, res) => {
  try {
    const { error: validationError, value } = loginSchema.validate(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const user = await prisma.users.findUnique({
      where: { email: value.email }
    });

    if (!user || !await bcrypt.compare(value.password, user.password)) {
      return error(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    success(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation
      }
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    error(res, 'Login failed', 500);
  }
};

const logout = async (req, res) => {
  // Log activity and terminate session if user is authenticated
  if (req.user) {
    await logActivity(req.user.id, 'LOGOUT', 'AUTH');
    
    // Terminate active sessions
    await prisma.user_sessions.updateMany({
      where: { 
        userId: req.user.id,
        isActive: true
      },
      data: { 
        isActive: false,
        logoutTime: new Date()
      }
    });
    
    // Clear screen share data and requests
    if (global.userScreenshots) {
      global.userScreenshots.delete(req.user.id);
    }
    if (global.screenShareRequests) {
      global.screenShareRequests.delete(req.user.id);
    }
  }
  
  res.clearCookie('token');
  success(res, null, 'Logout successful');
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        basicSalary: true,
        dateOfJoining: true,
        mobile: true,
        address: true,
        createdAt: true,
        manager: true
      }
    });

    let managerName = null;
    if (user.manager) {
      const manager = await prisma.users.findUnique({
        where: { id: user.manager },
        select: { name: true }
      });
      managerName = manager?.name;
    }

    const responseUser = {
      ...user,
      phone: user.mobile,
      managerName
    };

    success(res, responseUser, 'Profile retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get profile', 500);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return error(res, 'Email is required', 400);
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return success(res, null, 'If email exists, reset link will be sent');
    }

    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.password_resets.create({
      data: {
        id: `reset-${Date.now()}`,
        userId: user.id,
        token,
        expiresAt
      }
    });

    // TODO: Send email with reset link
    // For now, return token (remove in production)
    success(res, { token }, 'Password reset link sent to email');
  } catch (err) {
    console.error('Forgot password error:', err);
    error(res, 'Failed to process request', 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return error(res, 'Token and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return error(res, 'Password must be at least 6 characters', 400);
    }

    const resetRecord = await prisma.password_resets.findUnique({
      where: { token },
      include: { users: true }
    });

    if (!resetRecord || resetRecord.isUsed) {
      return error(res, 'Invalid or expired token', 400);
    }

    if (new Date() > resetRecord.expiresAt) {
      return error(res, 'Token has expired', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.users.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword }
    });

    await prisma.password_resets.update({
      where: { token },
      data: { isUsed: true, usedAt: new Date() }
    });

    success(res, null, 'Password reset successfully');
  } catch (err) {
    console.error('Reset password error:', err);
    error(res, 'Failed to reset password', 500);
  }
};

module.exports = { register, login, logout, getProfile, forgotPassword, resetPassword };