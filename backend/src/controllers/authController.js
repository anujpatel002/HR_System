const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const prisma = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { success, error } = require('../utils/responseHandler');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER').default('EMPLOYEE'),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
  basicSalary: Joi.number().positive().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const register = async (req, res) => {
  try {
    const { error: validationError, value } = registerSchema.validate(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: value.email }
    });

    if (existingUser) {
      return error(res, 'User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(value.password, 12);
    
    const user = await prisma.user.create({
      data: {
        ...value,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true
      }
    });

    success(res, user, 'User registered successfully', 201);
  } catch (err) {
    error(res, 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { error: validationError, value } = loginSchema.validate(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    const user = await prisma.user.findUnique({
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
      },
      token
    }, 'Login successful');
  } catch (err) {
    error(res, 'Login failed', 500);
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  success(res, null, 'Logout successful');
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        basicSalary: true
      }
    });

    success(res, user, 'Profile retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get profile', 500);
  }
};

module.exports = { register, login, logout, getProfile };