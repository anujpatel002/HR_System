describe('Utility Functions Unit Tests', () => {
  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('responseHandler', () => {
    test('should format success response correctly', () => {
      const res = mockResponse();
      const mockSuccess = jest.fn();
      
      mockSuccess(res, { id: 1 }, 'Success', 201);
      
      expect(mockSuccess).toHaveBeenCalledWith(res, { id: 1 }, 'Success', 201);
    });

    test('should format error response correctly', () => {
      const res = mockResponse();
      const mockError = jest.fn();
      
      mockError(res, 'Error message', 400);
      
      expect(mockError).toHaveBeenCalledWith(res, 'Error message', 400);
    });
  });

  describe('activityLogger', () => {
    test('should log activity successfully', async () => {
      const mockLogActivity = jest.fn().mockResolvedValue({
        id: 'activity-id',
        userId: 'user-id',
        action: 'CREATE'
      });
      
      const result = await mockLogActivity('user-id', 'CREATE', 'USER');
      
      expect(mockLogActivity).toHaveBeenCalledWith('user-id', 'CREATE', 'USER');
      expect(result.id).toBe('activity-id');
    });
  });

  describe('asyncHandler', () => {
    test('should handle successful async function', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const mockAsyncHandler = jest.fn().mockImplementation((fn) => fn);
      
      const wrappedFn = mockAsyncHandler(mockFn);
      const result = await wrappedFn();
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalled();
    });
  });
});