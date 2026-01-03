const Joi = require('joi');
const bcrypt = require('bcrypt');
const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');
const { generateEmployeeId } = require('../utils/employeeIdGenerator');
const { sendEmployeeCredentials } = require('../utils/emailService');
const { logActivity } = require('../utils/activityLogger');
const { cacheManager } = require('../middleware/cacheMiddleware');

const createUserSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  department: Joi.string().required(),
  designation: Joi.string().required(),
  basicSalary: Joi.number().positive().required(),
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGER').default('EMPLOYEE'),
  manager: Joi.string().optional() // Made optional since it will be auto-assigned
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
  mobile: Joi.string().optional(),
  address: Joi.string().optional(),
  maritalStatus: Joi.string().optional(),
  nationality: Joi.string().optional(),
  company: Joi.string().optional(),
  manager: Joi.string().optional(),
  location: Joi.string().optional(),
  empCode: Joi.string().optional()
});

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, department } = req.query;
    const skip = (page - 1) * limit;
    const userRole = req.user.role;

    const selectFields = {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      department: true,
      designation: true,
      createdAt: true
    };

    if (userRole === 'ADMIN' || userRole === 'HR_OFFICER') {
      selectFields.role = true;
      selectFields.basicSalary = true;
      selectFields.bankName = true;
      selectFields.accountNumber = true;
      selectFields.ifscCode = true;
      selectFields.panNo = true;
      selectFields.uanNo = true;
    }

    let whereClause = {};
    
    // Role-based filtering
    if (userRole === 'EMPLOYEE') {
      whereClause = { id: req.user.id };
    } else if (userRole === 'MANAGER') {
      // Managers can only see employees under their management
      whereClause = { manager: req.user.id };
    }
    // ADMIN and HR_OFFICER can see all users (no additional filtering)
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) whereClause.role = role;
    if (department) whereClause.department = department;

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where: whereClause,
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.users.count({ where: whereClause })
    ]);

    const usersWithStatus = users.map(user => {
      const userData = { ...user };
      if (userRole === 'ADMIN' || userRole === 'HR_OFFICER') {
        userData.bankDetailsStatus = (user.bankName && user.accountNumber && user.ifscCode) ? 'Found' : 'Not Found';
      }
      return userData;
    });

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
    
    // SECURITY: Users can only view their own profile unless they're ADMIN/HR
    if (id !== req.user.id && !['ADMIN', 'HR_OFFICER'].includes(req.user.role)) {
      return error(res, 'Access denied', 403);
    }
    
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

    // Validate request body using Joi schema
    const { error: validationError, value } = updateUserSchema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (validationError) {
      return error(res, validationError.details.map(d => d.message).join(', '), 400);
    }

    // Check if user exists first
    const existingUser = await prisma.users.findUnique({ where: { id } });
    if (!existingUser) {
      return error(res, 'User not found', 404);
    }

    // Check email uniqueness if email is being updated
    if (value.email && value.email !== existingUser.email) {
      const emailExists = await prisma.users.findUnique({ where: { email: value.email } });
      if (emailExists) {
        return error(res, 'Email already exists', 400);
      }
    }

    // Update all profile fields from validated data
    const updateData = {};
    if (value.name !== undefined && value.name !== null) updateData.name = value.name;
    if (value.department !== undefined && value.department !== null) updateData.department = value.department;
    if (value.designation !== undefined && value.designation !== null) updateData.designation = value.designation;
    if (value.phone !== undefined && value.phone !== null) updateData.mobile = value.phone;
    if (value.mobile !== undefined && value.mobile !== null) updateData.mobile = value.mobile;
    if (value.address !== undefined && value.address !== null) updateData.address = value.address;
    if (value.bankName !== undefined && value.bankName !== null) updateData.bankName = value.bankName;
    if (value.accountNumber !== undefined && value.accountNumber !== null) updateData.accountNumber = value.accountNumber;
    if (value.ifscCode !== undefined && value.ifscCode !== null) updateData.ifscCode = value.ifscCode;
    if (value.panNo !== undefined && value.panNo !== null) updateData.panNo = value.panNo;
    if (value.uanNo !== undefined && value.uanNo !== null) updateData.uanNo = value.uanNo;
    if (value.maritalStatus !== undefined && value.maritalStatus !== null) updateData.maritalStatus = value.maritalStatus;
    if (value.nationality !== undefined && value.nationality !== null) updateData.nationality = value.nationality;
    if (value.company !== undefined && value.company !== null) updateData.company = value.company;
    if (value.manager !== undefined && value.manager !== null) updateData.manager = value.manager;
    if (value.location !== undefined && value.location !== null) updateData.location = value.location;
    if (value.empCode !== undefined && value.empCode !== null) updateData.empCode = value.empCode;
    
    console.log('Update data:', updateData);

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return error(res, 'No valid fields to update', 400);
    }

    // Check manager constraint if designation is being updated to Manager
    if (value.designation === 'Manager' && (value.department || existingUser.department)) {
      const department = value.department || existingUser.department;
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
    
    // Clear cache after update
    cacheManager.invalidatePattern('/api/users');
    
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
    
    // Clear cache after delete
    cacheManager.invalidatePattern('/api/users');
    
    // Log activity
    await logActivity(req.user.id, 'DELETE', 'USER', id, { name: user.name, email: user.email });
    
    success(res, null, 'User deleted successfully');
  } catch (err) {
    error(res, 'Failed to delete user', 500);
  }
};

