const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { prisma, cleanupTestData, createTestUser } = require('./setup');

describe('Authentication API Integration Tests', () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const user = await createTestUser({
        email: 'login-test@test.com',
        role: 'EMPLOYEE'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@test.com',
          password: 'test123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login-test@test.com');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should get profile with valid token', async () => {
      const user = await createTestUser({
        email: 'profile-test@test.com'
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('profile-test@test.com');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout successfully', async () => {
      const user = await createTestUser();
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `token=${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});