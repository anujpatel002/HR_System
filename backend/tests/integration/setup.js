const { PrismaClient } = require('@prisma/client');

// Test database setup - use existing hr_system database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://root@127.0.0.1:3306/hr_system'
    }
  }
});

// Test data cleanup
const cleanupTestData = async () => {
  try {
    await prisma.attendance.deleteMany({ where: { userId: { contains: 'test-' } } });
    await prisma.leaves.deleteMany({ where: { userId: { contains: 'test-' } } });
    await prisma.payrolls.deleteMany({ where: { userId: { contains: 'test-' } } });
    await prisma.user_sessions.deleteMany({ where: { userId: { contains: 'test-' } } });
    await prisma.activity_logs.deleteMany({ where: { userId: { contains: 'test-' } } });
    await prisma.users.deleteMany({ where: { id: { contains: 'test-' } } });
  } catch (error) {
    // Ignore cleanup errors
  }
};

// Test user factory
const createTestUser = async (overrides = {}) => {
  const bcrypt = require('bcrypt');
  const defaultUser = {
    id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Date.now()}@test.com`,
    name: 'Test User',
    password: await bcrypt.hash('test123', 12),
    role: 'EMPLOYEE',
    ...overrides
  };
  
  return await prisma.users.create({ data: defaultUser });
};

module.exports = {
  prisma,
  cleanupTestData,
  createTestUser
};