const createUser = async (req, res) => {
  try {
    console.log('Create user request:', req.body);
    
    const { error: validationError, value } = createUserSchema.validate(req.body);
    
    if (validationError) {
      console.error('Validation error:', validationError.details[0].message);
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

    // Auto-assign department manager if not provided
    let assignedManager = value.manager;
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
          console.log('Auto-assigned manager:', departmentManager.name);
        }
      } catch (managerError) {
        console.error('Manager assignment error:', managerError);
      }
    }

    // Validate manager assignment for employees
    if (value.role === 'EMPLOYEE' && assignedManager) {
      const managerExists = await prisma.users.findUnique({
        where: { id: assignedManager }
      });
      if (!managerExists) {
        return error(res, 'Invalid manager ID', 400);
      }
      if (!['MANAGER', 'HR_OFFICER', 'ADMIN'].includes(managerExists.role) && managerExists.designation !== 'Manager') {
        return error(res, 'Assigned manager must have appropriate role or Manager designation', 400);
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

    // Create user with auto-assigned manager
    const newUser = await prisma.users.create({
      data: {
        name: value.name,
        email: value.email,
        department: value.department,
        designation: value.designation,
        basicSalary: value.basicSalary,
        role: value.role,
        employeeId,
        password: hashedPassword,
        manager: assignedManager
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
        manager: true,
        createdAt: true
      }
    });

    // Send credentials via email (optional)
    try {
      await sendEmployeeCredentials(value.email, value.name, employeeId, defaultPassword);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue without email
    }

    // Clear cache after create
    try {
      cacheManager.invalidatePattern('/api/users');
    } catch (cacheError) {
      console.error('Cache clear error:', cacheError);
    }

    // Log activity
    try {
      await logActivity(req.user.id, 'CREATE', 'USER', newUser.id, { 
        name: newUser.name, 
        email: newUser.email,
        assignedManager: assignedManager ? 'Auto-assigned' : 'None'
      });
    } catch (logError) {
      console.error('Activity log error:', logError);
    }

    success(res, newUser, 'User created successfully');
  } catch (err) {
    console.error('Create user error:', err);
    error(res, `Failed to create user: ${err.message}`, 500);
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

const bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action } = req.body;
    
    if (!['ADMIN', 'HR_OFFICER'].includes(req.user.role)) {
      return error(res, 'Access denied', 403);
    }

    let updateData = {};
    if (action === 'activate') updateData.isActive = true;
    else if (action === 'deactivate') updateData.isActive = false;
    else return error(res, 'Invalid action', 400);

    await prisma.users.updateMany({
      where: { id: { in: userIds } },
      data: updateData
    });

    await logActivity(req.user.id, 'UPDATE', 'USER', null, { type: 'bulk', action, count: userIds.length });
    success(res, null, `${userIds.length} users ${action}d successfully`);
  } catch (err) {
    error(res, 'Failed to bulk update users', 500);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getDepartments, getManagers, bulkUpdateUsers };