const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { prisma, cleanupTestData, createTestUser } = require('./setup');

describe('Attendance API Integration Tests', () => {
  let testUser, adminUser, userToken, adminToken;

  beforeAll(async () => {
    await cleanupTestData();
    
    testUser = await createTestUser({
      email: 'attendance-user@test.com',
      role: 'EMPLOYEE'
    });
    
    adminUser = await createTestUser({
      email: 'attendance-admin@test.com',
      role: 'ADMIN'
    });

    userToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ userId: adminUser.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('POST /api/attendance/mark', () => {
    test('should mark check-in successfully', async () => {
      const response = await request(app)
        .post('/api/attendance/mark')
        .set('Cookie', `token=${userToken}`)
        .send({ type: 'CHECK_IN' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.checkIn).toBeDefined();
    });

    test('should mark check-out successfully', async () => {
      // First check-in
      await request(app)
        .post('/api/attendance/mark')
        .set('Cookie', `token=${userToken}`)
        .send({ type: 'CHECK_IN' });

      // Then check-out
      const response = await request(app)
        .post('/api/attendance/mark')
        .set('Cookie', `token=${userToken}`)
        .send({ type: 'CHECK_OUT' });

      expect(response.status).toBe(200);
      expect(response.body.data.checkOut).toBeDefined();
      expect(response.body.data.totalHours).toBeGreaterThan(0);
    });

    test('should prevent duplicate check-in', async () => {
      // First check-in
      await request(app)
        .post('/api/attendance/mark')
        .set('Cookie', `token=${userToken}`)
        .send({ type: 'CHECK_IN' });

      // Duplicate check-in
      const response = await request(app)
        .post('/api/attendance/mark')
        .set('Cookie', `token=${userToken}`)
        .send({ type: 'CHECK_IN' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/attendance/today', () => {
    test('should get today attendance', async () => {
      // Mark attendance first
      await request(app)
        .post('/api/attendance/mark')
        .set('Cookie', `token=${userToken}`)
        .send({ type: 'CHECK_IN' });

      const response = await request(app)
        .get('/api/attendance/today')
        .set('Cookie', `token=${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.checkIn).toBeDefined();
    });

    test('should return null when no attendance', async () => {
      const newUser = await createTestUser({
        email: 'no-attendance@test.com'
      });
      const newToken = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/api/attendance/today')
        .set('Cookie', `token=${newToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('GET /api/attendance/:userId', () => {
    test('should get user attendance history', async () => {
      const response = await request(app)
        .get(`/api/attendance/${testUser.id}`)
        .set('Cookie', `token=${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.attendance)).toBe(true);
    });

    test('should filter by date range', async () => {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/attendance/${testUser.id}`)
        .set('Cookie', `token=${adminToken}`)
        .query({ startDate, endDate });

      expect(response.status).toBe(200);
      expect(response.body.data.attendance).toBeDefined();
    });
  });
});