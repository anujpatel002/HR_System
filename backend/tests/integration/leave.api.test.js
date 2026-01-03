const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { prisma, cleanupTestData, createTestUser } = require('./setup');

describe('Leave Management API Integration Tests', () => {
  let employee, hrOfficer, employeeToken, hrToken;

  beforeAll(async () => {
    await cleanupTestData();
    
    employee = await createTestUser({
      email: 'leave-employee@test.com',
      role: 'EMPLOYEE'
    });
    
    hrOfficer = await createTestUser({
      email: 'leave-hr@test.com',
      role: 'HR_OFFICER'
    });

    employeeToken = jwt.sign({ userId: employee.id }, process.env.JWT_SECRET);
    hrToken = jwt.sign({ userId: hrOfficer.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('POST /api/leave/apply', () => {
    test('should allow employee to apply for leave', async () => {
      const leaveData = {
        type: 'CASUAL',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Personal work'
      };

      const response = await request(app)
        .post('/api/leave/apply')
        .set('Cookie', `token=${employeeToken}`)
        .send(leaveData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('CASUAL');
      expect(response.body.data.status).toBe('PENDING');
    });

    test('should validate leave dates', async () => {
      const invalidLeave = {
        type: 'SICK',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Past date
        endDate: new Date().toISOString(),
        reason: 'Sick leave'
      };

      const response = await request(app)
        .post('/api/leave/apply')
        .set('Cookie', `token=${employeeToken}`)
        .send(invalidLeave);

      expect(response.status).toBe(400);
    });

    test('should validate required fields', async () => {
      const incompleteLeave = {
        type: 'ANNUAL'
        // Missing dates and reason
      };

      const response = await request(app)
        .post('/api/leave/apply')
        .set('Cookie', `token=${employeeToken}`)
        .send(incompleteLeave);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/leave/:userId', () => {
    test('should get user leave history', async () => {
      // Apply for leave first
      await request(app)
        .post('/api/leave/apply')
        .set('Cookie', `token=${employeeToken}`)
        .send({
          type: 'ANNUAL',
          startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Vacation'
        });

      const response = await request(app)
        .get(`/api/leave/${employee.id}`)
        .set('Cookie', `token=${employeeToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.leaves)).toBe(true);
      expect(response.body.data.leaves.length).toBeGreaterThan(0);
    });

    test('should filter leaves by status', async () => {
      const response = await request(app)
        .get(`/api/leave/${employee.id}`)
        .set('Cookie', `token=${employeeToken}`)
        .query({ status: 'PENDING' });

      expect(response.status).toBe(200);
      expect(response.body.data.leaves.every(leave => leave.status === 'PENDING')).toBe(true);
    });
  });

  describe('GET /api/leave/all', () => {
    test('should allow HR to view all leaves', async () => {
      const response = await request(app)
        .get('/api/leave/all')
        .set('Cookie', `token=${hrToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.leaves).toBeDefined();
    });

    test('should deny employee access to all leaves', async () => {
      const response = await request(app)
        .get('/api/leave/all')
        .set('Cookie', `token=${employeeToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/leave/approve/:id', () => {
    test('should allow HR to approve leave', async () => {
      // Create a leave application
      const leaveResponse = await request(app)
        .post('/api/leave/apply')
        .set('Cookie', `token=${employeeToken}`)
        .send({
          type: 'SICK',
          startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Medical appointment'
        });

      const leaveId = leaveResponse.body.data.id;

      const approvalResponse = await request(app)
        .put(`/api/leave/approve/${leaveId}`)
        .set('Cookie', `token=${hrToken}`)
        .send({ status: 'APPROVED' });

      expect(approvalResponse.status).toBe(200);
      expect(approvalResponse.body.data.status).toBe('APPROVED');
    });

    test('should allow HR to reject leave', async () => {
      // Create a leave application
      const leaveResponse = await request(app)
        .post('/api/leave/apply')
        .set('Cookie', `token=${employeeToken}`)
        .send({
          type: 'CASUAL',
          startDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Personal work'
        });

      const leaveId = leaveResponse.body.data.id;

      const rejectionResponse = await request(app)
        .put(`/api/leave/approve/${leaveId}`)
        .set('Cookie', `token=${hrToken}`)
        .send({ status: 'REJECTED' });

      expect(rejectionResponse.status).toBe(200);
      expect(rejectionResponse.body.data.status).toBe('REJECTED');
    });

    test('should prevent employee from approving leaves', async () => {
      const response = await request(app)
        .put('/api/leave/approve/some-leave-id')
        .set('Cookie', `token=${employeeToken}`)
        .send({ status: 'APPROVED' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/leave/balance/:userId', () => {
    test('should get leave balance for user', async () => {
      const response = await request(app)
        .get(`/api/leave/balance/${employee.id}`)
        .set('Cookie', `token=${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.balance).toBeDefined();
      expect(typeof response.body.data.balance.annual).toBe('number');
      expect(typeof response.body.data.balance.sick).toBe('number');
      expect(typeof response.body.data.balance.casual).toBe('number');
    });
  });
});