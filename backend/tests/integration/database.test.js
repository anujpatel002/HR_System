const { prisma, cleanupTestData, createTestUser } = require('./setup');

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('User Operations', () => {
    test('should create user with all relationships', async () => {
      const user = await createTestUser({
        email: 'db-test@test.com',
        department: 'IT',
        basicSalary: 50000
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('db-test@test.com');
      expect(user.department).toBe('IT');
    });

    test('should enforce unique email constraint', async () => {
      await createTestUser({ email: 'unique-test@test.com' });

      await expect(
        createTestUser({ email: 'unique-test@test.com' })
      ).rejects.toThrow();
    });

    test('should cascade delete user relationships', async () => {
      const user = await createTestUser({ email: 'cascade-test@test.com' });

      // Create related records
      await prisma.attendance.create({
        data: {
          userId: user.id,
          date: new Date(),
          checkIn: new Date(),
          status: 'PRESENT'
        }
      });

      await prisma.leaves.create({
        data: {
          userId: user.id,
          type: 'CASUAL',
          startDate: new Date(),
          endDate: new Date(),
          reason: 'Test leave'
        }
      });

      // Delete user
      await prisma.users.delete({ where: { id: user.id } });

      // Verify related records are deleted
      const attendance = await prisma.attendance.findMany({ where: { userId: user.id } });
      const leaves = await prisma.leaves.findMany({ where: { userId: user.id } });

      expect(attendance).toHaveLength(0);
      expect(leaves).toHaveLength(0);
    });
  });

  describe('Attendance Operations', () => {
    test('should enforce unique attendance per day', async () => {
      const user = await createTestUser({ email: 'attendance-unique@test.com' });
      const today = new Date();

      await prisma.attendance.create({
        data: {
          userId: user.id,
          date: today,
          checkIn: new Date(),
          status: 'PRESENT'
        }
      });

      await expect(
        prisma.attendance.create({
          data: {
            userId: user.id,
            date: today,
            checkIn: new Date(),
            status: 'PRESENT'
          }
        })
      ).rejects.toThrow();
    });

    test('should calculate total hours correctly', async () => {
      const user = await createTestUser({ email: 'hours-test@test.com' });
      const checkIn = new Date();
      const checkOut = new Date(checkIn.getTime() + 8 * 60 * 60 * 1000); // 8 hours later

      const attendance = await prisma.attendance.create({
        data: {
          userId: user.id,
          date: new Date(),
          checkIn,
          checkOut,
          totalHours: (checkOut - checkIn) / (1000 * 60 * 60),
          status: 'PRESENT'
        }
      });

      expect(attendance.totalHours).toBe(8);
    });
  });

  describe('Leave Operations', () => {
    test('should create leave with proper validation', async () => {
      const user = await createTestUser({ email: 'leave-validation@test.com' });
      const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

      const leave = await prisma.leaves.create({
        data: {
          userId: user.id,
          type: 'ANNUAL',
          startDate,
          endDate,
          reason: 'Vacation',
          status: 'PENDING'
        }
      });

      expect(leave.type).toBe('ANNUAL');
      expect(leave.status).toBe('PENDING');
      expect(leave.startDate).toEqual(startDate);
    });

    test('should query leaves by status', async () => {
      const user = await createTestUser({ email: 'leave-status@test.com' });

      await prisma.leaves.createMany({
        data: [
          {
            userId: user.id,
            type: 'SICK',
            startDate: new Date(),
            endDate: new Date(),
            reason: 'Sick',
            status: 'APPROVED'
          },
          {
            userId: user.id,
            type: 'CASUAL',
            startDate: new Date(),
            endDate: new Date(),
            reason: 'Personal',
            status: 'PENDING'
          }
        ]
      });

      const approvedLeaves = await prisma.leaves.findMany({
        where: { userId: user.id, status: 'APPROVED' }
      });

      const pendingLeaves = await prisma.leaves.findMany({
        where: { userId: user.id, status: 'PENDING' }
      });

      expect(approvedLeaves).toHaveLength(1);
      expect(pendingLeaves).toHaveLength(1);
    });
  });

  describe('Payroll Operations', () => {
    test('should enforce unique payroll per month/year', async () => {
      const user = await createTestUser({ email: 'payroll-unique@test.com' });
      const currentYear = new Date().getFullYear();
      const currentMonth = 'January';

      await prisma.payrolls.create({
        data: {
          userId: user.id,
          month: currentMonth,
          year: currentYear,
          basicSalary: 50000,
          gross: 50000,
          pf: 2000,
          tax: 5000,
          deductions: 7000,
          netPay: 43000
        }
      });

      await expect(
        prisma.payrolls.create({
          data: {
            userId: user.id,
            month: currentMonth,
            year: currentYear,
            basicSalary: 50000,
            gross: 50000,
            pf: 2000,
            tax: 5000,
            deductions: 7000,
            netPay: 43000
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Activity Logs', () => {
    test('should create activity logs with JSON details', async () => {
      const user = await createTestUser({ email: 'activity-test@test.com' });

      const activity = await prisma.activity_logs.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          targetType: 'USER',
          targetId: user.id,
          details: {
            oldValue: null,
            newValue: { name: user.name, email: user.email },
            timestamp: new Date().toISOString()
          }
        }
      });

      expect(activity.action).toBe('CREATE');
      expect(activity.details.newValue.email).toBe(user.email);
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk operations efficiently', async () => {
      const users = [];
      for (let i = 0; i < 10; i++) {
        users.push({
          id: `test-bulk-${Date.now()}-${i}`,
          email: `bulk-${i}@test.com`,
          name: `Bulk User ${i}`,
          password: 'hashedpassword',
          role: 'EMPLOYEE'
        });
      }

      const startTime = Date.now();
      await prisma.users.createMany({ data: users });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second

      // Cleanup
      await prisma.users.deleteMany({
        where: { email: { contains: 'bulk-' } }
      });
    });

    test('should query with indexes efficiently', async () => {
      const user = await createTestUser({ email: 'index-test@test.com' });

      // Create multiple attendance records
      const attendanceData = [];
      for (let i = 0; i < 30; i++) {
        attendanceData.push({
          userId: user.id,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          checkIn: new Date(),
          status: 'PRESENT'
        });
      }

      await prisma.attendance.createMany({ data: attendanceData });

      const startTime = Date.now();
      const results = await prisma.attendance.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 10
      });
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast with indexes
    });
  });
});