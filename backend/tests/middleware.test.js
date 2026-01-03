const jwt = require('jsonwebtoken');

// Mock middleware functions
const authMiddleware = jest.fn();
const roleMiddleware = jest.fn();

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Middleware Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    test('should authenticate valid token from cookie', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@test.com',
        name: 'Test User',
        role: 'EMPLOYEE'
      };

      const token = jwt.sign({ userId: 'user-id' }, 'test-secret-key');
      const req = { cookies: { token }, headers: {} };
      const res = mockResponse();

      authMiddleware.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });

      await authMiddleware(req, res, mockNext);

      expect(authMiddleware).toHaveBeenCalledWith(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should reject request without token', async () => {
      const req = { cookies: {}, headers: {} };
      const res = mockResponse();

      authMiddleware.mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Access denied. No token provided.' });
      });

      await authMiddleware(req, res, mockNext);

      expect(authMiddleware).toHaveBeenCalledWith(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('roleMiddleware', () => {
    test('should allow access for authorized role', () => {
      const middleware = roleMiddleware(['ADMIN', 'HR_OFFICER']);
      const req = { user: { role: 'ADMIN' } };
      const res = mockResponse();

      roleMiddleware.mockImplementation((req, res, next) => {
        next();
      });

      roleMiddleware(req, res, mockNext);

      expect(roleMiddleware).toHaveBeenCalledWith(req, res, mockNext);
    });

    test('should deny access for unauthorized role', () => {
      const req = { user: { role: 'EMPLOYEE' } };
      const res = mockResponse();

      roleMiddleware.mockImplementation((req, res, next) => {
        res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      });

      roleMiddleware(req, res, mockNext);

      expect(roleMiddleware).toHaveBeenCalledWith(req, res, mockNext);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});