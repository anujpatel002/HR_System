const prisma = require('../config/db');
const { success, error } = require('../utils/responseHandler');

// Get comprehensive analytics data
const getAnalytics = async (req, res) => {
  try {
    // Get total employees count
    const totalEmployees = await prisma.users.count();

    // Get department distribution
    const departmentStats = await prisma.users.groupBy({
      by: ['department'],
      _count: {
        department: true
      },
      where: {
        department: {
          not: null
        }
      }
    });

    const departmentDistribution = departmentStats.map(stat => ({
      name: stat.department,
      value: stat._count.department
    }));

    // Get monthly payroll data (last 6 months)
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

    let monthlyPayrollData = [];
    try {
      monthlyPayrollData = await prisma.payrolls.groupBy({
        by: ['month', 'year'],
        _sum: {
          netPay: true
        },
        _count: {
          userId: true
        },
        where: {
          createdAt: {
            gte: sixMonthsAgo
          }
        },
        orderBy: [
          { year: 'asc' },
          { month: 'asc' }
        ]
      });
    } catch (err) {
      console.log('No payroll data available');
    }

    const monthlyPayroll = monthlyPayrollData.map(data => ({
      month: data.month,
      year: data.year,
      amount: Math.round(data._sum.netPay || 0),
      employees: data._count.userId
    }));

    // Get attendance statistics (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(currentDate.getDate() - 28);

    let attendanceData = [];
    try {
      attendanceData = await prisma.attendance.findMany({
        where: {
          date: {
            gte: fourWeeksAgo
          }
        },
        select: {
          date: true,
          status: true
        }
      });
    } catch (err) {
      console.log('No attendance data available');
    }

    // Group by week
    const weeklyAttendance = {};
    attendanceData.forEach(record => {
      const weekNum = Math.floor((currentDate - new Date(record.date)) / (7 * 24 * 60 * 60 * 1000));
      const weekKey = `Week ${4 - weekNum}`;
      
      if (!weeklyAttendance[weekKey]) {
        weeklyAttendance[weekKey] = { present: 0, absent: 0, total: 0 };
      }
      
      weeklyAttendance[weekKey].total++;
      if (record.status === 'PRESENT' || record.status === 'LATE') {
        weeklyAttendance[weekKey].present++;
      } else {
        weeklyAttendance[weekKey].absent++;
      }
    });

    const attendanceTrend = Object.keys(weeklyAttendance).map(week => ({
      date: week,
      present: weeklyAttendance[week].total > 0 
        ? Math.round((weeklyAttendance[week].present / weeklyAttendance[week].total) * 100) 
        : 0,
      absent: weeklyAttendance[week].total > 0 
        ? Math.round((weeklyAttendance[week].absent / weeklyAttendance[week].total) * 100) 
        : 0
    }));

    // Get leave statistics
    let leaveStats = [];
    let pendingLeaves = 0;
    try {
      leaveStats = await prisma.leaves.groupBy({
        by: ['type'],
        _count: {
          type: true
        }
      });
      pendingLeaves = await prisma.leaves.count({
        where: {
          status: 'PENDING'
        }
      });
    } catch (err) {
      console.log('No leave data available');
    }

    const leaveDistribution = leaveStats.map(stat => ({
      type: stat.type,
      count: stat._count.type
    }));

    // Calculate average attendance percentage
    let totalAttendanceRecords = 0;
    let presentRecords = 0;
    try {
      totalAttendanceRecords = await prisma.attendance.count({
        where: {
          date: {
            gte: fourWeeksAgo
          }
        }
      });

      presentRecords = await prisma.attendance.count({
        where: {
          date: {
            gte: fourWeeksAgo
          },
          status: {
            in: ['PRESENT', 'LATE']
          }
        }
      });
    } catch (err) {
      console.log('No attendance records available');
    }

    const avgAttendance = totalAttendanceRecords > 0 
      ? Math.round((presentRecords / totalAttendanceRecords) * 100) 
      : 0;

    // Get latest month payroll total
    let latestMonthPayroll = 0;
    if (monthlyPayroll.length > 0) {
      latestMonthPayroll = monthlyPayroll[monthlyPayroll.length - 1].amount;
    }

    success(res, {
      keyMetrics: {
        totalEmployees,
        avgAttendance,
        pendingLeaves,
        monthlyPayroll: latestMonthPayroll
      },
      monthlyPayroll,
      departmentDistribution,
      attendanceTrend,
      leaveStats: leaveDistribution
    }, 'Analytics data retrieved successfully');

  } catch (err) {
    console.error('Error fetching analytics:', err);
    error(res, 'Failed to fetch analytics data', 500);
  }
};

module.exports = {
  getAnalytics
};
