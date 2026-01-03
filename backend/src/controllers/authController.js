const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const prisma = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { success, error } = require('../utils/responseHandler');
const { logActivity } = require('../utils/activityLogger');
const { generateEmployeeId } = require('../utils/employeeIdGenerator');
const { generateOTP, sendOTP, storeOTP, verifyOTP } = require('../utils/otpService');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGER').default('EMPLOYEE'),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
  basicSalary: Joi.number().positive().optional(),
  managerId: Joi.string().allow('', null).optional(),
  company: Joi.string().optional()
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
    const employeeId = await generateEmployeeId(value.name);
    
    // Create company if provided (for new admin signup)
    let companyId = null;
    if (value.company) {
      const companyRecord = await prisma.$queryRaw`
        INSERT INTO companies (id, name, createdAt, updatedAt) 
        VALUES (UUID(), ${value.company}, NOW(), NOW())
        ON DUPLICATE KEY UPDATE id=id
      `;
      const [company] = await prisma.$queryRaw`SELECT id FROM companies WHERE name = ${value.company}`;
      companyId = company?.id;
    }
    
    const { managerId, company, ...userData } = value;
    
    // Determine if this is a public signup (has company field) or admin creation
    const isPublicSignup = !!value.company;
    
    // ADMIN accounts should never have a manager
    // Public signup should never have a manager (always creates ADMIN)
    // Admin dashboard can assign managers to EMPLOYEE/MANAGER roles
    let finalManagerId = null;
    if (value.role !== 'ADMIN' && !isPublicSignup && managerId) {
      finalManagerId = managerId;
    }
    
    // Prepare user data - only include company fields if provided
    const createData = {
      ...userData,
      password: hashedPassword,
      employeeId,
      manager: finalManagerId
    };
    
    // Add company fields only if company is provided
    if (value.company) {
      createData.company = value.company;
      // companyId field is disabled due to schema constraints
      // createData.companyId = companyId;
    }
    
    const user = await prisma.users.create({
      data: createData,
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

    // Create employee record with manager relationship (only for non-ADMIN roles)
    if (finalManagerId && value.role !== 'ADMIN') {
      try {
        await prisma.employees.create({
          data: {
            userId: user.id,
            manager: finalManagerId
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
        designation: user.designation,
        company: user.company
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

const sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email is required', 400);
    
    const otp = generateOTP();
    storeOTP(email, otp);
    
    const sent = await sendOTP(email, otp);
    if (!sent) return error(res, 'Failed to send OTP. Check SMTP configuration.', 500);
    
    success(res, null, 'OTP sent to email');
  } catch (err) {
    error(res, 'Failed to send OTP', 500);
  }
};

const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return error(res, 'Email and OTP required', 400);
    
    const isValid = verifyOTP(email, otp);
    if (!isValid) return error(res, 'Invalid or expired OTP', 400);
    
    success(res, { verified: true }, 'Email verified successfully');
  } catch (err) {
    error(res, 'Failed to verify OTP', 500);
  }
};

module.exports = { register, login, logout, getProfile, forgotPassword, resetPassword, sendVerificationOTP, verifyEmailOTP };