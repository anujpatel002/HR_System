const { PrismaClient } = require('@prisma/client');

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    users: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    attendance: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    leaves: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    payrolls: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    user_sessions: {
      updateMany: jest.fn(),
      create: jest.fn()
    },
    activity_logs: {
      create: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';

// Global test timeout
jest.setTimeout(10000);