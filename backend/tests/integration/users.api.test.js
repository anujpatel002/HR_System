const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { prisma, cleanupTestData, createTestUser } = require('./setup');

describe('User Management API Integration Tests', () => {
  let adminUser, hrUser, employeeUser, adminToken, hrToken, employeeToken;

  beforeAll(async () => {
    await cleanupTestData();
    
    adminUser = await createTestUser({
      email: 'admin@test.com',
      role: 'ADMIN'
    });
    
    hrUser = await createTestUser({
      email: 'hr@test.com',
      role: 'HR_OFFICER'
    });
    
    employeeUser = await createTestUser({
      email: 'employee@test.com',
      role: 'EMPLOYEE'
    });

    adminToken = jwt.sign({ userId: adminUser.id }, process.env.JWT_SECRET);
    hrToken = jwt.sign({ userId: hrUser.id }, process.env.JWT_SECRET);
    employeeToken = jwt.sign({ userId: employeeUser.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('GET /api/users', () => {
    test('should allow admin to get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', `token=${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    test('should allow HR officer to get users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', `token=${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.users).toBeDefined();
    });

    test('should deny employee access to user list', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Cookie', `token=${employeeToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/auth/register', () => {
    test('should allow admin to create new user', async () => {
      const newUserData = {
        name: 'New Test User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'EMPLOYEE',
        department: 'IT'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', `token=${adminToken}`)
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@test.com');
    });

    test('should prevent duplicate email registration', async () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: 'admin@test.com', // Already exists
        password: 'password123',
        role: 'EMPLOYEE'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', `token=${adminToken}`)
        .send(duplicateUser);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate required fields', async () => {
      const invalidUser = {
        name: 'Test User'
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', `token=${adminToken}`)
        .send(invalidUser);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should allow user to update own profile', async () => {
      const updateData = {
        name: 'Updated Name',
        mobile: '1234567890'
      };

      const response = await request(app)
        .put(`/api/users/${employeeUser.id}`)
        .set('Cookie', `token=${employeeToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
    });

    test('should allow admin to update any user', async () => {
      const updateData = {
        role: 'HR_OFFICER',
        department: 'HR'
      };

      const response = await request(app)
        .put(`/api/users/${employeeUser.id}`)
        .set('Cookie', `token=${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
    });

    test('should prevent unauthorized user updates', async () => {
      const updateData = { name: 'Unauthorized Update' };

      const response = await request(app)
        .put(`/api/users/${adminUser.id}`)
        .set('Cookie', `token=${employeeToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${employeeUser.id}`)
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(employeeUser.id);
    });

    test('should handle non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Cookie', `token=${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});