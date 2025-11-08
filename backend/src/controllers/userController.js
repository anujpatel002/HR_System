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
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGER').default('EMPLOYEE'),
  manager: Joi.string().when('role', {
    is: 'EMPLOYEE',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
  basicSalary: Joi.number().positive().optional(),
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGER').optional(),
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
      prisma.users.findMany({
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          role: true,
          department: true,
          designation: true,
          basicSalary: true,
          bankName: true,
          accountNumber: true,
          ifscCode: true,
          panNo: true,
          uanNo: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.users.count()
    ]);

    // Add bank details status to each user
    const usersWithStatus = users.map(user => ({
      ...user,
      bankDetailsStatus: (user.bankName && user.accountNumber && user.ifscCode) ? 'Found' : 'Not Found'
    }));

    success(res, {
      users: usersWithStatus,
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
    
    const user = await prisma.users.findUnique({
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
    const existingUser = await prisma.users.findUnique({ where: { id } });
    if (!existingUser) {
      return error(res, 'User not found', 404);
    }

    // Update all profile fields
    const updateData = {};
    if (req.body.name !== undefined && req.body.name !== null) updateData.name = req.body.name;
    if (req.body.department !== undefined && req.body.department !== null) updateData.department = req.body.department;
    if (req.body.designation !== undefined && req.body.designation !== null) updateData.designation = req.body.designation;
    if (req.body.phone !== undefined && req.body.phone !== null) updateData.mobile = req.body.phone;
    if (req.body.mobile !== undefined && req.body.mobile !== null) updateData.mobile = req.body.mobile;
    if (req.body.address !== undefined && req.body.address !== null) updateData.address = req.body.address;
    if (req.body.bankName !== undefined && req.body.bankName !== null) updateData.bankName = req.body.bankName;
    if (req.body.accountNumber !== undefined && req.body.accountNumber !== null) updateData.accountNumber = req.body.accountNumber;
    if (req.body.ifscCode !== undefined && req.body.ifscCode !== null) updateData.ifscCode = req.body.ifscCode;
    if (req.body.panNo !== undefined && req.body.panNo !== null) updateData.panNo = req.body.panNo;
    if (req.body.uanNo !== undefined && req.body.uanNo !== null) updateData.uanNo = req.body.uanNo;
    if (req.body.maritalStatus !== undefined && req.body.maritalStatus !== null) updateData.maritalStatus = req.body.maritalStatus;
    if (req.body.nationality !== undefined && req.body.nationality !== null) updateData.nationality = req.body.nationality;
    if (req.body.company !== undefined && req.body.company !== null) updateData.company = req.body.company;
    if (req.body.manager !== undefined && req.body.manager !== null) updateData.manager = req.body.manager;
    if (req.body.location !== undefined && req.body.location !== null) updateData.location = req.body.location;
    if (req.body.empCode !== undefined && req.body.empCode !== null) updateData.empCode = req.body.empCode;
    
    console.log('Update data:', updateData);

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return error(res, 'No valid fields to update', 400);
    }

    // Check manager constraint if designation is being updated to Manager
    if (req.body.designation === 'Manager' && (req.body.department || existingUser.department)) {
      const department = req.body.department || existingUser.department;
      const existingManager = await prisma.users.findFirst({
        where: {
          department: department,
          designation: 'Manager',
          id: { not: id }
        }
      });
      if (existingManager) {
        return error(res, `Department ${department} already has a manager`, 400);
      }
    }

    // Perform actual database update
    const updatedUser = await prisma.users.update({
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
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        panNo: true,
        uanNo: true,
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

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) {
      return error(res, 'User not found', 404);
    }

    await prisma.users.delete({ where: { id } });
    
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
    const existingUser = await prisma.users.findUnique({ where: { email: value.email } });
    if (existingUser) {
      return error(res, 'Email already exists', 400);
    }

    // Check manager constraint for department
    if (value.designation === 'Manager' && value.department) {
      const existingManager = await prisma.users.findFirst({
        where: {
          department: value.department,
          designation: 'Manager'
        }
      });
      if (existingManager) {
        return error(res, `Department ${value.department} already has a manager`, 400);
      }
    }

    // Validate manager assignment for employees
    if (value.role === 'EMPLOYEE' && value.manager) {
      const managerExists = await prisma.users.findUnique({
        where: { id: value.manager }
      });
      if (!managerExists) {
        return error(res, 'Invalid manager ID', 400);
      }
      if (managerExists.role !== 'MANAGER' && managerExists.designation !== 'Manager') {
        return error(res, 'Assigned manager must have MANAGER role or Manager designation', 400);
      }
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
    const newUser = await prisma.users.create({
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

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.users.findMany({
      select: { department: true },
      where: { department: { not: null } },
      distinct: ['department']
    });

    const departmentList = departments.map(d => d.department).filter(Boolean);
    success(res, departmentList, 'Departments retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get departments', 500);
  }
};

const getManagers = async (req, res) => {
  try {
    const managers = await prisma.users.findMany({
      where: {
        OR: [
          { role: 'MANAGER' },
          { designation: 'Manager' }
        ]
      },
      select: {
        id: true,
        name: true,
        department: true,
        designation: true
      }
    });

    success(res, managers, 'Managers retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get managers', 500);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getDepartments, getManagers };