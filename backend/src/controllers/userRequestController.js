const Joi = require('joi');
const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');
const { createUser, updateUser, deleteUser } = require('./userController');

const createRequestSchema = Joi.object({
  type: Joi.string().valid('CREATE_USER', 'UPDATE_USER', 'DELETE_USER').required(),
  targetUserId: Joi.string().optional(),
  data: Joi.object().required()
});

const createRequest = async (req, res) => {
  try {
    const { error: validationError, value } = createRequestSchema.validate(req.body);
    if (validationError) {
      return error(res, validationError.details[0].message, 400);
    }

    // HR can only manage EMPLOYEE users
    if (req.user.role === 'HR_OFFICER') {
      if (value.type === 'CREATE_USER' && value.data.role !== 'EMPLOYEE') {
        return error(res, 'HR can only create EMPLOYEE users', 403);
      }
      if (value.type === 'UPDATE_USER' || value.type === 'DELETE_USER') {
        const targetUser = await prisma.user.findUnique({ where: { id: value.targetUserId } });
        if (!targetUser || targetUser.role !== 'EMPLOYEE') {
          return error(res, 'HR can only manage EMPLOYEE users', 403);
        }
      }
    }

    const request = await prisma.userRequest.create({
      data: {
        requesterId: req.user.id,
        type: value.type,
        targetUserId: value.targetUserId,
        data: value.data
      }
    });

    success(res, request, 'Request submitted for admin approval', 201);
  } catch (err) {
    error(res, 'Failed to create request', 500);
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const requests = await prisma.userRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        requester: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    success(res, requests, 'Pending requests retrieved successfully');
  } catch (err) {
    error(res, 'Failed to get requests', 500);
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const request = await prisma.userRequest.findUnique({ where: { id } });
    if (!request) {
      return error(res, 'Request not found', 404);
    }

    // Execute the approved operation
    let result;
    const mockReq = { body: request.data, params: { id: request.targetUserId }, user: { role: 'ADMIN' } };
    const mockRes = { 
      status: () => mockRes, 
      json: (data) => { result = data; return mockRes; }
    };

    if (request.type === 'CREATE_USER') {
      await createUser(mockReq, mockRes);
    } else if (request.type === 'UPDATE_USER') {
      await updateUser(mockReq, mockRes);
    } else if (request.type === 'DELETE_USER') {
      await deleteUser(mockReq, mockRes);
    }

    await prisma.userRequest.update({
      where: { id },
      data: { status: 'APPROVED', adminNote }
    });

    success(res, null, 'Request approved and executed successfully');
  } catch (err) {
    error(res, 'Failed to approve request', 500);
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    await prisma.userRequest.update({
      where: { id },
      data: { status: 'REJECTED', adminNote }
    });

    success(res, null, 'Request rejected successfully');
  } catch (err) {
    error(res, 'Failed to reject request', 500);
  }
};

module.exports = { createRequest, getPendingRequests, approveRequest, rejectRequest };