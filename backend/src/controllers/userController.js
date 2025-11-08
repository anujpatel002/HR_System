const Joi = require('joi');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');
const { generateEmployeeId } = require('../utils/employeeIdGenerator');
const { sendEmployeeCredentials } = require('../utils/emailService');

const createUserSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  department: Joi.string().required(),
  designation: Joi.string().required(),
  basicSalary: Joi.number().positive().required(),
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER').default('EMPLOYEE')
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
  basicSalary: Joi.number().positive().optional(),
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER').optional()
});

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        basicSalary: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    success(res, users, 'Users retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        basicSalary: true,
        createdAt: true
      }
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    success(res, user, 'User retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = updateUserSchema.validate(req.body);
    
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return error(res, 'User not found', 404);
    }

    // Only admin can update role and salary
    if ((value.role || value.basicSalary) && req.user.role !== 'ADMIN') {
      return error(res, 'Only admin can update role and salary', 403);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: value,
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        basicSalary: true
      }
    });

    success(res, updatedUser, 'User updated successfully');
  } catch (err) {
    error(res, 'Failed to update user', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return error(res, 'User not found', 404);
    }

    await prisma.user.delete({ where: { id } });
    success(res, null, 'User deleted successfully');
  } catch (err) {
    error(res, 'Failed to delete user', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { error: validationError, value } = createUserSchema.validate(req.body);
    
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: value.email } });
    if (existingUser) {
      return error(res, 'Email already exists', 400);
    }

    // Generate employee ID
    const employeeId = await generateEmployeeId(value.name);
    
    // Generate default password (first name + last 4 digits of employee ID)
    const nameParts = value.name.trim().split(' ');
    const firstName = nameParts[0].toLowerCase();
    const defaultPassword = `${firstName}${employeeId.slice(-4)}`;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        ...value,
        employeeId,
        password: hashedPassword
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        basicSalary: true,
        createdAt: true
      }
    });

    // Send credentials via email
    await sendEmployeeCredentials(value.email, value.name, employeeId, defaultPassword);

    success(res, newUser, 'User created successfully and credentials sent via email');
  } catch (err) {
    console.error('Create user error:', err);
    error(res, 'Failed to create user', 500);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };