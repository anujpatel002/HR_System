const Joi = require('joi');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');
const { generateEmployeeId } = require('../utils/employeeIdGenerator');
const { sendEmployeeCredentials } = require('../utils/emailService');
const { logActivity } = require('../utils/activityLogger');

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
  email: Joi.string().email().optional(),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
  basicSalary: Joi.number().positive().optional(),
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER').optional(),
  bankName: Joi.string().optional(),
  accountNumber: Joi.string().optional(),
  ifscCode: Joi.string().optional(),
  panNo: Joi.string().optional(),
  uanNo: Joi.string().optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional()
});

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.user.count()
    ]);

    success(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Users retrieved successfully');
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
        mobile: true,
        address: true,
        maritalStatus: true,
        nationality: true,
        company: true,
        manager: true,
        location: true,
        empCode: true,
        createdAt: true
      }
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    // Map mobile to phone for frontend compatibility
    const responseUser = {
      ...user,
      phone: user.mobile
    };

    success(res, responseUser, 'User retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Update request for user:', id);
    console.log('Request body:', req.body);
    console.log('Current user:', req.user.id);
    
    // Users can update their own profile
    if (req.user.id !== id && req.user.role !== 'ADMIN' && req.user.role !== 'HR_OFFICER') {
      return error(res, 'You can only update your own profile', 403);
    }

    // Check if user exists first
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return error(res, 'User not found', 404);
    }

    // Update all profile fields
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.department !== undefined) updateData.department = req.body.department;
    if (req.body.designation !== undefined) updateData.designation = req.body.designation;
    if (req.body.phone !== undefined) updateData.mobile = req.body.phone;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.maritalStatus !== undefined) updateData.maritalStatus = req.body.maritalStatus;
    if (req.body.nationality !== undefined) updateData.nationality = req.body.nationality;
    if (req.body.company !== undefined) updateData.company = req.body.company;
    if (req.body.manager !== undefined) updateData.manager = req.body.manager;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.empCode !== undefined) updateData.empCode = req.body.empCode;
    
    console.log('Update data:', updateData);

    // Perform actual database update
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        role: true,
        department: true,
        designation: true,
        basicSalary: true,
        mobile: true,
        address: true,
        maritalStatus: true,
        nationality: true,
        company: true,
        manager: true,
        location: true,
        empCode: true,
        createdAt: true
      }
    });
    
    console.log('Updated user:', updatedUser);
    
    // Map mobile to phone for frontend compatibility
    const responseUser = {
      ...updatedUser,
      phone: updatedUser.mobile
    };
    
    success(res, responseUser, 'Profile updated successfully');
  } catch (err) {
    console.error('Update user error details:', {
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack
    });
    error(res, `Failed to update profile: ${err.message}`, 500);
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
    
    // Log activity
    await logActivity(req.user.id, 'DELETE', 'USER', id, { name: user.name, email: user.email });
    
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

    // Log activity
    await logActivity(req.user.id, 'CREATE', 'USER', newUser.id, { name: newUser.name, email: newUser.email });

    success(res, newUser, 'User created successfully and credentials sent via email');
  } catch (err) {
    console.error('Create user error:', err);
    error(res, 'Failed to create user', 500);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };