'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Calendar, Clock, DollarSign, Download } from 'lucide-react';
import { attendanceAPI, leaveAPI, payrollAPI } from '../../../../lib/api';
import { useAuth } from '../../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EmployeeReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    attendance: [],
    leaves: [],
    payroll: []
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchReportData();
  }, [user]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, leavesRes, payrollRes] = await Promise.all([
        attendanceAPI.getByUser(user.id),
        leaveAPI.getByUser(user.id),
        payrollAPI.getByUser(user.id)
      ]);

      const attendanceData = attendanceRes.data.data;
      const leavesData = leavesRes.data.data;
      const payrollData = payrollRes.data.data;
      
      setReportData({
        attendance: Array.isArray(attendanceData) ? attendanceData : attendanceData.attendance || [],
        leaves: Array.isArray(leavesData) ? leavesData : leavesData.leaves || [],
        payroll: Array.isArray(payrollData) ? payrollData : payrollData.payrolls || []
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyAttendance = reportData.attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const presentDays = monthlyAttendance.filter(record => record.status === 'PRESENT').length;
    const totalDays = monthlyAttendance.length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { presentDays, totalDays, attendanceRate };
  };

  const calculateLeaveStats = () => {
    const currentYear = new Date().getFullYear();
    const yearlyLeaves = reportData.leaves.filter(leave => {
      return new Date(leave.startDate).getFullYear() === currentYear;
    });

    const approvedLeaves = yearlyLeaves.filter(leave => leave.status === 'APPROVED');
    const pendingLeaves = yearlyLeaves.filter(leave => leave.status === 'PENDING');
    
    return { 
      totalLeaves: yearlyLeaves.length, 
      approvedLeaves: approvedLeaves.length,
      pendingLeaves: pendingLeaves.length
    };
  };

  const generateReport = () => {
    const attendanceStats = calculateAttendanceStats();
    const leaveStats = calculateLeaveStats();
    
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Report - ${user.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .stats { display: flex; gap: 20px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Employee Report</h1>
          <h2>${user.name} - ${user.designation}</h2>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h3>Attendance Summary (Current Month)</h3>
          <div class="stats">
            <div class="stat-card">
              <h4>Present Days</h4>
              <p>${attendanceStats.presentDays}</p>
            </div>
            <div class="stat-card">
              <h4>Total Days</h4>
              <p>${attendanceStats.totalDays}</p>
            </div>
            <div class="stat-card">
              <h4>Attendance Rate</h4>
              <p>${attendanceStats.attendanceRate}%</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>Leave Summary (Current Year)</h3>
          <div class="stats">
            <div class="stat-card">
              <h4>Total Applications</h4>
              <p>${leaveStats.totalLeaves}</p>
            </div>
            <div class="stat-card">
              <h4>Approved</h4>
              <p>${leaveStats.approvedLeaves}</p>
            </div>
            <div class="stat-card">
              <h4>Pending</h4>
              <p>${leaveStats.pendingLeaves}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const attendanceStats = calculateAttendanceStats();
  const leaveStats = calculateLeaveStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">View your performance and activity reports</p>
        </div>
        <button
          onClick={generateReport}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{attendanceStats.attendanceRate}%</p>
              <p className="text-xs text-gray-500">Current Month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leave Applications</p>
              <p className="text-2xl font-bold text-gray-900">{leaveStats.totalLeaves}</p>
              <p className="text-xs text-gray-500">Current Year</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Payslips</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.payroll.length}</p>
              <p className="text-xs text-gray-500">Total Generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Report */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Attendance Summary</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Present Days</span>
                <span className="font-medium">{attendanceStats.presentDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Working Days</span>
                <span className="font-medium">{attendanceStats.totalDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Attendance Rate</span>
                <span className="font-medium text-green-600">{attendanceStats.attendanceRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Report */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Leave Summary</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Applications</span>
                <span className="font-medium">{leaveStats.totalLeaves}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="font-medium text-green-600">{leaveStats.approvedLeaves}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">{leaveStats.pendingLeaves}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}